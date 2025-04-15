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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { v4 as uuidv4 } from "uuid";
import { fetchAll } from "./Database"; // Import fetchAll to reload data

const DocenteForm = ({
  setModalVisible,
  editIndex,
  setEditIndex,
  docentes,
  setDocentes,
}) => {
  const [formData, setFormData] = useState({
    id: uuidv4(),
    nombre: "",
    apellido: "",
    email: "",
    materias: [],
    grupos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editIndex !== null && docentes[editIndex]) {
      setFormData({
        ...docentes[editIndex],
        updatedAt: new Date().toISOString(),
      });
    } else {
      setFormData({
        id: uuidv4(),
        nombre: "",
        apellido: "",
        email: "",
        materias: [],
        grupos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editIndex, docentes]);

  const handleSave = async () => {
    if (isSaving || !formData.nombre.trim()) {
      if (!formData.nombre.trim()) {
        alert("Por favor completa los campos obligatorios: Nombre");
      }
      return;
    }

    setIsSaving(true);
    try {
      let updatedDocentes = [...docentes];

      if (editIndex !== null) {
        updatedDocentes[editIndex] = formData;
      } else {
        updatedDocentes.push(formData);
      }

      // Update via context and reload from database
      await setDocentes(updatedDocentes);
      const freshDocentes = await fetchAll("Docentes");
      setDocentes(freshDocentes); // Sync with database

      setModalVisible(false);
      setEditIndex(null);

      setFormData({
        id: uuidv4(),
        nombre: "",
        apellido: "",
        email: "",
        materias: [],
        grupos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving docente:", error);
      alert("Hubo un error al guardar el docente. Por favor, intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
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
            {editIndex !== null ? "Editar Docente" : "Nuevo Docente"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Ingresa el nombre"
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={formData.apellido}
            onChangeText={(text) => setFormData({ ...formData, apellido: text })}
            placeholder="Ingresa el apellido"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="ejemplo@institucion.edu"
            keyboardType="email-address"
            autoCapitalize="none"
          />

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
            style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Text>
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
  disabledButton: {
    backgroundColor: "#aaa",
  },
});

export default DocenteForm;