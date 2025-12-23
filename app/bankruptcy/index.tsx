import * as Haptics from 'expo-haptics';
import { formatTime } from '@/lib/utils';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccumulatedDebt, getDebtConfig, getSetting, getTodayScrollMinutes } from '../../lib/db';

export default function BankruptcyScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';


	const [accumulatedDebt, setAccumulatedDebt] = useState(0);
	const [todayUsage, setTodayUsage] = useState(0);
	const [dailyBudget, setDailyBudget] = useState(60); // Default fallback
	const [bankruptcyEnabled, setBankruptcyEnabled] = useState(false);

	const BANKRUPTCY_LIMIT = 500;

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {

			const debt = await getAccumulatedDebt();
			const usage = await getTodayScrollMinutes();
			const budgetStr = await getSetting('daily_goal');
			const config = await getDebtConfig();

			setAccumulatedDebt(debt);
			setTodayUsage(usage);
			setBankruptcyEnabled(config.bankruptcyEnabled);
			if (budgetStr) {
				setDailyBudget(parseInt(budgetStr));
			}
		} catch (e) {
			console.error("Failed to load bankruptcy data", e);
		} finally {

		}
	};

	// Calculate Current Risk
	// Total Debt = Accumulated Previous Debt + Today's Overage (if any)
	const todayOverage = Math.max(0, todayUsage - dailyBudget);
	const totalRisk = accumulatedDebt + todayOverage;
	const riskPercentage = Math.min(100, (totalRisk / BANKRUPTCY_LIMIT) * 100);

	// Determine Color based on risk
	let riskColor = isDark ? '#4ADE80' : '#22C55E'; // Green
	if (riskPercentage > 50) riskColor = '#FACC15'; // Yellow
	if (riskPercentage > 80) riskColor = '#F97316'; // Orange
	if (riskPercentage > 95) riskColor = '#EF4444'; // Red

	return (
		<View className="flex-1 bg-background">
			<View className="flex-row items-center justify-between p-6 pb-6 border-b border-border/40">
				<TouchableOpacity
					onPress={() => {
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
						router.back();
					}}
					className="mr-4"
				>
					<Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
				</TouchableOpacity>
				<View className="flex-1">
					<Text className="text-3xl font-black text-foreground tracking-tighter">{t('home.bankruptcy_modal.title')}</Text>
				</View>
			</View>



			<ScrollView
				className='flex-1 p-4'
				contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
			>
				{/* Warning / Status Card */}
				<View className="bg-secondary/5 rounded-3xl p-6 mb-6">
					<View className="flex-row items-center justify-between mb-2">
						<Text className="text-lg font-bold text-foreground/70">
							{t('home.bankruptcy_risk')}
						</Text>
					</View>

					{bankruptcyEnabled ? (
						<View>
							<View className="flex-row items-end mb-4">
								<Text className="text-6xl font-black tracking-tighter" style={{ color: riskColor }}>
									{totalRisk}
								</Text>
								<Text className="text-xl font-bold text-muted-foreground mb-2 ml-1">
									/ {BANKRUPTCY_LIMIT}m
								</Text>
							</View>

							{/* Progress Bar */}
							<View className="h-4 bg-secondary/20 rounded-full overflow-hidden mb-2">
								<View
									className="h-full rounded-full"
									style={{
										width: `${riskPercentage}%`,
										backgroundColor: riskColor
									}}
								/>
							</View>
							<Text className="text-xs text-muted-foreground text-center mt-2">
								{formatTime(Math.max(0, BANKRUPTCY_LIMIT - totalRisk), 'long')} {t('home.bankruptcy_modal.remaining')}
							</Text>
						</View>
					) : (
						<View className='flex-col items-center py-6'>
							<AntDesign name="question-circle" size={24} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
							<Text className="text-foreground font-semibold mt-2">
								{t('home.bankruptcy_modal.disabled')}
							</Text>
						</View>
					)}
				</View>

				{/* Explanation Section */}
				<View className="mb-8 flex-col gap-8">
					
					{/* Mechanism */}
					<View className="flex-row gap-2">
						<View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
							<Ionicons name="trending-up" size={20} color="#3B82F6" />
						</View>
						<View className="flex-1">
							<Text className="text-lg font-bold text-foreground mb-1">
								{t('home.bankruptcy_modal.mechanism_title')}
							</Text>
							<Text className="text-base text-muted-foreground leading-6">
								{t('home.bankruptcy_modal.mechanism_desc')}
							</Text>
						</View>
					</View>

					{/* The Limit */}
					<View className="flex-row gap-2">
						<View className="w-10 h-10 rounded-full bg-orange-500/10 items-center justify-center">
							<Ionicons name="alert-circle" size={20} color="#F97316" />
						</View>
						<View className="flex-1">
							<Text className="text-lg font-bold text-foreground mb-1">
								{t('home.bankruptcy_modal.limit_title')}
							</Text>
							<Text className="text-base text-muted-foreground leading-6">
								{t('home.bankruptcy_modal.limit_desc')}
							</Text>
						</View>
					</View>
				</View>

				{/* Consequences Box */}
				<View className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5">
					<View className="flex-col gap-4">
						<View className="flex-row items-start">
							<Ionicons name="trash-outline" size={18} color="#EF4444" style={{marginRight: 8, marginTop: 4}} />
							<Text className="text-foreground/90 text-base font-medium flex-1">
								{t('home.bankruptcy_modal.consequence_1')}
							</Text>
						</View>
						<View className="flex-row items-start">
							<Ionicons name="trophy-outline" size={18} color="#EF4444" style={{marginRight: 8, marginTop: 4}} />
							<Text className="text-foreground/90 text-base font-medium flex-1">
								{t('home.bankruptcy_modal.consequence_2')}
							</Text>
						</View>
						<View className="flex-row items-start">
							<Ionicons name="flame-outline" size={18} color="#EF4444" style={{marginRight: 8, marginTop: 4}} />
							<Text className="text-foreground/90 text-base font-medium flex-1">
								{t('home.bankruptcy_modal.consequence_3')}
							</Text>
						</View>
					</View>
				</View>

			</ScrollView>
		</View>
	);
}

