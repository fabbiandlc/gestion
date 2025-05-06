import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { v4 as uuidv4 } from "uuid";
import { useDataContext } from "./DataContext"; // Adjust path as needed

const DirectivoForm = ({
  setModalVisible,
  editIndex,
  setEditIndex,
  directivos,
  setDirectivos,
}) => {
  const { setDirectivos: updateDirectivos } = useDataContext();
  const [formData, setFormData] = useState({
    id: uuidv4(),
    nombre: "",
    rol: "", // Changed from 'puesto' to 'rol'
    generoFemenino: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Load data if in edit mode
  useEffect(() => {
    if (editIndex !== null && directivos[editIndex]) {
      setFormData({
        ...directivos[editIndex],
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editIndex, directivos]);

  // Handle form save
  const handleSave = async () => {
    // Basic validation
    if (!formData.nombre.trim()) {
      alert("Por favor completa el campo obligatorio: Nombre");
      return;
    }
    if (!formData.rol) {
      alert("Por favor selecciona un rol");
      return;
    }

    // Check if the role is already assigned
    const isRoleTaken = directivos.some(
      (d, index) =>
        d.rol === formData.rol &&
        (editIndex === null || index !== editIndex)
    );
    if (isRoleTaken) {
      alert(`El rol ${formData.rol} ya está asignado a otro directivo.`);
      return;
    }

    try {
      let updatedDirectivos = [...directivos];
      if (editIndex !== null) {
        // Update existing directivo
        updatedDirectivos[editIndex] = formData;
      } else {
        // Add new directivo
        updatedDirectivos.push({
          ...formData,
          id: uuidv4(),
        });
      }

      // Update context and database via DataContext
      await updateDirectivos(updatedDirectivos);
      setModalVisible(false);
      setEditIndex(null);
    } catch (error) {
      console.error("Error saving directivo:", error);
      alert("Error al guardar el directivo");
    }
  };

  // Close the modal
  const handleClose = () => {
    setModalVisible(false);
    setEditIndex(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.centeredView}
    >
      <View style={styles.modalView}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editIndex !== null ? "Editar Directivo" : "Nuevo Directivo"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Nombre del directivo"
            placeholderTextColor="#AAAAAA"
          />

          <Text style={styles.label}>Rol *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.rol}
              style={styles.picker}
              onValueChange={(itemValue) =>
                setFormData({ ...formData, rol: itemValue })
              }
            >
              <Picker.Item label="Selecciona un rol..." value="" />
              <Picker.Item label="Director" value="Director" />
              <Picker.Item label="Subdirector Académico" value="Subdirector Académico" />
            </Picker>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Usar pronombre femenino</Text>
            <Switch
              value={formData.generoFemenino}
              onValueChange={(value) =>
                setFormData({ ...formData, generoFemenino: value })
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={formData.generoFemenino ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>

          <View style={styles.formFooter}>
            <Text style={styles.requiredText}>* Campos obligatorios</Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#252525",
    borderRadius: 10,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#1E1E1E",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
    backgroundColor: "#1E1E1E",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formFooter: {
    marginTop: 10,
    marginBottom: 20,
  },
  requiredText: {
    color: "#AAAAAA",
    fontSize: 14,
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333333",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#AAAAAA",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#fff",
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "500",
  },
});

export default DirectivoForm;