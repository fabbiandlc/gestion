import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from "./styles";

const ActivityForm = ({ setModalVisible, editIndex, onSubmit, initialData }) => {
  const now = new Date();
  const [fadeAnim] = useState(new Animated.Value(0));

  const [activityName, setActivityName] = useState("");
  const [date, setDate] = useState(now);
  const [time, setTime] = useState(now);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState([{ id: Date.now().toString(), content: "" }]);
  const [showDateSelector, setShowDateSelector] = useState(null);
  const [showTimeSelector, setShowTimeSelector] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (initialData) {
      setActivityName(initialData.activityName);
      const date = new Date(initialData.activityDate);
      setDate(date);
      const time = new Date(initialData.activityTime);
      setTime(time);
      setNotes(initialData.notes?.length ? initialData.notes : [{ id: Date.now().toString(), content: "" }]);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Por favor ingrese un nombre para la actividad");
      return;
    }

    const activityDate = date.toISOString();
    const activityTime = time.toISOString();

    const filteredNotes = notes.filter(note => note.content.trim() !== "");

    onSubmit({
      activityName: activityName.trim(),
      activityDate,
      activityTime,
      notes: filteredNotes,
    });
  };

  const handleNoteChange = (id, text) => {
    setNotes(notes.map(note => note.id === id ? { ...note, content: text } : note));
  };

  const addNewNote = () => {
    setNotes([...notes, { id: Date.now().toString(), content: "" }]);
  };

  const removeNote = (id) => {
    if (notes.length > 1) {
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); 
    setDate(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
    >
      <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.formScrollView}>
          <View style={styles.formSection}>
            <View style={styles.formLabelContainer}>
              <Text style={styles.formLabel}>Nombre de la actividad</Text>
            </View>
            <TextInput
              style={styles.input}
              value={activityName}
              onChangeText={setActivityName}
              placeholder="Ej: Reunión con el equipo"
              placeholderTextColor="#888"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.formSection}>
            <View style={styles.formLabelContainer}>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.formIcon} />
              <Text style={styles.formLabel}>Fecha</Text>
            </View>
            <TouchableOpacity onPress={showDatepicker} style={styles.dateTimePickerButton}>
              <Text style={styles.dateTimePickerButtonText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="datePicker"
                value={date}
                mode={'date'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={onChangeDate}
                locale="es-ES"
                themeVariant="dark"
                style={{backgroundColor: '#121212'}}
                textColor="#ffffff"
              />
            )}
          </View>

          <View style={styles.formSection}>
            <View style={styles.formLabelContainer}>
              <Ionicons name="time-outline" size={20} color="#fff" style={styles.formIcon} />
              <Text style={styles.formLabel}>Hora</Text>
            </View>
            <TouchableOpacity onPress={showTimepicker} style={styles.dateTimePickerButton}>
              <Text style={styles.dateTimePickerButtonText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                testID="timePicker"
                value={time}
                mode={'time'}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
                locale="es-ES"
                themeVariant="dark"
                style={{backgroundColor: '#121212'}}
                textColor="#ffffff"
              />
            )}
          </View>

          <View style={styles.formSection}>
            <View style={styles.formLabelContainer}>
              <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.formIcon} />
              <Text style={styles.formLabel}>Notas</Text>
            </View>
            {notes.map((note, index) => (
              <View key={note.id} style={styles.noteContainer}>
                {notes.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeNoteButton} 
                    onPress={() => removeNote(note.id)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder={`Nota ${index + 1}`}
                  placeholderTextColor="#888"
                  value={note.content}
                  onChangeText={(text) => handleNoteChange(note.id, text)}
                  textAlignVertical="top"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addNoteButton} onPress={addNewNote}>
              <Text style={styles.addNoteButtonText}>+ Agregar otra nota</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.formButtonContainer}>
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formButton, styles.saveButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default ActivityForm;