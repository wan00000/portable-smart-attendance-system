import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Avatar, Card, Divider, List, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

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
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // Assume user is already authenticated, fetch UID
  const userAuth = auth.currentUser;
  const uid = userAuth?.uid;

  useEffect(() => {
      if (uid) {
          fetchProfilePicture(uid);
      }
  }, [uid]);

  // Function to fetch the profile picture URL from Firebase RLDB
  const fetchProfilePicture = async (uid: string) => {
      const db = getDatabase();
      const userRef = ref(db, `users/${uid}/profilePicture`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
          setProfilePicture(snapshot.val());
      } else {
          setProfilePicture(null); // No profile picture uploaded
      }
  };

    const fetchAllUsers = useCallback(async () => {
      const db = getDatabase();
      const usersRef = ref(db, 'users');
      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const usersArray = Object.keys(data).map(userId => ({
            id: userId,
            email: data[userId].email,
            role: data[userId].role,
          }));
          setUsers(usersArray);
        } else {
          console.error("No users found.");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }, []);

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch user name and profile picture
        const db = getDatabase();
        const userRef = ref(db, `users/${currentUser.uid}`);

        try {
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserName(data.name || 'Anonymous');

            if (data.profilePicture) {
              // Fetch profile picture URL from Firebase Storage
              const storage = getStorage();
              const pictureRef = storageRef(storage, data.profilePicture); // Path to the image file
              const pictureUrl = await getDownloadURL(pictureRef);
              setProfilePicture(pictureUrl);
              console.log('Profile picture successfully fetched:', pictureUrl);
            } else {
              setProfilePicture(null);
            }
          } else {
            console.error("User data not found.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
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
    { title: "Profile Information", icon: "account-circle", onPress: () => router.push("/profile/update") },
    { title: "Export Data", icon: "export", onPress: () => console.log("Export Data") },
    { title: "Change Password", icon: "lock-reset", onPress: () => console.log("Change Password") },
    { title: "Delete Account", icon: "account-remove", onPress: () => console.log("Delete Account") },
    { title: "Logout", icon: "logout", onPress: handleSignOut },
  ];

  const fetchData = useCallback(async () => {
    await Promise.all([fetchAllUsers()]);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
              }
      >
        <Appbar.Header>
          <Appbar.Content title="Profile" mode="large" />
        </Appbar.Header>

        <Card style={[styles.headerCard, { backgroundColor: "#75b99a" }]}>
          <Card.Title 
            title={`Hi ${userName || 'Loading...'}`}
            subtitle={user?.email || 'Loading...'}
            titleVariant='headlineMedium'
            right={(props) => (
              <Avatar.Image 
                {...props} 
                size={50} 
                source={profilePicture ? { uri: profilePicture } : require("@/assets/images/avatar.png")}
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