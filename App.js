import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  BackHandler,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "./HomeScreen";
import Calendario from "./Calendario";
import AdministracionScreen from "./AdministracionScreen";
import HorariosScreen from "./HorariosScreen";
import LoginScreen from "./LoginScreen";
import { ActivitiesProvider } from "./ActivitiesContext";
import { DataProvider } from "./DataContext";
import "react-native-get-random-values";

const { width } = Dimensions.get("window");

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("Login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const translateX = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          setIsLoggedIn(true);
          setCurrentScreen("Actividades");
          closeDrawer(); // Cierra el drawer completamente al cargar con token
        }
      } catch (error) {
        console.error("Error checking token:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isDrawerOpen) {
          closeDrawer();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isDrawerOpen]);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const navigateToScreen = (screenName) => {
    setCurrentScreen(screenName);
    closeDrawer();
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentScreen("Actividades");
    closeDrawer(); // Cierra el drawer completamente al iniciar sesión
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    setIsLoggedIn(false);
    setCurrentScreen("Login");
    closeDrawer();
  };

  const renderMainContent = () => {
    const navigation = {
      goBack: () => setCurrentScreen("Actividades"),
    };

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      );
    }

    if (!isLoggedIn) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#007BFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currentScreen}</Text>
          <View style={{ width: 24 }} />
        </View>
        {currentScreen === "Actividades" && <HomeScreen />}
        {currentScreen === "Calendario" && <Calendario />}
        {currentScreen === "Gestión" && (
          <AdministracionScreen navigation={navigation} />
        )}
        {currentScreen === "Horarios" && <HorariosScreen />}
        
      </SafeAreaView>
    );
  };

  const drawerItems = [
    { name: "Actividades", icon: "home-outline" },
    { name: "Calendario", icon: "calendar-outline" },
    { name: "Gestión", icon: "pencil-outline" },
    { name: "Horarios", icon: "time-outline" },
    { name: "Cerrar Sesión", icon: "log-out-outline", action: handleLogout },
  ];

  return (
    <DataProvider>
      <SafeAreaProvider>
        <ActivitiesProvider>
          {isDrawerOpen && isLoggedIn && (
            <TouchableOpacity
              activeOpacity={1}
              style={styles.overlayContainer}
              onPress={closeDrawer}
            >
              <Animated.View
                style={[
                  styles.overlay,
                  { opacity: fadeAnim, backgroundColor: "rgba(0, 0, 0, 0.6)" },
                ]}
              />
            </TouchableOpacity>
          )}

          {isLoggedIn && (
            <Animated.View
              style={[styles.drawer, { transform: [{ translateX }] }]}
            >
              <SafeAreaView style={styles.safeAreaDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Mi Aplicación</Text>
                  <TouchableOpacity onPress={closeDrawer}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.drawerContent}>
                  {drawerItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.drawerItem}
                      onPress={() =>
                        item.action
                          ? item.action()
                          : navigateToScreen(item.name)
                      }
                    >
                      <Ionicons name={item.icon} size={24} color="#007BFF" />
                      <Text style={styles.drawerItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          )}

          <View style={styles.mainContent}>{renderMainContent()}</View>
        </ActivitiesProvider>
      </SafeAreaProvider>
    </DataProvider>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#111',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#fff',
  },
  menuButton: {
    paddingHorizontal: 5,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    width: "80%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  safeAreaDrawer: {
    flex: 1,
    backgroundColor: '#000',
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#fff',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerItemText: {
    marginLeft: 32,
    fontSize: 16,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#111',
  },
});