import React, { createContext, useState, useEffect } from "react";
import { initDatabase, fetchAll, insert, update, remove } from "./Database";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [activities, setActivities] = useState([]);
  const [directivos, setDirectivos] = useState([]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase();
        const [
          docentesData,
          materiasData,
          gruposData,
          horariosData,
          activitiesData,
          directivosData,
        ] = await Promise.all([
          fetchAll("Docentes"),
          fetchAll("Materias"),
          fetchAll("Grupos"),
          fetchAll("Horarios"),
          fetchAll("Activities"),
          fetchAll("Directivos"),
        ]);
        setDocentes(docentesData || []);
        setMaterias(materiasData || []);
        setGrupos(gruposData || []);
        setHorarios(horariosData || []);
        setActivities(activitiesData || []);
        setDirectivos(directivosData || []);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    loadData();
  }, []);

  const updateTable = async (table, setState, newData) => {
    try {
      // Update database first
      const currentDbData = await fetchAll(table);
      const currentIds = currentDbData.map((item) => item.id);
      const newIds = newData.map((item) => item.id);

      // Insert or update items
      for (const item of newData) {
        if (currentIds.includes(item.id)) {
          await update(table, item, item.id);
        } else {
          await insert(table, item);
        }
      }

      // Remove items no longer present
      const itemsToDelete = currentDbData.filter(
        (item) => !newIds.includes(item.id)
      );
      for (const item of itemsToDelete) {
        await remove(table, item.id);
      }

      // Update state
      setState(newData);
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  };

  const updateDocentes = (newDocentes) =>
    updateTable("Docentes", setDocentes, newDocentes);
  const updateMaterias = (newMaterias) =>
    updateTable("Materias", setMaterias, newMaterias);
  const updateGrupos = (newGrupos) =>
    updateTable("Grupos", setGrupos, newGrupos);
  const updateHorarios = (newHorarios) =>
    updateTable("Horarios", setHorarios, newHorarios);
  const updateActivities = (newActivities) =>
    updateTable("Activities", setActivities, newActivities);
  const updateDirectivos = (newDirectivos) =>
    updateTable("Directivos", setDirectivos, newDirectivos);

  const deleteItem = async (table, id) => {
    try {
      await remove(table, id);
      switch (table) {
        case "Docentes":
          setDocentes(docentes.filter((d) => d.id !== id));
          break;
        case "Materias":
          setMaterias(materias.filter((m) => m.id !== id));
          break;
        case "Grupos":
          setGrupos(grupos.filter((g) => g.id !== id));
          break;
        case "Horarios":
          setHorarios(horarios.filter((h) => h.id !== id));
          break;
        case "Activities":
          setActivities(activities.filter((a) => a.id !== id));
          break;
        case "Directivos":
          setDirectivos(directivos.filter((d) => d.id !== id));
          break;
      }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        docentes,
        setDocentes: updateDocentes,
        materias,
        setMaterias: updateMaterias,
        grupos,
        setGrupos: updateGrupos,
        horarios,
        setHorarios: updateHorarios,
        activities,
        setActivities: updateActivities,
        directivos,
        setDirectivos: updateDirectivos,
        deleteItem,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => React.useContext(DataContext);