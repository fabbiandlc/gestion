import * as SQLite from "expo-sqlite";
import { supabase } from './supabaseConfig';
import NetInfo from '@react-native-community/netinfo';

const db = SQLite.openDatabaseSync("AppDatabase.db");

const validFields = {
  Docentes: ["id", "nombre", "apellido", "email", "telefono", "numeroEmpleado", "materias", "grupos", "especialidad"],
  Materias: ["id", "nombre", "codigo", "horasSemana", "creditos", "semestre", "color", "descripcion"],
  Grupos: ["id", "nombre", "grado", "turno", "tutor", "materias"],
  Horarios: ["id", "docenteId", "dia", "horaInicio", "horaFin", "materiaId", "salonId", "color"],
  Activities: ["id", "activityName", "activityDate", "activityTime", "notes"],
  Directivos: ["id", "nombre", "rol", "generoFemenino"],
};

const updateDirectivosColumns = async () => {
  try {
    await db.runAsync(`
      UPDATE Directivos
      SET rol = 'Director',
          generoFemenino = 0
      WHERE (rol = '' OR rol IS NULL OR generoFemenino IS NULL) AND id IN (
        SELECT id FROM Directivos LIMIT 1
      );
    `);
    console.log("Updated 'rol' and 'generoFemenino' for existing Directivos records.");
  } catch (error) {
    console.error("Error updating Directivos columns:", error);
  }
};

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
        numeroEmpleado TEXT,
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
      CREATE TABLE IF NOT EXISTS Directivos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL,
        generoFemenino BOOLEAN DEFAULT FALSE
      );
      CREATE TABLE IF NOT EXISTS SyncInfo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lastSync TEXT,
        pendingChanges BOOLEAN DEFAULT FALSE
      );
    `);

    const schema = await db.getAllAsync("PRAGMA table_info(Directivos);");
    const hasRolColumn = schema.some((column) => column.name === "rol");
    const hasGeneroFemeninoColumn = schema.some((column) => column.name === "generoFemenino");

    if (!hasRolColumn) {
      console.log("Adding 'rol' column to Directivos table...");
      await db.execAsync(`
        ALTER TABLE Directivos ADD COLUMN rol TEXT NOT NULL DEFAULT '';
      `);
      console.log("'rol' column added successfully.");
    }

    if (!hasGeneroFemeninoColumn) {
      console.log("Adding 'generoFemenino' column to Directivos table...");
      await db.execAsync(`
        ALTER TABLE Directivos ADD COLUMN generoFemenino BOOLEAN DEFAULT FALSE;
      `);
      console.log("'generoFemenino' column added successfully.");
    }

    if (!hasRolColumn || !hasGeneroFemeninoColumn) {
      await updateDirectivosColumns();
    }

    const syncInfo = await db.getAllAsync(`SELECT * FROM SyncInfo LIMIT 1;`);
    if (syncInfo.length === 0) {
      await db.runAsync(`INSERT INTO SyncInfo (lastSync, pendingChanges) VALUES (NULL, FALSE);`);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const insert = async (table, data) => {
  try {
    const fields = validFields[table];
    if (!fields) throw new Error(`Invalid table: ${table}`);

    const filteredData = {};
    fields.forEach((field) => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });

    const columns = Object.keys(filteredData).join(", ");
    const placeholders = Object.keys(filteredData).map(() => "?").join(", ");
    const values = Object.values(filteredData);

    const query = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders});`;
    await db.runAsync(query, values);
    console.log(`Inserted/Updated ${table} record:`, filteredData.id);
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
};

export const update = async (table, data, id) => {
  try {
    const fields = validFields[table];
    if (!fields) throw new Error(`Invalid table: ${table}`);

    const filteredData = {};
    fields.forEach((field) => {
      if (data[field] !== undefined && field !== 'id') {
        filteredData[field] = data[field];
      }
    });

    const setClause = Object.keys(filteredData).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(filteredData);
    values.push(id);

    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?;`;
    await db.runAsync(query, values);
    console.log(`Updated ${table} record:`, id);
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
};

export const remove = async (table, id) => {
  try {
    if (!validFields[table]) throw new Error(`Invalid table: ${table}`);
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?;`, [id]);
    console.log(`Deleted ${table} record:`, id);
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
};

export const fetchAll = async (table) => {
  try {
    if (!validFields[table]) throw new Error(`Invalid table: ${table}`);
    const query = `SELECT * FROM ${table};`;
    const results = await db.getAllAsync(query);
    console.log(`Fetched ${results.length} records from ${table}`);
    return results;
  } catch (error) {
    console.error(`Error fetching from ${table}:`, error);
    throw error;
  }
};

export const importBackup = async (backupData) => {
  try {
    console.log("Raw backup data:", backupData);
    const data =
      typeof backupData === "string" ? JSON.parse(backupData) : backupData;
    console.log("Parsed backup data:", data);

    const validTables = [
      "Docentes",
      "Materias",
      "Grupos",
      "Horarios",
      "Activities",
      "Directivos",
    ];

    if (!Object.keys(data).some((table) => validTables.includes(table))) {
      console.error("Backup file contains no valid tables");
      return false;
    }

    await db.execAsync("BEGIN TRANSACTION;");

    await db.execAsync(`
      DELETE FROM Horarios;
      DELETE FROM Activities;
      DELETE FROM Grupos;
      DELETE FROM Materias;
      DELETE FROM Docentes;
      DELETE FROM Directivos;
    `);

    for (const table of validTables) {
      if (data[table] && Array.isArray(data[table])) {
        console.log(`Importing ${table}:`, data[table]);
        for (const item of data[table]) {
          if (!item.id) {
            console.warn(`Skipping ${table} item without ID:`, item);
            continue;
          }
          if (table === "Directivos") {
            if (!item.rol) {
              item.rol = "Director";
            }
            if (item.generoFemenino === undefined) {
              item.generoFemenino = false;
            }
            if (item.puesto && !item.rol) {
              item.rol = item.puesto;
              delete item.puesto;
            }
          }
          await insert(table, item);
          console.log(`Inserted/Updated ${table} item:`, item.id);
        }
      } else {
        console.log(`No data for ${table}`);
      }
    }

    await db.execAsync("COMMIT;");
    console.log("Backup imported successfully");
    await db.runAsync(`UPDATE SyncInfo SET pendingChanges = TRUE;`);
    return true;
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    console.error("Error importing backup:", error);
    return false;
  }
};

export const getSyncInfo = async () => {
  try {
    const result = await db.getAllAsync(`SELECT * FROM SyncInfo LIMIT 1;`);
    return result[0] || { lastSync: null, pendingChanges: false };
  } catch (error) {
    console.error("Error al obtener información de sincronización:", error);
    throw error;
  }
};

const checkInternetConnection = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected && netInfo.isInternetReachable;
};

export const backupToSupabase = async () => {
  try {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      return { success: false, message: "No hay conexión a Internet" };
    }

    const backupData = await exportBackup();
    if (!backupData) {
      return { success: false, message: "Error al exportar datos locales" };
    }

    console.log("Backup data to save:", backupData);

    const { data: existingBackup, error: fetchError } = await supabase
      .from('backups')
      .select('id')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Fetch backup error:", fetchError);
      throw fetchError;
    }

    let result;
    if (existingBackup) {
      console.log("Updating backup with ID:", existingBackup.id);
      result = await supabase
        .from('backups')
        .update({
          data: backupData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBackup.id);
    } else {
      console.log("Inserting new backup");
      result = await supabase
        .from('backups')
        .insert({
          data: backupData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    if (result.error) {
      console.error("Supabase save error:", result.error);
      throw result.error;
    }

    console.log("Backup saved successfully");
    await db.runAsync(`UPDATE SyncInfo SET lastSync = ?, pendingChanges = FALSE;`, [
      new Date().toISOString(),
    ]);

    return { success: true, message: "Copia de seguridad guardada con éxito" };
  } catch (error) {
    console.error("Error al guardar copia en Supabase:", error);
    return { success: false, message: error.message || "Error al guardar copia en Supabase" };
  }
};

export const restoreFromSupabase = async () => {
  try {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      return { success: false, message: "No hay conexión a Internet" };
    }

    const { data: backupData, error } = await supabase
      .from('backups')
      .select('data')
      .single();

    console.log("Fetched backup data:", backupData);

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, message: "No se encontró copia de seguridad" };
      }
      console.error("Fetch backup error:", error);
      throw error;
    }

    if (!backupData || !backupData.data) {
      console.error("No valid backup data found");
      return { success: false, message: "Datos de backup vacíos o inválidos" };
    }

    const importResult = await importBackup(backupData.data);
    if (!importResult) {
      console.error("Import backup failed");
      return { success: false, message: "Error al restaurar la copia de seguridad" };
    }

    await db.runAsync(`UPDATE SyncInfo SET lastSync = ?, pendingChanges = FALSE;`, [
      new Date().toISOString(),
    ]);

    return { success: true, message: "Copia de seguridad restaurada con éxito" };
  } catch (error) {
    console.error("Error al restaurar copia desde Supabase:", error);
    return { success: false, message: error.message || "Error al restaurar copia de seguridad" };
  }
};