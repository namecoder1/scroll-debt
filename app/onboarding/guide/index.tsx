import ProgressBar from '@/components/onboarding/progress-bar';
import Button from '@/components/ui/button';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GuideScreen() {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme()
	const locale = i18n.language;
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);

	const currentLang = locale === 'it' ? 'it' : 'en';
	const theme = colorScheme === 'dark' ? 'dark' : 'light';

	const guideImages = {
		it: {
			dark: {
				1: require('@/assets/images/guide/it/1-dark.png'),
				2: require('@/assets/images/guide/it/2-dark.png'),
				3: require('@/assets/images/guide/it/3-dark.png'),
			},
			light: {
				1: require('@/assets/images/guide/it/1-light.png'),
				2: require('@/assets/images/guide/it/2-light.png'),
				3: require('@/assets/images/guide/it/3-light.png'),
			},
		},
		en: {
			dark: {
				1: require('@/assets/images/guide/en/1-dark.png'),
				2: require('@/assets/images/guide/en/2-dark.png'),
				3: require('@/assets/images/guide/en/3-dark.png'),
			},
			light: {
				1: require('@/assets/images/guide/en/1-light.png'),
				2: require('@/assets/images/guide/en/2-light.png'),
				3: require('@/assets/images/guide/en/3-light.png'),
			},
		},
	};

	const steps = [
		{
			id: 1,
			image: guideImages[currentLang][theme][1],
			title: t('onboarding.guide.step_1_title'),
			description: t('onboarding.guide.step_1_desc'),
		},
		{
			id: 2,
			image: guideImages[currentLang][theme][2],
			title: t('onboarding.guide.step_2_title'),
			description: t('onboarding.guide.step_2_desc'),
		},
		{
			id: 3,
			image: guideImages[currentLang][theme][3],
			title: t('onboarding.guide.step_3_title'),
			description: t('onboarding.guide.step_3_desc'),
		},
	];

	const handleNext = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		if (currentStep < 3) {
			setCurrentStep(prev => prev + 1);
		} else {
			router.push('/onboarding/setup');
		}
	};

	const step = steps[currentStep - 1];

	return (
		<View className="flex-1 bg-background">
			<View className="flex-1 px-6" style={{ paddingTop: insets.top, paddingBottom: 100 }}>
				<View className="mb-6 mt-4">
					<ProgressBar currentStep={currentStep} totalSteps={3}  />
				</View>

				<View className="flex-1 items-center justify-center gap-8">
					<View className="w-80">
						<Image 
							source={step.image} 
							className="w-80 h-80"
							resizeMode="contain"
						/>
					</View>
					<View className="gap-4">
						<Text className="text-4xl tracking-tighter font-black text-foreground text-center">
							{step.title}
						</Text>
						<Text className="text-muted-foreground text-center text-lg leading-relaxed">
							{step.description}
						</Text>
					</View>
				</View>
			</View>

			<View className="absolute flex-row gap-2 bottom-6 left-6 right-6">
				<Button
					onPress={currentStep > 1 ? () => setCurrentStep(prev => prev - 1) : () => router.back()}
					size="xl"
					className="rounded-full"
					variant='outline'
				>
					<Text className="text-foreground mx-auto font-semibold text-xl">
						{t('onboarding.welcome.back')}
					</Text>	
				</Button>
				<Button
					onPress={handleNext}
					size="xl"
					className="rounded-full flex-1"
				>
					<Text className="text-white dark:text-black mx-auto font-semibold text-xl">
						{currentStep === 3 ? t('onboarding.welcome.start_onboarding') : t('onboarding.welcome.next')}
					</Text>
				</Button>
			</View>
		</View>
	);
}
