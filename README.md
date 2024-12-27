# Portable Smart Attendance System

The **Portable Smart Attendance System** is an innovative solution designed to simplify and automate attendance management. The system uses RFID technology, paired with a mobile application, to ensure efficient and real-time tracking of attendance. This project integrates hardware and software components, leveraging React Native Expo and Firebase for robust functionality.

## Features

- **RFID-based Attendance**: Utilize RFID cards for swift and accurate attendance tracking.
- **Mobile Application**: A user-friendly mobile app built with React Native Expo for on-the-go usage.
- **Firebase Integration**: Real-time data synchronization using Firebase Realtime Database.
- **Attendance Management**: Log and manage attendance records instantly.
- **Session Association**: Link attendance logs to specific sessions or events.
- **Data Analytics**: Gain insights into attendance patterns for better decision-making.
- **Portable Sensor**: Compact and portable RFID sensor using ESP32 hardware.

## Project Structure

The project is divided into two main components:

1. **Mobile Application**: 
   - Developed with TypeScript and React Native Expo.
   - Features Firebase Authentication for secure user access.
   - Includes modules for managing classes, sessions, events, and student details.
   
2. **Portable RFID Sensor**:
   - Powered by ESP32 microcontroller.
   - Reads RFID card data and sends it to the Firebase Realtime Database via Wi-Fi.

## Database Structure

The system uses Firebase Realtime Database for real-time data handling. Key database structures include:

- **students**: Stores student information (e.g., card number, name, matriculation number, phone number).
- **events**: Manages events and their associated sessions.
- **activeSessions**: Tracks active event sessions.
- **attendanceLogs**: Logs timestamps and RFID card data for attendance.
- **attendance**: Records detailed attendance data including check-in and check-out times.

## Setup Instructions

### Prerequisites
1. Node.js and npm installed.
2. Expo CLI installed globally.
3. Firebase project with Realtime Database configured.

### Mobile Application Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/wan00000/portable-smart-attendance-system.git