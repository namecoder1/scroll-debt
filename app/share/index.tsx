import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import Button from '@/components/ui/button';
import { getStatsForRange } from '@/lib/db';
import { formatTime } from '@/lib/utils';

export default function ShareScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const viewShotRef = useRef<ViewShot>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalMinutes: number;
    dailyAvg: number;
    completionRate: number;
    topContext: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const start = monday.getTime();
      const end = new Date().getTime();

      const data = await getStatsForRange(start, end);

      const avgDaily =
        data.dailyStats.length > 0
          ? Math.round(data.totalMinutes / data.dailyStats.length)
          : 0;

      setStats({
        totalMinutes: data.totalMinutes,
        dailyAvg: avgDaily,
        completionRate: data.missions.completionRate,
        topContext: data.topContext
          ? t(`analytics.contexts.${data.topContext.name}`, {
              defaultValue: data.topContext.name,
            })
          : t('analytics.no_data_short'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onShare = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        if (!(await Sharing.isAvailableAsync())) {
          alert('Sharing is not available on this device');
          return;
        }
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const bgImage = i18n.language.startsWith('it')
    ? require('@/assets/images/share-img-it.png')
    : require('@/assets/images/share-img-en.png');

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
            <Ionicons name="close" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-black text-foreground tracking-tighter">{t('analytics.share')}</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center p-4">
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0 }}
            style={{ borderRadius: 20, overflow: 'hidden' }}
          >
            <ImageBackground
              source={bgImage}
              style={{ width: 320, height: 568 }} // Approximate typical social story size ratio or card
              resizeMode="contain"
            >
              {stats && (
                <View style={StyleSheet.absoluteFill}>
                  
                  {/* Row 1: Green & Yellow Boxes (approx 53% top) */}

                  {/* Green Box: Completion Rate (Top Left) */}
                  <View 
                    className='flex-col items-center justify-center'
                    style={{ position: 'absolute', top: '52.5%', left: '7%', width: '40%' }}
                  >
                     <Text className="text-[12px] font-semibold text-white text-center">{t('analytics.completion_rate')}</Text>
                     <Text className="text-3xl font-black mx-auto text-white text-center">{stats.completionRate / 100}</Text>
                  </View>

                  {/* Yellow Box: Top Context (Top Right) */}
                  <View 
                    className='flex-col items-center justify-center'
                    style={{ position: 'absolute', top: '52.5%', right: '5.5%', width: '44%', alignItems: 'center' }}
                  >
                    <Text className="text-[12px] font-semibold text-white text-center">{t('analytics.top_context')}</Text>
                    <Text className="text-xl font-black text-white text-center" numberOfLines={2} adjustsFontSizeToFit>{stats.topContext}</Text>
                  </View>


                  {/* Row 2: Red & Purple Boxes (approx 71% top) */}

                  {/* Red Box: Total Usage (Bottom Left) */}
                  <View 
                    className='flex-col items-center justify-center'
                    style={{ position: 'absolute', top: '70%', left: '6%', width: '44%', alignItems: 'center' }}
                  >
                    <Text className="text-[12px] font-semibold text-white text-center">{t('analytics.total_usage')}</Text>
                    <Text className="text-3xl font-black text-white text-center">{formatTime(stats.totalMinutes, 'long')}</Text>
                  </View>

                   {/* Purple Box: Daily Avg (Bottom Right) */}
                   <View 
                    className='flex-col items-center justify-center'
                    style={{ position: 'absolute', top: '70%', right: '5.5%', width: '44%', alignItems: 'center' }}
                  >
                    <Text className="text-[12px] font-semibold text-white text-center">{t('analytics.daily_avg')}</Text>
                    <Text className="text-3xl font-black text-white text-center">{formatTime(stats.dailyAvg, 'long')}</Text>
                  </View>

                </View>
              )}
            </ImageBackground>
          </ViewShot>
        )}
      </View>

      <View className="p-8 w-full items-center">
        <Button
          className='w-full rounded-3xl'
          size='xl'
          onPress={onShare}
        >
          <View className='mx-auto flex-row items-center gap-2'>
            <Ionicons name="share-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
            <Text className="text-white dark:text-black font-bold text-lg">
              {t('analytics.share', { defaultValue: 'Share' })}
            </Text>
          </View>
        </Button>
      </View>
    </View>
  );
}