import React, { useRef } from 'react';
import { View, ViewProps } from 'react-native';
import { useTour } from '../../lib/tour/TourContext';

interface TourTargetProps extends ViewProps {
  id: string;
}

export function TourTarget({ id, children, style, ...props }: TourTargetProps) {
  const { registerTarget, unregisterTarget, registerMeasurer } = useTour();
  const viewRef = useRef<View>(null);

  // We use standard onLayout for width/height/x/y relative to parent
  // But we need global coordinates. standard View onLayout gives relative.
  // We can use measure() on the ref.
  
  const measureNode = React.useCallback(() => {
     viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerTarget(id, { x, y, width, height, pageX, pageY });
    });
  }, [id, registerTarget]);

  const handleLayout = () => {
    measureNode();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    registerMeasurer(id, measureNode);
    return () => {
      unregisterTarget(id);
    };
  }, [id, unregisterTarget, registerMeasurer, measureNode]);

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout} // trigger measure when layout changes
      collapsable={false} // Ensure view exists for measure
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
