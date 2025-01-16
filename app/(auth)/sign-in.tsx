import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;

      // Fetch user role
      const db = getDatabase();
      const userRef = ref(db, `users/${userId}`);
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
          setError("Unauthorized role");
        }
      } else {
        setError("User data not found");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Email"
              placeholder='Enter your email'
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType='email-address'
              autoCapitalize='none'
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Password"
              placeholder='Enter your password'
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!passwordVisible}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? "eye-off" : "eye"}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
            />

            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} /> {error}
              </Text>
            )}

            <Button 
              mode="contained" 
              onPress={handleSignIn} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>

            <Divider style={styles.divider} />

            <Text style={styles.linkText} onPress={() => router.push('/(auth)/sign-up')}>
              Don't have an account? Sign Up
            </Text>
          </Card.Content>
        </Card>
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
  card: {
    elevation: 4,
    borderRadius: 8,
  },
  title: {
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
    marginTop: 16,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  linkText: {
    textAlign: 'center',
  },
});

export default SignIn;

