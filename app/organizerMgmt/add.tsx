import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Appbar, Button, Card, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, push, update } from "firebase/database";

interface FormData {
  firstName: string;
  lastName: string;
  code: string; // Added code field
}

interface InputField {
  label: string;
  value: keyof FormData;
  icon: string;
}

const inputFields: InputField[] = [
  { label: "First Name", value: "firstName", icon: "account" },
  { label: "Last Name", value: "lastName", icon: "account" },
  { label: "Code", value: "code", icon: "barcode" }, // Added code field to input fields
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

const Add: React.FC = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    code: "", // Initialize code field
  });

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleBackAction = () => {
    router.back();
  };

  const handleRegisterOrganizer = async () => {
    const db = getDatabase();
    const organizerId = push(ref(db, "organizers")).key;

    if (!organizerId) {
      Alert.alert("Error", "Unable to generate organizer ID.");
      return;
    }

    const newOrganizer = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      code: formData.code, // Include code in the new organizer object
    };

    try {
      await update(ref(db, `organizers/${organizerId}`), newOrganizer);
      Alert.alert("Success", "Organizer registered successfully!");
      router.back();
    } catch (error) {
      console.error("Error registering organizer:", error);
      Alert.alert("Error", "Failed to register organizer. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content title="Register Organizer" />
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
          </Card.Content>
        </Card>

        <Button 
          mode='contained' 
          style={styles.registerButton} 
          icon="account-plus"
          onPress={handleRegisterOrganizer}
        >
          Register Organizer
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
