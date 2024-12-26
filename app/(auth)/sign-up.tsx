import { createUserWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { auth } from '@/firebaseConfig';
import { getDatabase, ref, set } from 'firebase/database';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;

      const db = getDatabase();
      await set(ref(db, `users/${userId}`), {
        email: formData.email,
        role: "organizer" // Default role
      });

      router.replace("/organizer/home");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          style={styles.input}
          mode="outlined"
          label="Email"
          placeholder='Enter your email'
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          keyboardType='email-address'
          autoCapitalize='none'
        />
        <TextInput
          style={styles.input}
          mode="outlined"
          label="Password"
          placeholder='Enter your password'
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          mode="outlined"
          label="Confirm Password"
          placeholder='Confirm your password'
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          secureTextEntry
        />
        
        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

        <Button 
          mode="contained" 
          onPress={handleSignUp} 
          style={styles.button}
        >
          Sign Up
        </Button>

        <Text style={styles.linkText} onPress={() => router.push('/(auth)/sign-in')}>
          Already have an account? Sign In
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
  },
  linkText: {
    textAlign: 'center',
  },
});

export default SignUp;