import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Divider, List, ActivityIndicator, Appbar } from 'react-native-paper';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { getDatabase, ref, get, DataSnapshot } from 'firebase/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface Student {
  firstName: string;
  lastName: string;
  matric: string;
  enrolledEvents?: {
    [key: string]: boolean;
  };
}

interface AttendanceRecord {
  firstName: string;
  lastName: string;
  matric: string;
  status: string;
}

interface SessionData {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ExportData {
  eventName: string;
  session: SessionData;
  attendance: AttendanceRecord[];
}

const ExportPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<boolean>(false);
  const [expandedSession, setExpandedSession] = useState<boolean>(false);
  const [data, setData] = useState<ExportData | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [eventMap, setEventMap] = useState<{ [eventId: string]: string }>({});
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [sessionMap, setSessionMap] = useState<{ [sessionId: string]: string }>({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const db = getDatabase();
        const eventsRef = ref(db, 'events');
        const eventsSnapshot: DataSnapshot = await get(eventsRef);
        const eventsData = eventsSnapshot.val();
  
        if (eventsData) {
          const eventMap = Object.keys(eventsData).reduce((acc, eventId) => {
            acc[eventId] = eventsData[eventId].name; // Map eventId to eventName
            return acc;
          }, {} as { [eventId: string]: string });
  
          setEventMap(eventMap);
          setEventNames(Object.values(eventMap)); // Store event names for display
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedEvent) return;
      try {
        setLoading(true);
        const db = getDatabase();
        const sessionsRef = ref(db, `events/${selectedEvent}/sessions/`);
        const sessionsSnapshot: DataSnapshot = await get(sessionsRef);
        const sessionsData = sessionsSnapshot.val();
  
        if (sessionsData) {
          // Map sessionId to readable session name
          const sessionMap = Object.keys(sessionsData).reduce((acc, sessionId) => {
            const sessionParts = sessionId.split('-'); // Split sessionId by '-'
            const sessionNumberPart = sessionParts[sessionParts.length - 1]; // Get 'session-i'
            const sessionNumber = parseInt(sessionNumberPart.replace('session-', '')) + 1; // Increment session number
            acc[sessionId] = `Session ${sessionNumber}`; // Create readable name
            return acc;
          }, {} as { [sessionId: string]: string });
  
          setSessions(Object.keys(sessionMap)); // Store sessionIds
          setSessionMap(sessionMap); // Store mapping of sessionId to session name
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSessions();
  }, [selectedEvent]);

  const fetchData = async () => {
    if (!selectedEvent || !selectedSession) return null;
  
    try {
      setLoading(true);
      const db = getDatabase();
      const eventRef = ref(db, `events/${selectedEvent}`);
      const sessionRef = ref(db, `events/${selectedEvent}/sessions/${selectedSession}`);
      const studentsRef = ref(db, 'students');
      const attendanceRef = ref(db, `attendance/${selectedEvent}/${selectedSession}`);
  
      const [eventSnapshot, sessionSnapshot, studentsSnapshot, attendanceSnapshot] = await Promise.all([
        get(eventRef),
        get(sessionRef),
        get(studentsRef),
        get(attendanceRef),
      ]);
  
      const eventData = eventSnapshot.val();
      const sessionData: SessionData = sessionSnapshot.val();
      const studentsData: { [key: string]: Student } = studentsSnapshot.val();
      const attendanceData: { [key: string]: { status: string } } = attendanceSnapshot.val();
  
      const attendanceList: AttendanceRecord[] = Object.keys(studentsData || {}).map((key) => {
        const student = studentsData[key];
        const isEnrolled = student.enrolledEvents && student.enrolledEvents[selectedEvent];
  
        if (isEnrolled) {
          const status = attendanceData && attendanceData[key] ? attendanceData[key].status : 'Not Available';
          return {
            firstName: student.firstName,
            lastName: student.lastName,
            matric: student.matric,
            status,
          };
        }
        return null;
      }).filter(record => record !== null);
  
      return {
        eventName: eventData.name,
        session: sessionData,
        attendance: attendanceList,
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  const parseISO8601 = (isoDate: string): {time: string } => {
    const dateObj = new Date(isoDate);
    const localDate = new Date(dateObj.getTime());
  
    return {
      time: localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  };

  const handleExportPDF = async () => {
    if (!selectedEvent || !selectedSession) {
      alert('Please select an event and session first.');
      return;
    }

    setLoading(true);
    const exportData = await fetchData();
    setLoading(false);

    if (!exportData) {
      alert('Failed to fetch data for PDF generation.');
      return;
    }

    const { eventName, session, attendance } = exportData;

    const sessionParts = selectedSession.split('-');
    const sessionNumberPart = sessionParts[sessionParts.length - 1];
    const sessionNumber = parseInt(sessionNumberPart.replace('session-', '')) + 1;

    const formattedStartTime = parseISO8601(session.startTime).time;
    const formattedEndTime = parseISO8601(session.endTime).time;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${eventName}</h1>
          <p>Session: ${sessionNumber}, Date: ${session.day}, Time: ${formattedStartTime} - ${formattedEndTime}</p>
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Matric</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${attendance.map((record) => `
                <tr>
                  <td>${record.firstName}</td>
                  <td>${record.lastName}</td>
                  <td>${record.matric}</td>
                  <td>${record.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      alert('PDF has been exported successfully!');
      router.back();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF.');
    }
  };

  return (
      <ScrollView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Export Data" />
        </Appbar.Header>
        <View style={{ marginHorizontal: 16 }}>
        <List.Accordion
          title={selectedEvent ? eventMap[selectedEvent] : 'Select Event'}
          expanded={expandedEvent}
          onPress={() => setExpandedEvent(!expandedEvent)}
        >
          {Object.entries(eventMap).map(([eventId, eventName]) => (
            <List.Item
              key={eventId}
              title={eventName}
              onPress={() => {
                setSelectedEvent(eventId);
                setExpandedEvent(false);
              }}
            />
          ))}
        </List.Accordion>
        </View>
        <View style={{ marginHorizontal: 16 }}>
        <List.Accordion
          title={selectedSession ? sessionMap[selectedSession] : 'Select Session'}
          expanded={expandedSession}
          onPress={() => setExpandedSession(!expandedSession)}
        >
          {Object.entries(sessionMap).map(([sessionId, sessionName]) => (
            <List.Item
              key={sessionId}
              title={sessionName} 
              onPress={() => {
                setSelectedSession(sessionId); 
                setExpandedSession(false);
              }}
            />
          ))}
        </List.Accordion>
        </View>
        <View style={{ marginHorizontal: 16 }}>
          <Button
            mode="contained"
            onPress={handleExportPDF}
            disabled={!selectedEvent || !selectedSession || loading}
          >
            {loading ? 'Loading...' : 'Export to PDF'}
          </Button>
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default ExportPage;
