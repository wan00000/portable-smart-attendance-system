// app/(tabs)/_layout.tsx
import { BottomNavigation} from 'react-native-paper';
import HomeScreen from './home';
import ManagementScreen from './management';
import ProfileScreen from './profile';
import AttendanceScreen from './attendance';
import React, { useState } from 'react';


const BottomTabs = () => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'scan', title: 'Attendance', focusedIcon: 'account-clock', unfocusedIcon: 'account-clock-outline' },
    { key: 'manage', title: 'Manage', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
    
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    manage: ManagementScreen,
    profile: ProfileScreen,
    scan: AttendanceScreen,
  });

  return (
    
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      // options={
      //   {headerShown: false,}
      // }
    />
  );
};

export default BottomTabs;










