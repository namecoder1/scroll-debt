import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface SessionItemProps {
  session: any;
  onDelete: () => void;
}

export default function SessionItem({ session, onDelete }: SessionItemProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Determines if we should remove rounding
  // If left is open (Edit), remove Left rounding
  // If right is open (Delete), remove Right rounding
  // We use onSwipeableWillOpen to detect commitment, but for "during scroll" 
  // we might need to rely on the fact that the user is interacting.
  // However, without Reanimated, exact "during drag" rounding change is hard.
  // Let's rely on the state of "opening".

  return (
    <View className="mb-3">
      <Swipeable
        renderRightActions={(progress, dragX) => {
          const opacity = progress.interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
          });
          return (
            <TouchableOpacity
              className="w-20 h-full"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete()
              }}
            >
              <Animated.View className="bg-destructive w-full h-full justify-center items-center rounded-r-3xl" style={{ opacity }}>
                <Ionicons name="trash-outline" size={24} color="white" />
              </Animated.View>
            </TouchableOpacity>
          );
        }}
        renderLeftActions={(progress, dragX) => {
          const opacity = progress.interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
          });
          return (
            <TouchableOpacity
              className="w-20 h-full"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/add-session',
                  params: {
                    id: session.id,
                    duration: session.duration,
                    appName: session.app_name,
                    context: session.context
                  }
                });
              }}
            >
              <Animated.View className="bg-blue-600 w-full h-full justify-center items-center rounded-l-3xl" style={{ opacity }}>
                <Ionicons name="create" size={24} color="white" />
              </Animated.View>
            </TouchableOpacity>
          );
        }}
        onSwipeableWillOpen={(direction) => {
          if (direction === 'left') setLeftOpen(true);
          if (direction === 'right') setRightOpen(true);
        }}
        onSwipeableWillClose={() => {
          setLeftOpen(false);
          setRightOpen(false);
        }}
      >
        <View
          className={`flex-row justify-between items-center bg-card p-4 border border-border 
                    ${leftOpen ? 'rounded-l-none' : 'rounded-l-3xl'} 
                    ${rightOpen ? 'rounded-r-none' : 'rounded-r-3xl'}`}
        >
          <View>
            <Text className="text-foreground font-semibold">{session.app_name || 'Unknown App'}</Text>
            {session.context && (
              <Text className="text-xs text-foreground bg-muted self-start px-2 py-0.5 rounded-md overflow-hidden mt-1">
                {t('analytics.contexts.' + session.context, { defaultValue: session.context })}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className="text-foreground font-bold text-lg">+{session.duration}m</Text>
            <Text className="text-muted-foreground text-[10px]">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
      </Swipeable>
    </View>
  );
}
