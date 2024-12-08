import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.database();

// Scheduled Cloud Function to update active sessions
export const updateActiveSessions = onSchedule("every 1 minute", async () => {
  try {
    const eventsRef = db.ref("events");
    const activeSessionsRef = db.ref("activeSessions");

    // Get current timestamp
    const currentTime = new Date();
    const currentDay = currentTime.toLocaleString("en-US", { weekday: "long" });
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    // Fetch all events
    const snapshot = await eventsRef.once("value");
    const events = snapshot.val();
    const activeSessions: any = {};

    if (events) {
      // Iterate through events
      for (const [eventId, eventData] of Object.entries(events)) {
        const { sessions } = eventData as any;

        for (const [sessionId, session] of Object.entries(sessions)) {
          const { day, time } = session as any;

          // Check if the session is active
          if (day === currentDay) {
            const [startTime, endTime] = time.split(" - ").map((t: string) => {
              const [hours, minutes] = t.split(":").map(Number);
              return hours * 60 + minutes; // Convert to total minutes
            });

            const currentMinutesOfDay = currentHours * 60 + currentMinutes;

            if (currentMinutesOfDay >= startTime && currentMinutesOfDay <= endTime) {
              // Add to active sessions
              if (!activeSessions[eventId]) {
                activeSessions[eventId] = { name: (eventData as any).name, sessions: {} };
              }
              activeSessions[eventId].sessions[sessionId] = session;
            }
          }
        }
      }
    }

    // Update the activeSessions node
    await activeSessionsRef.set(activeSessions);

    logger.info("Active sessions updated successfully.");
  } catch (error) {
    logger.error("Error updating active sessions:", error);
    throw new Error("Error updating active sessions");
  }
});

// Optional HTTP function for testing purposes
export const testUpdateActiveSessions = onRequest(async (request, response) => {
  try {
    await updateActiveSessions.run();
    response.send("Active sessions updated successfully.");
  } catch (error) {
    logger.error("Error running test function:", error);
    response.status(500).send("Error running test function.");
  }
});
