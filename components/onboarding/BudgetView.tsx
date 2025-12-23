import { cn, formatTime } from '@/lib/utils';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';

interface BudgetViewProps {
	budget: number;
	setBudget: (value: number) => void;
	contentContainerStyle?: any; // To allow passing padding from parent like in AppsList
}

export default function BudgetView({ budget, setBudget, contentContainerStyle }: BudgetViewProps) {
	const { t } = useTranslation();
	const colorScheme = useColorScheme();

	const getBudgetLabel = (mins: number) => {
		if (mins <= 15) return t('onboarding.budget.labels.strict');
		if (mins <= 30) return t('onboarding.budget.labels.normal');
		if (mins <= 90) return t('onboarding.budget.labels.balanced');
		if (mins <= 120) return t('onboarding.budget.labels.generous');
		return t('onboarding.budget.labels.doomscroller');
	};

	return (
		<View className="flex-1 px-6" style={contentContainerStyle}>
			<View className="items-center justify-center p-8 bg-card rounded-3xl border-2 border-border mt-36">
				<Text className="text-6xl font-black text-foreground mb-1">{budget}m</Text>
				<Text className="text-xl font-semibold text-muted-foreground mb-4">{formatTime(budget, 'long')}</Text>
				<Text className={cn("text-lg font-bold uppercase tracking-widest",
					budget <= 15 ? "text-green-500" :
						budget <= 30 ? "text-blue-500" :
							budget <= 60 ? "text-yellow-500" :
								budget <= 120 ? "text-orange-500" : "text-red-500"
				)}>
					{getBudgetLabel(budget)}
				</Text>
			</View>

			<View className="mt-12">
				<Slider
					style={{ width: '100%', height: 40 }}
					minimumValue={15}
					maximumValue={240}
					step={15}
					value={budget}
					onValueChange={(value) => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						setBudget(value)
					}}
					minimumTrackTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
					maximumTrackTintColor={colorScheme === 'dark' ? '#d3d3d3' : '#CFD2C6'}
					thumbTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
				/>
				<View className="flex-row justify-between px-2 mt-2">
					<Text className="text-muted-foreground font-medium">15m</Text>
					<Text className="text-muted-foreground font-medium">4h</Text>
				</View>
			</View>
		</View>
	);
}
