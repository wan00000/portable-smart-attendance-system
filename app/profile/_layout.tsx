import { Slot } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';

const profileLayout = () => {
    const { colors } = useTheme();
    return (
        <PaperProvider>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Slot />
            </SafeAreaView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default profileLayout;
