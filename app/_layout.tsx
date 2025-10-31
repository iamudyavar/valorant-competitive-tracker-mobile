import { Stack } from 'expo-router';
import { ConvexClientProvider } from '../providers/ConvexClientProvider';
import { NetworkProvider } from '../providers/NetworkProvider';
import { NetworkBanner } from '../components/NetworkBanner';
import { Colors } from '../theme/colors';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Aptabase from '@aptabase/react-native';
import { useEffect } from 'react';
import { trackEvent } from '@aptabase/react-native';

// Initialize Aptabase
const aptabaseKey = process.env.EXPO_PUBLIC_APTABASE_API_KEY;
if (aptabaseKey) {
    Aptabase.init(aptabaseKey);
}

export default function RootLayout() {
    // Load fonts for the application
    let [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    // Track application open event
    useEffect(() => {
        if (fontsLoaded && aptabaseKey) {
            trackEvent('app_open');
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        // Show a loading indicator until fonts are loaded
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: Colors.background }}>
                <NetworkProvider>
                    <ConvexClientProvider>
                        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
                        <Stack screenOptions={{
                            headerStyle: {
                                backgroundColor: Colors.surface,
                            },
                            headerTintColor: '#fff',
                            headerTitleStyle: {
                                fontFamily: 'Inter_600SemiBold',
                            },
                            contentStyle: {
                                backgroundColor: Colors.background
                            },
                            gestureEnabled: true,
                            gestureDirection: 'horizontal',
                        }}>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="match/[vlrId]" options={{ title: 'Match Details', headerBackTitle: 'Back' }} />
                        </Stack>
                        <NetworkBanner />
                    </ConvexClientProvider>
                </NetworkProvider>
            </View>
        </SafeAreaProvider>
    );
}