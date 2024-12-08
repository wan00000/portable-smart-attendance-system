import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Appbar, Button, Card, Divider, List, Text, TextInput, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { push, ref, update } from 'firebase/database';
import { db } from '../../firebaseConfig';

type TimePickerConfirmParams = {
  hours: number;
  minutes: number;
};

interface RouteParams {
  eventName: string;
  organizerName: string;
  sessions: string; // JSON stringified sessions
  eventId: string;
}

interface Session {
  sessionId?: string;
  day: string;
  time: string;
}

const ScheduleList: React.FC<{ day: string; time: string }> = ({ day, time }) => (
  <List.Item
    title={day}
    description={time}
    left={(props) => <List.Icon {...props} icon="clock-outline" />}
  />
);

export default function Edit() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [eventName, setEventName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  const [sessionDay, setSessionDay] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState({ hours: 8, minutes: 0 });
  const [sessionEndTime, setSessionEndTime] = useState({ hours: 10, minutes: 0 });
  const [isStartTimePicker, setIsStartTimePicker] = useState(true);

  const route = useRoute();
  const { eventName: eventNameParam, organizerName: organizerNameParam, sessions: sessionsParam, eventId } =
    route.params as RouteParams;

  useEffect(() => {
    setEventName(eventNameParam);
    setOrganizerName(organizerNameParam);

    // Parse sessions from the JSON string
    if (sessionsParam) {
      setSessions(JSON.parse(sessionsParam));
    }
  }, [eventNameParam, organizerNameParam, sessionsParam]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const onConfirm = useCallback(
    ({ hours, minutes }: TimePickerConfirmParams) => {
      setVisible(false);
      if (isStartTimePicker) {
        setSessionStartTime({ hours, minutes });
      } else {
        setSessionEndTime({ hours, minutes });
      }
    },
    [isStartTimePicker]
  );

  const renderTimeButton = (label: string, time: { hours: number; minutes: number }, isStart: boolean) => (
    <Button
      onPress={() => {
        setIsStartTimePicker(isStart);
        setVisible(true);
      }}
      mode="outlined"
      style={styles.timeButton}
    >
      {`${label}: ${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`}
    </Button>
  );

  const addSession = () => {
    const startTimeString = `${sessionStartTime.hours.toString().padStart(2, "0")}:${sessionStartTime.minutes
      .toString()
      .padStart(2, "0")}`;
    const endTimeString = `${sessionEndTime.hours.toString().padStart(2, "0")}:${sessionEndTime.minutes
      .toString()
      .padStart(2, "0")}`;

    setSessions((prevSessions) => [
      ...prevSessions,
      { day: sessionDay, time: `${startTimeString} - ${endTimeString}` },
    ]);

    // Reset form fields
    setSessionDay("");
    setSessionStartTime({ hours: 8, minutes: 0 });
    setSessionEndTime({ hours: 10, minutes: 0 });
    setShowSessionForm(false);
  };

  const renderSessionForm = () => (
    <Card style={styles.sessionFormCard}>
      <Card.Content>
        <TextInput
          label="Day"
          value={sessionDay}
          onChangeText={setSessionDay}
          mode="outlined"
          style={styles.input}
        />
        {renderTimeButton("Start Time", sessionStartTime, true)}
        {renderTimeButton("End Time", sessionEndTime, false)}
        <Button mode="contained" style={styles.addButton} onPress={addSession}>
          Add Session
        </Button>
      </Card.Content>
    </Card>
  );

  const updateEventInFirebase = async () => {
    try {
      // Generate unique session IDs and structure the sessions
      const updatedSessions = sessions.map((session) => {
        const sessionId = push(ref(db, 'sessions')).key || `fallback-${Date.now()}`; // Generate a unique key for each session
        return {
          sessionId,
          day: session.day,
          time: session.time,
        };
      });
  
      // Prepare the updated event structure
      const updatedEvent = {
        name: eventName,
        organizer: organizerName,
        sessions: updatedSessions.reduce((acc, session) => {
          if (session.sessionId) {
            acc[session.sessionId] = { day: session.day, time: session.time };
          }
          return acc;
        }, {} as Record<string, { day: string; time: string }>), // Store sessions as an object with sessionId as the key
      };
  
      // Update the event in the database
      await update(ref(db, `events/${eventId}`), updatedEvent);
  
      Alert.alert("Success", "Event updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error", "Failed to update event. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Event" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title title="Event Information" titleVariant="titleMedium" />
          <Card.Content>
            <TextInput
              label="Event Name"
              value={eventName}
              onChangeText={setEventName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Organizer Name"
              value={organizerName}
              onChangeText={setOrganizerName}
              mode="outlined"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Schedules" />
          <Card.Content>
            {sessions.map((session, index) => (
              <ScheduleList key={index} day={session.day} time={session.time} />
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => setShowSessionForm(!showSessionForm)}>
              {showSessionForm ? "Cancel" : "New Session"}
            </Button>
          </Card.Actions>
        </Card>

        {showSessionForm && renderSessionForm()}


      </ScrollView>
      <Button mode="contained" style={styles.updateButton} onPress={updateEventInFirebase}>
        Update Event
      </Button>

      <TimePickerModal
        visible={visible}
        onDismiss={onDismiss}
        onConfirm={onConfirm}
        hours={isStartTimePicker ? sessionStartTime.hours : sessionEndTime.hours}
        minutes={isStartTimePicker ? sessionStartTime.minutes : sessionEndTime.minutes}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  timeButton: {
    marginBottom: 12,
  },
  sessionFormCard: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 12,
  },
  updateButton: {
    margin: 16,

  },
});
