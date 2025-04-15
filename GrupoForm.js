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
import { insert, update } from "./Database.js"; // Assuming these exist
import { v4 as uuidv4 } from "uuid";

const GrupoForm = ({
  setModalVisible,
  editIndex,
  setEditIndex,
  grupos,
  setGrupos,
  docentes,
  materias,
}) => {
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    turno: "Matutino",
    materias: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (editIndex !== null && grupos[editIndex]) {
      setFormData({
        ...grupos[editIndex],
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Reset form for new group
      setFormData({
        id: uuidv4(), // Unique ID for new groups
        nombre: "",
        turno: "Matutino",
        materias: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editIndex, grupos]);

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert("Por favor completa el campo obligatorio: Identificador del grupo");
      return;
    }

    if (isNaN(formData.nombre) || !/^\d{3}$/.test(formData.nombre)) {
      alert("El identificador del grupo debe ser un número de 3 dígitos (ej. 201, 402)");
      return;
    }

    // Check for duplicate nombre in grupos
    const isDuplicate = grupos.some(
      (grupo, idx) => grupo.nombre === formData.nombre && idx !== editIndex
    );
    if (isDuplicate) {
      alert("Ya existe un grupo con este identificador.");
      return;
    }

    try {
      let updatedGrupos = [...grupos];

      if (editIndex !== null) {
        // Update existing group
        await update("Grupos", formData, formData.id);
        updatedGrupos[editIndex] = formData;
      } else {
        // Insert new group
        await insert("Grupos", formData);
        updatedGrupos.push(formData);
      }

      setGrupos(updatedGrupos);
      setModalVisible(false);
      setEditIndex(null);
    } catch (error) {
      console.error("Error saving grupo:", error);
      alert("Hubo un error al guardar el grupo. Por favor, intenta de nuevo.");
    }
  };

  const toggleTurno = () => {
    setFormData({
      ...formData,
      turno: formData.turno === "Matutino" ? "Vespertino" : "Matutino",
    });
  };

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
            {editIndex !== null ? "Editar Grupo" : "Nuevo Grupo"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={styles.label}>Identificador del grupo *</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Ej. 201, 202, 401"
            keyboardType="numeric"
            maxLength={3}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Turno</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Matutino</Text>
              <Switch
                value={formData.turno === "Vespertino"}
                onValueChange={toggleTurno}
                trackColor={{ false: "#007BFF", true: "#007BFF" }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>Vespertino</Text>
            </View>
          </View>

          <View style={styles.formFooter}>
            <Text style={styles.requiredText}>* Campo obligatorio</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 5,
  },
  switchLabel: {
    fontSize: 14,
    marginHorizontal: 10,
    color: "#333",
  },
  formFooter: {
    marginTop: 10,
    marginBottom: 20,
  },
  requiredText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007BFF",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default GrupoForm;