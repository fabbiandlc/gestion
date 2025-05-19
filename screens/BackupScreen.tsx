import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Nombre de la tarea en segundo plano
const BACKGROUND_BACKUP_TASK = 'background-backup-task';

// Definir la tarea en segundo plano
TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] Ejecutando backup automático...`);
    
    // Obtener todos los datos de AsyncStorage
    const dataKeys = ['docentes', 'materias', 'grupos', 'directivos', 'horarios', 'tasks'];
    const allData: Record<string, any> = {};
    
    for (const key of dataKeys) {
      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData) {
        allData[key] = JSON.parse(jsonData);
      } else {
        allData[key] = [];
      }
    }
    
    // Verificar si hay datos para respaldar
    const hasData = Object.values(allData).some(arr => Array.isArray(arr) && arr.length > 0);
    
    if (!hasData) {
      console.log('No hay datos para respaldar');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Crear directorio de respaldos si no existe
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }
    
    // Nombre del archivo con fecha y hora
    const timestamp = format(now, 'yyyy-MM-dd-HH-mm-ss');
    const fileName = `respaldo-completo-${timestamp}.json`;
    const fileUri = `${backupDir}${fileName}`;
    
    // Crear el objeto de respaldo con formato correcto
    const backupObject = {
      timestamp: now.toISOString(),
      data: allData
    };
    
    // Guardar el archivo
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupObject, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log(`Backup completo guardado: ${fileUri}`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error en backup automático:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const BackupScreen = () => {
  const { colors } = useTheme();
  const {
    docentes, materias, grupos, directivos, horarios, actividades,
    loadAllData
  } = useData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [availableBackups, setAvailableBackups] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Cargar información de respaldos y tareas
  useEffect(() => {
    loadBackupInfo();
    loadTasks();
    registerBackgroundTask();
    
    // Configurar intervalo para verificar respaldos cada minuto
    const checkInterval = setInterval(() => {
      loadBackupInfo();
      loadTasks(); // Recargar tareas periódicamente
    }, 60000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Cargar tareas desde AsyncStorage
  const loadTasks = async () => {
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      if (tasksData) {
        setTasks(JSON.parse(tasksData));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setTasks([]);
    }
  };

  // Registrar tarea en segundo plano
  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
        minimumInterval: 60 * 60, // 1 hora en segundos
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Tarea de respaldo automático registrada');
    } catch (error) {
      console.error('Error al registrar tarea:', error);
    }
  };

  // Cargar información de respaldos
  const loadBackupInfo = async () => {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(backupDir);
        const backupFiles = files
          .filter(file => (file.startsWith('respaldo-completo-') || file.startsWith('respaldo-actividades-')) && file.endsWith('.json'))
          .sort()
          .reverse();
        
        setAvailableBackups(backupFiles);
        
        if (backupFiles.length > 0) {
          const lastBackupFile = backupFiles[0];
          const fileInfo = await FileSystem.getInfoAsync(`${backupDir}${lastBackupFile}`);
          if (fileInfo.exists) {
            const lastModified = new Date(fileInfo.modificationTime || 0);
            setLastBackup(lastModified.toISOString());
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar información de respaldos:', error);
    }
  };

  // Crear respaldo manual
  const createBackup = async () => {
    try {
      setIsLoading(true);
      setBackupStatus('Creando copia de seguridad completa...');
      
      // Recopilar todos los datos
      const dataKeys = ['docentes', 'materias', 'grupos', 'directivos', 'horarios', 'tasks'];
      const allData: Record<string, any> = {};
      let totalItems = 0;
      
      for (const key of dataKeys) {
        const jsonData = await AsyncStorage.getItem(key);
        if (jsonData) {
          const data = JSON.parse(jsonData);
          allData[key] = data;
          if (Array.isArray(data)) {
            totalItems += data.length;
          }
        } else {
          allData[key] = [];
        }
      }
      
      if (totalItems === 0) {
        setBackupStatus('No hay datos para respaldar');
        setIsLoading(false);
        return;
      }
      
      // Crear directorio de respaldos si no existe
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }
      
      // Nombre del archivo con fecha y hora
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const fileName = `respaldo-completo-${timestamp}.json`;
      const fileUri = `${backupDir}${fileName}`;
      
      // Crear el objeto de respaldo con formato correcto
      const backupObject = {
        timestamp: new Date().toISOString(),
        data: allData
      };
      
      // Guardar el archivo
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupObject, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Actualizar lista de respaldos
      await loadBackupInfo();
      
      // Compartir el archivo
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Compartir copia de seguridad',
        UTI: 'public.json',
        mimeType: 'application/json',
      });
      
      setBackupStatus(`Respaldo creado: ${totalItems} elementos guardados`);
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      Alert.alert('Error', 'No se pudo crear la copia de seguridad');
      setBackupStatus('Error al crear el respaldo');
    } finally {
      setIsLoading(false);
    }
  };

// Restaurar respaldo
const restoreBackup = async () => {
  try {
    setIsLoading(true);
    setBackupStatus('Seleccionando archivo de respaldo...');

    // Seleccionar archivo
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      setBackupStatus('Restauración cancelada');
      setIsLoading(false);
      return;
    }

    setBackupStatus('Leyendo archivo de respaldo...');

    // Leer contenido del archivo
    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const backupObject = JSON.parse(fileContent);
    const backupData = backupObject.data || backupObject; // Ajusta según tu estructura

    // Guardar cada tipo de dato en AsyncStorage
    if (backupData.docentes) await AsyncStorage.setItem('docentes', JSON.stringify(backupData.docentes));
    if (backupData.materias) await AsyncStorage.setItem('materias', JSON.stringify(backupData.materias));
    if (backupData.grupos) await AsyncStorage.setItem('grupos', JSON.stringify(backupData.grupos));
    if (backupData.directivos) await AsyncStorage.setItem('directivos', JSON.stringify(backupData.directivos));
    if (backupData.horarios) await AsyncStorage.setItem('horarios', JSON.stringify(backupData.horarios));
    if (backupData.actividades) await AsyncStorage.setItem('actividades', JSON.stringify(backupData.actividades));
    if (backupData.tasks) await AsyncStorage.setItem('tasks', JSON.stringify(backupData.tasks));

    // Recargar todos los datos en el contexto
    await loadAllData();

    Alert.alert(
      'Restauración completada',
      'Los datos han sido restaurados correctamente. La aplicación ha sido actualizada con los datos restaurados.',
      [{ text: 'OK' }]
    );

    setIsLoading(false);
  } catch (error) {
    console.error('Error al restaurar respaldo:', error);
    Alert.alert('Error', 'No se pudo restaurar el respaldo');
    setBackupStatus('');
    setIsLoading(false);
  }
};

  // Formatear fecha legible
  const formatBackupDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return 'Fecha desconocida';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Respaldo Actual</Text>
        {lastBackup ? (
          <Text style={[styles.lastBackup, { color: colors.text }]}>
            Último respaldo: {formatBackupDate(lastBackup)}
          </Text>
        ) : (
          <Text style={[styles.noBackup, { color: colors.text }]}>No hay respaldos guardados</Text>
        )}
        
        <View style={styles.statsContainer}>
          <Text style={{ color: colors.text }}>Elementos disponibles:</Text>
          <Text style={{ color: colors.text }}>• Docentes: {docentes.length}</Text>
          <Text style={{ color: colors.text }}>• Materias: {materias.length}</Text>
          <Text style={{ color: colors.text }}>• Grupos: {grupos.length}</Text>
          <Text style={{ color: colors.text }}>• Directivos: {directivos.length}</Text>
          <Text style={{ color: colors.text }}>• Horarios: {horarios.length}</Text>
          <Text style={{ color: colors.text }}>• Tareas: {tasks.length}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={createBackup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Guardar copia de seguridad</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={restoreBackup}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Recuperar copia de seguridad</Text>
        </TouchableOpacity>
      </View>
      
      {backupStatus ? (
        <Text style={[styles.status, { color: colors.text }]}>{backupStatus}</Text>
      ) : null}
      
      {availableBackups.length > 0 && (
        <View style={styles.backupList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Respaldos disponibles:</Text>
          <ScrollView style={styles.scrollView}>
            {availableBackups.map((backup, index) => (
              <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.text }}>{backup}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  lastBackup: {
    fontSize: 16,
    color: '#4CAF50',
  },
  noBackup: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  statsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  status: {
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  backupList: {
    marginTop: 20,
    flex: 1,
  },
  scrollView: {
    maxHeight: 200,
    marginTop: 10,
  },
  backupItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
});

export default BackupScreen;
