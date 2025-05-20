"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  AppState,
  ScrollView,
  Image,
  ActivityIndicator
} from "react-native"
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar, LocaleConfig } from "react-native-calendars"
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { useTheme } from "../context/ThemeContext"
import { useData } from "../context/DataContext"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { parseISO } from 'date-fns';

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type TaskStatus = "pending" | "in_progress" | "completed"
type UrgencyLevel = 'baja' | 'media' | 'alta'

interface Task {
  id: string
  name: string
  description: string
  date: string
  status: TaskStatus
  urgency: UrgencyLevel
  deadline: string | null
  administrativoId?: string // ID del administrativo responsable
}

interface WhatsAppConfirmation {
  show: boolean;
  message: string;
  phoneNumber: string;
}

const statusColors = {
  pending: "#e74c3c",
  in_progress: "#f1c40f",
  completed: "#2ecc71",
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completado",
}

const urgencyColors = {
  baja: '#4CAF50',  // Verde
  media: '#FFC107', // Amarillo
  alta: '#F44336'   // Rojo
}

// Configurar la localización en español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};

// Establecer el idioma por defecto
LocaleConfig.defaultLocale = 'es';

export default function ActivitiesScreen() {
  const { colors, theme } = useTheme()
  const { administrativos } = useData()
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [administrativoModalVisible, setAdministrativoModalVisible] = useState(false)
  const [whatsappConfirmation, setWhatsappConfirmation] = useState<WhatsAppConfirmation>({
    show: false,
    message: '',
    phoneNumber: ''
  })
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [markedDates, setMarkedDates] = useState({})
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);
  const restoreCheckInterval = useRef<NodeJS.Timeout>();

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState<UrgencyLevel>('media')
  const [deadline, setDeadline] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAdministrativoId, setSelectedAdministrativoId] = useState<string>("");

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set') {
      if (selectedDate) {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0); // Resetear la hora
        setDeadline(date.toISOString());
      }
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set') {
      if (selectedTime) {
        if (deadline) {
          const date = new Date(deadline);
          date.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
          setDeadline(date.toISOString());
        }
      }
    }
  };

  const showDatePickerAsync = () => {
    setShowDatePicker(true);
  };

  const showTimePickerAsync = () => {
    setShowTimePicker(true);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Selecciona fecha y hora';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Configurar notificaciones al montar el componente
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Configurar el listener para cuando se recibe una notificación
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    // Configurar el listener para cuando el usuario interactúa con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Respuesta a notificación:', response);
    });

    // Cargar tareas guardadas
    loadTasks();

    // Monitorear cambios en el estado de la aplicación
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // La app volvió a primer plano, recargamos las tareas
        loadTasks();
      }
      
      appState.current = nextAppState;
    });

    // Listener for backup restoration
    const checkForRestoration = async () => {
      try {
        const lastRestoreTime = await AsyncStorage.getItem('lastRestoreTime');
        const lastCheckedTime = await AsyncStorage.getItem('lastCheckedRestoreTime');
        
        if (lastRestoreTime && lastRestoreTime !== lastCheckedTime) {
          // Reload tasks if a restoration was detected
          loadTasks();
          await AsyncStorage.setItem('lastCheckedRestoreTime', lastRestoreTime);
        }
      } catch (error) {
        console.error('Error checking for restoration:', error);
      }
    };

    // Check for restorations every 5 seconds
    restoreCheckInterval.current = setInterval(checkForRestoration, 5000);

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
      clearInterval(restoreCheckInterval.current);
    };
  }, []);

  // Función para cargar tareas desde AsyncStorage
  const loadTasks = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      if (tasksJson) {
        const savedTasks = JSON.parse(tasksJson);
        setTasks(savedTasks);
        updateMarkedDates(savedTasks);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas guardadas');
    }
  };

  // Función para guardar tareas en AsyncStorage
  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error al guardar tareas:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  // Actualizar las fechas marcadas en el calendario
  const updateMarkedDates = (taskList: Task[]) => {
    const newMarkedDates = {};
    
    // Marcar el día actual
    const today = format(new Date(), "yyyy-MM-dd");
    newMarkedDates[today] = {
      selected: today === selectedDate,
      marked: false,
      customStyles: {
        container: {
          backgroundColor: today === selectedDate 
            ? colors.primary 
            : theme === 'light' 
              ? 'rgba(33, 150, 243, 0.15)' 
              : 'rgba(25, 118, 210, 0.25)',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme === 'light' 
            ? 'rgba(33, 150, 243, 0.3)' 
            : 'rgba(59, 130, 246, 0.5)',
        },
        text: {
          color: today === selectedDate 
            ? '#ffffff' 
            : theme === 'light' 
              ? '#1976d2' 
              : '#90caf9',
          fontWeight: '600',
        }
      }
    };
    
    // Marcar días con tareas
    taskList.forEach(task => {
      if (task.date === today) {
        // Si hay una tarea en el día actual, agregar el punto pero mantener el estilo del día actual
        newMarkedDates[today] = {
          ...newMarkedDates[today],
          marked: true,
          dots: [
            {
              color: getTaskDotColor(task),
              selectedDotColor: '#ffffff'
            }
          ]
        };
        return;
      }
      
      // Para otros días con tareas
      newMarkedDates[task.date] = {
        ...newMarkedDates[task.date],
        selected: task.date === selectedDate,
        marked: true,
        customStyles: {
          container: {
            backgroundColor: task.date === selectedDate 
              ? colors.primary 
              : 'transparent',
            borderRadius: 8,
            borderWidth: task.date === selectedDate ? 0 : 1,
            borderColor: theme === 'light' 
              ? 'rgba(108, 117, 125, 0.3)' 
              : 'rgba(148, 163, 184, 0.3)',
          },
          text: {
            color: task.date === selectedDate 
              ? '#ffffff' 
              : colors.text,
            fontWeight: task.date === selectedDate ? '600' : 'normal',
          },
          dot: {
            color: getTaskDotColor(task),
            selectedDotColor: '#ffffff',
            size: 5,
          }
        }
      };
    });
    
    // Asegurar que el día seleccionado siempre esté marcado, incluso si no tiene tareas
    if (selectedDate !== today && !newMarkedDates[selectedDate]) {
      newMarkedDates[selectedDate] = {
        selected: true,
        marked: false,
        customStyles: {
          container: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            borderWidth: 0,
          },
          text: {
            color: '#ffffff',
            fontWeight: '600',
          }
        }
      };
    }
    
    setMarkedDates(newMarkedDates);
  };

  // Obtener el color del punto para la tarea en el calendario
  const getTaskDotColor = (task: Task) => {
    // Si la tarea está completada, usar el color de completado
    if (task.status === 'completed') return statusColors.completed;
    
    // Para tareas no completadas, usar el color de urgencia con mayor opacidad para mejor visibilidad
    const baseColor = urgencyColors[task.urgency];
    
    // Aumentar la opacidad/intensidad del color para mejor visibilidad
    return theme === 'light' 
      ? baseColor // En modo claro, mantener el color original
      : task.urgency === 'baja' 
        ? '#81c784' // Verde más brillante para modo oscuro
        : task.urgency === 'media' 
          ? '#ffb74d' // Amarillo más brillante para modo oscuro
          : '#e57373'; // Rojo más brillante para modo oscuro
  };

  // Función para registrar el dispositivo para notificaciones push
  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones');
      return;
    }

    // Configurar el canal de notificación para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
  }

  // Función para programar una notificación local
  async function schedulePushNotification(task: Task) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nueva tarea creada",
        body: `Tarea: ${task.name}`,
        data: { taskId: task.id },
        sound: 'default',
      },
      trigger: { seconds: 1 }, // Mostrar notificación después de 1 segundo
    });
  }

  // Update marked dates when tasks change or theme changes
  useEffect(() => {
    updateMarkedDates(tasks);
  }, [tasks, selectedDate, colors]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    
    // Actualizar inmediatamente el sombreado del día seleccionado
    setMarkedDates(prevMarkedDates => {
      const updatedMarkedDates = { ...prevMarkedDates };
      
      // Eliminar la selección de todos los días
      Object.keys(updatedMarkedDates).forEach(date => {
        if (updatedMarkedDates[date].customStyles) {
          updatedMarkedDates[date] = {
            ...updatedMarkedDates[date],
            selected: false,
            customStyles: {
              ...updatedMarkedDates[date].customStyles,
              container: {
                ...updatedMarkedDates[date].customStyles.container,
                backgroundColor: date === format(new Date(), "yyyy-MM-dd") 
                  ? theme === 'light' 
                    ? 'rgba(33, 150, 243, 0.15)' 
                    : 'rgba(25, 118, 210, 0.25)'
                  : 'transparent',
              },
              text: {
                ...updatedMarkedDates[date].customStyles.text,
                color: date === format(new Date(), "yyyy-MM-dd") 
                  ? theme === 'light' ? '#1976d2' : '#90caf9'
                  : colors.text,
                fontWeight: 'normal',
              }
            }
          };
        }
      });
      
      // Marcar el día seleccionado
      const selectedDateObj = updatedMarkedDates[day.dateString] || {
        marked: false,
        customStyles: {
          container: {},
          text: {}
        }
      };
      
      updatedMarkedDates[day.dateString] = {
        ...selectedDateObj,
        selected: true,
        customStyles: {
          ...selectedDateObj.customStyles,
          container: {
            ...selectedDateObj.customStyles.container,
            backgroundColor: colors.primary,
            borderRadius: 8,
            borderWidth: 0,
          },
          text: {
            ...selectedDateObj.customStyles.text,
            color: '#ffffff',
            fontWeight: '600',
          }
        }
      };
      
      return updatedMarkedDates;
    });
  }, [colors.primary, colors.text, theme]);

  const filteredTasks = tasks.filter((task) => task.date === selectedDate)

  // Helpers
  const resetForm = () => {
    setName("")
    setDescription("")
    setUrgency('media')
    setDeadline(null)
    setSelectedAdministrativoId("")
    setEditingTask(null)
  }

  const openForm = (task: Task | null = null) => {
    if (task) {
      setName(task.name)
      setDescription(task.description)
      setUrgency(task.urgency)
      setDeadline(task.deadline)
      setSelectedAdministrativoId(task.administrativoId || "")
      setEditingTask(task)
    } else {
      resetForm()
    }
    setModalVisible(true)
  }

  const closeForm = () => {
    setModalVisible(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre de la tarea es obligatorio")
      return
    }

    let updatedTasks: Task[]

    if (editingTask) {
      // Actualizar tarea existente
      updatedTasks = tasks.map((t) =>
        t.id === editingTask.id
          ? { ...t, name, description, urgency, deadline, administrativoId: selectedAdministrativoId }
          : t
      )
    } else {
      // Crear nueva tarea
      const newTask: Task = {
        id: Date.now().toString(),
        name,
        description,
        date: selectedDate,
        status: "pending",
        urgency,
        deadline,
        administrativoId: selectedAdministrativoId,
      }
      updatedTasks = [...tasks, newTask]
      
      // Programar notificación para la nueva tarea
      schedulePushNotification(newTask);

      // Preparar mensaje de WhatsApp si hay directivo seleccionado
      if (selectedAdministrativoId) {
        const directivo = administrativos.find(admin => admin.id === selectedAdministrativoId);
        if (directivo?.celular) {
          const message = `Nueva actividad asignada:\nNombre: ${name}\nFecha: ${selectedDate}\nUrgencia: ${urgency}\n${description ? `Descripción: ${description}` : ''}`;
          const phoneNumber = directivo.celular.replace(/[\s-]/g, '');
          
          // Cerrar el modal de creación
          setModalVisible(false);
          
          // Esperar 1 segundo antes de mostrar el modal de confirmación
          setTimeout(() => {
            setWhatsappConfirmation({
              show: true,
              message,
              phoneNumber
            });
          }, 1000);
        }
      }
    }

    setTasks(updatedTasks)
    saveTasks(updatedTasks)
    updateMarkedDates(updatedTasks)
    closeForm()
  }

  const handleSendWhatsApp = async () => {
    const { message, phoneNumber } = whatsappConfirmation;
    const whatsappUrl = `whatsapp://send?phone=52${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          "Error",
          "No se pudo abrir WhatsApp. Asegúrate de que está instalado en el dispositivo."
        );
      }
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      Alert.alert(
        "Error",
        "Hubo un problema al intentar abrir WhatsApp."
      );
    }
    
    // Cerrar el modal de confirmación
    setWhatsappConfirmation(prev => ({ ...prev, show: false }));
  }

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "¿Estás seguro de eliminar esta tarea?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const updatedTasks = tasks.filter((t) => t.id !== id)
          setTasks(updatedTasks)
          saveTasks(updatedTasks)
          updateMarkedDates(updatedTasks)
        },
      },
    ])
  }

  const handleStatusChange = (task: Task) => {
    const statusOrder: TaskStatus[] = ["pending", "in_progress", "completed"]
    const currentIndex = statusOrder.indexOf(task.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    const confirmationMessages = {
      pending: "¿Deseas cambiar esta tarea a 'En Progreso'?",
      in_progress: "¿Deseas marcar esta tarea como 'Completada'?",
      completed: "¿Deseas reiniciar esta tarea a 'Pendiente'?"
    }

    Alert.alert(
      "Cambiar Estado",
      confirmationMessages[task.status],
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            const updatedTasks = tasks.map((t) =>
              t.id === task.id ? { ...t, status: nextStatus } : t
            )
            setTasks(updatedTasks)
            saveTasks(updatedTasks)
            updateMarkedDates(updatedTasks)

            // Mostrar notificación del cambio de estado
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Estado de Tarea Actualizado",
                body: `La tarea "${task.name}" ha sido cambiada a estado: ${statusLabels[nextStatus]}`,
                data: { taskId: task.id },
                sound: 'default',
              },
              trigger: { seconds: 1 },
            });
          }
        }
      ]
    )
  }

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.card, { 
      backgroundColor: colors.card,
      borderLeftWidth: 6,
      borderLeftColor: urgencyColors[item.urgency],
      marginHorizontal: 12
    }]}>
      <TouchableOpacity onPress={() => openForm(item)} style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: urgencyColors[item.urgency] + '33' } // Agregar transparencia
          ]}>
            <Text style={styles.urgencyText}>
              {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={[styles.cardDescription, { color: colors.text }]}>
            {item.description}
          </Text>
        )}

        {item.deadline && (
          <View style={styles.deadlineContainer}>
            <Text style={[styles.deadlineLabel, { color: colors.text }]}>
              Fecha límite:
            </Text>
            <Text style={[styles.deadlineText, { color: colors.text }]}>
              {new Date(item.deadline).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={[styles.deadlineLabel, { color: colors.text }]}>
              Hora límite:
            </Text>
            <Text style={[styles.deadlineText, { color: colors.text }]}>
              {new Date(item.deadline).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        {/* Mostrar el administrativo responsable */}
        {item.administrativoId && (
          <View style={styles.administrativoContainer}>
            <Text style={[styles.administrativoLabel, { color: colors.text }]}>
              Responsable:
            </Text>
            <Text style={[styles.administrativoText, { color: colors.text }]}>
              {administrativos.find(a => a.id === item.administrativoId)?.nombre || "No asignado"}
            </Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[styles.statusButton, {
              backgroundColor: statusColors[item.status],
              borderColor: statusColors[item.status]
            }]}
            onPress={() => handleStatusChange(item)}
          >
            <Text style={[styles.statusText, { color: colors.background }]}>
              {statusLabels[item.status]}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="custom"
        firstDay={1}
        locale="es"
        key={theme} // Forzar re-renderizado cuando cambia el tema
        theme={{
          calendarBackground: colors.background,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#fff",
          dayTextColor: colors.text,
          textDisabledColor: theme === 'light' ? '#c0c0c0' : '#64748b',
          monthTextColor: colors.text,
          todayBackgroundColor: 'transparent', // No usamos este valor, lo manejamos con customStyles
          todayTextColor: theme === 'light' ? '#1976d2' : '#90caf9',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
          arrowColor: colors.text,
          dotColor: theme === 'light' ? colors.primary : '#90caf9',
          dotStyle: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginTop: 2,
          },
          'stylesheet.day.single': {
            dot: {
              width: 6,
              height: 6,
              borderRadius: 3,
              marginTop: 2,
              opacity: 1,
            },
          },
        }}
      />
      <View style={styles.dayHeader}>
        <Text style={[styles.dayTitle, { color: colors.text }]}>
          {format(parseISO(selectedDate), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </Text>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <Text style={{ color: colors.text, textAlign: "center", marginTop: 40 }}>Sin tareas para este día</Text>
        }
      />

      {/* Floating + button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => openForm()}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '85%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTask ? "Editar Tarea" : "Nueva Tarea"}
            </Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Nombre de la tarea"
                placeholderTextColor={theme === 'dark' ? '#e9ecef' : '#6c757d'}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: 'top'
                }]}
                placeholder="Descripción"
                placeholderTextColor={theme === 'dark' ? '#e9ecef' : '#6c757d'}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Nivel de Urgencia</Text>
              <View style={styles.urgencyContainer}>
                {(['baja', 'media', 'alta'] as UrgencyLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.urgencyButton,
                      {
                        backgroundColor: urgency === level ? 
                          level === 'baja' ? '#4CAF50' :
                          level === 'media' ? '#FFC107' : '#F44336' :
                          colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setUrgency(level)}
                  >
                    <Text
                      style={[
                        styles.urgencyButtonText,
                        { 
                          color: urgency === level ? '#fff' : colors.text,
                          fontWeight: urgency === level ? 'bold' : 'normal'
                        },
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Fecha Límite
              </Text>
              <View style={styles.inputContainer}>
                <Pressable
                  onPress={showDatePickerAsync}
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <Text style={{ color: colors.text }}>
                    {deadline
                      ? new Date(deadline).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Selecciona fecha'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>
                Hora Límite
              </Text>
              <View style={styles.inputContainer}>
                <Pressable
                  onPress={showTimePickerAsync}
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <Text style={{ color: colors.text }}>
                    {deadline
                      ? new Date(deadline).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Selecciona hora'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>
                Administrativo
              </Text>
              <View style={styles.inputContainer}>
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <Pressable
                    style={[styles.pickerButton, { backgroundColor: colors.card }]}
                    onPress={() => setAdministrativoModalVisible(true)}
                  >
                    <Text style={{ color: colors.text }}>
                      {selectedAdministrativoId 
                        ? administrativos.find(a => a.id === selectedAdministrativoId)?.nombre || "Seleccionar administrativo" 
                        : "Seleccionar administrativo"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline ? new Date(deadline) : new Date()}
                  mode="date"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={onChangeDate}
                  locale="es-ES"
                  is24Hour={true}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={deadline ? new Date(deadline) : new Date()}
                  mode="time"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={onChangeTime}
                  locale="es-ES"
                  is24Hour={true}
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.secondary }]}
                  onPress={closeForm}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
              {editingTask && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: "#e74c3c" }]}
                  onPress={() => {
                    closeForm()
                    handleDelete(editingTask.id)
                  }}
                >
                  <Text style={styles.buttonText}>Eliminar Tarea</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para selección de administrativo */}
      <Modal visible={administrativoModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxWidth: '80%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Seleccionar Administrativo
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.adminOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedAdministrativoId("");
                  setAdministrativoModalVisible(false);
                }}
              >
                <Text style={[styles.adminOptionText, { color: colors.text }]}>Ninguno</Text>
              </TouchableOpacity>
              
              {administrativos.map((admin) => (
                <TouchableOpacity
                  key={admin.id}
                  style={[
                    styles.adminOption, 
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: selectedAdministrativoId === admin.id ? colors.primary + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setSelectedAdministrativoId(admin.id);
                    setAdministrativoModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.adminOptionText, 
                    { 
                      color: colors.text,
                      fontWeight: selectedAdministrativoId === admin.id ? 'bold' : 'normal'
                    }
                  ]}>
                    {admin.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.secondary, marginTop: 16 }]}
              onPress={() => setAdministrativoModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de WhatsApp */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={whatsappConfirmation.show}
        onRequestClose={() => setWhatsappConfirmation(prev => ({ ...prev, show: false }))}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Enviar mensaje de WhatsApp
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              ¿Deseas enviar un mensaje de WhatsApp al directivo con los detalles de la actividad?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setWhatsappConfirmation(prev => ({ ...prev, show: false }))}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={handleSendWhatsApp}
              >
                <Text style={styles.buttonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  urgencyButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardTextContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusButton: {
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 1,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deadlineContainer: {
    marginTop: 6,
    marginBottom: 8,
  },
  deadlineLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  deadlineText: {
    fontSize: 14,
    marginBottom: 4,
  },
  administrativoContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  administrativoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  administrativoText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: 'center',
    fontSize: 16
  },
  dayContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerButton: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalScrollContent: {
    paddingVertical: 20,
  },
  adminOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  adminOptionText: {
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%'
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center'
  },
  button: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonCancel: {
    backgroundColor: '#dc3545'
  },
  buttonConfirm: {
    backgroundColor: '#28a745'
  },
})
