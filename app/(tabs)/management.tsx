import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Appbar, useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import AllStudents from '@/app/list/allStudents';
import AllOrganizers from '@/app/list/allOrganizers';
import AllEvents from '@/app/list/allEvents';
// import { NavigationContainer } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

interface TabScreenProps {
  title: string;
  component: React.ComponentType<any>;
}

const tabScreens: TabScreenProps[] = [
  { title: 'Events', component: AllEvents },
  { title: 'Students', component: AllStudents },
  { title: 'Organizers', component: AllOrganizers },
];

const TabBar: React.FC<{ state: any; descriptors: any; navigation: any; position: any }> = ({ state, descriptors, navigation, position }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <View key={route.key} style={styles.tabItem}>
            <Text
              onPress={onPress}
              style={[
                styles.tabText,
                { color: isFocused ? colors.primary : colors.onSurface },
              ]}
            >
              {label}
            </Text>
            {isFocused && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </View>
        );
      })}
    </View>
  );
};

const ManageScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    // <NavigationContainer>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Appbar.Header>
          <Appbar.Content title="Management" />
        </Appbar.Header>
        <Tab.Navigator
          tabBar={(props) => <TabBar {...props} />}
          style={{ backgroundColor: colors.background }}
        >
          {tabScreens.map((screen) => (
            <Tab.Screen
            key={screen.title}
            name={screen.title}
            component={screen.component}
            options={{ tabBarLabel: screen.title }}
            />
          ))}
        </Tab.Navigator>
      </SafeAreaView>
    // </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default ManageScreen;