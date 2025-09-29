import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import HomePage from './index';
import ResultsPage from './results';

const Tab = createBottomTabNavigator();

// Helper function to get iOS version
function getIOSVersion(): number | null {
  if (Platform.OS !== 'ios') return null;

  const version = Platform.Version;
  if (!version) return null;

  // Platform.Version returns a string on iOS, so we need to parse it
  const versionString = String(version);
  const majorVersion = parseInt(versionString.split('.')[0], 10);
  return majorVersion;
}

// Normal Tab Bar (used on Android and iOS 18 and below)
function NormalTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="index"
        component={HomePage}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="results"
        component={ResultsPage}
        options={{
          title: 'Results',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Liquid Glass Tab Bar (used on iOS 26+ for iPhones only)
function LiquidGlassTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="results">
        <Icon sf="list.bullet" drawable="custom_results_drawable" />
        <Label>Results</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'android') {
    return <NormalTabLayout />;
  }

  // For iOS, check version and device type
  const iosVersion = getIOSVersion();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;

  // Use liquid glass tabs on iOS 26+ only for iPhones (not iPads)
  if (iosVersion && iosVersion >= 26 && !isIPad) {
    return <LiquidGlassTabLayout />;
  }

  return <NormalTabLayout />;
}
