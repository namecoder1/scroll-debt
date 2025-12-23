import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useTour } from '../../lib/tour/TourContext';
import Button from '../ui/button';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Padding around the highlighted element
const PADDING = 10;
const RADIUS = 12;

export function TourOverlay() {
  const { t } = useTranslation();
  const { isOpen, steps, activeStep, targets, nextStep, stopTour, remeasureTarget } = useTour();

  // Shared values for the spotlight position/size
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const currentStep = steps[activeStep];
  const currentTarget = currentStep ? targets[currentStep.id] : null;

  useEffect(() => {
    if (isOpen && currentStep) {
        // Force a fresh measure whenever we switch steps.
        // This fixes issues where the target was measured before Safe Area insets were applied (e.g. y=0 instead of y=60)
        remeasureTarget(currentStep.id);
    }
  }, [isOpen, currentStep, remeasureTarget]);

  useEffect(() => {
    if (isOpen && currentTarget) {
      // Animate to new target
      const offsetX = currentStep.xOffset || 0;
      const offsetY = currentStep.yOffset || 0;
      
      x.value = withTiming(currentTarget.pageX - PADDING + offsetX, { duration: 400, easing: Easing.out(Easing.exp) });
      y.value = withTiming(currentTarget.pageY - PADDING + offsetY, { duration: 400, easing: Easing.out(Easing.exp) });
      width.value = withTiming(currentTarget.width + PADDING * 2, { duration: 400, easing: Easing.out(Easing.exp) });
      height.value = withTiming(currentTarget.height + PADDING * 2, { duration: 400, easing: Easing.out(Easing.exp) });
      opacity.value = withTiming(1, { duration: 300 });
    } else if (!isOpen) {
      opacity.value = withTiming(0);
    }
  }, [isOpen, currentTarget, currentStep, x, y, width, height, opacity]);

  /* 
   * Calculate Mask Props (Position + Shape)
   */
  const maskProps = useAnimatedProps(() => {
    const isCircle = currentStep?.shape === 'circle';
    const r = isCircle ? Math.max(width.value, height.value) / 2 : RADIUS;
    return {
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value,
      rx: r,
      ry: r,
    };
  });

  if (!isOpen || !currentStep) return null;

  // Determine Tooltip Position (Top or Bottom of the target)
  const isBottomHalf = currentTarget ? currentTarget.pageY > SCREEN_HEIGHT / 2 : false;
  const offsetY = currentStep.yOffset || 0;
  
  const placement = currentStep.placement || (isBottomHalf ? 'top' : 'bottom');

  const tooltipTop = placement === 'top'
    ? (currentTarget?.pageY ?? 0) + offsetY - 200 // Show above
    : (currentTarget?.pageY ?? 0) + offsetY + (currentTarget?.height ?? 0) + 20; // Show below

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="box-none">
      {/* SVG Overlay Mask */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none"> 
         {/* pointerEvents="none" usually lets touches pass through, but we want to BLOCK touches 
             Except we can't easily block only the "outside" with standard Views in RN without covering everything.
             The Svg itself is just visual. We usually need a full touchable wrapper to block interactions.
         */}
      </View>
      
      {/* 
         We need a blocker for the whole screen that allows specific touches.
         For this simple version, we block EVERYTHING and user must click Next/Skip.
      */}
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={nextStep}>
         <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="mask">
              {/* White fills everything (opaque) */}
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black creates the hole (transparent) */}
              <AnimatedRect animatedProps={maskProps} fill="black" />
            </Mask>
          </Defs>
          {/* The dark overlay using the mask */}
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#mask)"
          />
        </Svg>
      </TouchableOpacity>

      {/* Tooltip Content */}
      <Animated.View 
        entering={FadeIn.delay(200)}
        exiting={FadeOut}
        style={[
          styles.tooltip, 
          { 
            top: tooltipTop,
            left: 20,
            right: 20,
          }
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.card} className='bg-card border p-4 rounded-3xl'>
            <View style={styles.header}>
                <Text className='text-foreground text-xl tracking-tight font-semibold flex-1'>{currentStep.title}</Text>
                <Text className='text-muted-foreground text-sm font-medium'>
                  {activeStep + 1}/{steps.length}
                </Text>
            </View>
            <Text className='text-muted-foreground text-base tracking-tight font-normal'>{currentStep.description}</Text>
            
            <View className='mt-4 flex-row items-center justify-between'>
                <Button 
                  variant='outline'
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                    stopTour();
                  }} 
                  size='lg'
                >
                    <Text className='dark:text-white text-black font-semibold'>{t('tour.skip')}</Text>
                </Button>
                <Button 
                  size='lg'
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
                    if (currentStep.action) {
                      currentStep.action();
                    }
                    nextStep();
                  }}
                >
                    <Text className='text-white dark:text-black font-semibold'>
                        {currentStep.nextLabel || (activeStep === steps.length - 1 ? t('tour.finish') : t('tour.next'))}
                    </Text>
                </Button>
            </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
  },
  card: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFE',
  },
  description: {
    fontSize: 16,
    color: '#94A1B2', // Muted
    marginBottom: 20,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    color: '#94A1B2',
    fontSize: 14,
    fontWeight: '600',
    padding: 8
  },
  nextButton: {
    backgroundColor: '#7F5AF0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 99,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
