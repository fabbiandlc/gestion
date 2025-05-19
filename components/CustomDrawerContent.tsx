"use client"

import type React from "react"
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from "react-native"
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer"
import { useTheme } from "../context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface CustomDrawerContentProps {
  onLogout: () => void
  [key: string]: any
}

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
  const { onLogout, ...restProps } = props
  const { theme, toggleTheme, colors } = useTheme()
  const [userEmail, setUserEmail] = useState<string>("")

  // Cargar el correo electrónico del usuario
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail")
        if (email) {
          setUserEmail(email)
        }
      } catch (error) {
        console.log("Error loading user email:", error)
      }
    }

    loadUserEmail()
  }, [])

  return (
    <DrawerContentScrollView {...restProps} style={{ backgroundColor: colors.card }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.userIconContainer}>
          <Feather name="user" size={50} color={colors.primary} />
        </View>
        <Text 
          style={[styles.userEmail, { color: colors.text }]} 
          numberOfLines={2}
        >
          {userEmail}
        </Text>
      </View>

      <DrawerItemList
        {...restProps}
        activeTintColor={colors.primary}
        inactiveTintColor={colors.text}
        activeBackgroundColor={theme === "light" ? "#e9ecef" : "#495057"}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.themeToggle}>
          <Feather name={theme === "light" ? "sun" : "moon"} size={20} color={colors.text} />
          <Text style={[styles.themeText, { color: colors.text }]}>
            {theme === "light" ? "Modo claro" : "Modo oscuro"}
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={theme === "dark" ? "#f8f9fa" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Feather name="log-out" size={20} color={colors.text} />
          <Text style={[styles.logoutText, { color: colors.text }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 0,
    paddingVertical: 40,
    borderBottomWidth: 1,
    marginBottom: 20,
    alignItems: "center",
    width: '100%',
  },
  userIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  userEmail: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
    width: '90%',
    paddingHorizontal:0,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    marginTop: 20,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  themeText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
  },
})

export default CustomDrawerContent
