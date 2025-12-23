import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, ScrollView, StyleProp, Text, TextInput, useColorScheme, View, ViewStyle } from 'react-native';

export interface HobbyItem {
	id: number;
	name: string;
	name_it?: string;
	selected: boolean;
	is_custom?: number;
	category?: string;
	category_it?: string;
}

interface HobbiesListProps {
	hobbies: HobbyItem[];
	toggleHobby: (id: number) => void;
	deleteHobby: (id: number) => void;
	addCustomHobby: () => void;
	customHobby: string;
	setCustomHobby: (text: string) => void;
	contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function HobbiesList({
	hobbies,
	toggleHobby,
	deleteHobby,
	addCustomHobby,
	customHobby,
	setCustomHobby,
	contentContainerStyle
}: HobbiesListProps) {
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
					return 0;
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

			<View className="mt-8 bg-card p-4 rounded-2xl border-2 border-border mb-8">
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
	);
}
