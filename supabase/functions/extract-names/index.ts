import "jsr:@supabase/functions-js/edge-runtime.d.ts"
//@ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//@ts-ignore
import { Groq } from 'https://esm.sh/groq-sdk@0.3.0'
//@ts-ignore
import * as XLSX from 'npm:xlsx'
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Initialize Groq client
const groq = new Groq({
  apiKey: Deno.env.get('GROQ_API_KEY') ?? '',
})


// Rate limiting
class RateLimiter {
  private requests: number[] = []
  private maxRequests = 50
  private windowMs = 60000 // 1 minute

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - Math.min(...this.requests))
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter()

// Excel file processing
function extractTextFromExcel(fileBytes: Uint8Array): string {
  const workbook = XLSX.read(fileBytes, { type: 'array' })
  
  let allText = ''
  workbook.SheetNames.forEach((sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    allText += `\n=== Sheet: ${sheetName} ===\n${csv}\n` 
  })
  
  return allText
}

// Direct name extraction from Excel
function extractNamesFromExcel(fileBytes: Uint8Array) {
  const workbook = XLSX.read(fileBytes, { type: 'array' })
  const names = new Set<string>()
  
  workbook.SheetNames.forEach((sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    const headers = jsonData[0] as string[]
    const firstNameIndex = headers?.findIndex(h => 
      h?.toLowerCase().includes('firstname') || h?.toLowerCase().includes('first') || h?.toLowerCase().includes('name')
    );
    const lastNameIndex = headers?.findIndex(h => 
      h?.toLowerCase().includes('lastname') || h?.toLowerCase().includes('last') || h?.toLowerCase().includes('surname')
    );
    
    // Extract names from structured columns
    if (firstNameIndex !== -1 && lastNameIndex !== -1) {
      jsonData.slice(1).forEach((row: any) => {
        if (Array.isArray(row) && row[firstNameIndex] && row[lastNameIndex]) {
          const firstName = String(row[firstNameIndex]).trim()
          const lastName = String(row[lastNameIndex]).trim()
          const fullName = `${firstName} ${lastName}`.trim()
          
          // Basic validation
          if (firstName && lastName && fullName.length < 50 && !/\d/.test(fullName)) {
            names.add(fullName)
          }
        }
      })
    }
    
    // Also scan for name patterns in the data
    jsonData.forEach((row: any) => {
      if (Array.isArray(row)) {
        row.forEach((cell: any) => {
          if (typeof cell === 'string') {
            // Look for patterns like "John Doe" or "Doe, John"
            const nameMatches = cell.match(/\b([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+,\s*[A-Z][a-z]+)\b/g)
            if (nameMatches) {
              nameMatches.forEach((match: string) => {
                const cleanName = match.replace(',', '').trim()
                if (cleanName.length < 50 && !/\d/.test(cleanName)) {
                  names.add(cleanName)
                }
              })
            }
          }
        })
      }
    })
  })
  
  return {
    success: true,
    names: Array.from(names),
    confidence: 0.9,
    reasoning: 'Direct extraction from Excel with pattern matching'
  }
}

// AI-powered name extraction
async function extractNamesWithAI(text: string) {
  await rateLimiter.waitIfNeeded()
  
  // Limit text size for AI processing
  const textToAnalyze = text.length > 120000 ? text.substring(0, 120000) : text
  
  const prompt = `CRITICAL MISSION: EXTRACT STUDENT NAMES WITH 100% ACCURACY
  
  ## 🎯 EXTRACTION RULES:
  
  ### EXACT NAMES TO EXTRACT:
  🔴 **MUST PRESERVE**: Full names like "John Doe", "Jane Smith", "Robert Johnson"
  🔴 **MUST PRESERVE**: Names with middle initials like "John A. Doe"
  🔴 **MUST PRESERVE**: Reversed names like "Doe, John" → "John Doe"
  
  ## 🚨 COMPLETE EXCLUSION LIST - REJECT THESE:
  ### TITLES: Mr, Mrs, Ms, Dr, Prof, Sir, Madam
  ### ORGANIZATIONS: School, University, College, Department
  ### SUBJECTS: Mathematics, Computer Science, Economics, etc.
  ### GRADES/LEVELS: Grade 1, S1, S2, S3, S4, S5, S6, Primary, Secondary
  ### LOCATIONS: Room 101, Building A, etc.
  ### DATES: January, Monday, 2024, etc.
  ### GENERIC TERMS: Student, Member, Participant, etc.
  
  ## ✅ ACCEPTABLE PATTERNS:
  - First Name + Last Name: "John Doe"
  - First Name + Middle + Last: "John Michael Doe"
  - Reversed: "Doe, John" → "John Doe"
  - With initials: "J. Doe" or "John D."
  
  Text to analyze: ${textToAnalyze}
  
  Return ONLY valid JSON:
  {
    "names": ["John Doe", "Jane Smith", "Robert Johnson"],
    "totalExtracted": 25,
    "confidence": 0.95,
    "reasoning": "Extracted student names following all rules"
  }`
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You extract person names from text. Return only valid JSON. Follow all extraction rules precisely." },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 2000,
    })
    
    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0])
    
    return {
      success: true,
      names: parsedResponse.names.filter((name: string) => 
        name && 
        typeof name === 'string' && 
        name.trim().length > 2 && 
        name.trim().length < 50 &&
        !/\d/.test(name.trim()) &&
        !/^(Mr|Mrs|Ms|Dr|Prof|Sir|Madam)/i.test(name.trim())
      ),
      confidence: parsedResponse.confidence || 0.8,
      reasoning: parsedResponse.reasoning || 'AI extraction'
    }
  } catch (error) {
    console.error('AI extraction error:', error)
    return {
      success: false,
      names: [],
      confidence: 0,
      reasoning: 'AI extraction failed'
    }
  }
}

// Main edge function handler
//@ts-ignore
Deno.serve(async (req) => {
  try {
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Parse request
    const body = await req.json()
    const { filePath, fileType } = body

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'filePath is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Download file from Supabase storage
    const { data, error } = await supabase.storage
      .from('members')
      .download(filePath)

    if (error || !data) {
      console.error('Download error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to download file from storage' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const fileBytes = new Uint8Array(await data.arrayBuffer())

    // Extract names based on file type
    let result
    if (fileType?.includes('excel') || fileType?.includes('xlsx') || fileType?.includes('sheet')) {
      // Try direct extraction first
      result = extractNamesFromExcel(fileBytes)
      
      // Fallback to AI if direct extraction didn't work well
      if (!result.success || result.names.length < 5) {
        console.log('Direct extraction found few names, trying AI fallback')
        const text = extractTextFromExcel(fileBytes)
        const aiResult = await extractNamesWithAI(text)
        if (aiResult.success && aiResult.names.length > result.names.length) {
          result = aiResult
        }
      }
    } else {
      // For other files, use AI
      const text = new TextDecoder().decode(fileBytes)
      result = await extractNamesWithAI(text)
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: result.success,
        names: result.names,
        confidence: result.confidence,
        reasoning: result.reasoning,
        totalNames: result.names.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error in edge function',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
