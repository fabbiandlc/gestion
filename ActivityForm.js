import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { styles } from "./styles";

const ActivityForm = ({ setModalVisible, editIndex, onSubmit, initialData }) => {
  // Estados para los campos del formulario
  const [activityName, setActivityName] = useState("");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("0");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [notes, setNotes] = useState([{ id: Date.now().toString(), content: "" }]);

  // Generar opciones para los pickers
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
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString());
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Cargar datos iniciales si estamos editando
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

  // Manejar envío del formulario
  const handleSubmit = () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Por favor ingrese un nombre para la actividad");
      return;
    }

    // Convertir hora AM/PM a 24 horas
    let hours24 = parseInt(hour, 10);
    if (amPm === "PM" && hours24 < 12) hours24 += 12;
    if (amPm === "AM" && hours24 === 12) hours24 = 0;

    // Crear objetos Date para fecha y hora
    const activityDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10),
      parseInt(day, 10)
    ).toISOString();

    const activityTime = new Date(
      parseInt(year, 10),
      parseInt(month, 10),
      parseInt(day, 10),
      hours24,
      parseInt(minute, 10)
    ).toISOString();

    // Filtrar notas vacías
    const filteredNotes = notes.filter(note => note.content.trim() !== "");

    // Llamar a la función onSubmit con los datos del formulario
    onSubmit({
      activityName: activityName.trim(),
      activityDate,
      activityTime,
      notes: filteredNotes,
    });
  };

  // Manejar cambios en las notas
  const handleNoteChange = (id, text) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content: text } : note
    ));
  };

  // Agregar nueva nota
  const addNewNote = () => {
    setNotes([...notes, { id: Date.now().toString(), content: "" }]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        <ScrollView contentContainerStyle={styles.formScrollView}>
          <Text style={styles.formLabel}>Nombre de la actividad</Text>
          <TextInput
            style={styles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="Ej: Reunión con el equipo"
          />

          <Text style={styles.formLabel}>Fecha</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={day}
                onValueChange={setDay}
              >
                {days.map(d => (
                  <Picker.Item key={`day-${d}`} label={d} value={d} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={month}
                onValueChange={setMonth}
              >
                {months.map(m => (
                  <Picker.Item key={`month-${m.value}`} label={m.label} value={m.value} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
              >
                {years.map(y => (
                  <Picker.Item key={`year-${y}`} label={y} value={y} />
                ))}
              </Picker>
            </View>
          </View>

          <Text style={styles.formLabel}>Hora</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={hour}
                onValueChange={setHour}
              >
                {hours.map(h => (
                  <Picker.Item key={`hour-${h}`} label={h} value={h} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={minute}
                onValueChange={setMinute}
              >
                {minutes.map(m => (
                  <Picker.Item key={`minute-${m}`} label={m} value={m} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={amPm}
                onValueChange={setAmPm}
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>

          <Text style={styles.formLabel}>Notas</Text>
          {notes.map((note, index) => (
            <View key={note.id} style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                multiline
                placeholder={`Nota ${index + 1}`}
                value={note.content}
                onChangeText={(text) => handleNoteChange(note.id, text)}
                onSubmitEditing={addNewNote}
              />
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addNoteButton} 
            onPress={addNewNote}
          >
            <Text style={styles.addNoteButtonText}>+ Agregar otra nota</Text>
          </TouchableOpacity>
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
      </View>
    </KeyboardAvoidingView>
  );
};

export default ActivityForm;