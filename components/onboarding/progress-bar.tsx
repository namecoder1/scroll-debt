import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface ProgressBarProps {
	currentStep: number;
	totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
	// Calculate start width based on previous step
	// If currentStep is 1, start from 0%
	// If currentStep is 2, start from (1/3 * 100)%
	const initialProgress = ((currentStep - 1) / totalSteps) * 100;
	const targetProgress = (currentStep / totalSteps) * 100;

	const width = useSharedValue(initialProgress);

	useEffect(() => {
		width.value = withTiming(targetProgress, {
			duration: 800,
			easing: Easing.out(Easing.cubic),
		});
	}, [targetProgress, width]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			width: `${width.value}%`,
		};
	});

	return (
		<View className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
			<Animated.View 
				className="h-full bg-primary rounded-full" 
				style={animatedStyle} 
			/>
		</View>
	);
}
