import { auth } from "@/firebaseConfig";
import { Slot, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { ActivityIndicator, PaperProvider, useTheme } from "react-native-paper";



const AuthLayout = () => {
    const { colors } = useTheme();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            router.replace("/(tabs)/home"); // Navigate to home if authenticated
        } else {
            setUser(null);
            setLoading(false); // Stop loading if no user is authenticated
        }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
        );
    }

    return(
        <>
        <PaperProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Slot />
            </SafeAreaView>
        </PaperProvider>
        </>
    );
};

export default AuthLayout;