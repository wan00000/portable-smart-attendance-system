import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Appbar, Button, Card, DataTable, useTheme, Text, List, Divider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AttendanceStatus = 'Present' | 'Absent' | 'Excused';

interface Participant {
  id: string;
  name: string;
  matric: string;
  status: AttendanceStatus;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const participantData: Participant[] = [
  { id: '1', name: 'Khairul Hafiq', matric: '210081', status: 'Present' },
  { id: '2', name: 'Aminah Kuru', matric: '210082', status: 'Absent' },
  { id: '3', name: 'Samsul Bakri', matric: '210083', status: 'Excused' },
  // Add more participants as needed
];

const getStatusColor = (status: AttendanceStatus) => {
  switch (status) {
    case 'Present':
      return 'green';
    case 'Absent':
      return 'red';
    case 'Excused':
      return 'orange';
    default:
      return '#555';
  }
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Surface style={styles.statCard} elevation={5}>
    <View style={styles.statCardContent}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </Surface>
);

export default function Detail() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const stats: StatCardProps[] = [
    { title: "Total Attendance", value: "75%", icon: "chart-arc", color: colors.primary },
    { title: "Total Participants", value: "40", icon: "account-group", color: colors.secondary },
    { title: "Absences", value: "5", icon: "account-off", color: colors.error },
    { title: "Attendees", value: "35", icon: "account-check", color: colors.inverseSurface },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => { router.back(); }} />
        <Appbar.Content title="Attendance Details" />
      </Appbar.Header>

      <ScrollView>
        <Card style={styles.card}>
          <Card.Title
            title='Career Fair'
            titleVariant='titleLarge'
            subtitle='28/10/2024'
            subtitleVariant='titleSmall'
          />
          <Card.Content>
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title='List of Participants'
          />
          <Card.Content>
            <List.Section>
              {participantData.map((participant, index) => (
                <React.Fragment key={participant.id}>
                  <List.Item
                    title={participant.name}
                    description={participant.matric}
                    right={() => (
                      <Text style={{ color: getStatusColor(participant.status), fontWeight: 'bold' }}>
                        {participant.status}
                      </Text>
                    )}
                  />
                  {index < participantData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List.Section>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => { router.push('/attendance/edit') }}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => setModalVisible(true)}
          >
            Export
          </Button>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={styles.modalTitle}>Export</Text>
            <Text style={styles.modalText}>Are you sure you want to export?</Text>
            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button onPress={() => {
                // Implement export functionality
                setModalVisible(false);
              }}>
                Export
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    elevation: 4,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statTitle: {
    fontSize: 9,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});
