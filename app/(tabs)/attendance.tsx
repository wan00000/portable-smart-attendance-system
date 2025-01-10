import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Dimensions, RefreshControl } from 'react-native';
import { Href, router } from 'expo-router';
import { Appbar, Button, Card, Menu, Text, useTheme, FAB, Portal, Dialog, Paragraph, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get, getDatabase, ref } from 'firebase/database';
import AttendanceGraph from '@/components/AttendanceGraph';

// Define a type for a session
interface Session {
  day: string;
  date: string;
  time: string;
  startTime: string; // ISO8601 string
  endTime: string;   // ISO8601 string
}

// Define a type for an event
interface Event {
  code: string;
  name: string;
  organizer: string;
  quota: number;
  sessions: Record<string, Session>;
}


// Define the structure for all events
type Events = Record<string, Event>;

// Fetch events from Firebase
const fetchEvents = async (): Promise<Events> => {
  const db = getDatabase();
  const eventsRef = ref(db, 'events');

  try {
    const snapshot = await get(eventsRef);
    if (!snapshot.exists()) return {};
    return snapshot.val() as Events;
  } catch (error) {
    console.error('Firebase error:', error);
    throw error;
  }
};

// Parse ISO8601 string to extract readable date, day, and time, considering offset calculation
const parseISO8601 = (isoDate: string): { date: string; day: string; time: string } => {
  const dateObj = new Date(isoDate);

  // Add +08:00 offset to UTC time
  const offsetMillis = 8 * 60 * 60 * 1000; // +08:00 in milliseconds
  const localDate = new Date(dateObj.getTime());

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    date: localDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    day: dayNames[localDate.getDay()],
    time: localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
};

const AttendanceScreen = () => {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const [events, setEvents] = useState<Record<string, Event>>({});
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const fetchAttendanceData = async () => {
      const db = getDatabase();
      const attendanceRef = ref(db, 'attendance');
  
      try {
        const snapshot = await get(attendanceRef);
        if (snapshot.exists()) {
          setAttendanceData(snapshot.val());
        } else {
          console.log('No attendance data found.');
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };
  

  const fetchData = useCallback(async () => {
    setLoading(true);
      try {
        const eventsData = await fetchEvents();
        const formattedEvents = Object.fromEntries(
          Object.entries(eventsData).map(([eventId, event]) => [
            eventId,
            {
              ...event,
              sessions: Object.fromEntries(
                Object.entries(event.sessions).map(([sessionId, session]) => {
                  const { date, day, time: startTime } = parseISO8601(session.startTime);
                  const { time: endTime } = parseISO8601(session.endTime);
                  return [
                    sessionId,
                    {
                      ...session,
                      date,
                      day,
                      time: `${startTime} - ${endTime}`,
                    },
                  ];
                })
              ),
            },
          ])
        );
        setEvents(formattedEvents);
        await fetchAttendanceData();
      } catch (error) {
        console.error('Error formatting events:', error);
      } finally {
        setLoading(false);
      }
    }, []);




  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading events...</Text>
      </View>
    );
  }

  const calculateAttendanceStats = (sessionId: string, eventId: string) => {
    const sessionAttendance = attendanceData?.[eventId]?.[sessionId];
    if (!sessionAttendance) {
      return { percentage: 0, present: 0, absent: 0, totalPercentage: 0, statuses: { present: 0, absent: 0 } };
    }
  
    const totalStudents = Object.keys(sessionAttendance).length;
    let presentCount = 0;
    let absentCount = 0;
    let totalAttendancePercentage = 0;
    let statuses = { present: 0, absent: 0 };
  
    for (const studentId in sessionAttendance) {
      const record = sessionAttendance[studentId];
      if (record.actualStatus === 'present') {
        statuses.present++;
        presentCount++;
      } else if (record.actualStatus === 'absent') {
        statuses.absent++;
        absentCount++;
      }
      if (record.attendancePercentage !== undefined) {
        totalAttendancePercentage += record.attendancePercentage;
      }
    }
  
    const averageAttendancePercentage =
      totalStudents > 0 ? totalAttendancePercentage / totalStudents : 0;
  
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  
    return {
      percentage,
      present: presentCount,
      absent: absentCount,
      totalPercentage: averageAttendancePercentage.toFixed(0),
      statuses,
    };
  };
  
  
  

  const handleRoutePush = (route: string) => {
    setMenuVisible(false);
    router.push(route as Href);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header>
        <Appbar.Content title="Attendances" />
      </Appbar.Header>

      <ScrollView 
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
      >

      <AttendanceGraph />

        {Object.entries(events).map(([eventId, event]) => (
          <Card key={eventId} style={{ margin: 16, elevation: 4 }}>
            <Card.Title
              title={event.name}
              subtitle={event.code}
              left={(props) => (
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color={colors.primary}
                />
              )}
            />
            <Card.Content>
              {event.sessions
                ? Object.entries(event.sessions).map(([sessionId, session]) => {
                    const stats = calculateAttendanceStats(sessionId, eventId);

                    return (
                      <View key={sessionId} style={{ marginVertical: 8 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 8,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{`${session.day}, ${session.date}`}</Text>
                            <Text style={{ fontSize: 12 }}>{session.time}</Text>
                          </View>
                          <IconButton
                            icon="chevron-right"
                            size={24}
                            style={{ marginRight: -8 }}
                            onPress={() => {
                              router.push({
                                pathname: '/attendance/test',
                                params: {
                                  eventId,
                                  eventName: event.name,
                                  sessionId,
                                  sessionDay: session.day,
                                  sessionDate: session.date,
                                  sessionTime: session.time,
                                },
                              });
                            }}
                          />
                        </View>

                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false} 
                          contentContainerStyle={{ paddingHorizontal: 8 }}
                        >
                          <Chip
                            icon="percent"
                            mode="flat"
                            style={{ marginHorizontal: 2 }}
                            textStyle={{ fontSize: 11 }}
                          >
                            Percentage: {stats.totalPercentage}%
                          </Chip>
                          <Chip
                            icon="check"
                            mode="flat"
                            style={{ marginHorizontal: 2 }}
                            textStyle={{ fontSize: 11 }}
                          >
                            Present: {stats.statuses.present}
                          </Chip>
                          <Chip
                            icon="close"
                            mode="flat"
                            style={{ marginHorizontal: 2 }}
                            textStyle={{ fontSize: 11 }}
                          >
                            Absent: {stats.statuses.absent}
                          </Chip>
                        </ScrollView>
                      </View>
                    );
                  })
                : (
                  <Text>No sessions available for this event</Text>
                )}
            </Card.Content>
          </Card>
        ))}



        
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Quick Actions</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Choose an action to perform:</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleRoutePush('/attendance/edit')}>Manual Attendance</Button>
            <Button onPress={() => {}}>Export Data</Button>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>


    </View>
  );
};

export default AttendanceScreen;
