import { Stack } from 'expo-router';

export default function OnboardingLayout() {
	return (
		<Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
			<Stack.Screen name="index" />
			<Stack.Screen name="apps" />
			<Stack.Screen name="hobbies" />
			<Stack.Screen name="budget" />
		</Stack>
	);
}
