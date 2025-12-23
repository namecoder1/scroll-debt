import logoDark from '@/assets/images/logo-light.png';
import logoLight from '@/assets/images/logo-dark.png';

import Button from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme();

	const image = colorScheme === 'dark' ? logoLight : logoDark;

	return (
		<SafeAreaView className="flex-1 bg-background justify-between items-center p-6">
			<View className="flex-1 w-full justify-center items-center gap-2">
				<View className="items-center gap-4">
					<Image
						source={image}
						className="w-40 h-40"
						contentFit="contain"
						transition={1000}
						alt="Scroll Debt Logo"
					/>
					<Text className="text-5xl font-black text-foreground text-center tracking-tighter">
						{t('onboarding.welcome.title')}
					</Text>
				</View>

				<Text className="text-muted-foreground text-center text-lg leading-relaxed max-w-xs">
					{t('onboarding.welcome.subtitle')}
				</Text>
			</View>

			<View className="w-full gap-8 mb-6 bg-muted/40 pt-6 rounded-3xl">
				<View className="gap-6 px-6">
					<FeatureItem
						icon="eye-outline"
						text={t('onboarding.welcome.feature_1')}
					/>
					<FeatureItem
						icon="calculator-outline"
						text={t('onboarding.welcome.feature_2')}
					/>
					<FeatureItem
						icon="bicycle-outline"
						text={t('onboarding.welcome.feature_3')}
					/>
				</View>

				<Button
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
						router.push('/onboarding/guide')
					}}
					size='xl'
					className='rounded-full w-full'
				>
					<Text className="text-white dark:text-black mx-auto text-center font-semibold text-xl tracking-wider">
						{t('onboarding.welcome.start')}
					</Text>
				</Button>
			</View>

			<View className='flex-row mt-2 items-center justify-center gap-4'>
				<Link href="https://scroll-debt.vercel.app/privacy" className="text-muted-foreground text-xs">{t('settings.privacy')}</Link>	
				<Link href="https://scroll-debt.vercel.app/terms" className="text-muted-foreground text-xs">{t('settings.terms')}</Link>	
				<Link href="https://scroll-debt.vercel.app/security" className="text-muted-foreground text-xs">{t('settings.security')}</Link>	
				<Link href="https://scroll-debt.vercel.app/faq" className="text-muted-foreground text-xs">{t('settings.faq')}</Link>	
			</View>
		</SafeAreaView>
	);
}

function FeatureItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
	const colorScheme = useColorScheme();

	return (
		<View className="flex-row items-center gap-4">
			<Ionicons name={icon} size={24} className="text-primary" color={colorScheme === 'dark' ? '#fff' : '#000'} />
			<Text className="text-foreground text-lg font-medium">{text}</Text>
		</View>
	);
}
