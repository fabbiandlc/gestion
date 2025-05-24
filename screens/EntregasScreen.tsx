import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert, 
  StatusBar,
  TextInput,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Feather } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const EntregasScreen = () => {
  const { colors, theme } = useTheme();
  const { docentes, entregas, updateEntrega, clearEntregasByDocente } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const printRef = useRef<View>(null);

  // Filter docentes based on search query
  const filteredDocentes = docentes.filter(docente => 
    `${docente.nombre} ${docente.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    docente.numeroEmpleado.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (docenteId: string) => {
    setSelectedDocente(docenteId);
    setModalVisible(true);
  };

  const handleVaciar = (docenteId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas vaciar todas las entregas de este docente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await clearEntregasByDocente(docenteId);
              if (result.success) {
                Alert.alert('Éxito', 'Se han eliminado todas las entregas del docente');
              } else {
                Alert.alert('Error', result.error || 'Error al vaciar entregas');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al vaciar entregas');
            }
          },
        },
      ]
    );
  };

  const handleToggleEntrega = async (
    docenteId: string,
    materiaId: string,
    tipo: 'planeacion' | 'calificacion',
    parcial: 'primer' | 'segundo' | 'tercer'
  ) => {
    try {
      const entrega = entregas.find(
        (e) => e.docenteId === docenteId && 
               e.materiaId === materiaId && 
               e.tipo === tipo && 
               e.parcial === parcial
      );
      const entregado = entrega ? !entrega.entregado : true;
      const result = await updateEntrega(docenteId, materiaId, tipo, parcial, entregado);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Error al actualizar entrega');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar entrega');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (printRef.current) {
        const uri = await captureRef(printRef, {
          format: 'jpg',
          quality: 0.8,
        });
        
        const currentDate = new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reporte de Entregas</title>
              <style>
                @page {
                  size: portrait;
                  margin: 10mm;
                }
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0 5px;
                  color: #333;
                  line-height: 1.4;
                  zoom: 0.85; /* Escala el contenido para que quepa mejor */
                }
                .header {
                  text-align: center;
                  margin-bottom: 10px;
                  padding-bottom: 5px;
                  border-bottom: 2px solid #e0e0e0;
                }
                .school-info {
                  text-align: center;
                  margin-bottom: 5px;
                }
                .school-name {
                  font-size: 14px;
                  font-weight: bold;
                  margin: 3px 0;
                  color: #1a365d;
                }
                .school-details {
                  font-size: 11px;
                  color: #4a5568;
                  margin: 1px 0;
                }
                .report-title {
                  font-size: 16px;
                  font-weight: bold;
                  color: #2d3748;
                  margin: 5px 0 3px;
                }
                .report-subtitle {
                  font-size: 13px;
                  color: #4a5568;
                  margin-bottom: 3px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 0 auto;
                  font-size: 9px;
                  page-break-inside: auto;
                }
                th {
                  background-color: #2c5282;
                  color: white;
                  padding: 6px 3px;
                  text-align: center;
                  font-weight: 600;
                  border: 1px solid #e2e8f0;
                  font-size: 8px;
                }
                td {
                  padding: 4px 2px;
                  border: 1px solid #e2e8f0;
                  text-align: center;
                  vertical-align: middle;
                  font-size: 9px;
                }
                .teacher-name {
                  font-weight: 500;
                  text-align: left;
                  padding-left: 8px;
                  background-color: #f0f4f8;
                }
                .subject-name {
                  text-align: left;
                  padding-left: 12px;
                }
                .parcial-header {
                  background-color: #2c5282;
                  color: white;
                  font-weight: 600;
                }
                .parcial-cell {
                  min-width: 80px;
                }
                .status-icon {
                  display: inline-block;
                  padding: 3px 6px;
                  border-radius: 3px;
                  font-weight: 500;
                  font-size: 11px;
                }
                .status-yes {
                  background-color: #e6fffa;
                  color: #2c7a7b;
                }
                .status-no {
                  background-color: #fff5f5;
                  color: #c53030;
                }
                .footer {
                  margin-top: 15px;
                  text-align: right;
                  font-size: 10px;
                  color: #718096;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 8px;
                }
                tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                tr:hover {
                  background-color: #f1f5f9;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="school-info">
                  <p class="school-name">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
                  <p class="school-details">ORGANISMO PUBLICO DESCENTRALIZADO</p>
                  <p class="school-details">PLANTEL 18 - COATZACOALCOS</p>
                </div>
                <h1 class="report-title">Control de Entregas</h1>
                <p class="report-subtitle">Resumen de Parciales - ${currentDate}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 20%;">Docente</th>
                    <th rowspan="2" style="width: 30%;">Materia</th>
                    <th colspan="2" class="parcial-header">1er Parcial</th>
                    <th colspan="2" class="parcial-header">2do Parcial</th>
                    <th colspan="2" class="parcial-header">3er Parcial</th>
                  </tr>
                  <tr>
                    <th>Planeación</th>
                    <th>Calificaciones</th>
                    <th>Planeación</th>
                    <th>Calificaciones</th>
                    <th>Planeación</th>
                    <th>Calificaciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${docentes.map((docente, docenteIndex) => 
                    docente.materias.map((materia, materiaIndex) => {
                      const getStatus = (parcial: string, tipo: string) => {
                        const entrega = entregas.find(e => 
                          e.docenteId === docente.id && 
                          e.materiaId === materia.id && 
                          e.tipo === tipo && 
                          e.parcial === parcial
                        );
                        return {
                          entregado: entrega?.entregado || false,
                        };
                      };
                      
                      const renderStatusCell = (parcial: string, tipo: string) => {
                        const { entregado } = getStatus(parcial, tipo);
                        const displayText = entregado ? '✓' : '✗';
                        const statusClass = entregado ? 'status-yes' : 'status-no';
                        
                        return `
                          <td class="parcial-cell">
                            <span class="status-icon ${statusClass}">
                              ${displayText}
                            </span>
                          </td>
                        `;
                      };
                      
                      return `
                        <tr>
                          ${materiaIndex === 0 ? 
                            `<td rowspan="${docente.materias.length}" class="teacher-name">
                              ${docente.nombre} ${docente.apellido}
                            </td>` : ''
                          }
                          <td class="subject-name">${materia.nombre}</td>
                          ${['planeacion', 'calificacion'].map(tipo => 
                            renderStatusCell('primer', tipo)
                          ).join('')}
                          ${['planeacion', 'calificacion'].map(tipo => 
                            renderStatusCell('segundo', tipo)
                          ).join('')}
                          ${['planeacion', 'calificacion'].map(tipo => 
                            renderStatusCell('tercer', tipo)
                          ).join('')}
                        </tr>
                      `;
                    }).join('')
                  ).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                Generado el ${currentDate} - Sistema de Gestión Escolar
              </div>
            </body>
          </html>
        `;

        const { uri: pdfUri } = await Print.printToFileAsync({
          html,
          width: 595,  // Ancho de A4 en puntos (21cm)
          height: 842, // Alto de A4 en puntos (29.7cm)
          orientation: 'portrait',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir Reporte',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Éxito', 'El reporte se ha generado correctamente');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Ocurrió un error al generar el reporte');
    }
  };

  const getParcialName = (parcial: string) => {
    switch (parcial) {
      case 'primer': return 'Primer';
      case 'segundo': return 'Segundo';
      case 'tercer': return 'Tercer';
      default: return '';
    }
  };

  const renderTable = (tipo: 'planeacion' | 'calificacion') => {
    const docente = docentes.find((d) => d.id === selectedDocente);
    if (!docente) return null;

    return (
      <View style={styles.tableContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {tipo === 'planeacion' ? 'Planeaciones' : 'Calificaciones'}
        </Text>
        <View style={[styles.tableHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tableHeaderText, { color: colors.text, flex: 2, textAlign: 'left', paddingLeft: 12 }]}>
            Materia
          </Text>
          <Text style={[styles.tableHeaderText, { color: colors.text }]}>1er</Text>
          <Text style={[styles.tableHeaderText, { color: colors.text }]}>2do</Text>
          <Text style={[styles.tableHeaderText, { color: colors.text }]}>3er</Text>
        </View>
        {docente.materias.map((materia) => (
          <View
            key={`${tipo}-${materia.id}`}
            style={[styles.tableRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.tableCell, { color: colors.text, flex: 2 }]}>{materia.nombre}</Text>
            {['primer', 'segundo', 'tercer'].map((parcial) => {
              const entrega = entregas.find(
                (e) =>
                  e.docenteId === docente.id &&
                  e.materiaId === materia.id &&
                  e.tipo === tipo &&
                  e.parcial === parcial
              );
              return (
                <TouchableOpacity
                  key={`${tipo}-${materia.id}-${parcial}`}
                  style={styles.checkboxContainer}
                  onPress={() =>
                    handleToggleEntrega(docente.id, materia.id, tipo, parcial as 'primer' | 'segundo' | 'tercer')
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: entrega?.entregado ? colors.primary : 'transparent',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {entrega?.entregado && <Feather name="check" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      padding: 15,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      flexWrap: 'wrap',
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      minWidth: 200,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      minWidth: 100,
    },
    pdfButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 5,
      minWidth: 120,
      justifyContent: 'center',
    },
    pdfButtonText: {
      color: '#fff',
      marginLeft: 5,
      fontWeight: '600',
      fontSize: 14,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    docenteCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
    },
    docenteInfo: {
      flex: 1,
    },
    docenteName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    materiaItem: {
      fontSize: 13,
      marginLeft: 8,
      marginBottom: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 16,
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 10,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonText: {
      fontWeight: '600',
      fontSize: 16,
    },
    tableContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'center',
    },
    tableHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      flex: 1,
    },
    tableRow: {
      flexDirection: 'row',
      padding: 10,
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 5,
      alignItems: 'center',
    },
    tableCell: {
      fontSize: 14,
      flex: 1,
      textAlign: 'left',
    },
    checkboxContainer: {
      flex: 1,
      alignItems: 'center',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
  });

  const [selectedDocente, setSelectedDocente] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} ref={printRef}>
      <StatusBar
        backgroundColor={colors.card}
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={20} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar docente..."
              placeholderTextColor={colors.text + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleGeneratePDF}
          >
            <Feather name="file-text" size={18} color="#fff" />
            <Text style={styles.pdfButtonText}>Generar PDF</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView>
          {filteredDocentes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No se encontraron docentes' : 'No hay docentes registrados'}
              </Text>
            </View>
          ) : (
            filteredDocentes.map((docente) => (
              <View
                key={docente.id}
                style={[styles.docenteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.docenteInfo}>
                  <Text style={[styles.docenteName, { color: colors.text }]}>
                    {docente.nombre} {docente.apellido}
                  </Text>
                  {docente.materias.map((materia, index) => (
                    <Text
                      key={materia.id || index}
                      style={[styles.materiaItem, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      • {materia.nombre}
                    </Text>
                  ))}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleOpenModal(docente.id)}
                    accessibilityLabel="Registrar entregas"
                    accessibilityHint="Abre un formulario para registrar planeaciones y calificaciones"
                  >
                    <Feather name="edit-2" size={20} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error || '#e53935' }]}
                    onPress={() => handleVaciar(docente.id)}
                    accessibilityLabel="Vaciar entregas"
                    accessibilityHint="Elimina todas las entregas registradas para este docente"
                  >
                    <Feather name="trash-2" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Entregas de {docentes.find((d) => d.id === selectedDocente)?.nombre || ''}
            </Text>
            <ScrollView style={{ maxHeight: '80%' }}>
              {renderTable('planeacion')}
              {renderTable('calificacion')}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EntregasScreen;
