import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, useColorScheme, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
            borderColor: colorScheme === 'dark' ? '#222' : '#ddd',
            paddingTop: 10,
            borderTopWidth: 1,
            elevation: 0,
          },
        }}>
        <Tabs.Screen
          name="index"
          listeners={{
            tabPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            },
          }}
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          listeners={{
            tabPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            },
          }}
          options={{
            title: t('tabs.analytics'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <View className="absolute bottom-[50px] w-full items-center pointer-events-box-none" pointerEvents="box-none">
        <Link href="/add-session" asChild>
          <TouchableOpacity
            className="bg-primary h-14 w-14 rounded-full items-center justify-center shadow-lg"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <Ionicons name="add" size={32} color={colorScheme === 'dark' ? '#000' : '#fff'} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
