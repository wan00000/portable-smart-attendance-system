// Firebase Cloud Functions SDK
import {onValueCreated} from "firebase-functions/database";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getDatabase, Reference} from "firebase-admin/database";

// Initialize Firebase Admin SDK
initializeApp();

interface EventSession {
  startTime: string;
  endTime: string;
  [key: string]: any;
}

interface Event {
  name: string;
  sessions?: Record<string, EventSession>;
  [key: string]: any;
}

export const fetchAndFilterSessions = onSchedule(
  {
    schedule: "every 48 hours",
    timeZone: "Asia/Kuala_Lumpur",
    region: "asia-southeast1",
  },
  async () => {
    try {
      logger.info("Function triggered. Starting process...");

      const db = getDatabase();
      const eventsRef = db.ref("events");
      logger.info("Fetching events from database...");

      const snapshot = await eventsRef.get();
      if (!snapshot.exists()) {
        logger.info("No events found in the database.");
        return;
      }

      logger.info("Events fetched successfully.");
      const events: Record<string, Event> = snapshot.val();
      logger.info(`Fetched events: ${JSON.stringify(events, null, 2)}`);

      const activeSessions: Record<string, Record<string, any>> = {};

      // Get the current time in ISO8601 format
      const currentISOTime = new Date().toISOString();
      const currentTimestamp = Date.parse(currentISOTime);

      logger.info(`Current ISO8601 Time: ${currentISOTime}`);
      logger.info(`Current Timestamp: ${currentTimestamp}`);

      // Loop through events and sessions to filter active ones
      for (const eventId in events) {
        if (Object.prototype.hasOwnProperty.call(events, eventId)) {
          const event = events[eventId];
          logger.info(`Processing event: ${eventId} - ${event.name}`);
          const {sessions} = event;

          if (!sessions) {
            logger.info(`No sessions found for event: ${eventId}`);
            continue;
          }

          for (const sessionId in sessions) {
            if (Object.prototype.hasOwnProperty.call(sessions, sessionId)) {
              const session = sessions[sessionId];
              logger.info(`
                Processing session: ${sessionId} for event: ${eventId}`);

              if (!session.startTime || !session.endTime) {
                logger.warn(
                  `Session ${sessionId} missing startTime or endTime. Skipping.`
                );
                continue;
              }

              const sessionStartTime = Date.parse(session.startTime);
              const sessionEndTime = Date.parse(session.endTime);

              logger.info(
                `Session
                start time: ${new Date(sessionStartTime).toISOString()},
                end time: ${new Date(sessionEndTime).toISOString()}`
              );

              // Check if current time falls within the session
              if (
                currentTimestamp >= sessionStartTime &&
                currentTimestamp <= sessionEndTime
              ) {
                logger.info(
                  `Session ${sessionId} is active. Adding to active sessions.`
                );
                activeSessions[eventId] = activeSessions[eventId] || {};
                activeSessions[eventId][sessionId] = {
                  eventName: event.name,
                  sessionDetails: session,
                };
              } else {
                logger.info(
                  `Session ${sessionId} is not active at the current time.
                  Start Time: ${session.startTime},
                  End Time: ${session.endTime}`
                );
              }
            }
          }
        }
      }

      logger.info(
        `Filtered Active Sessions: ${JSON.stringify(activeSessions, null, 2)}`
      );

      // Update activeSessions in Firebase
      const activeSessionsRef = db.ref("activeSessions");
      logger.info("Updating activeSessions in the database...");
      await activeSessionsRef.set(activeSessions);
      logger.info("Active sessions updated successfully.");
    } catch (error) {
      logger.error("Error fetching and filtering sessions:", error);
    }
  }
);

export const processAttendance = onValueCreated(
  {
    ref: "attendanceLogs/{logId}",
    region: "asia-southeast1",
  },
  async (event) => {
    try {
      const db = getDatabase();
      const logData = event.data.val();
      const uid: string = logData?.uid;
      const timestamp: string = logData?.timestamp;

      logger.info("Processing attendance log...");

      // Validate log data
      if (!uid || !timestamp) {
        logger.error("Invalid attendance log data: Missing UID or timestamp");
        return;
      }
      logger.info(`Attendance log received:
        UID=${uid}, Timestamp=${timestamp}`);

      // Fetch students and active sessions data
      logger.info("Fetching students and active sessions data...");
      const [studentsSnap, activeSessionsSnap] = await Promise.all([
        db.ref("/students").get(),
        db.ref("/activeSessions").get(),
      ]);

      const students = studentsSnap.val();
      const activeSessions = activeSessionsSnap.val();

      if (!students) {
        logger.error("No students data found in database");
        return;
      }
      if (!activeSessions) {
        logger.error("No active sessions data found in database");
        return;
      }
      logger.info("Students and active sessions data successfully fetched");

      // Match UID to student's cardNo
      logger.info(`Looking for a student with cardNo matching UID=${uid}...`);
      const studentEntry = Object.entries(students).find(
        ([, studentData]: any) => studentData.cardNo === uid
      );
      if (!studentEntry) {
        logger.warn(`No student found with cardNo matching UID=${uid}`);
        return;
      }

      const [studentId, studentData]: [string, any] = studentEntry;
      logger.info(
        `Student found: ID=${studentId}, Name=${studentData.firstName}`
      );

      // Determine the active session
      logger.info("Searching for an active session matching the timestamp...");
      let activeSessionId: string | null = null;
      let sessionKey: string | null = null;
      let sessionData: any = null;

      // Iterate over activeSessions and nested session keys
      for (const [eventId, sessions] of Object.entries(
        activeSessions as Record<string, Record<string, any>>
      )) {
        for (const [key, session] of Object.entries(sessions)) {
          const {startTime, endTime} = session.sessionDetails;
          if (timestamp >= startTime && timestamp <= endTime) {
            activeSessionId = eventId;
            sessionKey = key;
            sessionData = session;
            break;
          }
        }
        if (sessionKey) break;
      }

      if (!activeSessionId || !sessionKey) {
        logger.warn(
          `No active session found matching the timestamp ${timestamp}`
        );
        return;
      }

      logger.info(
        `Active session found: SessionKey=${sessionKey},
        EventName=${sessionData.eventName}`
      );

      // Check if student is enrolled in the session's event
      const enrolledEvents = studentData.enrolledEvents;
      logger.info(
        `Checking if student ${studentId} is
        enrolled in event ${activeSessionId}...`
      );
      const isEnrolled = Object.keys(enrolledEvents).some(
        (event) => event === activeSessionId
      );

      if (!isEnrolled) {
        logger.warn(
          `Student ${studentId} is not enrolled in event ${activeSessionId}`
        );
        return;
      }
      logger.info(
        `Student ${studentId} is enrolled in event ${activeSessionId}`
      );

      // Record attendance
      const attendanceRef: Reference = db.ref(
        `/attendance/${activeSessionId}/${sessionKey}/${studentId}`
      );

      logger.info(`Fetching attendance record for student ${studentId}...`);
      const attendanceSnap = await attendanceRef.get();

      if (!attendanceSnap.exists()) {
        logger.info(
          `No previous attendance record found for
          student ${studentId} in session ${sessionKey}`
        );
        logger.info(
          `Recording check-in time:
          StudentID=${studentId}, Timestamp=${timestamp}`
        );
        await attendanceRef.set({
          checkInTime: timestamp,
        });
        logger.info(
          `Check-in successfully recorded for student ${studentId}`
        );
      } else {
        logger.info(
          `Existing attendance record found for
          student ${studentId} in session ${sessionKey}`
        );
        logger.info(
          `Recording check-out time:
          StudentID=${studentId}, Timestamp=${timestamp}`
        );
        await attendanceRef.update({
          checkOutTime: timestamp,
        });
        logger.info(
          `Check-out successfully recorded for student ${studentId}`
        );
      }
    } catch (error) {
      logger.error("Error processing attendance:", error);
    }
  }
);

export const handleCheckIn = onValueCreated(
  {
    ref: "attendance/{eventId}/{sessionId}/{studentId}/checkInTime",
    region: "asia-southeast1",
  },
  async (event) => {
    try {
      const db = getDatabase();

      // Extract event parameters
      const {eventId, sessionId, studentId} = event.params;
      const checkInTime = event.data.val() as string;

      if (!checkInTime) {
        logger.warn(`No checkInTime found for student: ${studentId}`);
        return;
      }

      // Fetch session's start time
      const sessionRef = db.ref(
        `events/${eventId}/sessions/${sessionId}/startTime`
      );
      const sessionSnapshot = await sessionRef.get();

      if (!sessionSnapshot.exists()) {
        logger.warn(
          `Session startTime not found for eventId: 
          ${eventId}, sessionId: ${sessionId}`
        );
        return;
      }

      const sessionStartTimeISO = sessionSnapshot.val() as string;
      const sessionStartTime = new Date(sessionStartTimeISO);

      // Add buffer threshold of 10 minutes
      const threshold = 5 * 60 * 1000; // 5 minutes in milliseconds
      const bufferTime = new Date(sessionStartTime.getTime() + threshold);

      logger.info(
        `Session start time: ${sessionStartTime.toISOString()}, ` +
        `Buffer time (5 min): ${bufferTime.toISOString()}`
      );

      // Compare check-in time with the buffered session start time
      const checkInTimestamp = new Date(checkInTime).getTime();
      const status = checkInTimestamp <=
      bufferTime.getTime() ? "onTime" : "late";

      logger.info(
        `Check-in status for student ${studentId}
        in session ${sessionId}: ${status}`
      );

      // Update attendance node with the status
      const attendanceRef = db.ref(
        `attendance/${eventId}/${sessionId}/${studentId}/status`
      );
      await attendanceRef.set(status);

      logger.info(
        `Attendance status set to '${status}' for student: ${studentId}`
      );
    } catch (error) {
      logger.error("Error handling check-in:", error);
    }
  }
);

type AttendanceData = {
  checkInTime: string;
  actualStatus?: string;
  status?: string;
  durationMinutes?: number;
  attendancePercentage?: number;
};

type SessionData = {
  startTime: string;
  endTime: string;
};

export const handleCheckOut = onValueCreated(
  {
    ref: "attendance/{eventId}/{sessionId}/{studentId}/checkOutTime",
    region: "asia-southeast1",
  },
  async (event) => {
    try {
      const db = getDatabase();

      // Extract event parameters
      const {eventId, sessionId, studentId} = event.params;
      const checkOutTime = event.data.val() as string;

      if (!checkOutTime) {
        logger.warn(`No checkOutTime found for student: ${studentId}`);
        return;
      }

      // Reference to attendance details
      const attendanceRef = db.ref(
        `attendance/${eventId}/${sessionId}/${studentId}`
      );

      // Fetch the attendance data
      const attendanceSnapshot = await attendanceRef.get();
      const attendanceData = attendanceSnapshot.val() as AttendanceData | null;

      if (!attendanceData || !attendanceData.checkInTime) {
        logger.warn(`No checkInTime found for student: ${studentId}`);
        return;
      }

      const checkInTime = new Date(attendanceData.checkInTime).getTime();
      const checkOutTimeMillis = new Date(checkOutTime).getTime();

      if (isNaN(checkInTime) || isNaN(checkOutTimeMillis)) {
        logger.warn(`Invalid date format for student: ${studentId}`);
        return;
      }

      // Calculate attendance duration
      const durationMinutes = (checkOutTimeMillis - checkInTime) / 60000;

      // Fetch session duration
      const sessionRef = db.ref(`events/${eventId}/sessions/${sessionId}`);
      const sessionSnapshot = await sessionRef.get();
      const sessionData = sessionSnapshot.val() as SessionData | null;

      if (!sessionData || !sessionData.startTime || !sessionData.endTime) {
        logger.warn(`No session time found for session: ${sessionId}`);
        return;
      }

      const startTime = new Date(sessionData.startTime).getTime();
      const endTime = new Date(sessionData.endTime).getTime();

      if (isNaN(startTime) || isNaN(endTime)) {
        logger.warn(`Invalid session time format for session: ${sessionId}`);
        return;
      }

      const sessionDurationMinutes = (endTime - startTime) / 60000;

      // Calculate attendance percentage
      const attendancePercentage = (durationMinutes/sessionDurationMinutes)*100;

      // Update actualStatus and status based on attendance percentage
      const actualStatus = attendancePercentage < 70 ? "absent" : "present";
      const updates: Partial<AttendanceData> = {
        actualStatus,
        durationMinutes,
        attendancePercentage,
      };

      if (attendancePercentage < 70) {
        updates.status = "absent";
        updates.attendancePercentage = 0;
      }

      await attendanceRef.update(updates);

      logger.info(
        `Updated attendance for student: ${studentId},
        actualStatus: ${actualStatus}, duration: ${durationMinutes} mins,
        percentage: ${attendancePercentage}%`
      );
    } catch (error) {
      logger.error("Error handling check-out:", error);
    }
  }
);


interface AttendanceLog {
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  actualStatus?: string;
}

export const aggregateEventAttendance = onSchedule(
  {
    schedule: "every 48 hours",
    timeZone: "Asia/Kuala_Lumpur",
    region: "asia-southeast1",
  },
  async () => {
    try {
      const db = getDatabase();
      const studentsRef = db.ref("students");
      const eventsRef = db.ref("events");
      const attendanceRef = db.ref("attendance");

      // Fetch all students
      const studentsSnapshot = await studentsRef.once("value");
      const students = studentsSnapshot.val();

      if (!students) {
        logger.info("No students found.");
        return;
      }

      for (const studentId of Object.keys(students)) {
        const student = students[studentId];
        const enrolledEvents = student.enrolledEvents;

        if (!enrolledEvents) continue;

        for (const eventId of Object.keys(enrolledEvents)) {
          // Fetch event details
          const eventSnapshot = await eventsRef.child(eventId).once("value");
          const event: Event = eventSnapshot.val();

          if (!event || !event.sessions) continue;

          for (const sessionId of Object.keys(event.sessions)) {
            const session = event.sessions[sessionId];
            const today = new Date();

            const currentDay = today.toLocaleDateString(
              "en-US", {weekday: "long"});
            // Check if session exists and is today
            if (session.day === currentDay && session.time) {
              const [startTime, endTime] = session.time.split(" - ");

              if (startTime && endTime) {
                const sessionStartTime = new Date(
                  `${today.toDateString()} ${startTime}`
                );
                const sessionEndTime = new Date(
                  `${today.toDateString()} ${endTime}`
                );

                // Check attendance for the student in this session
                const attendanceLogRef = attendanceRef
                  .child(eventId)
                  .child(sessionId)
                  .child(studentId);

                const attendanceLogSnapshot = await attendanceLogRef.once(
                  "value"
                );
                const attendanceLog:AttendanceLog=attendanceLogSnapshot.val();

                if (
                  !attendanceLog ||
                  !attendanceLog.checkInTime ||
                  new Date(attendanceLog.checkInTime) < sessionStartTime ||
                  new Date(attendanceLog.checkInTime) > sessionEndTime
                ) {
                  // Mark as absent
                  await attendanceLogRef.set({
                    checkInTime: null,
                    checkOutTime: null,
                    status: "absent",
                    actualStatus: "absent",
                    attendancePercentage: 0,
                  });
                  logger.info(
                    `Marked student ${studentId} as absent for event ${eventId},
                    session ${sessionId}.`
                  );
                }
              } else {
                logger.warn(
                  `Invalid time format for session ${sessionId},
                  event ${eventId}`
                );
              }
            } else {
              logger.warn(
                `Session ${sessionId} for event ${eventId},
                has no valid time or is not today`
              );
            }
          }
        }
      }

      logger.info("Event attendance aggregation completed.");
    } catch (error) {
      logger.error("Error aggregating event attendance:", error);
    }
  }
);


import * as nodemailer from "nodemailer";
import dotenv = require("dotenv");

dotenv.config();

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

export const emailCheckIn = onValueCreated(
  {
    ref: "attendance/{eventId}/{sessionId}/{studentId}/checkInTime",
    region: "asia-southeast1",
  },
  async (event) => {
    try {
      const {eventId, studentId} = event.params;
      const checkInTime = event.data.val();

      if (!checkInTime) {
        console.log("No check-in time found, skipping email.");
        return;
      }

      const db = getDatabase();
      const studentRef = db.ref(`students/${studentId}`);
      const eventRef = db.ref(`events/${eventId}`);

      // Fetch student data
      const studentSnapshot = await studentRef.once("value");
      const studentData = studentSnapshot.val();

      if (!studentData) {
        console.error("Student data not found for ID:", studentId);
        return;
      }

      // Fetch event data
      const eventSnapshot = await eventRef.once("value");
      const eventData = eventSnapshot.val();

      if (!eventData) {
        console.error("Event data not found for ID:", eventId);
        return;
      }

      // Parse check-in time
      const checkInDate = new Date(checkInTime);

      // Find the specific session the student is attending
      const session = Object.values(eventData.sessions).find((session) => {
        const sessionData = session as {
          startTime: string;
          endTime: string;
          day: string };
        const sessionStartTime = new Date(sessionData.startTime);
        const sessionEndTime = new Date(sessionData.endTime);

        // Check if check-in time falls within the session's start and end times
        return checkInDate >= sessionStartTime && checkInDate <= sessionEndTime;
      });

      if (!session) {
        console.error("No session found matching the check-in time.");
        return;
      }

      // Format session times
      const sessionData = session as {
        startTime: string;
        endTime: string;
        day: string };
      const formattedStartTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(sessionData.startTime));

      const formattedEndTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(sessionData.endTime));

      const formattedCheckInTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(checkInTime));

      // Compose email
      const studentEmail = `${studentData.matric}@upm.edu.my`;
      const subject = "Check-In Verification";
      const content = `
      <html>
        <body
        style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Check-In Verification</h2>
          <p>Dear ${studentData.firstName},</p>
          <p>You have successfully checked in for the following event:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Event Name:</strong> ${eventData.name}</li>
            <li><strong>Event Code:</strong> ${eventData.code}</li>
            <li><strong>Session Details:</strong> ${sessionData.day}, 
            ${formattedStartTime} - ${formattedEndTime}</li>
            <li><strong>Check-In Time:</strong> ${formattedCheckInTime}</li>
          </ul>
          <p>Best regards,<br>iDATANG Team</p>
        </body>
      </html>
    `;

      // Send email
      const emailOptions = {
        from: "a9uf@gmail.com",
        to: studentEmail,
        subject: subject,
        html: content,
      };

      await transporter.sendMail(emailOptions);
      console.log("Check-in email sent successfully to:", studentEmail);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
);

export const emailCheckOut = onValueCreated(
  {
    ref: "attendance/{eventId}/{sessionId}/{studentId}/attendancePercentage",
    region: "asia-southeast1",
  },
  async (event) => {
    try {
      const {eventId, sessionId, studentId} = event.params;

      const db = getDatabase();
      const studentRef = db.ref(`students/${studentId}`);
      const eventRef = db.ref(`events/${eventId}`);

      // Fetch student data
      const studentSnapshot = await studentRef.once("value");
      const studentData = studentSnapshot.val();

      if (!studentData) {
        console.error("Student data not found for ID:", studentId);
        return;
      }

      // Fetch event data
      const eventSnapshot = await eventRef.once("value");
      const eventData = eventSnapshot.val();

      if (!eventData) {
        console.error("Event data not found for ID:", eventId);
        return;
      }

      // Fetch attendance details
      const attendanceRef = db.ref(
        `attendance/${eventId}/${sessionId}/${studentId}`
      );
      const attendanceSnapshot = await attendanceRef.once("value");
      const attendanceData = attendanceSnapshot.val();

      if (!attendanceData) {
        console.error("Attendance data not found for student in session.");
        return;
      }

      const {
        checkInTime,
        checkOutTime,
        attendancePercentage,
        actualStatus,
      } = attendanceData;

      if (!checkInTime) {
        console.error("Check-in time not found in attendance data.");
        return;
      }

      // Parse check-in time
      const checkInDate = new Date(checkInTime);

      // Find the specific session the student is attending
      const session = Object.values(eventData.sessions).find((session) => {
        const sessionData = session as {
          startTime: string;
          endTime: string;
          day: string };
        const sessionStartTime = new Date(sessionData.startTime);
        const sessionEndTime = new Date(sessionData.endTime);

        // Check if check-in time falls within the session's start and end times
        return checkInDate >= sessionStartTime && checkInDate <= sessionEndTime;
      });

      if (!session) {
        console.error("No session found matching the check-in time.");
        return;
      }

      // Format session times
      const sessionData = session as {
        startTime: string;
        endTime: string;
        day: string };
      const formattedStartTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(sessionData.startTime));

      const formattedEndTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(sessionData.endTime));

      const formattedCheckInTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(checkInTime));

      const formattedCheckOutTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur", // Specify the timezone
      }).format(new Date(checkOutTime));
      console.log("Check-Out Time processed correctly:", formattedCheckOutTime);

      const formattedAttendancePercentage=`${attendancePercentage.toFixed(0)}%`;

      // Compose email
      const studentEmail = `${studentData.matric}@upm.edu.my`;
      const subject = "Check-Out Verification";
      const content = `
      <html>
        <body
        style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Check-Out Verification</h2>
          <p>Dear ${studentData.firstName},</p>
          <p>You have successfully checked out for the following event:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Event Name:</strong> ${eventData.name}</li>
            <li><strong>Event Code:</strong> ${eventData.code}</li>
            <li><strong>Session Details:</strong> ${sessionData.day}, 
            ${formattedStartTime} - ${formattedEndTime}</li>
            <li><strong>Check-In Time:</strong> ${formattedCheckInTime}</li>
            <li><strong>Check-Out Time:</strong> ${formattedCheckOutTime}</li>
            <li><strong>Attendance Percentage:</strong>
            ${formattedAttendancePercentage}
            </li>
            <li><strong>Status:</strong> ${actualStatus}</li>
          </ul>
          <p>Best regards,<br>iDATANG Team</p>
        </body>
      </html>
    `;

      // Send email
      const emailOptions = {
        from: "a9uf@gmail.com",
        to: studentEmail,
        subject: subject,
        html: content,
      };

      await transporter.sendMail(emailOptions);
      console.log("Check-out email sent successfully to:", studentEmail);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
);


