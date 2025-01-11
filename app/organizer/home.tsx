import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

const Home = () => {
  return (
    <View>
      <Text>Organizer Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({})

export default Home;
