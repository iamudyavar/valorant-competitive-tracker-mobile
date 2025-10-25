import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={Colors.surface}
      labelStyle={{
        color: Colors.textSecondary,
      }}
      tintColor={Colors.accent}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        {Platform.select({
          ios: <Icon sf="house.fill" />,
          android: <Icon src={<VectorIcon family={Ionicons} name="home" />} />
        })}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="results">
        {Platform.select({
          ios: <Icon sf="list.bullet" />,
          android: <Icon src={<VectorIcon family={Ionicons} name="list" />} />
        })}
        <Label>Results</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
