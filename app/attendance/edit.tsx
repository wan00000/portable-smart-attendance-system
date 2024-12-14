import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, useTheme, ActivityIndicator } from 'react-native-paper';
import { getDatabase, ref, get } from 'firebase/database';

interface RouteParams {
  eventId: string;
  sessionId: string;
  eventName: string;
  sessionDay: string;
  sessionDate: string;
  sessionTime: string;
}

type MenuOption = {
  label: string;
  value: string;
};

const statusOptions: MenuOption[] = [
  { label: "On Time", value: "onTime" },
  { label: "Late", value: "late" },
  { label: "Absent", value: "absent" },
];

export default function Manual() {
  const { colors } = useTheme();
  const route = useRoute();
  const { eventId, sessionId, eventName, sessionDay, sessionDate, sessionTime } =
    route.params as RouteParams;

  const [participantOptions, setParticipantOptions] = useState<MenuOption[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    participant: false,
    status: false,
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const db = getDatabase();
        const participantsRef = ref(db, `attendance/${eventId}/${sessionId}`);
        const studentsRef = ref(db, 'students');

        const [attendanceSnapshot, studentsSnapshot] = await Promise.all([
          get(participantsRef),
          get(studentsRef),
        ]);

        if (!attendanceSnapshot.exists() || !studentsSnapshot.exists()) {
          console.log('No attendance or students data found.');
          return;
        }

        const attendanceData = attendanceSnapshot.val();
        const studentsData = studentsSnapshot.val();

        const options = Object.keys(attendanceData)
          .map((studentId) => {
            const student = studentsData[studentId];
            if (student) {
              return {
                label: `${student.firstName} ${student.lastName}`,
                value: studentId,
              };
            }
            return null;
          })
          .filter(Boolean) as MenuOption[];

        setParticipantOptions(options);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId, sessionId]);

  const handleSelect = (
    value: string,
    type: 'participant' | 'status'
  ) => {
    if (type === 'participant') {
      setSelectedParticipant(value);
    } else if (type === 'status') {
      setSelectedStatus(value);
    }

    // Close dropdown
    setExpanded((prev) => ({ ...prev, [type]: false }));
  };

  const renderOptionList = (
    options: MenuOption[],
    selectedValue: string | null,
    onSelect: (value: string) => void,
    title: string,
    expandedKey: 'participant' | 'status'
  ) => (
    <List.Accordion
      style={{ backgroundColor: colors.elevation.level1 }}
      title={
        selectedValue
          ? options.find((o) => o.value === selectedValue)?.label || title
          : title
      }
      expanded={expanded[expandedKey]}
      onPress={() =>
        setExpanded((prev) => ({
          ...prev,
          [expandedKey]: !prev[expandedKey],
        }))
      }
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Attendance Record" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: colors.elevation.level1 }]}>
          <Card.Title
            title={eventName}
            titleVariant="titleLarge"
            subtitle={`${sessionDay}, ${sessionDate} (${sessionTime})`}
            subtitleVariant="titleSmall"
          />
          <Card.Content>
            {renderOptionList(
              participantOptions,
              selectedParticipant,
              (value) => handleSelect(value, 'participant'),
              'Select Participant',
              'participant'
            )}
            <Divider style={styles.divider} />
            {renderOptionList(
              statusOptions,
              selectedStatus,
              (value) => handleSelect(value, 'status'),
              'Modify Status',
              'status'
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Confirmed:', {
                selectedParticipant,
                selectedStatus,
                eventId,
                sessionId,
              });
              // Implement confirmation logic here
            }}
            disabled={!selectedParticipant || !selectedStatus}
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
