import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Appbar, Button, Card, Menu, TextInput, useTheme } from 'react-native-paper';
import { DatePickerInput, enGB, registerTranslation } from 'react-native-paper-dates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, push, update, onValue } from "firebase/database";

registerTranslation("en", enGB);

interface FormData {
  firstName: string;
  lastName: string;
  matric: string;
  card: string;
  address: string;
  gender: string;
  phone: string;
  birthdate: Date;
  course: string; // Stores the selected event ID
}

interface InputField {
  label: string;
  value: keyof FormData;
  icon: string;
}

const inputFields: InputField[] = [
  { label: "First Name", value: "firstName", icon: "account" },
  { label: "Last Name", value: "lastName", icon: "account" },
  { label: "Matric No", value: "matric", icon: "identifier" },
  { label: "Card No", value: "card", icon: "card-account-details" },
  { label: "Address", value: "address", icon: "home" },
  { label: "Gender", value: "gender", icon: "gender-male-female" },
  { label: "Phone Number", value: "phone", icon: "phone" },
];

const FormInput: React.FC<{
  field: InputField;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ field, value, onChangeText }) => (
  <TextInput 
    label={field.label}
    value={value}
    onChangeText={onChangeText}
    mode='outlined'
    style={styles.input}
    left={<TextInput.Icon icon={field.icon} />}
  />
);

const SelectCourseMenu: React.FC<{
  course: string;
  onSelect: (courseId: string, courseName: string) => void;
  availableEvents: { id: string; name: string }[];
}> = ({ course, onSelect, availableEvents }) => {
  const [visible, setVisible] = useState(false);
  
  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button 
          onPress={() => setVisible(true)} 
          mode='outlined'
          icon='menu-down'
          contentStyle={{ flexDirection: 'row-reverse' }}
          style={styles.courseButton}
        >
          {course || "Select Event"}
        </Button>
      }
    >
      {availableEvents.map(({ id, name }) => (
        <Menu.Item 
          key={id} 
          onPress={() => {
            onSelect(id, name);
            setVisible(false);
          }} 
          title={name} 
        />
      ))}
    </Menu>
  );
};

const Add: React.FC = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    matric: "",
    card: "",
    address: "",
    gender: "",
    phone: "",
    birthdate: new Date(),
    course: "",
  });
  const [availableEvents, setAvailableEvents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, "events");

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events = snapshot.val();
      const eventList = events 
        ? Object.entries(events).map(([id, { name }]: any) => ({ id, name }))
        : [];
      setAvailableEvents(eventList);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  const handleInputChange = (name: keyof FormData, value: string | Date) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleBackAction = () => {
    router.back();
  };

  const handleRegisterStudent = async () => {
    const db = getDatabase();
    const studentId = push(ref(db, "students")).key;

    if (!studentId) {
      Alert.alert("Error", "Unable to generate student ID.");
      return;
    }

    const newStudent = {
      address: formData.address,
      birthDate: formData.birthdate.toISOString().split("T")[0],
      cardNo: formData.card,
      enrolledEvents: {
        [formData.course]: true,
      },
      firstName: formData.firstName,
      gender: formData.gender,
      lastName: formData.lastName,
      matric: formData.matric,
      phoneNo: formData.phone,
    };

    try {
      await update(ref(db, `students/${studentId}`), newStudent);
      Alert.alert("Success", "Student registered successfully!");
      router.back();
    } catch (error) {
      console.error("Error registering student:", error);
      Alert.alert("Error", "Failed to register student. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content title="Register Student" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title 
            title="Personal Information" 
            left={(props) => <MaterialCommunityIcons name="account-details" size={24} color={colors.primary} />}
          />
          <Card.Content>
            {inputFields.map((field) => (
              <FormInput
                key={field.value}
                field={field}
                value={formData[field.value]}
                onChangeText={(text) => handleInputChange(field.value, text)}
              />
            ))}
            <DatePickerInput 
              locale="en"
              label="Birthdate"
              value={formData.birthdate}
              onChange={(date) => handleInputChange('birthdate', date || new Date())}
              inputMode="start"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="calendar" />}
            />
            <SelectCourseMenu
              course={formData.course}
              onSelect={(id, name) => handleInputChange('course', id)} //we cant have the event name as the input value in order to push the eventId to rldb
              availableEvents={availableEvents}
            />
          </Card.Content>
        </Card>

        <Button 
          mode='contained' 
          style={styles.registerButton} 
          icon="account-plus"
          onPress={handleRegisterStudent}
        >
          Register Student
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { marginBottom: 16 },
  input: { marginBottom: 12 },
  courseButton: { marginTop: 8 },
  registerButton: { marginTop: 8 },
});

export default Add;
