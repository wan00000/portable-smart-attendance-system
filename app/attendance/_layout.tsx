import { Slot } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';

const attendanceLayout = () => {
    const { colors } = useTheme();
    return (
        <SafeAreaView style={{backgroundColor: colors.background, flex: 1}}>
            <Slot />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({})

export default attendanceLayout;
