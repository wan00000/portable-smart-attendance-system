import React, { useState } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';
import { Href, router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Appbar, Button, Card, Menu, Text, useTheme, FAB, Portal, Dialog, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AttendanceScreen = () => {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const handleRoutePush = (route: string) => {
    setMenuVisible(false);
    router.push(route as Href);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header>
        <Appbar.Content title="Attendances" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Appbar.Action icon="dots-vertical" onPress={toggleMenu} />}
        >
          <Menu.Item onPress={() => {}} title="Refresh Data" />
          <Menu.Item onPress={() => handleRoutePush('/attendance/edit')} title="Manual Attendance" />
          <Menu.Item onPress={() => {}} title="Export Attendance" />
        </Menu>
      </Appbar.Header>

      <ScrollView style={{ flex: 1 }}>

      <Card style={{ margin: 16, elevation: 4 }}>
          <Card.Title title="Weekly Attendance Trend" />
          <Card.Content>
            <LineChart
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{ data: [85, 88, 82, 91, 86] }],
              }}
              width={screenWidth - 65}
              height={220}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surfaceVariant,
                decimalPlaces: 0,
                color: (opacity = 1) => colors.primary,
                labelColor: (opacity = 1) => colors.onSurface,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: colors.primaryContainer,
                },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </Card.Content>
        </Card>

        <Card style={{ margin: 16, elevation: 4 }}>
          <Card.Title 
            title="Career Fair"
            subtitle="E0002 - Monday(11/11/2024)"
            left={(props) => <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary} />}
          />
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 }}>
              {[
                { label: 'Attendance', value: '85%', icon: 'chart-arc' },
                { label: 'Present', value: '20', icon: 'account-check' },
                { label: 'Absent', value: '03', icon: 'account-cancel' },
              ].map((stat, index) => (
                <View key={index} style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons name={stat.icon} size={32} color={colors.primary} />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>{stat.value}</Text>
                  <Text style={{ fontSize: 14, color: colors.onSurfaceVariant }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
            onPress={() => router.push({
              pathname: '/attendance/test',
              params: { title: 'Career Fair' },
            })}>
              View Details
            </Button>
          </Card.Actions>
        </Card>

        
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Quick Actions</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Choose an action to perform:</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleRoutePush('/attendance/edit')}>Manual Attendance</Button>
            <Button onPress={() => {}}>Export Data</Button>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>


    </View>
  );
};

export default AttendanceScreen;
