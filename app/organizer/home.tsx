import React, { useCallback, useEffect, useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Appbar, Card, useTheme, Text, Button, Avatar, Portal, FAB, Provider } from 'react-native-paper';
import { router } from 'expo-router';
import { ref, onValue, off, getDatabase, get } from 'firebase/database';
import { auth, db } from '../../firebaseConfig';

interface Session {
  date: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface CourseProps {
  id: string;
  title: string;
  code: string;
  organizer: string;
  sessions: Session[];
}

// Utility function for date parsing and formatting
const formatDateTime = (isoDate: string): { day: string; date: string; time: string } => {
  const date = new Date(isoDate);

  // Format the day and time
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = dayNames[date.getDay()];
  const dateFormatted = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return { day, date: dateFormatted, time: timeFormatted };
};

// CourseCard component
const CourseCard: React.FC<CourseProps> = ({ id, title, code, sessions, organizer }) => {
  const { colors } = useTheme();

  const handleSessionDetails = (session: any) => {
    console.log(session);
    router.push({
      pathname: '/attendance/test',
      params: {
        eventId: id,
        eventName: title,
        sessionId: session.sessionId,
        sessionDay: session.day,
        sessionDate: session.date,
        sessionTime: `${session.startTime} - ${session.endTime}`,
      },
    });
  };
  
  const handleMoreDetails = () => {
    router.push({
      pathname: '/eventMgmt/detail',
      params: {
        course: title,
        code,
        eventId: id,
        organizer,
        sessions: JSON.stringify(sessions),
      },
    });
    console.log(JSON.stringify(sessions));
  };

  return (
    <Card style={styles.courseCard}>
      <Card.Title
        title={title}
        titleVariant="titleLarge"
        subtitle={`${code} - ${organizer}`}
        subtitleVariant="titleSmall"
      />
      <Card style={[styles.sessionsCard, { backgroundColor: colors.elevation.level2 }]}>
        <Card.Title title="Sessions" titleVariant="titleMedium" />
        <Card.Content>
          {sessions.map((session, index) => (
            <TouchableOpacity
            key={index}
            style={styles.sessionRow}
            onPress={() => handleSessionDetails(session)}
            >
              <Text>{session.day}</Text>
              <Text>{session.startTime} - {session.endTime}</Text>
            </TouchableOpacity>
          ))}
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleMoreDetails}>More Details</Button>
        </Card.Actions>
      </Card>
    </Card>
  );
};

// AllEvents component
const AllEvents: React.FC = () => {
  const { colors } = useTheme();
  const [courses, setCourses] = useState<CourseProps[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = React.useState(false);

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
          setProfilePicture(null); // No profile picture uploaded
      }
  };
  
  const fetchCourses = useCallback(() => {
    const userAuth = auth.currentUser; // Get the logged-in user
    const userId = userAuth?.uid;
  
    if (!userId) {
      console.error("User is not logged in.");
      setCourses([]); // Clear courses if no user is logged in
      return;
    }
  
    const eventsRef = ref(db, 'events');
  
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedCourses = Object.entries(data)
          .filter(([id, event]: [string, any]) => event.organizerId === userId) // Filter events for the logged-in user
          .map(([id, event]: [string, any]) => ({
            id,
            title: event.name,
            code: event.code,
            organizer: event.organizer,
            sessions: Object.entries(event.sessions || {}).map(([sessionId, session]: [string, any]) => {
              const { day, date, time: startTime } = formatDateTime(session.startTime);
              const { time: endTime } = formatDateTime(session.endTime);
  
              return {
                sessionId,
                day,
                date,
                startTime,
                endTime,
              };
            }),
          }));
        setCourses(loadedCourses);
      } else {
        setCourses([]); // No data found
      }
    });
  
    return () => off(eventsRef);
  }, []);
  

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
    setRefreshing(false);
  }, [fetchCourses]);

  return (
    <Provider >
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
        {courses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
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
      </ScrollView>
    </Provider>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
  },
  courseCard: {
    marginBottom: 16,
  },
  sessionsCard: {
    margin: 5,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
});

export default AllEvents;
