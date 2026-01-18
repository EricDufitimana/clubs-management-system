import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('[BULK_IMPORT] Starting bulk import process');
  
  try {
    // 1. Authenticate user
    console.log('[BULK_IMPORT] Step 1: Authenticating user');
    const supabase = await createClient();
    console.log('[BULK_IMPORT] Supabase client created successfully');
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('[BULK_IMPORT] Auth result:', { authUser: !!authUser, authError: authError?.message });

    if (authError || !authUser) {
      console.log('[BULK_IMPORT] Authentication failed:', authError?.message || 'No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify admin role
    console.log('[BULK_IMPORT] Step 2: Verifying admin role');
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: authUser.id },
      select: { role: true },
    });
    console.log('[BULK_IMPORT] Database user found:', !!dbUser, 'Role:', dbUser?.role);

    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'super_admin')) {
      console.log('[BULK_IMPORT] Admin verification failed - insufficient permissions');
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Parse form data
    console.log('[BULK_IMPORT] Step 3: Parsing form data');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clubId = formData.get('clubId') as string;
    console.log('[BULK_IMPORT] Form data parsed:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type, 
      clubId 
    });

    if (!file) {
      console.log('[BULK_IMPORT] No file provided in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!clubId) {
      console.log('[BULK_IMPORT] No club ID provided in form data');
      return NextResponse.json({ error: 'No club ID provided' }, { status: 400 });
    }

    // 4. Validate file type and size
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload Excel, CSV, PDF, or Word documents.' 
      }, { status: 400 });
    }

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // 5. Verify user has access to this club
    if (dbUser.role === 'admin') {
      // Get the user's database record to get the correct user ID
      const userRecord = await prisma.user.findUnique({
        where: { auth_user_id: authUser.id },
        select: { id: true },
      });

      if (!userRecord) {
        return NextResponse.json({ 
          error: 'User record not found' 
        }, { status: 404 });
      }

      const clubLeader = await prisma.clubLeader.findFirst({
        where: {
          user_id: userRecord.id, // Use the database user ID, not auth ID
          club_id: BigInt(clubId),
        },
      });

      if (!clubLeader) {
        return NextResponse.json({ 
          error: 'You do not have permission to add members to this club' 
        }, { status: 403 });
      }
    }

    // 6. Upload file to Supabase storage
    console.log('[BULK_IMPORT] Step 6: Uploading file to Supabase storage');
    console.log('[BULK_IMPORT] Environment check:', {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
    });
    
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('[BULK_IMPORT] Supabase service client created successfully');

    const fileName = `bulk-import-${Date.now()}-${file.name}`;
    console.log('[BULK_IMPORT] Uploading file with name:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('members')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });
    
    console.log('[BULK_IMPORT] Upload result:', { 
      uploadData: !!uploadData, 
      uploadError: uploadError?.message,
      filePath: uploadData?.path 
    });

    if (uploadError) {
      console.error('[BULK_IMPORT] Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

    // 7. Call edge function to extract names
    console.log('[BULK_IMPORT] Step 7: Calling edge function to extract names');
    console.log('[BULK_IMPORT] Edge function payload:', {
      filePath: uploadData.path,
      fileType: file.type
    });
    
    const { data: extractData, error: extractError } = await supabaseService.functions.invoke(
      'extract-names',
      {
        body: {
          filePath: uploadData.path,
          fileType: file.type,
        },
      }
    );
    
    console.log('[BULK_IMPORT] Edge function result:', {
      extractData: !!extractData,
      extractError: extractError?.message,
      namesCount: extractData?.names?.length || 0
    });

    if (extractError) {
      console.error('[BULK_IMPORT] Edge function error:', extractError);
      return NextResponse.json({ 
        error: 'Failed to process file with AI' 
      }, { status: 500 });
    }

    const extractedNames = extractData?.names || [];
    console.log(`[BULK_IMPORT] Extracted ${extractedNames.length} names`);
    console.log('[BULK_IMPORT] Sample extracted names:', extractedNames.slice(0, 3));

    if (extractedNames.length === 0) {
      console.log('[BULK_IMPORT] No names extracted from file');
      return NextResponse.json({ 
        error: 'No names found in the file. Please check the file format and content.' 
      }, { status: 400 });
    }

    // 8. Get all students for matching
    console.log('[BULK_IMPORT] Step 8: Fetching all students for matching');
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        student_id: true,
        grade: true,
        combination: true,
        gender: true,
      },
    });
    console.log(`[BULK_IMPORT] Retrieved ${allStudents.length} students from database`);

    // Helper function to normalize names
    const normalizeName = (name: string): string => {
      return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z\s]/g, '') // Remove non-alphabetic characters except spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    };

    // Helper function to capitalize name properly
    const capitalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // 9. Match extracted names with student records
    console.log('[BULK_IMPORT] Step 9: Matching extracted names with student records');
    const matchedStudents = [];
    const unmatchedNames = [];
    console.log(`[BULK_IMPORT] Starting matching process for ${extractedNames.length} names`);

    for (const extractedName of extractedNames) {
      const cleanName = normalizeName(extractedName);
      const nameParts = cleanName.split(' ').filter((part: string) => part.length > 0);
      console.log(`[BULK_IMPORT] Processing name: "${extractedName}" -> "${cleanName}" (${nameParts.length} parts)`);
      
      if (nameParts.length < 2) {
        unmatchedNames.push(extractedName);
        continue;
      }

      const possibleFirstNames = [nameParts[0]];
      const possibleLastNames = [nameParts[nameParts.length - 1]];
      
      // Handle reversed names (try all combinations for 2-part names)
      if (nameParts.length === 2) {
        possibleFirstNames.push(nameParts[1]);
        possibleLastNames.push(nameParts[0]);
      } else if (nameParts.length > 2) {
        // For names with more than 2 parts, try middle names as first name
        for (let i = 1; i < nameParts.length - 1; i++) {
          possibleFirstNames.push(nameParts[i]);
        }
      }

      let bestMatch = null;
      let bestScore = 0;

      for (const student of allStudents) {
        // Skip Senior 6 students
        if (student.grade === 'Senior6') {
          continue;
        }

        // Normalize student names for comparison
        const studentFirstName = normalizeName(student.first_name);
        const studentLastName = normalizeName(student.last_name);
        const studentFullName = normalizeName(`${student.first_name} ${student.last_name}`);
        
        let score = 0;
        
        // Check first name matches with normalized comparison
        for (const firstName of possibleFirstNames) {
          if (studentFirstName === firstName) {
            score += 50;
            break;
          }
          if (studentFirstName.includes(firstName) || firstName.includes(studentFirstName)) {
            score += 25;
          }
        }

        // Check last name matches with normalized comparison
        for (const lastName of possibleLastNames) {
          if (studentLastName === lastName) {
            score += 50;
            break;
          }
          if (studentLastName.includes(lastName) || lastName.includes(studentLastName)) {
            score += 25;
          }
        }

        // Bonus for exact full name match
        if (studentFullName === cleanName) {
          score = 100;
        }

        if (score > bestScore && score >= 50) {
          bestScore = score;
          bestMatch = student;
        }
      }

      if (bestMatch) {
        matchedStudents.push({
          student: bestMatch,
          extractedName: capitalizeName(extractedName), // Return properly capitalized name
          matchScore: bestScore,
        });
        console.log(`[BULK_IMPORT] ✓ Matched: "${extractedName}" -> ${bestMatch.first_name} ${bestMatch.last_name} (score: ${bestScore})`);
      } else {
        unmatchedNames.push(capitalizeName(extractedName)); // Return properly capitalized name
        console.log(`[BULK_IMPORT] ✗ Unmatched: "${extractedName}"`);
      }
    }
    
    console.log(`[BULK_IMPORT] Matching complete: ${matchedStudents.length} matched, ${unmatchedNames.length} unmatched`);

    // 10. Check for existing memberships
    console.log('[BULK_IMPORT] Step 10: Checking for existing memberships');
    const existingMembers = await prisma.clubMember.findMany({
      where: {
        club_id: BigInt(clubId),
        student_id: { in: matchedStudents.map(m => m.student.id) },
        membership_status: 'active',
      },
      select: { student_id: true },
    });
    console.log(`[BULK_IMPORT] Found ${existingMembers.length} existing members`);

    const existingStudentIds = new Set(existingMembers.map(m => m.student_id?.toString() || ''));
    
    const availableStudents = matchedStudents.filter(m => !existingStudentIds.has(m.student.id.toString()));
    const conflictStudents = matchedStudents.filter(m => existingStudentIds.has(m.student.id.toString()));
    
    console.log(`[BULK_IMPORT] Available to add: ${availableStudents.length}, Already members: ${conflictStudents.length}`);

    // 11. Add available students to the club
    console.log('[BULK_IMPORT] Step 11: Adding available students to club');
    let successfullyAdded: typeof availableStudents = [];
    let categoryConflicts: typeof availableStudents = [];
    
    if (availableStudents.length > 0) {
      console.log(`[BULK_IMPORT] Adding ${availableStudents.length} students to club ${clubId}`);
      
      try {
        // Try to add all students at once
        const result = await prisma.clubMember.createMany({
          data: availableStudents.map(m => ({
            club_id: BigInt(clubId),
            student_id: m.student.id,
            membership_status: 'active',
            joined_at: new Date(),
          })),
          skipDuplicates: true,
        });
        successfullyAdded = availableStudents;
        console.log('[BULK_IMPORT] Successfully added all students to club');
      } catch (error: any) {
        console.log('[BULK_IMPORT] Batch insert failed, trying individual inserts');
        
        // If batch insert fails, try individual inserts to identify specific conflicts
        for (const studentData of availableStudents) {
          try {
            await prisma.clubMember.create({
              data: {
                club_id: BigInt(clubId),
                student_id: studentData.student.id,
                membership_status: 'active',
                joined_at: new Date(),
              },
            });
            successfullyAdded.push(studentData);
          } catch (individualError: any) {
            // Check if this is a category constraint error
            if (individualError.message?.includes('already has a membership in category')) {
              categoryConflicts.push(studentData);
              console.log(`[BULK_IMPORT] Category conflict for student ${studentData.student.id}: ${individualError.message}`);
            } else {
              console.error(`[BULK_IMPORT] Failed to add student ${studentData.student.id}:`, individualError);
            }
          }
        }
      }
    } else {
      console.log('[BULK_IMPORT] No new students to add');
    }

    // 12. Clean up uploaded file
    console.log('[BULK_IMPORT] Step 12: Cleaning up uploaded file');
    await supabaseService.storage.from('members').remove([fileName]);
    console.log('[BULK_IMPORT] File cleanup completed');

    // 13. Return detailed results
    console.log('[BULK_IMPORT] Step 13: Returning success response');
    return NextResponse.json({
      success: true,
      summary: {
        totalExtracted: extractedNames.length,
        totalMatched: matchedStudents.length,
        availableToAdd: availableStudents.length,
        successfullyAdded: successfullyAdded.length,
        alreadyMembers: conflictStudents.length,
        categoryConflicts: categoryConflicts.length,
        unmatched: unmatchedNames.length,
      },
      results: {
        added: successfullyAdded.map(m => ({
          studentId: m.student.id.toString(),
          name: `${m.student.first_name} ${m.student.last_name}`,
          extractedName: m.extractedName,
          matchScore: m.matchScore,
        })),
        conflicts: conflictStudents.map(m => ({
          studentId: m.student.id.toString(),
          name: `${m.student.first_name} ${m.student.last_name}`,
          extractedName: m.extractedName,
          matchScore: m.matchScore,
        })),
        categoryConflicts: categoryConflicts.map(m => ({
          studentId: m.student.id.toString(),
          name: `${m.student.first_name} ${m.student.last_name}`,
          extractedName: m.extractedName,
          matchScore: m.matchScore,
        })),
        unmatched: unmatchedNames,
      },
    });

  } catch (error: any) {
    console.error('[BULK_IMPORT] Unexpected error:', error);
    console.error('[BULK_IMPORT] Error stack:', error.stack);
    console.error('[BULK_IMPORT] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return NextResponse.json({ 
      error: 'Internal server error during bulk import',
      details: error.message 
    }, { status: 500 });
  }
}
