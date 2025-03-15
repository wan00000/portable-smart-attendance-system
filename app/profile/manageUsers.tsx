import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';

const ManageUsers = () => {
    return (
        <SafeAreaView>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Profile" />
            </Appbar.Header>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({})

export default ManageUsers;
