"use client";

import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";

import LoginScreen from "./screens/LoginScreen";
import ManagementScreen from "./screens/ManagementScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import BackupScreen from "./screens/BackupScreen";
import CustomDrawerContent from "./components/CustomDrawerContent";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { useTheme } from "./context/ThemeContext";



const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function StatusBarTheme() {
  const { theme, colors } = useTheme();
  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 50,
          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        }}
      />
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem("isLoggedIn");
        if (value === "true") {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async (email: string) => {
    try {
      await AsyncStorage.setItem("isLoggedIn", "true");
      await AsyncStorage.setItem("userEmail", email);
      setIsLoggedIn(true);
    } catch (error) {
      console.log("Error setting login status:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    } catch (error) {
      console.log("Error removing login status:", error);
    }
  };

  function DrawerNavigator() {
    const { theme, colors } = useTheme();
    return (
      <Drawer.Navigator
        drawerContent={(props) => (
          <CustomDrawerContent {...props} onLogout={handleLogout} />
        )}
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: theme === "light" ? "#ffffff" : "#0f172a",
          },
          headerTintColor: theme === "light" ? "#000000" : "#ffffff",
          headerTitleStyle: {
            color: theme === "light" ? "#000000" : "#ffffff",
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text,
          drawerStyle: {
            backgroundColor: colors.card,
            width: 280,
          },
        })}
      >
        <Drawer.Screen name="Gestión" component={ManagementScreen} />
        <Drawer.Screen name="Horarios" component={ScheduleScreen} />
        <Drawer.Screen name="Estadísticas" component={StatisticsScreen} />
        <Drawer.Screen name="Copia de Seguridad" component={BackupScreen} />
      </Drawer.Navigator>
    );
  }

  // Componente interno para manejar el StatusBar con acceso al tema
  function AppContent() {
    return (
      <>
        <StatusBarTheme />
        {isLoggedIn ? (
          <DrawerNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </>
    );
  }

  return (
    <ThemeProvider>
      <DataProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </DataProvider>
    </ThemeProvider>
  );
}
