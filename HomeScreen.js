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

const ActionButton = memo(({ onPress, style, children }) => (
  <TouchableOpacity style={[styles.actionButton, style]} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.buttonText}>{children}</Text>
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
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ActivityCard = memo(
  ({ activity, onEdit, onDelete, onViewSummary, index }) => {
    const listItems = Array.isArray(activity.notes)
      ? activity.notes.filter((note) => note.content.trim() !== "")
      : [];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{activity.activityName}</Text>
        <Text style={styles.cardText}>
          Fecha: {new Date(activity.activityDate).toLocaleDateString("es-MX")}
        </Text>
        <Text style={styles.cardText}>
          Hora:{" "}
          {new Date(activity.activityTime).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {listItems.length > 0 && (
          <Text style={styles.cardText}>Notas: {listItems.length}</Text>
        )}
        <View style={styles.cardButtons}>
          <ActionButton
            style={styles.viewButton}
            onPress={() => onViewSummary(index)}
          >
            Resumen
          </ActionButton>
          <ActionButton style={styles.editButton} onPress={() => onEdit(index)}>
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
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

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
                // Call deleteItem from DataContext
                await deleteItem("Activities", activityId);
                // Update ActivitiesContext's activities state
                setActivities((prev) => {
                  const newActivities = prev.filter((_, idx) => idx !== index);
                  return newActivities;
                });
                // Close summary modal and clear selectedActivity if needed
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
    (index) => {
      setSelectedActivity({ ...activities[index], notes: Array.isArray(activities[index].notes) ? activities[index].notes : [] });
      setSummaryModalVisible(true);
    },
    [activities]
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
      setModalVisible(false);
      setEditIndex(null);
    },
    [editIndex, activities, setActivities]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.activitiesContainer} showsVerticalScrollIndicator={false}>
        {activities.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            index={index}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewSummary={handleViewSummary}
          />
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={handleAddActivity} activeOpacity={0.7}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
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
              ? { ...activities[editIndex], notes: Array.isArray(activities[editIndex].notes) ? activities[editIndex].notes : [] }
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
    </SafeAreaView>
  );
};

export default memo(HomeScreen);