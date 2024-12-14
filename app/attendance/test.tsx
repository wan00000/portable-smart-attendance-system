import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  DataTable,
  useTheme,
  Text,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { getDatabase, ref, get } from 'firebase/database';

interface Student {
  id: string;
  name: string;
  matric: string;
}

interface AttendanceRecord {
  checkInTime?: string;
  checkOutTime?: string;
  status: 'onTime' | 'late' | 'absent';
}

interface RouteParams {
  eventId: string;
  sessionId: string;
  eventName: string;
  sessionDay: string;
  sessionDate: string;
  sessionTime: string;
}

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

export default function Test() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const route = useRoute();
  const { eventId, sessionId, eventName, sessionDay, sessionDate, sessionTime } =
    route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [onTimeStudents, setOnTimeStudents] = useState<Student[]>([]);
  const [lateStudents, setLateStudents] = useState<Student[]>([]);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);

  const getSessionNumber = (sessionId: string): string => {
    const match = sessionId.match(/session-(\d+)$/);
    if (match) {
      return `Session ${parseInt(match[1]) + 1}`; // Convert 0-based index to 1-based
    }
    return 'Unknown Session';
  };

  const sessionNumber = getSessionNumber(sessionId);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      console.log('Starting fetchAttendanceData...');
      console.log('Event ID:', eventId);
      console.log('Session ID:', sessionId);

      try {
        const db = getDatabase();
        const attendanceRef = ref(db, `attendance/${eventId}/${sessionId}`);
        const studentsRef = ref(db, 'students');

        console.log('Fetching attendance data...');
        const [attendanceSnapshot, studentsSnapshot] = await Promise.all([
          get(attendanceRef),
          get(studentsRef),
        ]);

        console.log('Attendance Snapshot Exists:', attendanceSnapshot.exists());
        console.log('Students Snapshot Exists:', studentsSnapshot.exists());

        if (!attendanceSnapshot.exists() || !studentsSnapshot.exists()) {
          console.log('No attendance or student data found.');
          setLoading(false);
          return;
        }

        const attendanceData = attendanceSnapshot.val();
        const studentsData = studentsSnapshot.val();

        console.log('Attendance Data:', attendanceData);
        console.log('Students Data:', studentsData);

        const onTime: Student[] = [];
        const late: Student[] = [];
        const absent: Student[] = [];

        for (const studentId in attendanceData) {
          const record: AttendanceRecord = attendanceData[studentId];
          const student = studentsData[studentId];

          if (!student) {
            console.log(`Student not found for ID: ${studentId}`);
            continue;
          }

          const studentInfo: Student = {
            id: studentId,
            name: `${student.firstName} ${student.lastName}`,
            matric: student.matric,
          };

          console.log(`Processing student: ${studentInfo.name}`);
          console.log(`Status: ${record.status}`);

          switch (record.status) {
            case 'onTime':
              onTime.push(studentInfo);
              break;
            case 'late':
              late.push(studentInfo);
              break;
            case 'absent':
              absent.push(studentInfo);
              break;
            default:
              console.log(`Unknown status for student ${studentInfo.name}`);
              break;
          }
        }

        console.log('On Time Students:', onTime);
        console.log('Late Students:', late);
        console.log('Absent Students:', absent);

        setOnTimeStudents(onTime);
        setLateStudents(late);
        setAbsentStudents(absent);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
        console.log('fetchAttendanceData completed.');
      }
    };

    fetchAttendanceData();
  }, [eventId, sessionId]);

  if (loading) {
    console.log('Loading data...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  console.log('Rendering student lists...');
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={eventName} />
      </Appbar.Header>

      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Session Details" />
          <Card.Content>
            <Text>Session Number: {sessionNumber}</Text>
            <Text>Day: {sessionDay}</Text>
            <Text>Date: {sessionDate}</Text>
            <Text>Time: {sessionTime}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Breakdown" />
          <Card.Content style={styles.breakdownContent}>
            <Chip icon="check" style={styles.chip} textStyle={{fontSize: 11}}>
              On Time: {onTimeStudents.length}
            </Chip>
            <Chip icon="clock-alert" style={styles.chip} textStyle={{fontSize: 11}}>
              Late: {lateStudents.length}
            </Chip>
            <Chip icon="close" style={styles.chip} textStyle={{fontSize: 11}}>
              Absent: {absentStudents.length}
            </Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="On Time" />
          <Card.Content>
            <StudentList data={onTimeStudents} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Late" />
          <Card.Content>
            <StudentList data={lateStudents} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Absent" />
          <Card.Content>
            <StudentList data={absentStudents} />
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={() => {
                      router.push({
                        pathname: '/attendance/edit',
                        params: {
                          eventId,
                          eventName,
                          sessionId,
                          sessionDay,
                          sessionDate,
                          sessionTime,
                        },
                      });
                    }}
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
  breakdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    marginHorizontal: 2,
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
  }
});
