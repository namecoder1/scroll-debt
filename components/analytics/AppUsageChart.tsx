import { formatTime } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';

interface AppUsageChartProps {
	data: {
		name: string;
		totalMinutes: number;
		hourlyDistribution: number[] // 0-23
	}[];
	limit?: number;
	budget?: number; // Total Daily Budget
	days?: number; // Number of days in the period
}

export default function AppUsageChart({ data, limit = 5, budget = 60, days = 1 }: AppUsageChartProps) {
	const { t } = useTranslation();
	const colorScheme = useColorScheme();

	const displayData = data.slice(0, limit);
	const totalUsageAll = data.reduce((acc, curr) => acc + curr.totalMinutes, 0);
	const maxUsage = Math.max(...displayData.map(d => d.totalMinutes), 1);

	const getPeakTime = (distribution: number[]) => {
		const parts = {
			morning: distribution.slice(6, 12).reduce((a, b) => a + b, 0),
			afternoon: distribution.slice(12, 18).reduce((a, b) => a + b, 0),
			evening: distribution.slice(18, 24).reduce((a, b) => a + b, 0),
			night: distribution.slice(0, 6).reduce((a, b) => a + b, 0),
		};
		const max = Math.max(...Object.values(parts));
		if (max === 0) return null;
		return Object.keys(parts).find(k => parts[k as keyof typeof parts] === max);
	};

	if (displayData.length === 0) {
		return (
			<View className="items-center justify-center p-6 py-20 bg-card rounded-3xl border border-border">
				<Text className="text-foreground italic text-center">{t('analytics.no_data')}</Text>
			</View>
		);
	}

	return (
		<View className="bg-card p-5 rounded-3xl border border-border gap-6">
			{displayData.map((app, index) => {
				const percentageOfTotal = totalUsageAll > 0 ? Math.round((app.totalMinutes / totalUsageAll) * 100) : 0;
				const peak = getPeakTime(app.hourlyDistribution);
				const relativeWidth = (app.totalMinutes / maxUsage) * 100;

				// Color Logic: Pacing
				// Calculate 'Elapsed Budget': The budget accumulated so far in the period.
				// If usage > elapsedBudget, it means you are over-consuming relative to time passed.
				const elapsedBudget = budget * Math.max(1, days);
				const percentageOfBudget = (app.totalMinutes / elapsedBudget) * 100;

				let colorClass = 'bg-primary';
				let textClass = 'text-primary';

				if (percentageOfBudget <= 25) {
					colorClass = 'bg-green-500 dark:bg-green-400';
					textClass = 'text-green-500 dark:text-green-400';
				} else if (percentageOfBudget <= 50) {
					colorClass = 'bg-yellow-500 dark:bg-yellow-400';
					textClass = 'text-yellow-500 dark:text-yellow-400';
				} else if (percentageOfBudget <= 100) {
					colorClass = 'bg-red-500 dark:bg-red-400';
					textClass = 'text-red-500 dark:text-red-400';
				} else {
					colorClass = 'bg-purple-500 dark:bg-purple-400';
					textClass = 'text-purple-500 dark:text-purple-400';
				}

				return (
					<View key={index} className="gap-2">
						{/* Header Row */}
						<View className="flex-row justify-between items-baseline">
							<Text className="text-foreground font-semibold text-base w-2/3" numberOfLines={1}>
								{app.name}
							</Text>
							<Text className={`font-bold text-base tabular-nums ${textClass}`}>
								{formatTime(app.totalMinutes, 'long')}
							</Text>
						</View>

						{/* Visual Bar */}
						<View className="h-2 bg-muted/20 rounded-full overflow-hidden w-full">
							<View
								className={`h-full rounded-full ${colorClass}`}
								style={{ width: `${Math.max(2, relativeWidth)}%` }}
							/>
						</View>

						{/* Metadata Footer */}
						<View className="flex-row gap-3 items-center">
							{peak && (
								<View className="flex-row items-center gap-1">
									<Ionicons
										name={
											peak === 'morning' ? 'sunny' :
												peak === 'afternoon' ? 'partly-sunny' :
													peak === 'evening' ? 'moon' : 'cloudy-night'
										}
										size={10}
										color={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
									/>
									<Text className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
										{t('analytics.most_used')}: {t(`analytics.day_parts.${peak}`, { defaultValue: peak })}
									</Text>
								</View>
							)}

							<View className="flex-row items-center gap-1">
								<Ionicons name="pie-chart" size={10} color={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'} />
								<Text className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
									{percentageOfTotal}% {t('analytics.of_total', { defaultValue: 'of total' })}
								</Text>
							</View>
						</View>

						{/* Divider */}
						{index < displayData.length - 1 && <View className="h-[1px] bg-border/40 mt-2" />}
					</View>
				);
			})}
		</View>
	);
}
