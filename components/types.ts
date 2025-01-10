export type GraphType = 'percentage' | 'present' | 'absent';

export interface AttendanceRecord {
  actualStatus: 'present' | 'absent';
  attendancePercentage: number;
  checkInTime: string;
  checkOutTime: string;
  durationMinutes: number;
  status: 'present' | 'absent';
}

export interface SessionAttendance {
  [studentId: string]: AttendanceRecord;
}

export interface EventAttendance {
  [sessionId: string]: SessionAttendance;
}

export interface AttendanceData {
  [eventId: string]: EventAttendance;
}

export interface ProcessedData {
  percentage: number[];
  present: number[];
  absent: number[];
  eventCounts: number[];
}

