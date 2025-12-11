import Button from '@/components/ui/button';
import { addSession, getSetting, openDatabase, updateSession } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddSessionScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams();
	const isEditing = !!params.id;

	const [duration, setDuration] = useState('');
	const [selectedApp, setSelectedApp] = useState<string | null>(null);
	const [apps, setApps] = useState<{ id: number, name: string, name_it?: string }[]>([]);
	const [contexts, setContexts] = useState<{ id: number, name: string, name_it?: string }[]>([]);
	const [customContext, setCustomContext] = useState('');

	const presets = [5, 15, 30, 60, 120];

	useEffect(() => {
		async function loadData() {
			const db = await openDatabase();
			// Should ideally filter by what user selected in onboarding, assuming we saved "active" apps or just show all for simplicity
			// For now show all, maybe order by usage later.
			const result: any[] = await db.getAllAsync('SELECT * FROM apps');
			setApps(result);

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
		if (isNaN(mins) || mins <= 0) return;

		if (isEditing) {
			await updateSession(Number(params.id), mins, selectedApp || 'Unknown', customContext);
		} else {
			await addSession(mins, selectedApp || 'Unknown', customContext);
		}
		router.back();
	};

	return (
		<SafeAreaView className="flex-1 bg-background p-6">
			<View className="flex-row items-center mb-6">
				<TouchableOpacity onPress={() => router.back()} className="mr-4">
					<Ionicons name="arrow-back" size={24} color="gray" />
				</TouchableOpacity>
				<Text className="text-2xl font-bold text-foreground">{isEditing ? 'Edit Session' : 'Add Scroll Debt'}</Text>
			</View>

			<ScrollView className="flex-1">
				{/* Presets */}
				<Text className="text-foreground font-semibold mb-3">Duration (minutes)</Text>
				<View className="flex-row flex-wrap gap-3 mb-4">
					{presets.map(min => (
						<Button
							key={min}
							onPress={() => setDuration(min.toString())}
							size="lg"
							className={`${duration === min.toString() ? 'bg-primary border-primary' : 'bg-card border-border'}`}
						>
							<Text className={`${duration === min.toString() ? 'text-primary-foreground' : 'text-foreground'}`}>
								{min >= 60 ? Math.floor(min / 60) : min}
								{min < 60 ? ' minutes' : min === 60 ? ' hour' : ' hours'}
							</Text>
						</Button>
					))}
				</View>

				{/* Apps */}
				<Text className="text-foreground font-semibold mb-3">Which App?</Text>
				<View className="flex-row flex-wrap gap-2 mb-6">
					{apps.map(app => (
						<Button
							key={app.id}
							onPress={() => setSelectedApp(app.name)}
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
				<Text className="text-foreground font-semibold mb-3">Context (Optional)</Text>
				<View className="flex-row flex-wrap gap-2 mb-4">
					{contexts.map(ctx => (
						<Button
							key={ctx.id}
							size='lg'
							onPress={() => setCustomContext(ctx.name)}
							className={`${customContext === ctx.name ? 'bg-primary border-primary' : 'bg-card border-border'}`}
						>
							<Text className={`${customContext === ctx.name ? 'text-primary-foreground' : 'text-foreground'}`}>
								{i18n.language === 'it' ? (ctx.name_it || ctx.name) : ctx.name}
							</Text>
						</Button>
					))}
				</View>

				<TouchableOpacity
					onPress={handleSave}
					className={`w-full py-4 rounded-xl mt-4 ${!duration ? 'bg-muted' : isEditing ? 'bg-blue-600' : 'bg-destructive'}`}
					disabled={!duration}
				>
					<Text className="text-white text-center font-bold text-lg">{isEditing ? 'Update Session' : 'Confess Debt'}</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
