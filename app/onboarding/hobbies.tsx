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

export default function HobbiesSelectionScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const [hobbies, setHobbies] = useState<{ id: number, name: string, name_it?: string, selected: boolean, is_custom?: number, category?: string, category_it?: string }[]>([]);
	const [customHobby, setCustomHobby] = useState('');
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
		async function loadHobbies() {
			const db = await openDatabase();
			const result: any[] = await db.getAllAsync('SELECT * FROM hobbies');
			setHobbies(result.map(hobby => ({ ...hobby, selected: false })));
		}
		loadHobbies();
	}, []);

	const insets = useSafeAreaInsets();

	const toggleHobby = (id: number) => {
		setHobbies(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
	};

	const deleteHobby = async (id: number) => {
		const db = await openDatabase();
		await db.runAsync('DELETE FROM hobbies WHERE id = ?', id);
		setHobbies(prev => prev.filter(a => a.id !== id));
	};

	const addCustomHobby = async () => {
		if (!customHobby.trim()) return;
		const db = await openDatabase();
		const res = await db.runAsync('INSERT INTO hobbies (name, is_custom, category) VALUES (?, 1, ?)', customHobby.trim(), 'Custom');
		setHobbies(prev => [...prev, { id: res.lastInsertRowId, name: customHobby.trim(), selected: true, is_custom: 1, category: 'Custom' }]);
		setCustomHobby('');
	};

	const handleNext = async () => {
		const selectedIds = hobbies.filter(a => a.selected).map(a => a.id);
		const db = await openDatabase();

		await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'selected_hobbies', JSON.stringify(selectedIds));
		router.push('/onboarding/budget');
	};

	const selectedCount = hobbies.filter(a => a.selected).length;

	return (
		<View className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
			>
				<View className="flex-1 px-6" style={{ paddingTop: insets.top, paddingBottom: 0 }}>
					<View className="mb-6 mt-4">
						<ProgressBar currentStep={2} totalSteps={3} />
						<Text className="text-3xl font-black tracking-tighter text-foreground">{t('onboarding.hobbies.title')}</Text>
						<Text className="text-muted-foreground mt-2 text-lg">{t('onboarding.hobbies.subtitle')}</Text>
					</View>



					<ScrollView 
						ref={scrollRef}
						className="flex-1" 
						contentContainerClassName="pb-48" 
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					>
						<View className="gap-6">
							{Object.entries(
								hobbies.reduce((acc, hobby) => {
									const cat = (i18n.language === 'it' ? hobby.category_it : hobby.category) || hobby.category || 'Other';
									if (!acc[cat]) acc[cat] = [];
									acc[cat].push(hobby);
									return acc;
								}, {} as Record<string, typeof hobbies>)
							).sort((a, b) => {
								// Custom categories last, others alphabetical or purely by key
								if (a[0] === 'Custom') return 1;
								if (b[0] === 'Custom') return -1;
								if (a[0] === 'Other') return 1;
								if (b[0] === 'Other') return -1;
								return 0; // Keep DB order or use a[0].localeCompare(b[0])
							}).map(([category, categoryHobbies]) => (
								<View key={category}>
									<Text className="text-xl font-bold mb-3 text-foreground">{category}</Text>
									<View className="flex-row flex-wrap gap-3">
										{categoryHobbies.map(hobby => (
											<Button
												key={hobby.id}
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
													toggleHobby(hobby.id)
												}}
												variant={hobby.selected ? 'default' : 'outline'}
												size="xl"
											>
												<View className="flex-row items-center gap-2">
													<Text className={cn('text-black dark:text-white text-base', hobby.selected && 'text-white dark:text-black')}>
														{i18n.language === 'it' ? (hobby.name_it || hobby.name) : hobby.name}
													</Text>
													{!!hobby.is_custom && (
														<Pressable
															onPress={() => {
																Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
																deleteHobby(hobby.id)
															}}
															hitSlop={10}
															className="bg-black/10 dark:bg-white/20 rounded-full p-0.5"
														>
															<Ionicons name="close" size={12} color={hobby.selected ? (colorScheme === 'dark' ? 'black' : 'white') : (colorScheme === 'dark' ? 'white' : 'black')} />
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
							<Text className="text-foreground font-bold mb-3 ml-1">{t('onboarding.hobbies.missing')}</Text>
							<View className="flex-row gap-2">
								<Input
									ref={inputRef}
									className='bg-input text-foreground flex-1'
									placeholder={t('onboarding.hobbies.placeholder')}
									placeholderTextColor="#94a3b8"
									value={customHobby}
									onChangeText={setCustomHobby}
									onSubmitEditing={addCustomHobby}
								/>
								<Button
									onPress={() => {
										Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
										addCustomHobby()
									}}
									disabled={!customHobby.trim()}
									className='w-fit'
									variant='outline'
								>
									<Ionicons
										name="add"
										size={24}
										color={
											colorScheme === 'dark' && customHobby.trim() ? "white"
												: colorScheme === 'light' && customHobby.trim() ? "black"
													: colorScheme === 'dark' && !customHobby.trim() ? 'white'
														: 'black'
										}
									/>
								</Button>
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
						{selectedCount === 0 && (
							<View className='mb-2'>
								<Text className="text-center text-xs text-foreground">{t('onboarding.hobbies.at_least')}</Text>
							</View>
						)}
						<Button
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
								handleNext()
							}}
							disabled={selectedCount === 0}
							size='xl'
							className='rounded-full w-full'
						>
							<Text className={cn(
								selectedCount === 0 ? 'text-foreground/50' : 'text-white dark:text-black',
								'mx-auto font-semibold text-xl'
							)}>{t('onboarding.hobbies.next')}</Text>
						</Button>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
}
