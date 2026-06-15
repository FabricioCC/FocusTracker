import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '../theme/theme';
import { useEntrance, usePressScale } from '../hooks/useEntrance';

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: Colors.crimson },
  short: { label: 'Short Break', duration: 5 * 60, color: Colors.forest },
  long:  { label: 'Long Break', duration: 15 * 60, color: Colors.oak },
};

type Mode = keyof typeof MODES;

export default function PomodoroScreen() {
  const [mode, setMode] = useState<Mode>('focus');
  const [seconds, setSeconds] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance animations
  const { opacity: headerOpacity, translateY: headerY } = useEntrance(0);
  const { opacity: modeOpacity, translateY: modeY } = useEntrance(80);
  const { opacity: timerOpacity, translateY: timerY } = useEntrance(160);
  const { opacity: controlsOpacity, translateY: controlsY } = useEntrance(240);

  // Timer circle pulse when running
  const circleScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Play button press scale
  const { scale: playScale, onPressIn: playPressIn, onPressOut: playPressOut } = usePressScale(0.93);

  useEffect(() => {
    if (running) {
      // Subtle breathing pulse when timer is running
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(circleScale, { toValue: 1.015, duration: 1800, useNativeDriver: true }),
          Animated.timing(circleScale, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.spring(circleScale, { toValue: 1, speed: 20, bounciness: 4, useNativeDriver: true }).start();
    }
    return () => pulseAnim.current?.stop();
  }, [running]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === 'focus') setRounds(r => r + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  function switchMode(m: Mode) {
    setRunning(false);
    setMode(m);
    setSeconds(MODES[m].duration);
  }

  function reset() {
    setRunning(false);
    setSeconds(MODES[mode].duration);
  }

  function pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  const total = MODES[mode].duration;
  const progress = 1 - seconds / total;
  const color = MODES[mode].color;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={styles.heading}>Focus</Text>
        <View style={styles.roundsBadge}>
          <Text style={styles.roundsText}>{rounds} rounds</Text>
        </View>
      </Animated.View>

      {/* Mode selector */}
      <Animated.View style={[styles.modeRow, { opacity: modeOpacity, transform: [{ translateY: modeY }] }]}>
        {(Object.keys(MODES) as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && { backgroundColor: Colors.aged, borderColor: Colors.border }]}
            onPress={() => switchMode(m)}
            activeOpacity={0.75}
          >
            <Text style={[styles.modeBtnText, mode === m && { color: Colors.ink }]}>
              {MODES[m].label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Timer circle */}
      <Animated.View style={[styles.timerContainer, { opacity: timerOpacity, transform: [{ translateY: timerY }] }]}>
        <Animated.View style={{ transform: [{ scale: circleScale }] }}>
          <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            <View style={[styles.circleOuter, { borderColor: Colors.aged }]}>
              <View style={[styles.circleProgress, {
                borderColor: color,
                transform: [{ rotate: `${progress * 360 - 90}deg` }],
              }]} />
              <View style={styles.circleInner}>
                <Text style={styles.timerMode}>{MODES[mode].label.toUpperCase()}</Text>
                <Text style={[styles.timerTime, { color: Colors.ink }]}>
                  {pad(mins)}:{pad(secs)}
                </Text>
                <Text style={styles.timerSub}>
                  {seconds === 0 ? 'done!' : running ? 'in progress' : 'paused'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Controls */}
      <Animated.View style={[styles.controls, { opacity: controlsOpacity, transform: [{ translateY: controlsY }] }]}>
        <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.75}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: playScale }] }}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: color }]}
            onPress={() => setRunning(r => !r)}
            onPressIn={playPressIn}
            onPressOut={playPressOut}
            activeOpacity={1}
          >
            <Text style={styles.playBtnText}>{running ? 'Pause' : seconds === 0 ? 'Done' : 'Start'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setRounds(0)}
          activeOpacity={0.75}
        >
          <Text style={styles.resetBtnText}>Clear</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Rounds dots */}
      <Animated.View style={[styles.dotsRow, { opacity: controlsOpacity }]}>
        {Array.from({ length: Math.min(rounds, 8) }).map((_, i) => (
          <RoundDot key={i} filled delay={i * 40} />
        ))}
        {Array.from({ length: Math.max(0, 4 - rounds % 4) % 4 }).map((_, i) => (
          <RoundDot key={`e${i}`} filled={false} delay={0} />
        ))}
      </Animated.View>
      <Animated.Text style={[styles.dotsLabel, { opacity: controlsOpacity }]}>
        {rounds > 0 ? `${rounds} focus session${rounds > 1 ? 's' : ''} today` : 'No sessions yet'}
      </Animated.Text>
    </SafeAreaView>
  );
}

function RoundDot({ filled, delay }: { filled: boolean; delay: number }) {
  const scale = useRef(new Animated.Value(filled ? 0 : 1)).current;

  useEffect(() => {
    if (filled) {
      Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 10, delay, useNativeDriver: true }).start();
    }
  }, [filled]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: filled ? Colors.crimson : Colors.aged },
        { transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  heading: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.ink },
  roundsBadge: {
    backgroundColor: Colors.aged, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  roundsText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.sepia },
  modeRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  modeBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 0.5, borderColor: 'transparent',
  },
  modeBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.faded },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleOuter: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
  },
  circleProgress: {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, borderWidth: 8,
    borderTopColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circleInner: { alignItems: 'center', gap: 4 },
  timerMode: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.faded, letterSpacing: 1.5 },
  timerTime: { fontFamily: Fonts.heading, fontSize: 48, letterSpacing: 2 },
  timerSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.faded },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg,
  },
  playBtn: {
    borderRadius: Radius.md, paddingHorizontal: 40,
    paddingVertical: Spacing.md,
  },
  playBtnText: { fontFamily: Fonts.heading, fontSize: 15, color: Colors.surface, letterSpacing: 0.5 },
  resetBtn: {
    borderRadius: Radius.md, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, borderWidth: 0.5, borderColor: Colors.border,
  },
  resetBtnText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.faded },
  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotsLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.faded, textAlign: 'center', paddingBottom: Spacing.lg },
});
