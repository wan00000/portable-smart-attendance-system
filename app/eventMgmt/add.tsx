import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Appbar, Button, Card, Menu, TextInput, useTheme, List, Divider, IconButton } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

type EventInfo = {
  name: string;
  code: string;
  organizer: string;
  organizerId: string;
  day: string;
  startTime: string;
  endTime: string;
};

type InputField = {
  label: string;
  value: keyof EventInfo;
  icon: string;
};

type OnConfirm = {
  hours: number;
  minutes: number;
};

type Session = {
  day: string;
  startTime: string;
  endTime: string;
};

const inputFields: InputField[] = [
  { label: "Event Name", value: "name", icon: "book-open-variant" },
  { label: "Code", value: "code", icon: "barcode" },
];

const OrganizerSelector: React.FC<{
  organizer: string;
  onSelect: (organizerId: string, organizerName: string) => void;
  availableOrganizers: { id: string; name: string }[];
}> = ({ organizer, onSelect, availableOrganizers }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <List.Accordion
      title={organizer || "Select Organizer"}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      left={(props) => <List.Icon {...props} icon="account" />}
    >
      {availableOrganizers.map(({ id, name }) => (
        <List.Item
          key={id}
          title={name}
          onPress={() => {
            onSelect(id, name);
            setExpanded(false); // Close accordion after selection
          }}
        />
      ))}
    </List.Accordion>
  );
};


const ScheduleList: React.FC<{ sessions: Session[]; onRemove: (index: number) => void }> = ({
  sessions,
  onRemove,
}) => (
  <>
    {sessions.map((session, index) => (
      <React.Fragment key={index}>
        <List.Item
          title={session.day}
          description={`${new Date(session.startTime).toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${new Date(session.endTime).toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`}
          left={(props) => <List.Icon {...props} icon="clock-outline" />}
          right={(props) => (
            <IconButton
              {...props}
              icon="trash-can-outline"
              onPress={() => onRemove(index)}
            />
          )}
        />
        <Divider />
      </React.Fragment>
    ))}
  </>
);

const AddEvent: React.FC = () => {
  const { colors } = useTheme();
  const [eventInfo, setEventInfo] = useState<EventInfo>({
    name: "",
    code: "",
    organizer: "",
    organizerId: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  const [availableOrganizers, setAvailableOrganizers] = useState<
    { id: string; name: string }[]
  >([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');

  useEffect(() => {
    const db = getDatabase();
    const organizersRef = ref(db, 'organizers');

    const unsubscribe = onValue(organizersRef, (snapshot) => {
      const data = snapshot.val();
      const organizerList = data
        ? Object.entries(data).map(([id, { firstName, lastName }]: any) => ({
            id,
            name: `${firstName} ${lastName}`,
          }))
        : [];
      setAvailableOrganizers(organizerList);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  const handleInputChange = (field: keyof EventInfo, value: string) => {
    setEventInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackAction = () => {
    router.back();
  };

  const onConfirmTimePicker = ({ hours, minutes }: OnConfirm) => {
    setTimePickerVisible(false);
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    handleInputChange(timePickerMode === 'start' ? 'startTime' : 'endTime', time);
  };

  const openTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    setTimePickerVisible(true);
  };

  const addSession = () => {
    if (!eventInfo.day || !eventInfo.startTime || !eventInfo.endTime) {
      Alert.alert("Error", "Please fill in all session details.");
      return;
    }
  
    try {
      // Construct ISO 8601 date strings
      const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
  
      const currentDate = new Date();
      const currentDay = currentDate.getDay();
      const targetDay = dayMap[eventInfo.day];
      const dayDifference = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
  
      const sessionDate = new Date(currentDate);
      sessionDate.setDate(currentDate.getDate() + dayDifference);
  
      const startTime = new Date(
        `${sessionDate.toISOString().split('T')[0]}T${eventInfo.startTime}:00+08:00`
      ).toISOString();
  
      const endTime = new Date(
        `${sessionDate.toISOString().split('T')[0]}T${eventInfo.endTime}:00+08:00`
      ).toISOString();
  
      // Create new session object
      const newSession: Session = {
        day: eventInfo.day,
        startTime,
        endTime,
      };
  
      // Add session to the list
      setSessions((prev) => [...prev, newSession]);
  
      // Reset input fields
      handleInputChange("day", "");
      handleInputChange("startTime", "");
      handleInputChange("endTime", "");
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert("Error", "Invalid session details. Please try again.");
    }
  };

  const removeSession = (index: number) => {
    setSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const pushToFirebase = async () => {
    const db = getDatabase();
    const eventsRef = ref(db, "events");
  
    try {
      // Push new event
      const newEventRef = push(eventsRef);
      const newEventId = newEventRef.key;
  
      // Prepare sessions for Firebase
      const sessionData = sessions.reduce((acc, session, index) => {
        const sessionId = `${newEventId}-session-${index}`;
        acc[sessionId] = {
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime,
        };
        return acc;
      }, {} as Record<string, Session>);
  
      // Create event payload
      const eventPayload = {
        name: eventInfo.name,
        code: eventInfo.code,
        organizer: eventInfo.organizer,
        sessions: sessionData,
      };
  
      // Write to Firebase
      await set(newEventRef, eventPayload);
  
      Alert.alert("Success", "Event created successfully!");
      router.back();
    } catch (error) {
      console.error("Error adding event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content title="Create Event" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title
            title="Event Information"
            left={(props) => <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary} />}
          />
          <Card.Content>
            {inputFields.map((field) => (
              <TextInput
                key={field.value}
                label={field.label}
                value={eventInfo[field.value]}
                onChangeText={(text) => handleInputChange(field.value, text)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon={field.icon} />}
              />
            ))}
            <OrganizerSelector
              organizer={eventInfo.organizer}
              availableOrganizers={availableOrganizers}
              onSelect={(id, name) => {
                handleInputChange("organizerId", id);
                handleInputChange("organizer", name);
              }}
            />
              <Button
              mode="text"
              onPress={() => router.push("/organizerMgmt/add")}
              icon="account-plus"
              style={styles.registerButton}
            >
              Register New Organizer
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title="Event Session"
            left={(props) => <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />}
          />
          <Card.Content>
            <TextInput
              label="Day"
              value={eventInfo.day}
              onChangeText={(text) => handleInputChange("day", text)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="calendar" />}
            />
            <View style={styles.timeContainer}>
              <Button
                onPress={() => openTimePicker('start')}
                mode="outlined"
                icon="clock-start"
                style={styles.timeButton}
              >
                {eventInfo.startTime || "Start Time"}
              </Button>
              <Button
                onPress={() => openTimePicker('end')}
                mode="outlined"
                icon="clock-end"
                style={styles.timeButton}
              >
                {eventInfo.endTime || "End Time"}
              </Button>
            </View>
            <Button mode="contained" icon="plus" style={styles.addSessionButton} onPress={addSession}>
              Add Session
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title="Schedules"
            left={(props) => <MaterialCommunityIcons name="calendar-multiple-check" size={24} color={colors.primary} />}
          />
          <Card.Content>
            <ScheduleList sessions={sessions} onRemove={removeSession} />
          </Card.Content>
        </Card>

        <Button mode="contained" icon="check" style={styles.createButton} onPress={pushToFirebase}>
          Create Event
        </Button>
      </ScrollView>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={onConfirmTimePicker}
        hours={12}
        minutes={0}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { marginBottom: 16 },
  input: { marginBottom: 12 },
  registerButton: { marginTop: 8 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  timeButton: { flex: 1, marginRight: 8 },
  addSessionButton: { marginTop: 8 },
  createButton: { marginTop: 16 },
});

export default AddEvent;
