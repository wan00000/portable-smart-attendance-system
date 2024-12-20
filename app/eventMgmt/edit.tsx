import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Appbar, Button, Card, Divider, List, Text, TextInput, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { push, ref, update, get } from 'firebase/database';
import { db } from '../../firebaseConfig';

type TimePickerConfirmParams = {
  hours: number;
  minutes: number;
};

interface RouteParams {
  eventName: string;
  organizerName: string;
  eventId: string;
}

interface Session {
  sessionId?: string;
  day: string;
  startTime: string; // ISO8601 format
  endTime: string;   // ISO8601 format
}

const ScheduleList: React.FC<{ day: string; startTime: string; endTime: string }> = ({ day, startTime, endTime }) => (
  <List.Item
    title={day}
    description={`${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}`}
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
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [sessionEndTime, setSessionEndTime] = useState<Date>(new Date());
  const [isStartTimePicker, setIsStartTimePicker] = useState(true);

  const route = useRoute();
  const { eventName: eventNameParam, organizerName: organizerNameParam, eventId } = route.params as RouteParams;

  useEffect(() => {
    setEventName(eventNameParam);
    setOrganizerName(organizerNameParam);

    // Fetch existing sessions from Firebase
    const fetchSessions = async () => {
      try {
        const snapshot = await get(ref(db, `events/${eventId}/sessions`));
        if (snapshot.exists()) {
          const sessionData = snapshot.val() as Record<
          string,
          { day: string; startTime: string; endTime: string }
          >;
          const formattedSessions = Object.entries(sessionData).map(([sessionId, session]) => ({
            sessionId,
            day: session.day,
            startTime: session.startTime,
            endTime: session.endTime,
          }));
          setSessions(formattedSessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, [eventId, eventNameParam, organizerNameParam]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const onConfirm = useCallback(
    ({ hours, minutes }: TimePickerConfirmParams) => {
      setVisible(false);
      const selectedDate = new Date();
      selectedDate.setHours(hours, minutes, 0, 0);
      if (isStartTimePicker) {
        setSessionStartTime(selectedDate);
      } else {
        setSessionEndTime(selectedDate);
      }
    },
    [isStartTimePicker]
  );

  const renderTimeButton = (label: string, time: Date, isStart: boolean) => (
    <Button
      onPress={() => {
        setIsStartTimePicker(isStart);
        setVisible(true);
      }}
      mode="outlined"
      style={styles.timeButton}
    >
      {`${label}: ${time.toLocaleTimeString()}`}
    </Button>
  );

  const addSession = () => {
    if (!sessionDay || !sessionStartTime || !sessionEndTime) {
      Alert.alert("Error", "Please fill all session details.");
      return;
    }

    setSessions((prevSessions) => [
      ...prevSessions,
      {
        day: sessionDay,
        startTime: sessionStartTime.toISOString(),
        endTime: sessionEndTime.toISOString(),
      },
    ]);

    // Reset form fields
    setSessionDay("");
    setSessionStartTime(new Date());
    setSessionEndTime(new Date());
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
      const updatedSessions = sessions.reduce((acc, session) => {
        const sessionId = session.sessionId || push(ref(db, `events/${eventId}/sessions`)).key;
        if (sessionId) {
          acc[sessionId] = {
            day: session.day,
            startTime: session.startTime,
            endTime: session.endTime,
          };
        }
        return acc;
      }, {} as Record<string, { day: string; startTime: string; endTime: string }>);

      const updatedEvent = {
        name: eventName,
        organizer: organizerName,
        sessions: updatedSessions,
      };

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
              <ScheduleList
                key={index}
                day={session.day}
                startTime={session.startTime}
                endTime={session.endTime}
              />
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
        hours={isStartTimePicker ? sessionStartTime.getHours() : sessionEndTime.getHours()}
        minutes={isStartTimePicker ? sessionStartTime.getMinutes() : sessionEndTime.getMinutes()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { marginBottom: 16 },
  input: { marginBottom: 12 },
  timeButton: { marginBottom: 12 },
  sessionFormCard: { marginBottom: 16 },
  addButton: { marginTop: 12 },
  updateButton: { margin: 16 },
});
