import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Appbar, Button, Card, List, Text, TextInput, useTheme } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
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
  startTime: string;
  endTime: string;
}

const ScheduleList: React.FC<Session> = ({ day, startTime, endTime }) => (
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

  const [sessionDate, setSessionDate] = useState<Date | null>(null);
  const [dateVisible, setDateVisible] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [sessionEndTime, setSessionEndTime] = useState<Date>(new Date());
  const [isStartTimePicker, setIsStartTimePicker] = useState(true);

  const route = useRoute();
  const { eventName: eventNameParam, organizerName: organizerNameParam, eventId } = route.params as RouteParams;

  useEffect(() => {
    setEventName(eventNameParam);
    setOrganizerName(organizerNameParam);

    const fetchSessions = async () => {
      try {
        const snapshot = await get(ref(db, `events/${eventId}/sessions`));
        if (snapshot.exists()) {
          const sessionData = snapshot.val() as Record<string, Session>;
          const formattedSessions = Object.entries(sessionData).map(([sessionId, session]) => ({
            sessionId,
            ...session,
          }));
          setSessions(formattedSessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        Alert.alert("Error", "Failed to fetch sessions. Please try again.");
      }
    };

    fetchSessions();
  }, [eventId, eventNameParam, organizerNameParam]);

  const onDismissDatePicker = useCallback(() => {
    setDateVisible(false);
  }, []);

  const onConfirmDatePicker = useCallback((params: any) => {
    const { date } = params; // Ensure params have the correct structure
    if (date) {
        setDateVisible(false);
        setSessionDate(date);
        const startTime = new Date(date);
        startTime.setHours(8, 0, 0, 0); // Default to 8:00 AM
        const endTime = new Date(date);
        endTime.setHours(10, 0, 0, 0); // Default to 10:00 AM
        setSessionStartTime(startTime);
        setSessionEndTime(endTime);
    }
}, []);

  const onDismissTimePicker = useCallback(() => {
    setVisible(false);
  }, []);

  const onConfirmTimePicker = useCallback(
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

  const renderTimeButton = useCallback((label: string, time: Date, isStart: boolean) => (
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
  ), []);

  const addSession = useCallback(() => {
    if (!sessionDate) {
      Alert.alert("Error", "Please select a date.");
      return;
    }

    setSessions((prevSessions) => [
      ...prevSessions,
      {
        day: sessionDate.toISOString().split('T')[0],
        startTime: sessionStartTime.toISOString(),
        endTime: sessionEndTime.toISOString(),
      },
    ]);

    setSessionDate(null);
    setSessionStartTime(new Date());
    setSessionEndTime(new Date());
    setShowSessionForm(false);
  }, [sessionDate, sessionStartTime, sessionEndTime]);

  const renderSessionForm = useCallback(() => (
    <Card style={styles.sessionFormCard}>
      <Card.Content>
        <Button onPress={() => setDateVisible(true)} mode="outlined" style={styles.dateButton}>
          Select Date
        </Button>
        {sessionDate && (
          <Text style={styles.dateText}>
            {`Selected Date: ${sessionDate.toLocaleDateString()}`}
          </Text>
        )}
        {renderTimeButton("Start Time", sessionStartTime, true)}
        {renderTimeButton("End Time", sessionEndTime, false)}
        <Button mode="contained" style={styles.addButton} onPress={addSession}>
          Add Session
        </Button>
      </Card.Content>
    </Card>
  ), [sessionDate, sessionStartTime, sessionEndTime, addSession, renderTimeButton]);

  const updateEventInFirebase = useCallback(async () => {
    try {
      const updatedSessions = sessions.reduce((acc, session, index) => {
        const sessionId = `${eventId}-session-${index}`;
        
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
  
        // Ensure start and end time have the same date
        const day = startDate.toLocaleDateString("en-US", { weekday: "long" }); // "Sunday"
        const date = startDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
  
        if (startDate.toDateString() !== endDate.toDateString()) {
          endDate.setFullYear(startDate.getFullYear());
          endDate.setMonth(startDate.getMonth());
          endDate.setDate(startDate.getDate());
        }
  
        acc[sessionId] = {
          day,
          // date,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        };
  
        return acc;
      }, {} as Record<string, Omit<Session, "sessionId">>);
  
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
  }, [eventId, eventName, organizerName, sessions]);

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
              <ScheduleList key={index} {...session} />
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

      <DatePickerModal
        locale='en'
        visible={dateVisible}
        onDismiss={onDismissDatePicker}
        onConfirm={onConfirmDatePicker}
        mode="single"
      />
      
      <TimePickerModal
        visible={visible}
        onDismiss={onDismissTimePicker}
        onConfirm={onConfirmTimePicker}
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
  dateButton: { marginBottom: 12 },
  dateText: { marginBottom: 12, fontSize: 16 },
});

