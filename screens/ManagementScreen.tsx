"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { commonStyles } from "../styles/theme";

const ManagementScreen = () => {
  const { colors, theme } = useTheme();
  const {
    docentes,
    materias,
    grupos,
    directivos,
    administrativos,
    addDocente,
    addMateria,
    addGrupo,
    addDirectivo,
    addAdministrativo,
    updateDocente,
    updateMateria,
    updateGrupo,
    updateDirectivo,
    updateAdministrativo,
    deleteDocente,
    deleteMateria,
    deleteGrupo,
    deleteDirectivo,
    deleteAdministrativo,
    clearDocentes,
    clearMaterias,
    clearGrupos,
    clearDirectivos,
    clearAdministrativos,
    setDocentes,
    setMaterias,
    setGrupos,
    setDirectivos,
    setAdministrativos,
  } = useData();

  const [activeTab, setActiveTab] = useState("docentes");
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [showExcelDataModal, setShowExcelDataModal] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [itemsFoundCount, setItemsFoundCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para formularios
  const [docenteForm, setDocenteForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    numeroEmpleado: "",
    materias: [] as { id: string; nombre: string; siglas: string }[],
  });
  const [materiaForm, setMateriaForm] = useState({ nombre: "", siglas: "" });
  const [grupoForm, setGrupoForm] = useState({ nombre: "", docenteId: "" });
  const [directivoForm, setDirectivoForm] = useState({
    nombre: "",
    rol: "Director",
    generoFemenino: false,
  });
  const [administrativoForm, setAdministrativoForm] = useState({
    nombre: "",
    celular: "",
    correo: "",
  });

  const resetForms = () => {
    setDocenteForm({
      nombre: "",
      apellido: "",
      email: "",
      numeroEmpleado: "",
      materias: [],
    });
    setMateriaForm({ nombre: "", siglas: "" });
    setGrupoForm({ nombre: "", docenteId: "" });
    setDirectivoForm({ nombre: "", rol: "Director", generoFemenino: false });
    setAdministrativoForm({ nombre: "", celular: "", correo: "" });
    setCurrentEditId(null);
    setIsEditing(false);
  };

  const handleAddItem = async () => {
    try {
      // Validación de campos requeridos según la pestaña activa
      if (activeTab === "docentes") {
        if (
          !docenteForm.nombre ||
          !docenteForm.apellido ||
          !docenteForm.email ||
          !docenteForm.numeroEmpleado
        ) {
          Alert.alert("Error", "Por favor complete todos los campos");
          return;
        }

        if (isEditing && currentEditId) {
          const result = await updateDocente(currentEditId, docenteForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al actualizar el docente"
            );
          } else {
            Alert.alert("Éxito", "Docente actualizado correctamente");
            resetForms();
            setModalVisible(false);
          }
        } else {
          const result = await addDocente(docenteForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al agregar el docente"
            );
          } else {
            Alert.alert("Éxito", "Docente agregado correctamente");
            resetForms();
            setModalVisible(false);
          }
        }
      } else if (activeTab === "materias") {
        if (!materiaForm.nombre || !materiaForm.siglas) {
          Alert.alert("Error", "Por favor complete todos los campos");
          return;
        }

        if (isEditing && currentEditId) {
          const result = await updateMateria(currentEditId, materiaForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al actualizar la materia"
            );
          } else {
            Alert.alert("Éxito", "Materia actualizada correctamente");
            resetForms();
            setModalVisible(false);
          }
        } else {
          const result = await addMateria(materiaForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al agregar la materia"
            );
          } else {
            Alert.alert("Éxito", "Materia agregada correctamente");
            resetForms();
            setModalVisible(false);
          }
        }
      } else if (activeTab === "grupos") {
        if (isEditing && currentEditId) {
          const result = await updateGrupo(currentEditId, grupoForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al actualizar el grupo"
            );
          } else {
            Alert.alert("Éxito", "Grupo actualizado correctamente");
            resetForms();
            setModalVisible(false);
          }
        } else {
          const result = await addGrupo(grupoForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert("Error", result?.error || "Error al agregar el grupo");
          } else {
            Alert.alert("Éxito", "Grupo agregado correctamente");
            resetForms();
            setModalVisible(false);
          }
        }
      } else if (activeTab === "directivos") {
        if (!directivoForm.nombre || !directivoForm.rol) {
          Alert.alert("Error", "Por favor complete todos los campos");
          return;
        }

        if (isEditing && currentEditId) {
          const result = await updateDirectivo(currentEditId, directivoForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al actualizar el directivo"
            );
          } else {
            Alert.alert("Éxito", "Directivo actualizado correctamente");
            resetForms();
            setModalVisible(false);
          }
        } else {
          const result = await addDirectivo(directivoForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al agregar el directivo"
            );
          } else {
            Alert.alert("Éxito", "Directivo agregado correctamente");
            resetForms();
            setModalVisible(false);
          }
        }
      } else if (activeTab === "administrativos") {
        if (
          !administrativoForm.nombre ||
          !administrativoForm.celular ||
          !administrativoForm.correo
        ) {
          Alert.alert("Error", "Por favor complete todos los campos");
          return;
        }

        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(administrativoForm.correo)) {
          Alert.alert(
            "Error",
            "Por favor ingrese un correo electrónico válido"
          );
          return;
        }

        if (isEditing && currentEditId) {
          const result = await updateAdministrativo(
            currentEditId,
            administrativoForm
          );
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al actualizar el administrativo"
            );
          } else {
            Alert.alert("Éxito", "Administrativo actualizado correctamente");
            resetForms();
            setModalVisible(false);
          }
        } else {
          const result = await addAdministrativo(administrativoForm);
          // Assuming success if no exception is thrown and result is not explicitly success: false
          if (result?.success === false) {
            Alert.alert(
              "Error",
              result?.error || "Error al agregar el administrativo"
            );
          } else {
            Alert.alert("Éxito", "Administrativo agregado correctamente");
            resetForms();
            setModalVisible(false);
          }
        }
      }
    } catch (error) {
      console.error("Error en handleAddItem:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado. Por favor, intente nuevamente."
      );
    }
  };

  const handleEditItem = (id: string) => {
    setIsEditing(true);
    setCurrentEditId(id);

    if (activeTab === "docentes") {
      const docente = docentes.find((d) => d.id === id);
      if (docente) {
        setDocenteForm({
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          numeroEmpleado: docente.numeroEmpleado,
          materias: docente.materias || [], // Ensure materias is always an array
        });
      }
    } else if (activeTab === "materias") {
      const materia = materias.find((m) => m.id === id);
      if (materia) {
        setMateriaForm({
          nombre: materia.nombre,
          siglas: materia.siglas,
        });
      }
    } else if (activeTab === "grupos") {
      const grupo = grupos.find((g) => g.id === id);
      if (grupo) {
        setGrupoForm({
          nombre: grupo.nombre,
          docenteId: grupo.docenteId,
        });
      }
    } else if (activeTab === "directivos") {
      const directivo = directivos.find((d) => d.id === id);
      if (directivo) {
        setDirectivoForm({
          nombre: directivo.nombre,
          rol: directivo.rol,
          generoFemenino: directivo.generoFemenino,
        });
      }
    } else if (activeTab === "administrativos") {
      const administrativo = administrativos.find((a) => a.id === id);
      if (administrativo) {
        setAdministrativoForm({
          nombre: administrativo.nombre,
          celular: administrativo.celular,
          correo: administrativo.correo,
        });
      }
    }

    setModalVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    // Determinar el tipo de elemento para el mensaje
    const itemType =
      activeTab === "docentes"
        ? "el docente"
        : activeTab === "materias"
        ? "la materia"
        : activeTab === "grupos"
        ? "el grupo"
        : activeTab === "directivos"
        ? "el directivo"
        : "el administrativo";

    Alert.alert(
      "Confirmar eliminación",
      `¿Está seguro de que desea eliminar ${itemType}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              let result;

              if (activeTab === "docentes") {
                result = await deleteDocente(id);
              } else if (activeTab === "materias") {
                result = await deleteMateria(id);
              } else if (activeTab === "grupos") {
                result = await deleteGrupo(id);
              } else if (activeTab === "directivos") {
                result = await deleteDirectivo(id);
              } else if (activeTab === "administrativos") {
                result = await deleteAdministrativo(id);
              }

              // Si no hay error explícito, asumimos que la operación fue exitosa
              if (!result?.error) {
                Alert.alert(
                  "Éxito",
                  `Se ha eliminado ${itemType} correctamente`
                );
              } else {
                throw new Error(
                  result.error || `Error al eliminar ${itemType}`
                );
              }
            } catch (error) {
              console.error(`Error al eliminar ${itemType}:`, error);
              Alert.alert(
                "Error",
                `Ocurrió un error al eliminar ${itemType}. Por favor, intente nuevamente.`
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllActiveTab = async () => {
    Alert.alert(
      "Confirmar",
      `¿Seguro que deseas eliminar todos los ${activeTab}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              let result;
              if (activeTab === "docentes") {
                clearDocentes();
                Alert.alert(
                  "Éxito",
                  `Se han eliminado todos los ${activeTab} correctamente`
                );
              } else if (activeTab === "materias") {
                result = await clearMaterias();
                if (result?.success) {
                  Alert.alert(
                    "Éxito",
                    `Se han eliminado todos los ${activeTab} correctamente`
                  );
                } else {
                  throw new Error(
                    result?.error || `Error al eliminar los ${activeTab}`
                  );
                }
              } else if (activeTab === "grupos") {
                clearGrupos();
                Alert.alert(
                  "Éxito",
                  `Se han eliminado todos los ${activeTab} correctamente`
                );
              } else if (activeTab === "directivos") {
                result = await clearDirectivos();
                if (result?.success) {
                  Alert.alert(
                    "Éxito",
                    `Se han eliminado todos los ${activeTab} correctamente`
                  );
                } else {
                  throw new Error(
                    result?.error || `Error al eliminar los ${activeTab}`
                  );
                }
              } else if (activeTab === "administrativos") {
                result = await clearAdministrativos();
                if (result?.success) {
                  Alert.alert(
                    "Éxito",
                    `Se han eliminado todos los ${activeTab} correctamente`
                  );
                } else {
                  throw new Error(
                    result?.error || `Error al eliminar los ${activeTab}`
                  );
                }
              }
            } catch (error) {
              console.error(`Error al eliminar los ${activeTab}:`, error);
              Alert.alert(
                "Error",
                `Ocurrió un error al eliminar los ${activeTab}. Por favor, intente nuevamente.`
              );
            }
          },
        },
      ]
    );
  };

  // Función para manejar la selección y procesamiento de archivos Excel
  const handlePickExcelFile = async () => {
    try {
      setLoadingFile(true);

      // Seleccionar cualquier tipo de archivo sin restricciones
      const result = await DocumentPicker.getDocumentAsync();

      // Verificar si se canceló la selección
      if (result.canceled) {
        setLoadingFile(false);
        return;
      }

      // Obtener el archivo seleccionado
      const asset = result.assets[0];

      // Verificar si el archivo es un Excel por su extensión
      const fileName = asset.name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        Alert.alert(
          "Error",
          "Por favor seleccione un archivo Excel (.xlsx o .xls)"
        );
        setLoadingFile(false);
        return;
      }

      try {
        // Leer el contenido del archivo
        const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convertir el contenido del archivo a un objeto de trabajo de Excel
        const workbook = XLSX.read(fileContent, { type: "base64" });

        // Procesar todas las hojas del archivo
        let allParsedData: any[] = [];

        // Iterar sobre todas las hojas del Excel
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          // Convertir la hoja a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          if (jsonData.length === 0) continue; // Saltar hojas vacías

          console.log(
            `Procesando hoja: ${sheetName}, filas: ${jsonData.length}`
          );

          // Procesar los datos según la pestaña activa
          let parsedData: any[] = [];

          if (activeTab === "docentes") {
            // Extraer información del docente directamente de la posición conocida
            // Basado en el formato específico del Excel del COBAEV
            let docenteInfo = null;

            // Buscar en todas las filas para encontrar "DOCENTE:"
            for (let i = 0; i < jsonData.length; i++) {
              for (let j = 0; j < jsonData[i].length; j++) {
                if (
                  typeof jsonData[i][j] === "string" &&
                  jsonData[i][j].trim() === "DOCENTE:"
                ) {
                  // En el formato COBAEV, el nombre está dos columnas a la derecha
                  if (j + 2 < jsonData[i].length && jsonData[i][j + 2]) {
                    const nombreCompleto = jsonData[i][j + 2];

                    // Extraer nombre y apellido
                    const partes = nombreCompleto.split(" ");
                    let nombre = "";
                    let apellido = "";

                    if (partes.length >= 3 && partes[0].includes("LIC.")) {
                      // Formato: "LIC. TERESA MARGARITA ABAD SANCHEZ"
                      nombre = partes.slice(1, 3).join(" "); // "TERESA MARGARITA"
                      apellido = partes.slice(3).join(" "); // "ABAD SANCHEZ"
                    } else if (
                      partes.length >= 3 &&
                      partes[0].includes("ING.")
                    ) {
                      // Formato: "ING. NOMBRE APELLIDO"
                      nombre = partes[1];
                      apellido = partes.slice(2).join(" ");
                    } else {
                      nombre = nombreCompleto;
                    }

                    // Extraer materias de la fila 7 (índice 6)
                    const filaMaterias = jsonData[6] || [];
                    const materias = filaMaterias
                      .filter(
                        (cell: any) =>
                          cell &&
                          typeof cell === "string" &&
                          cell.trim() !== "" &&
                          cell.trim() !== "ASIGNATURAS:" &&
                          !cell.trim().includes("ASIGNATURA")
                      )
                      .map((nombreMateria: string, idx: number) => ({
                        id: `materia_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}_${idx}`,
                        nombre: nombreMateria,
                        siglas: "",
                      }));

                    docenteInfo = {
                      id: `excel_docente_${Date.now()}`,
                      nombre: nombre,
                      apellido: apellido,
                      email: `${nombre
                        .toLowerCase()
                        .replace(/\s+/g, ".")}.${apellido
                        .toLowerCase()
                        .replace(/\s+/g, ".")}@cobaev.edu.mx`,
                      numeroEmpleado: "",
                      materias: materias,
                    };

                    break;
                  }
                }
              }
            }

            // Si no encontramos el docente con el método anterior, intentamos directamente con los índices
            // basados en el log que vimos
            if (
              jsonData.length > 5 &&
              jsonData[5].length > 10 &&
              typeof jsonData[5][10] === "string"
            ) {
              const nombreCompleto = jsonData[5][10];

              // Extraer nombre y apellido
              const partes = nombreCompleto.split(" ");
              let nombre = "";
              let apellido = "";

              if (partes.length >= 3 && partes[0].includes("LIC.")) {
                nombre = partes.slice(1, 3).join(" ");
                apellido = partes.slice(3).join(" ");
              } else {
                nombre = nombreCompleto;
              }

              // Buscar el número de empleado
              let numeroEmpleado = "";
              if (jsonData.length > 4 && jsonData[4].length > 4) {
                const empleadoText = jsonData[4][4];
                if (typeof empleadoText === "string") {
                  const match = empleadoText.match(/\d+/);
                  if (match) {
                    numeroEmpleado = match[0];
                  }
                }
              }

              // Extraer materias de la fila 7 (índice 6)
              const filaMaterias = jsonData[6] || [];
              const materias = filaMaterias
                .filter(
                  (cell: any) =>
                    cell &&
                    typeof cell === "string" &&
                    cell.trim() !== "" &&
                    cell.trim() !== "ASIGNATURAS:" &&
                    !cell.trim().includes("ASIGNATURA")
                )
                .map((nombreMateria: string, idx: number) => ({
                  id: `materia_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_${idx}`,
                  nombre: nombreMateria,
                  siglas: "",
                }));

              parsedData = [
                {
                  id: `excel_docente_${Date.now()}`,
                  nombre: nombre,
                  apellido: apellido,
                  email: `${nombre
                    .toLowerCase()
                    .replace(/\s+/g, ".")}.${apellido
                    .toLowerCase()
                    .replace(/\s+/g, ".")}@cobaev.edu.mx`,
                  numeroEmpleado: numeroEmpleado,
                  materias: materias,
                },
              ];
            } else {
              // Nueva búsqueda: enfocada en la columna K (índice 10) y siguientes de la fila 6
              let found = false;

              // Verificar si tenemos acceso a la fila 6 (índice 5)
              if (jsonData.length > 5) {
                // Empezar desde la columna K (índice 10)
                for (let j = 10; j < jsonData[5].length; j++) {
                  const cell = jsonData[5][j];
                  if (
                    typeof cell === "string" &&
                    (cell.includes("LIC.") ||
                      cell.includes("DR.") ||
                      cell.includes("DRA.") ||
                      cell.includes("MTRA.") ||
                      cell.includes("MTRO.") ||
                      cell.includes("ING."))
                  ) {
                    // Se asume que es un nombre de docente
                    const nombreCompleto = cell.trim();
                    const partes = nombreCompleto.split(" ");
                    let nombre = "";
                    let apellido = "";
                    if (
                      partes.length >= 3 &&
                      (partes[0].includes("LIC.") ||
                        partes[0].includes("ING.") ||
                        partes[0].includes("MTRO.") ||
                        partes[0].includes("MTRA.") ||
                        partes[0].includes("DR.") ||
                        partes[0].includes("DRA."))
                    ) {
                      nombre = partes.slice(1, 3).join(" ");
                      apellido = partes.slice(3).join(" ");
                    } else {
                      nombre = nombreCompleto;
                    }

                    // Extraer materias de la fila 7 (índice 6)
                    const filaMaterias = jsonData[6] || [];
                    const materias = filaMaterias
                      .filter(
                        (cell: any) =>
                          cell &&
                          typeof cell === "string" &&
                          cell.trim() !== "" &&
                          cell.trim() !== "ASIGNATURAS:" &&
                          !cell.trim().includes("ASIGNATURA")
                      )
                      .map((nombreMateria: string, idx: number) => ({
                        id: `materia_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}_${idx}`,
                        nombre: nombreMateria,
                        siglas: "",
                      }));

                    parsedData = [
                      {
                        id: `excel_docente_${Date.now()}`,
                        nombre: nombre,
                        apellido: apellido,
                        email: `${nombre
                          .toLowerCase()
                          .replace(/\s+/g, ".")}.${apellido
                          .toLowerCase()
                          .replace(/\s+/g, ".")}@cobaev.edu.mx`,
                        numeroEmpleado: "",
                        materias: materias,
                      },
                    ];
                    found = true;
                    break;
                  }
                }
              }

              if (!found) {
                Alert.alert(
                  "Información no encontrada",
                  "No se pudo encontrar información de docente en el archivo"
                );
                setLoadingFile(false);
                return;
              }
            }
          } else if (activeTab === "materias") {
            // Extraer información de materias del archivo
            let materiasInfo = [];

            // Buscar en todas las filas para encontrar "ASIGNATURAS:"
            for (let i = 0; i < jsonData.length; i++) {
              for (let j = 0; j < jsonData[i].length; j++) {
                if (
                  typeof jsonData[i][j] === "string" &&
                  jsonData[i][j].trim() === "ASIGNATURAS:"
                ) {
                  // En el formato COBAEV, el nombre de la materia está dos columnas a la derecha
                  if (
                    j + 2 < jsonData[i].length &&
                    jsonData[i][j + 2] &&
                    typeof jsonData[i][j + 2] === "string" &&
                    jsonData[i][j + 2].trim() !== ""
                  ) {
                    const nombreMateria = jsonData[i][j + 2];

                    // Generar siglas a partir del nombre de la materia
                    const palabras = nombreMateria.split(" ");
                    let siglas = "";

                    if (palabras.length > 1) {
                      // Tomar la primera letra de cada palabra para formar las siglas
                      siglas = palabras
                        .map((palabra) => palabra.charAt(0))
                        .join("");
                    } else {
                      // Si solo hay una palabra, tomar las primeras 3 letras
                      siglas = nombreMateria.substring(0, 3);
                    }

                    materiasInfo.push({
                      id: `excel_materia_${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}_${materiasInfo.length}`,
                      nombre: nombreMateria,
                      siglas: siglas,
                    });
                  }
                }
              }
            }

            // Si no encontramos materias con el método anterior, intentamos directamente con los índices
            // basados en el log que vimos (fila 6, columnas 2 y 11)
            if (materiasInfo.length === 0 && jsonData.length > 6) {
              // Verificar la columna 2 (índice 2)
              if (
                jsonData[6].length > 2 &&
                typeof jsonData[6][2] === "string" &&
                jsonData[6][2].trim() !== ""
              ) {
                const nombreMateria = jsonData[6][2];

                // Generar siglas
                const palabras = nombreMateria.split(" ");
                let siglas = palabras
                  .map((palabra) => palabra.charAt(0))
                  .join("");

                materiasInfo.push({
                  id: `excel_materia_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_0`,
                  nombre: nombreMateria,
                  siglas: siglas,
                });
              }

              // Verificar la columna 11 (índice 11)
              if (
                jsonData[6].length > 11 &&
                typeof jsonData[6][11] === "string" &&
                jsonData[6][11].trim() !== ""
              ) {
                const nombreMateria = jsonData[6][11];

                // Generar siglas
                const palabras = nombreMateria.split(" ");
                let siglas = palabras
                  .map((palabra) => palabra.charAt(0))
                  .join("");

                materiasInfo.push({
                  id: `excel_materia_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_1`,
                  nombre: nombreMateria,
                  siglas: siglas,
                });
              }
            }

            // Buscar en todo el documento por palabras clave que podrían ser materias
            if (materiasInfo.length === 0) {
              const materiasComunes = [
                "MATEMÁTICAS",
                "MATEMATICAS",
                "CALCULO",
                "CÁLCULO",
                "ÁLGEBRA",
                "ALGEBRA",
                "FÍSICA",
                "FISICA",
                "QUÍMICA",
                "QUIMICA",
                "BIOLOGÍA",
                "BIOLOGIA",
                "HISTORIA",
                "GEOGRAFÍA",
                "GEOGRAFIA",
                "ESPAÑOL",
                "ESPANOL",
                "INGLÉS",
                "INGLES",
                "INFORMÁTICA",
                "INFORMATICA",
                "PROGRAMACIÓN",
                "PROGRAMACION",
                "REDES",
                "HUMANIDADES",
                "FILOSOFÍA",
                "FILOSOFIA",
                "ÉTICA",
                "ETICA",
                "LITERATURA",
              ];

              for (let i = 0; i < jsonData.length; i++) {
                for (let j = 0; j < jsonData[i].length; j++) {
                  const cell = jsonData[i][j];
                  if (typeof cell === "string") {
                    // Verificar si la celda contiene alguna de las materias comunes
                    for (const materia of materiasComunes) {
                      if (
                        cell.includes(materia) &&
                        !cell.includes("ASIGNATURAS:")
                      ) {
                        // Evitar duplicados
                        const yaExiste = materiasInfo.some(
                          (m) => m.nombre === cell
                        );
                        if (!yaExiste) {
                          // Generar siglas
                          const palabras = cell.split(" ");
                          let siglas = palabras
                            .map((palabra) => palabra.charAt(0))
                            .join("");

                          materiasInfo.push({
                            id: `excel_materia_${Date.now()}_${Math.random()
                              .toString(36)
                              .substr(2, 9)}_${materiasInfo.length}`,
                            nombre: cell,
                            siglas: siglas,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }

            // Si no encontramos materias con el método anterior, intentamos directamente con los índices
            // basados en el log que vimos (fila 6, columnas 2 y 11)
            if (materiasInfo.length === 0 && jsonData.length > 6) {
              // Verificar la columna 2 (índice 2)
              if (
                jsonData[6].length > 2 &&
                typeof jsonData[6][2] === "string" &&
                jsonData[6][2].trim() !== ""
              ) {
                const nombreMateria = jsonData[6][2];

                // Generar siglas
                const palabras = nombreMateria.split(" ");
                let siglas = palabras
                  .map((palabra) => palabra.charAt(0))
                  .join("");

                materiasInfo.push({
                  id: `excel_materia_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_0`,
                  nombre: nombreMateria,
                  siglas: siglas,
                });
              }

              // Verificar la columna 11 (índice 11)
              if (
                jsonData[6].length > 11 &&
                typeof jsonData[6][11] === "string" &&
                jsonData[6][11].trim() !== ""
              ) {
                const nombreMateria = jsonData[6][11];

                // Generar siglas
                const palabras = nombreMateria.split(" ");
                let siglas = palabras
                  .map((palabra) => palabra.charAt(0))
                  .join("");

                materiasInfo.push({
                  id: `excel_materia_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_1`,
                  nombre: nombreMateria,
                  siglas: siglas,
                });
              }
            }

            if (materiasInfo.length > 0) {
              parsedData = materiasInfo;
            } else {
              Alert.alert(
                "Información no encontrada",
                "No se pudo encontrar información de materias en el archivo"
              );
              setLoadingFile(false);
              return;
            }
          } else if (activeTab === "grupos") {
            // Extraer información de grupos del archivo
            let gruposInfo = [];

            // Buscar las filas que contienen "GRUPO (S):"
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              for (let j = 0; j < row.length; j++) {
                if (row[j] === "GRUPO (S):") {
                  // Si encontramos "GRUPO (S):", los grupos deberían estar en las siguientes celdas
                  if (j + 1 < row.length) {
                    // Puede haber varios grupos separados por comas o espacios
                    const gruposTexto = row
                      .slice(j + 1)
                      .join(" ")
                      .replace(/,/g, " ");
                    const gruposArray = gruposTexto
                      .split(/\s+/)
                      .filter((g) => g.trim() !== "");

                    for (const grupo of gruposArray) {
                      if (
                        !isNaN(Number(grupo)) &&
                        !gruposInfo.some((g) => g.nombre === grupo)
                      ) {
                        gruposInfo.push({
                          id: `excel_grupo_${Date.now()}_${gruposInfo.length}`,
                          nombre: grupo,
                          docenteId: docentes.length > 0 ? docentes[0].id : "",
                        });
                      }
                    }
                  }
                }
              }
            }

            if (gruposInfo.length > 0) {
              parsedData = gruposInfo;
            } else {
              Alert.alert(
                "Información no encontrada",
                "No se pudo encontrar información de grupos en el archivo"
              );
              setLoadingFile(false);
              return;
            }
          } else if (activeTab === "directivos") {
            // Extraer información de directivos del archivo
            let directivosInfo = [];

            // Buscar información de directivos (DIRECTOR, SUBDIRECTOR, etc.)
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (typeof cell === "string") {
                  // Buscar palabras clave que indiquen un cargo directivo
                  if (
                    cell.includes("DIRECTOR") ||
                    cell.includes("SUBDIRECTOR") ||
                    cell.includes("COORDINADOR") ||
                    cell.includes("JEFE")
                  ) {
                    // El nombre del directivo podría estar en la fila anterior o en la misma fila
                    let nombre = "";
                    let rol = "";

                    // Extraer el rol
                    if (cell.includes("DIRECTOR")) {
                      rol = "Director";
                    } else if (cell.includes("SUBDIRECTOR")) {
                      rol = "Subdirector";
                    } else if (cell.includes("COORDINADOR")) {
                      rol = "Coordinador";
                    } else if (cell.includes("JEFE")) {
                      rol = "Jefe de departamento";
                    }

                    // Buscar el nombre en la misma fila o en filas cercanas
                    for (let k = Math.max(0, i - 2); k <= i; k++) {
                      const nameRow = jsonData[k];
                      for (let l = 0; l < nameRow.length; l++) {
                        const nameCell = nameRow[l];
                        if (
                          (typeof nameCell === "string" &&
                            nameCell.includes("LIC.")) ||
                          nameCell.includes("DR.") ||
                          nameCell.includes("DRA.") ||
                          nameCell.includes("MTRA.") ||
                          nameCell.includes("MTRO.")
                        ) {
                          nombre = nameCell;
                          break;
                        }
                      }
                      if (nombre) break;
                    }

                    if (
                      nombre &&
                      rol &&
                      !directivosInfo.some((d) => d.nombre === nombre)
                    ) {
                      directivosInfo.push({
                        id: `excel_directivo_${Date.now()}_${
                          directivosInfo.length
                        }`,
                        nombre: nombre,
                        rol: rol,
                        generoFemenino:
                          nombre.includes("DRA.") ||
                          nombre.includes("MTRA.") ||
                          (nombre.includes("LIC.") && nombre.includes("A ")),
                      });
                    }
                  }
                }
              }
            }

            if (directivosInfo.length > 0) {
              parsedData = directivosInfo;
            } else {
              Alert.alert(
                "Información no encontrada",
                "No se pudo encontrar información de directivos en el archivo"
              );
              setLoadingFile(false);
              return;
            }
          } else if (activeTab === "administrativos") {
            // Extraer información de administrativos del archivo
            let administrativosInfo = [];

            // Buscar información de administrativos (ADMINISTRATIVO, SECRETARIO, etc.)
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (typeof cell === "string") {
                  // Buscar palabras clave que indiquen un cargo administrativo
                  if (
                    cell.includes("ADMINISTRATIVO") ||
                    cell.includes("SECRETARIO") ||
                    cell.includes("ASISTENTE") ||
                    cell.includes("COORDINADOR")
                  ) {
                    // El nombre del administrativo podría estar en la fila anterior o en la misma fila
                    let nombre = "";
                    let celular = "";
                    let correo = "";

                    // Buscar el nombre en la misma fila o en filas cercanas
                    for (let k = Math.max(0, i - 2); k <= i; k++) {
                      const nameRow = jsonData[k];
                      for (let l = 0; l < nameRow.length; l++) {
                        const nameCell = nameRow[l];
                        if (
                          (typeof nameCell === "string" &&
                            nameCell.includes("LIC.")) ||
                          nameCell.includes("DR.") ||
                          nameCell.includes("DRA.") ||
                          nameCell.includes("MTRA.") ||
                          nameCell.includes("MTRO.")
                        ) {
                          nombre = nameCell;
                          break;
                        }
                      }
                      if (nombre) break;
                    }

                    // Buscar el celular y correo en la misma fila o en filas cercanas
                    for (let k = Math.max(0, i - 2); k <= i; k++) {
                      const contactRow = jsonData[k];
                      for (let l = 0; l < contactRow.length; l++) {
                        const contactCell = contactRow[l];
                        if (
                          typeof contactCell === "string" &&
                          contactCell.includes("@")
                        ) {
                          correo = contactCell;
                        } else if (
                          typeof contactCell === "string" &&
                          contactCell.length === 10 &&
                          !isNaN(Number(contactCell))
                        ) {
                          celular = contactCell;
                        }
                      }
                      if (correo && celular) break;
                    }

                    if (
                      nombre &&
                      celular &&
                      correo &&
                      !administrativosInfo.some((a) => a.nombre === nombre)
                    ) {
                      administrativosInfo.push({
                        id: `excel_administrativo_${Date.now()}_${
                          administrativosInfo.length
                        }`,
                        nombre: nombre,
                        celular: celular,
                        correo: correo,
                      });
                    }
                  }
                }
              }
            }

            if (administrativosInfo.length > 0) {
              parsedData = administrativosInfo;
            } else {
              Alert.alert(
                "Información no encontrada",
                "No se pudo encontrar información de administrativos en el archivo"
              );
              setLoadingFile(false);
              return;
            }
          }

          // Agregar los datos analizados de esta hoja al conjunto total
          if (parsedData.length > 0) {
            allParsedData = [...allParsedData, ...parsedData];
          }
        }

        // Si no se encontraron datos en ninguna hoja
        if (allParsedData.length === 0) {
          Alert.alert(
            "Error",
            "No se encontraron datos válidos en ninguna hoja del archivo"
          );
          setLoadingFile(false);
          return;
        }

        console.log(
          `Total de elementos encontrados en todas las hojas: ${allParsedData.length}`
        );

        // Actualizar el contador de elementos encontrados con el tipo específico
        const tipoElemento =
          activeTab === "docentes"
            ? "docente(s)"
            : activeTab === "materias"
            ? "materia(s)"
            : activeTab === "grupos"
            ? "grupo(s)"
            : "directivo(s)";

        setItemsFoundCount(allParsedData.length);

        // Inicializar todos los elementos como seleccionados
        const initialSelectedItems: { [key: string]: boolean } = {};
        allParsedData.forEach((item) => {
          initialSelectedItems[item.id] = true;
        });

        setExcelData(allParsedData);
        setSelectedItems(initialSelectedItems);
        setLoadingFile(false);
        setShowExcelDataModal(true);
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        Alert.alert("Error", "No se pudo procesar el archivo seleccionado");
        setLoadingFile(false);
      }
    } catch (error) {
      console.error("Error al seleccionar el archivo:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
      setLoadingFile(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const saveSelectedItems = () => {
    const selectedData = excelData.filter((item) => selectedItems[item.id]);

    if (selectedData.length === 0) {
      Alert.alert("Aviso", "No hay elementos seleccionados para guardar");
      return;
    }

    // Guardar los elementos seleccionados según la pestaña activa
    if (activeTab === "docentes") {
      // Conjunto para almacenar materias únicas
      const uniqueMaterias = new Set();

      // Guardar cada docente individualmente
      for (const docente of selectedData) {
        const uniqueDocente = {
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          numeroEmpleado: docente.numeroEmpleado,
          materias: docente.materias || [],
        };
        addDocente(uniqueDocente);

        // Recopilar todas las materias de este docente
        if (docente.materias && docente.materias.length > 0) {
          docente.materias.forEach((materia) => {
            // Usar el nombre como identificador único para evitar duplicados
            if (!uniqueMaterias.has(materia.nombre)) {
              uniqueMaterias.add(materia.nombre);

              // Generar siglas si no existen
              let siglas = materia.siglas;
              if (!siglas) {
                const palabras = materia.nombre.split(" ");
                siglas = palabras.map((palabra) => palabra.charAt(0)).join("");
              }

              // Agregar la materia a la lista de materias
              addMateria({
                nombre: materia.nombre,
                siglas: siglas,
              });
            }
          });
        }
      }

      // Mostrar mensaje con el número de docentes y materias agregadas
      Alert.alert(
        "Éxito",
        `Se han guardado ${selectedData.length} docentes y ${uniqueMaterias.size} materias correctamente`
      );
    } else if (activeTab === "materias") {
      // Guardar cada materia individualmente
      for (let i = 0; i < selectedData.length; i++) {
        const materia = selectedData[i];

        // Crear una copia limpia de la materia
        const uniqueMateria = {
          nombre: materia.nombre,
          siglas: materia.siglas,
        };

        // Agregar la materia al estado
        addMateria(uniqueMateria);
      }
    } else if (activeTab === "grupos") {
      // Guardar cada grupo individualmente
      for (const grupo of selectedData) {
        const uniqueGrupo = {
          nombre: grupo.nombre,
          docenteId: grupo.docenteId,
        };
        addGrupo(uniqueGrupo);
      }
    } else if (activeTab === "directivos") {
      // Guardar cada directivo individualmente
      for (const directivo of selectedData) {
        const uniqueDirectivo = {
          nombre: directivo.nombre,
          rol: directivo.rol,
          generoFemenino: directivo.generoFemenino,
        };
        addDirectivo(uniqueDirectivo);
      }
    } else if (activeTab === "administrativos") {
      // Guardar cada administrativo individualmente
      for (const administrativo of selectedData) {
        const uniqueAdministrativo = {
          nombre: administrativo.nombre,
          celular: administrativo.celular,
          correo: administrativo.correo,
        };
        addAdministrativo(uniqueAdministrativo);
      }
    }

    // Cerrar el modal y limpiar los datos
    setShowExcelDataModal(false);
    setExcelData([]);
    setSelectedItems({});

    Alert.alert(
      "Éxito",
      `Se han guardado ${selectedData.length} elementos correctamente`
    );
  };

  const filteredData = () => {
    if (!searchQuery.trim()) {
      if (activeTab === "docentes") return docentes;
      if (activeTab === "materias") return materias;
      if (activeTab === "grupos") return grupos;
      if (activeTab === "directivos") return directivos;
      if (activeTab === "administrativos") return administrativos;
      return [];
    }

    const query = searchQuery.toLowerCase().trim();

    if (activeTab === "docentes") {
      return docentes.filter(
        (docente) =>
          docente.nombre.toLowerCase().includes(query) ||
          docente.apellido.toLowerCase().includes(query) ||
          docente.email.toLowerCase().includes(query) ||
          docente.numeroEmpleado.toLowerCase().includes(query)
      );
    }

    if (activeTab === "materias") {
      return materias.filter(
        (materia) =>
          materia.nombre.toLowerCase().includes(query) ||
          materia.siglas.toLowerCase().includes(query)
      );
    }

    if (activeTab === "grupos") {
      return grupos.filter((grupo) =>
        grupo.nombre.toLowerCase().includes(query)
      );
    }

    if (activeTab === "directivos") {
      return directivos.filter(
        (directivo) =>
          directivo.nombre.toLowerCase().includes(query) ||
          directivo.rol.toLowerCase().includes(query)
      );
    }

    if (activeTab === "administrativos") {
      return administrativos.filter(
        (administrativo) =>
          administrativo.nombre.toLowerCase().includes(query) ||
          administrativo.celular.toLowerCase().includes(query) ||
          administrativo.correo.toLowerCase().includes(query)
      );
    }

    return [];
  };

  const renderTabContent = () => {
    const data = filteredData();

    if (activeTab === "docentes") {
      if (data.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery
                ? "No se encontraron docentes con esa búsqueda"
                : "No hay docentes registrados"}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.tabContent}>
          {data.map((docente) => (
            <View
              key={docente.id}
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {docente.nombre} {docente.apellido}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  Email: {docente.email}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  No. Empleado: {docente.numeroEmpleado}
                </Text>
                {docente.materias && docente.materias.length > 0 && (
                  <View style={styles.materiasContainer}>
                    <Text
                      style={[styles.materiasTitle, { color: colors.text }]}
                    >
                      Materias:
                    </Text>
                    {docente.materias.map((materia, index) => (
                      <Text
                        key={materia.id || index}
                        style={[styles.materiaItem, { color: colors.text }]}
                      >
                        • {materia.nombre}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[
                    styles.emailButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    Linking.openURL(`mailto:${docente.email}`).catch((err) => {
                      Alert.alert(
                        "Error",
                        "No se pudo abrir el cliente de correo"
                      );
                    });
                  }}
                >
                  <Feather name="mail" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleEditItem(docente.id)}
                >
                  <Feather name="edit-2" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cardDeleteButton,
                    {
                      backgroundColor: "#dc3545",
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleDeleteItem(docente.id)}
                >
                  <Feather name="trash-2" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    } else if (activeTab === "materias") {
      if (data.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery
                ? "No se encontraron materias con esa búsqueda"
                : "No hay materias registradas"}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.tabContent}>
          {data.map((materia) => (
            <View
              key={materia.id}
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {materia.nombre}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  Siglas: {materia.siglas}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleEditItem(materia.id)}
                >
                  <Feather name="edit-2" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cardDeleteButton,
                    {
                      backgroundColor: "#dc3545",
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleDeleteItem(materia.id)}
                >
                  <Feather name="trash-2" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    } else if (activeTab === "grupos") {
      if (data.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery
                ? "No se encontraron grupos con esa búsqueda"
                : "No hay grupos registrados"}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.tabContent}>
          {data.map((grupo) => {
            const docente = docentes.find((d) => d.id === grupo.docenteId);
            return (
              <View
                key={grupo.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    Grupo {grupo.nombre}
                  </Text>
                  {docente && (
                    <Text
                      style={[styles.itemSubtitle, { color: colors.secondary }]}
                    >
                      Docente: {`${docente.nombre} ${docente.apellido}`}
                    </Text>
                  )}
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleEditItem(grupo.id)}
                  >
                    <Feather name="edit-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cardDeleteButton,
                      {
                        backgroundColor: "#dc3545",
                        borderRadius: 16,
                        width: 32,
                        height: 32,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                    onPress={() => handleDeleteItem(grupo.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      );
    } else if (activeTab === "directivos") {
      if (data.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery
                ? "No se encontraron directivos con esa búsqueda"
                : "No hay directivos registrados"}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.tabContent}>
          {data.map((directivo) => (
            <View
              key={directivo.id}
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {directivo.nombre}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  Puesto:{" "}
                  {directivo.rol === "Director"
                    ? directivo.generoFemenino
                      ? "Directora"
                      : "Director"
                    : directivo.generoFemenino
                    ? "Subdirectora Académica"
                    : "Subdirector Académico"}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleEditItem(directivo.id)}
                >
                  <Feather name="edit-2" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cardDeleteButton,
                    {
                      backgroundColor: "#dc3545",
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleDeleteItem(directivo.id)}
                >
                  <Feather name="trash-2" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    } else if (activeTab === "administrativos") {
      if (data.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery
                ? "No se encontraron administrativos con esa búsqueda"
                : "No hay administrativos registrados"}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.tabContent}>
          {data.map((administrativo) => (
            <View
              key={administrativo.id}
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {administrativo.nombre}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  Celular: {administrativo.celular}
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: colors.secondary }]}
                >
                  Correo: {administrativo.correo}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: "#25D366",
                      marginRight: 5,
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() =>
                    Linking.openURL(`https://wa.me/${administrativo.celular}`)
                  }
                >
                  <Feather name="message-circle" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleEditItem(administrativo.id)}
                >
                  <Feather name="edit-2" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cardDeleteButton,
                    {
                      backgroundColor: "#dc3545",
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleDeleteItem(administrativo.id)}
                >
                  <Feather name="trash-2" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "docentes":
        return (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Nombre:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={docenteForm.nombre}
              onChangeText={(text) =>
                setDocenteForm({ ...docenteForm, nombre: text })
              }
              placeholder="Nombre del docente"
              placeholderTextColor={colors.placeholder || "#999"}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Apellido:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={docenteForm.apellido}
              onChangeText={(text) =>
                setDocenteForm({ ...docenteForm, apellido: text })
              }
              placeholder="Apellido del docente"
              placeholderTextColor={colors.placeholder || "#999"}
            />

            <Text style={[styles.label, { color: colors.text }]}>Email:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={docenteForm.email}
              onChangeText={(text) =>
                setDocenteForm({ ...docenteForm, email: text })
              }
              placeholder="Email del docente"
              placeholderTextColor={colors.placeholder || "#999"}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Número de Empleado:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={docenteForm.numeroEmpleado}
              onChangeText={(text) =>
                setDocenteForm({ ...docenteForm, numeroEmpleado: text })
              }
              placeholder="Número de empleado"
              placeholderTextColor={colors.placeholder || "#999"}
              keyboardType="number-pad"
            />

            {/* Sección de materias */}
            <Text style={[styles.label, { color: colors.text }]}>
              Materias:
            </Text>
            <View style={{ marginTop: 12 }}>
              {docenteForm.materias.map((mat, idx) => (
                <View
                  key={mat.id || idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={mat.nombre}
                      onChangeText={(text) => {
                        const newMaterias = [...docenteForm.materias];
                        newMaterias[idx].nombre = text;
                        setDocenteForm({
                          ...docenteForm,
                          materias: newMaterias,
                        });
                      }}
                      placeholder="Nombre de la materia"
                      placeholderTextColor={colors.placeholder || "#999"}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card || "#f5f5f5",
                          color: colors.text,
                          flex: 2,
                        },
                      ]}
                    />
                    <TextInput
                      value={mat.siglas}
                      onChangeText={(text) => {
                        const newMaterias = [...docenteForm.materias];
                        newMaterias[idx].siglas = text;
                        setDocenteForm({
                          ...docenteForm,
                          materias: newMaterias,
                        });
                      }}
                      placeholder="Siglas"
                      placeholderTextColor={colors.placeholder || "#999"}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card || "#f5f5f5",
                          color: colors.text,
                          flex: 1,
                        },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const newMaterias = docenteForm.materias.filter(
                        (_, i) => i !== idx
                      );
                      setDocenteForm({ ...docenteForm, materias: newMaterias });
                    }}
                    style={styles.deleteButton}
                  >
                    <Feather name="trash-2" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addMateriaButton}
                onPress={() =>
                  setDocenteForm({
                    ...docenteForm,
                    materias: [
                      ...docenteForm.materias,
                      {
                        id: `materia_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                        nombre: "",
                        siglas: "",
                      },
                    ],
                  })
                }
              >
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <Text style={{ marginLeft: 4, color: colors.primary }}>
                  Agregar materia
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case "materias":
        return (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Nombre de la Materia:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={materiaForm.nombre}
              onChangeText={(text) =>
                setMateriaForm({ ...materiaForm, nombre: text })
              }
              placeholder="Nombre de la materia"
              placeholderTextColor={colors.placeholder || "#999"}
            />

            <Text style={[styles.label, { color: colors.text }]}>Siglas:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={materiaForm.siglas}
              onChangeText={(text) =>
                setMateriaForm({ ...materiaForm, siglas: text })
              }
              placeholder="Siglas"
              placeholderTextColor={colors.placeholder || "#999"}
            />
          </>
        );
      case "grupos":
        return (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Nombre del Grupo:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={grupoForm.nombre}
              onChangeText={(text) =>
                setGrupoForm({ ...grupoForm, nombre: text })
              }
              placeholder="Nombre del grupo"
              placeholderTextColor={colors.placeholder || "#999"}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Docente asignado:
            </Text>
            <ScrollView style={styles.docentesList}>
              {docentes.map((docente) => (
                <TouchableOpacity
                  key={docente.id}
                  style={[
                    styles.docenteItem,
                    {
                      backgroundColor:
                        docente.id === grupoForm.docenteId
                          ? colors.primary + "20"
                          : colors.card,
                      borderColor:
                        docente.id === grupoForm.docenteId
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    // Si el docente ya está seleccionado, lo deseleccionamos
                    if (docente.id === grupoForm.docenteId) {
                      setGrupoForm({ ...grupoForm, docenteId: "" });
                    } else {
                      setGrupoForm({ ...grupoForm, docenteId: docente.id });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.docenteName,
                      {
                        color:
                          docente.id === grupoForm.docenteId
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {docente.nombre} {docente.apellido}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
      case "directivos":
        return (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Nombre Completo:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card || "#f5f5f5",
                  color: colors.text,
                },
              ]}
              value={directivoForm.nombre}
              onChangeText={(text) =>
                setDirectivoForm({ ...directivoForm, nombre: text })
              }
              placeholder="Nombre completo"
              placeholderTextColor={colors.placeholder || "#999"}
            />

            <View style={styles.radioGroup}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>
                Puesto:
              </Text>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  directivoForm.rol === "Director" && {
                    backgroundColor: colors.primary + "40",
                  },
                ]}
                onPress={() =>
                  setDirectivoForm({ ...directivoForm, rol: "Director" })
                }
              >
                <Text style={{ color: colors.text }}>Director(a)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  directivoForm.rol === "Subdirector Académico" && {
                    backgroundColor: colors.primary + "40",
                  },
                ]}
                onPress={() =>
                  setDirectivoForm({
                    ...directivoForm,
                    rol: "Subdirector Académico",
                  })
                }
              >
                <Text style={{ color: colors.text }}>
                  Subdirector(a) Académico(a)
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.radioGroup}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>
                Género:
              </Text>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  !directivoForm.generoFemenino && {
                    backgroundColor: colors.primary + "40",
                  },
                ]}
                onPress={() =>
                  setDirectivoForm({ ...directivoForm, generoFemenino: false })
                }
              >
                <Text style={{ color: colors.text }}>Masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  directivoForm.generoFemenino && {
                    backgroundColor: colors.primary + "40",
                  },
                ]}
                onPress={() =>
                  setDirectivoForm({ ...directivoForm, generoFemenino: true })
                }
              >
                <Text style={{ color: colors.text }}>Femenino</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tabsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 16,
      letterSpacing: 0.3,
    },
    activeTabText: {
      fontWeight: "600",
    },
    contentContainer: {
      flex: 1,
      padding: 15,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    uploadButton: {
      ...commonStyles.buttonIcon,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    addButton: {
      ...commonStyles.buttonIcon,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButton: {
      ...commonStyles.buttonIcon,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    emailButton: {
      ...commonStyles.buttonIconSmall,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    editButton: {
      ...commonStyles.buttonIconSmall,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    cardDeleteButton: {
      ...commonStyles.buttonIconSmall,
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    tabContent: {
      flex: 1,
    },
    itemCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
    },
    itemInfo: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 5,
      letterSpacing: 0.3,
    },
    itemSubtitle: {
      fontSize: 14,
      letterSpacing: 0.2,
    },
    itemActions: {
      flexDirection: "row",
      gap: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "90%",
      borderRadius: 10,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 15,
      textAlign: "center",
      letterSpacing: 0.5,
    },
    modalSubtitle: {
      fontSize: 16,
      marginBottom: 15,
      textAlign: "center",
      letterSpacing: 0.3,
    },
    input: {
      height: 40,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 5,
      marginBottom: 15,
      paddingHorizontal: 10,
      width: "100%",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#dee2e6",
      borderRadius: 5,
      marginBottom: 10,
      padding: 10,
    },
    pickerLabel: {
      marginBottom: 5,
      fontWeight: "bold",
    },
    pickerScrollView: {
      maxHeight: 150,
    },
    pickerItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#dee2e6",
    },
    radioGroup: {
      marginBottom: 10,
    },
    radioLabel: {
      marginBottom: 5,
      fontWeight: "bold",
    },
    radioButton: {
      padding: 10,
      borderWidth: 1,
      borderColor: "#dee2e6",
      borderRadius: 5,
      marginBottom: 5,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
    },
    modalButton: {
      padding: 10,
      borderRadius: 5,
      flex: 1,
      marginHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme === "dark" ? "#ffffff" : colors.primary,
    },
    modalButtonText: {
      color: theme === "dark" ? colors.text : "#ffffff",
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    loadingModalContent: {
      width: "80%",
      borderRadius: 10,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      alignItems: "center",
    },
    loadingIndicator: {
      marginBottom: 15,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    excelDataList: {
      width: "100%",
      marginVertical: 10,
    },
    excelDataItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ddd",
    },
    excelItemCheckbox: {
      position: "absolute",
      right: 15,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    excelItemContent: {
      flex: 1,
      paddingRight: 40,
    },
    excelItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    excelItemSubtitle: {
      fontSize: 14,
      letterSpacing: 0.2,
    },
    docentesList: {
      maxHeight: 200,
      marginBottom: 10,
    },
    docenteItem: {
      padding: 10,
      marginVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    docenteName: {
      fontSize: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    materiasContainer: {
      marginTop: 8,
      paddingTop: 8,
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: 8,
      backgroundColor: "rgba(0, 0, 0, 0.03)",
      borderRadius: 6,
      marginBottom: 6,
    },
    materiasTitle: {
      fontWeight: "bold",
      fontSize: 14,
      marginBottom: 6,
    },
    materiaItem: {
      fontSize: 13,
      marginLeft: 8,
      marginBottom: 4,
    },
    addMateriaButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      padding: 8,
    },
    deleteButton: {
      padding: 8,
    },
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#ffffff",
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: "90%",
      maxHeight: "80%",
    },
    button: {
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },
    buttonOpen: {
      backgroundColor: "#F194FF",
    },
    buttonClose: {
      backgroundColor: "#2196F3",
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    modalText: {
      marginBottom: 15,
      textAlign: "center",
    },
    buttonCancel: {
      backgroundColor: "#e53935",
    },
    buttonSave: {
      backgroundColor: "#4CAF50",
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    formContainer: {
      width: "100%",
      marginVertical: 10,
      maxHeight: 400,
    },
    input: {
      height: 40,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 5,
      marginBottom: 15,
      paddingHorizontal: 10,
      width: "100%",
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 25,
      marginHorizontal: 10,
      marginBottom: 5,
      marginTop: 15,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      height: 40,
      paddingVertical: 8,
      fontSize: 16,
      marginLeft: 8,
    },
    searchIcon: {
      marginRight: 5,
    },
    clearButton: {
      justifyContent: "center",
      alignItems: "center",
    },
    clearButtonInner: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.card}
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.tabsContainer}>
        <View style={styles.tabsContent}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "docentes" && [
                styles.activeTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("docentes")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "docentes" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
                {
                  color:
                    activeTab === "docentes" ? colors.primary : colors.text,
                },
              ]}
            >
              Docentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "materias" && [
                styles.activeTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("materias")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "materias" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
                {
                  color:
                    activeTab === "materias" ? colors.primary : colors.text,
                },
              ]}
            >
              Materias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "grupos" && [
                styles.activeTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("grupos")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "grupos" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
                {
                  color: activeTab === "grupos" ? colors.primary : colors.text,
                },
              ]}
            >
              Grupos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "directivos" && [
                styles.activeTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("directivos")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "directivos" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
                {
                  color:
                    activeTab === "directivos" ? colors.primary : colors.text,
                },
              ]}
            >
              Directivos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "administrativos" && [
                styles.activeTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("administrativos")}
          ></TouchableOpacity>
        </View>
      </View>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather
          name="search"
          size={20}
          color={colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por nombre, materia o grupo..."
          placeholderTextColor={colors.text + "60"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.clearButtonInner,
                { backgroundColor: colors.border },
              ]}
            >
              <Feather name="x" size={16} color={colors.text} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {activeTab === "docentes" && "Docentes"}
            {activeTab === "materias" && "Materias"}
            {activeTab === "grupos" && "Grupos"}
            {activeTab === "directivos" && "Directivos"}
            {activeTab === "administrativos" && "Académicos"}
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              onPress={handlePickExcelFile}
            >
              <Feather name="upload" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                resetForms();
                setModalVisible(true);
              }}
            >
              <Feather name="plus" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  backgroundColor: colors.error || "#e53935",
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
              onPress={handleDeleteAllActiveTab}
            >
              <Feather name="trash-2" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {renderTabContent()}
      </View>

      {/* Modal para agregar/editar elementos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForms();
        }}
      >
        <View
          style={[
            styles.centeredView,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalView,
              {
                backgroundColor: colors.card || "#ffffff",
                width: "90%",
                maxHeight: "80%",
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? "Editar" : "Agregar"}{" "}
              {activeTab === "docentes"
                ? "Docente"
                : activeTab === "materias"
                ? "Materia"
                : activeTab === "grupos"
                ? "Grupo"
                : activeTab === "directivos"
                ? "Directivo"
                : "Académico"}
            </Text>

            <ScrollView
              style={[
                styles.formContainer,
                { width: "100%", marginVertical: 10, maxHeight: 400 },
              ]}
            >
              {renderForm()}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.secondary },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  resetForms();
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAddItem}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar el proceso de carga */}
      <Modal visible={loadingFile} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.loadingModalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loadingIndicator}
            />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Analizando archivo...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar y seleccionar datos del Excel */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showExcelDataModal}
        onRequestClose={() => setShowExcelDataModal(false)}
      >
        <View
          style={[
            styles.centeredView,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalView,
              { backgroundColor: colors.card || "#ffffff" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {itemsFoundCount}{" "}
              {activeTab === "docentes"
                ? "Docentes"
                : activeTab === "materias"
                ? "Materias"
                : activeTab === "grupos"
                ? "Grupos"
                : activeTab === "directivos"
                ? "Directivos"
                : "Académicos"}{" "}
              detectados
            </Text>

            <ScrollView style={styles.excelDataList}>
              {excelData.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.excelDataItem,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.excelItemCheckbox}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selectedItems[item.id]
                            ? colors.primary
                            : "transparent",
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => {
                        const newSelectedItems = { ...selectedItems };
                        newSelectedItems[item.id] = !newSelectedItems[item.id];
                        setSelectedItems(newSelectedItems);
                      }}
                    >
                      {selectedItems[item.id] && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.excelItemContent}>
                    {activeTab === "docentes" && (
                      <>
                        <Text
                          style={[
                            styles.excelItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {item.nombre} {item.apellido}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          Email: {item.email}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          No. Empleado: {item.numeroEmpleado}
                        </Text>

                        {/* Mostrar materias del docente */}
                        {item.materias && item.materias.length > 0 && (
                          <View style={styles.materiasContainer}>
                            <Text
                              style={[
                                styles.materiasTitle,
                                { color: colors.text },
                              ]}
                            >
                              Materias del docente:
                            </Text>
                            {item.materias.map((materia, idx) => (
                              <Text
                                key={materia.id || idx}
                                style={[
                                  styles.materiaItem,
                                  { color: colors.text },
                                ]}
                              >
                                • {materia.nombre}
                              </Text>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                    {activeTab === "materias" && (
                      <>
                        <Text
                          style={[
                            styles.excelItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {item.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          Siglas: {item.siglas}
                        </Text>
                      </>
                    )}
                    {activeTab === "grupos" && (
                      <>
                        <Text
                          style={[
                            styles.excelItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          Grupo {item.nombre}
                        </Text>
                      </>
                    )}
                    {activeTab === "directivos" && (
                      <>
                        <Text
                          style={[
                            styles.excelItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {item.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          Rol: {item.rol}
                        </Text>
                      </>
                    )}
                    {activeTab === "administrativos" && (
                      <>
                        <Text
                          style={[
                            styles.excelItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {item.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          Celular: {item.celular}
                        </Text>
                        <Text
                          style={[
                            styles.excelItemSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          Correo: {item.correo}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonCancel,
                  { backgroundColor: colors.error },
                ]}
                onPress={() => {
                  setShowExcelDataModal(false);
                  setExcelData([]);
                  setSelectedItems({});
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={saveSelectedItems}
              >
                <Text style={styles.buttonText}>Guardar seleccionados</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManagementScreen;
