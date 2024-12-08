import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, useTheme } from 'react-native-paper';

type MenuOption = {
  label: string;
  value: string;
};

const participantOptions: MenuOption[] = [
  { label: "Ahmad", value: "ahmad" },
  { label: "Sufian", value: "sufian" },
  { label: "Khairul", value: "khairul" },
];

const eventOptions: MenuOption[] = [
  { label: "Monday (08:00 - 10:00)", value: "monday" },
  { label: "Tuesday (08:00 - 10:00)", value: "tuesday" },
];

const statusOptions: MenuOption[] = [
  { label: "Present", value: "present" },
  { label: "Absent", value: "absent" },
  { label: "Excused", value: "excused" },
];

export default function Manual() {
  const { colors } = useTheme();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const renderOptionList = (
    options: MenuOption[],
    selectedValue: string | null,
    onSelect: (value: string) => void,
    title: string
  ) => (
    <List.Accordion
      style={{ backgroundColor: colors.elevation.level1 }}
      title={selectedValue ? options.find(o => o.value === selectedValue)?.label || title : title}
      left={props => <List.Icon {...props} icon="account-edit" />}
    >
      {options.map((option) => (
        <List.Item
          key={option.value}
          title={option.label}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </List.Accordion>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => { router.back(); }} />
        <Appbar.Content title="Edit Attendance Record" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: colors.elevation.level1 }]}>
          <Card.Title
            title="Operating Systems"
            titleVariant='titleLarge'
            subtitle="CSC3000"
            subtitleVariant='titleSmall'
          />
          <Card.Content>
            {renderOptionList(participantOptions, selectedParticipant, setSelectedParticipant, "Select Participant")}
            <Divider style={styles.divider} />
            {renderOptionList(eventOptions, selectedEvent, setSelectedEvent, "Select Session")}
            <Divider style={styles.divider} />
            {renderOptionList(statusOptions, selectedStatus, setSelectedStatus, "Modify Status")}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            mode='contained' 
            onPress={() => {
              // Implement confirmation logic here
              console.log('Confirmed:', { selectedParticipant, selectedEvent, selectedStatus });
            }}
            disabled={!selectedParticipant || !selectedEvent || !selectedStatus}
          >
            Confirm
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
