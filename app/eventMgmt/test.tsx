import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Card, DataTable, useTheme, Text, Chip } from 'react-native-paper';

interface Student {
    id: string;
    name: string;
    matric: string;
  }

interface RouteParams {
    title: string;
    value: string;
    icon: string;
    color: string;
}

const studentData: Student[] = [
    { id: '1', name: 'Khairul Hafiq', matric: '210081' },
    { id: '2', name: 'Aminah Kuru', matric: '210082' },
    { id: '3', name: 'Samsul Bakri', matric: '210083' },
  ];

const StudentList: React.FC<{ data: Student[] }> = ({ data }) => (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title>Name</DataTable.Title>
        <DataTable.Title numeric>Matric</DataTable.Title>
      </DataTable.Header>
      {data.map((student) => (
        <DataTable.Row key={student.id}>
          <DataTable.Cell>{student.name}</DataTable.Cell>
          <DataTable.Cell numeric>{student.matric}</DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
);



export default function Test() {
    const { colors } = useTheme();
    const route = useRoute();
    const { title, value, icon, color} = route.params as RouteParams;
    const [modalVisible, setModalVisible] = useState(false);

    const chartConfig = {
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        color: (opacity = 1) => color,
        strokeWidth: 2,
        barPercentage: 0.5,
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            
            <Appbar.Header>
                <Appbar.BackAction onPress={() => { router.back(); }} />
                <Appbar.Content title={title}/>
            </Appbar.Header>
    
            <ScrollView>
                <Card style={[styles.mainCard, { backgroundColor: color, opacity: 0.85 }]}>
                    <View style={styles.mainCardContent}>
                        <MaterialCommunityIcons name={icon} size={48} color={colors.onBackground} />
                        <Text style={[styles.mainCardValue, { color: colors.onBackground }]}>{value}</Text>
                    </View>
                    <Text style={[styles.mainCardTitle, { color: colors.onBackground }]}>{title}</Text>
                </Card>
    
                <Card style={styles.card}>
                    <Card.Title title="Breakdown" />
                    <Card.Content style={styles.breakdownContent}>
                        <Chip icon="check" style={styles.chip}>On Time: 40</Chip>
                        <Chip icon="clock-alert" style={styles.chip}>Late: 5</Chip>
                        <Chip icon="close" style={styles.chip}>Absent: 5</Chip>
                    </Card.Content>
                </Card>
    
                <Card style={styles.card}>
                    <Card.Title title="On Time" />
                    <Card.Content>
                        <StudentList data={studentData} />
                    </Card.Content>
                </Card>
    
                <Card style={styles.card}>
                    <Card.Title title="Late" />
                    <Card.Content>
                        <StudentList data={studentData} />
                    </Card.Content>
                </Card>
    
                <Card style={styles.card}>
                    <Card.Title title="Absent" />
                    <Card.Content>
                        <StudentList data={studentData} />
                    </Card.Content>
                </Card>
            </ScrollView>
    
            {/* Move the button container here to keep it at the bottom */}
            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={() => { router.push('/attendance/edit') }}
                >
                    Edit
                </Button>
                <Button
                    mode="outlined"
                    style={styles.button}
                    onPress={() => setModalVisible(true)}
                >
                    Export
                </Button>
            </View>
    
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                statusBarTranslucent={true}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={styles.modalTitle}>Export</Text>
                        <Text style={styles.modalText}>Are you sure you want to export?</Text>
                        <View style={styles.modalActions}>
                            <Button onPress={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button onPress={() => {
                                // Implement export functionality
                                setModalVisible(false);
                            }}>
                                Export
                            </Button>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        
        </SafeAreaView>
    );    
}

const styles = StyleSheet.create({
    card: {
        margin: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 8,
    },
    mainCard: {
        margin: 16,
        padding: 16,
        alignItems: 'center',
    },
    mainCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    mainCardValue: {
        fontSize: 48,
        fontWeight: 'bold',
        marginLeft: 16,
        color: 'white',
    },
    mainCardTitle: {
        fontSize: 18,
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    breakdownContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    chip: {
        marginHorizontal: 4,
    },
})
