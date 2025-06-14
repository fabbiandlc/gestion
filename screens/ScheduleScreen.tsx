"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  useData,
  type Docente,
  type Grupo,
  type Horario,
} from "../context/DataContext";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ScheduleScreen = () => {
  const { colors, theme } = useTheme();
  const {
    docentes,
    materias,
    grupos,
    directivos,
    horarios,
    addHorario,
    updateHorario,
    deleteHorario,
    clearHorariosByEntity,
    setHorarios,
    updateHorarios,
  } = useData();

  const [currentTab, setCurrentTab] = useState("docentes");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [currentCellInfo, setCurrentCellInfo] = useState<{
    dia: string;
    bloque: { horaInicio: string; horaFin: string; esReceso: boolean };
  } | null>(null);
  const [nombrePlantel, setNombrePlantel] = useState("");
  const [semestre, setSemestre] = useState("");

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const cargarDatosGuardados = async () => {
      try {
        const plantelGuardado = await AsyncStorage.getItem("nombrePlantel");
        const semestreGuardado = await AsyncStorage.getItem("semestre");

        if (plantelGuardado) {
          setNombrePlantel(plantelGuardado);
        }
        if (semestreGuardado) {
          setSemestre(semestreGuardado);
        }
      } catch (error) {
        console.error("Error al cargar datos guardados:", error);
      }
    };

    cargarDatosGuardados();
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    const guardarDatos = async () => {
      try {
        if (nombrePlantel) {
          await AsyncStorage.setItem("nombrePlantel", nombrePlantel);
        }
        if (semestre) {
          await AsyncStorage.setItem("semestre", semestre);
        }
      } catch (error) {
        console.error("Error al guardar datos:", error);
      }
    };

    guardarDatos();
  }, [nombrePlantel, semestre]);

  // Estado para la configuración de generación automática
  const [autoScheduleConfig, setAutoScheduleConfig] = useState({
    docenteId: "",
    grupos: [] as string[],
    horasPorMateria: {} as { [key: string]: number },
    materias: [] as string[],
  });

  // Estado para controlar qué card de docente está expandida
  const [expandedDocenteId, setExpandedDocenteId] = useState<string | null>(
    null
  );
  // Estado para la configuración de cada docente
  const [autoScheduleConfigs, setAutoScheduleConfigs] = useState<{
    [docenteId: string]: {
      grupos: string[];
      horasPorMateria: { [materiaId: string]: number };
      materias: string[];
    };
  }>({});

  // Estado para los turnos de los grupos
  const [gruposTurnos, setGruposTurnos] = useState<{
    [grupoId: string]: "matutino" | "vespertino";
  }>({});

  useEffect(() => {
    console.log("Materia seleccionada:", selectedMateria);
  }, [selectedMateria]);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const bloquesHorarios = [
    { horaInicio: "07:00", horaFin: "07:50", esReceso: false },
    { horaInicio: "07:50", horaFin: "08:40", esReceso: false },
    { horaInicio: "08:40", horaFin: "09:30", esReceso: false },
    { horaInicio: "09:30", horaFin: "10:00", esReceso: true },
    { horaInicio: "10:00", horaFin: "10:50", esReceso: false },
    { horaInicio: "10:50", horaFin: "11:40", esReceso: false },
    { horaInicio: "11:40", horaFin: "12:30", esReceso: false },
    { horaInicio: "12:30", horaFin: "13:20", esReceso: false },
    { horaInicio: "13:30", horaFin: "14:20", esReceso: false },
    { horaInicio: "14:20", horaFin: "15:10", esReceso: false },
    { horaInicio: "15:10", horaFin: "16:00", esReceso: false },
    { horaInicio: "16:00", horaFin: "16:30", esReceso: true },
    { horaInicio: "16:30", horaFin: "17:20", esReceso: false },
    { horaInicio: "17:20", horaFin: "18:10", esReceso: false },
    { horaInicio: "18:00", horaFin: "19:00", esReceso: false },
    { horaInicio: "19:00", horaFin: "19:50", esReceso: false },
  ];

  const convertirHoraAMinutos = (hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  };

  const filteredEntities = () => {
    const entities = currentTab === "docentes" ? docentes : grupos;

    if (!searchQuery.trim()) {
      return entities;
    }

    const query = searchQuery.toLowerCase().trim();

    if (currentTab === "docentes") {
      return docentes.filter(
        (docente) =>
          docente.nombre.toLowerCase().includes(query) ||
          docente.apellido.toLowerCase().includes(query) ||
          docente.email?.toLowerCase().includes(query) ||
          docente.numeroEmpleado?.toLowerCase().includes(query)
      );
    } else {
      return grupos.filter((grupo) =>
        grupo.nombre.toLowerCase().includes(query)
      );
    }
  };

  const checkScheduleConflict = (
    dia: string,
    horaInicio: string,
    materiaId: string,
    grupoId: string,
    docenteId: string
  ): boolean => {
    // Verificar si ya existe un horario para el mismo día y hora
    const conflictoExistente = horarios.some(
      (h) =>
        h.dia === dia &&
        h.horaInicio === horaInicio &&
        (h.docenteId === docenteId || h.salonId === grupoId)
    );

    if (conflictoExistente) {
      return true;
    }

    return false;
  };

  const getConflictDetails = (
    dia: string,
    horaInicio: string,
    horaFin: string,
    entityId: string,
    isDocente: boolean
  ) => {
    const conflicts: {
      docente?: string;
      materia: string;
      grupo: string;
      horario: string;
    }[] = [];
    const inicio = convertirHoraAMinutos(horaInicio);
    const fin = convertirHoraAMinutos(horaFin);

    horarios.forEach((horario) => {
      const horarioInicio = convertirHoraAMinutos(horario.horaInicio);
      const horarioFin = convertirHoraAMinutos(horario.horaFin);

      // Check if this is a conflict for the same entity
      const isSameEntity = isDocente
        ? horario.docenteId === entityId
        : horario.salonId === entityId;

      if (horario.dia === dia && isSameEntity) {
        // Check for time overlap
        if (
          (inicio >= horarioInicio && inicio < horarioFin) ||
          (fin > horarioInicio && fin <= horarioFin) ||
          (inicio <= horarioInicio && fin >= horarioFin)
        ) {
          const materia = materias.find((m) => m.id === horario.materiaId);
          const grupo = grupos.find((g) => g.id === horario.salonId);
          const docente = docentes.find((d) => d.id === horario.docenteId);

          conflicts.push({
            docente: docente
              ? `${docente.nombre} ${docente.apellido}`
              : undefined,
            materia: materia ? materia.nombre : "Materia desconocida",
            grupo: grupo ? grupo.nombre : "Grupo desconocido",
            horario: `${horario.horaInicio} - ${horario.horaFin}`,
          });
        }
      }
    });

    return conflicts;
  };

  const handleCellPress = (
    dia: string,
    bloque: { horaInicio: string; horaFin: string; esReceso: boolean }
  ) => {
    if (bloque.esReceso || !selectedEntity) {
      return;
    }

    if (currentTab === "docentes") {
      if (!selectedMateria) {
        Alert.alert(
          "Seleccione una materia",
          "Por favor seleccione una materia antes de asignar un horario."
        );
        return;
      }

      // Check for conflicts for docentes
      const hasConflict = checkScheduleConflict(
        dia,
        bloque.horaInicio,
        selectedMateria,
        selectedEntity,
        selectedEntity
      );

      if (hasConflict) {
        const conflicts = getConflictDetails(
          dia,
          bloque.horaInicio,
          bloque.horaFin,
          selectedEntity,
          true
        );
        let conflictMessage = "Conflicto de horario con:\n\n";

        conflicts.forEach((conflict) => {
          conflictMessage += `• ${conflict.materia} con ${conflict.grupo} (${conflict.horario})\n`;
        });

        Alert.alert("Conflicto de horario", conflictMessage);
        return;
      }

      // Show group selection modal if no conflicts
      setCurrentCellInfo({ dia, bloque });
      setShowGrupoModal(true);
    } else {
      // For grupos
      const horarioExistente = horarios.find(
        (h) =>
          h.dia === dia &&
          h.horaInicio === bloque.horaInicio &&
          h.horaFin === bloque.horaFin &&
          h.salonId === selectedEntity
      );

      if (horarioExistente) {
        // Updating existing schedule
        console.log(
          "Actualizando horario existente con materia:",
          selectedMateria
        );
        updateHorario(horarioExistente.id, {
          ...horarioExistente,
          materiaId: selectedMateria || horarioExistente.materiaId,
        });
      } else if (selectedMateria) {
        // Check for conflicts for grupos
        const hasConflict = checkScheduleConflict(
          dia,
          bloque.horaInicio,
          selectedMateria,
          selectedEntity,
          selectedEntity
        );

        if (hasConflict) {
          const conflicts = getConflictDetails(
            dia,
            bloque.horaInicio,
            bloque.horaFin,
            selectedEntity,
            false
          );
          let conflictMessage = "Conflicto de horario con:\n\n";

          conflicts.forEach((conflict) => {
            conflictMessage += `• ${conflict.materia} con ${
              conflict.docente || "docente desconocido"
            } (${conflict.horario})\n`;
          });

          Alert.alert("Conflicto de horario", conflictMessage);
          return;
        }

        // Create new schedule if no conflicts
        console.log("Creando nuevo horario con materia:", selectedMateria);
        addHorario({
          dia,
          horaInicio: bloque.horaInicio,
          horaFin: bloque.horaFin,
          materiaId: selectedMateria,
          docenteId: "",
          salonId: selectedEntity,
        });
      } else {
        Alert.alert(
          "Seleccione una materia",
          "Por favor seleccione una materia antes de asignar un horario."
        );
      }
    }
  };

  const handleGrupoSelection = (grupoId: string) => {
    if (!currentCellInfo || !selectedEntity || !selectedMateria) {
      console.log("Falta información para crear horario:", {
        currentCellInfo,
        selectedEntity,
        selectedMateria,
      });
      return;
    }

    const { dia, bloque } = currentCellInfo;

    // Check for conflicts for docentes
    const hasDocenteConflict = checkScheduleConflict(
      dia,
      bloque.horaInicio,
      selectedMateria,
      selectedEntity,
      selectedEntity
    );

    // Check for conflicts for grupos
    const hasGrupoConflict = checkScheduleConflict(
      dia,
      bloque.horaInicio,
      bloque.horaFin,
      grupoId,
      selectedEntity
    );

    if (hasDocenteConflict || hasGrupoConflict) {
      let conflictMessage =
        "No se puede asignar el horario debido a los siguientes conflictos:\n\n";

      if (hasDocenteConflict) {
        const docenteConflicts = getConflictDetails(
          dia,
          bloque.horaInicio,
          bloque.horaFin,
          selectedEntity,
          true
        );
        docenteConflicts.forEach((conflict) => {
          conflictMessage += `• El docente ya tiene clase de ${conflict.materia} con ${conflict.grupo} (${conflict.horario})\n`;
        });
      }

      if (hasGrupoConflict) {
        const grupoConflicts = getConflictDetails(
          dia,
          bloque.horaInicio,
          bloque.horaFin,
          grupoId,
          false
        );
        grupoConflicts.forEach((conflict) => {
          conflictMessage += `• El grupo ya tiene clase de ${
            conflict.materia
          } con ${conflict.docente || "docente desconocido"} (${
            conflict.horario
          })\n`;
        });
      }

      Alert.alert("Conflicto de horario", conflictMessage);
      return;
    }

    // Buscar si ya existe un horario para esta celda
    const horarioExistente = horarios.find(
      (h) =>
        h.dia === dia &&
        h.horaInicio === bloque.horaInicio &&
        h.horaFin === bloque.horaFin &&
        h.docenteId === selectedEntity
    );

    if (horarioExistente) {
      // Actualizar horario existente
      updateHorario(horarioExistente.id, {
        ...horarioExistente,
        materiaId: selectedMateria,
        salonId: grupoId,
      });
    } else {
      // Crear nuevo horario
      addHorario({
        dia,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
        materiaId: selectedMateria,
        docenteId: selectedEntity,
        salonId: grupoId,
      });
    }

    setShowGrupoModal(false);
    setCurrentCellInfo(null);
  };

  const handleDeleteHorario = (
    dia: string,
    bloque: { horaInicio: string; horaFin: string; esReceso: boolean }
  ) => {
    if (bloque.esReceso || !selectedEntity) return;

    const horarioExistente = horarios.find(
      (h) =>
        h.dia === dia &&
        h.horaInicio === bloque.horaInicio &&
        h.horaFin === bloque.horaFin &&
        (currentTab === "docentes"
          ? h.docenteId === selectedEntity
          : h.salonId === selectedEntity)
    );

    if (horarioExistente) {
      Alert.alert(
        "Eliminar horario",
        "¿Está seguro de que desea eliminar este horario?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              deleteHorario(horarioExistente.id);
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAllHorarios = (entityId: string) => {
    Alert.alert(
      "Eliminar todos los horarios",
      `¿Está seguro de que desea eliminar todos los horarios de este ${
        currentTab === "docentes" ? "docente" : "grupo"
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Usar la nueva función que elimina todos los horarios de una vez
            clearHorariosByEntity(entityId, currentTab === "docentes");

            // Mostrar confirmación
            Alert.alert("Éxito", "Se han eliminado todos los horarios.");

            // Forzar actualización de la UI
            setSelectedEntity(null);
            setTimeout(() => {
              setSelectedEntity(entityId);
            }, 100);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderEntityList = () => {
    const entities = filteredEntities();

    return (
      <View style={styles.entityListContainer}>
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
            placeholder="Buscar docente o grupo..."
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

        <ScrollView style={styles.entityList}>
          <View style={styles.entityGrid}>
            {entities.map((entity) => {
              const nombre =
                currentTab === "docentes"
                  ? `${(entity as Docente).nombre} ${
                      (entity as Docente).apellido
                    }`
                  : (entity as Grupo).nombre;

              return (
                <TouchableOpacity
                  key={entity.id}
                  style={[
                    styles.entityCard,
                    selectedEntity === entity.id && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                    },
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    console.log("Seleccionando entidad:", entity.id);
                    setSelectedEntity(entity.id);
                    setSelectedMateria(null); // Resetear la materia seleccionada al cambiar de entidad
                  }}
                >
                  <Text style={[styles.entityName, { color: colors.text }]}>
                    {nombre}
                  </Text>
                  <View style={styles.cardButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.pdfButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => convertirAPdf(entity)}
                    >
                      <Text style={styles.pdfButtonText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        { backgroundColor: "#FF3B30" },
                      ]}
                      onPress={() => handleDeleteAllHorarios(entity.id)}
                    >
                      <Feather name="trash-2" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderMateriaSelector = () => {
    if (!selectedEntity) return null;

    let materiasToShow = materias;

    if (currentTab === "docentes") {
      const selectedDocente = docentes.find((d) => d.id === selectedEntity);
      if (
        selectedDocente &&
        Array.isArray(selectedDocente.materias) &&
        selectedDocente.materias.length > 0
      ) {
        materiasToShow = selectedDocente.materias;
      } else {
        materiasToShow = [];
      }
    }

    // Debug para ver las materias disponibles
    console.log(
      "Materias disponibles:",
      materiasToShow.map((m) => ({ id: m.id, nombre: m.nombre }))
    );
    console.log("Materia seleccionada actualmente:", selectedMateria);

    return (
      <View style={styles.materiaSelectorContainer}>
        <Text style={[styles.materiaSelectorTitle, { color: colors.text }]}>
          Seleccionar materia:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.materiaSelectorScroll}
        >
          {materiasToShow.length > 0 ? (
            materiasToShow.map((materia) => {
              // Convertir ambos a string para comparación
              const isSelected = selectedMateria === String(materia.id);
              console.log(
                `Materia ${materia.nombre} (${materia.id}): ${
                  isSelected ? "SELECCIONADA" : "no seleccionada"
                }`
              );

              return (
                <TouchableOpacity
                  key={materia.id}
                  style={[
                    styles.materiaItem,
                    isSelected && {
                      backgroundColor: colors.primary + "40",
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    const newValue = String(materia.id);
                    console.log(
                      `Seleccionando materia: ${materia.nombre} (ID: ${newValue})`
                    );
                    setSelectedMateria(newValue);

                    // Verificar inmediatamente si se actualizó
                    setTimeout(() => {
                      console.log(
                        "Valor actualizado de selectedMateria:",
                        selectedMateria
                      );
                    }, 0);
                  }}
                >
                  <Text
                    style={[
                      styles.materiaItemText,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && { fontWeight: "bold" },
                    ]}
                  >
                    {materia.siglas ? `${materia.siglas} - ` : ""}
                    {materia.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={[styles.noMateriasText, { color: colors.text }]}>
              No hay materias disponibles
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderScheduleTable = () => {
    if (!selectedEntity) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Seleccione un {currentTab === "docentes" ? "docente" : "grupo"} para
            ver su horario
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View
              style={[
                styles.tableHeaderCell,
                styles.timeCell,
                { backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.tableHeaderText, { color: colors.text }]}>
                Hora
              </Text>
            </View>
            {diasSemana.map((dia) => (
              <View
                key={dia}
                style={[
                  styles.tableHeaderCell,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>
                  {dia}
                </Text>
              </View>
            ))}
          </View>

          {bloquesHorarios.map((bloque) => (
            <View
              key={`${bloque.horaInicio}-${bloque.horaFin}`}
              style={styles.tableRow}
            >
              <View
                style={[
                  styles.tableCell,
                  styles.timeCell,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.timeCellText, { color: colors.text }]}>
                  {bloque.horaInicio} - {bloque.horaFin}
                </Text>
              </View>

              {diasSemana.map((dia) => {
                if (bloque.esReceso) {
                  return (
                    <View
                      key={dia}
                      style={[
                        styles.tableCell,
                        styles.recesoCell,
                        { backgroundColor: colors.card + "80" },
                      ]}
                    >
                      <Text
                        style={[styles.recesoCellText, { color: colors.text }]}
                      >
                        RECESO
                      </Text>
                    </View>
                  );
                }

                const horario = horarios.find(
                  (h) =>
                    h.dia === dia &&
                    h.horaInicio === bloque.horaInicio &&
                    h.horaFin === bloque.horaFin &&
                    (currentTab === "docentes"
                      ? h.docenteId === selectedEntity
                      : h.salonId === selectedEntity)
                );

                let content = null;

                if (horario) {
                  if (currentTab === "docentes") {
                    const grupo = grupos.find((g) => g.id === horario.salonId);
                    // Agregar log para depuración
                    if (!grupo) {
                      console.log("Grupo no encontrado:", {
                        buscandoId: horario.salonId,
                        tipoId: typeof horario.salonId,
                        gruposDisponibles: grupos.map((g) => ({
                          id: g.id,
                          tipo: typeof g.id,
                          nombre: g.nombre,
                        })),
                      });
                    }
                    // Mostrar el grupo en la celda del docente, con fallback
                    content = (
                      <Text style={[styles.cellText, { color: colors.text }]}>
                        {grupo ? grupo.nombre : "Grupo no encontrado"}
                      </Text>
                    );
                  } else {
                    // Convertir ambos IDs a string para la comparación
                    const materia = materias.find(
                      (m) => String(m.id) === String(horario.materiaId)
                    );

                    // Agregar log para depuración
                    if (!materia) {
                      console.log("Materia no encontrada:", {
                        buscandoId: horario.materiaId,
                        tipoId: typeof horario.materiaId,
                        materiasDisponibles: materias.map((m) => ({
                          id: m.id,
                          tipo: typeof m.id,
                          nombre: m.nombre,
                        })),
                      });
                    }

                    content = (
                      <Text
                        style={[
                          styles.cellText,
                          { color: colors.text, fontWeight: "bold" },
                        ]}
                      >
                        {materia
                          ? materia.siglas ||
                            materia.nombre.substring(0, 3).toUpperCase()
                          : "???"}
                      </Text>
                    );
                  }
                }

                return (
                  <TouchableOpacity
                    key={dia}
                    style={[
                      styles.tableCell,
                      horario
                        ? { backgroundColor: colors.primary + "30" }
                        : { backgroundColor: colors.background },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleCellPress(dia, bloque)}
                    onLongPress={() => handleDeleteHorario(dia, bloque)}
                  >
                    {content}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderLegend = () => {
    if (!selectedEntity) return null;

    const filteredHorarios = horarios.filter((h) =>
      currentTab === "docentes"
        ? h.docenteId === selectedEntity
        : h.salonId === selectedEntity
    );

    // Agrupar horarios por materia
    const horariosPorMateria: { [key: string]: Horario[] } = {};
    filteredHorarios.forEach((horario: Horario) => {
      const materiaId = String(horario.materiaId);
      if (!horariosPorMateria[materiaId]) {
        horariosPorMateria[materiaId] = [];
      }
      horariosPorMateria[materiaId].push(horario);
    });

    if (Object.keys(horariosPorMateria).length === 0) return null;

    return (
      <View style={styles.legendContainer}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>
          Detalles de clases:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(horariosPorMateria).map((materiaId) => {
            const materia = materias.find(
              (m) => String(m.id) === String(materiaId)
            );

            if (!materia) return null;

            const horarios = horariosPorMateria[materiaId];

            let detailContent = null;

            if (currentTab === "docentes") {
              // Mostrar grupos para este docente y materia
              const gruposIds = [
                ...new Set(horarios.map((h: Horario) => h.salonId)),
              ];
              const gruposNombres = gruposIds
                .map((id) => {
                  const grupo = grupos.find((g) => String(g.id) === String(id));
                  return grupo ? grupo.nombre : "Grupo no encontrado";
                })
                .join(", ");

              detailContent = (
                <Text
                  style={[styles.legendDetailText, { color: colors.secondary }]}
                >
                  Grupos: {gruposNombres}
                </Text>
              );
            } else {
              // Mostrar docente para este grupo y materia
              const docenteId = horarios[0]?.docenteId;
              const docente = docentes.find(
                (d) => String(d.id) === String(docenteId)
              );

              detailContent = (
                <Text
                  style={[styles.legendDetailText, { color: colors.secondary }]}
                >
                  Docente:{" "}
                  {docente
                    ? `${docente.nombre} ${docente.apellido}`
                    : "No asignado"}
                </Text>
              );
            }

            return (
              <View
                key={materiaId}
                style={[styles.legendItem, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.legendItemTitle, { color: colors.text }]}>
                  <Text style={{ fontWeight: "bold" }}>
                    {materia.siglas ||
                      materia.nombre.substring(0, 3).toUpperCase()}
                  </Text>
                  {" - "}
                  {materia.nombre}
                </Text>
                {detailContent}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderModal = () => {
    return (
      <Modal
        visible={showGrupoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGrupoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Seleccionar Grupo
              </Text>
              <TouchableOpacity onPress={() => setShowGrupoModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {grupos.map((grupo) => (
                <TouchableOpacity
                  key={grupo.id}
                  style={[
                    styles.grupoItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleGrupoSelection(grupo.id)}
                >
                  <Text style={[styles.grupoItemText, { color: colors.text }]}>
                    Grupo {grupo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const convertirAPdfDocente = async (entidad: { id: string }) => {
    try {
      // Verificar datos disponibles
      if (!Array.isArray(grupos) || grupos.length === 0) {
        console.warn("No hay grupos disponibles:", grupos);
        Alert.alert(
          "Error",
          "No hay datos de grupos disponibles para generar el PDF."
        );
        return;
      }

      // Obtener información de directivos
      const director = directivos.find((d) => d.rol === "Director");
      const subdirector = directivos.find(
        (d) => d.rol === "Subdirector Académico"
      );

      const directorNombre = director ? director.nombre : "No asignado";
      const directorPuesto = director
        ? director.generoFemenino
          ? "Directora"
          : "Director"
        : "Director";

      const subdirectorNombre = subdirector
        ? subdirector.nombre
        : "No asignado";
      const subdirectorPuesto = subdirector
        ? subdirector.generoFemenino
          ? "Subdirectora Académica"
          : "Subdirector Académico"
        : "Subdirector Académico";

      const docente = docentes?.find(
        (d) => String(d.id) === String(entidad.id)
      );
      if (!docente) {
        Alert.alert("Error", "No se encontró el docente");
        return;
      }

      const titulo = `${docente.nombre} ${docente.apellido}`;
      const numeroEmpleado = docente.numeroEmpleado || "No asignado";

      // Calcular total de horas
      const horariosDocente = horarios.filter(
        (h: Horario) => h.docenteId === entidad.id
      );
      const totalHoras = `${horariosDocente.length} HRS`;

      // Obtener asignaturas únicas
      const materiasIds = [
        ...new Set(horariosDocente.map((h: Horario) => h.materiaId)),
      ];
      const asignaturas = materiasIds.map((id) => {
        const materia = materias.find((m) => m.id === id);
        return materia ? materia.nombre : "Materia no encontrada";
      });

      // Obtener grupos únicos del docente
      const gruposIds = [
        ...new Set(horariosDocente.map((h: Horario) => h.salonId)),
      ];
      const gruposDocente = gruposIds.map((id) => {
        const grupo = grupos.find((g) => g.id === id);
        return grupo ? grupo.nombre : "Grupo no encontrado";
      });

      const horariosEntidad = horarios
        .filter((h: Horario) => String(h.docenteId) === String(entidad.id))
        .sort((a: Horario, b: Horario) => {
          const diasOrden: { [key: string]: number } = {
            Lunes: 0,
            Martes: 1,
            Miércoles: 2,
            Jueves: 3,
            Viernes: 4,
            Sábado: 5,
          };
          if (a.dia !== b.dia) {
            return diasOrden[a.dia] - diasOrden[b.dia];
          }
          return (
            convertirHoraAMinutos(a.horaInicio) -
            convertirHoraAMinutos(b.horaFin)
          );
        });

      const bloquesHorariosConHorarios = bloquesHorarios.map((bloque) => {
        const horariosEnBloque = horariosEntidad.filter(
          (h: Horario) =>
            convertirHoraAMinutos(h.horaInicio) <=
              convertirHoraAMinutos(bloque.horaInicio) &&
            convertirHoraAMinutos(h.horaFin) >
              convertirHoraAMinutos(bloque.horaInicio)
        );
        return { ...bloque, horariosEnBloque };
      });

      // Split bloquesHorariosConHorarios into two parts
      const bloquesHorariosPrimeraParte = bloquesHorariosConHorarios.filter(
        (bloque) =>
          convertirHoraAMinutos(bloque.horaInicio) <
          convertirHoraAMinutos("13:30")
      );
      const bloquesHorariosSegundaParte = bloquesHorariosConHorarios.filter(
        (bloque) =>
          convertirHoraAMinutos(bloque.horaInicio) >=
          convertirHoraAMinutos("13:30")
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter landscape;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              margin: 0;
              padding: 0;
              line-height: 1.2;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
            }
            
            .header h1 {
              font-size: 16px;
              font-weight: bold;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            
            .header h2 {
              font-size: 16px;
              font-weight: normal;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            
            .header h3 {
              font-size: 16px;
              font-weight: normal;
              margin: 0 0 5px 0;
              text-transform: uppercase;
            }
            
            .header .title {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0 0 0;
              font-style: italic;
              text-transform: uppercase;
            }
            
            .info-sections-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 15px;
            }

            .info-section {
              display: flex;
              flex-direction: column;
              font-size: 10px;
              width: 49%;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 3px;
              border-bottom: 1px solid #000;
              padding-bottom: 1px;
            }
            
            .info-label {
              font-weight: bold;
              width: 120px;
              flex-shrink: 0;
            }
            
            .info-value {
              flex: 1;
              text-transform: uppercase;
            }
            
            .schedule-tables-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                gap: 10px;
            }

            .schedule-table {
              width: 49%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 9px;
            }
            
            .schedule-table th,
            .schedule-table td {
              border: 1px solid #000;
              text-align: center;
              vertical-align: middle;
              padding: 2px;
              height: 25px;
            }
            
            .schedule-table th {
              background-color: #94d454;
              font-weight: bold;
              font-size: 10px;
            }
            
            .time-column {
              width: 60px;
              font-weight: bold;
              background-color: #f5f5f5;
            }
            
            .day-column {
              width: 80px;
            }
            
            .receso-row th {
              background-color: #94d454;
              font-weight: bold;
              letter-spacing: 2px;
            }
            
            .group-cell {
              font-size: 12px;
              font-weight: bold;
            }
            
            .signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
            }
            
            .signature {
              text-align: center;
              width: 45%;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              margin: 30px 0 5px 0;
            }
            
            .signature-name {
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            
            .signature-title {
              font-weight: bold;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</h1>
            <h2>ORGANISMO PÚBLICO DESCENTRALIZADO</h2>
            <h3>${nombrePlantel}</h3>
            <div class="title">HORARIO INDIVIDUAL</div>
          </div>
          
          <div class="info-sections-container">
              <div class="info-section">
                  <div class="info-row">
                      <span class="info-label">SEMESTRE:</span>
                      <span class="info-value">${semestre}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">DOCENTE:</span>
                      <span class="info-value">${titulo}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">ASIGNATURAS:</span>
                      <span class="info-value">${asignaturas.join(", ")}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">GRUPO (S):</span>
                      <span class="info-value">${gruposDocente.join(
                        ", "
                      )}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">TOTAL DE HORAS:</span>
                      <span class="info-value">${totalHoras}</span>
                  </div>
                   <div class="info-row">
                      <span class="info-label">NUM. EMPLEADO:</span>
                      <span class="info-value">${numeroEmpleado}</span>
                  </div>
              </div>
              <div class="info-section">
                  <div class="info-row">
                      <span class="info-label">SEMESTRE:</span>
                      <span class="info-value">${semestre}</span>
                  </div>
                   <div class="info-row">
                      <span class="info-label">DOCENTE:</span>
                      <span class="info-value">${titulo}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">ASIGNATURAS:</span>
                      <span class="info-value">${asignaturas.join(", ")}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">GRUPO (S):</span>
                      <span class="info-value">${gruposDocente.join(
                        ", "
                      )}</span>
                  </div>
                  <div class="info-row">
                      <span class="info-label">TOTAL DE HORAS:</span>
                      <span class="info-value">${totalHoras}</span>
                  </div>
                   <div class="info-row">
                      <span class="info-label">NUM. EMPLEADO:</span>
                      <span class="info-value">${numeroEmpleado}</span>
                  </div>
              </div>
          </div>
          
          <div class="schedule-tables-container">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="time-column">HORA</th>
                  ${["L", "M", "M", "J", "V", "S"]
                    .map((dia) => `<th class="day-column">${dia}</th>`)
                    .join("")}  
                </tr>
              </thead>
              <tbody>
                ${bloquesHorariosPrimeraParte
                  .map((bloque) => {
                    if (bloque.esReceso) {
                      return `
                      <tr class="receso-row">
                        <th class="time-column">${bloque.horaInicio}<br>${bloque.horaFin}</th>
                        <th>R</th>
                        <th>E</th>
                        <th>C</th>
                        <th>E</th>
                        <th>S</th>
                        <th>O</th>
                      </tr>
                    `;
                    }

                    return `
                    <tr>
                      <td class="time-column">${bloque.horaInicio}<br>${
                      bloque.horaFin
                    }</td>
                      ${[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                      ]
                        .map((diaCompleto) => {
                          const horario = bloque.horariosEnBloque.find(
                            (h: Horario) => h.dia === diaCompleto
                          );

                          if (!horario) return "<td></td>";

                          const grupo = grupos.find(
                            (g) => String(g.id) === String(horario.salonId)
                          );
                          return `<td class="group-cell">${
                            grupo ? grupo.nombre : "Grupo no encontrado"
                          }</td>`;
                        })
                        .join("")}
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>

            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="time-column">HORA</th>
                  ${["L", "M", "M", "J", "V", "S"]
                    .map((dia) => `<th class="day-column">${dia}</th>`)
                    .join("")}  
                </tr>
              </thead>
              <tbody>
                ${bloquesHorariosSegundaParte
                  .map((bloque) => {
                    if (bloque.esReceso) {
                      return `
                      <tr class="receso-row">
                        <th class="time-column">${bloque.horaInicio}<br>${bloque.horaFin}</th>
                        <th>R</th>
                        <th>E</th>
                        <th>C</th>
                        <th>E</th>
                        <th>S</th>
                        <th>O</th>
                      </tr>
                    `;
                    }

                    return `
                    <tr>
                      <td class="time-column">${bloque.horaInicio}<br>${
                      bloque.horaFin
                    }</td>
                      ${[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                      ]
                        .map((diaCompleto) => {
                          const horario = bloque.horariosEnBloque.find(
                            (h: Horario) => h.dia === diaCompleto
                          );

                          if (!horario) return "<td></td>";

                          const grupo = grupos.find(
                            (g) => String(g.id) === String(horario.salonId)
                          );
                          return `<td class="group-cell">${
                            grupo ? grupo.nombre : "Grupo no encontrado"
                          }</td>`;
                        })
                        .join("")}
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="signatures">
            <div class="signature">
              <div>ELABORÓ:</div>
              <div class="signature-line"></div>
              <div class="signature-name">${subdirectorNombre}</div>
              <div class="signature-title">${subdirectorPuesto}</div>
            </div>
            <div class="signature">
              <div>Vo. Bo.</div>
              <div class="signature-line"></div>
              <div class="signature-name">${directorNombre}</div>
              <div class="signature-title">${directorPuesto}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir horario",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.");
    }
  };

  const convertirAPdfGrupo = async (entidad: { id: string }) => {
    try {
      // Verificar datos disponibles
      if (!Array.isArray(grupos) || grupos.length === 0) {
        console.warn("No hay grupos disponibles:", grupos);
        Alert.alert(
          "Error",
          "No hay datos de grupos disponibles para generar el PDF."
        );
        return;
      }

      // Obtener información de directivos
      const director = directivos.find((d) => d.rol === "Director");
      const subdirector = directivos.find(
        (d) => d.rol === "Subdirector Académico"
      );

      const directorNombre = director ? director.nombre : "No asignado";
      const directorPuesto = director
        ? director.generoFemenino
          ? "Directora"
          : "Director"
        : "Director";

      const subdirectorNombre = subdirector
        ? subdirector.nombre
        : "No asignado";
      const subdirectorPuesto = subdirector
        ? subdirector.generoFemenino
          ? "Subdirectora Académica"
          : "Subdirector Académico"
        : "Subdirector Académico";

      const grupo = grupos?.find((g) => String(g.id) === String(entidad.id));
      if (!grupo) {
        Alert.alert("Error", "No se encontró el grupo");
        return;
      }

      const titulo = grupo.nombre;

      const horariosEntidad = horarios
        .filter((h: Horario) => String(h.salonId) === String(entidad.id))
        .sort((a: Horario, b: Horario) => {
          const diasOrden: { [key: string]: number } = {
            Lunes: 0,
            Martes: 1,
            Miércoles: 2,
            Jueves: 3,
            Viernes: 4,
            Sábado: 5,
          };
          if (a.dia !== b.dia) {
            return diasOrden[a.dia] - diasOrden[b.dia];
          }
          return (
            convertirHoraAMinutos(a.horaInicio) -
            convertirHoraAMinutos(b.horaFin)
          );
        });

      // Determinar si hay clases en el turno matutino o vespertino
      const hayClasesMatutinas = horariosEntidad.some(
        (h) =>
          convertirHoraAMinutos(h.horaInicio) < convertirHoraAMinutos("13:30")
      );
      const hayClasesVespertinas = horariosEntidad.some(
        (h) =>
          convertirHoraAMinutos(h.horaInicio) >= convertirHoraAMinutos("13:30")
      );

      // Seleccionar los bloques según el turno que tenga clases
      const bloquesHorariosConHorarios = bloquesHorarios
        .filter((bloque) => {
          if (hayClasesMatutinas && !hayClasesVespertinas) {
            return (
              convertirHoraAMinutos(bloque.horaInicio) <
              convertirHoraAMinutos("13:30")
            );
          } else if (!hayClasesMatutinas && hayClasesVespertinas) {
            return (
              convertirHoraAMinutos(bloque.horaInicio) >=
              convertirHoraAMinutos("13:30")
            );
          }
          return true;
        })
        .map((bloque) => {
          const horariosEnBloque = horariosEntidad.filter(
            (h: Horario) =>
              convertirHoraAMinutos(h.horaInicio) <=
                convertirHoraAMinutos(bloque.horaInicio) &&
              convertirHoraAMinutos(h.horaFin) >
                convertirHoraAMinutos(bloque.horaInicio)
          );
          return { ...bloque, horariosEnBloque };
        });

      // Obtener lista única de materias y docentes
      const materiasYDocentes = horariosEntidad.reduce(
        (acc: any[], horario) => {
          const materia = materias.find((m) => m.id === horario.materiaId);
          const docente = docentes.find((d) => d.id === horario.docenteId);
          if (materia && docente) {
            const materiaDisplay = `${
              materia.siglas || materia.nombre.substring(0, 6).toUpperCase()
            } - ${materia.nombre}`;
            const docenteDisplay = `${docente.nombre} ${docente.apellido}`;
            if (
              !acc.some(
                (item) =>
                  item.materia === materiaDisplay &&
                  item.docente === docenteDisplay
              )
            ) {
              acc.push({ materia: materiaDisplay, docente: docenteDisplay });
            }
          }
          return acc;
        },
        []
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter landscape;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              margin: 0;
              padding: 0;
              line-height: 1.2;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
            }
            
            .header h1 {
              font-size: 16px;
              font-weight: bold;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            
            .header h2 {
              font-size: 16px;
              font-weight: normal;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            
            .header h3 {
              font-size: 16px;
              font-weight: normal;
              margin: 0 0 5px 0;
              text-transform: uppercase;
            }
            
            .header .title {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0 0 0;
              font-style: italic;
              text-transform: uppercase;
            }
            
            .info-section {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              width: 100%;
              margin-bottom: 15px;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 3px;
              border-bottom: 1px solid #000;
              padding-bottom: 1px;
            }
            
            .info-label {
              font-weight: bold;
              width: 120px;
              flex-shrink: 0;
            }
            
            .info-value {
              flex: 1;
              text-transform: uppercase;
            }
            
            .content-container {
              display: flex;
              gap: 20px;
              align-items: flex-start;
            }

            .schedule-table {
              flex: 2;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 9px;
              width: 65%;
            }
            
            .schedule-table th,
            .schedule-table td {
              border: 1px solid #000;
              text-align: center;
              vertical-align: middle;
              padding: 2px;
              height: 25px;
            }
            
            .schedule-table th {
              background-color: #94d454;
              font-weight: bold;
              font-size: 10px;
            }
            
            .time-column {
              width: 60px;
              font-weight: bold;
              background-color: #f5f5f5;
            }
            
            .day-column {
              width: 80px;
            }
            
            .receso-row th {
              background-color: #94d454;
              font-weight: bold;
              letter-spacing: 2px;
            }
            
            .class-cell {
              font-size: 8px;
              font-weight: bold;
              text-transform: uppercase;
              line-height: 1.1;
              padding: 1px;
            }

            .subjects-table {
              flex: 1;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 9px;
              width: 30%;
            }

            .subjects-table th,
            .subjects-table td {
              border: 1px solid #000;
              text-align: left;
              vertical-align: middle;
              padding: 4px;
              height: 20px;
            }

            .subjects-table th {
              background-color: #94d454;
              font-weight: bold;
              font-size: 10px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</h1>
            <h2>ORGANISMO PÚBLICO DESCENTRALIZADO</h2>
            <h3>${nombrePlantel}</h3>
            <div class="title">HORARIO DE GRUPO ${titulo}</div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">PLANTEL:</span>
              <span class="info-value">${nombrePlantel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">SEMESTRE:</span>
              <span class="info-value">${semestre}</span>
            </div>
          </div>
          
          <div class="content-container">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="time-column">HORA</th>
                  ${["L", "M", "M", "J", "V", "S"]
                    .map((dia) => `<th class="day-column">${dia}</th>`)
                    .join("")}  
                </tr>
              </thead>
              <tbody>
                ${bloquesHorariosConHorarios
                  .map((bloque) => {
                    if (bloque.esReceso) {
                      return `
                      <tr class="receso-row">
                        <th class="time-column">${bloque.horaInicio}<br>${bloque.horaFin}</th>
                        <th>R</th>
                        <th>E</th>
                        <th>C</th>
                        <th>E</th>
                        <th>S</th>
                        <th>O</th>
                      </tr>
                    `;
                    }

                    return `
                    <tr>
                      <td class="time-column">${bloque.horaInicio}<br>${
                      bloque.horaFin
                    }</td>
                      ${[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                      ]
                        .map((diaCompleto) => {
                          const horario = bloque.horariosEnBloque.find(
                            (h: Horario) => h.dia === diaCompleto
                          );

                          if (!horario) return "<td></td>";

                          const materia = materias.find(
                            (m) => m.id === horario.materiaId
                          );
                          const materiaDisplay = materia
                            ? materia.siglas ||
                              materia.nombre.substring(0, 6).toUpperCase()
                            : "Materia no encontrada";

                          return `
                               <td class="class-cell">
                                 ${materiaDisplay}
                               </td>
                             `;
                        })
                        .join("")}
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>

            <table class="subjects-table">
              <thead>
                <tr>
                  <th>ASIGNATURA</th>
                  <th>DOCENTE</th>
                </tr>
              </thead>
              <tbody>
                ${materiasYDocentes
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.materia}</td>
                    <td>${item.docente}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir horario",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.");
    }
  };

  const convertirAPdf = async (entidad: { id: string }) => {
    if (currentTab === "docentes") {
      await convertirAPdfDocente(entidad);
    } else {
      await convertirAPdfGrupo(entidad);
    }
  };

  // Función para inicializar la configuración de un docente
  const initDocenteConfig = (docenteId: string, materiasDocente: string[]) => {
    setAutoScheduleConfigs((prev) => ({
      ...prev,
      [docenteId]: prev[docenteId] || {
        grupos: [],
        horasPorMateria: {},
        materias: materiasDocente,
      },
    }));
  };

  // Función para obtener los bloques horarios según el turno
  const getBloquesPorTurno = (turno: "matutino" | "vespertino") => {
    if (turno === "matutino") {
      return bloquesHorarios.filter(
        (bloque) =>
          convertirHoraAMinutos(bloque.horaInicio) >=
            convertirHoraAMinutos("07:00") &&
          convertirHoraAMinutos(bloque.horaFin) <=
            convertirHoraAMinutos("13:20")
      );
    } else {
      // Para el turno vespertino, incluir todos los bloques desde las 13:30
      return bloquesHorarios.filter(
        (bloque) =>
          convertirHoraAMinutos(bloque.horaInicio) >=
          convertirHoraAMinutos("13:30")
      );
    }
  };

  // Renderizado de la pestaña de generación automática
  const renderAutoScheduleTab = () => {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={[styles.autoScheduleHeader, { borderColor: colors.border }]}
        >
          <View style={[styles.autoScheduleInputContainer, { width: 245 }]}>
            <Text
              style={[styles.autoScheduleInputLabel, { color: colors.text }]}
            >
              Nombre del Plantel:
            </Text>
            <TextInput
              style={[
                styles.autoScheduleInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={nombrePlantel}
              onChangeText={setNombrePlantel}
              placeholder=""
              placeholderTextColor={colors.text + "80"}
            />
          </View>
          <View style={[styles.autoScheduleInputContainer, { width: 120 }]}>
            <Text
              style={[styles.autoScheduleInputLabel, { color: colors.text }]}
            >
              Semestre:
            </Text>
            <TextInput
              style={[
                styles.autoScheduleInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={semestre}
              onChangeText={setSemestre}
              placeholder=""
              placeholderTextColor={colors.text + "80"}
            />
          </View>
        </View>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <FlatList
            data={docentes}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item: docente }) => {
              const isExpanded = expandedDocenteId === docente.id;
              const config = autoScheduleConfigs[docente.id] || {
                grupos: [],
                horasPorMateria: {},
                materias: docente.materias.map((m) => m.id),
              };
              return (
                <View
                  key={docente.id}
                  style={[
                    styles.autoScheduleCard,
                    { borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.autoScheduleCardHeader}
                    onPress={() => {
                      setExpandedDocenteId(isExpanded ? null : docente.id);
                      if (!autoScheduleConfigs[docente.id]) {
                        initDocenteConfig(
                          docente.id,
                          docente.materias.map((m) => m.id)
                        );
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.autoScheduleCardTitle,
                        { color: colors.text },
                      ]}
                    >
                      {docente.nombre} {docente.apellido}
                    </Text>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View
                      style={[
                        styles.autoScheduleCardContent,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      {/* Sección de Materias */}
                      <View style={styles.autoScheduleSection}>
                        <Text
                          style={[
                            styles.autoScheduleSectionTitle,
                            { color: colors.text },
                          ]}
                        >
                          Materias
                        </Text>
                        {docente.materias.map((materia) => (
                          <View
                            key={materia.id}
                            style={styles.autoScheduleMateriaItem}
                          >
                            <TouchableOpacity
                              style={[
                                styles.autoScheduleCheckbox,
                                {
                                  borderColor: colors.primary,
                                  backgroundColor: config.materias.includes(
                                    materia.id
                                  )
                                    ? colors.primary
                                    : "transparent",
                                },
                              ]}
                              onPress={() => {
                                setAutoScheduleConfigs((prev) => ({
                                  ...prev,
                                  [docente.id]: {
                                    ...config,
                                    materias: config.materias.includes(
                                      materia.id
                                    )
                                      ? config.materias.filter(
                                          (id) => id !== materia.id
                                        )
                                      : [...config.materias, materia.id],
                                  },
                                }));
                              }}
                            >
                              {config.materias.includes(materia.id) && (
                                <Feather name="check" size={16} color="#fff" />
                              )}
                            </TouchableOpacity>
                            <Text
                              style={[
                                styles.autoScheduleMateriaText,
                                { color: colors.text },
                              ]}
                            >
                              {materia.nombre}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Sección de Grupos */}
                      <View style={styles.autoScheduleSection}>
                        <Text
                          style={[
                            styles.autoScheduleSectionTitle,
                            { color: colors.text },
                          ]}
                        >
                          Grupos
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={{ marginBottom: 8 }}
                        >
                          <View style={styles.autoScheduleGruposContainer}>
                            {grupos.map((grupo) => (
                              <View
                                key={grupo.id}
                                style={styles.grupoTurnoContainer}
                              >
                                <TouchableOpacity
                                  style={[
                                    styles.autoScheduleGrupoItem,
                                    {
                                      backgroundColor: config.grupos.includes(
                                        grupo.id
                                      )
                                        ? colors.primary + "20"
                                        : "transparent",
                                      borderColor: config.grupos.includes(
                                        grupo.id
                                      )
                                        ? colors.primary
                                        : colors.border,
                                    },
                                  ]}
                                  onPress={() => {
                                    setAutoScheduleConfigs((prev) => ({
                                      ...prev,
                                      [docente.id]: {
                                        ...config,
                                        grupos: config.grupos.includes(grupo.id)
                                          ? config.grupos.filter(
                                              (id) => id !== grupo.id
                                            )
                                          : [...config.grupos, grupo.id],
                                      },
                                    }));
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.autoScheduleGrupoText,
                                      {
                                        color: config.grupos.includes(grupo.id)
                                          ? colors.primary
                                          : colors.text,
                                      },
                                    ]}
                                  >
                                    {grupo.nombre}
                                  </Text>
                                </TouchableOpacity>
                                {config.grupos.includes(grupo.id) && (
                                  <View style={styles.turnoSelector}>
                                    <TouchableOpacity
                                      style={[
                                        styles.turnoButton,
                                        {
                                          backgroundColor:
                                            gruposTurnos[grupo.id] ===
                                            "matutino"
                                              ? colors.primary
                                              : "transparent",
                                          borderColor: colors.primary,
                                        },
                                      ]}
                                      onPress={() =>
                                        setGruposTurnos((prev) => ({
                                          ...prev,
                                          [grupo.id]: "matutino",
                                        }))
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.turnoButtonText,
                                          {
                                            color:
                                              gruposTurnos[grupo.id] ===
                                              "matutino"
                                                ? "#fff"
                                                : colors.primary,
                                          },
                                        ]}
                                      >
                                        Matutino
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.turnoButton,
                                        {
                                          backgroundColor:
                                            gruposTurnos[grupo.id] ===
                                            "vespertino"
                                              ? colors.primary
                                              : "transparent",
                                          borderColor: colors.primary,
                                        },
                                      ]}
                                      onPress={() =>
                                        setGruposTurnos((prev) => ({
                                          ...prev,
                                          [grupo.id]: "vespertino",
                                        }))
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.turnoButtonText,
                                          {
                                            color:
                                              gruposTurnos[grupo.id] ===
                                              "vespertino"
                                                ? "#fff"
                                                : colors.primary,
                                          },
                                        ]}
                                      >
                                        Vespertino
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      {/* Sección de Horas por Materia */}
                      <View style={styles.autoScheduleSection}>
                        <Text
                          style={[
                            styles.autoScheduleSectionTitle,
                            { color: colors.text },
                          ]}
                        >
                          Horas por materia
                        </Text>
                        {config.materias.map((materiaId) => {
                          const materia = materias.find(
                            (m) => m.id === materiaId
                          );
                          if (!materia) return null;
                          return (
                            <View
                              key={materiaId}
                              style={styles.autoScheduleHorasContainer}
                            >
                              <Text
                                style={[
                                  styles.autoScheduleHorasLabel,
                                  { color: colors.text },
                                ]}
                              >
                                {materia.nombre}
                              </Text>
                              <TextInput
                                style={[
                                  styles.autoScheduleHorasInput,
                                  {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                  },
                                ]}
                                keyboardType="number-pad"
                                value={String(
                                  config.horasPorMateria[materiaId] || ""
                                )}
                                onChangeText={(text) => {
                                  const horas = parseInt(text) || 0;
                                  setAutoScheduleConfigs((prev) => ({
                                    ...prev,
                                    [docente.id]: {
                                      ...config,
                                      horasPorMateria: {
                                        ...config.horasPorMateria,
                                        [materiaId]: horas,
                                      },
                                    },
                                  }));
                                }}
                                placeholder="Horas"
                                placeholderTextColor={colors.text + "80"}
                              />
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
        {/* Botón para generar horarios de todos los docentes */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            {
              backgroundColor: colors.primary,
              margin: 16,
              alignSelf: "center",
            },
          ]}
          onPress={generateAutoScheduleForAll}
        >
          <Text style={styles.generateButtonText}>Generar horarios</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Función para generar horarios para todos los docentes
  const generateAutoScheduleForAll = async () => {
    let totalHorariosGenerados = 0;
    let mensajesAdvertencia: string[] = [];
    let nuevosHorarios: Horario[] = [];
    try {
      const diasOrdenados = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
      ];

      // Función auxiliar para verificar disponibilidad de un bloque
      const isBloqueDisponible = (
        dia: string,
        bloque: { horaInicio: string; horaFin: string },
        docenteId: string,
        grupoId: string
      ) => {
        // Verificar si el docente ya tiene clase en ese horario
        const docenteOcupado = horarios.some(
          (h) =>
            h.dia === dia &&
            h.horaInicio === bloque.horaInicio &&
            h.docenteId === docenteId
        );

        // Verificar si el grupo ya tiene clase en ese horario en el mismo día
        const grupoOcupadoEnDia = horarios.some(
          (h) =>
            h.dia === dia &&
            h.horaInicio === bloque.horaInicio &&
            h.salonId === grupoId
        );

        // Verificar si el grupo ya tiene clase en esa hora en cualquier día (vertical)
        const grupoOcupadoEnHora = horarios.some(
          (h) => h.horaInicio === bloque.horaInicio && h.salonId === grupoId
        );

        return !docenteOcupado && !grupoOcupadoEnDia && !grupoOcupadoEnHora;
      };

      // Función para encontrar el mejor bloque disponible
      const encontrarMejorBloque = (
        docenteId: string,
        grupoId: string,
        disponibilidad: { [key: string]: { [key: string]: boolean } },
        horariosAsignados: Horario[],
        intentos: number = 0
      ) => {
        const turno = gruposTurnos[grupoId] || "matutino";
        const bloquesDisponibles = getBloquesPorTurno(turno);

        // Función para verificar si un bloque es continuo con otros horarios del grupo
        const esBloqueContinuo = (
          dia: string,
          bloque: { horaInicio: string; horaFin: string }
        ) => {
          const horariosGrupoEnDia = horariosAsignados.filter(
            (h) => h.salonId === grupoId && h.dia === dia
          );

          if (horariosGrupoEnDia.length === 0) return true;

          // Ordenar horarios por hora de inicio
          const horariosOrdenados = [...horariosGrupoEnDia].sort(
            (a, b) =>
              convertirHoraAMinutos(a.horaInicio) -
              convertirHoraAMinutos(b.horaInicio)
          );

          // Verificar si el bloque es continuo con algún horario existente
          return horariosOrdenados.some((h) => {
            const horaFinHorario = convertirHoraAMinutos(h.horaFin);
            const horaInicioBloque = convertirHoraAMinutos(bloque.horaInicio);
            const horaFinBloque = convertirHoraAMinutos(bloque.horaFin);
            const horaInicioHorario = convertirHoraAMinutos(h.horaInicio);

            // Es continuo si termina justo cuando empieza otro o empieza justo cuando termina otro
            return (
              horaFinHorario === horaInicioBloque ||
              horaInicioHorario === horaFinBloque
            );
          });
        };

        // Función para calcular la puntuación de un bloque
        const calcularPuntuacionBloque = (
          dia: string,
          bloque: { horaInicio: string; horaFin: string }
        ) => {
          let puntuacion = 0;

          // Priorizar bloques continuos
          if (esBloqueContinuo(dia, bloque)) {
            puntuacion += 20; // Aumentamos la prioridad de bloques continuos
          }

          // Priorizar horarios tempranos según el turno
          const horaInicioMinutos = convertirHoraAMinutos(bloque.horaInicio);
          if (turno === "matutino") {
            if (horaInicioMinutos < convertirHoraAMinutos("08:00")) {
              puntuacion += 25; // Máxima prioridad para primeras horas de la mañana
            } else if (horaInicioMinutos < convertirHoraAMinutos("10:00")) {
              puntuacion += 20;
            } else if (horaInicioMinutos < convertirHoraAMinutos("12:00")) {
              puntuacion += 15;
            }
          } else if (turno === "vespertino") {
            if (horaInicioMinutos < convertirHoraAMinutos("14:00")) {
              puntuacion += 25; // Máxima prioridad para primeras horas de la tarde
            } else if (horaInicioMinutos < convertirHoraAMinutos("16:00")) {
              puntuacion += 20;
            } else if (horaInicioMinutos < convertirHoraAMinutos("18:00")) {
              puntuacion += 15;
            }
          }

          // Penalizar espacios libres entre clases
          const horariosDelDia = horariosAsignados.filter((h) => h.dia === dia);
          if (horariosDelDia.length > 0) {
            const hayEspacioLibre = horariosDelDia.some((h) => {
              const horaFinHorario = convertirHoraAMinutos(h.horaFin);
              const horaInicioBloque = convertirHoraAMinutos(bloque.horaInicio);
              const horaFinBloque = convertirHoraAMinutos(bloque.horaFin);
              const horaInicioHorario = convertirHoraAMinutos(h.horaInicio);

              // Si hay un espacio libre entre clases
              return (
                (horaFinHorario < horaInicioBloque &&
                  horaInicioBloque - horaFinHorario > 60) ||
                (horaFinBloque < horaInicioHorario &&
                  horaInicioHorario - horaFinBloque > 60)
              );
            });

            if (hayEspacioLibre) {
              puntuacion -= 25; // Mayor penalización por espacios libres
            }
          }

          // Priorizar el llenado horizontal (de lunes a viernes)
          const indiceDia = diasOrdenados.indexOf(dia);
          const numHorariosEnDia = horariosDelDia.length;
          puntuacion += (5 - indiceDia) * 2; // Más puntuación para días anteriores
          puntuacion += numHorariosEnDia * 3; // Más puntuación para días con más clases

          // Penalizar horarios dispersos
          const horariosOrdenados = [...horariosDelDia].sort(
            (a, b) =>
              convertirHoraAMinutos(a.horaInicio) -
              convertirHoraAMinutos(b.horaInicio)
          );

          if (horariosOrdenados.length > 0) {
            const distanciaPromedio =
              horariosOrdenados.reduce((acc: number, h, i) => {
                if (i === 0) return acc;
                const distancia =
                  convertirHoraAMinutos(h.horaInicio) -
                  convertirHoraAMinutos(horariosOrdenados[i - 1].horaFin);
                return acc + distancia;
              }, 0) /
              (horariosOrdenados.length - 1);

            if (distanciaPromedio > 60) {
              // Si hay más de 1 hora de promedio entre clases
              puntuacion -= 20;
            }
          }

          return puntuacion;
        };

        // Si ya intentamos demasiadas veces, intentar con cualquier bloque disponible
        if (intentos > 3) {
          let mejorPuntuacion = -1;
          let mejorBloque = null;

          // Primero intentar con bloques en días con menos clases
          const diasPorClases = diasOrdenados
            .map((dia) => ({
              dia,
              clases: horariosAsignados.filter((h) => h.dia === dia).length,
            }))
            .sort((a, b) => a.clases - b.clases);

          for (const { dia } of diasPorClases) {
            for (const bloque of bloquesDisponibles) {
              if (bloque.esReceso) continue;
              if (
                disponibilidad[dia][bloque.horaInicio] &&
                isBloqueDisponible(dia, bloque, docenteId, grupoId)
              ) {
                const puntuacion = calcularPuntuacionBloque(dia, bloque);
                if (puntuacion > mejorPuntuacion) {
                  mejorPuntuacion = puntuacion;
                  mejorBloque = { dia, bloque };
                }
              }
            }
          }
          return mejorBloque;
        }

        // Buscar el mejor bloque disponible priorizando el llenado horizontal
        let mejorPuntuacion = -1;
        let mejorBloque = null;

        // Ordenar los días por número de clases (menos a más)
        const diasOrdenadosPorClases = diasOrdenados
          .map((dia) => ({
            dia,
            clases: horariosAsignados.filter((h) => h.dia === dia).length,
          }))
          .sort((a, b) => a.clases - b.clases)
          .map((d) => d.dia);

        for (const dia of diasOrdenadosPorClases) {
          for (const bloque of bloquesDisponibles) {
            if (bloque.esReceso) continue;
            if (
              disponibilidad[dia][bloque.horaInicio] &&
              isBloqueDisponible(dia, bloque, docenteId, grupoId)
            ) {
              const puntuacion = calcularPuntuacionBloque(dia, bloque);
              if (puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorBloque = { dia, bloque };
              }
            }
          }
        }

        return mejorBloque;
      };

      for (const docente of docentes) {
        const config = autoScheduleConfigs[docente.id];
        if (!config) continue;

        // Crear mapa de disponibilidad inicial
        const disponibilidad = diasOrdenados.reduce((acc, dia) => {
          acc[dia] = bloquesHorarios.reduce((bloqueAcc, bloque) => {
            if (bloque.esReceso) {
              bloqueAcc[bloque.horaInicio] = false;
            } else {
              bloqueAcc[bloque.horaInicio] = true;
            }
            return bloqueAcc;
          }, {} as { [key: string]: boolean });
          return acc;
        }, {} as { [key: string]: { [key: string]: boolean } });

        // Para cada materia del docente
        for (const materiaId of config.materias) {
          const horasNecesarias = config.horasPorMateria[materiaId] || 0;
          let horasAsignadas = 0;
          let grupoIndex = 0;
          let intentosPorGrupo = new Map<string, number>();

          // Intentar asignar todas las horas necesarias
          while (horasAsignadas < horasNecesarias) {
            const grupoId = config.grupos[grupoIndex % config.grupos.length];
            const intentos = intentosPorGrupo.get(grupoId) || 0;

            // Si ya intentamos demasiadas veces con este grupo, pasar al siguiente
            if (intentos > 5) {
              grupoIndex++;
              continue;
            }

            // Encontrar el mejor bloque disponible
            const mejorBloque = encontrarMejorBloque(
              docente.id,
              grupoId,
              disponibilidad,
              nuevosHorarios,
              intentos
            );

            if (mejorBloque) {
              // Asignar la clase
              nuevosHorarios.push({
                id:
                  Date.now().toString() +
                  Math.random().toString(36).substr(2, 9),
                docenteId: docente.id,
                materiaId,
                dia: mejorBloque.dia,
                horaInicio: mejorBloque.bloque.horaInicio,
                horaFin: mejorBloque.bloque.horaFin,
                salonId: grupoId,
              });

              // Marcar el bloque como ocupado
              disponibilidad[mejorBloque.dia][mejorBloque.bloque.horaInicio] =
                false;
              horasAsignadas++;
              grupoIndex++;
              intentosPorGrupo.set(grupoId, 0); // Resetear intentos si tuvo éxito
            } else {
              intentosPorGrupo.set(grupoId, intentos + 1);
              grupoIndex++;
            }
          }

          if (horasAsignadas < horasNecesarias) {
            const materia = materias.find((m) => m.id === materiaId);
            mensajesAdvertencia.push(
              `No se pudieron asignar todas las horas para ${
                materia?.nombre || "la materia"
              } del docente ${docente.nombre} ${
                docente.apellido
              }. Horas asignadas: ${horasAsignadas} de ${horasNecesarias}`
            );
          }
        }
      }

      // Guardar los nuevos horarios
      if (nuevosHorarios.length > 0) {
        const updatedHorarios = [...horarios, ...nuevosHorarios];
        await AsyncStorage.setItem("horarios", JSON.stringify(updatedHorarios));
        updateHorarios(updatedHorarios);
        totalHorariosGenerados = nuevosHorarios.length;
      }

      let mensaje = `Se generaron ${totalHorariosGenerados} nuevos horarios para todos los docentes seleccionados.`;
      if (mensajesAdvertencia.length > 0) {
        mensaje += "\n\nAdvertencias:\n" + mensajesAdvertencia.join("\n");
      }
      Alert.alert("Resultado", mensaje);
    } catch (error) {
      console.error("Error al generar horarios automáticamente:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error al generar los horarios automáticamente"
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            currentTab === "docentes" && [
              styles.activeTab,
              { borderColor: colors.primary },
            ],
          ]}
          onPress={() => {
            setCurrentTab("docentes");
            setSelectedEntity(null);
            setSearchQuery("");
          }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: currentTab === "docentes" ? colors.primary : colors.text,
              },
            ]}
          >
            Docentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            currentTab === "grupos" && [
              styles.activeTab,
              { borderColor: colors.primary },
            ],
          ]}
          onPress={() => {
            setCurrentTab("grupos");
            setSelectedEntity(null);
            setSearchQuery("");
          }}
        >
          <Text
            style={[
              styles.tabText,
              { color: currentTab === "grupos" ? colors.primary : colors.text },
            ]}
          >
            Grupos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            currentTab === "auto" && [
              styles.activeTab,
              { borderColor: colors.primary },
            ],
          ]}
          onPress={() => {
            setCurrentTab("auto");
            setSelectedEntity(null);
            setSearchQuery("");
          }}
        >
          <Text
            style={[
              styles.tabText,
              { color: currentTab === "auto" ? colors.primary : colors.text },
            ]}
          >
            Generación
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {currentTab === "auto" ? (
          renderAutoScheduleTab()
        ) : !selectedEntity ? (
          renderEntityList()
        ) : (
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleHeaderLeft}>
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedEntity(null)}
                >
                  <Feather name="arrow-left" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={[styles.scheduleTitle, { color: colors.text }]}>
                  Horario de {currentTab === "docentes" ? "Docente" : "Grupo"}
                </Text>
              </View>
            </View>

            {renderMateriaSelector()}
            {renderScheduleTable()}
            {renderLegend()}
          </View>
        )}
      </View>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  entityListContainer: {
    flex: 1,
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    marginHorizontal: 10,
    marginBottom: 15,
    marginTop: 5,
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
  entityList: {
    flex: 1,
  },
  entityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  entityCard: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  entityName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pdfButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  pdfButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    marginLeft: 8,
    width: 40,
  },
  cardButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  scheduleContainer: {
    flex: 1,
    padding: 10,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scheduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    height: 40,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  timeCell: {
    width: 80,
  },
  timeCellText: {
    fontSize: 10,
  },
  cellText: {
    fontSize: 12,
    textAlign: "center",
  },
  recesoCell: {
    backgroundColor: "#f8f9fa",
  },
  recesoCellText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  legendContainer: {
    marginTop: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  legendItem: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    minWidth: 150,
  },
  legendItemTitle: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 5,
  },
  legendDetailText: {
    fontSize: 12,
  },
  materiaSelectorContainer: {
    marginBottom: 15,
  },
  materiaSelectorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  materiaSelectorScroll: {
    flexDirection: "row",
  },
  materiaItem: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
  },
  materiaItemText: {
    fontSize: 12,
  },
  noMateriasText: {
    fontSize: 14,
    textAlign: "center",
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalScroll: {
    maxHeight: 300,
  },
  grupoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  grupoItemText: {
    fontSize: 16,
  },
  cellContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellSubText: {
    fontSize: 8,
    textAlign: "center",
  },
  cellDocText: {
    fontSize: 10,
    textAlign: "center",
  },
  autoScheduleCard: {
    width: "100%",
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  autoScheduleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  autoScheduleCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  autoScheduleCardContent: {
    marginTop: 15,
  },
  autoScheduleSection: {
    marginBottom: 20,
  },
  autoScheduleSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  autoScheduleMateriaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  autoScheduleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  autoScheduleMateriaText: {
    fontSize: 14,
    flex: 1,
  },
  autoScheduleGruposContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  autoScheduleGrupoItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  autoScheduleGrupoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  autoScheduleHorasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  autoScheduleHorasLabel: {
    fontSize: 14,
    flex: 1,
  },
  autoScheduleHorasInput: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 14,
  },
  generateButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  grupoTurnoContainer: {
    marginRight: 10,
    marginBottom: 10,
  },
  turnoSelector: {
    flexDirection: "row",
    marginTop: 5,
    gap: 5,
  },
  turnoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  turnoButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  autoScheduleHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 15,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    gap: 20,
  },
  autoScheduleInputContainer: {
    flex: 0,
    paddingHorizontal: 8,
  },
  autoScheduleInputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  autoScheduleInput: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 14,
  },
  input: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  plantelInput: {
    width: "100%",
  },
  semestreInput: {
    width: "50%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  hideScrollbar: {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
});

export default ScheduleScreen;
