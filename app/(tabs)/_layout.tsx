import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors } from '../../theme/colors';
import HomePage from './index';
import ResultsPage from './results';

const Tab = createBottomTabNavigator();

// Helper function to get iOS version
function getIOSVersion(): number | null {
  if (Platform.OS !== 'ios') return null;

  const version = Constants.platform?.ios?.systemVersion;
  if (!version) return null;
  const majorVersion = parseInt(version.split('.')[0], 10);
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

// Liquid Glass Tab Bar (used on iOS 26+)
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

  // For iOS, check version
  const iosVersion = getIOSVersion();

  // Use liquid glass tabs on iOS 26+ (both iPhone and iPad)
  if (iosVersion && iosVersion >= 26) {
    return <LiquidGlassTabLayout />;
  }

  return <NormalTabLayout />;
}
