import { getTodayScrollMinutes, openDatabase } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface Badge {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: {
    light: string;
    dark: string;
  };
  unlocked: boolean;
}

export default function AwardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    checkAchievements();
  }, []);

  const checkAchievements = async () => {
    const db = await openDatabase();

    // Fetch some stats
    const todayMins = await getTodayScrollMinutes();
    const sessionCount = (await db.getFirstAsync('SELECT count(*) as c FROM sessions') as any)?.c || 0;
    const totalDuration = (await db.getFirstAsync('SELECT SUM(duration) as t FROM sessions') as any)?.t || 0;
    const distinctApps = (await db.getFirstAsync('SELECT count(distinct app_name) as c FROM sessions') as any)?.c || 0;
    const distinctContexts = (await db.getFirstAsync('SELECT count(distinct context) as c FROM sessions') as any)?.c || 0;

    // Define Badges Logic
    const allBadges: Badge[] = [
      {
        id: 'first_debt',
        title: t('awards.badges.first_debt.title'),
        description: t('awards.badges.first_debt.desc'),
        icon: 'footsteps',
        color: {
          dark: '#3b82f6',
          light: '#3b82f6'
        }, // blue
        unlocked: sessionCount > 0
      },
      {
        id: 'aware',
        title: t('awards.badges.aware.title'),
        description: t('awards.badges.aware.desc'),
        icon: 'eye',
        color: {
          dark: '#8b5cf6',
          light: '#8b5cf6'
        }, // violet
        unlocked: sessionCount >= 5
      },
      {
        id: 'marathon',
        title: t('awards.badges.marathon.title'),
        description: t('awards.badges.marathon.desc'),
        icon: 'timer',
        color: {
          dark: '#ef4444',
          light: '#ef4444'
        }, // red
        unlocked: (await db.getFirstAsync('SELECT 1 FROM sessions WHERE duration > 60')) !== null
      },
      {
        id: 'social_butterfly',
        title: t('awards.badges.social_butterfly.title'),
        description: t('awards.badges.social_butterfly.desc'),
        icon: 'people',
        color: {
          dark: '#ec4899',
          light: '#ec4899'
        }, // pink
        unlocked: distinctApps >= 3
      },
      {
        id: 'explorer',
        title: t('awards.badges.explorer.title'),
        description: t('awards.badges.explorer.desc'),
        icon: 'map',
        color: {
          dark: '#f59e0b',
          light: '#f59e0b'
        }, // amber
        unlocked: distinctContexts >= 3
      },
      {
        id: 'night_owl',
        title: t('awards.badges.night_owl.title'),
        description: t('awards.badges.night_owl.desc'),
        icon: 'moon',
        color: {
          dark: '#6366f1',
          light: '#6366f1'
        }, // indigo
        // Logic requires checking timestamps, simplified here for demo
        unlocked: false
      },
      {
        id: 'early_bird',
        title: t('awards.badges.early_bird.title'),
        description: t('awards.badges.early_bird.desc'),
        icon: 'sunny',
        color: {
          dark: '#eab308',
          light: '#eab308'
        }, // yellow
        unlocked: false
      },
      {
        id: 'streak_3',
        title: t('awards.badges.streak_3.title'),
        description: t('awards.badges.streak_3.desc'),
        icon: 'flame',
        color: {
          dark: '#f97316',
          light: '#f97316'
        }, // orange
        unlocked: false
      },
      {
        id: 'master',
        title: t('awards.badges.master.title'),
        description: t('awards.badges.master.desc'),
        icon: 'trophy',
        color: {
          dark: '#10b981',
          light: '#10b981'
        }, // emerald
        unlocked: sessionCount >= 100
      },
      {
        id: 'zen',
        title: t('awards.badges.zen.title'),
        description: t('awards.badges.zen.desc'),
        icon: 'leaf',
        color: {
          dark: '#22c55e',
          light: '#22c55e'
        }, // green
        unlocked: false // Hard to verify without explicit "day complete" check
      }
    ];

    setBadges(allBadges);
  };

  return (
    <View className="flex-1 bg-background" >
      <View className="flex-row items-center p-6 pb-6 border-b border-border">
        <TouchableOpacity 
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            router.back()}
          } 
          className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-foreground">{t('awards.title')}</Text>
      </View>

      <ScrollView 
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-row flex-wrap justify-center gap-4">
          {badges.map(badge => {
            const currentBadgeColor = colorScheme === 'dark' ? badge.color.dark : badge.color.light;

            return (
              <View key={badge.id} className="w-[45%] aspect-square items-center justify-center p-2 mb-2">
                {/* Badge Circle */}
                <View
                  style={{
                    backgroundColor: badge.unlocked ? currentBadgeColor : (colorScheme === 'dark' ? '#1a1a1a' : '#f1f5f9'),
                    borderColor: badge.unlocked ? currentBadgeColor : (colorScheme === 'dark' ? '#333' : '#e2e8f0'),
                    shadowColor: badge.unlocked ? currentBadgeColor : 'transparent',
                    shadowOpacity: badge.unlocked ? 0.5 : 0,
                    shadowRadius: 12,
                    elevation: badge.unlocked ? 8 : 0
                  }}
                  className={`w-28 h-28 rounded-full border-4 items-center justify-center mb-3 ${!badge.unlocked && 'opacity-70'}`}
                >
                  <Ionicons
                    name={badge.icon}
                    size={40}
                    color={badge.unlocked ? '#fff' : (colorScheme === 'dark' ? '#666' : '#94a3b8')}
                  />
                </View>

                <Text className="text-foreground font-bold text-center mb-1">{badge.title}</Text>
                <Text className="text-muted-foreground text-xs text-center leading-4">{badge.description}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
