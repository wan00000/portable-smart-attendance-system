import { Slot } from 'expo-router';
import {StyleSheet} from 'react-native';
import { useTheme, BottomNavigation } from 'react-native-paper';
import HomeScreen from './home';
import ProfileScreen from './profile';
import React, { useState } from 'react';

const organizerLayout = () => {
    const { colors } = useTheme();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
      { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
      { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      
    ]);
  
    const renderScene = BottomNavigation.SceneMap({
      home: HomeScreen,
      profile: ProfileScreen,
    });

    return (
        <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={{
            backgroundColor: colors.elevation.level1, // Set the bar background color dynamically
            }}
            theme={{
            colors: {
                secondaryContainer: colors.secondaryContainer, // Set the selected tab color
            },
            }}
        />
    );
}

const styles = StyleSheet.create({})

export default organizerLayout;
