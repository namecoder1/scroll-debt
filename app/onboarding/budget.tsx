import ProgressBar from '@/components/onboarding/progress-bar';
import Button from '@/components/ui/button';
import { setSetting } from '@/lib/db';
import { cn, formatTime } from '@/lib/utils';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BudgetSelectionScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme()
  const router = useRouter();
  const [budget, setBudget] = useState(60); // Default 60 mins

  const handleFinish = async () => {
    await setSetting('daily_scroll_budget', budget.toString());
    await setSetting('onboarding_completed', 'true');
    router.replace({ pathname: '/', params: { startTour: 'true' } });
  };

  const getBudgetLabel = (mins: number) => {
    if (mins <= 15) return t('onboarding.budget.labels.strict');
    if (mins <= 30) return t('onboarding.budget.labels.normal');
    if (mins <= 90) return t('onboarding.budget.labels.balanced');
    if (mins <= 120) return t('onboarding.budget.labels.generous');
    return t('onboarding.budget.labels.doomscroller');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className='flex-1 px-6'>
        <View className="mt-4 mb-6">
          <ProgressBar currentStep={3} totalSteps={3} />
          <Text className="text-3xl font-black tracking-tighter text-foreground">{t('onboarding.budget.title')}</Text>
          <Text className="text-muted-foreground mt-2 text-lg">{t('onboarding.budget.subtitle')}</Text>
        </View>



        <View className="items-center justify-center p-8 bg-card rounded-3xl border-2 border-border">
          <Text className="text-6xl font-black text-foreground mb-1">{budget}m</Text>
          <Text className="text-xl font-semibold text-muted-foreground mb-4">{formatTime(budget, 'long')}</Text>
          <Text className={cn("text-lg font-bold uppercase tracking-widest",
            budget <= 15 ? "text-green-500" :
              budget <= 30 ? "text-blue-500" :
                budget <= 60 ? "text-yellow-500" :
                  budget <= 120 ? "text-orange-500" : "text-red-500"
          )}>
            {getBudgetLabel(budget)}
          </Text>
        </View>

        <View className="mt-12">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={15}
            maximumValue={240}
            step={15}
            value={budget}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setBudget(value)
            }}
            minimumTrackTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
            maximumTrackTintColor={colorScheme === 'dark' ? '#d3d3d3' : '#CFD2C6'}
            thumbTintColor={colorScheme === 'dark' ? '#C9F655' : '#4D542B'}
          />
          <View className="flex-row justify-between px-2 mt-2">
            <Text className="text-muted-foreground font-medium">15m</Text>
            <Text className="text-muted-foreground font-medium">4h</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-6 left-6 right-6">
        <Button
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
            handleFinish()
          }}
          size='xl'
          className='rounded-full'
        >
          <Text className={cn(
            budget === 0 ? 'text-foreground/50' : 'text-white dark:text-black',
            'mx-auto font-semibold text-xl'
          )}>{t('onboarding.budget.finish')}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
