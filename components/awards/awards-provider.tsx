import { BadgeDefinition, BADGES, checkForNewAwards, getUnseenAwards, markAwardSeen } from '@/lib/awards';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Modal, Text, useColorScheme, View } from 'react-native';
import Button from '../ui/button';

interface AwardsContextType {
  checkAwards: () => Promise<void>;
}

const AwardsContext = createContext<AwardsContextType | null>(null);

export function useAwards() {
  const context = useContext(AwardsContext);
  if (!context) {
    throw new Error('useAwards must be used within an AwardsProvider');
  }
  return context;
}

export function AwardsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);
  const [currentAward, setCurrentAward] = useState<BadgeDefinition | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const processingRef = useRef(false);

  const checkAwards = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      // 1. Run logic to unlock new ones
      await checkForNewAwards();
      
      // 2. Sync with DB: Get all unseen awards (this catches any that were missed due to UI glitches)
      const unseenAwards = await getUnseenAwards();
      
      if (unseenAwards.length > 0) {
        // Small delay to ensure state updates don't conflict with other navigations
        setTimeout(() => {
          setQueue(prev => {
             // We want the queue to reflect the DB state, but exclude the one currently showing
             // to avoid re-triggering it or causing loop if logic is weird.
             // If we are showing an award, it is still 'unseen' in DB until closed.
             if (currentAward) {
                return unseenAwards.filter(u => u.id !== currentAward.id);
             }
             return unseenAwards;
          });
        }, 100);
      }
    } catch (e) {
      console.error("Failed to check awards", e);
    } finally {
      processingRef.current = false;
    }
  }, [currentAward]);

  useEffect(() => {
    if (!modalVisible && queue.length > 0) {
      setCurrentAward(queue[0]);
      setModalVisible(true);
    }
  }, [queue, modalVisible]);

  useEffect(() => {
    // Check on mount
    checkAwards();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAwards();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAwards]);

  const handleClose = async () => {
    if (currentAward) {
      await markAwardSeen(currentAward.id);
      setQueue(prev => prev.slice(1));
      setModalVisible(false);
      setCurrentAward(null);
    }
  };

  return (
    <AwardsContext.Provider value={{ checkAwards }}>
      {children}
      
      {currentAward && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleClose}
          supportedOrientations={['portrait', 'landscape']}
          statusBarTranslucent={true}
        >
          <View className="flex-1 justify-center items-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <View className="w-full p-6 items-center">
              
              {/* Confetti / Celebration Header could go here */}
              <Text className="text-3xl font-black text-white mb-2 text-center tracking-tight">
                {t('awards.congratulations')}
              </Text>
              
              <Text className="text-foreground text-lg text-center mb-6">
                {t('awards.unlocked_message')}
              </Text>

              {/* Badge Icon Logic */}
              {(() => {
                 let level = 0;
                 if (currentAward.group) {
                    const groupBadges = BADGES.filter(b => b.group === currentAward.group);
                    level = groupBadges.findIndex(b => b.id === currentAward.id);
                 }

                 let containerStyle: any = {};
                 let innerStyle: any = {};
                 let shapeClass = "rounded-full"; // Default Level 0

                 if (level === 1) {
                   shapeClass = "rounded-3xl";
                 } else if (level === 2) {
                   // Diamond: Rotate 45deg
                   shapeClass = "rounded-2xl"; 
                   containerStyle = { transform: [{ rotate: "45deg" }, { scale: 0.8 }] };
                   innerStyle = { transform: [{ rotate: "-45deg" }] };
                 }

                 return (
                  <View 
                    className={`w-32 h-32 ${shapeClass} items-center justify-center mb-6 border-4`}
                    style={[{
                      backgroundColor: colorScheme === 'dark' ? currentAward.color.dark : currentAward.color.light,
                      borderColor: colorScheme === 'dark' ? '#ffffff20' : '#00000010',
                      shadowColor: currentAward.color.light,
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.5,
                      shadowRadius: 20,
                      elevation: 10
                    }, containerStyle]}
                  >
                    <View style={innerStyle}>
                      <Ionicons 
                        name={currentAward.icon as any} 
                        size={64} 
                        color="white" 
                      />
                    </View>
                  </View>
                 );
              })()}

              <Text className="text-2xl font-bold text-white text-center mb-2">
                {t(currentAward.titleKey)}
              </Text>
              
              <Text className="text-base text-gray-300 text-center mb-8 leading-6 px-4">
                {t(currentAward.descKey)}
              </Text>

              <Button 
                className="w-full rounded-2xl" 
                size="lg" 
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  handleClose()
                }}
                variant='outline'
              >
                <Text className="font-bold text-lg mx-auto text-foreground">
                  {t('awards.close')}
                </Text>
              </Button>

            </View>
          </View>
        </Modal>
      )}
    </AwardsContext.Provider>
  );
}
