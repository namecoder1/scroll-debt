import { addRescueSession } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [isActive, setIsActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  
  const totalTime = 10 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setCompleted(true);
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleFinish = async () => {
    await addRescueSession(10);
  };

  const handleClose = () => {
    router.back();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
      {!completed ? (
        <>
          <View className="mb-10 items-center">
             <View className="bg-red-500/20 p-6 rounded-full mb-6">
                <Ionicons name="medkit" size={64} color="#ef4444" />
             </View>
             <Text className="text-foreground font-black text-3xl mb-2 text-center">{t('rescue.title')}</Text>
             <Text className="text-muted-foreground text-center text-lg">{t('rescue.subtitle')}</Text>
          </View>

          <View className="mb-12 items-center">
            <Text className="text-8xl font-black text-foreground tabular-nums tracking-tighter">
              {formatTimer(timeLeft)}
            </Text>
            <Text className="text-muted-foreground text-sm font-medium mt-4 text-center px-8">
              {t('rescue.timer_desc')}
            </Text>
          </View>

          <TouchableOpacity 
            className="py-4 px-8 rounded-full bg-secondary"
            onPress={handleClose}
          >
            <Text className="text-muted-foreground font-bold">{t('rescue.give_up')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="mb-8 items-center">
             <View className="bg-green-500/20 p-6 rounded-full mb-6">
                <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
             </View>
             <Text className="text-foreground font-black text-3xl mb-2 text-center">{t('rescue.success_title')}</Text>
             <Text className="text-muted-foreground text-center text-lg px-4">
                 {t('rescue.success_subtitle', { minutes: 10 })}
             </Text>
          </View>
          
          <TouchableOpacity 
            className="w-full py-4 rounded-3xl bg-primary items-center"
            onPress={handleClose}
          >
            <Text className="text-primary-foreground font-bold text-lg">{t('rescue.close')}</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
