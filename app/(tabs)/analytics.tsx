import { getAllTimeStats, getAverageDailyScroll, getBusiestDayStats, getDayPartStats, getMissionStats, getThisWeekStats, getTopContext } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function AnalyticsScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    totalSessions: 0,
    longestSession: 0,
    averageDaily: 0,
    busiestDay: null as { dayIndex: number, minutes: number } | null,
    topContext: null as { name: string, count: number } | null,
    weekly: [] as { date: string, minutes: number }[],
    dayParts: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    missions: {
        totalAccepted: 0,
        completed: 0,
        abandoned: 0,
        pending: 0,
        totalRecoveredMinutes: 0,
        completionRate: 0,
        recoveryRatio: 0
    }
  });

  const loadData = async () => {
    try {
      const allTime = await getAllTimeStats();
      const avgDaily = await getAverageDailyScroll();
      const busiest = await getBusiestDayStats();
      const topCtx = await getTopContext();
      const weekly = await getThisWeekStats();
      const dayParts = await getDayPartStats();
      const missionStats = await getMissionStats();

      setStats({
        totalMinutes: allTime.totalMinutes,
        totalSessions: allTime.totalSessions,
        longestSession: allTime.longestSession,
        averageDaily: avgDaily,
        busiestDay: busiest,
        topContext: topCtx,
        weekly,
        dayParts,
        missions: missionStats
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

  // Calculate Net Debt (Total Scroll - Total Recovered)
  const netDebt = Math.max(0, stats.totalMinutes - stats.missions.totalRecoveredMinutes);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="p-4 border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-foreground font-black text-3xl">{t('analytics.title')}</Text>
          <Text className="text-muted-foreground text-base font-medium">{t('analytics.lifetime_statistics')}</Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-3 bg-secondary/80 rounded-full"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings')
            }}
          >
            <Ionicons name="settings-outline" size={22} color="gray" />
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-4 pb-24">
          
          {/* Main Cards Row */}
          <View className="flex-row gap-4">
              {/* Total Debt (Original) turned into Net Debt focus if missions exist */}
              <View className="flex-1 bg-card p-5 rounded-3xl border border-border ">
                <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics.net_debt')}</Text>
                <Text className="text-foreground font-black text-3xl mb-1 tabular-nums">
                  {formatTime(netDebt, 'short')}
                </Text>
                <Text className="text-muted-foreground text-[12px] font-medium">
                   {t('analytics.total_debt')}: {formatTime(stats.totalMinutes, 'short')}
                </Text>
              </View>

               {/* Recovered Time */}
               <View className="flex-1 bg-green-500/10 p-5 rounded-3xl border border-green-500/20 ">
                <Text className="text-green-600/70 font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics.time_recovered')}</Text>
                <Text className="text-green-600 font-black text-3xl mb-1 tabular-nums">
                  {formatTime(stats.missions.totalRecoveredMinutes, 'short')}
                </Text>
                 <Text className="text-green-600/70 text-[12px] font-medium">
                   -{stats.missions.recoveryRatio}% {t('analytics.total_debt').toLowerCase()}
                </Text>
              </View>
          </View>

          <View className="flex-row gap-4">
            {/* Daily Average */}
            <View className="flex-1 bg-secondary/30 p-5 rounded-3xl border border-border/50">
              <Ionicons name="calendar-outline" size={24} color="#888" className="mb-3" />
              <Text className="text-foreground font-bold text-2xl mb-1 tabular-nums">{formatTime(stats.averageDaily, 'long')}</Text>
              <Text className="text-muted-foreground text-xs font-bold uppercase">{t('analytics.daily_avg')}</Text>
            </View>

            {/* Longest Session */}
            <View className="flex-1 bg-secondary/30 p-5 rounded-3xl border border-border/50">
              <Ionicons name="hourglass-outline" size={24} color="#888" className="mb-3" />
              <Text className="text-foreground font-bold text-2xl mb-1 tabular-nums">{formatTime(stats.longestSession, 'long')}</Text>
              <Text className="text-muted-foreground text-xs font-bold uppercase">{t('analytics.longest_run')}</Text>
            </View>
          </View>

          {/* Mission Stats Section */}
          <View className="mb-2">
            <View className="flex-row items-baseline justify-between mb-4 mt-2">
                <Text className="text-xl font-bold text-foreground">{t('analytics.missions_title')}</Text> 
            </View>
            <View className="flex-row gap-4">
                <View className="flex-1 bg-card p-4 rounded-3xl border border-border items-center justify-center">
                    <View className="w-16 h-16 rounded-full border-4 border-primary/20 items-center justify-center mb-2" style={{borderTopColor: '#3b82f6', borderRightColor: '#3b82f6'}}>
                         <Text className="text-xl font-black text-foreground">{stats.missions.completed}</Text>
                    </View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase">{t('analytics.mission_completed')}</Text>
                </View>
                 <View className="flex-1 bg-card p-4 rounded-3xl border border-border items-center justify-center">
                    <View className="w-16 h-16 rounded-full border-4 border-green-500/20 items-center justify-center mb-2">
                         <Text className="text-xl font-black text-green-500">{stats.missions.completionRate}%</Text>
                    </View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase">{t('analytics.mission_success_rate')}</Text>
                </View>
            </View>
          </View>

          {/* Busiest Day */}
          {stats.busiestDay && (
            <View className="bg-card p-5 rounded-3xl border border-border flex-row items-center gap-4">
              <View className="bg-red-500/10 p-3 rounded-full">
                <Ionicons name="flame" size={24} color="#ef4444" />
              </View>
              <View>
                <Text className="text-foreground font-bold text-lg">{t(`analytics.days.${stats.busiestDay.dayIndex}`)}</Text>
                <Text className="text-muted-foreground text-sm">{t('analytics.most_active_day')} ({formatTime(stats.busiestDay.minutes, 'long')})</Text>
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
                {/* Try to translate system contexts, fallback to raw name for custom ones */}
                <Text className="text-foreground font-bold text-lg">
                  {t(`analytics.contexts.${stats.topContext.name}`, { defaultValue: stats.topContext.name })}
                </Text>
                <Text className="text-muted-foreground text-sm">{t('analytics.most_common_context')} ({stats.topContext.count} times)</Text>
              </View>
            </View>
          )}


          {/* Recent Activity (Weekly) */}
          <View className="mb-6">
            <View className="flex-row items-baseline justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">{t('analytics.recent_activity', {defaultValue: 'Recent Activity'})}</Text>
              <Text className="text-xs text-muted-foreground">{t('analytics.last_7_days', { defaultValue: 'Last 7 Days' })}</Text>
            </View>
            
            <View className="bg-card p-4 rounded-3xl border border-border">
                <View className="flex-row items-end justify-between h-48 pt-4">
                    {stats.weekly.map((d, i) => {
                        const maxVal = Math.max(60, ...stats.weekly.map(s => s.minutes));
                        // Ensure at least a little height so it's visible if 0? No, 0 should be empty.
                        // But let's enhance it with a min height for visibility if > 0
                        const h = d.minutes === 0 ? 0 : Math.max(5, (d.minutes / maxVal) * 100); 
                        const date = new Date(d.date);
                        // Get day name (Mon, Tue) localized
                        const dayName = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(date); 
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <View key={i} className="items-center flex-1 gap-2">
                                {/* Value Label */}
                                {d.minutes > 0 ? (
                                     <Text className="text-[10px] text-muted-foreground font-medium">
                                        {formatTime(d.minutes)}
                                    </Text>
                                ) : <View className="h-3"/>}
                               
                                {/* Bar Track */}
                                <View className="w-2 bg-secondary/50 rounded-full h-full flex-1 justify-end overflow-hidden relative">
                                    <View 
                                        className={`w-full rounded-full absolute bottom-0 ${isToday ? 'bg-primary' : 'bg-primary/60'}`} 
                                        style={{ height: `${h}%` }} 
                                    />
                                </View>
                                
                                {/* Day Label */}
                                <Text className={`text-[10px] uppercase font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {dayName}
                                </Text>
                            </View>
                        )
                    })}
                </View>
            </View>
          </View>

          {/* Activity by Time of Day */}
          <View className="mb-10">
             <View className="flex-row items-baseline justify-between mb-4">
                <Text className="text-xl font-bold text-foreground">{t('analytics.activity_by_time', { defaultValue: 'Activity by Time of Day' })}</Text> 
            </View>
            <View className="bg-card p-5 rounded-3xl border border-border gap-4">
               {['morning', 'afternoon', 'evening', 'night'].map((part) => {
                   // @ts-ignore
                   const minutes = stats.dayParts[part] || 0;
                   const totalMinutes = Object.values(stats.dayParts).reduce((a: any, b: any) => a + b, 0);
                   const p = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
                   
                   return (
                       <View key={part} className="gap-2">
                           <View className="flex-row justify-between items-center">
                               <View className="flex-row items-center gap-2">
                                  <Ionicons name={
                                      part === 'morning' ? 'sunny-outline' :
                                      part === 'afternoon' ? 'partly-sunny-outline' :
                                      part === 'evening' ? 'moon-outline' : 'cloudy-night-outline'
                                  } size={16} color="gray" />
                                  <Text className="text-sm font-medium text-foreground capitalize">
                                      {t(`analytics.day_parts.${part}`, { defaultValue: part })}
                                  </Text>
                               </View>
                               <Text className="text-xs text-muted-foreground font-medium">{formatTime(minutes)}</Text>
                           </View>
                           <View className="h-2 bg-secondary rounded-full overflow-hidden">
                               <View className="h-full bg-blue-500 rounded-full" style={{ width: `${p}%` }} />
                           </View>
                       </View>
                   )
               })}
            </View>
          </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}
