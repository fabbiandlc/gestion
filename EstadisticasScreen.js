import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { fetchAll } from "./Database";
import { backupToSupabase } from "./Database";

export default function EstadisticasScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [error, setError] = useState(null);

  // State for statistics data
  const [stats, setStats] = useState({
    docentes: 0,
    materias: 0,
    grupos: 0,
    activities: 0,
    horariosDocentes: 0,
    horariosGrupales: 0
  });

  // State to store entity data for printing
  const [entities, setEntities] = useState({
    docentes: [],
    materias: [],
    grupos: []
  });

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all tables we need for statistics and entity lists
      const docentes = await fetchAll("Docentes");
      const materias = await fetchAll("Materias");
      const grupos = await fetchAll("Grupos");
      const activities = await fetchAll("Activities");
      const horarios = await fetchAll("Horarios");

      // Estadística: contar docentes y grupos con al menos un horario asignado
      const docentesConHorario = docentes.filter(docente =>
        horarios.some(h => h.docenteId === docente.id)
      );
      const gruposConHorario = grupos.filter(grupo =>
        horarios.some(h => h.salonId === grupo.id)
      );

      setStats({
        docentes: docentes.length,
        materias: materias.length,
        grupos: grupos.length,
        activities: activities.length,
        horariosDocentes: docentesConHorario.length,
        horariosGrupales: gruposConHorario.length
      });

      // Store entity data for printing
      setEntities({
        docentes,
        materias,
        grupos
      });

    } catch (err) {
      console.error("Error loading statistics data:", err);
      setError("Error al cargar los datos. Verifica tu conexión o la base de datos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Estadísticas - Gestión Docente</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 20px; 
                margin: 20px 0; 
              }
              .stat-item { 
                background: #f5f5f5; 
                padding: 15px; 
                border-radius: 8px; 
              }
              .stat-label { color: #666; font-size: 14px; }
              .stat-value { 
                color: #007bff; 
                font-size: 24px; 
                font-weight: bold; 
                margin-top: 5px; 
              }
            </style>
          </head>
          <body>
            <h1>Reporte de Estadísticas</h1>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Docentes</div>
                <div class="stat-value">${stats.docentes}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Materias</div>
                <div class="stat-value">${stats.materias}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Grupos</div>
                <div class="stat-value">${stats.grupos}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Actividades</div>
                <div class="stat-value">${stats.activities}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Horarios Docentes</div>
                <div class="stat-value">${stats.horariosDocentes}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Horarios Grupales</div>
                <div class="stat-value">${stats.horariosGrupales}</div>
              </div>
            </div>
          </body>
        </html>
      `;
      await Print.printAsync({ html, jobName: 'Estadisticas_Gestion' });
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar a PDF. Inténtalo de nuevo.");
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEntityPDF = async (entityType) => {
    setIsExporting(true);
    try {
      let title, headers, rows;
      const data = entities[entityType];

      switch (entityType) {
        case "docentes":
          title = "Lista de Docentes";
          headers = ["Nombre Completo", "Número de Empleado"];
          rows = data.map(d => `
            <tr>
              <td>${(d.nombre || '') + ' ' + (d.apellido || '')}</td>
              <td>${d.numeroEmpleado || '-'}</td>
            </tr>
          `).join('');
          break;
        case "materias":
          title = "Lista de Materias";
          headers = ["Nombre"];
          rows = data.map(m => `
            <tr>
              <td>${m.nombre || '-'}</td>
            </tr>
          `).join('');
          break;
        case "grupos":
          title = "Lista de Grupos";
          headers = ["Nombre"];
          rows = data.map(g => `
            <tr>
              <td>${g.nombre || '-'}</td>
            </tr>
          `).join('');
          break;
        default:
          throw new Error("Invalid entity type");
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold; 
              }
              tr:nth-child(even) { 
                background-color: #f9f9f9; 
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="' + headers.length + '">No hay datos disponibles</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `;
      await Print.printAsync({ html, jobName: `${title.replace(/\s/g, '_')}` });
    } catch (error) {
      Alert.alert("Error", `No se pudo exportar la lista de ${entityType}. Inténtalo de nuevo.`);
      console.error(`Error exporting ${entityType} PDF:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await backupToSupabase();
      Alert.alert("Éxito", "Copia de seguridad guardada correctamente.");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la copia de seguridad. Inténtalo de nuevo.");
      console.error("Error during backup:", error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
      padding: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 10,
    },
    buttonContainerCentered: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      gap: 10,
    },
    button: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 100,
      alignItems: "center",
      flexDirection: "row",
    },
    exportButton: {
      backgroundColor: "#888888",
    },
    refreshButton: {
      backgroundColor: "#888888",
    },
    entityButton: {
      backgroundColor: "#888888",
    },
    backupButton: {
      backgroundColor: "#888888",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500",
    },
    errorductContainer: {
      padding: 20,
      backgroundColor: "#dc3545",
      borderRadius: 8,
      marginBottom: 20,
    },
    errorText: {
      color: "#fff",
      fontSize: 16,
      textAlign: "center",
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    statItem: {
      backgroundColor: "#1e1e1e",
      borderRadius: 8,
      padding: 15,
      marginBottom: 10,
      width: "48%",
    },
    statLabel: {
      color: "#6c757d",
      fontSize: 14,
      marginBottom: 5,
    },
    statValue: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Docentes</Text>
              <Text style={styles.statValue}>{stats.docentes}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Materias</Text>
              <Text style={styles.statValue}>{stats.materias}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Grupos</Text>
              <Text style={styles.statValue}>{stats.grupos}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Actividades</Text>
              <Text style={styles.statValue}>{stats.activities}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Horarios Docentes</Text>
              <Text style={styles.statValue}>{stats.horariosDocentes}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Horarios Grupales</Text>
              <Text style={styles.statValue}>{stats.horariosGrupales}</Text>
            </View>
          </View>
          <View style={styles.buttonContainerCentered}>
            <TouchableOpacity 
              style={[styles.button, styles.exportButton]} 
              onPress={handleExportPDF}
              disabled={isExporting}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isExporting ? "Exportando..." : "Exportar PDF"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.entityButton]} 
              onPress={() => handleExportEntityPDF("docentes")}
              disabled={isExporting}
            >
              <Ionicons name="print-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isExporting ? "Exportando..." : "Imprimir Docentes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.entityButton]} 
              onPress={() => handleExportEntityPDF("materias")}
              disabled={isExporting}
            >
              <Ionicons name="print-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isExporting ? "Exportando..." : "Imprimir Materias"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.entityButton]} 
              onPress={() => handleExportEntityPDF("grupos")}
              disabled={isExporting}
            >
              <Ionicons name="print-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isExporting ? "Exportando..." : "Imprimir Grupos"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.backupButton]} 
              onPress={handleBackup}
              disabled={isBackingUp}
            >
              <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isBackingUp ? "Guardando..." : "Guardar Copia de Seguridad"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.refreshButton]} 
              onPress={loadData}
              disabled={isLoading}
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>
                {isLoading ? "Cargando..." : "Actualizar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}