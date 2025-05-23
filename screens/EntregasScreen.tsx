import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert, 
  StatusBar,
  TextInput
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Feather } from '@expo/vector-icons';

const EntregasScreen = () => {
  const { colors, theme } = useTheme();
  const { docentes, entregas, updateEntrega, clearEntregasByDocente } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      marginBottom: 15,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      marginBottom: 15,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
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
      maxHeight: '80%',
      borderRadius: 10,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 15,
    },
    modalButton: {
      padding: 10,
      borderRadius: 5,
      flex: 1,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
