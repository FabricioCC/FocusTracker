import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/theme';
import { RootStackParamList } from './src/navigation/AppNavigator';
import { getReminders } from './src/storage/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function syncScheduledNotifications() {
  try {
    const reminders = await getReminders();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const validPrefixes = new Set(
      reminders.filter(r => r.enabled).map(r => r.id)
    );

    const toCancel = scheduled.filter(n => {
      const prefix = n.identifier.split('_')[0];
      if (n.identifier.startsWith('abandon_')) return true; 
      return !validPrefixes.has(prefix);
    });

    await Promise.all(
      toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    if (toCancel.length > 0) {
      console.log(`[Notifications] Canceladas ${toCancel.length} notificação(ões) órfã(s).`);
    }
  } catch (e) {
    console.warn('[Notifications] Erro ao sincronizar notificações:', e);
  }
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Limpa notificações órfãs ao iniciar o app
    syncScheduledNotifications();

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.itemId && navigationRef.current) {
        navigationRef.current.navigate('ItemDetail', { itemId: data.itemId });
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.base }}>
        <AppNavigator navigationRef={navigationRef} />
      </View>
    </SafeAreaProvider>
  );
}