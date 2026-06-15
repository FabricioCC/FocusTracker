import { View, Text } from 'react-native';
import { Colors, Fonts } from '../theme/theme';

export default function PomodoroScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.base, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.heading, color: Colors.ink }}>Focus</Text>
    </View>
  );
}