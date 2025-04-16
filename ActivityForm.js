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
import { Picker } from "@react-native-picker/picker";

const TEXT_COLOR = "#FFFFFF";
const PRIMARY_COLOR = "#4A90E2";
const BACKGROUND_COLOR = "#121212";
const CARD_COLOR = "#1E1E1E";
const PICKER_ITEM_COLOR = "#000000";
const PICKER_BACKGROUND = "#2A2A2A";

const ActivityForm = ({ setModalVisible, editIndex, onSubmit, initialData }) => {
  const now = new Date();
  const [fadeAnim] = useState(new Animated.Value(0));

  const [activityName, setActivityName] = useState("");
  const [day, setDay] = useState(now.getDate().toString());
  const [month, setMonth] = useState(now.getMonth().toString());
  const [year, setYear] = useState(now.getFullYear().toString());
  const [hour, setHour] = useState((now.getHours() % 12 || 12).toString().padStart(2, "0"));
  const [minute, setMinute] = useState(now.getMinutes().toString().padStart(2, "0"));
  const [amPm, setAmPm] = useState(now.getHours() >= 12 ? "PM" : "AM");
  const [notes, setNotes] = useState([{ id: Date.now().toString(), content: "" }]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { label: "Enero", value: "0" },
    { label: "Febrero", value: "1" },
    { label: "Marzo", value: "2" },
    { label: "Abril", value: "3" },
    { label: "Mayo", value: "4" },
    { label: "Junio", value: "5" },
    { label: "Julio", value: "6" },
    { label: "Agosto", value: "7" },
    { label: "Septiembre", value: "8" },
    { label: "Octubre", value: "9" },
    { label: "Noviembre", value: "10" },
    { label: "Diciembre", value: "11" },
  ];
  const years = Array.from({ length: 10 }, (_, i) => (now.getFullYear() + i).toString());
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

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
      setDay(date.getDate().toString());
      setMonth(date.getMonth().toString());
      setYear(date.getFullYear().toString());
      const time = new Date(initialData.activityTime);
      const hours12 = time.getHours() % 12 || 12;
      setHour(hours12.toString().padStart(2, "0"));
      setMinute(time.getMinutes().toString().padStart(2, "0"));
      setAmPm(time.getHours() >= 12 ? "PM" : "AM");
      setNotes(initialData.notes?.length ? initialData.notes : [{ id: Date.now().toString(), content: "" }]);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Por favor ingrese un nombre para la actividad");
      return;
    }

    let hours24 = parseInt(hour, 10);
    if (amPm === "PM" && hours24 < 12) hours24 += 12;
    if (amPm === "AM" && hours24 === 12) hours24 = 0;

    const activityDate = new Date(parseInt(year), parseInt(month), parseInt(day)).toISOString();
    const activityTime = new Date(parseInt(year), parseInt(month), parseInt(day), hours24, parseInt(minute)).toISOString();

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

  const styles = {
    modalContainer: {
      flex: 1,
      backgroundColor: BACKGROUND_COLOR,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    formScrollView: {
      flexGrow: 1,
      paddingBottom: 30,
    },
    formLabel: {
      color: TEXT_COLOR,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 20,
    },
    input: {
      backgroundColor: CARD_COLOR,
      color: TEXT_COLOR,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      marginBottom: 12,
    },
    pickerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    pickerContainer: {
      flex: 1,
      backgroundColor: PICKER_BACKGROUND,
      borderRadius: 14,
      marginHorizontal: 5,
      overflow: "hidden",
    },
    picker: {
      color: TEXT_COLOR,
      height: 150,
    },
    noteContainer: {
      marginBottom: 15,
    },
    noteInput: {
      backgroundColor: CARD_COLOR,
      color: TEXT_COLOR,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      minHeight: 90,
      textAlignVertical: "top",
    },
    addNoteButton: {
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      marginTop: 10,
    },
    addNoteButtonText: {
      color: TEXT_COLOR,
      fontSize: 16,
      fontWeight: "600",
    },
    formButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#333",
    },
    formButton: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      marginHorizontal: 6,
    },
    cancelButton: {
      backgroundColor: "#3A3A3A",
    },
    saveButton: {
      backgroundColor: PRIMARY_COLOR,
    },
    formButtonText: {
      color: TEXT_COLOR,
      fontSize: 16,
      fontWeight: "600",
    },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
    >
      <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.formScrollView}>
          <Text style={styles.formLabel}>Nombre de la actividad</Text>
          <TextInput
            style={styles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="Ej: Reunión con el equipo"
            placeholderTextColor="#888"
          />

          <Text style={styles.formLabel}>Fecha</Text>
          <View style={styles.pickerRow}>
            {[day, month, year].map((val, idx) => (
              <View key={idx} style={styles.pickerContainer}>
                <Picker
                  selectedValue={idx === 0 ? day : idx === 1 ? month : year}
                  onValueChange={idx === 0 ? setDay : idx === 1 ? setMonth : setYear}
                  style={styles.picker}
                  dropdownIconColor={TEXT_COLOR}
                  itemStyle={{ color: PICKER_ITEM_COLOR }}
                >
                  {(idx === 0 ? days : idx === 1 ? months : years).map((item, i) => {
                    const label = idx === 1 ? item.label : item;
                    const value = idx === 1 ? item.value : item;
                    return <Picker.Item key={i} label={label} value={value} />;
                  })}
                </Picker>
              </View>
            ))}
          </View>

          <Text style={styles.formLabel}>Hora</Text>
          <View style={styles.pickerRow}>
            {[hour, minute, amPm].map((val, idx) => (
              <View key={idx} style={styles.pickerContainer}>
                <Picker
                  selectedValue={val}
                  onValueChange={idx === 0 ? setHour : idx === 1 ? setMinute : setAmPm}
                  style={styles.picker}
                  dropdownIconColor={TEXT_COLOR}
                  itemStyle={{ color: PICKER_ITEM_COLOR }}
                >
                  {(idx === 0 ? hours : idx === 1 ? minutes : ["AM", "PM"]).map((item, i) => (
                    <Picker.Item key={i} label={item} value={item} />
                  ))}
                </Picker>
              </View>
            ))}
          </View>

          <Text style={styles.formLabel}>Notas</Text>
          {notes.map((note, index) => (
            <View key={note.id} style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                multiline
                placeholder={`Nota ${index + 1}`}
                placeholderTextColor="#888"
                value={note.content}
                onChangeText={(text) => handleNoteChange(note.id, text)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addNoteButton} onPress={addNewNote}>
            <Text style={styles.addNoteButtonText}>+ Agregar otra nota</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.formButtonContainer}>
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.formButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formButton, styles.saveButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.formButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default ActivityForm;
