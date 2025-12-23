import { addRescueSession, getSetting, getTodayScrollMinutes } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DURATION_SECONDS = 10 * 60; // 10 minutes

export default function RescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10 * 60); // Default visual fallback
  const [isActive, setIsActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [recoveredMinutes, setRecoveredMinutes] = useState(0); // Track actual recovered
  
  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  const STORAGE_KEY = 'rescue_session_target';
  // const STORAGE_KEY = 'rescue_session_target'; // It seems STORAGE_KEY is inside too, but used repeatedly.
  // We can leave them if they are consts. But DURATION_SECONDS is primitive const.
  // Actually, easiest is to just add it to deps OR move it out.
  // Moving out is cleaner.
  
  // Note: I will replace the component start to move them out.
  // But wait, DURATION_SECONDS being inside component is fine if I add it to deps.
  // BUT wrapping a const in usage deps is annoying.
  // I'll just add it to deps. It's safe.
  
  // Actually, I can't move them out easily in multi_replace.
  // So I will just add them to deps.
  
  // Wait, the lint said: 'React Hook useCallback has a missing dependency: 'DURATION_SECONDS'.'
  // I will add DURATION_SECONDS to deps.

  const handleDynamicPayback = useCallback(async () => {
    try {
       const totalScroll = await getTodayScrollMinutes();
       const budgetStr = await getSetting('daily_scroll_budget');
       const budget = budgetStr ? parseInt(budgetStr, 10) : 60;
       const debt = totalScroll - budget;
       
       let amountToRecover = 0;
       if (debt > 0) {
          amountToRecover = debt;
       } else {
          amountToRecover = debt > 0 ? debt : 0; 
       }
       
       if (amountToRecover <= 0) {
           amountToRecover = Math.ceil(DURATION_SECONDS / 60); 
           if (amountToRecover < 1) amountToRecover = 1; 
       }

       setRecoveredMinutes(amountToRecover);
       await addRescueSession(amountToRecover);

    } catch (e) {
       console.error("Payback error", e);
    }
  }, []);

  const finishSession = useCallback(async () => {
    setIsActive(false);
    if (completed) return; 
    setCompleted(true);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await handleDynamicPayback();
    } catch (e) {
      console.error("Error finishing session", e);
    }
  }, [completed, handleDynamicPayback]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // Coming to Foreground: Resync timer
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      const storedTarget = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTarget) {
        const targetTime = parseInt(storedTarget, 10);
        const now = Date.now();
        const remaining = Math.ceil((targetTime - now) / 1000);

        if (remaining > 0) {
           setTimeLeft(remaining);
        } else {
           setTimeLeft(0);
           if (!completed) finishSession();
        }
      }
    }
    appState.current = nextAppState;
  }, [completed, finishSession]);

  const initializeSession = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const storedTarget = await AsyncStorage.getItem(STORAGE_KEY);
      const now = Date.now();

      if (storedTarget) {
        // Resume existing
        const targetTime = parseInt(storedTarget, 10);
        const remaining = Math.ceil((targetTime - now) / 1000);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setIsActive(true);
        } else {
          setTimeLeft(0);
          finishSession(); 
        }
      } else {
        // Start new

        const targetTime = now + DURATION_SECONDS * 1000;
        await AsyncStorage.setItem(STORAGE_KEY, targetTime.toString());
        
        setTimeLeft(DURATION_SECONDS);
        setIsActive(true);
      }
    } catch (e) {
      console.error("Failed to init session", e);
    }
  }, [finishSession]);

  const handleClose = async () => {
    if (!completed) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    router.back();
  };

  useEffect(() => {
    initializeSession();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [initializeSession, handleAppStateChange]);

  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             clearInterval(interval);
             finishSession();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } 
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, finishSession]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
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
            className="py-4 px-8 rounded-full bg-primary"
            onPress={handleClose}
          >
            <Text className="text-white dark:text-black font-bold">{t('rescue.give_up')}</Text>
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
                 {t('rescue.success_subtitle', { minutes: recoveredMinutes })}
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
