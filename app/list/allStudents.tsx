import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { Card, Divider, List, useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../firebaseConfig';

interface Student {
  id: string;
  name: string;
  matricNumber: string;
}

const StudentItem: React.FC<{ student: Student }> = ({ student }) => (
  <>
    <List.Item
      title={student.name}
      right={() => <Text style={styles.matricNumber}>{student.matricNumber}</Text>}
      style={styles.listItem}
    />
    <Divider />
  </>
);

export default function AllStudents() {
  const { colors } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const studentsRef = ref(db, 'students');

    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedStudents = Object.entries(data).map(([id, student]: [string, any]) => ({
          id,
          name: `${student.firstName} ${student.lastName}`,
          matricNumber: student.matric,
        }));
        setStudents(loadedStudents);
      }
    });

    return () => off(studentsRef); // Clean up the listener when the component unmounts
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="List of Students" />
          <Card.Content style={[styles.innerCard, { backgroundColor: colors.elevation.level2 }]}>
            <FlatList
              data={students}
              renderItem={({ item }) => <StudentItem student={item} />}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 10,
  },
  innerCard: {
    borderRadius: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  matricNumber: {
    alignSelf: 'center',
    fontWeight: 'bold',
  },
});
