import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import { SafeAreaView as SafeArea } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '../theme/theme';

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

  // círculo SVG
  const size = 220;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <SafeArea style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Focus</Text>
        <View style={styles.roundsBadge}>
          <Text style={styles.roundsText}>{rounds} rounds</Text>
        </View>
      </View>

      {/* Mode selector */}
      <View style={styles.modeRow}>
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
      </View>

      {/* Timer circle */}
      <View style={styles.timerContainer}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {/* SVG via View trick — usando bordas */}
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
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.75}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: color }]}
          onPress={() => setRunning(r => !r)}
          activeOpacity={0.8}
        >
          <Text style={styles.playBtnText}>{running ? 'Pause' : seconds === 0 ? 'Done' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setRounds(0)}
          activeOpacity={0.75}
        >
          <Text style={styles.resetBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Rounds */}
      <View style={styles.dotsRow}>
        {Array.from({ length: Math.min(rounds, 8) }).map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: Colors.crimson }]} />
        ))}
        {Array.from({ length: Math.max(0, 4 - rounds % 4) % 4 }).map((_, i) => (
          <View key={`e${i}`} style={[styles.dot, { backgroundColor: Colors.aged }]} />
        ))}
      </View>
      <Text style={styles.dotsLabel}>
        {rounds > 0 ? `${rounds} focus session${rounds > 1 ? 's' : ''} today` : 'No sessions yet'}
      </Text>

    </SafeArea>
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