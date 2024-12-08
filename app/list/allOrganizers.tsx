import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Card, Divider, List, useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';

interface Teacher {
  id: string;
  name: string;
  staffId: string;
}

const TeacherItem: React.FC<{ teacher: Teacher }> = ({ teacher }) => (
  <>
    <List.Item
      title={teacher.name}
      right={() => <Text style={styles.staffId}>{teacher.staffId}</Text>}
      style={styles.listItem}
    />
    <Divider />
  </>
);

export default function AllTeachers() {
  const { colors } = useTheme();
  const [organizers, setOrganizers] = useState<Teacher[]>([]);

  useEffect(() => {
    const organizersRef = ref(db, 'organizers');

    const unsubscribe = onValue(organizersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedOrganizers = Object.entries(data).map(([id, organizer]: [string, any]) => ({
          id,
          name: `${organizer.firstName} ${organizer.lastName}`,
          staffId: organizer.code || 'N/A',
        }));
        setOrganizers(loadedOrganizers);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        <Card.Title title="List of Organizers" />
        <Card.Content style={[styles.innerCard, { backgroundColor: colors.elevation.level2 }]}>
          <FlatList
            data={organizers}
            renderItem={({ item }) => <TeacherItem teacher={item} />}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No organizers found.</Text>}
          />
        </Card.Content>
      </Card>
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
    padding: 5,
  },
  listItem: {
    paddingVertical: 8,
  },
  staffId: {
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});
