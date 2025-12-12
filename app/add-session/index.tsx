import Button from '@/components/ui/button';
import { addSession, getSetting, openDatabase, updateSession } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSessionScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams();
	const isEditing = !!params.id;
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();

	const [duration, setDuration] = useState('');
	const [selectedApp, setSelectedApp] = useState<string | null>(null);
	const [apps, setApps] = useState<{ id: number, name: string, name_it?: string }[]>([]);
	const [contexts, setContexts] = useState<{ id: number, name: string, name_it?: string }[]>([]);
	const [customContext, setCustomContext] = useState('');

  const [presets, setPresets] = useState<number[]>([]);

	useEffect(() => {
		async function loadData() {
			const db = await openDatabase();
			// Should ideally filter by what user selected in onboarding, assuming we saved "active" apps or just show all for simplicity
			// For now show all, maybe order by usage later.
			const result: any[] = await db.getAllAsync('SELECT * FROM apps');
			setApps(result);

      // Load time presets
      const timesRes: any[] = await db.getAllAsync('SELECT * FROM time_presets ORDER BY minutes ASC');
      setPresets(timesRes.map(t => t.minutes));

			const contextsRes: any[] = await db.getAllAsync('SELECT * FROM contexts');
			setContexts(contextsRes);

			if (isEditing) {
				// Pre-fill data if editing
				if (params.duration) setDuration(params.duration as string);
				if (params.appName && params.appName !== 'null') setSelectedApp(params.appName as string);
				if (params.context && params.context !== 'null') setCustomContext(params.context as string);
			} else {
				// Load Defaults only if NOT editing
				const defApp = await getSetting('default_app');
				const defDur = await getSetting('default_duration');
				const defCtx = await getSetting('default_context');

				if (defApp) setSelectedApp(defApp);
				if (defDur) setDuration(defDur);
				if (defCtx) setCustomContext(defCtx);
			}
		}
		loadData();
	}, []);

	const handleSave = async () => {
		const mins = parseInt(duration);
		if (isNaN(mins) || mins <= 0 || !selectedApp) return;

		if (isEditing) {
			await updateSession(Number(params.id), mins, selectedApp || 'Unknown', customContext);
		} else {
			await addSession(mins, selectedApp || 'Unknown', customContext);
		}
		router.back();
	};

	return (
		<View className="flex-1 bg-background">
			<View className="flex-row items-center px-4 border-b border-border" style={{ paddingTop: insets.top, height: 60 + insets.top }}>
				<TouchableOpacity onPress={() => {
					Haptics.notificationAsync(
						Haptics.NotificationFeedbackType.Error
					)
					router.back()
				}} className="mr-4">
					<Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'gray'} />
				</TouchableOpacity>
				<Text className="text-2xl font-bold text-foreground">{isEditing ? t('add_session.edit_title') : t('add_session.add_title')}</Text>
			</View>

			<View className="flex-1">
				<ScrollView
					className="flex-1 px-4"
					contentContainerClassName="pb-40 pt-6"
					showsVerticalScrollIndicator={false}
				>
					{/* Presets */}
					<Text className="text-foreground text-lg font-semibold mb-3">{t('add_session.duration_label')}</Text>
					<View className="flex-row flex-wrap gap-2.5 mb-4">
						{presets.map(min => (
							<Button
								key={min}
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setDuration(min.toString())
								}}
								size="lg"
								className={`${duration === min.toString() ? 'bg-primary border-primary' : 'bg-card border-border'}`}
							>
								<Text className={`${duration === min.toString() ? 'text-primary-foreground' : 'text-foreground'}`}>
									{min >= 60 ? Math.floor(min / 60) : min}
									{min < 60 ? ' ' + t('add_session.minutes') : min === 60 ? ' ' + t('add_session.hour') : ' ' + t('add_session.hours')}
								</Text>
							</Button>
						))}
					</View>

					{/* Apps */}
					<Text className="text-foreground text-lg font-semibold mb-3">{t('add_session.which_app')}</Text>
					<View className="flex-row flex-wrap gap-2.5 mb-6">
						{apps.map(app => (
							<Button
								key={app.id}
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setSelectedApp(app.name)
								}}
								size="lg"
								className={`${selectedApp === app.name ? 'bg-primary border-primary' : 'bg-card border-border'}`}
							>
								<Text className={`${selectedApp === app.name ? 'text-primary-foreground' : 'text-foreground'}`}>
									{i18n.language === 'it' ? (app.name_it || app.name) : app.name}
								</Text>
							</Button>
						))}
					</View>

					{/* Context */}
					<Text className="text-foreground text-lg font-semibold mb-3">{t('add_session.context_optional')}</Text>
					<View className="flex-row flex-wrap gap-2.5 mb-4">
						{contexts.map(ctx => (
							<Button
								key={ctx.id}
								size='lg'
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setCustomContext(ctx.name)
								}}
								className={`${customContext === ctx.name ? 'bg-primary border-primary' : 'bg-card border-border'}`}
							>
								<Text className={`${customContext === ctx.name ? 'text-primary-foreground' : 'text-foreground'}`}>
									{i18n.language === 'it' ? (ctx.name_it || ctx.name) : ctx.name}
								</Text>
							</Button>
						))}
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
							handleSave()
						}}
						className='w-full rounded-full'
						disabled={!duration || !selectedApp}
						size="xl"
					>
						<Text className="text-primary-foreground mx-auto text-center font-black text-xl">{isEditing ? t('add_session.update_session') : t('add_session.confess_debt')}</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}
