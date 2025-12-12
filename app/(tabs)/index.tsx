import MissionBriefing from '@/components/MissionBriefing';
import SessionItem from '@/components/SessionItem';
import { acceptMission, addPaybackSession, deleteSession, getAcceptedMissions, getAppUsageStats, getContextStats, getPaybackMinutes, getRandomHobbies, getSetting, getStreakStats, getTodayScrollMinutes, getTodaySessions, getWeeklyStats } from '@/lib/db';
import { getMissionFlavor } from '@/lib/mission-flavor';
import { getQuote, Quote } from '@/lib/quotes';
import { cn, formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [budget, setBudget] = useState(60);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Stats
  const [weeklyStats, setWeeklyStats] = useState<{ date: string, minutes: number }[]>([]);
  const [appStats, setAppStats] = useState<{ name: string, minutes: number, percentage: number }[]>([]);
  const [contextStats, setContextStats] = useState<{ name: string, minutes: number, percentage: number }[]>([]);
  
  // New State
  const [paybackMinutes, setPaybackMinutes] = useState(0);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0 });

  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [missionModalVisible, setMissionModalVisible] = useState(false);
  const [acceptedMissionsCount, setAcceptedMissionsCount] = useState(0);

  const loadData = async () => {
    const total = await getTodayScrollMinutes();
    const todaySessions = await getTodaySessions();
    const storedBudget = await getSetting('daily_scroll_budget');
    const budgetVal = storedBudget ? parseInt(storedBudget) : 60;

    // Stats
    const weekly = await getWeeklyStats();
    const apps = await getAppUsageStats();
    const contexts = await getContextStats();

    setTotalMinutes(total);
    setBudget(budgetVal);
    setSessions(todaySessions);
    setWeeklyStats(weekly);
    setAppStats(apps);
    setContextStats(contexts);

    // New Data
    const payback = await getPaybackMinutes();
    const streakData = await getStreakStats();
    const accepted = await getAcceptedMissions();
    
    // Only load missions if empty (or could reload random ones on pull refresh)
    const randomHobbies = await getRandomHobbies(3);
    const enrichedMissions = randomHobbies.map(h => ({
      ...h,
      name: (i18n.language === 'it' && h.name_it) ? h.name_it : h.name,
      flavor: getMissionFlavor(h.category),
      duration: 15, // Fixed duration for now
      icon: h.category === 'Active' ? 'bicycle' : h.category === 'Creative' ? 'brush' : h.category === 'Relaxing' ? 'leaf' : 'book',
      color: h.category === 'Active' ? '#ef4444' : h.category === 'Creative' ? '#a855f7' : h.category === 'Relaxing' ? '#22c55e' : '#3b82f6',
    }));
    
    setPaybackMinutes(payback);
    setStreak(streakData);
    setMissions(enrichedMissions);
    setAcceptedMissionsCount(accepted.length);

    // Logic: Net Usage = Usage - Payback
    const netMinutes = Math.max(0, total - payback);

    // Update quote based on percentage of daily budget
    const percentage = (netMinutes / budgetVal) * 100;
    setQuote(getQuote(percentage));
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

  const netMinutes = Math.max(0, totalMinutes - paybackMinutes);
  const percentageUsed = Math.min((netMinutes / budget) * 100, 100);
  const isOverBudget = netMinutes > budget;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row p-4 justify-between border-b border-border items-center">
        <View>
          <View className="flex-row items-center gap-2 mb-1">
             <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">{t('home.your_daily_budget')}</Text>
             {streak.currentStreak > 0 && (
               <View className="flex-row items-center bg-orange-500/10 px-1.5 py-0.5 rounded-md gap-1.5">
                  <FontAwesome5 name="fire-alt" size={14} color="orange" />
                 <Text className="text-[12px] font-bold text-orange-500">
                   {streak.currentStreak}
                  </Text>
               </View>
             )}
          </View>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-4xl font-black text-foreground tabular-nums">
              {formatTime(netMinutes, 'long')}
            </Text>
            <Text className="text-muted-foreground text-xl font-medium">/ {formatTime(budget, 'long')}</Text>
          </View>
        </View>
        
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-3 bg-secondary/80 rounded-full relative"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/missions')
            }}
          >
            <Ionicons name="list" size={22} color="gray" />
            {acceptedMissionsCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 justify-center items-center border-2 border-background">
                    <Text className="text-[10px] font-bold text-white">
                        {acceptedMissionsCount}
                    </Text>
                </View>
            )}
          </TouchableOpacity>

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
        className="flex-1"

        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className={`w-full bg-card p-6 mb-8 border-b border-border`}>
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-foreground font-bold text-sm uppercase tracking-wider mb-1">
                {isOverBudget ? t('home.budget_exceeded') : t('home.remaining')}
              </Text>
              <Text className="text-foreground font-black text-4xl tracking-tight">
                {isOverBudget
                  ? `+${formatTime(netMinutes - budget, 'long')}`
                  : formatTime(budget - netMinutes, 'long')
                }
              </Text>
            </View>
            <View className="bg-muted px-3 py-1.5 rounded-full">
              <Text className="text-foreground font-bold text-xs">{Math.round(percentageUsed)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-4 bg-muted rounded-full mb-6 overflow-hidden">
            <View className={cn('h-full rounded-full', isOverBudget ? 'bg-red-500' : 'bg-green-500')} style={{ width: `${Math.min(percentageUsed, 100)}%` }} />
          </View>


          {/* Quote Card */}
          {quote && (
            <View className="bg-primary/5 p-6 rounded-3xl">
              <View className="flex-row gap-2 mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={16} className="text-primary" color={colorScheme === 'dark' ? '#fff' : '#000'} />
                <Text className="text-xs font-bold uppercase text-primary tracking-widest">{t('home.daily_wisdom')}</Text>
              </View>
              <Text className="text-foreground text-base font-medium italic leading-6">
                "{t(quote.text)}"
              </Text>
            </View>
          )}
        </View>

        <View className='px-4'>


          {/* 7 Day Trend Chart */}
          <View className="mb-10">
            <Text className="text-xl font-bold text-foreground mb-6">{t('home.past_7_days')}</Text>
            <View className="h-48 bg-card/50 rounded-3xl border border-border/50 overflow-hidden">
              {weeklyStats.some(s => s.minutes > 0) ? (
                <View className="flex-row justify-between items-end h-full pt-16 px-4 pb-4">
                  {weeklyStats.map((stat, index) => {
                    const isToday = index === 6;
                    const maxVal = Math.max(budget * 1.5, ...weeklyStats.map(s => s.minutes));
                    const heightPct = Math.max((stat.minutes / maxVal) * 100, 10);

                    return (
                      <View key={index} className="items-center gap-3 flex-1 h-full justify-end">
                        {/* Data Label */}
                        <Text className="text-[10px] text-muted-foreground font-medium -mb-1">
                          {formatTime(stat.minutes)}
                        </Text>

                        {/* Bar */}
                        <View
                          className={`w-full rounded-xl mx-1 ${isToday ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                          style={{ height: `${heightPct}%`, minHeight: 20 }}
                        />

                        {/* Day Label */}
                        <Text className={`text-[12px] font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {new Date(stat.date).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-muted-foreground italic">{t('home.no_data')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Grid: Apps & Contexts */}
          <View className="gap-6 mb-10">
            <Text className="text-xl font-bold text-foreground -mb-2">{t('home.breakdown')}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 py-2">
              <View className="flex-row gap-4 pr-6">
                {/* Top Apps Card */}
                <View className="w-72 bg-card p-5 rounded-3xl border border-border/60">
                  <Text className="font-bold text-lg text-foreground mb-4">{t('home.top_apps')}</Text>
                  {appStats.length === 0 ? (
                    <View className="h-32 justify-center items-center">
                      <Text className="text-muted-foreground italic">{t('home.no_data')}</Text>
                    </View>
                  ) : (
                    <View className="gap-4">
                      {appStats.slice(0, 4).map((app, i) => (
                        <View key={i}>
                          <View className="flex-row justify-between items-end mb-2">
                            <Text className="font-semibold text-foreground text-base">{app.name}</Text>
                            <Text className="text-xs text-muted-foreground font-medium">{formatTime(app.minutes)} ({app.percentage}%)</Text>
                          </View>
                          <View className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <View className="h-full bg-blue-500 rounded-full" style={{ width: `${app.percentage}%` }} />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Contexts Card */}
                <View className="w-72 bg-card p-5 rounded-3xl border border-border/60">
                  <Text className="font-bold text-lg text-foreground mb-4">{t('home.contexts')}</Text>
                  {contextStats.length === 0 ? (
                    <View className="h-32 justify-center items-center">
                      <Text className="text-muted-foreground italic">{t('home.no_data')}</Text>
                    </View>
                  ) : (
                    <View className="gap-4">
                      {contextStats.slice(0, 4).map((ctx, i) => (
                        <View key={i}>
                          <View className="flex-row justify-between items-end mb-2">
                            <Text className="font-semibold text-foreground text-base">{ctx.name}</Text>
                            <Text className="text-xs text-muted-foreground font-medium">{formatTime(ctx.minutes)} ({ctx.percentage}%)</Text>
                          </View>
                          <View className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <View className="h-full bg-purple-500 rounded-full" style={{ width: `${ctx.percentage}%` }} />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Rescue Mode Callout */}
          {(quote?.category === 'danger' || quote?.category === 'over') && (
              <View className="mb-8">
                  <TouchableOpacity 
                      className="bg-red-500 p-5 rounded-3xl flex-row items-center justify-between"
                      onPress={() => router.push('/rescue')}
                  >
                      <View>
                          <Text className="text-white font-bold text-lg">{t('rescue.title')}</Text>
                          <Text className="text-white/80 text-xs font-medium">{t('rescue.subtitle')}</Text>
                      </View>
                      <View className="bg-white/20 p-2 rounded-full">
                          <Ionicons name="medkit" size={24} color="white" />
                      </View>
                  </TouchableOpacity>
              </View>
          )}

          {/* Payback Missions */}
          {(totalMinutes - paybackMinutes > 0) && (
               <View className="mb-10">
                  <View className="flex-row justify-between items-baseline mb-4">
                    <View>
                       <Text className="text-xl font-bold text-foreground">{t('home.payback_missions')}</Text>
                        <Text className="text-muted-foreground font-medium" numberOfLines={1} ellipsizeMode="tail">
                            {t('missions.subtitle', 'Complete missions to earn back time.')}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-muted-foreground uppercase">{t('home.net_debt')}: {formatTime(Math.max(0, totalMinutes - paybackMinutes))}</Text>
                  </View>
                  
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-4">
                     <View className="flex-row gap-3 pr-4">
                       {missions.map((mission, index) => {
                           return (
                               <TouchableOpacity 
                                   key={index} 
                                   activeOpacity={0.7}
                                   className="bg-card border border-border p-4 rounded-3xl w-48 mr-1"
                                   onPress={() => {
                                       Haptics.selectionAsync();
                                       setSelectedMission(mission);
                                       setMissionModalVisible(true);
                                   }}
                               >
                                   <View className="flex-row justify-between items-start mb-3">
                                       <View className={`p-2.5 rounded-2xl`} style={{ backgroundColor: `${mission.color}15` }}>
                                           <Ionicons 
                                               name={mission.icon} 
                                               size={22} 
                                               color={mission.color} 
                                           />
                                       </View>
                                       <View className="bg-secondary px-2.5 py-1 rounded-lg">
                                           <Text className="text-[11px] font-black text-foreground">-{mission.duration}m</Text>
                                       </View>
                                   </View>
                                   <Text className="font-bold text-foreground mb-1 leading-tight text-[15px] pr-2" numberOfLines={2}>
                                      {t(mission.flavor.titleKey)}
                                   </Text>
                                   <Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
                                       {mission.name}
                                   </Text>
                               </TouchableOpacity>
                           );
                       })}
                     </View>
                   </ScrollView>
                </View>
           )}

           <MissionBriefing 
             visible={missionModalVisible}
             mission={selectedMission}
             onClose={() => setMissionModalVisible(false)}
             onAccept={async () => {
                 if (!selectedMission) return;
                 setMissionModalVisible(false);
                 await acceptMission(selectedMission); // Changed from addPaybackSession
                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                 loadData();
             }}
             onAlreadyDone={async () => {
                 if (!selectedMission) return;
                 setMissionModalVisible(false);
                 await addPaybackSession(selectedMission.duration, selectedMission.name);
                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                 loadData();
             }}
           />


          {/* Recent History */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">{t('home.scroll_sessions')}</Text>
            {sessions.length === 0 ? (
              <View className="p-8 items-center bg-card rounded-2xl border border-dashed border-border mb-4">
                <Text className="text-muted-foreground">{t('home.no_sessions_yet')}</Text>
              </View>
            ) : (
              sessions.map((session, index) => (
                <SessionItem
                  key={index}
                  session={session}
                  onDelete={async () => {
                    await deleteSession(session.id);
                    loadData();
                  }}
                />
              ))
            )}
          </View>

          {/* Spacer - Restored for better scroll experience */}
          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Floating Action Button (Alternative placement if needed, but using inline button above) */}
    </SafeAreaView>
  );
}
