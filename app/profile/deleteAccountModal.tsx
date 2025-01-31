import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, Modal, Animated, Dimensions, PanResponder } from "react-native"
import { TextInput, Button, useTheme, HelperText, Card, IconButton, Text } from "react-native-paper"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

const DeleteAccountModal: React.FC<{
  visible: boolean
  onClose: () => void
  onConfirm: (password: string) => void
}> = ({ visible, onClose, onConfirm }) => {
  const { colors } = useTheme()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  const handleConfirm = () => {
    if (!password) {
      setError("Password is required.")
      return
    }
    setError(null)
    onConfirm(password)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
              <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
              <Text style={styles.modalMessage}>Please enter your password to confirm:</Text>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="lock" />}
                right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={togglePasswordVisibility} />}
              />
              {error && (
                <HelperText type="error" visible={true}>
                  {error}
                </HelperText>
              )}
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={onClose}
                  style={[styles.button, styles.cancelButton]}
                  labelStyle={{ color: colors.primary }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  style={[styles.button, styles.confirmButton]}
                  buttonColor={colors.error}
                >
                  Confirm
                </Button>
              </View>
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
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalMessage: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    borderColor: "transparent",
  },
  confirmButton: {
    marginLeft: 16,
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

export default DeleteAccountModal

