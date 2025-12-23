import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { LayoutRectangle } from 'react-native';

export type TourStep = {
  id: string; // The target ID to highlight
  title: string;
  description: string;
  action?: () => void; // Function to run before next step (e.g. navigation)
  nextLabel?: string; // Custom label for the button
  shape?: 'circle' | 'rectangle'; // Shape of the highlight
  xOffset?: number;
  yOffset?: number;
  placement?: 'top' | 'bottom';
};

type TargetLayout = LayoutRectangle & { pageX: number; pageY: number };

interface TourContextType {
  activeStep: number;
  isOpen: boolean;
  steps: TourStep[];
  targets: Record<string, TargetLayout>;
  registerTarget: (id: string, layout: TargetLayout) => void;
  unregisterTarget: (id: string) => void;
  registerMeasurer: (id: string, measureFn: () => void) => void;
  remeasureTarget: (id: string) => void;
  startTour: (steps: TourStep[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetLayout>>({});
  
  // Store measure functions in a ref so they don't trigger re-renders
  const measurers = React.useRef<Record<string, () => void>>({});

  const registerTarget = useCallback((id: string, layout: TargetLayout) => {
    // Only update if layout actually changed to prevent render loops
    setTargets((prev) => {
      const current = prev[id];
      if (
        current && 
        current.x === layout.x && 
        current.y === layout.y && 
        current.width === layout.width && 
        current.height === layout.height && 
        current.pageX === layout.pageX && 
        current.pageY === layout.pageY
      ) {
        return prev;
      }
      return { ...prev, [id]: layout };
    });
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    setTargets((prev) => {
      const newTargets = { ...prev };
      delete newTargets[id];
      return newTargets;
    });
    delete measurers.current[id];
  }, []);

  const registerMeasurer = useCallback((id: string, measureFn: () => void) => {
    measurers.current[id] = measureFn;
  }, []);

  const remeasureTarget = useCallback((id: string) => {
    if (measurers.current[id]) {
      measurers.current[id]();
    }
  }, []);

  const startTour = useCallback((newSteps: TourStep[]) => {
    if (newSteps.length === 0) return;
    setSteps(newSteps);
    setActiveStep(0);
    setIsOpen(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsOpen(false);
    setSteps([]);
    setActiveStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      stopTour();
    }
  }, [activeStep, steps.length, stopTour]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  }, [activeStep]);

  return (
    <TourContext.Provider
      value={{
        activeStep,
        isOpen,
        steps,
        targets,
        registerTarget,
        unregisterTarget,
        registerMeasurer,
        remeasureTarget,
        startTour,
        stopTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
