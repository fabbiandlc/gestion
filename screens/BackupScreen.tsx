"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  AppState,
  TextInput
} from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useData } from "../context/DataContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import * as Sharing from 'expo-sharing'
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { es } from 'date-fns/locale'

// Constantes para el respaldo automático
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 horas en milisegundos
const BACKUP_CHECK_INTERVAL = 60 * 60 * 1000 // 1 hora en milisegundos

const BackupScreen = () => {
  const { colors } = useTheme()
  const { loadAllData } = useData()
  const [backups, setBackups] = useState<{ id: string; name: string; date: string; size: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [backupName, setBackupName] = useState("")
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null)
  const appState = useRef(AppState.currentState)

  // Verificar y realizar respaldo automático
  useEffect(() => {
    const checkAutoBackup = async () => {
      try {
        const lastBackupTime = await AsyncStorage.getItem('lastAutoBackupTime')
        const now = new Date()
        
        if (!lastBackupTime || (now.getTime() - new Date(lastBackupTime).getTime() > BACKUP_INTERVAL)) {
          // Crear respaldo automático
          await createBackup(true)
          await AsyncStorage.setItem('lastAutoBackupTime', now.toISOString())
          setLastAutoBackup(now.toISOString())
        } else {
          setLastAutoBackup(lastBackupTime)
        }
      } catch (error) {
        console.error('Error al verificar respaldo automático:', error)
      }
    }

    // Verificar al montar el componente
    checkAutoBackup()

    // Configurar verificación periódica
    const interval = setInterval(checkAutoBackup, BACKUP_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Cargar lista de respaldos y monitorear cambios de estado de la app
  useEffect(() => {
    loadBackups()

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadBackups()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const backupsList = await AsyncStorage.getItem('backups')
      if (backupsList) {
        setBackups(JSON.parse(backupsList))
      } else {
        setBackups([])
      }
    } catch (error) {
      console.error('Error al cargar backups:', error)
      Alert.alert('Error', 'No se pudieron cargar las copias de seguridad')
    } finally {
      setLoading(false)
    }
  }

  const saveBackupsList = async (updatedBackups: { id: string; name: string; date: string; size: string }[]) => {
    try {
      await AsyncStorage.setItem('backups', JSON.stringify(updatedBackups))
    } catch (error) {
      console.error('Error al guardar lista de backups:', error)
    }
  }

  const createBackup = async (isAutoBackup: boolean = false) => {
    if (!isAutoBackup && !backupName.trim()) {
      Alert.alert('Error', 'Por favor ingrese un nombre para la copia de seguridad')
      return
    }

    try {
      setLoading(true)

      // Obtener todos los datos
      const dataKeys = [
        'docentes',
        'materias',
        'grupos',
        'directivos',
        'administrativos',
        'horarios',
        'actividades',
        'tasks'
      ]

      const backupData: Record<string, any> = {
        timestamp: new Date().toISOString(),
        isAutoBackup,
        data: {}
      }

      for (const key of dataKeys) {
        const data = await AsyncStorage.getItem(key)
        backupData.data[key] = data ? JSON.parse(data) : []
      }

      // Convertir a JSON
      const backupJson = JSON.stringify(backupData)
      const backupSize = (backupJson.length / 1024).toFixed(2) + ' KB'

      // Guardar en AsyncStorage
      const backupId = `backup_${Date.now()}`
      await AsyncStorage.setItem(backupId, backupJson)

      // Actualizar lista de backups
      const newBackup = {
        id: backupId,
        name: isAutoBackup ? `Respaldo automático ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}` : backupName,
        date: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es }),
        size: backupSize
      }

      const updatedBackups = [...backups, newBackup]
      setBackups(updatedBackups)
      await saveBackupsList(updatedBackups)

      if (!isAutoBackup) {
        Alert.alert('Éxito', 'Copia de seguridad creada correctamente')
        setBackupName('')
      }
    } catch (error) {
      console.error('Error al crear copia de seguridad:', error)
      if (!isAutoBackup) {
        Alert.alert('Error', 'No se pudo crear la copia de seguridad')
      }
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (backupId: string, backupName: string) => {
    Alert.alert(
      'Restaurar copia de seguridad',
      `¿Está seguro de que desea restaurar la copia de seguridad "${backupName}"? Esto reemplazará todos los datos actuales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              setRestoring(true)

              // Obtener datos de la copia de seguridad
              const backupJson = await AsyncStorage.getItem(backupId)
              if (!backupJson) {
                throw new Error('No se encontró la copia de seguridad')
              }

              const backupData = JSON.parse(backupJson)

              // Restaurar todos los datos
              const dataToRestore = backupData.data || backupData
              for (const [key, value] of Object.entries(dataToRestore)) {
                await AsyncStorage.setItem(key, JSON.stringify(value))
              }

              // Registrar la hora de la última restauración
              await AsyncStorage.setItem('lastRestoreTime', new Date().toISOString())

              // Recargar los datos en el contexto
              await loadAllData()

              Alert.alert('Éxito', 'Copia de seguridad restaurada correctamente')
            } catch (error) {
              console.error('Error al restaurar copia de seguridad:', error)
              Alert.alert('Error', 'No se pudo restaurar la copia de seguridad')
            } finally {
              setRestoring(false)
            }
          }
        }
      ]
    )
  }

  const deleteBackup = async (backupId: string, backupName: string) => {
    Alert.alert(
      'Eliminar copia de seguridad',
      `¿Está seguro de que desea eliminar la copia de seguridad "${backupName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)

              // Eliminar de AsyncStorage
              await AsyncStorage.removeItem(backupId)

              // Actualizar lista de backups
              const updatedBackups = backups.filter(backup => backup.id !== backupId)
              setBackups(updatedBackups)
              await saveBackupsList(updatedBackups)

              Alert.alert('Éxito', 'Copia de seguridad eliminada correctamente')
            } catch (error) {
              console.error('Error al eliminar copia de seguridad:', error)
              Alert.alert('Error', 'No se pudo eliminar la copia de seguridad')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const exportBackup = async (backupId: string, backupName: string) => {
    try {
      setLoading(true)

      // Verificar si el dispositivo puede compartir
      const canShare = await Sharing.isAvailableAsync()
      if (!canShare) {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo')
        return
      }

      // Obtener datos de la copia de seguridad
      const backupJson = await AsyncStorage.getItem(backupId)
      if (!backupJson) {
        throw new Error('No se encontró la copia de seguridad')
      }

      // Sanitizar el nombre del archivo reemplazando caracteres no válidos
      const sanitizedName = backupName
        .replace(/[\/\\:*?"<>|]/g, '_') // Reemplazar caracteres no válidos con guión bajo
        .replace(/\s+/g, '_') // Reemplazar espacios con guión bajo

      // Crear archivo temporal con nombre sanitizado
      const fileUri = `${FileSystem.cacheDirectory}cobaev_backup_${sanitizedName}_${Date.now()}.json`
      await FileSystem.writeAsStringAsync(fileUri, backupJson, { encoding: FileSystem.EncodingType.UTF8 })

      // Compartir archivo
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Copia de seguridad: ${backupName}`,
        UTI: 'public.json'
      })
    } catch (error) {
      console.error('Error al exportar copia de seguridad:', error)
      Alert.alert('Error', 'No se pudo exportar la copia de seguridad')
    } finally {
      setLoading(false)
    }
  }

  const importBackup = async () => {
    try {
      setLoading(true)

      // Seleccionar archivo
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets[0]
      
      // Leer contenido del archivo
      const fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 })
      
      try {
        // Validar que sea un JSON válido y tenga la estructura correcta
        const backupData = JSON.parse(fileContent)
        
        if (!backupData.timestamp || (!backupData.data && !backupData.docentes)) {
          throw new Error('El archivo no parece ser una copia de seguridad válida')
        }

        // Crear nombre para la copia de seguridad importada
        const importName = asset.name.replace(/\.json$/, '') || 'Copia importada'
        
        // Guardar en AsyncStorage
        const backupId = `backup_${Date.now()}`
        await AsyncStorage.setItem(backupId, fileContent)

        // Actualizar lista de backups
        const backupSize = (fileContent.length / 1024).toFixed(2) + ' KB'
        const newBackup = {
          id: backupId,
          name: importName,
          date: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es }) + ' (Importada)',
          size: backupSize
        }

        const updatedBackups = [...backups, newBackup]
        setBackups(updatedBackups)
        await saveBackupsList(updatedBackups)

        Alert.alert('Éxito', 'Copia de seguridad importada correctamente')
      } catch (error) {
        console.error('Error al procesar el archivo:', error)
        Alert.alert('Error', 'El archivo seleccionado no es una copia de seguridad válida')
      }
    } catch (error) {
      console.error('Error al importar copia de seguridad:', error)
      Alert.alert('Error', 'No se pudo importar la copia de seguridad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Copias de Seguridad</Text>
        {lastAutoBackup && (
          <Text style={[styles.lastAutoBackup, { color: colors.text + '80' }]}>
            Último respaldo automático: {format(new Date(lastAutoBackup), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        )}
      </View>

      <View style={styles.createBackupContainer}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Nombre de la copia de seguridad"
          placeholderTextColor={colors.text + '80'}
          value={backupName}
          onChangeText={setBackupName}
        />
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => createBackup(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Crear copia de seguridad</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={importBackup}
        disabled={loading || restoring}
      >
        <Feather name="upload" size={20} color={colors.primary} />
        <Text style={[styles.importButtonText, { color: colors.text }]}>Importar copia de seguridad</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Copias de seguridad disponibles</Text>

      {loading && !restoring ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Cargando copias de seguridad...</Text>
        </View>
      ) : restoring ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Restaurando datos...</Text>
        </View>
      ) : backups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="archive" size={50} color={colors.text + '50'} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No hay copias de seguridad</Text>
          <Text style={[styles.emptySubtext, { color: colors.text + '80' }]}>
            Crea una copia de seguridad para proteger tus datos
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.backupsList}>
          {backups.map((backup) => (
            <View
              key={backup.id}
              style={[styles.backupItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.backupInfo}>
                <Text style={[styles.backupName, { color: colors.text }]}>{backup.name}</Text>
                <Text style={[styles.backupDate, { color: colors.text + '80' }]}>{backup.date}</Text>
                <Text style={[styles.backupSize, { color: colors.text + '60' }]}>Tamaño: {backup.size}</Text>
              </View>
              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => restoreBackup(backup.id, backup.name)}
                  disabled={restoring}
                >
                  <Feather name="refresh-cw" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                  onPress={() => exportBackup(backup.id, backup.name)}
                  disabled={loading || restoring}
                >
                  <Feather name="share" size={20} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => deleteBackup(backup.id, backup.name)}
                  disabled={loading || restoring}
                >
                  <Feather name="trash-2" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastAutoBackup: {
    fontSize: 12,
  },
  createBackupContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  createButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 48,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  importButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  backupsList: {
    paddingHorizontal: 16,
  },
  backupItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  backupDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  backupSize: {
    fontSize: 12,
  },
  backupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
})

export default BackupScreen
