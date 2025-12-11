import { getAllTimeStats, getAverageDailyScroll, getBusiestDayStats, getTopContext } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    totalSessions: 0,
    longestSession: 0,
    averageDaily: 0,
    busiestDay: null as { dayName: string, minutes: number } | null,
    topContext: null as { name: string, count: number } | null,
  });

  const loadData = async () => {
    try {
      const allTime = await getAllTimeStats();
      const avgDaily = await getAverageDailyScroll();
      const busiest = await getBusiestDayStats();
      const topCtx = await getTopContext();

      setStats({
        totalMinutes: allTime.totalMinutes,
        totalSessions: allTime.totalSessions,
        longestSession: allTime.longestSession,
        averageDaily: avgDaily,
        busiestDay: busiest,
        topContext: topCtx,
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  if (!loading && stats.totalSessions === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
        <View className="bg-secondary/50 p-8 rounded-full mb-6">
          <Ionicons name="bar-chart-outline" size={64} color="gray" />
        </View>
        <Text className="text-foreground font-bold text-2xl mb-2 text-center">{t('analytics.no_data_title')}</Text>
        <Text className="text-muted-foreground text-center text-lg">
          {t('analytics.no_data')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="p-4 border-b border-border">
        <Text className="text-foreground font-black text-3xl">{t('analytics.title')}</Text>
        <Text className="text-muted-foreground text-base font-medium">{t('analytics.lifetime_statistics')}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-4 pb-24">
          {/* Main Debt Card */}
          <View className="bg-card w-full p-6 rounded-3xl border border-border shadow-sm">
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-2">{t('analytics.total_debt')}</Text>
            <Text className="text-foreground font-black text-5xl mb-2 tabular-nums">
              {formatTime(stats.totalMinutes)}
            </Text>
            <Text className="text-muted-foreground text-sm font-medium">
              {t('analytics.time_spent_desc', { count: stats.totalSessions })}
            </Text>
          </View>

          <View className="flex-row gap-4">
            {/* Daily Average */}
            <View className="flex-1 bg-secondary/30 p-5 rounded-3xl border border-border/50">
              <Ionicons name="calendar-outline" size={24} color="#888" className="mb-3" />
              <Text className="text-foreground font-bold text-2xl mb-1 tabular-nums">{formatTime(stats.averageDaily)}</Text>
              <Text className="text-muted-foreground text-xs font-bold uppercase">{t('analytics.daily_avg')}</Text>
            </View>

            {/* Longest Session */}
            <View className="flex-1 bg-secondary/30 p-5 rounded-3xl border border-border/50">
              <Ionicons name="hourglass-outline" size={24} color="#888" className="mb-3" />
              <Text className="text-foreground font-bold text-2xl mb-1 tabular-nums">{formatTime(stats.longestSession)}</Text>
              <Text className="text-muted-foreground text-xs font-bold uppercase">{t('analytics.longest_run')}</Text>
            </View>
          </View>

          {/* Busiest Day */}
          {stats.busiestDay && (
            <View className="bg-card p-5 rounded-3xl border border-border flex-row items-center gap-4">
              <View className="bg-red-500/10 p-3 rounded-full">
                <Ionicons name="flame" size={24} color="#ef4444" />
              </View>
              <View>
                <Text className="text-foreground font-bold text-lg">{stats.busiestDay.dayName}</Text>
                <Text className="text-muted-foreground text-sm">{t('analytics.most_active_day')} ({formatTime(stats.busiestDay.minutes)})</Text>
              </View>
            </View>
          )}

          {/* Most Frequent Context */}
          {stats.topContext && (
            <View className="bg-card p-5 rounded-3xl border border-border flex-row items-center gap-4">
              <View className="bg-blue-500/10 p-3 rounded-full">
                <Ionicons name="bed" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-foreground font-bold text-lg">{stats.topContext.name}</Text>
                <Text className="text-muted-foreground text-sm">{t('analytics.most_common_context')} ({stats.topContext.count} times)</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
