"use server";

import { prisma } from "src/lib/prisma";
import { AttendanceStatus } from "@prisma/client";



export default async function (
    sessionId: string, 
    selectedStudents: Array<{student_id: string; attendance_status: string}>

) {
    console.log('[ADD_ATTENDANCE] Starting attendance creation...');
    console.log('[ADD_ATTENDANCE] Session ID:', sessionId);
    console.log('[ADD_ATTENDANCE] Selected students count:', selectedStudents.length);
    console.log('[ADD_ATTENDANCE] Selected students data:', JSON.stringify(selectedStudents, null, 2));
    
    try{
        const attendanceData = selectedStudents.map((student) => {
            return{
                session_id: parseInt(sessionId),
                student_id: parseInt(student.student_id),
                attendance_status: student.attendance_status as AttendanceStatus,
            }
        });

        console.log('[ADD_ATTENDANCE] Prepared attendance data:', JSON.stringify(attendanceData, null, 2));
        console.log('[ADD_ATTENDANCE] Attempting to create attendance records...');
        
        const result = await prisma.attendance.createMany({
            data: attendanceData
        });

        console.log('[ADD_ATTENDANCE] Success! Created', result.count, 'attendance record(s)');
        console.log('[ADD_ATTENDANCE] Result:', result);

        return {success: true, message: 'Attendance added successfully'};
    } catch (error) {
        console.error('[ADD_ATTENDANCE] Error:', error);
        console.error('[ADD_ATTENDANCE] Error details:', JSON.stringify(error, null, 2));
        return {error: 'Failed to add attendance'};
    }
}