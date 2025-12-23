import AnalyticsView from '@/components/analytics/AnalyticsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const { t } = useTranslation();
  const [tab, setTab] = React.useState('month');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="p-4 border-b border-border/40 flex-row items-center justify-between">
        <View>
          <Text className="text-foreground font-black text-3xl">{t('analytics.title')}</Text>
          <Text className="text-muted-foreground text-base font-medium">{t('analytics.lifetime_statistics')}</Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-3 bg-primary rounded-full"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/share')
            }}
          >
            <Ionicons name="share-outline" size={22} color={colorScheme === 'dark' ? '#333' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-3 bg-primary rounded-full"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings')
            }}
          >
            <Ionicons name="settings-outline" size={22} color={colorScheme === 'dark' ? '#333' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      <Tabs value={tab} onValueChange={setTab} className='flex-1 relative'>
         {/* Tabs List Absolute on Top */}
        <View className="mx-4 absolute top-4 mb-2 z-20">
            <TabsList className='w-full'>
              <TabsTrigger onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
              }} value="month" className='w-1/2'><Text>{t('analytics.this_month', { defaultValue: 'This Month' })}</Text></TabsTrigger>
              <TabsTrigger onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
              }} value="week" className='w-1/2'><Text>{t('analytics.this_week')}</Text></TabsTrigger>
            </TabsList>
        </View>

        {/* Content Area with MaskedView for Top Fade */}
        <View className="flex-1">
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                locations={[0, 0.2, 0.8, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <BlurView
              intensity={100}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          <View className="flex-1 bg-background x">
            <TabsContent value="month" className='flex-1'>
              <AnalyticsView period="month" />
            </TabsContent>
            <TabsContent value="week" className='flex-1'>
              <AnalyticsView period="week" />
            </TabsContent>
          </View>
          </MaskedView>
        </View>
      </Tabs>
    </SafeAreaView>
  );
}
