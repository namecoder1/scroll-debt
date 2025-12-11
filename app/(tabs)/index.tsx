import SessionItem from '@/components/SessionItem';
import { deleteSession, getAppUsageStats, getContextStats, getSetting, getTodayScrollMinutes, getTodaySessions, getWeeklyStats } from '@/lib/db';
import { getQuote, Quote } from '@/lib/quotes';
import { cn, formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { t } = useTranslation();
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

    // Update quote based on percentage
    const percentage = (total / budgetVal) * 100;
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

  const percentageUsed = Math.min((totalMinutes / budget) * 100, 100);
  const isOverBudget = totalMinutes > budget;
  const progressColor = isOverBudget ? 'bg-red-500' : 'bg-primary-foreground';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row p-4 justify-between border-b border-border items-center">
        <View>
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-1">{t('home.your_daily_budget')}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-4xl font-black text-foreground tabular-nums">
              {formatTime(totalMinutes, 'long')}
            </Text>
            <Text className="text-muted-foreground text-xl font-medium">/ {formatTime(budget, 'long')}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="p-3 bg-secondary/80 rounded-full"
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={22} color="gray" />
        </TouchableOpacity>
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
                {isOverBudget ? 'Budget Exceeded' : 'Remaining'}
              </Text>
              <Text className="text-foreground font-black text-4xl tracking-tight">
                {isOverBudget
                  ? `+${formatTime(totalMinutes - budget, 'long')}`
                  : formatTime(budget - totalMinutes, 'long')
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
            <View className="bg-primary/5 p-4 rounded-xl">
              <View className="flex-row gap-2 mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={16} className="text-primary" color={colorScheme === 'dark' ? '#fff' : '#000'} />
                <Text className="text-xs font-bold uppercase text-primary tracking-widest">Daily Wisdom</Text>
              </View>
              <Text className="text-foreground text-base font-medium italic leading-6">
                "{quote.text}"
              </Text>
            </View>
          )}
        </View>

        <View className='px-4'>


          {/* 7 Day Trend Chart */}
          <View className="mb-10">
            <Text className="text-xl font-bold text-foreground mb-6">Past 7 Days</Text>
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
                          {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-muted-foreground italic">No data yet</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Grid: Apps & Contexts */}
          <View className="gap-6 mb-10">
            <Text className="text-xl font-bold text-foreground -mb-2">Breakdown</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 py-2">
              <View className="flex-row gap-4">
                {/* Top Apps Card */}
                <View className="w-72 bg-card p-5 rounded-3xl border border-border/60 shadow-sm">
                  <Text className="font-bold text-lg text-foreground mb-4">Top Apps</Text>
                  {appStats.length === 0 ? (
                    <View className="h-32 justify-center items-center">
                      <Text className="text-muted-foreground italic">No data yet</Text>
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
                <View className="w-72 bg-card p-5 rounded-3xl border border-border/60 shadow-sm">
                  <Text className="font-bold text-lg text-foreground mb-4">Contexts</Text>
                  {contextStats.length === 0 ? (
                    <View className="h-32 justify-center items-center">
                      <Text className="text-muted-foreground italic">No data yet</Text>
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
