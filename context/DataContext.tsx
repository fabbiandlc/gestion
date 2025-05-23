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

export interface Administrativo {
  id: string
  nombre: string
  celular: string
  correo: string
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

export interface Entrega {
  id: string;
  docenteId: string;
  materiaId: string;
  tipo: 'planeacion' | 'calificacion';
  parcial: 'primer' | 'segundo' | 'tercer';
  entregado: boolean;
}

interface DataContextType {
  docentes: Docente[]
  materias: Materia[]
  grupos: Grupo[]
  directivos: Directivo[]
  administrativos: Administrativo[]
  horarios: Horario[]
  actividades: Actividad[]
  entregas: Entrega[]
  addDocente: (docente: Omit<Docente, "id">) => void
  addMateria: (materia: Omit<Materia, "id">) => void
  addGrupo: (grupo: Omit<Grupo, "id">) => void
  addDirectivo: (directivo: Omit<Directivo, "id">) => Promise<{ success: boolean, error?: string }>
  addAdministrativo: (administrativo: Omit<Administrativo, "id">) => Promise<{ success: boolean, error?: string }>
  addHorario: (horario: Omit<Horario, "id">) => void
  addActividad: (actividad: Omit<Actividad, "id">) => void
  addEntrega: (entrega: Omit<Entrega, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateEntrega: (docenteId: string, materiaId: string, tipo: 'planeacion' | 'calificacion', 
    parcial: 'primer' | 'segundo' | 'tercer', entregado: boolean) => Promise<{ success: boolean; error?: string }>;
  clearEntregasByDocente: (docenteId: string) => Promise<{ success: boolean; error?: string }>;
  updateDocente: (id: string, docente: Partial<Docente>) => void
  updateMateria: (id: string, materia: Partial<Materia>) => void
  updateGrupo: (id: string, grupo: Partial<Grupo>) => void
  updateDirectivo: (id: string, directivo: Partial<Directivo>) => Promise<{ success: boolean, error?: string }>
  updateAdministrativo: (id: string, administrativo: Partial<Administrativo>) => Promise<{ success: boolean, error?: string }>
  updateHorario: (id: string, horario: Partial<Horario>) => void
  updateActividad: (id: string, actividad: Partial<Actividad>) => void
  deleteDocente: (id: string) => void
  deleteMateria: (id: string) => void
  deleteGrupo: (id: string) => void
  deleteDirectivo: (id: string) => Promise<{ success: boolean, error?: string }>
  deleteAdministrativo: (id: string) => Promise<{ success: boolean, error?: string }>
  deleteHorario: (id: string) => void
  deleteActividad: (id: string) => void
  clearDocentes: () => void
  clearMaterias: () => void
  clearGrupos: () => void
  clearDirectivos: () => Promise<{ success: boolean, error?: string }>
  clearAdministrativos: () => Promise<{ success: boolean, error?: string }>
  clearHorarios: () => void
  clearHorariosByEntity: (entityId: string, isDocente: boolean) => void
  getDocenteById: (id: string) => Docente | undefined
  getMateriaById: (id: string) => Materia | undefined
  getGrupoById: (id: string) => Grupo | undefined
  getDirectivoById: (id: string) => Directivo | undefined
  getAdministrativoById: (id: string) => Administrativo | undefined
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
  const [administrativos, setAdministrativos] = useState<Administrativo[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([]);

  // Función para cargar todos los datos desde AsyncStorage
  const loadAllData = async () => {
    try {
      console.log("Recargando todos los datos desde AsyncStorage...");
      
      const [
        docentesData, 
        materiasData, 
        gruposData, 
        directivosData, 
        administrativosData, 
        horariosData, 
        actividadesData,
        entregasData
      ] = await Promise.all([
        AsyncStorage.getItem("docentes"),
        AsyncStorage.getItem("materias"),
        AsyncStorage.getItem("grupos"),
        AsyncStorage.getItem("directivos"),
        AsyncStorage.getItem("administrativos"),
        AsyncStorage.getItem("horarios"),
        AsyncStorage.getItem("actividades"),
        AsyncStorage.getItem("entregas")
      ]);

      // Actualizar los estados con los datos cargados
      const updates = [];
      
      if (docentesData) {
        console.log("Cargando docentes:", JSON.parse(docentesData).length);
        updates.push(new Promise(resolve => {
          setDocentes(JSON.parse(docentesData));
          resolve(true);
        }));
      }
      
      if (materiasData) {
        console.log("Cargando materias:", JSON.parse(materiasData).length);
        updates.push(new Promise(resolve => {
          setMaterias(JSON.parse(materiasData));
          resolve(true);
        }));
      }
      
      if (gruposData) {
        console.log("Cargando grupos:", JSON.parse(gruposData).length);
        updates.push(new Promise(resolve => {
          setGrupos(JSON.parse(gruposData));
          resolve(true);
        }));
      }
      
      if (directivosData) {
        console.log("Cargando directivos:", JSON.parse(directivosData).length);
        updates.push(new Promise(resolve => {
          setDirectivos(JSON.parse(directivosData));
          resolve(true);
        }));
      } else {
        console.log("No se encontraron datos de directivos en AsyncStorage");
      }
      
      if (administrativosData) {
        console.log("Cargando administrativos:", JSON.parse(administrativosData).length);
        updates.push(new Promise(resolve => {
          setAdministrativos(JSON.parse(administrativosData));
          resolve(true);
        }));
      } else {
        console.log("No se encontraron datos de administrativos en AsyncStorage");
      }
      
      if (horariosData) {
        console.log("Cargando horarios:", JSON.parse(horariosData).length);
        updates.push(new Promise(resolve => {
          setHorarios(JSON.parse(horariosData));
          resolve(true);
        }));
      }
      
      if (actividadesData) {
        console.log("Cargando actividades:", JSON.parse(actividadesData).length);
        updates.push(new Promise(resolve => {
          setActividades(JSON.parse(actividadesData));
          resolve(true);
        }));
      }
      
      if (entregasData) {
        console.log("Cargando entregas:", JSON.parse(entregasData).length);
        updates.push(new Promise(resolve => {
          setEntregas(JSON.parse(entregasData));
          resolve(true);
        }));
      }
      
      // Esperar a que se actualicen todos los estados
      await Promise.all(updates);
      
      console.log("Datos cargados correctamente");
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

  // Guardar administrativos cuando cambien
  useEffect(() => {
    const saveAdministrativos = async () => {
      try {
        console.log("Guardando administrativos:", administrativos) // Para debug
        await AsyncStorage.setItem("administrativos", JSON.stringify(administrativos))
      } catch (e) {
        console.error("Error al guardar administrativos:", e)
      }
    }
    saveAdministrativos()
  }, [administrativos])

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

  // Guardar entregas cuando cambien
  useEffect(() => {
    const saveEntregas = async () => {
      try {
        console.log("Guardando entregas:", entregas) // Para debug
        await AsyncStorage.setItem("entregas", JSON.stringify(entregas))
      } catch (e) {
        console.error("Error al guardar entregas:", e)
      }
    }
    saveEntregas()
  }, [entregas])

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

  const addDirectivo = async (directivo: Omit<Directivo, "id">) => {
    try {
      const newDirectivo = { 
        ...directivo, 
        id: `directivo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      };
      
      const updatedDirectivos = [...directivos, newDirectivo];
      setDirectivos(updatedDirectivos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('directivos', JSON.stringify(updatedDirectivos));
      console.log('Directivo guardado en AsyncStorage:', newDirectivo);
      
      return { success: true };
    } catch (error) {
      console.error('Error al agregar directivo:', error);
      return { success: false, error: 'Error al agregar directivo' };
    }
  };

  const addAdministrativo = async (administrativo: Omit<Administrativo, "id">) => {
    try {
      const newAdministrativo = { 
        ...administrativo, 
        id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      };
      
      const updatedAdministrativos = [...administrativos, newAdministrativo];
      setAdministrativos(updatedAdministrativos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('administrativos', JSON.stringify(updatedAdministrativos));
      console.log('Administrativo guardado en AsyncStorage:', newAdministrativo);
      
      return { success: true };
    } catch (error) {
      console.error('Error al agregar administrativo:', error);
      return { success: false, error: 'Error al agregar administrativo' };
    }
  };

  const addHorario = (horario: Omit<Horario, "id">) => {
    const newHorario = { ...horario, id: `horario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setHorarios([...horarios, newHorario])
  }

  const addActividad = (actividad: Omit<Actividad, "id">) => {
    const newActividad = { ...actividad, id: `actividad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    setActividades([...actividades, newActividad])
  }

  const addEntrega = async (entrega: Omit<Entrega, 'id'>) => {
    try {
      const newEntrega: Entrega = {
        ...entrega,
        id: `entrega_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setEntregas(prev => [...prev, newEntrega]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al agregar entrega' };
    }
  };

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

  const updateDirectivo = async (id: string, updates: Partial<Omit<Directivo, "id">>) => {
    try {
      const updatedDirectivos = directivos.map(d => 
        d.id === id ? { ...d, ...updates } : d
      );
      
      setDirectivos(updatedDirectivos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('directivos', JSON.stringify(updatedDirectivos));
      console.log('Directivo actualizado en AsyncStorage:', id, updates);
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar directivo:', error);
      return { success: false, error: 'Error al actualizar directivo' };
    }
  };

  const updateAdministrativo = async (id: string, updates: Partial<Omit<Administrativo, "id">>) => {
    try {
      const updatedAdministrativos = administrativos.map(a => 
        a.id === id ? { ...a, ...updates } : a
      );
      
      setAdministrativos(updatedAdministrativos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('administrativos', JSON.stringify(updatedAdministrativos));
      console.log('Administrativo actualizado en AsyncStorage:', id, updates);
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar administrativo:', error);
      return { success: false, error: 'Error al actualizar administrativo' };
    }
  };

  const updateHorario = (id: string, horario: Partial<Horario>) => {
    setHorarios(horarios.map((h) => (h.id === id ? { ...h, ...horario } : h)))
  }

  const updateActividad = (id: string, actividad: Partial<Actividad>) => {
    setActividades(actividades.map((a) => (a.id === id ? { ...a, ...actividad } : a)))
  }

  const updateEntrega = async (
    docenteId: string, 
    materiaId: string, 
    tipo: 'planeacion' | 'calificacion', 
    parcial: 'primer' | 'segundo' | 'tercer', 
    entregado: boolean
  ) => {
    try {
      setEntregas(prev => {
        const existing = prev.find(
          e => e.docenteId === docenteId && 
               e.materiaId === materiaId && 
               e.tipo === tipo && 
               e.parcial === parcial
        );
        
        if (existing) {
          return prev.map(e =>
            e.docenteId === docenteId && 
            e.materiaId === materiaId && 
            e.tipo === tipo && 
            e.parcial === parcial
              ? { ...e, entregado }
              : e
          );
        } else {
          return [
            ...prev,
            {
              id: `entrega_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              docenteId,
              materiaId,
              tipo,
              parcial,
              entregado,
            },
          ];
        }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar entrega' };
    }
  };

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

  const deleteDirectivo = async (id: string) => {
    try {
      const updatedDirectivos = directivos.filter(d => d.id !== id);
      setDirectivos(updatedDirectivos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('directivos', JSON.stringify(updatedDirectivos));
      console.log('Directivo eliminado de AsyncStorage:', id);
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar directivo:', error);
      return { success: false, error: 'Error al eliminar directivo' };
    }
  };

  const deleteAdministrativo = async (id: string) => {
    try {
      const updatedAdministrativos = administrativos.filter(a => a.id !== id);
      setAdministrativos(updatedAdministrativos);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('administrativos', JSON.stringify(updatedAdministrativos));
      console.log('Administrativo eliminado de AsyncStorage:', id);
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar administrativo:', error);
      return { success: false, error: 'Error al eliminar administrativo' };
    }
  };

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
  const clearDirectivos = async () => {
    try {
      setDirectivos([]);
      await AsyncStorage.removeItem('directivos');
      return { success: true };
    } catch (error) {
      console.error('Error al limpiar directivos:', error);
      return { success: false, error: 'Error al limpiar directivos' };
    }
  };

  const clearAdministrativos = async () => {
    try {
      setAdministrativos([]);
      await AsyncStorage.removeItem('administrativos');
      return { success: true };
    } catch (error) {
      console.error('Error al limpiar administrativos:', error);
      return { success: false, error: 'Error al limpiar administrativos' };
    }
  };

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

  const clearEntregasByDocente = async (docenteId: string) => {
    try {
      setEntregas(prev => prev.filter(e => e.docenteId !== docenteId));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al vaciar entregas' };
    }
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

  const getAdministrativoById = (id: string) => {
    return administrativos.find((a) => a.id === id)
  }

  return (
    <DataContext.Provider
      value={{
        docentes,
        materias,
        grupos,
        directivos,
        administrativos,
        horarios,
        actividades,
        entregas,
        addDocente,
        addMateria,
        addGrupo,
        addDirectivo,
        addAdministrativo,
        addHorario,
        addActividad,
        addEntrega,
        updateDocente,
        updateMateria,
        updateGrupo,
        updateDirectivo,
        updateAdministrativo,
        updateHorario,
        updateActividad,
        updateEntrega,
        deleteDocente,
        deleteMateria,
        deleteGrupo,
        deleteDirectivo,
        deleteAdministrativo,
        deleteHorario,
        deleteActividad,
        clearDocentes,
        clearMaterias,
        clearGrupos,
        clearDirectivos,
        clearAdministrativos,
        clearHorarios,
        clearHorariosByEntity,
        clearEntregasByDocente,
        getDocenteById,
        getMateriaById,
        getGrupoById,
        getDirectivoById,
        getAdministrativoById,
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
