//app\(tabs)\home.tsx
import { Link, router } from 'expo-router';
import * as React from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { Appbar, Avatar, Card, Divider, FAB, List, Portal, ProgressBar, Provider, useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string;
  color: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  return (
    <Link href="/attendance" asChild>
    <Card
      style={styles.statCard}
      // onPress={() => router.replace('/attendance')}
    >
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons name={icon} size={36} color={color} />
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
      <ProgressBar progress={parseInt(value) / 100} color={color} style={styles.progressBar} />
    </Card>
    </Link>
  );
};

interface EventItemProps {
  course: string;
  code: string;
  day: string;
  time: string;
}

const EventItem: React.FC<EventItemProps> = ({ course, code, day, time }) => {
  const { colors } = useTheme();

  return (
    <List.Item
      title={course}
      description={code}
      left={(props) => <MaterialCommunityIcons {...props} name="book-open-variant" size={24} color={colors.primary} />}
      right={() => (
        <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={styles.scheduleTimeText}>{day}</Text>
          <View style={styles.scheduleTime}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
            <Text style={styles.scheduleTimeText}>{time}</Text>
          </View>
        </View>
      )}
      style={styles.listItem}
      onPress={() => router.push({
        pathname: '/eventMgmt/detail',
        params: { course, code, day, time }
      })}
    />
  );
};

const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [fabOpen, setFabOpen] = React.useState(false);

  const stats: StatCardProps[] = [
    { title: "Total Attendance", value: "60%", color: colors.primary, icon: "account-check" },
    { title: "Total Attendees", value: "200", color: colors.secondary, icon: "account-group" },
    { title: "Total Late", value: "5", color: colors.error, icon: "account-clock" },
    { title: "Active Events", value: "8", color: colors.tertiary, icon: "calendar-check" },
  ];

  const events: EventItemProps[] = [
    { course: "Ethical in Artificial Intelligence", code: "E0001", day: "Monday", time: "08:00 - 10:00 a.m." },
    { course: "Career Fair", code: "E0002", day: "Tuesday", time: "10:00 - 12:00 p.m." },
  ];

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Image
            source={require('@/assets/images/idatangPutih.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Appbar.Content 
            titleStyle={styles.headerTitle}
            title="iDATANG" 
          />
          <Avatar.Image size={40} source={require('@/assets/images/avatar.png')} style={styles.avatar} />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </View>

          <Card style={styles.eventsCard}>
            <Card.Title 
              title="Upcoming Events" 
              left={(props) => <MaterialCommunityIcons {...props} name="calendar-today" size={24} color={colors.primary} />}
            />
            <Card.Content>
              {events.map((event, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <EventItem {...event} />
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        </ScrollView>

        <Portal>
          <FAB.Group
            open={fabOpen}
            visible
            icon={fabOpen ? 'close' : 'plus'}
            actions={[
              {
                icon: 'account-plus',
                label: 'Add Student',
                onPress: () => router.push("/studentMgmt/add"),
              },
              {
                icon: 'book-plus',
                label: 'Add Event',
                onPress: () => router.push("/eventMgmt/add"),
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            onPress={() => {
              if (fabOpen) {
                // do something if the speed dial is open
              }
            }}
          />
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    elevation: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  logo: {
    width: 30,
    height: 30,
    marginLeft: 10,
    marginRight: 8,
  },
  avatar: {
    marginRight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statTextContainer: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    opacity: 0.7,
    flexWrap: 'wrap',
    width: '99%'
  },
  progressBar: {
    marginTop: 8,
  },
  eventsCard: {
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTimeText: {
    marginLeft: 4,
    fontSize: 12,
  },
});

export default HomeScreen;