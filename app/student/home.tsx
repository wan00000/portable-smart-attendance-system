import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const StudentApp: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [manager] = useState(() => new BleManager());

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermissions();
    }
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const requestPermissions = async (retry = false) => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
  
        const allGranted = Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );
  
        if (!allGranted) {
          if (retry) {
            Alert.alert(
              'Permission Denied',
              'Permissions are still not granted. Please enable them in the app settings.',
              [
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          } else {
            Alert.alert(
              'Permission Denied',
              'BLE permissions are required. Please retry or enable them in settings.',
              [
                { text: 'Retry', onPress: () => requestPermissions(true) },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        } else if (retry) {
          Alert.alert('Permission Granted', 'BLE permissions have been successfully enabled.');
        }
      } catch (error) {
        console.error('Permission Error:', error);
        Alert.alert('Error', 'An error occurred while requesting permissions.');
      }
    }
  };
  

  const startBroadcasting = () => {
    if (!studentId) {
      Alert.alert('Error', 'Please enter your Student ID before broadcasting.');
      return;
    }

    try {
      // Start BLE advertising
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Broadcasting Error:', error);
          Alert.alert('Error', 'Failed to start broadcasting.');
          return;
        }

        console.log('Broadcasting Student ID:', studentId);
      });

      setIsBroadcasting(true);
      Alert.alert('Broadcasting', `Broadcasting started for ID: ${studentId}`);
    } catch (error) {
      console.error('Error starting broadcasting:', error);
      Alert.alert('Error', 'Unable to start broadcasting.');
    }
  };

  const stopBroadcasting = () => {
    manager.stopDeviceScan();
    setIsBroadcasting(false);
    Alert.alert('Stopped', 'Broadcasting stopped.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student BLE Broadcaster</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentId}
        onChangeText={setStudentId}
      />
      <View style={styles.buttonContainer}>
        {!isBroadcasting ? (
          <Button title="Start Broadcasting" onPress={startBroadcasting} />
        ) : (
          <Button title="Stop Broadcasting" onPress={stopBroadcasting} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default StudentApp;
