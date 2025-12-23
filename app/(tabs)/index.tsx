import { useAwards } from '@/components/awards/awards-provider';
import MissionBriefing from '@/components/mission-briefing';
import SessionItem from '@/components/session-item';
import { TourTarget } from '@/components/tour/TourTarget'; 
import LegendItem from '@/components/ui/legend-item';
import { acceptMission, addPaybackSession, checkAndApplyRollover, deleteSession, getAcceptedMissions, getAccumulatedDebt, getAppUsageStats, getContextStats, getDebtConfig, getPaybackMinutes, getRandomHobbies, getSetting, getSocialSessionsSince, getStreakStats, getTodayScrollMinutes, getWeeklySessions, getWeeklyStats, triggerBankruptcy } from '@/lib/db';
import { getMissionFlavor } from '@/lib/mission-flavor';
import { getQuote, Quote } from '@/lib/quotes';
import { useTour } from '@/lib/tour/TourContext';
import { cn, formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, SectionList, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams(); 
	const colorScheme = useColorScheme();
	const { startTour, activeStep, isOpen, remeasureTarget } = useTour(); 

	// Actually usually useRef is better
	const scrollRef = useRef<SectionList>(null);

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
	const [accumulatedDebt, setAccumulatedDebt] = useState(0);
	const [isBankruptcyEnabled, setIsBankruptcyEnabled] = useState(false);
	const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0 });

	const [missions, setMissions] = useState<any[]>([]);
	const [selectedMission, setSelectedMission] = useState<any>(null);
	const [missionModalVisible, setMissionModalVisible] = useState(false);
	const [acceptedMissionsCount, setAcceptedMissionsCount] = useState(0);

	// Scroll Effect
	useEffect(() => {
		if (isOpen) {
			// Step mapping:...

			if (activeStep === 0) scrollRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: true });
			if (activeStep === 1) {
				setTimeout(() => remeasureTarget('stats-card'), 500);
			}


		}
	}, [activeStep, isOpen, remeasureTarget]);

	const loadData = useCallback(async () => {
		// 1. Rollover Check (Past days)
		await checkAndApplyRollover();
		const storedDebt = await getAccumulatedDebt();

		// 2. Load Today's Data
		const total = await getTodayScrollMinutes();
		const payback = await getPaybackMinutes();
		const storedBudget = await getSetting('daily_scroll_budget');
		const budgetVal = storedBudget ? parseInt(storedBudget) : 60;
		const debtConfig = await getDebtConfig();

		// 3. Calculate Real-time Debt State
		const netMinutes = Math.max(0, total - payback);

		// CHANGE: Budget is no longer reduced by debt. "Rollover" effect is removed.
		// The daily budget is always the full budget.
		const effectiveBudget = budgetVal;

		// Overage is calculated against the full budget
		const currentOverage = Math.max(0, netMinutes - effectiveBudget);

		const projectedDebt = storedDebt + currentOverage;
		setIsBankruptcyEnabled(debtConfig.bankruptcyEnabled);

		// 4. Check Bankruptcy Trigger
		if (debtConfig.bankruptcyEnabled && projectedDebt >= 500) {
			await triggerBankruptcy();

			// Reset local state immediately to avoid UI loops
			setAccumulatedDebt(0);

			Alert.alert(
				t('bankruptcy_declared.title', 'BANKRUPTCY DECLARED'),
				t('bankruptcy_declared.desc', 'Your total debt (past + today) hit 500m. Protocols engaged: Awards Wiped. Streak Reset.'),
				[{ text: 'OK', onPress: () => loadData() }]
			);
			return; // Reloading will happen via the OK press or naturally on next focus if we didn't return, but return is safer to stop setting "old" state
		}

		setAccumulatedDebt(storedDebt);
		setTotalMinutes(total);
		setPaybackMinutes(payback);
		setBudget(budgetVal);

		// Stats
		const weekly = await getWeeklyStats();
		const apps = await getAppUsageStats();
		const contexts = await getContextStats();

		setWeeklyStats(weekly);
		setAppStats(apps);
		setContextStats(contexts);

		// Other Data
		const streakData = await getStreakStats();
		const accepted = await getAcceptedMissions();
		const weeklySessions = await getWeeklySessions(); // NEW: Fetch weekly sessions

		const randomHobbies = await getRandomHobbies(3);
		const enrichedMissions = randomHobbies.map(h => ({
			...h,
			flavor: getMissionFlavor(h.category),
			duration: 15,
			icon: h.category === 'Custom' ? 'star' : h.category === 'Active' ? 'bicycle' : h.category === 'Creative' ? 'brush' : h.category === 'Relaxing' ? 'leaf' : 'book',
			color: h.category === 'Custom' ? '#f59e0b' : h.category === 'Active' ? '#ef4444' : h.category === 'Creative' ? '#a855f7' : h.category === 'Relaxing' ? '#22c55e' : '#3b82f6',
		}));

		setStreak(streakData);
		setMissions(enrichedMissions);
		setAcceptedMissionsCount(accepted.length);
		setSessions(weeklySessions); // NEW: Update state

		// Update quote
		const percentage = effectiveBudget > 0 ? (netMinutes / effectiveBudget) * 100 : 100;
		setQuote(getQuote(percentage));
	}, [t]);

	const { checkAwards } = useAwards();

	useFocusEffect(
		useCallback(() => {
			loadData();
			checkAwards();

			// DEBUG: Check for social sessions
			getSocialSessionsSince(Date.now() - 24 * 60 * 60 * 1000).then(sessions => {
				if (sessions.length > 0) {
					// alert(`DEBUG: Found ${sessions.length} Social sessions in last 24h:\n` + sessions.map(s => `${s.app_name} (${formatTime(s.duration)})`).join('\n'));
				} else {
					// alert("DEBUG: No social sessions in last 24h. You should have the award.");
				}
			});

		}, [loadData, checkAwards])
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, [loadData]);

	const handleStartTour = useCallback(() => {
		startTour([
			{
				id: 'budget-card',
				title: t('tour.budget_title', 'Your Debt Dashboard'),
				description: t('tour.budget_desc', 'This bar shows your daily scroll budget. Green is safe, Red creates Debt.'),
			},
			{
				id: 'stats-card',
				title: t('tour.stats_title', 'Weekly History'),
				description: t('tour.stats_desc', 'Track your scrolling over the last 7 days here.'),
			},
			{
				id: 'add-button',
				title: t('tour.add_title', 'Log Session'),
				description: t('tour.add_desc', 'Use the + button to manually log scroll sessions if you forgot.'),
			},
			{
				id: 'missions-button',
				title: t('tour.missions_title', 'Missions'),
				description: t('tour.missions_desc', 'Complete offline missions to pay back your scroll debt.'),
			},
			{
				id: 'settings-button',
				title: t('tour.settings_title', 'Settings'),
				description: t('tour.settings_desc', 'Tap here to configure your defaults and preferences.'),
				action: () => router.push('/settings'),
				nextLabel: t('tour.open_settings'),
				shape: 'circle',

			},
			{
				id: 'defaults-section',
				title: t('tour.defaults_title', 'Quick Add'),
				description: t('tour.defaults_desc', 'Set your default app and duration here to log sessions in one tap!'),
				placement: 'top'
			},
			{
				id: 'awards-button',
				title: t('tour.awards_title', 'Awards / Badges'),
				description: t('tour.awards_desc', 'Track your achievements and see the badges you\'ve unlocked.'),
				placement: 'bottom'
			}
		]);
	}, [startTour, router, t]);

	// Auto-start tour if coming from onboarding
	useEffect(() => {
		if (params.startTour === 'true') {
			// Small delay to ensure layout is ready and targets are registered
			setTimeout(() => {
				handleStartTour();
				// Clear param to prevent loop is not strictly necessary with replace but good practice
				router.setParams({ startTour: undefined });
			}, 500);
		}
	}, [params.startTour, handleStartTour, router]);

	const netMinutes = Math.max(0, totalMinutes - paybackMinutes);
	const effectiveBudget = Math.max(0, budget - accumulatedDebt);
	const percentageUsed = effectiveBudget > 0 ? Math.min((netMinutes / effectiveBudget) * 100, 100) : 100;
	const isOverBudget = netMinutes > effectiveBudget;

	const getUsageColorClass = (percentage: number) => {
		if (percentage <= 25) return 'bg-green-500 dark:bg-green-400';
		if (percentage <= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		return 'bg-red-500 dark:bg-red-400';
	};

	const getBarColor = (pct: number) => {
		if (pct <= 25) return 'bg-green-500 dark:bg-green-400';
		if (pct <= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		if (pct <= 100) return 'bg-red-500 dark:bg-red-400';
		return 'bg-purple-500 dark:bg-purple-400';
	};

	// Preparation for SectionList
	const sections = useMemo(() => {
		if (sessions.length === 0) return [];

		const grouped: {
			title: string;
			isToday: boolean;
			data: {
				period: string;
				label: string;
				sessions: any[];
				totalMin: number;
			}[]
		}[] = [];

		sessions.forEach(session => {
			const date = new Date(session.timestamp);
			const today = new Date();
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			let dayTitle = date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
			let isToday = false;

			if (date.toDateString() === today.toDateString()) {
				dayTitle = t('common.today');
				isToday = true;
			} else if (date.toDateString() === yesterday.toDateString()) {
				dayTitle = t('common.yesterday');
			}

			// Determine Period
			const hour = date.getHours();
			let period = 'night';
			if (hour >= 6 && hour < 12) period = 'morning';
			else if (hour >= 12 && hour < 18) period = 'afternoon';
			else if (hour >= 18) period = 'evening';

			// Find or Create Day Group
			let dayGroup = grouped.find(g => g.title === dayTitle);
			if (!dayGroup) {
				dayGroup = { title: dayTitle, isToday, data: [] };
				grouped.push(dayGroup);
			}

			// Find or Create Slot Group within the day
			let slotGroup = dayGroup.data.find(s => s.period === period);
			if (!slotGroup) {
				slotGroup = {
					period,
					label: t(`analytics.day_parts.${period}`),
					sessions: [],
					totalMin: 0
				};
				dayGroup.data.push(slotGroup);
			}

			slotGroup.sessions.push(session);
			slotGroup.totalMin += session.duration;
		});
		return grouped;
	}, [sessions, i18n.language, t]);

	const renderListHeader = () => (
		<View>
			<TourTarget id="budget-card">
				<View className={`w-full bg-card p-6 border-b border-border`}>
					<View className="flex-row justify-between items-start mb-4">
						<View>
							<Text className="text-foreground font-bold text-sm uppercase tracking-wider mb-1">
								{isOverBudget ? t('home.budget_exceeded') : t('home.remaining')}
							</Text>
							<Text className="text-foreground font-black text-4xl tracking-tight">
								{isOverBudget
									? `+${formatTime(netMinutes - effectiveBudget, 'long')}`
									: formatTime(effectiveBudget - netMinutes, 'long')
								}
							</Text>
						</View>
						<View className="bg-muted px-3 py-1.5 rounded-full">
							<Text className="text-foreground font-bold text-xs">{Math.round(percentageUsed)}%</Text>
						</View>
					</View>

					<View className="h-3 mb-6 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
						<View
							className={cn('h-full rounded-full', getBarColor(percentageUsed))}
							style={{ width: `${percentageUsed}%` }}
						/>
					</View>

					{/* Quote Card */}
					{quote && (
						<View className="bg-primary/5 p-6 rounded-3xl">
							<View className="flex-row gap-2 mb-2">
								<Text className="text-xs font-bold uppercase text-primary tracking-widest">{t('home.daily_wisdom')}</Text>
							</View>
							<Text className="text-foreground text-base font-medium italic leading-6">
								&quot;{t(quote.text)}&quot;
							</Text>
						</View>
					)}
				</View>
			</TourTarget>

			{/* Debt / Bankruptcy Card */}
			{isBankruptcyEnabled && isOverBudget && (
				<View className="px-4 mb-4 mt-4">
					{(() => {
						const currentOverage = Math.max(0, netMinutes - effectiveBudget);
						const projectedDebt = accumulatedDebt + currentOverage;
						const bankruptcyThreshold = 500;
						const percentage = Math.min((projectedDebt / bankruptcyThreshold) * 100, 100);

						return (
							<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									router.push('/bankruptcy');
								}}
								className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl mb-4"
							>
								<View className="flex-row items-center justify-between mb-3">
									<View className="flex-row items-center gap-2">
										<Ionicons name="warning-outline" size={20} color="#ef4444" />
										<Text className="text-base font-bold text-red-500 uppercase tracking-widest">
											{t('home.bankruptcy_risk')}
										</Text>
									</View>
									<View className="bg-red-500/10 px-2 py-1 rounded-lg">
										<Text className="text-xs font-bold text-red-500">{Math.round(percentage)}%</Text>
									</View>
								</View>

								<View className="flex-row items-baseline gap-1 mb-2">
									<Text className="text-4xl font-black text-foreground tabular-nums">
										{formatTime(projectedDebt)}
									</Text>
									<Text className="text-lg text-muted-foreground font-medium">
										/ {formatTime(bankruptcyThreshold)}
									</Text>
								</View>

								<View className="h-3 bg-red-800/10 dark:bg-red-100/10 rounded-full overflow-hidden mb-2">
									<View
										className="h-full bg-red-500 rounded-full"
										style={{ width: `${percentage}%` }}
									/>
								</View>
								<Text className="text-xs text-muted-foreground font-medium">
									{t('home.tap_for_info', 'Tap for more info')}
								</Text>
							</TouchableOpacity>
						);
					})()}
				</View>
			)}

			<View className='px-4 mt-8'>
				<View className="mb-10">
					<Text className="text-xl font-bold text-foreground mb-6">{t('home.past_7_days')}</Text>
					<TourTarget id="stats-card">
						<View className=" flex-col bg-card/50 rounded-3xl border border-border/50 overflow-hidden">
							<View className='h-48'>
								{weeklyStats.some(s => s.minutes > 0) ? (
									<View className="flex-row justify-between items-end h-full pt-16 px-4 pb-4 gap-0.5">
										{weeklyStats.map((stat, index) => {
											const isToday = index === 6;
											const maxVal = Math.max(budget * 1.5, ...weeklyStats.map(s => s.minutes));
											const heightPct = Math.max((stat.minutes / maxVal) * 100, 10);

											// Dynamic Color Logic: Green (low) -> Red (high) based on budget
											const percentageOfBudget = (stat.minutes / budget) * 100;

											const getTextColor = (pct: number) => {
												if (pct <= 25) return 'text-green-500 dark:text-green-400';
												if (pct <= 50) return 'text-yellow-500 dark:text-yellow-400';
												if (pct <= 100) return 'text-red-500 dark:text-red-400';
												return 'text-purple-500 dark:text-purple-400';
											};

											return (
												<View key={index} className="items-center gap-3 flex-1 h-full justify-end">
													{/* Data Label */}
													<Text className="text-[10px] text-muted-foreground font-medium -mb-1">
														{formatTime(stat.minutes)}
													</Text>

													{/* Bar */}
													<View
														className={cn("w-full rounded-xl mx-1", getBarColor(percentageOfBudget))}
														style={{
															height: `${heightPct}%`,
															minHeight: 20,
															opacity: 1 // Slightly dim past days if desired, or keep uniform
														}}
													/>

													{/* Day Label */}
													<Text className={`text-[12px] font-bold ${isToday ? getTextColor(percentageOfBudget) : 'text-muted-foreground'}`}>
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
							<View className="flex-row items-center justify-center flex-wrap gap-3 py-4 px-6 border-t border-border">
								<LegendItem color="#22c55e" label="< 25%" />
								<LegendItem color="#eab308" label="25% - 50%" />
								<LegendItem color="#ef4444" label="50% - 100%" />
								<LegendItem color="#a855f7" label="> 100%" />
							</View>
							
						</View>
					</TourTarget>
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
													<Text className="text-xs text-muted-foreground font-medium">{formatTime(app.minutes, 'long')} ({app.percentage}%)</Text>
												</View>
												<View className="h-2.5 bg-muted/20 rounded-full overflow-hidden">
													<View className={cn("h-full rounded-full", getUsageColorClass(app.percentage))} style={{ width: `${app.percentage}%` }} />
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
													<Text className="font-semibold text-foreground text-base">{t(`analytics.contexts.${ctx.name}`, { defaultValue: ctx.name })}</Text>
													<Text className="text-xs text-muted-foreground font-medium">{formatTime(ctx.minutes, 'long')} ({ctx.percentage}%)</Text>
												</View>
												<View className="h-2.5 bg-muted/20 rounded-full overflow-hidden">
													<View className={cn("h-full rounded-full", getUsageColorClass(ctx.percentage))} style={{ width: `${ctx.percentage}%` }} />
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
				{isOverBudget && (
					<View className="mb-8">
						<TouchableOpacity
							className="bg-red-500 p-5 rounded-3xl flex-row items-center justify-between"
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								router.push('/rescue')
							}}
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
						<View className='mb-4'>
							<Text className="text-xl font-bold text-foreground">{t('home.payback_missions')}</Text>
							<Text className="text-muted-foreground font-medium" numberOfLines={1} ellipsizeMode="tail">
								{t('missions.subtitle', 'Complete missions to earn back time.')}
							</Text>
						</View>

						<TourTarget id="missions-list">
							<ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-4">
								<View className="flex-row gap-3 pr-4">
									{missions.map((mission, index) => {
										// For custom hobbies, we don't have a translation key for the hobby itself, so we use the name directly.
										const translatedHobby = mission.is_custom || mission.category === 'Custom'
											? mission.name
											: t(`hobbies.${mission.name}`, { defaultValue: mission.name });

										return (
											<TouchableOpacity
												key={index}
												activeOpacity={0.7}
												className="border border-border p-4 rounded-3xl w-48 mr-1"
												style={{
													backgroundColor: mission.color + '12',
													borderColor: mission.color + '40'
												}}
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
													<View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: mission.color + '15' }}>
														<Text className="text-[11px] font-black text-foreground">-{mission.duration}m</Text>
													</View>
												</View>
												<Text className="font-bold text-foreground mb-1 leading-tight text-[15px] pr-2" numberOfLines={2}>
													{t(mission.flavor.titleKey, { hobby: translatedHobby })}
												</Text>
												<Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
													{translatedHobby}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</ScrollView>
						</TourTarget>
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


				<View>
					<View className='flex-row items-center justify-between mb-4'>
						<View>
							<Text className="text-xl font-bold text-foreground">{t('home.scroll_sessions')}</Text>
							<Text className="text-muted-foreground font-medium" numberOfLines={1} ellipsizeMode="tail">
								{t('home.scroll_sessions_description', 'Complete missions to earn back time.')}
							</Text>
						</View>
						<View className='flex-row items-center gap-1.5'>
							<Ionicons name="eye-outline" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} />
							<Link href='/calendar' className="font-semibold text-foreground flex items-center">
								{t('home.scroll_sessions_more')}
							</Link>
						</View>
					</View>
				</View>
			</View>
		</View>
	);

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
			<View className="flex-row p-4 justify-between border-b border-border/40 items-center">
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
						<Text className="text-3xl font-black text-foreground tabular-nums">
							{formatTime(effectiveBudget, 'long')}
						</Text>
					</View>

				</View>

				<View className="flex-row gap-2">
					<TourTarget id="missions-button">
						<TouchableOpacity
							className="p-3 bg-primary rounded-full relative"
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								router.push('/missions')
							}}
						>
							<Ionicons name="list" size={22} color={colorScheme === 'dark' ? '#333' : '#fff'} />
							{acceptedMissionsCount > 0 && (
								<View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 justify-center items-center border-2 border-background">
									<Text className="text-[10px] font-bold text-white">
										{acceptedMissionsCount}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</TourTarget>

					<TourTarget id="settings-button">
						<TouchableOpacity
							className="p-3 bg-primary rounded-full"
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								router.push('/settings')
							}}
						>
							<Ionicons name="settings-outline" size={22} color={colorScheme === 'dark' ? '#333' : '#fff'} />
						</TouchableOpacity>
					</TourTarget>
				</View>
			</View>
			
			<View className="flex-1">
				<SectionList
					sections={sections}
					// @ts-ignore
					ref={scrollRef} // Re-using the ref if possible, or cast it. SectionList doesn't have scrollTo in the same way, but keeping ref might be needed for Tour
					keyExtractor={(item, index) => item.period + index}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					showsVerticalScrollIndicator={false}
					stickySectionHeadersEnabled={true}
					ListHeaderComponent={renderListHeader()}
					ListEmptyComponent={
						<View className="px-4 pb-20">
							<View className="p-8 items-center bg-card rounded-2xl border border-dashed border-border mt-4">
								<Text className="text-muted-foreground">{t('home.no_sessions_yet')}</Text>
							</View>
						</View>
					}
					renderSectionHeader={({ section: { title, isToday } }) => (
						<View className="px-4 py-2 bg-background/95 backdrop-blur-xl border-b border-border/20">
							<Text className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
								{title}
							</Text>
						</View>
					)}
					renderItem={({ item: slot }) => (
						<View className="px-4 mb-4 mt-2">
							<View className="pl-4 border-l-2 border-border/50">
								<View className="flex-row items-center justify-between mb-2">
									<View className="flex-row items-center gap-2">
										<View
											style={{
												backgroundColor: slot.period === 'morning' ? '#FFD70030' :
													slot.period === 'afternoon' ? '#32993230' :
														slot.period === 'evening' ? '#2986cc30' : '#66666630'
											}}
											className="p-1.5 rounded-xl"
										>
											<Ionicons
												name={
													slot.period === 'morning' ? 'sunny-outline' :
														slot.period === 'afternoon' ? 'partly-sunny-outline' :
															slot.period === 'evening' ? 'moon-outline' : 'bed-outline'
												}
												size={12}
												color={
													slot.period === 'morning' ? '#FFD700' :
														slot.period === 'afternoon' ? '#329932' :
															slot.period === 'evening' ? '#2986cc' : 'gray'
												}
											/>
										</View>
										<Text className="text-xs font-semibold text-muted-foreground uppercase">
											{slot.label} <Text className="opacity-50 text-[10px]">
												{slot.period === 'morning' ? '(06-12)' :
													slot.period === 'afternoon' ? '(12-18)' :
														slot.period === 'evening' ? '(18-24)' : '(24-06)'}
											</Text>
										</Text>
									</View>
									<Text className="text-xs font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded text-center">
										+{formatTime(slot.totalMin, 'long')}
									</Text>
								</View>

								<View className="gap-2">
									{slot.sessions.map((session: any) => (
										<SessionItem
											key={session.id}
											session={session}
											onDelete={async () => {
																await deleteSession(session.id);
																loadData();
															}}
										/>
									))}
								</View>
							</View>
						</View>
					)}
					ListFooterComponent={<View className="h-24" />}
				/>
			</View>
		</SafeAreaView>
	);
}
