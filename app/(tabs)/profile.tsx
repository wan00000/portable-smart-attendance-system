import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Avatar, Card, Divider, List, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';

interface ProfileOption {
  title: string;
  icon: string;
  onPress: () => void;
}

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  // const [otherUserData, setOtherUserData] = useState<{ email: string; role: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);


  useEffect(() => {
    const fetchAllUsers = async () => {
      const db = getDatabase();
      const usersRef = ref(db, 'users'); // Point to the 'users' node
  
      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Extract and log all users' data
          console.log("All Users:", data);
  
          // Example: Transform data into an array for display
          const usersArray = Object.keys(data).map(userId => ({
            id: userId,
            email: data[userId].email,
            role: data[userId].role,
          }));
          setUsers(usersArray);
  
          // You can store this array in a state if needed
          console.log("Formatted Users Array:", usersArray);
        } else {
          console.error("No users found.");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    fetchAllUsers();
  }, []);

  
  

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // // Fetch other user's email and role
        // const db = getDatabase();
        // const otherUserId = "userId_of_other_user"; // Replace with the actual userId
        // const userRef = ref(db, `users/${otherUserId}`);
        
        // try {
        //   const snapshot = await get(userRef);
        //   if (snapshot.exists()) {
        //     const data = snapshot.val();
        //     setOtherUserData({
        //       email: data.email,
        //       role: data.role,
        //     });
        //   } else {
        //     console.error("No data available for the specified user.");
        //   }
        // } catch (error) {
        //   console.error("Error fetching user data:", error);
        // }
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
      <ScrollView>
        <Appbar.Header>
          <Appbar.Content title="Profile" mode="large" />
        </Appbar.Header>

        <Card style={[styles.headerCard, { backgroundColor: "#75b99a" }]}>
          <Card.Title 
            title="Hi Izwan,"
            subtitle={user?.email || 'Loading...'}
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
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <List.Item
                title={user.email}
                description={`Role: ${user.role}`}
                left={(props) => <List.Icon {...props} icon="account" />}
              />
              <Divider />
            </React.Fragment>
          ))}
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
      </ScrollView>
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