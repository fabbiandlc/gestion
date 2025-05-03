import React, { useContext, useMemo, useCallback, memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { ActivitiesContext } from "./ActivitiesContext";
import { stylesCalendar } from "./stylesCalendar";
import { Ionicons } from "react-native-vector-icons";

// Configuración del calendario en español
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const CALENDAR_THEME = {
  calendarBackground: "#121212",
  todayTextColor: "#FFFFFF",
  dayTextColor: "#FFFFFF",
  textDisabledColor: "#888888",
  monthTextColor: "#FFFFFF",
  arrowColor: "#FFFFFF",
  dotColor: "#FFFFFF", // Default dot color, overridden in markedDates
  selectedDayBackgroundColor: "#252525",
  selectedDayTextColor: "#FFFFFF",
};

const ActivityItem = memo(({ activity, onEdit, onDelete }) => (
  <View style={stylesCalendar.activityItem}>
    <View style={stylesCalendar.activityTextContainer}>
      <Text style={stylesCalendar.activityName}>{activity.activityName}</Text>
      <Text style={stylesCalendar.activityTime}>
        {new Date(activity.activityTime).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
    <View style={stylesCalendar.activityButtons}>
      <TouchableOpacity
        onPress={() => onDelete(activity.id)}
        style={stylesCalendar.deleteButton}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={stylesCalendar.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
));

const ActivitiesList = memo(({ activities, date, onEdit, onDelete }) => {
  const formatDate = useCallback((dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <View style={stylesCalendar.activitiesContainer}>
      <Text style={stylesCalendar.activitiesTitle}>
        Actividades para {formatDate(date)}:
      </Text>
      <ScrollView style={stylesCalendar.activitiesList}>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <Text style={stylesCalendar.noActivitiesText}>
            No hay actividades para este día
          </Text>
        )}
      </ScrollView>
    </View>
  );
});

const Calendario = ({ onDayPress }) => {
  const {
    activities,
    setActivities,
    selectedDate,
    setSelectedDate,
    activitiesForDay,
  } = useContext(ActivitiesContext);

  const handleEditActivity = useCallback(
    (activity) => {
      const activityIndex = activities.findIndex(
        (item) => item.id === activity.id
      );
      if (activityIndex !== -1) {
        if (global.setEditIndex && global.setModalVisible) {
          global.setEditIndex(activityIndex);
          global.setModalVisible(true);
        } else {
          Alert.alert(
            "Editar Actividad",
            "Por favor, vaya a la pantalla principal para editar esta actividad."
          );
        }
      }
    },
    [activities]
  );

  const handleDeleteActivity = useCallback(
    (activityId) => {
      Alert.alert(
        "Eliminar Actividad",
        "¿Estás seguro de que deseas eliminar esta actividad?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            onPress: () => {
              const updatedActivities = activities.filter(
                (activity) => activity.id !== activityId
              );
              setActivities(updatedActivities);
            },
          },
        ]
      );
    },
    [activities, setActivities]
  );

  const markedDates = useMemo(() => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    const dates = activities.reduce((acc, activity) => {
      const activityDate = new Date(activity.activityDate);
      const year = activityDate.getFullYear();
      const month = String(activityDate.getMonth() + 1).padStart(2, "0");
      const day = String(activityDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      acc[dateString] = {
        marked: true,
        dotColor: "#FFFFFF", // White dot for days with activities
        selected: dateString === selectedDate,
        selectedColor: "#252525",
      };
      return acc;
    }, {
      [todayString]: {
        marked: true,
        dotColor: "red", // Red dot for current day
        selected: todayString === selectedDate,
        selectedColor: "#252525",
      },
    });

    return dates;
  }, [activities, selectedDate]);

  const handleDayPress = useCallback(
    (day) => {
      setSelectedDate(day.dateString);
      if (onDayPress) {
        onDayPress(day);
      }
    },
    [setSelectedDate, onDayPress]
  );

  return (
    <View style={stylesCalendar.container}>
      <Calendar
        markedDates={markedDates}
        markingType="dot"
        onDayPress={handleDayPress}
        theme={CALENDAR_THEME}
      />
      {selectedDate && (
        <ActivitiesList
          activities={activitiesForDay}
          date={selectedDate}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
        />
      )}
    </View>
  );
};

const CalendarioWrapper = ({ onDayPress }) => {
  const { activities } = useContext(ActivitiesContext);

  React.useEffect(() => {
    if (!global.activitiesForCalendar) {
      global.activitiesForCalendar = activities;
    }
  }, [activities]);

  return <Calendario onDayPress={onDayPress} />;
};

export default memo(CalendarioWrapper);