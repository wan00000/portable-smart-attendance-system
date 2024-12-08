import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Appbar,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Text,
  useTheme,
  Avatar,
  Surface,
  DataTable,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

interface Student {
  id: string;
  name: string;
  matric: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface Session {
  day: string;
  time: string;
}

interface RouteParams {
  course: string;
  code: string;
  sessions: string;
  eventId: string;
  organizer: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card style={styles.statCard} elevation={2}>
    <View style={styles.statCardContent}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </Card>
);

const StudentList: React.FC<{ data: Student[] }> = ({ data }) => (
  <DataTable>
    <DataTable.Header>
      <DataTable.Title>Name</DataTable.Title>
      <DataTable.Title numeric>Matric</DataTable.Title>
    </DataTable.Header>
    {data.map((student) => (
      <DataTable.Row key={student.id}>
        <DataTable.Cell>{student.name}</DataTable.Cell>
        <DataTable.Cell numeric>{student.matric}</DataTable.Cell>
      </DataTable.Row>
    ))}
  </DataTable>
);

const ScheduleList: React.FC<{ sessions: Session[] }> = ({ sessions }) => (
  <>
    {sessions.map((session, index) => (
      <React.Fragment key={index}>
        <List.Item
          title={session.day}
          description={session.time}
          left={(props) => <List.Icon {...props} icon="clock-outline" />}
        />
        <Divider />
      </React.Fragment>
    ))}
  </>
);

const Details: React.FC = () => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [nonEnrolledStudents, setNonEnrolledStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const route = useRoute();
  const { course, code, sessions, eventId, organizer } = route.params as RouteParams;
  const parsedSessions: Session[] = JSON.parse(sessions);

  useEffect(() => {
    const studentsRef = ref(db, 'students');

    // Fetch and separate students into enrolled and non-enrolled
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const enrolled: Student[] = [];
        const nonEnrolled: Student[] = [];

        Object.entries(data).forEach(([id, student]: [string, any]) => {
          const studentData: Student = {
            id,
            name: `${student.firstName} ${student.lastName}`,
            matric: student.matric,
          };

          if (student.enrolledEvents?.[eventId]) {
            enrolled.push(studentData);
          } else {
            nonEnrolled.push(studentData);
          }
        });

        setEnrolledStudents(enrolled);
        setNonEnrolledStudents(nonEnrolled);
      }
    });
  }, [eventId]);

  const enrollStudentInEvent = (studentId: string) => {
    const studentRef = ref(db, `students/${studentId}`);
    const eventRef = ref(db, `events/${eventId}`);

    update(studentRef, {
      [`enrolledEvents/${eventId}`]: true,
    })
      .then(() => {
        console.log(`Student ${studentId} enrolled in event ${eventId}`);
        onValue(eventRef, (snapshot) => {
          const eventData = snapshot.val();
          if (eventData && eventData.quota > 0) {
            update(eventRef, { quota: eventData.quota - 1 });
          }
        });
      })
      .catch((error) => console.error('Error enrolling student:', error));
  };

  const handleStudentSelection = (studentId: string) => {
    enrollStudentInEvent(studentId);
    setModalVisible(false);
  };

  const handleBackAction = () => router.back();

  const handleEditEvent = () => {
    router.push({
      pathname: '/eventMgmt/edit',
      params: {
        eventName: course,
        organizerName: organizer,
        sessions: JSON.stringify(parsedSessions),
        eventId,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content title="Event Details" />
        <Appbar.Action icon="square-edit-outline" onPress={handleEditEvent} />
      </Appbar.Header>

      <ScrollView>
        <Card style={styles.card}>
          <Card.Title
            title={course}
            subtitle={`${code} - ${organizer}`}
            left={(props) => <Avatar.Icon {...props} icon="calendar" />}
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
            title="Participants"
            right={(props) => (
              <IconButton {...props} icon="account-plus" onPress={() => setModalVisible(true)} />
            )}
          />
          <Card.Content>
            <StudentList data={enrolledStudents} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Schedules" />
          <Card.Content>
            <ScheduleList sessions={parsedSessions} />
          </Card.Content>
        </Card>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Surface style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Select Student to Enroll
              </Text>
              <FlatList
                data={nonEnrolledStudents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={() => handleStudentSelection(item.id)}
                  >
                    <Text>
                      {item.name} ({item.matric})
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <Button
                mode="text"
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </Surface>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16 },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: { flex: 1, margin: 4, borderRadius: 8, elevation: 4 },
  statCardContent: { padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statTitle: { fontSize: 9, textAlign: 'center', flexWrap: 'wrap' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  cancelButton: { marginTop: 16 },
});

export default Details;
