import { View } from 'react-native';

interface ProgressBarProps {
	currentStep: number;
	totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
	const progress = (currentStep / totalSteps) * 100;

	return (
		<View className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-6">
			<View 
				className="h-full bg-primary rounded-full" 
				style={{ width: `${progress}%` }} 
			/>
		</View>
	);
}
