import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  backupToSupabase,
  restoreFromSupabase,
  getSyncInfo,
} from './Database';
import RNRestart from 'react-native-restart';

const BackupScreen = () => {
  const [syncInfo, setSyncInfo] = useState({ lastSync: null, pendingChanges: false });
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Fetch sync info on component mount to display last sync time and pending changes
  useEffect(() => {
    const fetchSyncInfo = async () => {
      try {
        const info = await getSyncInfo();
        setSyncInfo(info);
      } catch (error) {
        console.error('Error fetching sync info:', error);
        Alert.alert('Error', 'No se pudo obtener la información de sincronización');
      }
    };
    fetchSyncInfo();
  }, []);

  // Handle manual backup when the "Guardar copia de seguridad" button is pressed
  const handleBackup = async () => {
    setLoading(true);
    try {
      const result = await backupToSupabase();
      if (result.success) {
        const updatedInfo = await getSyncInfo();
        setSyncInfo(updatedInfo);
        Alert.alert('Éxito', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Error', 'Error al realizar la copia de seguridad');
    } finally {
      setLoading(false);
    }
  };

  // Handle restore when the "Restaurar copia de seguridad" button is pressed
  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restoreFromSupabase();
      if (result.success) {
        Alert.alert(
          'Éxito',
          `${result.message}\n\nLa aplicación se reiniciará para aplicar los cambios.`,
          [
            {
              text: 'Aceptar',
              onPress: () => {
                RNRestart.Restart();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', result.message);
        setRestoring(false);
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Error al restaurar la copia de seguridad');
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={40} color="#FFFFFF" />
        <Text style={styles.title}>Copias de Seguridad</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Última sincronización:{' '}
          {syncInfo.lastSync
            ? new Date(syncInfo.lastSync).toLocaleString('es-ES')
            : 'Nunca'}
        </Text>
        <Text style={styles.infoText}>
          Cambios pendientes: {syncInfo.pendingChanges ? 'Sí' : 'No'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleBackup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Guardar copia de seguridad</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, restoring && styles.buttonDisabled]}
        onPress={handleRestore}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Restaurar copia de seguridad</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#444444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BackupScreen;