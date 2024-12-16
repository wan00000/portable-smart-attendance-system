import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type GraphType = 'percentage' | 'present' | 'absent';

interface GraphData {
  title: string;
  data: number[];
  suffix: string;
  icon: string;
}

const GRAPH_DATA: Record<GraphType, GraphData> = {
  percentage: { title: 'Attendance Percentage', data: [85, 88, 82, 91, 86], suffix: '%', icon: 'percent' },
  present: { title: 'Students Present', data: [20, 22, 19, 24, 21], suffix: '', icon: 'account-check' },
  absent: { title: 'Students Absent', data: [5, 3, 6, 2, 4], suffix: '', icon: 'account-remove' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const AttendanceGraph: React.FC = () => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('percentage');

  const chartConfig = useMemo(() => ({
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surfaceVariant,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.onSurface,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primaryContainer,
    },
  }), [colors]);

  const renderGraphTypeButton = (type: GraphType) => (
    <Button
      key={type}
      mode={selectedGraph === type ? 'contained' : 'outlined'}
      onPress={() => setSelectedGraph(type)}
      icon={GRAPH_DATA[type].icon}
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
          {Object.keys(GRAPH_DATA).map((type) => renderGraphTypeButton(type as GraphType))}
        </View>
        <Text style={styles.graphTitle}>{GRAPH_DATA[selectedGraph].title}</Text>
        <LineChart
          data={{
            labels: DAYS,
            datasets: [{ data: GRAPH_DATA[selectedGraph].data }],
          }}
          width={screenWidth - 64}
          height={220}
          yAxisSuffix={GRAPH_DATA[selectedGraph].suffix}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
        <Text style={styles.averageText}>
          Weekly Average: {GRAPH_DATA[selectedGraph].data.reduce((a, b) => a + b, 0) / GRAPH_DATA[selectedGraph].data.length}
          {GRAPH_DATA[selectedGraph].suffix}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonLabel: {
    fontSize: 12,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  averageText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AttendanceGraph;

