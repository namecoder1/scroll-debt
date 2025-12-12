import Button from '@/components/ui/button';
import { getSetting, openDatabase, resetAllData, setSetting } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();
	const [apps, setApps] = useState<any[]>([]);
	const [contexts, setContexts] = useState<any[]>([]);
	const [times, setTimes] = useState<any[]>([]);

	const [dailyBudget, setDailyBudget] = useState(60);
	const [language, setLanguage] = useState(i18n.language);

	const [defaultApp, setDefaultApp] = useState<string | null>(null);
	const [defaultDuration, setDefaultDuration] = useState<string>('15');
	const [defaultContext, setDefaultContext] = useState<string>('');

	useFocusEffect(
		useCallback(() => {
			loadSettings();
		}, [])
	);



	const loadSettings = async () => {
		const db = await openDatabase();
		// Load apps for selection
		const appsRes: any[] = await db.getAllAsync('SELECT * FROM apps');
		setApps(appsRes);

		// Load contexts
		const contextsRes: any[] = await db.getAllAsync('SELECT * FROM contexts');
		setContexts(contextsRes);

		// Load time presets
		const timesRes: any[] = await db.getAllAsync('SELECT * FROM time_presets ORDER BY minutes ASC');
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
	};



	const saveDefaults = async () => {
		if (defaultApp) await setSetting('default_app', defaultApp);
		if (defaultDuration) await setSetting('default_duration', defaultDuration);
		if (defaultContext) await setSetting('default_context', defaultContext);
		await setSetting('daily_scroll_budget', dailyBudget.toString());
		await setSetting('language', language);
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
		<View className="flex-1 bg-background">
			<View className="flex-row items-center px-4 border-b border-border" style={{ paddingTop: insets.top, height: 60 + insets.top }}>
				<TouchableOpacity onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					router.back()
				}} className="mr-4">
					<Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
				</TouchableOpacity>
				<Text className="text-2xl font-bold text-foreground">{t('settings.title')}</Text>
			</View>

			<View className="flex-1">
				<ScrollView
					className="flex-1 px-4 py-6"
					contentContainerClassName="pb-40"
					showsVerticalScrollIndicator={false}
				>
					<TouchableOpacity
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push('/awards')
						}}
						className="flex-row items-center justify-between bg-card p-4 rounded-3xl border border-border mb-4"
					>
						<View className="flex-row items-center gap-3">
							<View className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
								<Ionicons name="trophy" size={24} color={colorScheme === 'dark' ? '#ca8a04' : '#ca8a04'} />
							</View>
							<View>
								<Text className="text-lg font-bold text-foreground">{t('settings.achievements')}</Text>
								<Text className="text-muted-foreground text-sm">{t('settings.view_badges')}</Text>
							</View>
						</View>
						<Ionicons name="chevron-forward" size={24} color={colorScheme === 'dark' ? 'white' : '#94a3b8'} />
					</TouchableOpacity>

					{/* Defaults Configuration */}
					<View className="mb-4">
						<View className="bg-card p-4 rounded-3xl border border-border gap-6">
						<Text className="text-xl font-bold text-foreground">{t('settings.daily_goal')}</Text>
							<View className="items-center">
								<Text className="text-4xl font-black text-foreground mb-1">{dailyBudget}m</Text>
								<Text className={cn("text-sm font-bold uppercase tracking-widest mb-4",
									dailyBudget <= 15 ? "text-green-500" :
										dailyBudget <= 30 ? "text-blue-500" :
											dailyBudget <= 60 ? "text-yellow-500" :
												dailyBudget <= 120 ? "text-orange-500" : "text-red-500"
								)}>
									{getBudgetLabel(dailyBudget)}
								</Text>

								<Slider
									style={{ width: '100%', height: 40 }}
									minimumValue={15}
									maximumValue={240}
									step={15}
									value={dailyBudget}
									onValueChange={(value) => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setDailyBudget(value)
									}}
									minimumTrackTintColor={colorScheme === 'dark' ? 'white' : 'black'}
									maximumTrackTintColor={colorScheme === 'dark' ? '#333' : '#d3d3d3'}
								/>
								<View className="flex-row justify-between w-full px-2">
									<Text className="text-muted-foreground text-xs font-medium">15m</Text>
									<Text className="text-muted-foreground text-xs font-medium">4h</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Defaults Configuration */}
					<View className="mb-4">
						<View className="bg-card p-4 rounded-3xl border border-border gap-6">
						<Text className="text-xl font-bold text-foreground ">{t('settings.quick_add_defaults')}</Text>

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
											className={`flex-1 px-4 mr-1 py-2.5 rounded-2xl border items-center ${defaultApp === app.name ? 'bg-primary border-primary' : 'bg-background border-border'}`}
										>
											<Text className={defaultApp === app.name ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
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
											className={`flex-1 px-4 py-2.5 rounded-2xl border items-center mr-1 ${defaultDuration === tItem.minutes.toString() ? 'bg-primary border-primary' : 'bg-background border-border'}`}
										>
											<Text className={defaultDuration === tItem.minutes.toString() ? 'text-primary-foreground font-semibold' : 'text-foreground'}>{tItem.minutes}m</Text>
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
											className={`flex-1 px-4 py-2.5 rounded-2xl border items-center mr-1 ${defaultContext === ctx.name ? 'bg-primary border-primary' : 'bg-background border-border'}`}
										>
											<Text className={defaultContext === ctx.name ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
												{i18n.language === 'it' ? (ctx.name_it || ctx.name) : ctx.name}
											</Text>
										</TouchableOpacity>
									))}

									
								</ScrollView>
							</View>

						</View>
					</View>

					<View className="mb-4">
						<View className="bg-card p-4 rounded-3xl border border-border gap-2">
							<Text className="text-xl font-bold text-foreground">{t('settings.language')}</Text>
							<View className="flex-row gap-2">
								{['en', 'it'].map((lang) => (
									<TouchableOpacity
										key={lang}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											setLanguage(lang);
											i18n.changeLanguage(lang);
										}}
										className={`flex-1 px-4 py-3 rounded-2xl border items-center ${language === lang ? 'bg-primary border-primary' : 'bg-background border-border'}`}
									>
										<Text className={language === lang ? 'text-primary-foreground font-semibold' : 'text-foreground'}>
											{lang === 'en' ? 'English' : 'Italiano'}
										</Text>
									</TouchableOpacity>
								))}
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
									<Text className="text-lg font-bold text-destructive">{t('settings.reset_data')}</Text>
									<Text className="text-destructive/80 text-sm">{t('settings.reset_data_desc')}</Text>
								</View>
							</View>
							<Ionicons name="chevron-forward" size={24} color="#ef4444" />
						</TouchableOpacity>
					</View>


					<View className='pt-8 flex-col items-center justify-center gap-1'>
						<Text className='text-foreground text-lg font-bold'>v0.1.0</Text>
						<Text className='text-muted-foreground text-base'>Creato da Tobia Bartolomei</Text>
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
						<Text className="text-primary-foreground mx-auto text-center font-black text-xl">{t('settings.save_settings')}</Text>
					</Button>
				</View>
			</View >
		</View >
	);
}
