// Import necessary libraries
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Appbar, Button, Text } from "react-native-paper"
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, set, get } from "firebase/database";
import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';

const UserProfile = () => {
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Assume user is already authenticated, fetch UID
    const user = auth.currentUser;
    const uid = user?.uid;

    useEffect(() => {
        if (uid) {
            fetchProfilePicture(uid);
        }
    }, [uid]);

    // Function to fetch the profile picture URL from Firebase RLDB
    const fetchProfilePicture = async (uid: string) => {
        const db = getDatabase();
        const userRef = dbRef(db, `users/${uid}/profilePicture`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            setProfilePicture(snapshot.val());
        } else {
            setProfilePicture(null); // No profile picture uploaded
        }
    };

    // Function to pick an image from the gallery
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: false,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            return result.assets[0].uri;
        }
        return null;
    };

    // Function to upload the image to Firebase Storage
    const uploadImage = async (uri: string, uid: string) => {
        try {
            const storage = getStorage();
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, `profilePictures/${uid}`);
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Image upload failed. Please try again later.');
        }
    };

    const handleUpload = async () => {
        if (!uid) return;
        const uri = await pickImage();
        if (!uri) return;

        setUploading(true);

        try {
            const downloadURL = await uploadImage(uri, uid);
            const db = getDatabase();
            const userRef = dbRef(db, `users/${uid}/profilePicture`);
            await set(userRef, downloadURL);
            setProfilePicture(downloadURL);
            alert('Profile picture uploaded successfully!');
        } catch (error: any) {
            console.error('Error handling upload:', error);
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={{flex: 1}}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Profile Update" />
            </Appbar.Header>
            <View style={styles.container}>
                <Text style={styles.title}>User Profile</Text>
                {profilePicture ? (
                    <Image
                        source={{ uri: profilePicture }}
                        style={styles.profilePicture}
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>No Profile Picture</Text>
                    </View>
                )}
                <Button
                    onPress={handleUpload}
                    disabled={uploading}
                    mode='outlined'
                >
                    {uploading ? "Uploading..." : "Upload Profile Picture"}
                </Button>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom: 20,
    },
    placeholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    placeholderText: {
        color: '#666',
    },
});

export default UserProfile;
