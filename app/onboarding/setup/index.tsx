import AppsList, { AppItem } from '@/components/onboarding/AppsList';
import BudgetView from '@/components/onboarding/BudgetView';
import HobbiesList, { HobbyItem } from '@/components/onboarding/HobbiesList';
import ProgressBar from '@/components/onboarding/progress-bar';
import Button from '@/components/ui/button';
import { openDatabase, setSetting } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SetupScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();
	
	const [currentStep, setCurrentStep] = useState(1);
	
	// Apps State
	const [apps, setApps] = useState<AppItem[]>([]);
	const [customApp, setCustomApp] = useState('');
	
	// Hobbies State
	const [hobbies, setHobbies] = useState<HobbyItem[]>([]);
	const [customHobby, setCustomHobby] = useState('');
	
	// Budget State
	const [budget, setBudget] = useState(60);

	// Logics for Apps
	useEffect(() => {
		async function loadApps() {
			const db = await openDatabase();
			// We load all apps. Selection is transient for this session unless we read from settings?
			// The original apps.tsx didn't read from settings, so we start fresh.
			const result: any[] = await db.getAllAsync('SELECT * FROM apps');
			setApps(result.map(app => ({ ...app, selected: false })));
		}
		loadApps();
	}, []);

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

	// Logics for Hobbies
	useEffect(() => {
		async function loadHobbies() {
			const db = await openDatabase();
			const result: any[] = await db.getAllAsync('SELECT * FROM hobbies');
			setHobbies(result.map(hobby => ({ ...hobby, selected: false })));
		}
		loadHobbies();
	}, []);

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

	// Navigation & Saving
	const handleNext = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		if (currentStep === 1) {
			const selectedIds = apps.filter(a => a.selected).map(a => a.id);
			await setSetting('selected_apps', JSON.stringify(selectedIds));
			setCurrentStep(2);
		} else if (currentStep === 2) {
			const selectedIds = hobbies.filter(a => a.selected).map(a => a.id);
			await setSetting('selected_hobbies', JSON.stringify(selectedIds));
			setCurrentStep(3);
		} else if (currentStep === 3) {
			await setSetting('daily_scroll_budget', budget.toString());
			await setSetting('onboarding_completed', 'true');
			router.replace({ pathname: '/', params: { startTour: 'true' } });
		}
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		if (currentStep > 1) {
			setCurrentStep(prev => prev - 1);
		} else {
			router.back();
		}
	};

	// Header Config
	const getHeaderInfo = () => {
		if (currentStep === 1) return { title: t('onboarding.apps.title'), subtitle: t('onboarding.apps.subtitle') };
		if (currentStep === 2) return { title: t('onboarding.hobbies.title'), subtitle: t('onboarding.hobbies.subtitle') };
		return { title: t('onboarding.budget.title'), subtitle: t('onboarding.budget.subtitle') };
	};

	const { title, subtitle } = getHeaderInfo();

	// Button Config
	const canProceed = () => {
		if (currentStep === 1) return apps.some(a => a.selected);
		if (currentStep === 2) return hobbies.some(h => h.selected);
		return true;
	};

	const getButtonText = () => {
		if (currentStep === 1) return t('onboarding.apps.continue');
		if (currentStep === 2) return t('onboarding.hobbies.next');
		return t('onboarding.budget.finish');
	};

	return (
		<View className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
			>
				{/* Main Content */}
				<View className="flex-1" style={{ paddingTop: insets.top }}>
					{currentStep === 1 && (
						<AppsList 
							apps={apps}
							toggleApp={toggleApp}
							deleteApp={deleteApp}
							addCustomApp={addCustomApp}
							customApp={customApp}
							setCustomApp={setCustomApp}
						/>
					)}
					{currentStep === 2 && (
						<HobbiesList
							hobbies={hobbies}
							toggleHobby={toggleHobby}
							deleteHobby={deleteHobby}
							addCustomHobby={addCustomHobby}
							customHobby={customHobby}
							setCustomHobby={setCustomHobby}
						/>
					)}
					{currentStep === 3 && (
						<BudgetView
							budget={budget}
							setBudget={setBudget}
						/>
					)}
				</View>

				{/* Header Overlay */}
				<View className="absolute top-0 left-0 right-0" style={{ paddingTop: insets.top }} pointerEvents="none">
					{/* Gradient Blur Background for Header */}
					<View className="absolute top-0 left-0 right-0 h-56 pointer-events-none">
						<MaskedView
							style={StyleSheet.absoluteFill}
							maskElement={
								<>
									<LinearGradient
										colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
										locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
										style={StyleSheet.absoluteFill}
									/>
								</>
							}
						>
							<BlurView
								intensity={70}
								tint={colorScheme === 'dark' ? 'dark' : 'light'}
								style={StyleSheet.absoluteFill}
							/>
						</MaskedView>
					</View>

					{/* Header Content */}
					<View className="mb-6 mt-4 px-6 pointer-events-auto">
						<ProgressBar currentStep={currentStep} totalSteps={3} />
						<Text className="text-3xl font-black tracking-tighter text-foreground">{title}</Text>
						<Text className="text-muted-foreground mt-2 text-lg">{subtitle}</Text>
					</View>
				</View>

				{/* Footer Overlay */}
				<View className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
					{/* Gradient Blur Background for Footer */}
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

					{/* Footer Buttons */}
					<View className="px-6 pb-6 pt-0 flex-row gap-2">
						{currentStep > 1 && (
							<Button
								onPress={handleBack}
								size="xl"
								className="rounded-full"
								variant='outline'
							>
								<Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
							</Button>
						)}
						<Button
							onPress={handleNext}
							disabled={!canProceed()}
							size='xl'
							className='rounded-full flex-1'
						>
							<Text className={cn(
								!canProceed() ? 'text-foreground/50' : 'text-white dark:text-black',
								'mx-auto font-semibold text-xl'
							)}>{getButtonText()}</Text>
						</Button>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
}
