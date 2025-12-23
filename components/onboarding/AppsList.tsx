import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, ScrollView, StyleProp, Text, TextInput, useColorScheme, View, ViewStyle } from 'react-native';

export interface AppItem {
	id: number;
	name: string;
	name_it?: string;
	selected: boolean;
	is_custom?: number;
	category?: string;
	category_it?: string;
}

interface AppsListProps {
	apps: AppItem[];
	toggleApp: (id: number) => void;
	deleteApp: (id: number) => void;
	addCustomApp: () => void;
	customApp: string;
	setCustomApp: (text: string) => void;
	contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function AppsList({
	apps,
	toggleApp,
	deleteApp,
	addCustomApp,
	customApp,
	setCustomApp,
	contentContainerStyle
}: AppsListProps) {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme();
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

	return (
		<ScrollView 
			ref={scrollRef}
			className="flex-1 px-6" 
			contentContainerClassName="pb-48 pt-36" 
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps='handled'
			contentContainerStyle={contentContainerStyle}
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
					return 0;
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

			<View className="mt-8 bg-card p-4 rounded-3xl border-2 border-border mb-8">
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
					>
						<Ionicons
							name="add"
							size={24}
							color={
								colorScheme === 'dark' && customApp.trim() ? "black"
									: colorScheme === 'light' && customApp.trim() ? "white"
										: colorScheme === 'dark' && !customApp.trim() ? 'white'
											: 'black'
							}
						/>
					</Button>
				</View>
			</View>
		</ScrollView>
	);
}
