import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useRouter, useLocalSearchParams  } from 'expo-router';
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
import { NavigationContainer, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { ref, onValue, update, remove, getDatabase, get } from 'firebase/database';
import EnrollStudentModal from '@/components/EnrollStudentModal';

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
  startTime: string;
  endTime: string;
}

interface RouteParams {
  course: string;
  code: string;
  sessions: string;
  eventId: string;
  organizer: string;
}

interface StudentRemove {
  address: string;
  birthDate: string;
  cardNo: string;
  enrolledEvents?: Record<string, boolean>;
  firstName: string;
  gender: string;
  lastName: string;
  matric: string;
  phoneNo: string;
}

interface StudentsData {
  [studentId: string]: StudentRemove;
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
          description={`${session.startTime} - ${session.endTime}`}
          left={(props) => <List.Icon {...props} icon="clock-outline" />}
        />
        <Divider />
      </React.Fragment>
    ))}
  </>
);

const Details: React.FC = () => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [nonEnrolledStudents, setNonEnrolledStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const route = useRoute();
  const { course, code, sessions, eventId, organizer } = route.params as RouteParams;
  const parsedSessions: Session[] = JSON.parse(sessions);

  const fetchStudentsData = useCallback(async () => {
    try{
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
    } catch (error){
      console.error('Error fetching student data:', error);
      Alert.alert('Error', 'Failed to fetch data. Please try again later.');
    }
  }, [eventId]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentsData().finally(() => setRefreshing(false));
  }, [fetchStudentsData]);

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

  const removeEventFromFirebase = useCallback(async (eventId: string) => {
    const db = getDatabase();
    const eventRef = ref(db, `events/${eventId}`);
    const attendanceRef = ref(db, `attendance/${eventId}`);
    const studentsRef = ref(db, `students`);
  
    try {
      // Remove event node
      await remove(eventRef);
  
      // Remove attendance data for the event
      await remove(attendanceRef);
  
      // Remove the event ID from each enrolled student's `enrolledEvents`
      const studentsSnapshot = await get(studentsRef);
      if (studentsSnapshot.exists()) {
        const updates: Record<string, null> = {};
  
        const studentsData = studentsSnapshot.val() as StudentsData;
        for (const [studentId, studentData] of Object.entries(studentsData)) {
          if (studentData.enrolledEvents?.[eventId]) {
            updates[`students/${studentId}/enrolledEvents/${eventId}`] = null;
          }
        }
  
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
  
      Alert.alert("Success", "Event removed successfully!");
      router.back();
    } catch (error) {
      console.error("Error removing event:", error);
      Alert.alert("Error", "Failed to remove event. Please try again.");
    }
  }, []);

  return (
      
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content title="Event Details" />
        <Appbar.Action icon="square-edit-outline" onPress={handleEditEvent} />
      </Appbar.Header>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            />
        }
      >
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

        {/* <Modal
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
              </Modal> */}
      </ScrollView>
      <EnrollStudentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectStudent={handleStudentSelection}
        nonEnrolledStudents={nonEnrolledStudents}
        />

      <Button 
        mode="contained" 
        style={styles.removeButton}
        onPress={() => removeEventFromFirebase(eventId)}
        buttonColor={colors.error}
        textColor={colors.background}
        >
        Remove Event
      </Button>

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
  removeButton: { margin: 16 },
});

export default Details;
