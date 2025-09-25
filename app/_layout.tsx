import { Stack } from 'expo-router';
import { ConvexClientProvider } from '../providers/ConvexClientProvider';
import { Colors } from '../theme/colors';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    // Load fonts for the application
    let [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    if (!fontsLoaded) {
        // Show a loading indicator until fonts are loaded
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <ConvexClientProvider>
            <StatusBar style="light" />
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
                }
            }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="match/[vlrId]" options={{ title: 'Match Details', headerBackTitle: 'Back' }} />
            </Stack>
        </ConvexClientProvider>
    );
}
