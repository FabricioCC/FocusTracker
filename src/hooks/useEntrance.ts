import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Fade + slide-up entrance animation.
 * @param delay optional delay in ms before the animation starts
 */
export function useEntrance(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 16,
        bounciness: 4,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

/**
 * Simple fade-in only.
 */
export function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
}

/**
 * Animated value that goes 0 → 1 based on a target value (for progress bars).
 * @param toValue the target value (0–1)
 * @param delay optional delay in ms
 */
export function useProgressBar(toValue: number, delay = 0) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue,
      speed: 8,
      bounciness: 2,
      delay,
      useNativeDriver: false, // width is not supported by native driver
    }).start();
  }, [toValue]);

  return progress;
}

/**
 * Scale pulse: 1 → 1.08 → 1, useful for highlighting state changes.
 * Returns an Animated.Value you can use for `transform: [{ scale }]`.
 */
export function usePulse(trigger: boolean) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, speed: 30, bounciness: 8, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return scale;
}

/**
 * Press scale: slightly shrinks on press, bounces back on release.
 * Usage: wrap the pressable in <Animated.View style={{ transform: [{ scale }] }}>
 * and pass onPressIn / onPressOut to the touchable.
 */
export function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, { toValue: to, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  }

  function onPressOut() {
    Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }).start();
  }

  return { scale, onPressIn, onPressOut };
}
