import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { Svg, Line, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, get, query, orderByKey, limitToLast } from 'firebase/database';
import { GraphType, AttendanceData, ProcessedData } from './types';
import { processAttendanceData } from './processAttendanceData';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_WIDTH = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 220;
const CHART_PADDING = 20;

const AttendanceGraph: React.FC = () => {
  const { colors } = useTheme();
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('percentage');
  const [graphData, setGraphData] = useState<{[key in GraphType]: ProcessedData}>({
    percentage: {
      percentage: Array(7).fill(0),
      present: Array(7).fill(0),
      absent: Array(7).fill(0),
      eventCounts: Array(7).fill(0),
    },
    present: {
      percentage: Array(7).fill(0),
      present: Array(7).fill(0),
      absent: Array(7).fill(0),
      eventCounts: Array(7).fill(0),
    },
    absent: {
      percentage: Array(7).fill(0),
      present: Array(7).fill(0),
      absent: Array(7).fill(0),
      eventCounts: Array(7).fill(0),
    },
  });

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const db = getDatabase();
      const attendanceRef = ref(db, 'attendance');
      const lastWeekQuery = query(attendanceRef, orderByKey(), limitToLast(7));

      const snapshot = await get(lastWeekQuery);
      if (snapshot.exists()) {
        const data: AttendanceData = snapshot.val();
        console.log("Raw Attendance Data:", JSON.stringify(data, null, 2));
        setGraphData({
          percentage: processAttendanceData(data),
          present: processAttendanceData(data),
          absent: processAttendanceData(data),
        });
      } else {
        console.warn("No attendance data found in Firebase.");
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

  const chartData = useMemo(() => {
    const data = graphData[selectedGraph][selectedGraph];
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue > minValue ? maxValue - minValue : 1;

    return data.map((value, index) => ({
      x: (CHART_WIDTH - CHART_PADDING * 2) / (DAYS.length - 1) * index + CHART_PADDING,
      y: CHART_HEIGHT - CHART_PADDING - ((value - minValue) / range) * (CHART_HEIGHT - CHART_PADDING * 2),
      value,
      hasEvent: graphData[selectedGraph].eventCounts[index] > 0,
    }));
  }, [graphData, selectedGraph]);

  const renderChart = () => {
    const validPoints = chartData.filter(point => point.hasEvent);
    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke={colors.onSurface}
          strokeWidth="1"
        />
        <Line
          x1={CHART_PADDING}
          y1={CHART_PADDING}
          x2={CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke={colors.onSurface}
          strokeWidth="1"
        />
        {validPoints.map((point, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Line
                x1={validPoints[index - 1].x}
                y1={validPoints[index - 1].y}
                x2={point.x}
                y2={point.y}
                stroke={colors.primary}
                strokeWidth="2"
              />
            )}
            <Circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={colors.primaryContainer}
              stroke={colors.primary}
              strokeWidth="2"
            />
            <SvgText
              x={point.x}
              y={point.y - 10}
              fontSize="10"
              fill={colors.onSurface}
              textAnchor="middle"
            >
              {selectedGraph === 'percentage' ? `${point.value.toFixed(1)}%` : point.value}
            </SvgText>
          </React.Fragment>
        ))}
        {chartData.map((point, index) => (
          <SvgText
            key={`label-${index}`}
            x={point.x}
            y={CHART_HEIGHT - CHART_PADDING + 15}
            fontSize="10"
            fill={colors.onSurface}
            textAnchor="middle"
          >
            {DAYS[index]}
          </SvgText>
        ))}
      </Svg>
    );
  };

  const calculateWeeklyAverage = () => {
    const data = graphData[selectedGraph][selectedGraph];
    const nonZeroValues = data.filter((v, i) => graphData[selectedGraph].eventCounts[i] > 0);
    return nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Weekly Attendance Overview"
        left={() => <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />}
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
        {renderChart()}
        <Text style={styles.averageText}>
          Weekly Average: {calculateWeeklyAverage().toFixed(2)}
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
  averageText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});

export default AttendanceGraph;
