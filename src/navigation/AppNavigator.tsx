import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import BacklogScreen from '../screens/BacklogScreen';
import ActiveScreen from '../screens/ActiveScreen';
import RemindersScreen from '../screens/RemidersScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  AddItem: undefined;
  ItemDetail: { itemId: string };
};

export type TabParamList = {
  Backlog: undefined;
  Active: undefined;
  Reminders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { height: 80 },
        tabBarItemStyle: { paddingBottom: 20 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Backlog: 'list-outline',
            Active: 'play-circle-outline',
            Reminders: 'alarm-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Backlog" component={BacklogScreen} />
      <Tab.Screen name="Active" component={ActiveScreen} />
      <Tab.Screen name="Reminders" component={RemindersScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'New Item', presentation: 'modal' }} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Detail' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}