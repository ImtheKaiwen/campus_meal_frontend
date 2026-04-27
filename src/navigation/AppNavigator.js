import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DeveloperScreen from '../screens/DeveloperScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const isFirstLaunch = useAppStore((state) => state.isFirstLaunch);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Zustand verilerinin AsyncStorage'den tam olarak okunmasını bekliyoruz
    const unsub = useAppStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(useAppStore.persist.hasHydrated());
    
    return () => {
      unsub();
    };
  }, []);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#3A86FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="Developer" 
            component={DeveloperScreen} 
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;