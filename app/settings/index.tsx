import Button from '@/components/ui/button';
import { getSelectedApps, getSelectedContexts, getSelectedTimePresets, getSetting, openDatabase, resetAllData, setSetting } from '@/lib/db';
import { clearAllData, fillWeekWithMockData } from '@/lib/mock';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TourTarget } from '@/components/tour/TourTarget';
import { useTour } from '@/lib/tour/TourContext';
import { cn, formatTime } from '@/lib/utils';
import Slider from '@react-native-community/slider';

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();

	// State
	const [apps, setApps] = useState<any[]>([]);
	const [contexts, setContexts] = useState<any[]>([]);
	const [times, setTimes] = useState<any[]>([]);
	const [dailyBudget, setDailyBudget] = useState(60);
	const [language, setLanguage] = useState(i18n.language);
	const [defaultApp, setDefaultApp] = useState<string | null>(null);
	const [defaultDuration, setDefaultDuration] = useState<string>('15');
	const [defaultContext, setDefaultContext] = useState<string>('');
	const [bankruptcy, setBankruptcy] = useState(false);

	// Tour
	const { isOpen, steps, activeStep } = useTour();
	const scrollViewRef = useRef<ScrollView>(null);

	useFocusEffect(
		useCallback(() => {
			loadSettings();
		}, [])
	);

	useEffect(() => {
		if (isOpen && steps[activeStep]?.id === 'awards-button') {
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
		}
	}, [isOpen, activeStep, steps]);

	const loadSettings = async () => {
		await openDatabase();
		// Load apps for selection
		const appsRes = await getSelectedApps();
		setApps(appsRes);

		// Load contexts
		const contextsRes = await getSelectedContexts();
		setContexts(contextsRes);

		// Load time presets
		const timesRes = await getSelectedTimePresets();
		setTimes(timesRes);

		// Load stored defaults
		const defApp = await getSetting('default_app');
		const defDur = await getSetting('default_duration');
		const defCtx = await getSetting('default_context');
		const budget = await getSetting('daily_scroll_budget');

		if (budget) setDailyBudget(parseInt(budget));
		if (defApp) setDefaultApp(defApp);
		if (defDur) setDefaultDuration(defDur);
		if (defCtx) setDefaultContext(defCtx);

		const bankruptcyCb = await getSetting('enable_bankruptcy');
		setBankruptcy(bankruptcyCb === 'true');
	};

	const saveDefaults = async () => {
		if (defaultApp) await setSetting('default_app', defaultApp);
		if (defaultDuration) await setSetting('default_duration', defaultDuration);
		if (defaultContext) await setSetting('default_context', defaultContext);
		await setSetting('daily_scroll_budget', dailyBudget.toString());
		await setSetting('language', language);
		await setSetting('enable_bankruptcy', bankruptcy.toString());
		router.back();
	};

	const getBudgetLabel = (mins: number) => {
		if (mins <= 15) return t('onboarding.budget.labels.strict');
		if (mins <= 30) return t('onboarding.budget.labels.normal');
		if (mins <= 90) return t('onboarding.budget.labels.balanced');
		if (mins <= 120) return t('onboarding.budget.labels.generous');
		return t('onboarding.budget.labels.doomscroller');
	};

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center p-6 border-b border-border/40">
				<TouchableOpacity onPress={() => {
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
					router.back()
				}} className="mr-4">
					<Ionicons name="chevron-back" size={32} color={colorScheme === 'dark' ? 'white' : 'black'} />
				</TouchableOpacity>
				<Text className="text-3xl font-black text-foreground tracking-tight">{t('settings.title')}</Text>
			</View>

			<View className="flex-1">
				<ScrollView
					ref={scrollViewRef}
					contentContainerClassName="px-4 pt-6 pb-48"
					showsVerticalScrollIndicator={false}
				>
					{/* Top Actions */}
					<View className="flex-row justify-center mb-4">
						<TourTarget id="awards-button" className='w-1/2'>
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									router.push('/awards' as any);
								}}
								className="flex-1 bg-yellow-500/30 border border-yellow-500/20 p-4 rounded-l-3xl flex-row items-center justify-start gap-3"
							>
								<View className='flex-row items-center gap-3 mx-auto'>
									<Ionicons name="trophy" size={24} color="#eab308" />
									<View>
										<Text className="text-yellow-700 dark:text-yellow-400 font-bold text-lg">{t('settings.achievements')}</Text>
										<Text className="text-yellow-800 dark:text-yellow-300 text-xs">{t('settings.view_badges')}</Text>
									</View>
								</View>
							</TouchableOpacity>
						</TourTarget>

						<TouchableOpacity
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								router.push({ pathname: '/', params: { startTour: 'true' } } as any);
							}}
							className="w-1/2 bg-card border border-border px-5 rounded-r-3xl flex-row items-center justify-start gap-3"
						>
							<View className='flex-row items-center gap-3 mx-auto'>
								<MaterialIcons name="tour" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
								<View>
									<Text className="text-foreground font-bold text-lg">{t('settings.retake_tour')}</Text>
									<Text className="text-muted-foreground text-xs">{t('settings.retake_tour_description')}</Text>
								</View>
							</View>
						</TouchableOpacity>
					</View>

					<View className='bg-card p-4 rounded-3xl border border-border gap-6 mb-4'>
						<View className="flex-row items-center justify-between">
							<View className="flex-col items-start">
								<Text className="text-5xl font-black text-foreground mb-1">{dailyBudget}m</Text>
								<Text className={cn("text-md font-bold uppercase tracking-widest",
									dailyBudget <= 15 ? "text-green-500" :
										dailyBudget <= 30 ? "text-blue-500" :
											dailyBudget <= 60 ? "text-yellow-500" :
												dailyBudget <= 120 ? "text-orange-500" : "text-red-500"
								)}>
									{getBudgetLabel(dailyBudget)}
								</Text>
							</View>
							<Text className="text-xl font-semibold text-foreground mb-4">{formatTime(dailyBudget, 'long')}</Text>
						</View>
						<View>
							<Slider
								style={{ width: '100%', height: 40 }}
								minimumValue={15}
								maximumValue={240}
								step={15}
								value={dailyBudget}
								onValueChange={(value) => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									setDailyBudget(value)
								}}
								minimumTrackTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
								maximumTrackTintColor={colorScheme === 'dark' ? '#d3d3d3' : '#e4e4e4'}
								thumbTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
							/>
							<View className="flex-row justify-between px-2 mt-2">
								<Text className="text-muted-foreground font-medium">15m</Text>
								<Text className="text-muted-foreground font-medium">4h</Text>
							</View>
						</View>
					</View>

					{/* Defaults Configuration */}
					<View className="mb-4">
						<TourTarget id="defaults-section">
							<View className="bg-card p-4 rounded-3xl border border-border gap-6">

								<Text className="text-xl font-bold text-foreground ">{t('settings.quick_add_defaults')}</Text>

								{/* Hobbies Management */}
								<TouchableOpacity
									className="flex-row items-center justify-between"
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										router.push({ pathname: '/settings/manage' as any, params: { type: 'hobbies' } });
									}}
								>
									<View>
										<Text className="text-foreground font-semibold text-base">{t('settings.manage_hobbies')}</Text>
										<Text className="text-muted-foreground text-xs">{t('settings.manage_hobbies_desc')}</Text>
									</View>
									<View className="bg-primary p-2 rounded-2xl">
										<Ionicons name="create-outline" size={20} color={colorScheme === 'dark' ? 'black' : 'white'} />
									</View>
								</TouchableOpacity>

								<View className="h-[1px] bg-border/50" />

								{/* Default App */}
								<View>
									<Text className="text-muted-foreground mb-2 font-medium">{t('settings.default_app')}</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
										<TouchableOpacity
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												router.push({ pathname: '/settings/manage' as any, params: { type: 'apps' } });
											}}
											className="px-2.5 py-1.5 rounded-2xl border border-border items-center justify-center bg-primary mr-2"
										>
											<Ionicons name="add" size={20} color={colorScheme === 'dark' ? 'black' : 'white'} />
										</TouchableOpacity>
										{apps.map(app => (
											<TouchableOpacity
												key={app.id}
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
													setDefaultApp(app.name)
												}}
												className={`flex-1 px-4 mr-1 py-2.5 rounded-2xl border items-center ${defaultApp === app.name ? 'bg-primary border-primary' : 'bg-background/50 border-border'}`}
											>
												<Text className={defaultApp === app.name ? 'text-white dark:text-black font-semibold' : 'text-foreground'}>
													{i18n.language === 'it' ? (app.name_it || app.name) : app.name}
												</Text>
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>

								{/* Default Duration */}
								<View>
									<Text className="text-muted-foreground mb-2 font-medium">{t('settings.default_minutes')}</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
										<TouchableOpacity
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												router.push({ pathname: '/settings/manage' as any, params: { type: 'times' } });
											}}
											className="px-2.5 py-1.5 rounded-2xl border border-border items-center justify-center bg-primary mr-2"
										>
											<Ionicons name="add" size={20} color={colorScheme === 'dark' ? 'black' : 'white'} />
										</TouchableOpacity>
										{times.map(tItem => (
											<TouchableOpacity
												key={tItem.id}
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
													setDefaultDuration(tItem.minutes.toString())
												}}
												className={`flex-1 px-4 py-2.5 rounded-2xl border items-center mr-1 ${defaultDuration === tItem.minutes.toString() ? 'bg-primary border-primary' : 'bg-background/50 border-border'}`}
											>
												<Text className={defaultDuration === tItem.minutes.toString() ? 'text-white dark:text-black font-semibold' : 'text-foreground'}>{tItem.minutes}m</Text>
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>

								{/* Default Context */}
								<View>
									<Text className="text-muted-foreground mb-2 font-medium">{t('settings.default_context')}</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row flex-wrap gap-2 mb-1">
										<TouchableOpacity
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												router.push({ pathname: '/settings/manage' as any, params: { type: 'contexts' } });
											}}
											className="px-2.5 py-1.5 rounded-2xl border border-border items-center justify-center bg-primary mr-2"
										>
											<Ionicons name="add" size={20} color={colorScheme === 'dark' ? 'black' : 'white'} />
										</TouchableOpacity>

										{contexts.map(ctx => (
											<TouchableOpacity
												key={ctx.id}
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
													setDefaultContext(ctx.name)
												}}
												className={`flex-1 px-4 py-2.5 rounded-2xl border items-center mr-1 ${defaultContext === ctx.name ? 'bg-primary border-primary' : 'bg-background/50 border-border'}`}
											>
												<Text className={defaultContext === ctx.name ? 'text-white dark:text-black font-semibold' : 'text-foreground'}>
													{i18n.language === 'it' ? (ctx.name_it || ctx.name) : ctx.name}
												</Text>
											</TouchableOpacity>
										))}


									</ScrollView>
								</View>

							</View>
						</TourTarget>
					</View>

					{/* Hardcore Mode */}


					<View className="mb-4">
						<View className="bg-card flex-row items-center justify-between p-4 rounded-3xl border border-border gap-2">
							<Text className="text-xl font-bold text-foreground">{t('settings.language')}</Text>
							<View className="flex-row">
								{['en', 'it'].map((lang, index) => (
									<TouchableOpacity
										key={lang}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											setLanguage(lang);
											i18n.changeLanguage(lang);
										}}
										className={cn(`px-4 py-3  border items-center`,
											index === 0 ? 'rounded-l-2xl' : '',
											index === ['en', 'it'].length - 1 ? 'rounded-r-2xl' : '',
											language === lang ? 'bg-primary border-primary' : 'bg-background/30 border-border'
										)}
									>
										<Text className={language === lang ? 'text-white dark:text-black font-semibold' : 'text-foreground'}>
											{lang === 'en' ? 'English' : 'Italiano'}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					</View>

					{process.env.NODE_ENV === 'development' && (
						<View className="mb-4">
							<View className="bg-card p-4 rounded-3xl border border-border gap-2">
								<Text className="text-xl font-bold text-foreground">Sviluppatore</Text>
								<View className="flex-row gap-2">
									<TouchableOpacity
										onPress={async () => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
											await fillWeekWithMockData();
											Alert.alert("Fatto", "Dati generati per la settimana corrente.");
										}}
										className="flex-1 px-4 py-3 rounded-2xl border items-center bg-blue-500 border-blue-600"
									>
										<Text className="text-white font-semibold">Genera Dati</Text>
									</TouchableOpacity>

									<TouchableOpacity
										onPress={async () => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
											await clearAllData();
											Alert.alert("Fatto", "Dati cancellati.");
										}}
										className="flex-1 px-4 py-3 rounded-2xl border items-center bg-red-500 border-red-600"
									>
										<Text className="text-white font-semibold">Cancella Dati</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					)}

					<View className="mb-4">
						<View className="bg-card border border-border p-4 rounded-3xl gap-2">
							<View className='flex-row items-center justify-between border-b border-border pb-3'>
								<View>
									<Text className="text-xl font-bold text-foreground mb-1">{t('settings.bankruptcy', 'Bankruptcy Mode')}</Text>
									<Text className="text-foreground text-xs max-w-60">{t('settings.bankruptcy_desc', 'If debt > 500m, you lose all awards to reset.')}</Text>
								</View>

								<View className="flex-row items-center justify-between">
									<Switch
										trackColor={{ false: "#fff", true: colorScheme === 'dark' ? '#C9F655' : '#4D542B' }}
										thumbColor={bankruptcy ? "#ffffff" : "#f4f3f4"}
										ios_backgroundColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
										value={bankruptcy}
										onValueChange={(val) => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											setBankruptcy(val);
										}}
									/>
								</View>
							</View>
							<TouchableOpacity
								className='flex-row items-center gap-1.5 pt-2'
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									router.push('/bankruptcy');
								}}
							>
								<AntDesign name="question-circle" size={14} color={colorScheme === 'dark' ? '#B0AAB9' : '#363831'} />
								<Text className="text-xs text-foreground">
									{t('settings.bankruptcy_more')}
								</Text>
							</TouchableOpacity>
							<View className='absolute -top-2.5 right-2 bg-primary px-3 py-1.5 rounded-full'>
								<Text className="text-xs text-white dark:text-black">{t('settings.new_feature')}</Text>
							</View>
						</View>
					</View>

					{/* Danger Zone */}
					<View>
						<TouchableOpacity
							onPress={() => {
								Alert.alert(
									t('settings.reset_confirm_title'),
									t('settings.reset_confirm_desc'),
									[
										{ text: t('settings.cancel'), style: "cancel" },
										{
											text: t('settings.delete'),
											style: "destructive",
											onPress: async () => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
												await resetAllData();
												router.replace('/onboarding');
											}
										}
									]
								);
							}}
							className="flex-row items-center justify-between bg-destructive/10 p-4 rounded-3xl border border-destructive/20"
						>
							<View className="flex-row items-center gap-3">
								<View className="bg-destructive/20 p-2 rounded-full">
									<Ionicons name="trash-outline" size={24} color="#ef4444" />
								</View>
								<View>
									<Text className="text-lg font-bold text-foreground">{t('settings.reset_data')}</Text>
									<Text className="text-foreground text-sm">{t('settings.reset_data_desc')}</Text>
								</View>
							</View>
							<Ionicons name="chevron-forward" size={24} color="#ef4444" />
						</TouchableOpacity>
					</View>


					<View className='pt-8 flex-col items-center justify-center gap-1'>
						<Text className='text-foreground text-lg font-bold'>v0.1.0</Text>
						<Text className='text-muted-foreground text-base'>{t('settings.created_by')} <Link href="https://tob.codes" className="underline underline-offset-4">Tobia Bartolomei</Link></Text>
						<View className='flex-row items-center justify-center gap-2'>
							<Link href="https://scroll-debt.vercel.app/privacy" className="text-muted-foreground text-xs">{t('settings.privacy')}</Link>
							<Link href="https://scroll-debt.vercel.app/terms" className="text-muted-foreground text-xs">{t('settings.terms')}</Link>
							<Link href="https://scroll-debt.vercel.app/security" className="text-muted-foreground text-xs">{t('settings.security')}</Link>
							<Link href="https://scroll-debt.vercel.app/faq" className="text-muted-foreground text-xs">{t('settings.faq')}</Link>
						</View>
					</View>

				</ScrollView>

				<View className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
					<MaskedView
						style={StyleSheet.absoluteFill}
						maskElement={
							<LinearGradient
								colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
								locations={[0, 0.6, 0.8, 1]}
								style={StyleSheet.absoluteFill}
							/>
						}
					>
						<BlurView
							intensity={100}
							tint={colorScheme === 'dark' ? 'dark' : 'light'}
							style={StyleSheet.absoluteFill}
						/>
					</MaskedView>
				</View>

				<View className="absolute bottom-6 left-6 right-6">
					<Button
						onPress={() => {
							Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Success
							)
							saveDefaults()
						}}
						className="w-full rounded-full"
						size="xl"
					>
						<Text className="text-white dark:text-black mx-auto text-center font-semibold text-xl">{t('settings.save_settings')}</Text>
					</Button>
				</View>
			</View >
		</View >
	);
}
