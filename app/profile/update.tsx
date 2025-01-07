import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Button, TextInput, Avatar, Card, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as dbRef, set, get } from 'firebase/database';
import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';

interface FormData {
  name: string;
  role: string;
  email: string;
}

interface InputField {
  label: string;
  value: keyof FormData;
  icon: string;
}

const inputFields: InputField[] = [
  { label: "Name", value: "name", icon: "account" },
  { label: "Role", value: "role", icon: "briefcase" },
  { label: "Email", value: "email", icon: "email" },
];

const FormInput: React.FC<{
  field: InputField;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ field, value, onChangeText }) => (
  <TextInput 
    label={field.label}
    value={value}
    onChangeText={onChangeText}
    mode='outlined'
    style={styles.input}
    left={<TextInput.Icon icon={field.icon} />}
  />
);

const UserProfile = () => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    role: "",
    email: "",
  });

  const theme = useTheme();
  const user = auth.currentUser;
  const uid = user?.uid;

  useEffect(() => {
    if (uid) {
      fetchProfileData(uid);
    }
  }, [uid]);

  const fetchProfileData = async (uid: string) => {
    const db = getDatabase();
    const userRef = dbRef(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      setProfilePicture(userData.profilePicture || null);
      setFormData({
        name: userData.name || "",
        role: userData.role || "",
        email: userData.email || "",
      });
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

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

  const handleSave = async () => {
    if (!uid) return;
    const db = getDatabase();
    const userRef = dbRef(db, `users/${uid}`);
    await set(userRef, { ...formData, profilePicture });
    alert('Profile updated successfully!');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Profile" />
        <Appbar.Action icon="content-save" onPress={handleSave} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {profilePicture ? (
              <Avatar.Image size={120} source={{ uri: profilePicture }} />
            ) : (
              <Avatar.Icon size={120} icon="account" />
            )}
            <Button
              onPress={handleUpload}
              disabled={uploading}
              mode='outlined'
              style={styles.uploadButton}
            >
              {uploading ? "Uploading..." : "Change Picture"}
            </Button>
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Content>
            {inputFields.map((field) => (
              <FormInput
                key={field.value}
                field={field}
                value={formData[field.value]}
                onChangeText={(text) => handleInputChange(field.value, text)}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
  },
});

export default UserProfile;

