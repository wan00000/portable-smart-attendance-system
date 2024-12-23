import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, get, query, orderByKey, limitToLast } from "firebase/database";

type GraphType = 'percentage' | 'present' | 'absent';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const AttendanceGraph: React.FC = () => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('percentage');
  const [graphData, setGraphData] = useState({
    percentage: [0, 0, 0, 0, 0],
    present: [0, 0, 0, 0, 0],
    absent: [0, 0, 0, 0, 0],
  });

  const chartConfig = useMemo(() => ({
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surfaceVariant,
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.onSurface,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primaryContainer,
    },
  }), [colors]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const db = getDatabase();
      const attendanceRef = ref(db, 'attendance');
      const lastWeekQuery = query(attendanceRef, orderByKey(), limitToLast(7));

      const snapshot = await get(lastWeekQuery);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const percentageData = [];
        const presentData = [];
        const absentData = [];

        for (const day of Object.keys(data)) {
          let dayPercentage = 0;
          let presentCount = 0;
          let absentCount = 0;

          for (const sessionId of Object.keys(data[day])) {
            for (const studentId of Object.keys(data[day][sessionId])) {
              const record = data[day][sessionId][studentId];
              dayPercentage += record.attendancePercentage || 0;
              if (record.actualStatus === 'present') presentCount++;
              if (record.actualStatus === 'absent') absentCount++;
            }
          }

          const totalRecords = Object.keys(data[day]).length;
          percentageData.push(totalRecords ? dayPercentage / totalRecords : 0);
          presentData.push(presentCount);
          absentData.push(absentCount);
        }

        setGraphData({
          percentage: percentageData,
          present: presentData,
          absent: absentData,
        });
      }
    };

    fetchAttendanceData();
  }, []);

  const renderGraphTypeButton = (type: GraphType) => (
    <Button
      key={type}
      mode={selectedGraph === type ? 'contained' : 'outlined'}
      onPress={() => setSelectedGraph(type)}
      icon={type === 'percentage' ? 'percent' : type === 'present' ? 'account-check' : 'account-remove'}
      style={styles.button}
      labelStyle={styles.buttonLabel}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Button>
  );

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Weekly Attendance Overview"
        left={(props) => <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />}
      />
      <Card.Content>
        <View style={styles.buttonContainer}>
          {['percentage', 'present', 'absent'].map((type) =>
            renderGraphTypeButton(type as GraphType)
          )}
        </View>
        <Text style={styles.graphTitle}>
          {selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)} Trends
        </Text>
        <LineChart
          data={{
            labels: DAYS,
            datasets: [{ data: graphData[selectedGraph] }],
          }}
          width={screenWidth - 64}
          height={220}
          yAxisSuffix={selectedGraph === 'percentage' ? '%' : ''}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
        <Text style={styles.averageText}>
          Weekly Average: {(graphData[selectedGraph].reduce((a, b) => a + b, 0) / DAYS.length).toFixed(2)}
          {selectedGraph === 'percentage' ? '%' : ''}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { margin: 16, elevation: 4 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  button: { flex: 1, marginHorizontal: 4 },
  buttonLabel: { fontSize: 12 },
  graphTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  chart: { marginVertical: 8, borderRadius: 16 },
  averageText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});

export default AttendanceGraph;
