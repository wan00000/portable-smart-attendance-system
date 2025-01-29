import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, Modal, Animated, Dimensions, PanResponder } from "react-native"
import { TextInput, Button, useTheme, HelperText, Card, Text, IconButton } from "react-native-paper"
import { auth } from "@/firebaseConfig"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

const ChangePasswordModal: React.FC<{
  visible: boolean
  onClose: () => void
  onDismiss: () => void
}> = ({ visible, onClose, onDismiss }) => {
  const { colors } = useTheme()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 250) {
          // If the user has swiped down more than 50 pixels, close the modal
          onClose()
        } else {
          // Otherwise, animate back to the original position
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, fadeAnim, slideAnim])

  const handleReauthenticateAndChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError("Passwords do not match or are empty.")
      return
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        onDismiss()
      } else {
        throw new Error("No authenticated user found.")
      }
    } catch (error: any) {
      console.error("Error during reauthentication or password update:", error)
      setError(error.message || "Failed to update password.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword)
        break
      case "new":
        setShowNewPassword(!showNewPassword)
        break
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword)
        break
    }
  }

  return (
    <Modal visible={visible} onDismiss={onClose} transparent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
        {...panResponder.panHandlers}
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.dragIndicator} />
              <IconButton icon="close" onPress={onClose} style={styles.closeButton} />
              <Text style={styles.modalTitle}>Change Password</Text>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <TextInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showCurrentPassword ? "eye-off" : "eye"}
                      onPress={() => togglePasswordVisibility("current")}
                    />
                  }
                />
                <TextInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showNewPassword ? "eye-off" : "eye"}
                      onPress={() => togglePasswordVisibility("new")}
                    />
                  }
                />
                <TextInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() => togglePasswordVisibility("confirm")}
                    />
                  }
                />
                <HelperText type="info" visible={true}>
                  Password must be at least 8 characters long
                </HelperText>
                {error && (
                  <HelperText type="error" visible={true}>
                    {error}
                  </HelperText>
                )}
                <Button
                  mode="contained"
                  onPress={handleReauthenticateAndChangePassword}
                  loading={loading}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Change Password
                </Button>
              </ScrollView>
            </Card.Content>
          </Card>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    elevation: 4,
    alignSelf: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
})

export default ChangePasswordModal

