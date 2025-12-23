import { BasicCalendar } from '@/components/calendars/basic-list';
import LegendItem from '@/components/ui/legend-item';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const CalendarPage = () => {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const { t } = useTranslation()
  
  return (
    <View className="flex-1 bg-background">
      <View className='border-b border-border pb-4'>
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                router.back()}
              } 
              className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-black text-foreground">{t('home.calendar_view')}</Text>
              <Text className="text-muted-foreground text-sm">{t('home.calendar_view')}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-center flex-wrap gap-3 pt-4 px-6 border-t border-border">
          <LegendItem color="#22c55e" label="< 25%" />
          <LegendItem color="#eab308" label="25% - 50%" />
          <LegendItem color="#ef4444" label="50% - 100%" />
          <LegendItem color="#a855f7" label="> 100%" />
        </View>
      </View>

      <BasicCalendar />
    </View>
  )
}



export default CalendarPage