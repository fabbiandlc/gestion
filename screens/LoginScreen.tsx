"use client"

import React, { useState, useEffect } from "react"
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
  Alert
} from "react-native"
import { useTheme } from "../context/ThemeContext"
import { Ionicons } from "@expo/vector-icons"

interface LoginScreenProps {
  onLogin: (username: string) => void
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const { colors } = useTheme()
  
  // Estado para el modal de recuperación de contraseña
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState("")
  
  // Animaciones
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]
  const pulseAnim = useState(new Animated.Value(1))[0]
  
  // Efecto para las animaciones al cargar
  useEffect(() => {
    // Animación de fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
    
    // Animación de slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start()
    
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
    ).start()
  }, [])
  
  const handleLogin = () => {
    // En una aplicación real, validarías las credenciales aquí
    if (username && password) {
      onLogin(username)
    }
  }

  // Función para enviar correo de recuperación
  const sendRecoveryEmail = () => {
    if (!recoveryEmail.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico")
      return
    }
    
    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recoveryEmail)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido")
      return
    }
    
    // Cerrar el modal y limpiar el campo
    setForgotPasswordModalVisible(false)
    
    // Pequeño retraso para asegurar que el modal se cierre antes de abrir el correo
    setTimeout(() => {
      // Abrir la aplicación de correo con la dirección y el correo del usuario
      Linking.openURL(`mailto:atencioncb18@gmail.com?subject=Recuperación de contraseña&body=Solicito la recuperación de mi contraseña para la aplicación de Gestión COBAEV.%0A%0AMi correo electrónico es: ${recoveryEmail}`)
      
      // Limpiar el campo después de enviar
      setRecoveryEmail("")
    }, 300)
  }

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
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Contenido principal con animaciones */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: '#0f172a' }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Image 
                source={require('../assets/iconLogin.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.appName}>Gestión administrativa</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
              style={[styles.loginButton, { backgroundColor: colors.primary }]} 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => setForgotPasswordModalVisible(true)}
            >
              <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}> 2025 COBAEV</Text>
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
            style={{ width: '100%' }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Recuperación de contraseña</Text>
              
              <Text style={styles.modalText}>
                Ingresa tu correo electrónico para recibir instrucciones de recuperación:
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
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={closeModal}
                >
                  <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={sendRecoveryEmail}
                >
                  <Text style={styles.modalButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#ffffff",
  },
  loginButton: {
    height: 55,
    borderRadius: 12,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#0f172a",
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#e2e8f0",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  }
})

export default LoginScreen
