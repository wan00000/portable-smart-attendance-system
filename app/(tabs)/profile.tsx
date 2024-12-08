import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Avatar, Card, Divider, List, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface ProfileOption {
  title: string;
  icon: string;
  onPress: () => void;
}

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/(auth)/sign-in");
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      console.error("Error signing out: ", error);
    }
  };

  const profileOptions: ProfileOption[] = [
    { title: "Profile Information", icon: "account-circle", onPress: () => console.log("Profile Information") },
    { title: "Export Data", icon: "export", onPress: () => console.log("Export Data") },
    { title: "Change Password", icon: "lock-reset", onPress: () => console.log("Change Password") },
    { title: "Delete Account", icon: "account-remove", onPress: () => console.log("Delete Account") },
    { title: "Logout", icon: "logout", onPress: handleSignOut },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.Content title="Profile" mode="large" />
      </Appbar.Header>

      <Card style={[styles.headerCard, { backgroundColor: "#75b99a" }]}>
        <Card.Title 
          title="Hi Izwan,"
          subtitle="wan000@gmail.com"
          titleVariant='headlineMedium'
          right={(props) => (
            <Avatar.Image 
              {...props} 
              size={50} 
              source={require("@/assets/images/avatar.png")}
              style={styles.avatar}
            />
          )}
        />
      </Card>

      <Card style={styles.optionsCard}>
        {profileOptions.map((option, index) => (
          <React.Fragment key={option.title}>
            <List.Item
              title={option.title}
              left={(props) => <List.Icon {...props} icon={option.icon} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={option.onPress}
              style={styles.listItem}
            />
            {index < profileOptions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 10,
    marginBottom: 30,
    paddingVertical: 15,
  },
  avatar: {
    marginRight: 15,
  },
  optionsCard: {
    margin: 10,
  },
  listItem: {
    paddingVertical: 8,
  },
});

export default ProfileScreen;