import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

interface FormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Sign In</Text>
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

        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

        <Button 
          mode="contained" 
          onPress={handleSignIn} 
          style={styles.button}
        >
          Sign In
        </Button>

        <Text style={styles.linkText} onPress={() => router.push('/(auth)/sign-up')}>
          Don't have an account? Sign Up
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

export default SignIn;