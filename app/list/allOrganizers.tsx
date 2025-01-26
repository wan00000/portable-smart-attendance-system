import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ScrollView } from 'react-native';
import { Card, Divider, List, useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';

interface Organizer {
  id: string;
  name: string;
}

const OrganizerItem: React.FC<{ organizer: Organizer }> = ({ organizer }) => (
  <>
    <List.Item
      title={organizer.name}
      style={styles.listItem}
    />
    <Divider />
  </>
);

export default function AllTeachers() {
  const { colors } = useTheme();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);

  useEffect(() => {
    const usersRef = ref(db, 'users');

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedOrganizers = Object.entries(data)
          .filter(([_, user]: [string, any]) => user.role === "organizer")
          .map(([id, user]: [string, any]) => ({
            id,
            name: user.name || "Unknown Organizer",
          }));
        setOrganizers(loadedOrganizers);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.card}>
          <Card.Title title="List of Organizers" />
          <Card.Content style={[styles.innerCard, { backgroundColor: colors.elevation.level2 }]}>
            <FlatList
              data={organizers}
              renderItem={({ item }) => <OrganizerItem organizer={item} />}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No organizers found.</Text>}
              scrollEnabled={false}
              />
          </Card.Content>
        </Card>
    </ScrollView>
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
