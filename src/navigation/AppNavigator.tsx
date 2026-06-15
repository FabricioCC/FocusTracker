import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Colors, Fonts } from '../theme/theme';

import BacklogScreen from '../screens/BacklogScreen';
import PomodoroScreen from '../screens/PomodoroScreen';
import NotesScreen from '../screens/NotesScreen';
import TasksScreen from '../screens/TasksScreen';
import RemindersScreen from '../screens/RemindersScreen';
import EditItemScreen from '../screens/EditItemScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddReminderScreen from '../screens/AddReminderScreen';

export type RootStackParamList = {
  Tabs: undefined;
  AddItem: undefined;
  AddReminder: undefined;
  ItemDetail: { itemId: string };
  EditItem: { itemId: string };
};

export type TabParamList = {
  Backlog: undefined;
  Focus: undefined;
  Notes: undefined;
  Tasks: undefined;
  Reminders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Backlog: 'list-outline',
  Focus: 'timer-outline',
  Notes: 'document-text-outline',
  Tasks: 'checkmark-square-outline',
  Reminders: 'alarm-outline',
};

// Animated tab icon: scales up when focused
function AnimatedTabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 0.9,
      speed: 28,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveBackgroundColor: Colors.aged,
        tabBarActiveTintColor: Colors.crimson,
        tabBarInactiveTintColor: Colors.faded,
        tabBarStyle: {
          height: 100,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          marginBottom: 5,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.bodySemiBold,
          fontSize: 10,
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon name={TAB_ICONS[route.name] as any} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Backlog" component={BacklogScreen} />
      <Tab.Screen name="Focus" component={PomodoroScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Reminders" component={RemindersScreen} />
    </Tab.Navigator>
  );
}

type Props = {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;
};

export default function AppNavigator({ navigationRef }: Props) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'New Item', presentation: 'modal' }} />
        <Stack.Screen name="AddReminder" component={AddReminderScreen} options={{ title: 'New Reminder', presentation: 'modal' }} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Detail' }} />
        <Stack.Screen name="EditItem" component={EditItemScreen} options={{ title: 'Edit Item', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}