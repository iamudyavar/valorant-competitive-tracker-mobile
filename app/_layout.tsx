import { Stack } from 'expo-router';
import { ConvexClientProvider } from '../providers/ConvexClientProvider';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <ConvexClientProvider>
            <Stack screenOptions={{
                headerStyle: {
                    backgroundColor: '#1E1E1E',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontFamily: 'Inter_600SemiBold',
                },
                contentStyle: {
                    backgroundColor: '#121212'
                }
            }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="match/[vlrId]" options={{ title: 'Match Details' }} />
            </Stack>
        </ConvexClientProvider>
    );
}
