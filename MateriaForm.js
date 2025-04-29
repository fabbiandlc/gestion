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

const MateriaForm = ({
  setModalVisible,
  editIndex,
  setEditIndex,
  materias,
  setMaterias,
}) => {
  const [formData, setFormData] = useState({
    id: Date.now(),
    nombre: "",
    horasSemana: "",
    creditos: "",
    semestre: "", // Mantenemos en la estructura de datos pero quitamos el campo visual
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (editIndex !== null && materias[editIndex]) {
      setFormData({
        ...materias[editIndex],
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editIndex, materias]);

  // Manejar el guardado del formulario
  const handleSave = () => {
    // Validación básica
    if (!formData.nombre.trim()) {
      alert("Por favor completa el campo obligatorio: Nombre");
      return;
    }

    let updatedMaterias = [...materias];

    if (editIndex !== null) {
      // Actualizar materia existente
      updatedMaterias[editIndex] = formData;
    } else {
      // Agregar nueva materia
      updatedMaterias.push({
        ...formData,
        id: Date.now(), // Generar un nuevo ID
      });
    }

    setMaterias(updatedMaterias);
    setModalVisible(false);
    setEditIndex(null);
  };

  // Cerrar el modal
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
            {editIndex !== null ? "Editar Materia" : "Nueva Materia"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Nombre de la materia *</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Nombre de la materia"
            placeholderTextColor="#AAAAAA"
          />

          {/* Eliminamos el campo de semestre visual pero mantenemos la propiedad en el formData */}

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
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Matches COLORS.modalOverlay
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
    borderBottomColor: "#333333", // Matches COLORS.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // Matches COLORS.text
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
    color: "#FFFFFF", // Matches COLORS.text
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333", // Matches COLORS.border
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#1E1E1E", // Matches COLORS.inputBg
    color: "#FFFFFF", // Matches COLORS.text
  },
  formFooter: {
    marginTop: 10,
    marginBottom: 20,
  },
  requiredText: {
    color: "#AAAAAA", // Matches COLORS.textSecondary
    fontSize: 14,
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#333333", // Matches COLORS.border
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333333", // Matches COLORS.border (consistent with DocenteForm)
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#AAAAAA", // Matches COLORS.textSecondary
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

export default MateriaForm;