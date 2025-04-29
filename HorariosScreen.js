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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Ionicons from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { useDataContext } from "./DataContext";
import { fetchAll, update } from "./Database";
import { v4 as uuidv4 } from "uuid";
import { stylesHorarios as styles } from "./stylesHorarios";

const HorariosScreen = ({ navigation }) => {
  const {
    docentes,
    setDocentes,
    materias,
    setMaterias,
    grupos,
    horarios,
    setHorarios,
  } = useDataContext();

  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [filteredGrupos, setFilteredGrupos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null); // Puede ser docente o grupo
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState("list"); // "list" o "schedule"
  const [currentTab, setCurrentTab] = useState("docentes"); // "docentes" o "grupos"
  const [editingHorario, setEditingHorario] = useState(null);

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
    { nombre: "Azul", valor: "#3E6B9E" }, // Azul más oscuro
    { nombre: "Verde", valor: "#3A7D44" }, // Verde más oscuro
    { nombre: "Morado", valor: "#5D4A8C" }, // Morado más oscuro
    { nombre: "Rosa", valor: "#A45A76" }, // Rosa más oscuro
    { nombre: "Naranja", valor: "#B56B3C" }, // Naranja más oscuro
    { nombre: "Amarillo", valor: "#A59132" }, // Amarillo más oscuro
  ];

  const convertirHoraAMinutos = (hora) => {
    const [horas, minutos] = hora.split(":");
    return parseInt(horas) * 60 + parseInt(minutos);
  };

  const bloquesHorarios = useMemo(
    () => [
      { horaInicio: "07:00", horaFin: "07:50", esReceso: false },
      { horaInicio: "07:50", horaFin: "08:40", esReceso: false },
      { horaInicio: "08:40", horaFin: "09:30", esReceso: false },
      { horaInicio: "09:30", horaFin: "10:00", esReceso: true }, // Receso ajustado
      { horaInicio: "10:00", horaFin: "10:50", esReceso: false },
      { horaInicio: "10:50", horaFin: "11:40", esReceso: false },
      { horaInicio: "11:40", horaFin: "12:30", esReceso: false },
      { horaInicio: "12:30", horaFin: "13:20", esReceso: false },
      { horaInicio: "13:20", horaFin: "14:10", esReceso: false },
      { horaInicio: "14:10", horaFin: "15:00", esReceso: false },
      { horaInicio: "15:00", horaFin: "15:50", esReceso: false },
      { horaInicio: "15:50", horaFin: "16:00", esReceso: false },
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
        horaFin: editingHorario.horaFin
      });
    }
  }, [editingHorario]);

  const getDocenteNombre = useCallback(
    (docenteId) => {
      const docente = docentes.find((d) => d.id === docenteId);
      return docente
        ? `${docente.nombre} ${docente.apellido}`
        : "Docente no encontrado";
    },
    [docentes]
  );

  const getMateriaNombre = useCallback(
    (materiaId) => {
      const materia = materias.find((m) => m.id === materiaId);
      return materia ? materia.nombre : "Materia no encontrada";
    },
    [materias]
  );

  const getMateriaColor = useCallback(
    (materiaId) => {
      const materia = materias.find((m) => m.id === materiaId);
      return materia && materia.color ? materia.color : "#E3F2FD";
    },
    [materias]
  );

  const getSalonNombre = useCallback(
    (salonId) => {
      const grupo = grupos.find((g) => g.id === salonId);
      return grupo ? grupo.nombre : "Salón no encontrado";
    },
    [grupos]
  );

  const getGrupoNombre = useCallback(
    (grupoId) => {
      const grupo = grupos.find((g) => g.id === grupoId);
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
          (h.docenteId === horario.docenteId || h.salonId === horario.salonId)
        );
      });

      return conflictos.length > 0;
    },
    [horarios]
  );

  const handleGuardarDocente = () => {
    if (!newDocente.nombre || !newDocente.apellido) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    const id = uuidv4();
    const nuevoDocente = { ...newDocente, id };
    setDocentes([...docentes, nuevoDocente]);

    setNewDocente({ nombre: "", apellido: "" });
    setDocenteModalVisible(false);
  };

  const handleGuardarHorario = async () => {
    if (
      !newHorario.docenteId ||
      !newHorario.materiaId ||
      !newHorario.salonId
    ) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }
  
    // Verificar que la hora de inicio sea menor que la hora de fin
    const inicioMinutos = convertirHoraAMinutos(newHorario.horaInicio);
    const finMinutos = convertirHoraAMinutos(newHorario.horaFin);
  
    if (inicioMinutos >= finMinutos) {
      // En lugar de mostrar un error, ajustar automáticamente la hora de fin
      const nextHora = horasDisponibles.find(
        (h) => convertirHoraAMinutos(h) > inicioMinutos
      );
      if (nextHora) {
        setNewHorario(prev => ({...prev, horaFin: nextHora}));
        Alert.alert(
          "Ajuste de horario",
          "La hora de fin se ha ajustado automáticamente para que sea posterior a la hora de inicio."
        );
        return;
      }
      // Si no hay una hora posterior disponible, mostrar el error
      Alert.alert(
        "Error",
        "La hora de inicio debe ser anterior a la hora de fin"
      );
      return;
    }

    // Verificar si hay conflictos con otros horarios
    const horariosConflicto = horarios.filter((h) => {
      if (editingHorario && h.id === editingHorario.id) return false;

      const hInicioMinutos = convertirHoraAMinutos(h.horaInicio);
      const hFinMinutos = convertirHoraAMinutos(h.horaFin);

      const mismoDocente = h.docenteId === newHorario.docenteId;
      const mismoSalon = h.salonId === newHorario.salonId;
      const mismoDia = h.dia === newHorario.dia;

      const hayConflictoHorario =
        (inicioMinutos >= hInicioMinutos && inicioMinutos < hFinMinutos) ||
        (finMinutos > hInicioMinutos && finMinutos <= hFinMinutos) ||
        (inicioMinutos <= hInicioMinutos && finMinutos >= hFinMinutos);

      return (
        mismoDia &&
        hayConflictoHorario &&
        (mismoDocente || mismoSalon)
      );
    });

    if (horariosConflicto.length > 0) {
      const tipoConflicto = horariosConflicto.some(
        (h) => h.docenteId === newHorario.docenteId
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
      // Actualizar las relaciones entre docentes, materias y grupos
      let updatedDocentes = [...docentes];
      let updatedHorarios = [...horarios];

      // Crear el horario a guardar
      const horarioToSave = {
        ...newHorario,
        id: editingHorario ? editingHorario.id : uuidv4(),
      };

      // Encontrar el docente y actualizar sus materias y grupos
      const docenteIndex = updatedDocentes.findIndex(d => d.id === newHorario.docenteId);
      if (docenteIndex !== -1) {
        const docente = {...updatedDocentes[docenteIndex]};
        
        // Inicializar los arrays si no existen
        docente.materias = Array.isArray(docente.materias) ? [...docente.materias] : [];
        docente.grupos = Array.isArray(docente.grupos) ? [...docente.grupos] : [];
        
        // Agregar la materia si no existe en el array
        if (!docente.materias.includes(newHorario.materiaId)) {
          docente.materias.push(newHorario.materiaId);
        }
        
        // Agregar el grupo (salon) si no existe en el array
        if (!docente.grupos.includes(newHorario.salonId)) {
          docente.grupos.push(newHorario.salonId);
        }
        
        updatedDocentes[docenteIndex] = docente;
      }

      if (editingHorario) {
        // Si estamos editando, verificar si cambió el docente, materia o grupo
        const oldHorario = horarios.find(h => h.id === editingHorario.id);
        if (oldHorario) {
          // Si cambió el docente, actualizar las relaciones del docente anterior
          if (oldHorario.docenteId !== newHorario.docenteId) {
            const oldDocenteIndex = updatedDocentes.findIndex(d => d.id === oldHorario.docenteId);
            if (oldDocenteIndex !== -1) {
              const oldDocente = {...updatedDocentes[oldDocenteIndex]};
              
              // Inicializar los arrays si no existen
              oldDocente.materias = Array.isArray(oldDocente.materias) ? [...oldDocente.materias] : [];
              oldDocente.grupos = Array.isArray(oldDocente.grupos) ? [...oldDocente.grupos] : [];
              
              // Verificar si el docente anterior ya no tiene esta materia en otros horarios
              const tieneMateriaEnOtrosHorarios = horarios.some(h => 
                h.id !== oldHorario.id && 
                h.docenteId === oldHorario.docenteId && 
                h.materiaId === oldHorario.materiaId
              );

              if (!tieneMateriaEnOtrosHorarios) {
                oldDocente.materias = oldDocente.materias.filter(m => m !== oldHorario.materiaId);
              }

              // Verificar si el docente anterior ya no tiene este grupo en otros horarios
              const tieneGrupoEnOtrosHorarios = horarios.some(h => 
                h.id !== oldHorario.id && 
                h.docenteId === oldHorario.docenteId && 
                h.salonId === oldHorario.salonId
              );

              if (!tieneGrupoEnOtrosHorarios) {
                oldDocente.grupos = oldDocente.grupos.filter(g => g !== oldHorario.salonId);
              }

              updatedDocentes[oldDocenteIndex] = oldDocente;
            }
          }
        }

        // Actualizar horario existente
        const index = horarios.findIndex((h) => h.id === editingHorario.id);
        if (index !== -1) {
          updatedHorarios[index] = horarioToSave;
        }
      } else {
        // Agregar nuevo horario
        updatedHorarios.push(horarioToSave);
      }

      // Guardar los cambios
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
      color: coloresDisponibles[0].valor, // Usar el primer color disponible
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
              // Obtener el horario a eliminar
              const horarioAEliminar = horarios.find(h => h.id === id);
              if (!horarioAEliminar) return;

              // Actualizar las relaciones del docente
              let updatedDocentes = [...docentes];
              const docenteIndex = updatedDocentes.findIndex(d => d.id === horarioAEliminar.docenteId);
              
              if (docenteIndex !== -1) {
                const docente = {...updatedDocentes[docenteIndex]};
                
                // Inicializar los arrays si no existen
                docente.materias = Array.isArray(docente.materias) ? [...docente.materias] : [];
                docente.grupos = Array.isArray(docente.grupos) ? [...docente.grupos] : [];
                
                // Verificar si el docente tiene esta materia en otros horarios
                const tieneMateriaEnOtrosHorarios = horarios.some(h => 
                  h.id !== id && 
                  h.docenteId === horarioAEliminar.docenteId && 
                  h.materiaId === horarioAEliminar.materiaId
                );
                
                // Si no tiene esta materia en otros horarios, eliminarla de su lista
                if (!tieneMateriaEnOtrosHorarios) {
                  docente.materias = docente.materias.filter(m => m !== horarioAEliminar.materiaId);
                }
                
                // Verificar si el docente tiene este grupo en otros horarios
                const tieneGrupoEnOtrosHorarios = horarios.some(h => 
                  h.id !== id && 
                  h.docenteId === horarioAEliminar.docenteId && 
                  h.salonId === horarioAEliminar.salonId
                );
                
                // Si no tiene este grupo en otros horarios, eliminarlo de su lista
                if (!tieneGrupoEnOtrosHorarios) {
                  docente.grupos = docente.grupos.filter(g => g !== horarioAEliminar.salonId);
                }
                
                updatedDocentes[docenteIndex] = docente;
              }
              
              // Eliminar el horario
              const updatedHorarios = horarios.filter(h => h.id !== id);
              
              // Guardar los cambios
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
    let titulo = '';
    let subtitulo = '';

    if (currentTab === 'docentes') {
      const docente = docentes.find(d => d.id === entidad.id);
      titulo = `Horario del Docente: ${docente.nombre} ${docente.apellido}`;
    } else {
      const grupo = grupos.find(g => g.id === entidad.id);
      titulo = `Horario del Grupo: ${grupo.nombre}`;
    }

    // Filtrar horarios y ordenarlos por día y hora
    const horariosEntidad = horarios
      .filter(h => currentTab === 'docentes' ? h.docenteId === entidad.id : h.salonId === entidad.id)
      .sort((a, b) => {
        const diasOrden = { 'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4 };
        if (a.dia !== b.dia) {
          return diasOrden[a.dia] - diasOrden[b.dia];
        }
        return convertirHoraAMinutos(a.horaInicio) - convertirHoraAMinutos(b.horaInicio);
      });

    // Agrupar horarios por materia
    const horariosPorMateria = {};
    horariosEntidad.forEach(horario => {
      const materiaId = horario.materiaId;
      if (!horariosPorMateria[materiaId]) {
        horariosPorMateria[materiaId] = [];
      }
      horariosPorMateria[materiaId].push(horario);
    });

    // Generar HTML para el PDF
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
          .legend-color {
            width: 10px;
            height: 10px;
            margin-right: 5px;
            border-radius: 2px;
            margin-top: 2px;
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
          .legend-info-details {
            margin-top: 4px;
          }
          .legend-detail-line {
            font-size: 8px;
            color: #555;
            margin-top: 2px;
          }
          .class-cell {
            padding: 2px; 
            border-radius: 2px; 
            font-weight: bold; 
            font-size: 10px; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis;
          }
          .receso-cell {
            background-color: #f4f4f4;
            font-style: italic;
            font-size: 9px;
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
          ${subtitulo ? `<p>${subtitulo}</p>` : ''}
        </div>
        <table>
          <tr>
            <th>Hora</th>
            ${diasSemana.map(dia => `<th>${dia}</th>`).join('')}
          </tr>
          ${bloquesHorarios.map(bloque => `
            <tr>
              <td>${bloque.horaInicio} - ${bloque.horaFin}</td>
              ${diasSemana.map(dia => {
                if (bloque.esReceso) {
                  return '<td class="receso-cell">Receso</td>';
                }

                const horario = horariosEntidad.find(
                  h =>
                    h.dia === dia &&
                    convertirHoraAMinutos(h.horaInicio) <=
                      convertirHoraAMinutos(bloque.horaInicio) &&
                    convertirHoraAMinutos(h.horaFin) >=
                      convertirHoraAMinutos(bloque.horaFin)
                );

                if (!horario) return '<td></td>';

                const color = horario.color || getMateriaColor(horario.materiaId);
                let texto = '';
                
                if (currentTab === 'docentes') {
                  texto = grupos.find(g => g.id === horario.salonId)?.nombre || '';
                } else {
                  const materia = materias.find(m => String(m.id) === String(horario.materiaId));
                  texto = materia ? materia.nombre : '';
                }

                return `
                  <td>
                    <div class="class-cell">
                      ${texto}
                    </div>
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </table>

<div class="legend-container">
  <div class="legend-title">Detalles de Clases:</div>
  <div class="legend-items">
    ${Object.keys(horariosPorMateria).map(materiaId => {
      const horarios = horariosPorMateria[materiaId];
      const materia = materias.find(m => String(m.id) === String(materiaId));
      
      // Información según el contexto (docentes o grupos)
      const infoEntidad = currentTab === 'docentes' 
        ? `Grupo: ${grupos.find(g => g.id === horarios[0].salonId)?.nombre || 'Grupo no encontrado'}`
        : `Docente: ${docentes.find(d => d.id === horarios[0].docenteId)?.nombre || ''} ${docentes.find(d => d.id === horarios[0].docenteId)?.apellido || ''}`;
      
      return `
        <div class="legend-item">
          <div class="legend-info">
            <div class="legend-info-title">${materia ? materia.nombre : 'Materia sin nombre'}</div>
            <div class="legend-info-subtitle">${infoEntidad}</div>
          </div>
        </div>
      `;
    }).join('')}
  </div>
</div>
      </body>
      </html>
    `;

    // Generar el PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 612, // Ancho de página carta en puntos (8.5 x 72)
      height: 792 // Alto de página carta en puntos (11 x 72)
    });

    // Compartir el PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir horario',
      UTI: 'com.adobe.pdf'
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
  }
};

  const handleSeleccionarEntidad = (entity) => {
    setSelectedEntity(entity);
    setCurrentView("schedule");
  };

  const horariosEntidad = useMemo(() => {
    if (!selectedEntity) return [];
    return currentTab === "docentes"
      ? horarios.filter((h) => h.docenteId === selectedEntity.id)
      : horarios.filter((h) => h.salonId === selectedEntity.id);
  }, [selectedEntity, horarios, currentTab]);

  const countTotalHours = (entityId) => {
    const entityHorarios = currentTab === 'docentes' 
      ? horarios.filter(h => h.docenteId === entityId)
      : horarios.filter(h => h.salonId === entityId);

    let totalMinutes = 0;

    entityHorarios.forEach(horario => {
      const start = convertirHoraAMinutos(horario.horaInicio);
      const end = convertirHoraAMinutos(horario.horaFin);
      totalMinutes += (end - start);
    });

    // Convertir minutos a horas (50 minutos = 1 hora académica)
    return Math.round(totalMinutes / 50);
  };

  const handleCellPress = (dia, horaInicio) => {
    // Encontrar el bloque horario correspondiente para obtener la hora de fin
    const bloqueActual = bloquesHorarios.find(bloque => bloque.horaInicio === horaInicio);
    
    // Encontrar la siguiente hora disponible después de la hora de inicio
    const siguienteHora = horasDisponibles.find(h => 
      convertirHoraAMinutos(h) > convertirHoraAMinutos(horaInicio)
    );
    
    // Usar la hora de fin del bloque si existe, o la siguiente hora disponible
    const horaFin = bloqueActual ? bloqueActual.horaFin : siguienteHora;
    
    setNewHorario({
      ...newHorario,
      dia,
      horaInicio,
      horaFin: horaFin || "07:50", // Aseguramos que horaFin siempre sea posterior a horaInicio
      color: coloresDisponibles[0].valor, // Asignar color predeterminado
      [currentTab === 'docentes' ? 'docenteId' : 'salonId']: selectedEntity?.id || '',
    });
    setModalVisible(true);
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
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            },
          ]}
          onPress={() => handleCellPress(dia, bloque.horaInicio)}
        >
          <Ionicons name="add" size={24} color="#3E6B9E" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.celdaHorario,
          {
            backgroundColor: horarioEnCelda.color || getMateriaColor(horarioEnCelda.materiaId) || '#E3F2FD',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          },
        ]}
        onPress={() => {
          setEditingHorario(horarioEnCelda);
          setNewHorario({
            ...horarioEnCelda,
            color: horarioEnCelda.color || '#E3F2FD'
          });
          setModalVisible(true);
        }}
      >
        <Text style={styles.textoCeldaCentrado} numberOfLines={2}>
          {currentTab === 'docentes' 
            ? getGrupoNombre(horarioEnCelda.salonId)
            : getMateriaNombre(horarioEnCelda.materiaId)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDocenteForm = () => (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Nuevo Docente</Text>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Ingresar nombre"
          placeholderTextColor="#666"
          value={newDocente.nombre}
          onChangeText={(text) =>
            setNewDocente({ ...newDocente, nombre: text })
          }
          clearButtonMode="while-editing"
        />
        <TextInput
          style={styles.formInput}
          placeholder="Ingresar apellido"
          placeholderTextColor="#666"
          value={newDocente.apellido}
          onChangeText={(text) =>
            setNewDocente({ ...newDocente, apellido: text })
          }
          clearButtonMode="while-editing"
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => {
              setDocenteModalVisible(false);
              setNewDocente({ nombre: "", apellido: "" });
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleGuardarDocente}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
              const materia = materias.find((m) => String(m.id) === String(itemValue));
              setNewHorario({
                ...newHorario,
                materiaId: String(itemValue),
                color: materia?.color || newHorario.color,
              });
            }}
          >
            <Picker.Item label="Selecciona una materia..." value="" />
            {materias.map((materia) => (
              <Picker.Item
                key={String(materia.id)}
                label={
  materia.nombre
    ? materia.codigo
      ? `${materia.nombre} (${materia.codigo})`
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
        {horariosEntidad.length > 0 && (
          <ScrollView style={styles.legendScrollContainer}>
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Detalles de Clases:</Text>
              {horariosEntidad.map((horario) => {
                const materia = materias.find(m => String(m.id) === String(horario.materiaId));
                const docente = docentes.find(d => d.id === horario.docenteId);
                const salon = grupos.find(s => s.id === horario.salonId);

                return (
                  <View key={horario.id} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        {
                          backgroundColor:
                            horario.color || getMateriaColor(horario.materiaId),
                        },
                      ]}
                    />
                    <View style={styles.legendInfo}>
                      <Text style={styles.legendText}>
                        {materia ? materia.nombre : ""}
                      </Text>
                      <Text style={styles.legendSubtext}>
                        {currentTab === "docentes" ? (
                          <>
                            {salon ? `Grupo ${salon.nombre}` : ""}
                            {materia ? ` | Materia: ${materia.nombre}` : ""}
                          </>
                        ) : (
                          <>
                            {docente ? `${docente.nombre} ${docente.apellido}` : ""}
                          </>
                        )}
                      </Text>
                      <Text style={styles.legendSubtext}>
                        {horario.dia}, {horario.horaInicio} - {horario.horaFin}
                      </Text>
                    </View>
                    <View style={styles.legendActions}>
                      <TouchableOpacity
                        style={styles.legendButton}
                        onPress={() => handleEditarHorario(horario)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#007BFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.legendButton}
                        onPress={() => handleEliminarHorario(horario.id)}
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