import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("AppDatabase.db");

export const initDatabase = async () => {
  try {
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Docentes (
          id TEXT PRIMARY KEY NOT NULL,
          nombre TEXT NOT NULL,
          apellido TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          materias TEXT,
          grupos TEXT,
          especialidad TEXT
        );
        CREATE TABLE IF NOT EXISTS Materias (
          id TEXT PRIMARY KEY NOT NULL,
          nombre TEXT NOT NULL,
          codigo TEXT,
          horasSemana INTEGER,
          creditos INTEGER,
          semestre TEXT,
          color TEXT,
          descripcion TEXT
        );
        CREATE TABLE IF NOT EXISTS Grupos (
          id TEXT PRIMARY KEY NOT NULL,
          nombre TEXT NOT NULL,
          grado INTEGER,
          turno TEXT,
          tutor TEXT,
          materias TEXT
        );
        CREATE TABLE IF NOT EXISTS Horarios (
          id TEXT PRIMARY KEY NOT NULL,
          docenteId TEXT,
          dia TEXT NOT NULL,
          horaInicio TEXT NOT NULL,
          horaFin TEXT NOT NULL,
          materiaId TEXT,
          salonId TEXT,
          color TEXT,
          FOREIGN KEY (docenteId) REFERENCES Docentes(id),
          FOREIGN KEY (materiaId) REFERENCES Materias(id),
          FOREIGN KEY (salonId) REFERENCES Grupos(id)
        );
        CREATE TABLE IF NOT EXISTS Activities (
          id TEXT PRIMARY KEY NOT NULL,
          activityName TEXT NOT NULL,
          activityDate TEXT NOT NULL,
          activityTime TEXT NOT NULL,
          notes TEXT
        );
      `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const fetchAll = async (table) => {
  try {
    const result = await db.getAllAsync(`SELECT * FROM ${table};`);
    return result || [];
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
};

const validFields = {
  Docentes: [
    "id",
    "nombre",
    "apellido",
    "email",
    "telefono",
    "materias",
    "grupos",
    "especialidad",
  ],
  Materias: [
    "id",
    "nombre",
    "codigo",
    "horasSemana",
    "creditos",
    "semestre",
    "color",
    "descripcion",
  ],
  Grupos: ["id", "nombre", "grado", "turno", "tutor", "materias"],
  Horarios: [
    "id",
    "docenteId",
    "dia",
    "horaInicio",
    "horaFin",
    "materiaId",
    "salonId",
    "color",
  ],
  Activities: ["id", "activityName", "activityDate", "activityTime", "notes"],
};

export const insert = async (table, data) => {
  try {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => validFields[table].includes(key))
    );
    if (filteredData.materias && Array.isArray(filteredData.materias)) {
      filteredData.materias = JSON.stringify(filteredData.materias);
    }
    if (filteredData.grupos && Array.isArray(filteredData.grupos)) {
      filteredData.grupos = JSON.stringify(filteredData.grupos);
    }
    if (filteredData.notes && Array.isArray(filteredData.notes)) {
      filteredData.notes = JSON.stringify(filteredData.notes);
    }
    const keys = Object.keys(filteredData).join(",");
    const placeholders = Object.keys(filteredData)
      .map(() => "?")
      .join(",");
    const values = Object.values(filteredData);
    await db.runAsync(
      `INSERT INTO ${table} (${keys}) VALUES (${placeholders});`,
      values
    );
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
};

export const update = async (table, data, id) => {
  try {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => validFields[table].includes(key))
    );
    if (filteredData.materias && Array.isArray(filteredData.materias)) {
      filteredData.materias = JSON.stringify(filteredData.materias);
    }
    if (filteredData.grupos && Array.isArray(filteredData.grupos)) {
      filteredData.grupos = JSON.stringify(filteredData.grupos);
    }
    if (filteredData.notes && Array.isArray(filteredData.notes)) {
      filteredData.notes = JSON.stringify(filteredData.notes);
    }
    const setClause = Object.keys(filteredData)
      .map((key) => `${key} = ?`)
      .join(",");
    const values = [...Object.values(filteredData), id];
    await db.runAsync(
      `UPDATE ${table} SET ${setClause} WHERE id = ?;`,
      values
    );
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
};

export const remove = async (table, id) => {
  try {
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?;`, [id]);
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
};

export const exportBackup = async () => {
  try {
    const tables = ["Docentes", "Materias", "Grupos", "Horarios", "Activities"];
    const backupData = {};

    for (const table of tables) {
      const data = await fetchAll(table);
      backupData[table] = data.map((item) => {
        const filteredItem = {};
        validFields[table].forEach((field) => {
          if (item[field] !== undefined) {
            filteredItem[field] = item[field];
          }
        });
        return filteredItem;
      });
    }

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    console.error("Error exporting backup:", error);
    return null;
  }
};

export const importBackup = async (backupData) => {
  try {
    const data =
      typeof backupData === "string" ? JSON.parse(backupData) : backupData;
    const validTables = [
      "Docentes",
      "Materias",
      "Grupos",
      "Horarios",
      "Activities",
    ];

    if (!Object.keys(data).some((table) => validTables.includes(table))) {
      console.error("Backup file contains no valid tables");
      return false;
    }

    await db.execAsync("BEGIN TRANSACTION;");

    for (const table of validTables) {
      if (data[table]) {
        console.log(`Importing ${table}:`, data[table]); // Debug log
        const currentData = await fetchAll(table);
        const currentIds = currentData.map((item) => item.id);

        for (const item of data[table]) {
          if (!item.id) {
            console.warn(`Skipping ${table} item without ID:`, item);
            continue;
          }
          const existingItem = currentData.find((e) => e.id === item.id);
          const filteredItem = {};
          validFields[table].forEach((field) => {
            if (item[field] !== undefined) {
              filteredItem[field] = item[field];
            } else if (existingItem && existingItem[field] !== undefined) {
              filteredItem[field] = existingItem[field];
            }
          });

          if (existingItem) {
            await update(table, filteredItem, item.id);
          } else {
            await insert(table, filteredItem);
          }
        }

        const backupIds = data[table].map((item) => item.id);
        const itemsToDelete = currentData.filter(
          (item) => !backupIds.includes(item.id)
        );
        for (const item of itemsToDelete) {
          await remove(table, item.id);
        }
      }
    }

    await db.execAsync("COMMIT;");
    console.log("Backup imported successfully");
    return true;
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    console.error("Error importing backup:", error);
    return false;
  }
};