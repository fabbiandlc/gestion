"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Modal,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../styles/theme";

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { colors } = useTheme();

  // Estado para el modal de recuperación de contraseña
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] =
    useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Animaciones
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Efecto para las animaciones al cargar
  useEffect(() => {
    // Animación de fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animación de slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animación de pulso para el logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = () => {
    // En una aplicación real, validarías las credenciales aquí
    if (username && password) {
      onLogin(username);
    }
  };

  // Función para enviar correo de recuperación
  const sendRecoveryEmail = () => {
    if (!recoveryEmail.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    // Cerrar el modal y limpiar el campo
    setForgotPasswordModalVisible(false);

    // Pequeño retraso para asegurar que el modal se cierre antes de abrir el correo
    setTimeout(() => {
      // Abrir la aplicación de correo con la dirección y el correo del usuario
      Linking.openURL(
        `mailto:atencioncb18@gmail.com?subject=Recuperación de contraseña&body=Solicito la recuperación de mi contraseña para la aplicación de Gestión COBAEV.%0A%0AMi correo electrónico es: ${recoveryEmail}`
      );

      // Limpiar el campo después de enviar
      setRecoveryEmail("");
    }, 300);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    // Usar Animated.timing para hacer un fade-out suave
    Animated.timing(fadeAnim, {
      toValue: 0.99, // Un valor ligeramente menor que 1 para forzar re-render
      duration: 10,
      useNativeDriver: true,
    }).start(() => {
      // Luego volver a 1 para mantener la visibilidad normal
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 10,
        useNativeDriver: true,
      }).start();
    });

    setForgotPasswordModalVisible(false);
    setRecoveryEmail("");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0f172a" }]}>
      <StatusBar barStyle="light-content" />

      {/* Contenido principal con animaciones */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#0f172a" }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Image
                source={require("../assets/iconLogin.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.appName}>Generar Horarios</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu correo electrónico"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[commonStyles.button]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={commonStyles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                commonStyles.button,
                commonStyles.buttonOutline,
                { marginTop: 16 },
              ]}
              onPress={() => setForgotPasswordModalVisible(true)}
            >
              <Text style={commonStyles.buttonOutlineText}>
                Olvidé mi contraseña
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Modal de recuperación de contraseña */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={forgotPasswordModalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%" }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Recuperación de contraseña</Text>

              <Text style={styles.modalText}>
                Ingresa tu correo electrónico para recibir instrucciones de
                recuperación:
              </Text>

              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Correo electrónico"
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  value={recoveryEmail}
                  onChangeText={setRecoveryEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[
                    commonStyles.button,
                    commonStyles.buttonSmall,
                    { flex: 1 },
                  ]}
                  onPress={closeModal}
                >
                  <Text style={commonStyles.buttonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    commonStyles.button,
                    commonStyles.buttonSmall,
                    { flex: 1, marginLeft: 12 },
                  ]}
                  onPress={sendRecoveryEmail}
                >
                  <Text style={commonStyles.buttonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    height: "100%",
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  forgotPasswordContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#4a4a4a",
    marginBottom: 20,
    lineHeight: 20,
    textAlign: "center",
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f5f5f5",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#4a4a4a",
  },
  sendButton: {
    backgroundColor: "#3b82f6",
  },
  sendButtonText: {
    color: "#ffffff",
  },
});

export default LoginScreen;
