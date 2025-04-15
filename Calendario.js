import React, { useContext, useMemo, useCallback, memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { ActivitiesContext } from "./ActivitiesContext";
import { stylesCalendar } from "./stylesCalendar";

// Configuración del calendario en español (sin cambios)
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
  calendarBackground: "#fff",
  todayTextColor: "#007BFF",
  dayTextColor: "#2d4150",
  textDisabledColor: "#d9e1e8",
  monthTextColor: "#007BFF",
  arrowColor: "#007BFF",
  dotColor: "#007BFF",
  selectedDayBackgroundColor: "#E8E8E8",
  selectedDayTextColor: "#2d4150",
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
        <Text style={stylesCalendar.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
));

const ActivitiesList = memo(({ activities, date, onEdit, onDelete }) => {
  const formatDate = useCallback((dateString) => {
    // Separar el string YYYY-MM-DD
    const [year, month, day] = dateString.split("-").map(Number);
    // Crear una fecha local sin influencia de zona horaria
    const date = new Date(year, month - 1, day); // Meses son 0-indexados
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

const Calendario = () => {
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
    const dates = {};
    activities.forEach((activity) => {
      const activityDate = new Date(activity.activityDate);
      const year = activityDate.getFullYear();
      const month = String(activityDate.getMonth() + 1).padStart(2, "0");
      const day = String(activityDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      dates[dateString] = {
        marked: true,
        dotColor: "#007BFF",
        selected: dateString === selectedDate,
        selectedColor: "#E8E8E8",
      };
    });
    return dates;
  }, [activities, selectedDate]);

  const handleDayPress = useCallback(
    (day) => {
      setSelectedDate(day.dateString);
    },
    [setSelectedDate]
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

const CalendarioWrapper = () => {
  const { activities } = useContext(ActivitiesContext);

  React.useEffect(() => {
    if (!global.activitiesForCalendar) {
      global.activitiesForCalendar = activities;
    }
  }, [activities]);

  return <Calendario />;
};

export default memo(CalendarioWrapper);