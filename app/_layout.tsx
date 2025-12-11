import '@/global.css';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';

cssInterop(Image, {
  className: 'style',
});

import { getSetting, initDB } from '@/lib/db';
import { initI18n } from '@/lib/i18n';
import { initNotifications } from '@/lib/notifications';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDB();
        await initI18n(); // Initialize i18n

        // Initialize notifications (request permissions & schedule)
        initNotifications().catch(console.warn);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkOnboarding = async () => {
      const onboardingCompleted = await getSetting('onboarding_completed');
      const inOnboardingGroup = segments[0] === 'onboarding';

      if (!onboardingCompleted && !inOnboardingGroup) {
        router.replace('/onboarding');
      } else if (onboardingCompleted && inOnboardingGroup) {
        router.replace('/');
      }
    };

    checkOnboarding();
  }, [isReady, segments]);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style={colorScheme === 'dark' ? 'light' : 'dark'}
          animated
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='(tabs)' />
          <Stack.Screen name='onboarding' />
          <Stack.Screen name='awards/index' options={{ presentation: 'modal', headerTitle: 'Awards' }} />
          <Stack.Screen name='settings/contexts' options={{ presentation: 'modal' }} />
        </Stack>
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
