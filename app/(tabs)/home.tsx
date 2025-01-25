//app\(tabs)\home.tsx
import { Link, router } from 'expo-router';
import * as React from 'react';
import { View, ScrollView, Image, StyleSheet, RefreshControl } from 'react-native';
import { Appbar, Avatar, Card, Divider, FAB, List, Portal, ProgressBar, Provider, useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get, getDatabase, ref } from 'firebase/database';
import { useCallback, useEffect, useState } from 'react';
import { auth } from '@/firebaseConfig';

interface StatCardProps {
  title: string;
  value: string;
  color: string;
  icon: string;
}

interface ActiveSession {
  eventName: string;
  sessionDetails: {
    day: string;
    startTime: string;
    endTime: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  return (
    <Link href="/attendance" asChild>
    <Card
      style={styles.statCard}
      // onPress={() => router.replace('/attendance')}
    >
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons name={icon} size={36} color={color} />
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
      <ProgressBar progress={parseInt(value) / 100} color={color} style={styles.progressBar} />
    </Card>
    </Link>
  );
};

interface EventItemProps {
  course: string;
  day: string;
  time: string;
}

const EventItem: React.FC<EventItemProps> = ({ course, day, time }) => {
  const { colors } = useTheme();

  return (
    <List.Item
      title={course}
      left={(props) => <MaterialCommunityIcons {...props} name="book-open-variant" size={24} color={colors.primary} />}
      right={() => (
        <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={styles.scheduleTimeText}>{day}</Text>
          <View style={styles.scheduleTime}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
            <Text style={styles.scheduleTimeText}>{time}</Text>
          </View>
        </View>
      )}
      style={styles.listItem}
      // onPress={() => router.push({
      //   pathname: '/eventMgmt/detail',
      //   params: {}
      // })}
    />
  );
};

const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [fabOpen, setFabOpen] = React.useState(false);
  const [events, setEvents] = useState<EventItemProps[]>([]);
  const [totalAttendancePercentage, setTotalAttendancePercentage] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);
  const [activeEventCount, setActiveEventCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // Assume user is already authenticated, fetch UID
    const userAuth = auth.currentUser;
    const uid = userAuth?.uid;
  
    useEffect(() => {
        if (uid) {
            fetchProfilePicture(uid);
        }
    }, [uid]);
  
    // Function to fetch the profile picture URL from Firebase RLDB
    const fetchProfilePicture = async (uid: string) => {
        const db = getDatabase();
        const userRef = ref(db, `users/${uid}/profilePicture`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            setProfilePicture(snapshot.val());
        } else {
            setProfilePicture(null);
        }
    };

  const fetchAttendanceData = async () => {
    const db = getDatabase();

    const attendanceRef = ref(db, 'attendance');
    const attendanceSnapshot = await get(attendanceRef);

    if (attendanceSnapshot.exists()) {
      const attendanceData = attendanceSnapshot.val();
      let presentCount = 0;
      let absentCount = 0;
      let totalPercentage = 0;
      let studentCount = 0;

      for (const eventId in attendanceData) {
        for (const sessionId in attendanceData[eventId]) {
          for (const studentId in attendanceData[eventId][sessionId]) {
            const record = attendanceData[eventId][sessionId][studentId];
            if (record.actualStatus === 'present') {
              presentCount++;
            } else if (record.actualStatus === 'absent') {
              absentCount++;
            }
            if (record.attendancePercentage) {
              totalPercentage += record.attendancePercentage;
            }
            studentCount++;
          }
        }
      }

      setTotalAttendancePercentage(
        studentCount > 0 ? totalPercentage / studentCount : 0
      );
      setTotalPresent(presentCount);
      setTotalAbsent(absentCount);
    }
  };

    const fetchActiveSessions = async () => {
      const db = getDatabase();
      const activeSessionsRef = ref(db, 'activeSessions');
      const activeSessionsSnapshot = await get(activeSessionsRef);

      if (activeSessionsSnapshot.exists()) {
        const activeSessionsData = activeSessionsSnapshot.val();
        const uniqueEvents = new Set<string>();
        const fetchedEvents: EventItemProps[] = [];

        for (const sessionId in activeSessionsData) {
          const sessionGroup = activeSessionsData[sessionId];
          for (const individualSessionId in sessionGroup) {
            const session: ActiveSession = sessionGroup[individualSessionId];
            const { eventName, sessionDetails } = session;

            uniqueEvents.add(sessionId);

            fetchedEvents.push({
              course: eventName,
              day: sessionDetails.day,
              time: `${new Date(sessionDetails.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${new Date(sessionDetails.endTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`,
            });
          }
        }

        setActiveEventCount(uniqueEvents.size);
        setEvents(fetchedEvents);
      }
    };

  const fetchData = useCallback(async () => {
    await Promise.all([fetchAttendanceData(), fetchActiveSessions()]);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats: StatCardProps[] = [
    { title: 'Total Attendance', value: `${totalAttendancePercentage.toFixed(0)}%`, color: colors.primary, icon: 'account-check' },
    { title: 'Total Present', value: `${totalPresent}`, color: colors.secondary, icon: 'account-group' },
    { title: 'Total Absent', value: `${totalAbsent}`, color: colors.error, icon: 'account-remove' },
    { title: 'Active Events', value: `${activeEventCount}`, color: colors.tertiary, icon: 'calendar-check' },
  ];

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Image
            source={require('@/assets/images/idatangPutih.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Appbar.Content 
            titleStyle={styles.headerTitle}
            title="iDATANG" 
          />
          <Avatar.Image 
          size={40} 
          source={profilePicture ? { uri: profilePicture } : require("@/assets/images/avatar.png")}
          style={styles.avatar}
          />
        </Appbar.Header>

        <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        >
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </View>

          <Card style={styles.eventsCard}>
            <Card.Title
              title="Upcoming Events"
              left={(props) => <MaterialCommunityIcons {...props} name="calendar-today" size={24} color={colors.primary} />}
            />
            <Card.Content>
              {events.length > 0 ? (
                events.map((event, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider style={styles.divider} />}
                    <EventItem {...event} />
                  </React.Fragment>
                ))
              ) : (
                <Text>No upcoming events found.</Text>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        <Portal>
          <FAB.Group
            open={fabOpen}
            visible
            icon={fabOpen ? 'close' : 'plus'}
            actions={[
              {
                icon: 'account-plus',
                label: 'Add Student',
                onPress: () => router.push("/studentMgmt/add"),
              },
              {
                icon: 'book-plus',
                label: 'Add Event',
                onPress: () => router.push("/eventMgmt/add"),
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            onPress={() => {
              if (fabOpen) {
                // do something if the speed dial is open
              }
            }}
          />
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    elevation: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  logo: {
    width: 30,
    height: 30,
    marginLeft: 10,
    marginRight: 8,
  },
  avatar: {
    marginRight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statTextContainer: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    opacity: 0.7,
    flexWrap: 'wrap',
    width: '99%'
  },
  progressBar: {
    marginTop: 8,
  },
  eventsCard: {
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTimeText: {
    marginLeft: 4,
    fontSize: 12,
  },
});

export default HomeScreen;