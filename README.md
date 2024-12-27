
# Portable Smart Attendance System

The **Portable Smart Attendance System** is an innovative solution designed to simplify and automate attendance management. The system uses RFID technology, paired with a mobile application, to ensure efficient and real-time tracking of attendance. This project integrates hardware and software components, leveraging React Native Expo and Firebase for robust functionality.

## Features

- **RFID-based Attendance**: Utilize RFID cards for swift and accurate attendance tracking.
- **Mobile Application**: A user-friendly mobile app built with React Native Expo for on-the-go usage.
- **Firebase Integration**: Real-time data synchronization using Firebase Realtime Database.
- **Attendance Management**: Log and manage attendance records instantly.
- **Session Association**: Link attendance logs to specific sessions or events.
- **Data Analytics**: Gain insights into attendance patterns for better decision-making.
- **Portable Sensor**: Compact and portable RFID sensor using Lilygo T-A7670G hardware.

## Project Structure

The project is divided into two main components:

1. **Mobile Application**: 
   - Developed with TypeScript and React Native Expo.
   - Features Firebase Authentication for secure user access.
   - Includes modules for managing classes, sessions, events, and student details.
   
2. **Portable RFID Sensor**:
   - Powered by Lilygo T-A7670G microcontroller.
   - Reads RFID card data and sends it to the Firebase Realtime Database via cellular connection.

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
   ```
2. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Firebase:
   - Add your Firebase configuration in the `firebaseConfig.js` file.
5. Start the application:
   ```bash
   expo start
   ```

### Portable RFID Sensor Setup
1. Set up the Lilygo T-A7670G hardware with RFID reader.
2. Flash the Lilygo T-A7670G firmware using the provided source code.
3. Configure Cellular Connection and Firebase database URL in the Lilygo T-A7670G.

## Usage

1. Power on the RFID sensor and ensure it is connected via Cellular.
2. Launch the mobile app and log in using Firebase Authentication.
3. Tap the RFID card on the sensor to log attendance.
4. Use the mobile app to manage events, sessions, and attendance logs.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests for improvements or bug fixes.

### How to Contribute
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any questions or feedback, please contact:
- **Name**: Wan
- **GitHub**: [wan00000](https://github.com/wan00000)
- **Email**: [izwanhusainy02@gmail.com]

---

Thank you for using the Portable Smart Attendance System! 😊
