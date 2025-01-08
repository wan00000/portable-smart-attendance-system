import { createUserWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, List, Text, TextInput, useTheme } from 'react-native-paper';
import { auth } from '@/firebaseConfig';
import { getDatabase, ref, set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const SignUp: React.FC = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "organizer",
  });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;

      const db = getDatabase();
      await set(ref(db, `users/${userId}`), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      if (formData.role === 'admin') {
        router.replace('/(tabs)/home');
      } else if (formData.role === 'organizer') {
        router.replace('/organizer/home');
      } else {
        setError('Invalid role selected');
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
            <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Name"
              placeholder='Enter your name'
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              left={<TextInput.Icon icon="account" />}
            />
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
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Confirm Password"
              placeholder='Confirm your password'
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
              left={<TextInput.Icon icon="lock-check" />}
            />

            <List.Accordion
              style={{backgroundColor: colors.elevation.level1}}
              title={`Role: ${formData.role}`}
              expanded={expanded}
              onPress={() => setExpanded(!expanded)}
              left={props => <List.Icon {...props} icon="account-cog" />}
            >
              <List.Item 
                title="Admin" 
                onPress={() => {
                  handleInputChange('role', 'admin');
                  setExpanded(false);
                }}
                left={props => <List.Icon {...props} icon="shield-account" />}
              />
              <List.Item 
                title="Organizer" 
                onPress={() => {
                  handleInputChange('role', 'organizer');
                  setExpanded(false);
                }}
                left={props => <List.Icon {...props} icon="account-group" />}
              />
            </List.Accordion>

            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} /> {error}
              </Text>
            )}

            <Button 
              mode="contained" 
              onPress={handleSignUp} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Sign Up
            </Button>

            <Divider style={styles.divider} />

            <Text style={styles.linkText} onPress={() => router.push('/(auth)/sign-in')}>
              Already have an account? Sign In
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

export default SignUp;

