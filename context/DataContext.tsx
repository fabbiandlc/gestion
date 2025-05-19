"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Tipos de datos
export interface Docente {
  id: string
  nombre: string
  apellido: string
  email: string
  numeroEmpleado: string
  materias: Materia[] // Agregamos el array de materias
}

export interface Materia {
  id: string
  nombre: string
  siglas: string
}

export interface Grupo {
  id: string
  nombre: string
  docenteId: string
}

export interface Directivo {
  id: string
  nombre: string
  rol: "Director" | "Subdirector Académico"
  generoFemenino: boolean
}

export interface Horario {
  id: string
  dia: string
  horaInicio: string
  horaFin: string
  materiaId: string
  docenteId: string
  salonId: string // ID del grupo
}

export interface Actividad {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  horaInicio: string
  horaFin: string
  color: string
}

interface DataContextType {
  docentes: Docente[]
  materias: Materia[]
  grupos: Grupo[]
  directivos: Directivo[]
  horarios: Horario[]
  actividades: Actividad[]
  addDocente: (docente: Omit<Docente, "id">) => void
  addMateria: (materia: Omit<Materia, "id">) => void
  addGrupo: (grupo: Omit<Grupo, "id">) => void
  addDirectivo: (directivo: Omit<Directivo, "id">) => void
  addHorario: (horario: Omit<Horario, "id">) => void
  addActividad: (actividad: Omit<Actividad, "id">) => void
  updateDocente: (id: string, docente: Partial<Docente>) => void
  updateMateria: (id: string, materia: Partial<Materia>) => void
  updateGrupo: (id: string, grupo: Partial<Grupo>) => void
  updateDirectivo: (id: string, directivo: Partial<Directivo>) => void
  updateHorario: (id: string, horario: Partial<Horario>) => void
  updateActividad: (id: string, actividad: Partial<Actividad>) => void
  deleteDocente: (id: string) => void
  deleteMateria: (id: string) => void
  deleteGrupo: (id: string) => void
  deleteDirectivo: (id: string) => void
  deleteHorario: (id: string) => void
  deleteActividad: (id: string) => void
  clearDocentes: () => void
  clearMaterias: () => void
  clearGrupos: () => void
  clearDirectivos: () => void
  clearHorarios: () => void
  clearHorariosByEntity: (entityId: string, isDocente: boolean) => void
  getDocenteById: (id: string) => Docente | undefined
  getMateriaById: (id: string) => Materia | undefined
  getGrupoById: (id: string) => Grupo | undefined
  getDirectivoById: (id: string) => Directivo | undefined
  loadAllData: () => Promise<boolean>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const getDefaultGroups = () => {
  const groups = [];
  for (let i = 201; i <= 210; i++) {
    groups.push({ id: `grupo_${i}`, nombre: `${i}`, docenteId: "" });
  }
  for (let i = 401; i <= 410; i++) {
    groups.push({ id: `grupo_${i}`, nombre: `${i}`, docenteId: "" });
  }
  for (let i = 601; i <= 610; i++) {
    groups.push({ id: `grupo_${i}`, nombre: `${i}`, docenteId: "" });
  }
  return groups;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>(getDefaultGroups()) // Inicializar con grupos predeterminados
  const [directivos, setDirectivos] = useState<Directivo[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])

  // Función para cargar todos los datos desde AsyncStorage
  const loadAllData = async () => {
    try {
      console.log("Recargando todos los datos desde AsyncStorage...");
      
      const docentesData = await AsyncStorage.getItem("docentes")
      const materiasData = await AsyncStorage.getItem("materias")
      const gruposData = await AsyncStorage.getItem("grupos")
      const directivosData = await AsyncStorage.getItem("directivos")
      const horariosData = await AsyncStorage.getItem("horarios")
      const actividadesData = await AsyncStorage.getItem("actividades")

      if (docentesData) {
        console.log("Cargando docentes:", JSON.parse(docentesData).length);
        setDocentes(JSON.parse(docentesData));
      }
      if (materiasData) {
        console.log("Cargando materias:", JSON.parse(materiasData).length);
        setMaterias(JSON.parse(materiasData));
      }
      if (gruposData) {
        console.log("Cargando grupos:", JSON.parse(gruposData).length);
        setGrupos(JSON.parse(gruposData));
      }
      if (directivosData) {
        console.log("Cargando directivos:", JSON.parse(directivosData).length);
        setDirectivos(JSON.parse(directivosData));
      }
      if (horariosData) {
        console.log("Cargando horarios:", JSON.parse(horariosData).length);
        setHorarios(JSON.parse(horariosData));
      }
      if (actividadesData) {
        console.log("Cargando actividades:", JSON.parse(actividadesData).length);
        setActividades(JSON.parse(actividadesData));
      }
      
      // Cargar también las tareas (tasks)
      const tasksData = await AsyncStorage.getItem("tasks");
      if (tasksData) {
        console.log("Cargando tasks:", JSON.parse(tasksData).length);
      }
      
      return true;
    } catch (e) {
      console.error("Error al cargar datos:", e);
      return false;
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  // Extraer materias de docentes y agregarlas al sistema
  useEffect(() => {
    if (docentes.length > 0) {
      // Recopilar todas las materias de los docentes
      const materiasDeDocentes: Materia[] = [];
      
      docentes.forEach(docente => {
        if (docente.materias && Array.isArray(docente.materias) && docente.materias.length > 0) {
          docente.materias.forEach(materia => {
            // Verificar si la materia ya existe en el array de materias global
            const materiaExiste = materias.some(m => String(m.id) === String(materia.id));
            const yaAgregada = materiasDeDocentes.some(m => String(m.id) === String(materia.id));
            
            // Solo agregar si no existe ya
            if (!materiaExiste && !yaAgregada) {
              materiasDeDocentes.push(materia);
            }
          });
        }
      });
      
      // Si hay nuevas materias para agregar
      if (materiasDeDocentes.length > 0) {
        console.log(`Agregando ${materiasDeDocentes.length} materias desde docentes al sistema`);
        setMaterias(prev => [...prev, ...materiasDeDocentes]);
      }
    }
  }, [docentes]);

  // Guardar grupos cuando cambien
  useEffect(() => {
    const saveGrupos = async () => {
      try {
        console.log("Guardando grupos:", grupos) // Para debug
        await AsyncStorage.setItem("grupos", JSON.stringify(grupos))
      } catch (e) {
        console.error("Error al guardar grupos:", e)
      }
    }
    saveGrupos()
  }, [grupos])

  // Guardar docentes cuando cambien
  useEffect(() => {
    const saveDocentes = async () => {
      try {
        console.log("Guardando docentes:", docentes) // Para debug
        await AsyncStorage.setItem("docentes", JSON.stringify(docentes))
      } catch (e) {
        console.error("Error al guardar docentes:", e)
      }
    }
    saveDocentes()
  }, [docentes])

  // Guardar materias cuando cambien
  useEffect(() => {
    const saveMaterias = async () => {
      try {
        console.log("Guardando materias:", materias) // Para debug
        await AsyncStorage.setItem("materias", JSON.stringify(materias))
      } catch (e) {
        console.error("Error al guardar materias:", e)
      }
    }
    saveMaterias()
  }, [materias])

  // Guardar directivos cuando cambien
  useEffect(() => {
    const saveDirectivos = async () => {
      try {
        console.log("Guardando directivos:", directivos) // Para debug
        await AsyncStorage.setItem("directivos", JSON.stringify(directivos))
      } catch (e) {
        console.error("Error al guardar directivos:", e)
      }
    }
    saveDirectivos()
  }, [directivos])

  // Guardar horarios cuando cambien
  useEffect(() => {
    const saveHorarios = async () => {
      try {
        console.log("Guardando horarios:", horarios) // Para debug
        await AsyncStorage.setItem("horarios", JSON.stringify(horarios))
      } catch (e) {
        console.error("Error al guardar horarios:", e)
      }
    }
    saveHorarios()
  }, [horarios])

  // Guardar actividades cuando cambien
  useEffect(() => {
    const saveActividades = async () => {
      try {
        console.log("Guardando actividades:", actividades) // Para debug
        await AsyncStorage.setItem("actividades", JSON.stringify(actividades))
      } catch (e) {
        console.error("Error al guardar actividades:", e)
      }
    }
    saveActividades()
  }, [actividades])

  // Funciones para agregar datos

  const addDocente = (docente: Omit<Docente, "id">) => {
    const newDocente = { 
      ...docente, 
      id: `docente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      materias: docente.materias // Usar las materias proporcionadas
    }
    setDocentes(prev => [...prev, newDocente])
  }

  const addMateria = (materia: Omit<Materia, "id">) => {
    const newMateria = { ...materia, id: `materia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setMaterias(prev => [...prev, newMateria])
  }

  const addGrupo = (grupo: Omit<Grupo, "id">) => {
    const newGrupo = { ...grupo, id: `grupo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setGrupos(prev => [...prev, newGrupo])
  }

  const addDirectivo = (directivo: Omit<Directivo, "id">) => {
    const newDirectivo = { ...directivo, id: `directivo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setDirectivos(prev => [...prev, newDirectivo])
  }

  const addHorario = (horario: Omit<Horario, "id">) => {
    const newHorario = { ...horario, id: `horario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setHorarios([...horarios, newHorario])
  }

  const addActividad = (actividad: Omit<Actividad, "id">) => {
    const newActividad = { ...actividad, id: `actividad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setActividades([...actividades, newActividad])
  }

  // Funciones para actualizar datos
  const updateDocente = (id: string, docente: Partial<Docente>) => {
    setDocentes(docentes.map((d) => (d.id === id ? { ...d, ...docente } : d)))
  }

  const updateMateria = (id: string, materia: Partial<Materia>) => {
    setMaterias(materias.map((m) => (m.id === id ? { ...m, ...materia } : m)))
  }

  const updateGrupo = (id: string, grupo: Partial<Grupo>) => {
    setGrupos(grupos.map((g) => (g.id === id ? { ...g, ...grupo } : g)))
  }

  const updateDirectivo = (id: string, directivo: Partial<Directivo>) => {
    setDirectivos(directivos.map((d) => (d.id === id ? { ...d, ...directivo } : d)))
  }

  const updateHorario = (id: string, horario: Partial<Horario>) => {
    setHorarios(horarios.map((h) => (h.id === id ? { ...h, ...horario } : h)))
  }

  const updateActividad = (id: string, actividad: Partial<Actividad>) => {
    setActividades(actividades.map((a) => (a.id === id ? { ...a, ...actividad } : a)))
  }

  // Funciones para eliminar datos
  const deleteDocente = (id: string) => {
    // Eliminar los horarios asociados a este docente
    clearHorariosByEntity(id, true);
    // Eliminar el docente
    setDocentes(docentes.filter((d) => d.id !== id));
  }

  const deleteMateria = (id: string) => {
    setMaterias(materias.filter((m) => m.id !== id))
  }

  const deleteGrupo = (id: string) => {
    // Eliminar los horarios asociados a este grupo
    clearHorariosByEntity(id, false);
    // Eliminar el grupo
    setGrupos(grupos.filter((g) => g.id !== id))
  }

  const deleteDirectivo = (id: string) => {
    setDirectivos(directivos.filter((d) => d.id !== id))
  }

  const deleteHorario = (id: string) => {
    setHorarios(horarios.filter((h) => h.id !== id))
  }

  const deleteActividad = (id: string) => {
    setActividades(actividades.filter((a) => a.id !== id))
  }

  const clearDocentes = () => {
    // Eliminar todos los horarios asociados a docentes
    setHorarios(horarios.filter(h => !h.docenteId));
    // Eliminar todos los docentes
    setDocentes([]);
  };
  
  const clearGrupos = () => {
    // Eliminar todos los horarios asociados a grupos
    setHorarios(horarios.filter(h => !h.salonId));
    // Eliminar todos los grupos
    setGrupos([]);
  };
  
  const clearMaterias = () => setMaterias([]);
  const clearDirectivos = () => setDirectivos([]);
  const clearHorarios = () => setHorarios([]);
  
  // Función para eliminar todos los horarios de una entidad específica
  const clearHorariosByEntity = (entityId: string, isDocente: boolean) => {
    const entityIdStr = String(entityId);
    console.log(`Eliminando todos los horarios para ${isDocente ? "docente" : "grupo"} ${entityIdStr}`);
    
    // Filtrar para mantener solo los horarios que NO pertenecen a esta entidad
    const horariosRestantes = horarios.filter(h => {
      if (isDocente) {
        return String(h.docenteId) !== entityIdStr;
      } else {
        return String(h.salonId) !== entityIdStr;
      }
    });
    
    console.log(`Se eliminarán ${horarios.length - horariosRestantes.length} horarios`);
    
    // Actualizar el estado con los horarios restantes
    setHorarios(horariosRestantes);
  };

  // Funciones para obtener datos por ID
  const getDocenteById = (id: string) => {
    return docentes.find((d) => d.id === id)
  }

  const getMateriaById = (id: string) => {
    return materias.find((m) => m.id === id)
  }

  const getGrupoById = (id: string) => {
    return grupos.find((g) => g.id === id)
  }

  const getDirectivoById = (id: string) => {
    return directivos.find((d) => d.id === id)
  }

  return (
    <DataContext.Provider
      value={{
        docentes,
        materias,
        grupos,
        directivos,
        horarios,
        actividades,
        addDocente,
        addMateria,
        addGrupo,
        addDirectivo,
        addHorario,
        addActividad,
        updateDocente,
        updateMateria,
        updateGrupo,
        updateDirectivo,
        updateHorario,
        updateActividad,
        deleteDocente,
        deleteMateria,
        deleteGrupo,
        deleteDirectivo,
        deleteHorario,
        deleteActividad,
        clearDocentes,
        clearMaterias,
        clearGrupos,
        clearDirectivos,
        clearHorarios,
        clearHorariosByEntity,
        getDocenteById,
        getMateriaById,
        getGrupoById,
        getDirectivoById,
        loadAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
