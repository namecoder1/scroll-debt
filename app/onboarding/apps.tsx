import ProgressBar from '@/components/onboarding/progress-bar';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openDatabase } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppsSelectionScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme()
	const [apps, setApps] = useState<{ id: number, name: string, name_it?: string, selected: boolean, is_custom?: number, category?: string, category_it?: string }[]>([]);
	const [customApp, setCustomApp] = useState('');
	const scrollRef = useRef<ScrollView>(null);
	const inputRef = useRef<TextInput>(null);

	useEffect(() => {
		const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
			if (inputRef.current?.isFocused()) {
				scrollRef.current?.scrollToEnd({ animated: true });
			}
		});

		return () => {
			showSubscription.remove();
		};
	}, []);

	useEffect(() => {
		async function loadApps() {
			const db = await openDatabase();
			const result: any[] = await db.getAllAsync('SELECT * FROM apps');
			setApps(result.map(app => ({ ...app, selected: false })));
		}
		loadApps();
	}, []);

	const insets = useSafeAreaInsets();

	const toggleApp = (id: number) => {
		setApps(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
	};

	const deleteApp = async (id: number) => {
		const db = await openDatabase();
		await db.runAsync('DELETE FROM apps WHERE id = ?', id);
		setApps(prev => prev.filter(a => a.id !== id));
	};

	const addCustomApp = async () => {
		if (!customApp.trim()) return;
		const db = await openDatabase();
		const res = await db.runAsync('INSERT INTO apps (name, is_custom, category) VALUES (?, 1, ?)', customApp.trim(), 'Custom');
		setApps(prev => [...prev, { id: res.lastInsertRowId, name: customApp.trim(), selected: true, is_custom: 1, category: 'Custom' }]);
		setCustomApp('');
	};

	const handleContinue = async () => {
		const selectedIds = apps.filter(a => a.selected).map(a => a.id);
		const db = await openDatabase();

		await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'selected_apps', JSON.stringify(selectedIds));
		router.push('/onboarding/hobbies');
	};

	const selectedCount = apps.filter(a => a.selected).length;

	return (
		<View className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
			>
				<View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: 0 }}>
					<ScrollView 
						ref={scrollRef}
						className="flex-1 px-6" 
						contentContainerClassName="pb-48 pt-36" 
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					>
						<View className="gap-6">
							{Object.entries(
								apps.reduce((acc, app) => {
									const cat = (i18n.language === 'it' ? app.category_it : app.category) || app.category || 'Other';
									if (!acc[cat]) acc[cat] = [];
									acc[cat].push(app);
									return acc;
								}, {} as Record<string, typeof apps>)
							).sort((a, b) => {
								// Custom categories last, others alphabetical or purely by key
								if (a[0] === 'Custom') return 1;
								if (b[0] === 'Custom') return -1;
								if (a[0] === 'Other') return 1;
								if (b[0] === 'Other') return -1;
								return 0; // Keep DB order or use a[0].localeCompare(b[0])
							}).map(([category, categoryApps]) => (
								<View key={category}>
									<Text className="text-xl font-bold mb-3 text-foreground">{category}</Text>
									<View className="flex-row flex-wrap gap-3">
										{categoryApps.map(app => (
											<Button
												key={app.id}
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
													toggleApp(app.id)
												}}
												variant={app.selected ? 'default' : 'outline'}
												size="xl"
											>
												<View className="flex-row items-center gap-2">
													<Text className={cn('text-black dark:text-white text-base', app.selected && 'text-white dark:text-black')}>
														{i18n.language === 'it' ? (app.name_it || app.name) : app.name}
													</Text>
													{!!app.is_custom && (
														<Pressable
															onPress={() => {
																Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
																deleteApp(app.id)
															}}
															hitSlop={10}
															className="bg-black/10 dark:bg-white/20 rounded-full p-0.5"
														>
															<Ionicons name="close" size={12} color={app.selected ? (colorScheme === 'dark' ? 'black' : 'white') : (colorScheme === 'dark' ? 'white' : 'black')} />
														</Pressable>
													)}
												</View>
											</Button>
										))}
									</View>
								</View>
							))}
						</View>

						<View className="mt-8 bg-card p-4 rounded-2xl border-2 border-border">
							<Text className="text-foreground font-bold mb-3 ml-1">{t('onboarding.apps.missing')}</Text>
							<View className="flex-row gap-2">
								<Input
									ref={inputRef}
									className='bg-input text-foreground flex-1'
									placeholder={t('onboarding.apps.placeholder')}
									placeholderTextColor="#94a3b8"
									value={customApp}
									onChangeText={setCustomApp}
									onSubmitEditing={addCustomApp}
								/>
								<Button
									onPress={() => {
										Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
										addCustomApp()
									}}
									disabled={!customApp.trim()}
									className='w-fit'
									variant='outline'
								>
									<Ionicons
										name="add"
										size={24}
										color={
											colorScheme === 'dark' && customApp.trim() ? "white"
												: colorScheme === 'light' && customApp.trim() ? "black"
													: colorScheme === 'dark' && !customApp.trim() ? 'white'
														: 'black'
										}
									/>
								</Button>
							</View>
						</View>
					</ScrollView>

					<View className="absolute top-0 left-0 right-0" style={{ paddingTop: insets.top }} pointerEvents="none">
						<View className="absolute top-0 left-0 right-0 h-52 pointer-events-none">
							<MaskedView
								style={StyleSheet.absoluteFill}
								maskElement={
									<LinearGradient
										colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
										locations={[0, 0.4, 0.6, 0.8, 1]}
										style={StyleSheet.absoluteFill}
									/>
								}
							>
								<BlurView
									intensity={70}
									tint={colorScheme === 'dark' ? 'dark' : 'light'}
									style={StyleSheet.absoluteFill}
								/>
							</MaskedView>
						</View>
						<View className="mb-6 mt-4 px-6">
							<ProgressBar currentStep={1} totalSteps={3} />
							<Text className="text-3xl font-black tracking-tighter text-foreground">{t('onboarding.apps.title')}</Text>
							<Text className="text-muted-foreground mt-2 text-lg">{t('onboarding.apps.subtitle')}</Text>
						</View>
					</View>

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
						{selectedCount === 0 && (
							<View className='mb-2'>
								<Text className="text-center text-xs text-foreground">{t('onboarding.apps.at_least')}</Text>
							</View>
						)}
						<Button
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
								handleContinue()
							}}
							disabled={selectedCount === 0}
							size='xl'
							className='rounded-full w-full'
						>
							<Text className={cn(
								selectedCount === 0 ? 'text-foreground/50' : 'text-white dark:text-black',
								'mx-auto font-semibold text-xl'
							)}>{t('onboarding.apps.continue')}</Text>
						</Button>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
}
