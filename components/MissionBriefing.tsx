import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface MissionBriefingProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onAlreadyDone: () => void;
  mission: {
    name: string;
    category: string;
    flavor: {
      titleKey: string;
      descriptionKey: string;
    };
    duration: number;
    color: string;
    icon: any;
  } | null;
}

export default function MissionBriefing({ visible, onClose, onAccept, onAlreadyDone, mission }: MissionBriefingProps) {
  const { t } = useTranslation();

  if (!mission) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/80 px-6">
        <View className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-border shadow-2xl">
          {/* Header Badge */}
          <View className="items-center -mt-12 mb-4">
             <View className={`p-4 rounded-full border-4 border-card`} style={{ backgroundColor: mission.color }}>
                <Ionicons name={mission.icon} size={40} color="white" />
             </View>
             <View className="bg-secondary px-3 py-1 rounded-full mt-2 border border-border">
                <Text className="text-xs font-bold uppercase text-foreground tracking-widest">{t('home.mission_briefing')}</Text>
             </View>
          </View>

          {/* Content */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-black text-center text-foreground mb-2 leading-tight">
               {t(mission.flavor.titleKey)}
            </Text>
            
            <Text className="text-center text-muted-foreground font-medium text-base mb-6 px-4">
               {t(mission.flavor.descriptionKey)}
            </Text>

            {/* Stats */}
            <View className="flex-row gap-4">
                <View className="bg-secondary/50 p-3 rounded-2xl items-center min-w-[100px]">
                    <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">{t('missions.target')}</Text>
                    <Text className="text-lg font-black text-foreground">{mission.name}</Text>
                </View>
                <View className="bg-green-500/10 p-3 rounded-2xl items-center min-w-[100px]">
                    <Text className="text-xs font-bold text-green-600 uppercase mb-1">{t('missions.reward')}</Text>
                    <Text className="text-lg font-black text-green-600">-{mission.duration}m</Text>
                </View>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 w-full">
            <TouchableOpacity 
                className="bg-primary w-full py-4 rounded-2xl items-center shadow-sm"
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAccept();
                }}
            >
                <Text className="text-primary-foreground font-bold text-lg">{t('home.accept_mission')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                className="bg-secondary w-full py-4 rounded-2xl items-center"
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAlreadyDone();
                }}
            >
                <Text className="text-muted-foreground font-semibold">{t('home.already_completed')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                className="py-2 items-center"
                onPress={onClose}
            >
                <Text className="text-muted-foreground/50 text-sm font-medium">{t('home.dismiss')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
