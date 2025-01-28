import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, Modal, Animated, Dimensions, PanResponder } from "react-native"
import { Button, Text, List, ActivityIndicator, Card, useTheme, IconButton } from "react-native-paper"
import * as Print from "expo-print"
import { shareAsync } from "expo-sharing"
import { getDatabase, ref, get, type DataSnapshot } from "firebase/database"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

interface Student {
  firstName: string
  lastName: string
  matric: string
  enrolledEvents?: {
    [key: string]: boolean
  }
}

interface AttendanceRecord {
  firstName: string
  lastName: string
  matric: string
  status: string
}

interface SessionData {
  id: string
  date: string
  day: string
  startTime: string
  endTime: string
}

interface ExportData {
  eventName: string
  session: SessionData
  attendance: AttendanceRecord[]
}

interface ExportModalProps {
  visible: boolean
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [expandedEvent, setExpandedEvent] = useState<boolean>(false)
  const [expandedSession, setExpandedSession] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [eventMap, setEventMap] = useState<{ [eventId: string]: string }>({})
  const [sessionMap, setSessionMap] = useState<{ [sessionId: string]: string }>({})

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const db = getDatabase()
        const eventsRef = ref(db, "events")
        const eventsSnapshot: DataSnapshot = await get(eventsRef)
        const eventsData = eventsSnapshot.val()

        if (eventsData) {
          const eventMap = Object.keys(eventsData).reduce(
            (acc, eventId) => {
              acc[eventId] = eventsData[eventId].name
              return acc
            },
            {} as { [eventId: string]: string },
          )

          setEventMap(eventMap)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedEvent) return
      try {
        setLoading(true)
        const db = getDatabase()
        const sessionsRef = ref(db, `events/${selectedEvent}/sessions/`)
        const sessionsSnapshot: DataSnapshot = await get(sessionsRef)
        const sessionsData = sessionsSnapshot.val()

        if (sessionsData) {
          const sessionMap = Object.keys(sessionsData).reduce(
            (acc, sessionId) => {
              const sessionParts = sessionId.split("-")
              const sessionNumberPart = sessionParts[sessionParts.length - 1]
              const sessionNumber = Number.parseInt(sessionNumberPart.replace("session-", "")) + 1
              acc[sessionId] = `Session ${sessionNumber}`
              return acc
            },
            {} as { [sessionId: string]: string },
          )

          setSessionMap(sessionMap)
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [selectedEvent])

  const fetchData = async () => {
    if (!selectedEvent || !selectedSession) return null

    try {
      setLoading(true)
      const db = getDatabase()
      const eventRef = ref(db, `events/${selectedEvent}`)
      const sessionRef = ref(db, `events/${selectedEvent}/sessions/${selectedSession}`)
      const studentsRef = ref(db, "students")
      const attendanceRef = ref(db, `attendance/${selectedEvent}/${selectedSession}`)

      const [eventSnapshot, sessionSnapshot, studentsSnapshot, attendanceSnapshot] = await Promise.all([
        get(eventRef),
        get(sessionRef),
        get(studentsRef),
        get(attendanceRef),
      ])

      const eventData = eventSnapshot.val()
      const sessionData: SessionData = sessionSnapshot.val()
      const studentsData: { [key: string]: Student } = studentsSnapshot.val()
      const attendanceData: { [key: string]: { status: string } } = attendanceSnapshot.val()

      const attendanceList: AttendanceRecord[] = Object.keys(studentsData || {})
        .map((key) => {
          const student = studentsData[key]
          const isEnrolled = student.enrolledEvents && student.enrolledEvents[selectedEvent]

          if (isEnrolled) {
            const status = attendanceData && attendanceData[key] ? attendanceData[key].status : "Not Available"
            return {
              firstName: student.firstName,
              lastName: student.lastName,
              matric: student.matric,
              status,
            }
          }
          return null
        })
        .filter((record) => record !== null)

      return {
        eventName: eventData.name,
        session: sessionData,
        attendance: attendanceList,
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const parseISO8601 = (isoDate: string): { time: string } => {
    const dateObj = new Date(isoDate)
    const localDate = new Date(dateObj.getTime())

    return {
      time: localDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    }
  }

  const handleExportPDF = async () => {
    if (!selectedEvent || !selectedSession) {
      alert("Please select an event and session first.")
      return
    }

    setLoading(true)
    const exportData = await fetchData()
    setLoading(false)

    if (!exportData) {
      alert("Failed to fetch data for PDF generation.")
      return
    }

    const { eventName, session, attendance } = exportData

    const sessionParts = selectedSession.split("-")
    const sessionNumberPart = sessionParts[sessionParts.length - 1]
    const sessionNumber = Number.parseInt(sessionNumberPart.replace("session-", "")) + 1

    const formattedStartTime = parseISO8601(session.startTime).time
    const formattedEndTime = parseISO8601(session.endTime).time

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${eventName} - Session ${sessionNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <h1>${eventName}</h1>
        <p>Session: ${sessionNumber}, Date: ${session.day}, Time: ${formattedStartTime} - ${formattedEndTime}</p>
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Matric</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${attendance
              .map(
                (record) => `
              <tr>
                <td>${record.firstName}</td>
                <td>${record.lastName}</td>
                <td>${record.matric}</td>
                <td>${record.status}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent })
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" })
      alert("PDF has been exported successfully!")
      onClose()
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to export PDF.")
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
              <ScrollView>
                <Text style={styles.header}>Export Data</Text>
                <List.Accordion
                  title={selectedEvent ? eventMap[selectedEvent] : "Select Event"}
                  expanded={expandedEvent}
                  onPress={() => setExpandedEvent(!expandedEvent)}
                  style={{ backgroundColor: colors.backdrop }}
                >
                  {Object.entries(eventMap).map(([eventId, eventName]) => (
                    <List.Item
                      key={eventId}
                      title={eventName}
                      onPress={() => {
                        setSelectedEvent(eventId)
                        setExpandedEvent(false)
                      }}
                    />
                  ))}
                </List.Accordion>
                <List.Accordion
                  title={selectedSession ? sessionMap[selectedSession] : "Select Session"}
                  expanded={expandedSession}
                  onPress={() => setExpandedSession(!expandedSession)}
                  style={{ backgroundColor: colors.backdrop }}
                >
                  {Object.entries(sessionMap).map(([sessionId, sessionName]) => (
                    <List.Item
                      key={sessionId}
                      title={sessionName}
                      onPress={() => {
                        setSelectedSession(sessionId)
                        setExpandedSession(false)
                      }}
                    />
                  ))}
                </List.Accordion>
                <Button
                  mode="contained"
                  onPress={handleExportPDF}
                  disabled={!selectedEvent || !selectedSession || loading}
                  style={styles.exportButton}
                >
                  {loading ? "Loading..." : "Export to PDF"}
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
  closeButton: {
    alignSelf: "flex-end",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  exportButton: {
    marginTop: 16,
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

export default ExportModal

