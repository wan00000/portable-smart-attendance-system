import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Card, useTheme, Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../firebaseConfig';

interface Session {
  day: string;
  time: string;
}

interface CourseProps {
  id: string;
  title: string;
  code: string;
  organizer: string;
  sessions: Session[];
}

const CourseCard: React.FC<CourseProps> = ({ id, title, code, sessions, organizer }) => {
  const { colors } = useTheme();

  const handleMoreDetails = () => {
    router.push({
      pathname: '/eventMgmt/detail',
      params: {
        course: title,
        code,
        eventId: id,
        organizer,
        sessions: JSON.stringify(sessions), // Pass the sessions as a JSON string
      },
    });
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
            <View key={index} style={styles.sessionRow}>
              <Text>{session.day}</Text>
              <Text>{session.time}</Text>
            </View>
          ))}
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleMoreDetails}>More Details</Button>
        </Card.Actions>
      </Card>
    </Card>
  );
};

const AllEvents: React.FC = () => {
  const { colors } = useTheme();
  const [courses, setCourses] = useState<CourseProps[]>([]);

  useEffect(() => {
    const eventsRef = ref(db, 'events');

    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedCourses = Object.entries(data).map(([id, event]: [string, any]) => ({
          id, // Include the eventId
          title: event.name,
          code: event.code,
          organizer: event.organizer,
          sessions: Object.entries(event.sessions || {}).map(([sessionId, session]: [string, any]) => ({
            sessionId, // Include sessionId
            day: session.day,
            time: session.time, // Use the "time" property directly from the database structure
          })),
        }));
        setCourses(loadedCourses);
      }
    });

    return () => off(eventsRef);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {courses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

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
});

export default AllEvents;
