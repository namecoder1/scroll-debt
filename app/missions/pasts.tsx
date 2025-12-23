import { AcceptedMission, getCompletedMissions } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PastMissionsScreen() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [missions, setMissions] = useState<AcceptedMission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
    setLoading(true);
    const data = await getCompletedMissions();
    setMissions(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadMissions();
    }, [])
  );

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center p-6 pb-6 border-b border-border/40"
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
          className="mr-4"
        >
          <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-foreground tracking-tighter">{t('missions.history', 'Mission Log')}</Text>
      </View>

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center mt-20">
            <ActivityIndicator size="large" />
          </View>
        ) : missions.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="time-outline" size={64} color="gray" />
            <View>
              <Text className="text-foreground mt-4 text-xl text-center font-black">
                {t('missions.no_history', 'No completed missions yet.')}
              </Text>
              <Text className="text-muted-foreground mt-2 max-w-xs text-center font-medium">
                {t('missions.no_history_description', 'No completed missions yet.')}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {missions.map((mission) => {
              const date = new Date(mission.timestamp);
              const translatedHobby = t(`hobbies.${mission.name}`, { defaultValue: mission.name });

              return (
                <View key={mission.id} className="bg-card border border-border rounded-3xl p-5">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-row gap-3 items-center flex-1">
                      <View
                        className={`p-2.5 rounded-2xl`}
                        style={{ backgroundColor: mission.color ? `${mission.color}20` : '#80808020' }}
                      >
                        <Ionicons
                          name={(mission.icon as any) || 'flag'}
                          size={20}
                          color={mission.color || 'gray'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-base text-foreground leading-tight">
                          {mission.flavor_title_key ? t(mission.flavor_title_key, { hobby: translatedHobby }) : mission.name}
                        </Text>
                        <Text className="text-xs text-muted-foreground font-medium mt-0.5">
                          {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                      <Text className="text-green-600 font-bold text-xs">-{mission.duration}m</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
