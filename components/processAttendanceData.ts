import { AttendanceData, ProcessedData } from './types';

export function processAttendanceData(data: AttendanceData): ProcessedData {
  console.log("Starting processAttendanceData function");

  const processedData: ProcessedData = {
    percentage: Array(7).fill(0),
    present: Array(7).fill(0),
    absent: Array(7).fill(0),
    eventCounts: Array(7).fill(0),
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  console.log("Initialized processedData and daysOfWeek");

  Object.entries(data).forEach(([eventId, eventData]) => {
    console.log(`Processing event ID: ${eventId}`);

    const firstSessionId = Object.keys(eventData)[0];
    const firstStudentId = Object.keys(eventData[firstSessionId])[0];
    const checkInTime = eventData[firstSessionId][firstStudentId].checkInTime;
    const eventDate = new Date(checkInTime);
    const dayOfWeek = eventDate.getDay();

    console.log(`Event date: ${eventDate}, Day of week: ${daysOfWeek[dayOfWeek]}`);

    let totalPercentage = 0;
    let presentCount = 0;
    let absentCount = 0;
    let totalStudents = 0;

    Object.values(eventData).forEach((sessionData) => {
      Object.values(sessionData).forEach((studentData) => {
        totalPercentage += studentData.attendancePercentage;
        if (studentData.actualStatus === 'present') {
          presentCount++;
        } else {
          absentCount++;
        }
        totalStudents++;
      });
    });

    const averagePercentage = totalStudents > 0 ? totalPercentage / totalStudents : 0;

    console.log(`Day: ${daysOfWeek[dayOfWeek]}, Total Percentage: ${totalPercentage}, Present: ${presentCount}, Absent: ${absentCount}, Students: ${totalStudents}, Average Percentage: ${averagePercentage}`);

    processedData.percentage[dayOfWeek] += averagePercentage;
    processedData.present[dayOfWeek] += presentCount;
    processedData.absent[dayOfWeek] += absentCount;
    processedData.eventCounts[dayOfWeek]++;
  });

  // Calculate the average percentage for days with events
  processedData.percentage = processedData.percentage.map((total, index) => 
    processedData.eventCounts[index] > 0 ? total / processedData.eventCounts[index] : 0
  );

  console.log("Final processedData:", JSON.stringify(processedData, null, 2));

  return processedData;
}
