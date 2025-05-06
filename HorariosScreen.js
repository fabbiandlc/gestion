import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { useDataContext } from "./DataContext";
import { stylesHorarios as styles } from "./stylesHorarios";
import { v4 as uuidv4 } from "uuid";

const HorariosScreen = ({ navigation }) => {
  const {
    docentes,
    setDocentes,
    materias,
    setMaterias,
    grupos,
    horarios,
    setHorarios,
    directivos,
  } = useDataContext();

  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [filteredGrupos, setFilteredGrupos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState("list");
  const [currentTab, setCurrentTab] = useState("docentes");
  const [editingHorario, setEditingHorario] = useState(null);
  const [selectedMateriaId, setSelectedMateriaId] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState("");

  const [newHorario, setNewHorario] = useState({
    docenteId: "",
    dia: "Lunes",
    horaInicio: "07:00",
    horaFin: "07:50",
    materiaId: "",
    salonId: "",
    color: "#E3F2FD",
  });

  const [originalHours, setOriginalHours] = useState({
    horaInicio: "",
    horaFin: "",
  });

  const coloresDisponibles = [
    { nombre: "Azul", valor: "#3E6B9E" },
    { nombre: "Verde", valor: "#3A7D44" },
    { nombre: "Morado", valor: "#5D4A8C" },
    { nombre: "Rosa", valor: "#A45A76" },
    { nombre: "Naranja", valor: "#B56B3C" },
    { nombre: "Amarillo", valor: "#A59132" },
  ];

  const timeSlots = [
    "07:00",
    "07:50",
    "08:40",
    "09:30",
    "10:20",
    "11:10",
    "12:00",
    "12:30",
    "13:30",
    "14:20",
    "15:10",
    "16:00",
    "16:30",
    "17:20",
    "18:10",
    "19:00",
    "19:50",
  ];

  const convertirHoraAMinutos = (hora) => {
    const [hh, mm] = hora.split(":").map(Number);
    return hh * 60 + mm;
  };

  const bloquesHorarios = useMemo(
    () => [
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
      { horaInicio: "18:10", horaFin: "19:00", esReceso: false },
      { horaInicio: "19:00", horaFin: "19:50", esReceso: false },
    ],
    []
  );

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const horasDisponibles = useMemo(() => {
    const horas = [];
    bloquesHorarios.forEach((bloque) => {
      if (!bloque.esReceso) {
        if (!horas.includes(bloque.horaInicio)) horas.push(bloque.horaInicio);
        if (!horas.includes(bloque.horaFin)) horas.push(bloque.horaFin);
      }
    });
    return horas.sort(
      (a, b) => convertirHoraAMinutos(a) - convertirHoraAMinutos(b)
    );
  }, [bloquesHorarios]);

  const materiasOrdenadas = useMemo(() => {
    return [...materias].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [materias]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (currentTab === "docentes") {
        const filtered = docentes.filter(
          (docente) =>
            docente.nombre.toLowerCase().includes(query) ||
            docente.apellido.toLowerCase().includes(query)
        );
        setFilteredDocentes(filtered);
      } else {
        const filtered = grupos.filter((grupo) =>
          grupo.nombre.toLowerCase().includes(query)
        );
        setFilteredGrupos(filtered);
      }
    } else {
      setFilteredDocentes(docentes);
      setFilteredGrupos(grupos);
    }
  }, [searchQuery, docentes, grupos, currentTab]);

  useEffect(() => {
    if (editingHorario) {
      setOriginalHours({
        horaInicio: editingHorario.horaInicio,
        horaFin: editingHorario.horaFin,
      });
    }
  }, [editingHorario]);

  const getDocenteNombre = useCallback(
    (docenteId) => {
      const docente = docentes.find((d) => String(d.id) === String(docenteId));
      return docente
        ? `${docente.nombre} ${docente.apellido}`
        : "Docente no encontrado";
    },
    [docentes]
  );

  const getMateriaNombre = useCallback(
    (materiaId) => {
      const materia = materias.find((m) => String(m.id) === String(materiaId));
      return materia ? materia.nombre : "Materia no encontrada";
    },
    [materias]
  );

  const getMateriaColor = useCallback(
    (materiaId) => {
      const materia = materias.find((m) => String(m.id) === String(materiaId));
      return materia && materia.color ? materia.color : "#E3F2FD";
    },
    [materias]
  );

  const getSalonNombre = useCallback(
    (salonId) => {
      const grupo = grupos.find((g) => String(g.id) === String(salonId));
      return grupo ? grupo.nombre : "Salón no encontrado";
    },
    [grupos]
  );

  const getGrupoNombre = useCallback(
    (grupoId) => {
      const grupo = grupos.find((g) => String(g.id) === String(grupoId));
      return grupo ? grupo.nombre : "Grupo no encontrado";
    },
    [grupos]
  );

  const verificarConflictos = useCallback(
    (horario, horarioId = null) => {
      const conflictos = horarios.filter((h) => {
        if (horarioId && h.id === horarioId) return false;
        if (h.dia !== horario.dia) return false;

        const inicio1 = convertirHoraAMinutos(horario.horaInicio);
        const fin1 = convertirHoraAMinutos(horario.horaFin);
        const inicio2 = convertirHoraAMinutos(h.horaInicio);
        const fin2 = convertirHoraAMinutos(h.horaFin);

        return (
          inicio1 < fin2 &&
          fin1 > inicio2 &&
          (String(h.docenteId) === String(horario.docenteId) ||
            String(h.salonId) === String(horario.salonId))
        );
      });

      return conflictos.length > 0;
    },
    [horarios]
  );

  const handleAutoAssignHorario = async (dia, horaInicio, horaFin) => {
    if (!selectedMateriaId || !selectedSalonId || !selectedEntity) {
      return;
    }

    const horario = {
      id: uuidv4(),
      docenteId: currentTab === "docentes" ? selectedEntity.id : "",
      dia,
      horaInicio,
      horaFin,
      materiaId: selectedMateriaId,
      salonId: selectedSalonId,
      color: getMateriaColor(selectedMateriaId),
    };

    if (verificarConflictos(horario)) {
      Alert.alert(
        "Conflicto de horario",
        "Ya existe una clase asignada para este docente o salón en el mismo horario"
      );
      return;
    }

    try {
      let updatedDocentes = [...docentes];
      let updatedHorarios = [...horarios];

      const docenteId =
        currentTab === "docentes" ? selectedEntity.id : docentes[0]?.id; // Fallback to first docente if grupo view
      const docenteIndex = updatedDocentes.findIndex(
        (d) => String(d.id) === String(docenteId)
      );
      if (docenteIndex !== -1) {
        const docente = { ...updatedDocentes[docenteIndex] };
        docente.materias = Array.isArray(docente.materias)
          ? [...docente.materias]
          : [];
        docente.grupos = Array.isArray(docente.grupos)
          ? [...docente.grupos]
          : [];

        if (!docente.materias.includes(selectedMateriaId)) {
          docente.materias.push(selectedMateriaId);
        }

        if (!docente.grupos.includes(selectedSalonId)) {
          docente.grupos.push(selectedSalonId);
        }

        updatedDocentes[docenteIndex] = docente;
      }

      updatedHorarios.push(horario);
      await setDocentes(updatedDocentes);
      await setHorarios(updatedHorarios);
    } catch (error) {
      console.error("Error al asignar horario:", error);
      Alert.alert("Error", "No se pudo asignar el horario");
    }
  };

  const handleGuardarHorario = async () => {
    if (!newHorario.docenteId || !newHorario.materiaId || !newHorario.salonId) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    const inicioMinutos = convertirHoraAMinutos(newHorario.horaInicio);
    const finMinutos = convertirHoraAMinutos(newHorario.horaFin);

    if (inicioMinutos >= finMinutos) {
      const nextHora = horasDisponibles.find(
        (h) => convertirHoraAMinutos(h) > inicioMinutos
      );
      if (nextHora) {
        setNewHorario((prev) => ({ ...prev, horaFin: nextHora }));
        Alert.alert(
          "Ajuste de horario",
          "La hora de fin se ha ajustado automáticamente."
        );
        return;
      }
      Alert.alert(
        "Error",
        "La hora de inicio debe ser anterior a la hora de fin"
      );
      return;
    }

    const horariosConflicto = horarios.filter((h) => {
      if (editingHorario && h.id === editingHorario.id) return false;

      const hInicioMinutos = convertirHoraAMinutos(h.horaInicio);
      const hFinMinutos = convertirHoraAMinutos(h.horaFin);

      const mismoDocente = String(h.docenteId) === String(newHorario.docenteId);
      const mismoSalon = String(h.salonId) === String(newHorario.salonId);
      const mismoDia = h.dia === newHorario.dia;

      const hayConflictoHorario =
        (inicioMinutos >= hInicioMinutos && inicioMinutos < hFinMinutos) ||
        (finMinutos > hInicioMinutos && finMinutos <= hFinMinutos) ||
        (inicioMinutos <= hInicioMinutos && finMinutos >= hFinMinutos);

      return mismoDia && hayConflictoHorario && (mismoDocente || mismoSalon);
    });

    if (horariosConflicto.length > 0) {
      const tipoConflicto = horariosConflicto.some(
        (h) => String(h.docenteId) === String(newHorario.docenteId)
      )
        ? "docente"
        : "grupo";

      Alert.alert(
        "Conflicto de horario",
        `Ya existe una clase asignada para este ${tipoConflicto} en el mismo horario`
      );
      return;
    }

    try {
      let updatedDocentes = [...docentes];
      let updatedHorarios = [...horarios];

      const horarioToSave = {
        ...newHorario,
        id: editingHorario ? editingHorario.id : uuidv4(),
      };

      const docenteIndex = updatedDocentes.findIndex(
        (d) => String(d.id) === String(newHorario.docenteId)
      );
      if (docenteIndex !== -1) {
        const docente = { ...updatedDocentes[docenteIndex] };
        docente.materias = Array.isArray(docente.materias)
          ? [...docente.materias]
          : [];
        docente.grupos = Array.isArray(docente.grupos)
          ? [...docente.grupos]
          : [];

        if (!docente.materias.includes(newHorario.materiaId)) {
          docente.materias.push(newHorario.materiaId);
        }

        if (!docente.grupos.includes(newHorario.salonId)) {
          docente.grupos.push(newHorario.salonId);
        }

        updatedDocentes[docenteIndex] = docente;
      }

      if (editingHorario) {
        const oldHorario = horarios.find((h) => h.id === editingHorario.id);
        if (oldHorario) {
          if (String(oldHorario.docenteId) !== String(newHorario.docenteId)) {
            const oldDocenteIndex = updatedDocentes.findIndex(
              (d) => String(d.id) === String(oldHorario.docenteId)
            );
            if (oldDocenteIndex !== -1) {
              const oldDocente = { ...updatedDocentes[oldDocenteIndex] };
              oldDocente.materias = Array.isArray(oldDocente.materias)
                ? [...oldDocente.materias]
                : [];
              oldDocente.grupos = Array.isArray(oldDocente.grupos)
                ? [...oldDocente.grupos]
                : [];

              const tieneMateriaEnOtrosHorarios = horarios.some(
                (h) =>
                  h.id !== oldHorario.id &&
                  String(h.docenteId) === String(oldHorario.docenteId) &&
                  String(h.materiaId) === String(oldHorario.materiaId)
              );

              if (!tieneMateriaEnOtrosHorarios) {
                oldDocente.materias = oldDocente.materias.filter(
                  (m) => String(m) !== String(oldHorario.materiaId)
                );
              }

              const tieneGrupoEnOtrosHorarios = horarios.some(
                (h) =>
                  h.id !== oldHorario.id &&
                  String(h.docenteId) === String(oldHorario.docenteId) &&
                  String(h.salonId) === String(oldHorario.salonId)
              );

              if (!tieneGrupoEnOtrosHorarios) {
                oldDocente.grupos = oldDocente.grupos.filter(
                  (g) => String(g) !== String(oldHorario.salonId)
                );
              }

              updatedDocentes[oldDocenteIndex] = oldDocente;
            }
          }
        }

        const index = horarios.findIndex((h) => h.id === editingHorario.id);
        if (index !== -1) {
          updatedHorarios[index] = horarioToSave;
        }
      } else {
        updatedHorarios.push(horarioToSave);
      }

      await setDocentes(updatedDocentes);
      await setHorarios(updatedHorarios);
      setModalVisible(false);
      setEditingHorario(null);
      resetHorarioForm();
    } catch (error) {
      console.error("Error al guardar horario:", error);
      Alert.alert("Error", "No se pudo guardar el horario");
    }
  };

  const resetHorarioForm = () => {
    setNewHorario({
      docenteId: "",
      dia: "Lunes",
      horaInicio: "07:00",
      horaFin: "07:50",
      materiaId: "",
      salonId: "",
      color: coloresDisponibles[0].valor,
    });
  };

  const handleEditarHorario = (horario) => {
    setEditingHorario(horario);
    setNewHorario({
      docenteId: horario.docenteId,
      dia: horario.dia,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      materiaId: horario.materiaId,
      salonId: horario.salonId,
      color: horario.color,
    });
    setModalVisible(true);
  };

  const handleEliminarHorario = (id) => {
    Alert.alert(
      "Eliminar Horario",
      "¿Estás seguro de que deseas eliminar este horario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              const horarioAEliminar = horarios.find((h) => h.id === id);
              if (!horarioAEliminar) return;

              let updatedDocentes = [...docentes];
              const docenteIndex = updatedDocentes.findIndex(
                (d) => String(d.id) === String(horarioAEliminar.docenteId)
              );

              if (docenteIndex !== -1) {
                const docente = { ...updatedDocentes[docenteIndex] };
                docente.materias = Array.isArray(docente.materias)
                  ? [...docente.materias]
                  : [];
                docente.grupos = Array.isArray(docente.grupos)
                  ? [...docente.grupos]
                  : [];

                const tieneMateriaEnOtrosHorarios = horarios.some(
                  (h) =>
                    h.id !== id &&
                    String(h.docenteId) ===
                      String(horarioAEliminar.docenteId) &&
                    String(h.materiaId) === String(horarioAEliminar.materiaId)
                );

                if (!tieneMateriaEnOtrosHorarios) {
                  docente.materias = docente.materias.filter(
                    (m) => String(m) !== String(horarioAEliminar.materiaId)
                  );
                }

                const tieneGrupoEnOtrosHorarios = horarios.some(
                  (h) =>
                    h.id !== id &&
                    String(h.docenteId) ===
                      String(horarioAEliminar.docenteId) &&
                    String(h.salonId) === String(horarioAEliminar.salonId)
                );

                if (!tieneGrupoEnOtrosHorarios) {
                  docente.grupos = docente.grupos.filter(
                    (g) => String(g) !== String(horarioAEliminar.salonId)
                  );
                }

                updatedDocentes[docenteIndex] = docente;
              }

              const updatedHorarios = horarios.filter((h) => h.id !== id);

              await setDocentes(updatedDocentes);
              await setHorarios(updatedHorarios);
            } catch (error) {
              console.error("Error al eliminar horario:", error);
              Alert.alert("Error", "No se pudo eliminar el horario");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const convertirAPdf = async (entidad) => {
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

      let titulo = "";
      let subtitulo = "";

      if (currentTab === "docentes") {
        const docente = docentes?.find(
          (d) => String(d.id) === String(entidad.id)
        );
        titulo = docente
          ? `Horario del Docente: ${docente.nombre} ${docente.apellido}`
          : `Horario del Docente: ID ${entidad.id} (No encontrado)`;
      } else {
        const grupo = grupos?.find((g) => String(g.id) === String(entidad.id));
        titulo = grupo
          ? `Horario del Grupo: ${grupo.nombre}`
          : `Horario del Grupo: ID ${entidad.id} (No encontrado)`;
      }

      const horariosEntidad = horarios
        .filter((h) =>
          currentTab === "docentes"
            ? String(h.docenteId) === String(entidad.id)
            : String(h.salonId) === String(entidad.id)
        )
        .sort((a, b) => {
          const diasOrden = {
            Lunes: 0,
            Martes: 1,
            Miércoles: 2,
            Jueves: 3,
            Viernes: 4,
          };
          if (a.dia !== b.dia) {
            return diasOrden[a.dia] - diasOrden[b.dia];
          }
          return (
            convertirHoraAMinutos(a.horaInicio) -
            convertirHoraAMinutos(b.horaInicio)
          );
        });

      const horariosPorMateria = {};
      horariosEntidad.forEach((horario) => {
        const materiaId = String(horario.materiaId);
        if (!horariosPorMateria[materiaId]) {
          horariosPorMateria[materiaId] = [];
        }
        horariosPorMateria[materiaId].push(horario);
      });

      console.log("Grupos:", JSON.stringify(grupos));
      console.log("Horarios:", JSON.stringify(horariosEntidad));

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              max-width: 100%;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 4px;
              text-align: center;
              font-size: 10px;
              height: 24px;
              overflow: hidden;
            }
            th {
              background-color: #f4f4f4;
              font-size: 10px;
            }
            th:first-child, td:first-child {
              width: 10%;
            }
            .header { 
              text-align: center; 
              margin-bottom: 10px; 
            }
            h1 { 
              font-size: 16px; 
              color: #333;
              margin: 0 0 5px 0;
            }
            .legend-container {
              margin-top: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .legend-title {
              font-size: 14px;
              color: #333;
              margin-bottom: 8px;
            }
            .legend-items {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 8px;
            }
            .legend-item {
              font-size: 9px;
              padding: 5px;
              border: 1px solid #ddd;
              border-radius: 3px;
              display: flex;
              align-items: flex-start;
            }
            .legend-info {
              flex: 1;
            }
            .legend-info-title {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .legend-info-subtitle {
              color: #666;
              margin-bottom: 1px;
            }
            .class-cell {
              padding: 2px;
              font-weight: bold;
              font-size: 10px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              background-color: transparent;
              border: none;
            }
            .receso-cell {
              background-color: #f4f4f4;
              font-style: italic;
              font-size: 9px;
            }
            .signature-section {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              text-align: center;
              width: 45%;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin: 10px 0;
            }
            .signature-name {
              font-size: 12px;
              font-weight: bold;
              margin-top: 3px;
            }
            .signature-position {
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <div class="header">
            <h1>${titulo}</h1>
            ${subtitulo ? `<p>${subtitulo}</p>` : ""}
          </div>
          <table>
            <tr>
              <th>Hora</th>
              ${diasSemana.map((dia) => `<th>${dia}</th>`).join("")}
            </tr>
            ${bloquesHorarios
              .map(
                (bloque) => `
              <tr>
                <td>${bloque.horaInicio} - ${bloque.horaFin}</td>
                ${diasSemana
                  .map((dia) => {
                    if (bloque.esReceso) {
                      return '<td class="receso-cell">Receso</td>';
                    }

                    const horario = horariosEntidad.find(
                      (h) =>
                        h.dia === dia &&
                        convertirHoraAMinutos(h.horaInicio) <=
                          convertirHoraAMinutos(bloque.horaInicio) &&
                        convertirHoraAMinutos(h.horaFin) >=
                          convertirHoraAMinutos(bloque.horaFin)
                    );

                    if (!horario) return "<td></td>";

                    let texto = "";
                    if (currentTab === "docentes") {
                      const grupo =
                        Array.isArray(grupos) && grupos.length > 0
                          ? grupos.find(
                              (g) => String(g.id) === String(horario.salonId)
                            )
                          : null;
                      console.log(
                        `Tabla - salonId: ${horario.salonId}, Grupo:`,
                        grupo
                      );
                      texto = grupo?.nombre || "Grupo no disponible";
                    } else {
                      const materia =
                        Array.isArray(materias) && materias.length > 0
                          ? materias.find(
                              (m) => String(m.id) === String(horario.materiaId)
                            ) || {
                              abreviatura: "",
                              nombre: "Materia no encontrada",
                            }
                          : {
                              abreviatura: "",
                              nombre: "Materia no encontrada",
                            };
                      texto = materia.abreviatura || materia.nombre;
                    }

                    return `
                    <td>
                      <div class="class-cell">
                        ${texto}
                      </div>
                    </td>
                  `;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </table>
  
          <div class="legend-container">
            <div class="legend-title">Detalles de Clases:</div>
            <div class="legend-items">
              ${Object.keys(horariosPorMateria)
                .map((materiaId) => {
                  const horarios = horariosPorMateria[materiaId];
                  const materia =
                    Array.isArray(materias) && materias.length > 0
                      ? materias.find(
                          (m) => String(m.id) === String(materiaId)
                        ) || { nombre: "Sin materia", abreviatura: "" }
                      : { nombre: "Sin materia", abreviatura: "" };
                  const gruposNombres =
                    Array.isArray(grupos) && grupos.length > 0
                      ? [...new Set(horarios.map((h) => String(h.salonId)))]
                          .map((salonId) => {
                            const grupo = grupos.find(
                              (g) => String(g.id) === salonId
                            );
                            console.log(
                              `Leyenda - salonId: ${salonId}, Grupo:`,
                              grupo
                            );
                            return grupo?.nombre || "Grupo no disponible";
                          })
                          .join(", ")
                      : "Grupo no disponible";
                  const docente =
                    currentTab === "grupos" &&
                    Array.isArray(docentes) &&
                    docentes.length > 0
                      ? docentes.find(
                          (d) => String(d.id) === String(horarios[0]?.docenteId)
                        )
                      : null;
                  const docenteNombre = docente
                    ? `${docente.nombre} ${docente.apellido}`
                    : "Docente no encontrado";

                  return `
                  <div class="legend-item">
                    <div class="legend-info">
                      ${
                        materia.abreviatura
                          ? `<div class="legend-info-title">${materia.abreviatura}</div>`
                          : ""
                      }
                      <div class="legend-info-title">${materia.nombre}</div>
                      ${
                        currentTab === "docentes"
                          ? `
                        <div class="legend-info-subtitle">Grupos: ${gruposNombres}</div>
                      `
                          : `
                        <div class="legend-info-subtitle">Docente: ${docenteNombre}</div>
                      `
                      }
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
  
          <div class="signature-section">
            <div class="signature">
              <div class="signature-line"></div>
              <p class="signature-name">${directorNombre}</p>
              <p class="signature-position">${directorPuesto}</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p class="signature-name">${subdirectorNombre}</p>
              <p class="signature-position">${subdirectorPuesto}</p>
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

  const handleSeleccionarEntidad = (entity) => {
    setSelectedEntity(entity);
    setCurrentView("schedule");
    setSelectedMateriaId("");
    setSelectedSalonId("");
  };

  const horariosEntidad = useMemo(() => {
    if (!selectedEntity) return [];
    return currentTab === "docentes"
      ? horarios.filter(
          (h) => String(h.docenteId) === String(selectedEntity.id)
        )
      : horarios.filter((h) => String(h.salonId) === String(selectedEntity.id));
  }, [selectedEntity, horarios, currentTab]);

  const horariosPorMateria = useMemo(() => {
    const grouped = {};
    horariosEntidad.forEach((horario) => {
      if (!grouped[horario.materiaId]) {
        grouped[horario.materiaId] = [];
      }
      grouped[horario.materiaId].push(horario);
    });
    return grouped;
  }, [horariosEntidad]);

  const countTotalHours = (entityId) => {
    const entityHorarios =
      currentTab === "docentes"
        ? horarios.filter((h) => String(h.docenteId) === String(entityId))
        : horarios.filter((h) => String(h.salonId) === String(entityId));

    let totalMinutes = 0;

    entityHorarios.forEach((horario) => {
      const start = convertirHoraAMinutos(horario.horaInicio);
      const end = convertirHoraAMinutos(horario.horaFin);
      totalMinutes += end - start;
    });

    return Math.round(totalMinutes / 50);
  };

  const handleCellPress = (dia, horaInicio) => {
    const bloqueActual = bloquesHorarios.find(
      (bloque) => bloque.horaInicio === horaInicio
    );
    const siguienteHora = horasDisponibles.find(
      (h) => convertirHoraAMinutos(h) > convertirHoraAMinutos(horaInicio)
    );

    const horaFin = bloqueActual ? bloqueActual.horaFin : siguienteHora;

    if (selectedMateriaId && selectedSalonId) {
      handleAutoAssignHorario(dia, horaInicio, horaFin);
    } else {
      setNewHorario({
        ...newHorario,
        dia,
        horaInicio,
        horaFin: horaFin || "07:50",
        color: coloresDisponibles[0].valor,
        [currentTab === "docentes" ? "docenteId" : "salonId"]:
          selectedEntity?.id || "",
        materiaId: selectedMateriaId || "",
        salonId: selectedSalonId || "",
      });
      setModalVisible(true);
    }
  };

  const renderDocenteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSeleccionarEntidad(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.nombre} {item.apellido}
        </Text>
        <Text style={styles.cardSubtitle}>
          {countTotalHours(item.id)} horas programadas
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleSeleccionarEntidad(item)}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Ver Horario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, { marginLeft: 10 }]}
          onPress={() => convertirAPdf(item)}
        >
          <Text style={styles.buttonText}>Convertir a PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderGrupoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSeleccionarEntidad(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardSubtitle}>
          {countTotalHours(item.id)} horas programadas
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleSeleccionarEntidad(item)}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Ver Horario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, { marginLeft: 10 }]}
          onPress={() => convertirAPdf(item)}
        >
          <Text style={styles.buttonText}>Convertir a PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHorarioCell = (dia, bloque) => {
    if (bloque.esReceso) {
      return (
        <View style={styles.recesoCell}>
          <Text style={styles.recesoText}>Receso</Text>
        </View>
      );
    }

    const horarioEnCelda = horariosEntidad.find(
      (horario) =>
        horario.dia === dia &&
        convertirHoraAMinutos(horario.horaInicio) <=
          convertirHoraAMinutos(bloque.horaInicio) &&
        convertirHoraAMinutos(horario.horaFin) >=
          convertirHoraAMinutos(bloque.horaFin)
    );

    if (!horarioEnCelda) {
      return (
        <TouchableOpacity
          style={[
            styles.celdaHorario,
            {
              backgroundColor: "transparent",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            },
          ]}
          onPress={() => handleCellPress(dia, bloque.horaInicio)}
        >
          <Ionicons name="add" size={24} color="#3E6B9E" />
        </TouchableOpacity>
      );
    }

    const materia = materias.find(
      (m) => String(m.id) === String(horarioEnCelda.materiaId)
    ) || { nombre: "Sin materia", abreviatura: "" };

    return (
      <View
        style={[
          styles.celdaHorario,
          {
            backgroundColor: "transparent",
            borderWidth: 0,
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            position: "relative",
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          onPress={() => {
            setEditingHorario(horarioEnCelda);
            setNewHorario({
              ...horarioEnCelda,
              color: horarioEnCelda.color || "#E3F2FD",
            });
            setModalVisible(true);
          }}
        >
          <Text style={styles.textoCeldaCentrado} numberOfLines={2}>
            {currentTab === "docentes"
              ? getGrupoNombre(horarioEnCelda.salonId)
              : materia.abreviatura || materia.nombre}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            padding: 2,
          }}
          onPress={() => handleEliminarHorario(horarioEnCelda.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHorarioForm = () => (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {editingHorario ? "Editar Horario" : "Nuevo Horario"}
        </Text>
        <Text style={styles.inputLabel}>Docente</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={newHorario.docenteId}
            style={styles.picker}
            onValueChange={(itemValue) =>
              setNewHorario({ ...newHorario, docenteId: itemValue })
            }
          >
            <Picker.Item label="Selecciona un docente..." value="" />
            {docentes.map((docente) => (
              <Picker.Item
                key={docente.id}
                label={`${docente.nombre} ${docente.apellido}`}
                value={docente.id}
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.inputLabel}>Materia</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={String(newHorario.materiaId)}
            style={styles.picker}
            onValueChange={(itemValue) => {
              const materiaSeleccionada = materias.find(
                (m) => String(m.id) === String(itemValue)
              );
              setNewHorario({
                ...newHorario,
                materiaId: String(itemValue),
                color: materiaSeleccionada?.color || newHorario.color,
              });
            }}
          >
            <Picker.Item label="Selecciona una materia..." value="" />
            {materiasOrdenadas.map((materia) => (
              <Picker.Item
                key={String(materia.id)}
                label={
                  materia.nombre
                    ? materia.abreviatura
                      ? `${materia.abreviatura} - ${materia.nombre}`
                      : materia.nombre
                    : "Materia sin nombre"
                }
                value={String(materia.id)}
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.inputLabel}>Salón</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={newHorario.salonId}
            style={styles.picker}
            onValueChange={(itemValue) =>
              setNewHorario({ ...newHorario, salonId: itemValue })
            }
          >
            <Picker.Item label="Selecciona un grupo..." value="" />
            {grupos.map((grupo) => (
              <Picker.Item
                key={grupo.id}
                label={grupo.nombre}
                value={grupo.id}
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.inputLabel}>Día</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={newHorario.dia}
            style={styles.picker}
            onValueChange={(itemValue) =>
              setNewHorario({ ...newHorario, dia: itemValue })
            }
          >
            {diasSemana.map((dia) => (
              <Picker.Item key={dia} label={dia} value={dia} />
            ))}
          </Picker>
        </View>
        <View style={styles.timeContainer}>
          <View style={styles.timeField}>
            <Text style={styles.inputLabel}>Hora de Entrada</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newHorario.horaInicio}
                style={styles.picker}
                onValueChange={(itemValue) => {
                  setNewHorario({ ...newHorario, horaInicio: itemValue });
                  const inicioMin = convertirHoraAMinutos(itemValue);
                  const finMin = convertirHoraAMinutos(newHorario.horaFin);
                  if (finMin <= inicioMin) {
                    const nextHora = horasDisponibles.find(
                      (h) => convertirHoraAMinutos(h) > inicioMin
                    );
                    setNewHorario((prev) => ({
                      ...prev,
                      horaFin: nextHora || prev.horaFin,
                    }));
                  }
                }}
              >
                {horasDisponibles.map((hora) => (
                  <Picker.Item
                    key={`inicio-${hora}`}
                    label={hora}
                    value={hora}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.timeField}>
            <Text style={styles.inputLabel}>Hora de Salida</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newHorario.horaFin}
                style={styles.picker}
                onValueChange={(itemValue) =>
                  setNewHorario({ ...newHorario, horaFin: itemValue })
                }
              >
                {horasDisponibles
                  .filter(
                    (hora) =>
                      convertirHoraAMinutos(hora) >
                      convertirHoraAMinutos(newHorario.horaInicio)
                  )
                  .map((hora) => (
                    <Picker.Item
                      key={`fin-${hora}`}
                      label={hora}
                      value={hora}
                    />
                  ))}
              </Picker>
            </View>
          </View>
        </View>
        <Text style={styles.inputLabel}>Color</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={newHorario.color}
            style={styles.picker}
            onValueChange={(itemValue) =>
              setNewHorario({ ...newHorario, color: itemValue })
            }
          >
            {coloresDisponibles.map((color) => (
              <Picker.Item
                key={color.valor}
                label={color.nombre}
                value={color.valor}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => {
              setModalVisible(false);
              setEditingHorario(null);
              setNewHorario({
                docenteId: "",
                dia: "Lunes",
                horaInicio: "07:00",
                horaFin: "07:50",
                materiaId: "",
                salonId: "",
                color: "#E3F2FD",
              });
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleGuardarHorario}
          >
            <Text style={styles.saveButtonText}>
              {editingHorario ? "Actualizar" : "Guardar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderListView = () => (
    <>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === "docentes" && styles.activeTab]}
          onPress={() => {
            setCurrentTab("docentes");
            setSearchQuery("");
            setCurrentView("list");
            setSelectedEntity(null);
          }}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={currentTab === "docentes" ? "#007BFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              currentTab === "docentes" && styles.activeTabText,
            ]}
          >
            Docentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === "grupos" && styles.activeTab]}
          onPress={() => {
            setCurrentTab("grupos");
            setSearchQuery("");
            setCurrentView("list");
            setSelectedEntity(null);
          }}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={currentTab === "grupos" ? "#007BFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              currentTab === "grupos" && styles.activeTabText,
            ]}
          >
            Grupos
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${
            currentTab === "docentes" ? "docente" : "grupo"
          }...`}
          placeholderTextColor="#888888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={currentTab === "docentes" ? filteredDocentes : filteredGrupos}
        renderItem={
          currentTab === "docentes" ? renderDocenteItem : renderGrupoItem
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                currentTab === "docentes" ? "person-outline" : "people-outline"
              }
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              No hay {currentTab === "docentes" ? "docentes" : "grupos"}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery
                ? "Intenta con otra búsqueda"
                : currentTab === "docentes"
                ? "No hay docentes disponibles"
                : "No hay grupos disponibles"}
            </Text>
          </View>
        }
      />
    </>
  );

  const renderScheduleView = () => {
    if (!selectedEntity) return null;

    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setCurrentView("list");
              setSelectedEntity(null);
              setSelectedMateriaId("");
              setSelectedSalonId("");
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#007BFF" />
          </TouchableOpacity>
          <Text style={styles.scheduleTitle}>
            Horario:{" "}
            {currentTab === "docentes"
              ? `${selectedEntity.nombre} ${selectedEntity.apellido}`
              : selectedEntity.nombre}
          </Text>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMateriaId}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedMateriaId(itemValue)}
          >
            <Picker.Item label="Selecciona una materia..." value="" />
            {materiasOrdenadas.map((materia) => (
              <Picker.Item
                key={materia.id}
                label={
                  materia.abreviatura
                    ? `${materia.abreviatura} - ${materia.nombre}`
                    : materia.nombre
                }
                value={materia.id}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSalonId}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedSalonId(itemValue)}
          >
            <Picker.Item label="Selecciona un salón..." value="" />
            {grupos.map((grupo) => (
              <Picker.Item
                key={grupo.id}
                label={grupo.nombre}
                value={grupo.id}
              />
            ))}
          </Picker>
        </View>
        <ScrollView style={styles.scheduleScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.scheduleTable}>
              <View style={styles.tableRow}>
                <View style={styles.timeCell}>
                  <Text style={styles.timeCellText}>Hora</Text>
                </View>
                {diasSemana.map((dia) => (
                  <View key={dia} style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{dia}</Text>
                  </View>
                ))}
              </View>
              {bloquesHorarios.map((bloque) => (
                <View key={bloque.horaInicio} style={styles.tableRow}>
                  <View style={styles.timeCell}>
                    <Text style={styles.timeCellText}>
                      {bloque.horaInicio} - {bloque.horaFin}
                    </Text>
                  </View>
                  {diasSemana.map((dia) => (
                    <View
                      key={`${dia}-${bloque.horaInicio}`}
                      style={styles.tableCell}
                    >
                      {renderHorarioCell(dia, bloque)}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
        {Object.keys(horariosPorMateria).length > 0 && (
          <ScrollView style={styles.legendScrollContainer}>
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Detalles de Clases:</Text>
              {Object.keys(horariosPorMateria).map((materiaId) => {
                const horarios = horariosPorMateria[materiaId];
                const materia = materias.find(
                  (m) => String(m.id) === String(materiaId)
                ) || { nombre: "Sin materia", abreviatura: "" };
                const gruposUnicos = [
                  ...new Set(horarios.map((h) => h.salonId)),
                ];

                return (
                  <View key={materiaId} style={styles.legendItem}>
                    <View style={styles.legendInfo}>
                      {materia.abreviatura && (
                        <Text style={styles.legendTextAbreviatura}>
                          {materia.abreviatura}
                        </Text>
                      )}
                      <Text style={styles.legendText}>{materia.nombre}</Text>
                      {currentTab === "docentes" ? (
                        <Text style={styles.legendSubtext}>
                          Grupos:{" "}
                          {gruposUnicos
                            .map((salonId) => getGrupoNombre(salonId))
                            .join(", ")}
                        </Text>
                      ) : (
                        <Text style={styles.legendSubtext}>
                          Docente: {getDocenteNombre(horarios[0].docenteId)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.legendActions}>
                      <TouchableOpacity
                        style={styles.legendButton}
                        onPress={() => handleEditarHorario(horarios[0])}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#007BFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.legendButton}
                        onPress={() => handleEliminarHorario(horarios[0].id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentView === "list" ? renderListView() : renderScheduleView()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingHorario(null);
        }}
      >
        {renderHorarioForm()}
      </Modal>
    </SafeAreaView>
  );
};

export default HorariosScreen;
