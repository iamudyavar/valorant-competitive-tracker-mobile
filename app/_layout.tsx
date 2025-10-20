import { Stack } from 'expo-router';
import { ConvexClientProvider } from '../providers/ConvexClientProvider';
import { NetworkProvider } from '../providers/NetworkProvider';
import { NetworkBanner } from '../components/NetworkBanner';
import { Colors } from '../theme/colors';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { PostHogProvider } from 'posthog-react-native';

export default function RootLayout() {
    // Load fonts for the application
    let [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
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
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <PostHogProvider
                apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
                options={{
                    host: 'https://us.i.posthog.com',
                    enableSessionReplay: true,
                }}
                autocapture
            >
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
            </PostHogProvider>
        </View>
    );
}