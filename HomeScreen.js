import React, { useState, useContext, useCallback, memo } from "react";
import {
  ScrollView,
  Modal,
  Text,
  TouchableOpacity,
  View,
  Alert,
  SafeAreaView,
} from "react-native";
import { ActivitiesContext } from "./ActivitiesContext";
import { useDataContext } from "./DataContext";
import ActivityForm from "./ActivityForm";
import { styles } from "./styles";
import { v4 as uuidv4 } from "uuid";
import Ionicons from "react-native-vector-icons/Ionicons";
import CalendarioWrapper from "./Calendario";

const ActionButton = memo(({ onPress, style, children }) => (
  <TouchableOpacity style={[styles.actionButton, style]} onPress={onPress} activeOpacity={0.7}>
    <Text style={style === styles.deleteButton ? styles.buttonText : styles.saveButtonText}>{children}</Text>
  </TouchableOpacity>
));

const ActivitySummary = ({ activity, onClose }) => {
  const notes = Array.isArray(activity.notes) ? activity.notes : [];

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.summaryTitle}>{activity.activityName}</Text>
        <View style={styles.summaryDateTimeContainer}>
          <Text style={styles.summaryLabel}>Fecha y Hora</Text>
          <Text style={styles.summaryDateTime}>
            {new Date(activity.activityDate).toLocaleDateString()} -{" "}
            {new Date(activity.activityTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <ScrollView
          style={styles.summaryScrollView}
          showsVerticalScrollIndicator={false}
        >
          {notes.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Notas</Text>
              {notes.map((note) => (
                <View key={note.id} style={styles.summaryNoteContainer}>
                  <Text style={styles.summaryNoteText}>{note.content}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.summaryCloseButton} onPress={onClose}>
          <Text style={styles.saveButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ActivityItem = memo(
  ({ activity, onEdit, onDelete, onViewSummary, index }) => {
    const listItems = Array.isArray(activity.notes)
      ? activity.notes.filter((note) => note.content.trim() !== "")
      : [];
    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={styles.listItemContent}
          onPress={() => onViewSummary(activity)}
        >
          <Text style={styles.listItemTime}>
            {new Date(activity.activityTime).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View style={styles.listItemDetails}>
            <Text style={styles.listItemTitle}>{activity.activityName}</Text>
            {listItems.length > 0 && (
              <Text style={styles.listItemNotes}>
                Notas: {listItems.length}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.listItemButtons}>
          <ActionButton
            style={styles.editButton}
            onPress={() => onEdit(index)}
          >
            Editar
          </ActionButton>
          <ActionButton
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            Eliminar
          </ActionButton>
        </View>
      </View>
    );
  }
);

const HomeScreen = () => {
  const { activities, setActivities } = useContext(ActivitiesContext);
  const { deleteItem } = useDataContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.activityDate);
    return (
      activityDate.getFullYear() === selectedDate.getFullYear() &&
      activityDate.getMonth() === selectedDate.getMonth() &&
      activityDate.getDate() === selectedDate.getDate()
    );
  });

  const handleEdit = useCallback((index) => {
    setEditIndex(index);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (index) => {
      Alert.alert(
        "Eliminar Actividad",
        "¿Estás seguro de que deseas eliminar esta actividad?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            onPress: async () => {
              try {
                const activityId = activities[index].id;
                await deleteItem("Activities", activityId);
                setActivities((prev) => {
                  const newActivities = prev.filter((_, idx) => idx !== index);
                  return newActivities;
                });
                if (selectedActivity && selectedActivity.id === activityId) {
                  setSummaryModalVisible(false);
                  setSelectedActivity(null);
                }
              } catch (error) {
                console.error("Error al eliminar la actividad:", error);
                Alert.alert("Error", "No se pudo eliminar la actividad");
              }
            },
          },
        ]
      );
    },
    [activities, deleteItem, setActivities, selectedActivity]
  );

  const handleViewSummary = useCallback(
    (activity) => {
      setSelectedActivity({
        ...activity,
        notes: Array.isArray(activity.notes) ? activity.notes : [],
      });
      setSummaryModalVisible(true);
    },
    []
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditIndex(null);
  }, []);

  const handleAddActivity = useCallback(() => {
    setEditIndex(null);
    setModalVisible(true);
  }, []);

  const handleFormSubmit = useCallback(
    (activityData) => {
      const newActivity = {
        id: editIndex !== null ? activities[editIndex].id : uuidv4(),
        ...activityData,
        notes: Array.isArray(activityData.notes) ? activityData.notes : [],
        createdAt:
          editIndex !== null
            ? activities[editIndex].createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editIndex !== null) {
        setActivities((prev) =>
          prev.map((act, idx) => (idx === editIndex ? newActivity : act))
        );
      } else {
        setActivities((prev) => [...prev, newActivity]);
      }

      // Redirect to the activity's date
      const activityDate = new Date(activityData.activityDate);
      setSelectedDate(activityDate);

      setModalVisible(false);
      setEditIndex(null);
    },
    [editIndex, activities, setActivities]
  );

  const handlePreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  }, []);

  const handleCalendarDayPress = useCallback((day) => {
    const [year, month, date] = day.dateString.split("-").map(Number);
    const selected = new Date(year, month - 1, date);
    setSelectedDate(selected);
    setCalendarModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <TouchableOpacity onPress={handlePreviousDay}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.dateHeaderText}>
          {selectedDate.toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <TouchableOpacity onPress={handleNextDay}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarIcon}
          onPress={() => setCalendarModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.activitiesContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              index={activities.findIndex((act) => act.id === activity.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewSummary={handleViewSummary}
            />
          ))
        ) : (
          <Text style={styles.noActivitiesText}>
            No hay actividades para este día
          </Text>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddActivity}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={32} color="#000000" />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <ActivityForm
          setModalVisible={setModalVisible}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          onSubmit={handleFormSubmit}
          initialData={
            editIndex !== null
              ? {
                  ...activities[editIndex],
                  notes: Array.isArray(activities[editIndex].notes)
                    ? activities[editIndex].notes
                    : [],
                }
              : undefined
          }
        />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={summaryModalVisible}
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        {selectedActivity && (
          <ActivitySummary
            activity={selectedActivity}
            onClose={() => setSummaryModalVisible(false)}
          />
        )}
      </Modal>
      <Modal
        animationType="slide"
        transparent={false}
        visible={calendarModalVisible}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setCalendarModalVisible(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderText}>Calendario</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCalendarModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarModalContent}>
            <CalendarioWrapper onDayPress={handleCalendarDayPress} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default memo(HomeScreen);