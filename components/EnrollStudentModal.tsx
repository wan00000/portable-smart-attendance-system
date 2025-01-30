import type React from "react"
import { useEffect, useRef } from "react"
import { View, StyleSheet, FlatList, Modal, Animated, Dimensions, TouchableOpacity, PanResponder } from "react-native"
import { Text, Button, useTheme, Card, IconButton } from "react-native-paper"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

interface Student {
  id: string
  name: string
  matric: string
}

interface EnrollStudentModalProps {
  visible: boolean
  onClose: () => void
  onSelectStudent: (studentId: string) => void
  nonEnrolledStudents: Student[]
}

const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  visible,
  onClose,
  onSelectStudent,
  nonEnrolledStudents,
}) => {
  const { colors } = useTheme()
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
              <Text style={styles.modalTitle}>Select Student to Enroll</Text>
              {nonEnrolledStudents.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 16, color: 'gray' }}>No Students Available</Text>
              ) : (
                <FlatList
                  data={nonEnrolledStudents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.studentItem} onPress={() => onSelectStudent(item.id)}>
                      <View style={styles.studentRow}>
                        <Text style={styles.studentName}>{item.name}</Text>
                        <Text style={styles.studentMatric}>{item.matric}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.studentList}
                />
              )}
              <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>
                Cancel
              </Button>
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
    textAlign: "center",
  },
  studentList: {
    maxHeight: 300,
  },
  studentItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.2,
    borderBottomColor: "#e0e0e0",
  },
  studentText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: {
    fontSize: 16,
  },
  studentMatric: {
    fontSize: 16,
    color: "gray",
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

export default EnrollStudentModal

