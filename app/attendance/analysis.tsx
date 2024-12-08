import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Text, useTheme, Searchbar, DataTable, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';

interface RouteParams {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface AttendanceData {
  date: string;
  onTime: number;
  late: number;
  absent: number;
}

interface Attendee {
  id: string;
  name: string;
  status: string;
  timestamp: string;
}

const attendanceData: AttendanceData[] = [
  { date: '2023-05-01', onTime: 40, late: 5, absent: 5 },
  { date: '2023-05-02', onTime: 38, late: 7, absent: 5 },
  { date: '2023-05-03', onTime: 42, late: 3, absent: 5 },
  { date: '2023-05-04', onTime: 39, late: 6, absent: 5 },
  { date: '2023-05-05', onTime: 41, late: 4, absent: 5 },
];

const attendeeList: Attendee[] = [
  { id: '1', name: 'Kamal Arif', status: 'On Time', timestamp: '09:00 AM' },
  { id: '2', name: 'Kamal Ayub', status: 'Late', timestamp: '09:15 AM' },
  { id: '3', name: 'Sufian Hasan', status: 'Absent', timestamp: '-' },
  { id: '4', name: 'Sultan Hasan', status: 'On Time', timestamp: '08:55 AM' },
  { id: '5', name: 'Arif Uhlul', status: 'Late', timestamp: '09:10 AM' },
];

const AttendanceAnalysisScreen: React.FC = () => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const route = useRoute();
  const { title, value, icon, color } = route.params as RouteParams;

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth * 0.84; // Set the chart width to 90% of the screen width
  const chartHeight = Dimensions.get('window').height * 0.3; // Set the chart height to 30% of the screen height

  const chartData = {
    labels: attendanceData.map(data => data.date.slice(-2)),
    datasets: [
      {
        data: attendanceData.map(data => data.onTime + data.late),
        color: (opacity = 1) => color,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) => color,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const filteredAttendees = attendeeList.filter(attendee =>
    attendee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAttendeeItem = (attendee: Attendee) => (
    <DataTable.Row key={attendee.id}>
      <DataTable.Cell>{attendee.name}</DataTable.Cell>
      <DataTable.Cell>{attendee.status}</DataTable.Cell>
      <DataTable.Cell>{attendee.timestamp}</DataTable.Cell>
    </DataTable.Row>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={title} />
        <Appbar.Action icon="calendar" onPress={() => {/* Handle date range selection */}} />
      </Appbar.Header>

      <ScrollView>
        <Card style={[styles.mainCard, { backgroundColor: color, opacity: 0.85 }]}>
          <View style={styles.mainCardContent}>
            <MaterialCommunityIcons name={icon} size={48} color={colors.onBackground} />
            <Text style={[styles.mainCardValue, { color: colors.onBackground }]}>{value}</Text>
          </View>
          <Text style={[styles.mainCardTitle, { color: colors.onBackground }]}>{title}</Text>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Attendance Trend" />
          <Card.Content>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Breakdown" />
          <Card.Content style={styles.breakdownContent}>
            <Chip icon="check" style={styles.chip}>On Time: 40</Chip>
            <Chip icon="clock-alert" style={styles.chip}>Late: 5</Chip>
            <Chip icon="close" style={styles.chip}>Absent: 5</Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Attendee List" />
          <Card.Content>
            <Searchbar
              placeholder="Search attendees"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Time</DataTable.Title>
              </DataTable.Header>
              {filteredAttendees.map(renderAttendeeItem)}
            </DataTable>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  mainCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainCardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginLeft: 16,
    color: 'white',
  },
  mainCardTitle: {
    fontSize: 18,
    color: 'white',
  },
  card: {
    margin: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  breakdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chip: {
    marginHorizontal: 4,
  },
  searchBar: {
    marginBottom: 16,
  },
});

export default AttendanceAnalysisScreen;
