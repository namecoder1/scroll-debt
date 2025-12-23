import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';


export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as any),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.error('Notification permissions not granted');
    return;
  }

  await scheduleDailyReminders();
}

async function scheduleDailyReminders() {
  // Cancel all existing notifications to avoid duplicates on every app start
  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminderTitle = "You need to log your scroll time";
  const reminderBody = "Don't forget to track your scrolling sessions!";

  // Schedule for 12:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle,
      body: reminderBody,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY, // Added type
      hour: 12,
      minute: 0,
    },
  });

  // Schedule for 18:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle,
      body: reminderBody,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY, // Added type
      hour: 18,
      minute: 0,
    },
  });
}
