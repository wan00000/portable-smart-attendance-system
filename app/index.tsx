// index.tsx
import { auth } from '@/firebaseConfig';
import { getDatabase, ref, get, update } from 'firebase/database';
import { Redirect, router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

export default function Index() {
    const [loading, setLoading] = useState(true);  

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {

                const db = getDatabase();
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    if (userData.role === "admin") {
                        router.replace("/(tabs)/home");
                    } else if (userData.role === "organizer") {
                        router.replace("/organizer/home");
                    } else if (userData.role === "student") {
                        router.replace("/student/home");
                    } else {
                        router.replace('/(auth)/sign-in'); // Default redirect if no role
                    }
                } else {
                    console.log("User data not found");
                }
                // router.replace("/(tabs)/home");
            } else {
                router.replace('/(auth)/sign-in');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (


            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return null;
}

