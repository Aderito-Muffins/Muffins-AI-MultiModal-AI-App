import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Chat, Settings } from "./screens";
import { Header } from "./components";
import FeatherIcon from "@expo/vector-icons/Feather";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemeContext } from "./context";
import {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

const Tab = createBottomTabNavigator();

function MainComponent() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles({ theme, insets });

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.tabBarActiveTintColor,
          tabBarInactiveTintColor: theme.tabBarInactiveTintColor,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: theme.backgroundColor,
            elevation: 5, // Sombra para o Tab Bar
            paddingBottom: insets.bottom,
          },
        }}
      >
        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <AnimatedTabIcon
                name="message-circle"
                color={color}
                size={size}
              />
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen
          name="Configurações"
          component={Settings}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <AnimatedTabIcon name="settings" color={color} size={size} />
            ),
            tabBarLabel: () => null, // Remove o nome da aba
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export function Main() {
  return (
    <SafeAreaProvider>
      <MainComponent />
    </SafeAreaProvider>
  );
}

const AnimatedTabIcon = ({ name, color, size }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={animatedStyle}>
      <FeatherIcon
        name={name}
        color={color}
        size={size}
        onPressIn={() => (scale.value = withSpring(1.2))}
        onPressOut={() => (scale.value = withSpring(1))}
      />
    </View>
  );
};

const getStyles = ({ theme, insets }: { theme: any; insets: any }) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
  });
