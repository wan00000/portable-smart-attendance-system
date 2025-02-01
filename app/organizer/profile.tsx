import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Avatar, Card, Divider, List, useTheme, TextInput, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { deleteUser, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { get, getDatabase, ref, remove, set } from 'firebase/database';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import ChangePasswordModal from '../profile/changePassword';
import DeleteAccountModal from '../profile/deleteAccountModal';
import ExportModal from '../attendance/export';

interface ProfileOption {
  title: string;
  icon: string;
  onPress: () => void;
}


// const DeleteAccountModal = ({ visible, onClose, onConfirm }: { 
//   visible: boolean; 
//   onClose: () => void; 
//   onConfirm: (password: string) => void; 
// }) => {
//   const [password, setPassword] = useState("");
//   const { colors } = useTheme();

//   return (
//     <Modal visible={visible} transparent={true} animationType="slide">
//       <View style={styles.modalOverlay}>
//         <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
//           <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
//           <Text style={styles.modalMessage}>Please enter your password to confirm:</Text>
//           <TextInput
//             secureTextEntry
//             mode='outlined'
//             placeholder="Enter password"
//             value={password}
//             onChangeText={setPassword}
//             style={styles.textInput}
//           />
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}>
//               <Text style={[styles.buttonText, { color: colors.primary }]}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => onConfirm(password)} style={[styles.button, styles.confirmButton, { backgroundColor: colors.error }]}>
//               <Text style={styles.buttonText}>Confirm</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  // const [otherUserData, setOtherUserData] = useState<{ email: string; role: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
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

  const handleDeleteAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const credential = EmailAuthProvider.credential(user.email || "", password);
      await reauthenticateWithCredential(user, credential);

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await remove(userRef);

      await deleteUser(user);

      Alert.alert("Success", "Your account has been deleted.");
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password. Please try again.");
      } else {
        Alert.alert("Error", "An error occurred while deleting your account.");
      }
    }
  };

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
    { title: "Export Data", icon: "export", onPress: () => setIsExportModalVisible(true) },
    { title: "Change Password", icon: "lock-reset", onPress: () => setChangePasswordModalVisible(true), },
    { title: "Delete Account", icon: "account-remove", onPress: () => setModalVisible(true) },
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
      <Appbar.Header>
        <Appbar.Content title="Profile" mode="large" />
      </Appbar.Header>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
              }
      >
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

        {/* <Card style={styles.optionsCard}>
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
        </Card> */}



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

      <DeleteAccountModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={(password) => {
          setModalVisible(false);
          handleDeleteAccount(password);
        }}
      />
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)} // Add this line
        onDismiss={() => setChangePasswordModalVisible(false)}
      />
      <ExportModal 
        visible={isExportModalVisible} 
        onClose={() => setIsExportModalVisible(false)} 
      />
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 5,
    padding: 10,
    backgroundColor: "#f44336",
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  // modalMessage: {
  //   fontSize: 14,
  //   marginBottom: 20,
  // },
  // textInput: {
  //   width: "100%",
  //   padding: 10,
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 5,
  //   marginBottom: 20,
  // },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  textInput: {
    width: "100%",
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
});

export default ProfileScreen;