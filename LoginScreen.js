import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseConfig';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Credenciales incorrectas');
      }

      const { session } = data;
      if (session) {
        await AsyncStorage.setItem('userToken', session.access_token);
        await AsyncStorage.setItem('userEmail', email);
        onLoginSuccess(email);
      } else {
        throw new Error('No se recibió un token de sesión');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al conectar con el servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setResetModalVisible(true);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Por favor, ingresa tu correo electrónico');
      return;
    }
    if (!isValidEmail(resetEmail)) {
      Alert.alert('Error', 'Por favor, ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      // Crear el enlace mailto con el correo prellenado
      const subject = encodeURIComponent('Solicitud de restablecimiento de contraseña');
      const body = encodeURIComponent(
        `He olvidado mi contraseña. Mi correo para iniciar sesión en la aplicación es: ${resetEmail}\n\n.`
      );
      const mailtoLink = `mailto:atencioncb18@gmail.com?subject=${subject}&body=${body}`;

      // Verificar si el dispositivo puede abrir el enlace
      const supported = await Linking.canOpenURL(mailtoLink);
      if (!supported) {
        throw new Error(
          'No se puede abrir una aplicación de correo. Por favor, envía un correo a fahuervodelacruz@hotmail.com con tu solicitud.'
        );
      }

      // Abrir el cliente de correo predeterminado
      await Linking.openURL(mailtoLink);

      Alert.alert(
        'Solicitud enviada',
        'Se ha abierto tu aplicación de correo (como Gmail, Outlook o la app de correos). Por favor, envía el correo al administrador para completar la solicitud.'
      );
      setResetModalVisible(false);
      setResetEmail('');
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo abrir una aplicación de correo. Por favor, envía un correo a fahuervodelacruz@hotmail.com con tu solicitud.'
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled
    >
      <View style={styles.formContainer}>
        <View style={styles.formWrapper}>
          <Image source={require('./assets/iconLogin.png')} style={styles.logo} />
          <Text style={styles.title}>Iniciar Sesión</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#888888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Correo"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#888888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Contraseña"
            />
          </View>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityLabel="Iniciar sesión"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={resetModalVisible}
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restablecer Contraseña</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa tu correo para contactar al administrador. Se abrirá tu app de correo para enviar la solicitud.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ingresa tu correo a restablecer</Text>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888888"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Correo de restablecimiento"
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setResetModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.modalButtonText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191919',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#AAAAAA',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  forgotPassword: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 20,
    width: '100%',
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;