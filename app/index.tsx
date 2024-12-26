// index.tsx
import { auth } from '@/firebaseConfig';
import { getDatabase, ref, get, update } from 'firebase/database';
import { Redirect, router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export default function Index() {
    const [loading, setLoading] = useState(true);

    // const fetchAndFilterSessions = async () => {
    //     try {
    //         const db = getDatabase();
    //         const eventsRef = ref(db, 'events');
    //         const snapshot = await get(eventsRef);

    //         if (!snapshot.exists()) {
    //             console.log('No events found.');
    //             return;
    //         }

    //         const events = snapshot.val();
    //         const activeSessions: Record<string, any> = {};

    //         // Get current day and time (Malaysia timezone)
    //         const currentDay = new Intl.DateTimeFormat('en-US', {
    //             weekday: 'long',
    //             timeZone: 'Asia/Kuala_Lumpur',
    //         }).format(new Date());

    //         const currentTime = new Intl.DateTimeFormat('en-US', {
    //             hour: '2-digit',
    //             minute: '2-digit',
    //             hour12: false,
    //             timeZone: 'Asia/Kuala_Lumpur',
    //         }).format(new Date());

    //         console.log('Current Day:', currentDay);
    //         console.log('Current Time:', currentTime);

    //         for (const eventId in events) {
    //             const event = events[eventId];
    //             const { sessions } = event;

    //             for (const sessionId in sessions) {
    //                 const session = sessions[sessionId];
    //                 if (session.day === currentDay) {
    //                     const [startTime, endTime] = session.time.split(' - ');
    //                     if (currentTime >= startTime && currentTime <= endTime) {
    //                         if (!activeSessions[eventId]) {
    //                             activeSessions[eventId] = {};
    //                         }
    //                         activeSessions[eventId][sessionId] = {
    //                             eventName: event.name,
    //                             sessionDetails: session,
    //                         };
    //                     }
    //                 }
    //             }
    //         }

    //         console.log('Filtered Active Sessions:', activeSessions);

    //         const activeSessionsRef = ref(db, 'activeSessions');
    //         await update(activeSessionsRef, activeSessions);
    //         console.log('Active sessions updated in Firebase.');
    //     } catch (error) {
    //         console.error('Error fetching and filtering sessions:', error);
    //     }
    // };

    // const processAttendance = async () => {
    //   try {
    //       const db = getDatabase();
  
    //       // Fetch attendance logs, students, and active sessions
    //       const [attendanceLogsSnapshot, studentsSnapshot, activeSessionsSnapshot] = await Promise.all([
    //           get(ref(db, 'attendanceLogs')),
    //           get(ref(db, 'students')),
    //           get(ref(db, 'activeSessions')),
    //       ]);
  
    //       if (!attendanceLogsSnapshot.exists() || !studentsSnapshot.exists() || !activeSessionsSnapshot.exists()) {
    //           console.log('Required data missing.');
    //           return;
    //       }
  
    //       const attendanceLogs = attendanceLogsSnapshot.val();
    //       const students = studentsSnapshot.val();
    //       const activeSessions = activeSessionsSnapshot.val();
  
    //       const attendanceUpdates: Record<string, any> = {};
  
    //       for (const logId in attendanceLogs) {
    //           const log = attendanceLogs[logId];
  
    //           // Match cardUid to a student
    //           const studentId = Object.keys(students).find(
    //               (id) => students[id].cardNo === log.cardUid
    //           );
  
    //           if (!studentId) {
    //               console.log(`No student found for card UID: ${log.cardUid}`);
    //               continue;
    //           }
  
    //           const student = students[studentId];
  
    //           // Find the active session for the sessionId
    //           let activeSession = null;
    //           for (const eventId in activeSessions) {
    //               if (activeSessions[eventId][log.sessionId]) {
    //                   activeSession = activeSessions[eventId][log.sessionId];
    //                   break;
    //               }
    //           }
  
    //           if (!activeSession) {
    //               console.log(`No active session found for sessionId: ${log.sessionId}`);
    //               continue;
    //           }
  
    //           // Check if the student is enrolled in the event
    //           const isEnrolled = student.enrolledEvents?.[log.eventId];
    //           if (!isEnrolled) {
    //               console.log(
    //                   `Student ${student.firstName} is not enrolled in event: ${log.eventId}`
    //               );
    //               continue;
    //           }
  
    //           // Prepare attendance updates
    //           if (!attendanceUpdates[log.eventId]) {
    //               attendanceUpdates[log.eventId] = {};
    //           }
    //           if (!attendanceUpdates[log.eventId][log.sessionId]) {
    //               attendanceUpdates[log.eventId][log.sessionId] = {};
    //           }
  
    //           const attendanceEntry = attendanceUpdates[log.eventId][log.sessionId][studentId] || {};
  
    //           // Check if this is the first or second detection
    //           if (!attendanceEntry.checkInTime) {
    //               // First detection
    //               attendanceEntry.checkInTime = log.timestamp;
    //           } else if (!attendanceEntry.checkOutTime) {
    //               // Second detection
    //               attendanceEntry.checkOutTime = log.timestamp;
    //               attendanceEntry.status = "Present";
    //           }
  
    //           attendanceUpdates[log.eventId][log.sessionId][studentId] = attendanceEntry;
  
    //           console.log(
    //               `Attendance updated for ${student.firstName}:`,
    //               attendanceUpdates[log.eventId][log.sessionId][studentId]
    //           );
    //       }
  
    //       console.log('Attendance Updates:', attendanceUpdates);
  
    //       // Update the attendance node in Firebase
    //       if (Object.keys(attendanceUpdates).length > 0) {
    //           const attendanceRef = ref(db, 'attendance');
    //           await update(attendanceRef, attendanceUpdates);
    //           console.log('Attendance updated successfully in Firebase.');
    //       } else {
    //           console.log('No attendance updates to push.');
    //       }
    //     } catch (error) {
    //         console.error('Error processing attendance:', error);
    //     }
    // };
  

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // await fetchAndFilterSessions();
                // await processAttendance();

                const db = getDatabase();
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    if (userData.role === "admin") {
                        router.replace("/(tabs)/home");
                    } else if (userData.role === "organizer") {
                        router.replace("/organizer/home");
                    } else {
                        router.replace('/(auth)/sign-in'); // Default redirect if no role
                    }
                } else {
                    console.log("User data not found");
                }
                // router.replace("/(tabs)/home");
            } else {
                router.replace('/(auth)/sign-in');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return null;
}

