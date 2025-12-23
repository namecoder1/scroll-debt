import { SingleCalendar } from '@/components/calendars/single-calendar';
import { getSetting, getStatsForRange } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';
import LegendItem from '../ui/legend-item';
import AppUsageChart from './AppUsageChart';

interface AnalyticsViewProps {
	period: 'week' | 'month';
}

export default function AnalyticsView({ period }: AnalyticsViewProps) {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [data, setData] = useState<{
		totalMinutes: number;
		dailyStats: { date: string, minutes: number }[];
		dayParts: { morning: number, afternoon: number, evening: number, night: number };
		hotApps: { name: string, totalMinutes: number, hourlyDistribution: number[] }[];
		busiestDay: { dayIndex: number; minutes: number } | null;
		topContext: { name: string; minutes: number } | null;
		longestSession: number;
		missions: any;
		budget: number;
	} | null>(null);

	const loadData = useCallback(async () => {
		try {
			const budgetStr = await getSetting('daily_scroll_budget');
			const budget = budgetStr ? parseInt(budgetStr) : 60;

			const now = new Date();
			let start = 0;
			let end = now.getTime();

			if (period === 'week') {
				// Start of current week (Monday)
				const day = now.getDay();
				const diff = now.getDate() - day + (day === 0 ? -6 : 1);
				const monday = new Date(now.setDate(diff));
				monday.setHours(0, 0, 0, 0);
				start = monday.getTime();
			} else {
				// Start of current month (1st)
				const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
				start = firstDay.getTime();
			}

			const stats = await getStatsForRange(start, end);

			if (period === 'week') {
				// Fill in missing days for the full week (Mon-Sun)
				const fullWeekStats = [];
				const current = new Date(start);
				
				for (let i = 0; i < 7; i++) {
					const d = new Date(current);
					d.setDate(d.getDate() + i);
					
					const year = d.getFullYear();
					const month = String(d.getMonth() + 1).padStart(2, '0');
					const day = String(d.getDate()).padStart(2, '0');
					const dateStr = `${year}-${month}-${day}`;
					
					const found = stats.dailyStats.find(s => s.date === dateStr);
					fullWeekStats.push({
						date: dateStr,
						minutes: found ? found.minutes : 0
					});
				}
				stats.dailyStats = fullWeekStats;
			}

			setData({
				...stats,
				budget
			});

		} finally {
			setLoading(false);
		}
	}, [period]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	};

	if (!data && loading) {
		return <View className="flex-1 justify-center items-center"><Text className="text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</Text></View>;
	}

	if (!data) return null;

	const avgDaily = data.dailyStats.length > 0 ? Math.round(data.totalMinutes / data.dailyStats.length) : 0;

	return (
		<ScrollView
			className="flex-1 px-4 pt-20"
			contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			showsVerticalScrollIndicator={false}
		>
			<View className="gap-6">

				{/* Overview Cards */}
				<View className="flex-row gap-4">
					<View className="flex-1 bg-card p-5 rounded-3xl border border-border">
						<Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics.total_usage', { defaultValue: 'Total Usage' })}</Text>
						<Text className="text-foreground font-black text-2xl mb-1 tabular-nums">
							{formatTime(data.totalMinutes, 'short')}
						</Text>
						<Text className="text-muted-foreground text-[10px] uppercase tracking-widest mt-2">{t('analytics.daily_avg', { defaultValue: 'Daily Avg' })}</Text>
						<Text className="text-foreground font-bold text-lg mb-1 tabular-nums">
							{formatTime(avgDaily, 'long')}
						</Text>
					</View>

					{/* Missions Stats or Longest Session */}
					<View className="flex-1 bg-card p-5 rounded-3xl border border-border justify-between">
						<View>
							<Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics.missions_title')}</Text>
							<View className="flex-row items-baseline gap-1">
								<Text className="text-foreground font-black text-2xl mb-1 tabular-nums">{data.missions.completed}</Text>
								<Text className="text-muted-foreground text-xs font-bold">/ {data.missions.totalAccepted}</Text>
							</View>
						</View>
						<View>
							<Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics.mission_success_rate')}</Text>
							<Text className="text-green-600 dark:text-green-500 font-bold text-lg">{data.missions.completionRate}%</Text>
						</View>
					</View>
				</View>

				{/* Busiest Day & Top Context */}
				<View className="flex-row gap-4">
					{data.busiestDay && (
						<View className="flex-1 bg-card p-4 rounded-3xl border border-border items-start justify-center gap-2">
							<View className="bg-red-500/10 p-2 rounded-full">
								<Ionicons name="flame" size={20} color="#ef4444" />
							</View>
							<View>
								<Text className="text-xs text-muted-foreground font-bold uppercase">{t('analytics.most_active_day')}</Text>
								<Text className="text-foreground font-bold text-base capitalize">{t(`analytics.days.${data.busiestDay.dayIndex}`)}</Text>
							</View>
						</View>
					)}
					{data.topContext && (
						<View className="flex-1 bg-card p-4 rounded-3xl border border-border items-start justify-center gap-2">
							<View className="bg-blue-500/10 p-2 rounded-full">
								<Ionicons name="bed" size={20} color="#3b82f6" />
							</View>
							<View>
								<Text className="text-xs text-muted-foreground font-bold uppercase">{t('analytics.most_common_context')}</Text>
								<Text className="text-foreground font-bold text-base capitalize">{t(`analytics.contexts.${data.topContext.name}`, { defaultValue: data.topContext.name })}</Text>
							</View>
						</View>
					)}
				</View>

				{/* Recent Activity / Calendar */}
				<View>
					<Text className="text-xl font-bold text-foreground mb-4">{t('analytics.activity_trend', { defaultValue: 'Activity Trend' })}</Text>
					{period === 'month' ? (
						<View className="bg-card rounded-3xl border border-border overflow-hidden h-fit">
							<SingleCalendar />
							<View className="flex-row items-center justify-center flex-wrap gap-3 py-4 px-6 border-t border-border">
								<LegendItem color="#22c55e" label="< 25%" />
								<LegendItem color="#eab308" label="25% - 50%" />
								<LegendItem color="#ef4444" label="50% - 100%" />
								<LegendItem color="#a855f7" label="> 100%" />
							</View>
						</View>
					) : (
						<View className="bg-card p-4 rounded-3xl border border-border h-48 flex-row items-end justify-between gap-1 pt-8">
							{data.dailyStats.map((stat, i) => {
								const maxVal = Math.max(data.budget * 1.5, ...data.dailyStats.map(s => s.minutes));
								const heightPct = Math.max(5, (stat.minutes / maxVal) * 100);
								const date = new Date(stat.date);
								const dayLabel = date.toLocaleDateString(i18n.language, { weekday: 'narrow' });

								const percentageOfBudget = (stat.minutes / data.budget) * 100;
								let barColor = 'bg-primary';
								if (percentageOfBudget <= 25) barColor = 'bg-green-500 dark:bg-green-400';
								else if (percentageOfBudget <= 50) barColor = 'bg-yellow-500 dark:bg-yellow-400';
								else if (percentageOfBudget <= 100) barColor = 'bg-red-500 dark:bg-red-400';
								else barColor = 'bg-purple-500 dark:bg-purple-400';

								return (
									<View key={i} className="flex-1 items-center gap-2 h-full justify-end">
										{stat.minutes > 0 ? (
											<View className={`w-full rounded-t-sm ${barColor}`} style={{ height: `${heightPct}%` }} />
										) : (
											<View className="w-full h-[1px] bg-muted/20" />
										)}
										<Text className="text-[9px] text-muted-foreground text-center" numberOfLines={1}>
											{dayLabel}
										</Text>
									</View>
								);
							})}
							{data.dailyStats.length === 0 && (
								<View className="absolute inset-0 items-center justify-center px-6">
									<Text className="text-foreground text-center italic text-xs">{t('analytics.no_data')}</Text>
								</View>
							)}
						</View>
					)}
				</View>

				{/* Time of Day */}
				<View>
					<Text className="text-xl font-bold text-foreground mb-4">{t('analytics.activity_by_time')}</Text>
					<View className="bg-card p-5 rounded-3xl border border-border gap-4">
						{['morning', 'afternoon', 'evening', 'night'].map((part) => {
							// @ts-ignore
							const mins = data.dayParts[part] || 0;
							const totalMins = Object.values(data.dayParts).reduce((a: any, b: any) => a + b, 0);
							const pct = totalMins > 0 ? (mins / totalMins) * 100 : 0;

							let barColor = 'bg-primary';
							if (pct <= 25) barColor = 'bg-green-500 dark:bg-green-400';
							else if (pct <= 50) barColor = 'bg-yellow-500 dark:bg-yellow-400';
							else barColor = 'bg-red-500 dark:bg-red-400';

							return (
								<View key={part} className="gap-2">
									<View className="flex-row justify-between items-center">
										<View className="flex-row items-center gap-2">
											<Ionicons name={
												part === 'morning' ? 'sunny-outline' :
													part === 'afternoon' ? 'partly-sunny-outline' :
														part === 'evening' ? 'moon-outline' : 'cloudy-night-outline'
											} size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
											<Text className="text-sm font-medium text-foreground capitalize">
												{t(`analytics.day_parts.${part}`, { defaultValue: part })}
											</Text>
										</View>
										<Text className="text-xs text-muted-foreground font-medium">{formatTime(mins, 'long')}</Text>
									</View>
									<View className="h-2 bg-muted/20 rounded-full overflow-hidden">
										<View className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
									</View>
								</View>
							);
						})}
					</View>
				</View>

				{/* Hot Apps Chart */}
				<View>
					<Text className="text-xl font-bold text-foreground mb-4">{t('analytics.weekly_hot_apps', { defaultValue: 'Top Apps & Hot Hours' })}</Text>
					<AppUsageChart
						data={data.hotApps}
						budget={data.budget}
						days={Math.ceil((new Date().getTime() - (period === 'week' ?
							(() => {
								const d = new Date();
								// Fix: Ensure we get the correct Monday
								const day = d.getDay();
								// day: 0 (Sun) to 6 (Sat). 
								// If Sun(0), Monday was 6 days ago.
								// If Mon(1), Monday was 0 days ago.
								const diff = d.getDate() - (day === 0 ? 6 : day - 1);
								const m = new Date(d.setDate(diff));
								m.setHours(0, 0, 0, 0);
								return m.getTime();
							})()
							:
							new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
						)) / (1000 * 60 * 60 * 24))}
					/>
				</View>

			</View>
		</ScrollView>
	);
}
