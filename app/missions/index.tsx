import { abandonMission, AcceptedMission, completeAcceptedMission, getAcceptedMissions } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MissionsScreen() {
  const colorScheme = useColorScheme()
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [missions, setMissions] = useState<AcceptedMission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
      setLoading(true);
      const data = await getAcceptedMissions();
      setMissions(data);
      setLoading(false);
  };

  useFocusEffect(
      useCallback(() => {
          loadMissions();
      }, [])
  );

  const handleComplete = async (mission: AcceptedMission) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeAcceptedMission(mission.id);
      loadMissions(); // Reload list
  };

  const handleAbandon = async (mission: AcceptedMission) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
          t('missions.abandon_title', 'Abandon Mission?'),
          t('missions.abandon_confirm', 'Are you sure you want to abandon this mission? You cannot undo this.'),
          [
              { text: t('common.cancel', 'Cancel'), style: 'cancel' },
              { 
                  text: t('missions.abandon', 'Abandon'), 
                  style: 'destructive', 
                  onPress: async () => {
                      await abandonMission(mission.id);
                      loadMissions();
                  }
              }
          ]
      );
  };

  return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between p-6 pb-4 border-b border-border/40">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                router.back()}
              } 
              className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-black text-foreground tracking-tighter">{t('missions.title')}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="bg-secondary/70 dark:bg-primary p-3 rounded-full ml-2"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/missions/pasts');
            }}
          >
            <Ionicons name="time-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className='flex-1 p-4'
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" />
            </View>
          ) : missions.length === 0 ? (
            <View className="flex-1 justify-center items-center py-10">
              <Ionicons name="flag-outline" size={64} color="gray" />
              <View>
                <Text className="text-foreground mt-4 text-xl text-center font-black">
                  {t('missions.no_missions_title', 'No active missions.\nGo back to accept a new challenge!')}
                </Text>
                <Text className="text-muted-foreground mt-2 max-w-xs text-center font-medium">
                  {t('missions.no_missions_description', 'No active missions.\nGo back to accept a new challenge!')}
                </Text>
              </View>
            </View>
          ) : (
              <View className='flex-col justify-center gap-4'>
                {missions.map(mission => {
                  const translatedHobby = t(`hobbies.${mission.name}`, { defaultValue: mission.name });
                  
                  return (
                      <View key={mission.id} className="bg-card/60 border border-border rounded-3xl p-5 mb-4">
                        <View className="flex-row justify-between items-start mb-4">
                          <View className="flex-row gap-3 items-center flex-1">
                            <View className={`p-3 rounded-2xl`} style={{ backgroundColor: mission.color ? `${mission.color}20` : '#80808020' }}>
                              <Ionicons 
                                  name={mission.icon as any || 'flag'} 
                                  size={24} 
                                  color={mission.color || 'gray'} 
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="font-bold text-lg text-foreground leading-tight">
                                {mission.flavor_title_key ? t(mission.flavor_title_key, { hobby: translatedHobby }) : mission.name}
                              </Text>
                              <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                                {translatedHobby} • {mission.duration} min
                              </Text>
                            </View>
                          </View>
                          <View className="bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                            <Text className="text-green-600 font-bold text-xs">-{mission.duration}m</Text>
                          </View>
                        </View>
                        
                        {mission.flavor_desc_key && (
                          <Text className="text-muted-foreground text-sm mb-5 leading-5">
                            {t(mission.flavor_desc_key, { hobby: translatedHobby })}
                          </Text>
                        )}

                        <View className="flex-row gap-3">
                          <TouchableOpacity 
                            className="flex-1 bg-primary py-3 rounded-xl items-center flex-row justify-center gap-2"
                            onPress={() => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                              handleComplete(mission)
                            }}
                          >
                            <Ionicons name="checkmark-circle" size={18} color={colorScheme === 'dark' ? 'black' : 'white'} />
                            <Text className="text-white dark:text-black font-bold">
                              {t('missions.complete', 'Complete')}
                            </Text>
                          </TouchableOpacity>
                            
                          <TouchableOpacity 
                            className="bg-destructive/90 px-4 py-3 rounded-xl items-center justify-center border border-destructive"
                            onPress={() => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                              handleAbandon(mission)
                            }}
                          >
                            <Ionicons name="trash-outline" size={18} color="white" />
                          </TouchableOpacity>
                        </View>
                  </View>
                  )
                })}
              </View>
          )}
        </ScrollView>
      </View>
  );
}
