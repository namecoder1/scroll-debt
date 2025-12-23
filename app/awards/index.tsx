import { BADGES, checkForNewAwards, getAllUnlockedAwards } from '@/lib/awards';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';


interface Badge {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: {
    light: string;
    dark: string;
  };
  unlocked: boolean;
  unlockedAt?: number;
  group?: string;
}



export default function AwardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [singleBadges, setSingleBadges] = useState<Badge[]>([]);
  const [badgeGroups, setBadgeGroups] = useState<{ id: string; badges: Badge[] }[]>([]);

  const checkAchievements = useCallback(async () => {
    await checkForNewAwards();
    const unlockedMap = await getAllUnlockedAwards();

    const allBadges: Badge[] = BADGES.map((b) => ({
      id: b.id,
      title: t(b.titleKey),
      description: t(b.descKey),
      icon: b.icon as keyof typeof Ionicons.glyphMap,
      color: b.color,
      unlocked: unlockedMap.has(b.id),
      unlockedAt: unlockedMap.get(b.id),
      group: b.group,
    }));

    // Grouping logic
    const groups: Record<string, Badge[]> = {};
    const singles: Badge[] = [];
    const groupOrder: string[] = [];

    allBadges.forEach((badge) => {
      if (badge.group) {
        if (!groups[badge.group]) {
          groups[badge.group] = [];
          groupOrder.push(badge.group);
        }
        groups[badge.group].push(badge);
      } else {
        singles.push(badge);
      }
    });

    const groupItems = groupOrder.map((groupId) => ({
      id: groupId,
      badges: groups[groupId],
    }));

    setSingleBadges(singles);
    setBadgeGroups(groupItems);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      checkAchievements();
    }, [checkAchievements])
  );

  const screenWidth = Dimensions.get('window').width;
  // Padding 16 (p-4) => 32 total horizontal padding. 
  // Gap 16 (gap-4).
  // 2 columns.
  const itemWidth = (screenWidth - 32 - 16) / 2;

  const renderBadge = (badge: Badge, index: number, styleStr?: string, level: number = 0) => {
    const currentBadgeColor =
      colorScheme === "dark" ? badge.color.dark : badge.color.light;

    const isUnlocked = badge.unlocked;
    const baseSize = "w-28 h-28";
    
    // Level 0: Circle
    // Level 1: Rounded Square (Rare)
    // Level 2: Diamond (Epic)

    let containerStyle = {};
    let innerStyle = {};
    let shapeClass = "rounded-full"; // Default Level 0

    if (level === 1) {
      shapeClass = "rounded-3xl";
    } else if (level === 2) {
      // Diamond: Rotate 45deg
      shapeClass = "rounded-2xl"; // Slightly sharper corners for the diamond
      containerStyle = { transform: [{ rotate: "45deg" }, { scale: 0.8 }] };
      innerStyle = { transform: [{ rotate: "-45deg" }] };
    }

    return (
      <View
        key={badge.id}
        style={{ width: itemWidth }}
        className={`items-center justify-center p-2 mt-3.5 mb-2 ${styleStr || ''}`}
      >
        {/* Badge Visual */}
        <View
          style={[
            {
              backgroundColor: isUnlocked
                ? currentBadgeColor
                : colorScheme === "dark"
                ? "#2a2b27"
                : "#fcfcfb",
              borderColor: isUnlocked
                ? currentBadgeColor
                : colorScheme === "dark"
                ? "#3f403c"
                : "#f6f6f4",
              shadowColor: isUnlocked ? currentBadgeColor : "transparent",
              shadowOpacity: isUnlocked ? 0.5 : 0,
              shadowRadius: 12,
              elevation: isUnlocked ? 8 : 0,
            },
            containerStyle
          ]}
          className={`${baseSize} ${shapeClass} border-4 items-center justify-center mb-3 ${
            !isUnlocked && "opacity-70"
          }`}
        >
          <View style={innerStyle}>
            <Ionicons
              name={badge.icon}
              size={40}
              color={
                isUnlocked
                  ? "#fff"
                  : colorScheme === "dark"
                  ? "#666"
                  : "#94a3b8"
              }
            />
          </View>
        </View>

        <Text className="text-foreground font-bold text-center mb-1">
          {badge.title} 
        </Text>
        <Text className="text-muted-foreground text-xs text-center leading-4">
          {badge.description}
        </Text>
        {badge.unlocked && badge.unlockedAt && (
          <Text className="text-foreground text-center mt-1 opacity-60">
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center p-6 pb-6 border-b border-border/40">
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            router.back();
          }}
          className="mr-4"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-foreground">
          {t("awards.title")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Single Badges Grid */}
        <View className="flex-row flex-wrap items-start justify-start gap-4 mb-8">
          {singleBadges.map((badge, i) => renderBadge(badge, i, undefined, 0))}
        </View>

        {/* Badge Groups */}
        {badgeGroups.map((group) => (
          <View key={group.id} className="w-full mb-8">
            <Text className="text-xl font-bold text-foreground mb-4 ml-2">
              {t(`awards.groups.${group.id}`)}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {group.badges.map((badge, i) => (
                <View key={badge.id} className={i === 0 ? '' : 'ml-4'}>
                  {renderBadge(badge, i, undefined, i)}
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
