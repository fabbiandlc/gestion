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

export default function EstadisticasScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null); // Reset error state on retry/refresh
    try {
      // Fetch all tables we need for statistics
      const docentes = await fetchAll("Docentes");
      const materias = await fetchAll("Materias");
      const grupos = await fetchAll("Grupos");
      const activities = await fetchAll("Activities");
      const horarios = await fetchAll("Horarios");

      // Estadística: contar docentes y grupos con al menos un horario asignado (como las cards en HorariosScreen)
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
      // Use actual stats from state
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
      // Consider adding a specific filename
      await Print.printAsync({ html, jobName: 'Estadisticas_Gestion' });
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar a PDF. Inténtalo de nuevo.");
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
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
      backgroundColor: "#888888", // Gris igual que deleteButton de AdministracionScreen
    },
    refreshButton: {
      backgroundColor: "#888888", // Gris igual que deleteButton de AdministracionScreen
    },
    buttonText: {
      color: "#FFFFFF", // Texto blanco
      fontSize: 14,
      fontWeight: "500",
    },
    errorContainer: {
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