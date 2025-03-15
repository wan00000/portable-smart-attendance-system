import { View, StyleSheet } from "react-native"
import { Text, useTheme } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const NoEventView = () => {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <MaterialCommunityIcons name="calendar-blank" size={100} color={colors.primary}/>
      <Text style={styles.text}>Start by Creating New Event from The Toggle Below</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
})

export default NoEventView

