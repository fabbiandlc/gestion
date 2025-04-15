import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDataContext } from "./DataContext";
import DocenteForm from "./DocenteForm";
import MateriaForm from "./MateriaForm";
import GrupoForm from "./GrupoForm";

const AdministracionScreen = ({ navigation }) => {
  const [activeSection, setActiveSection] = useState("docentes");
  const { docentes, setDocentes, materias, setMaterias, grupos, setGrupos } =
    useDataContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");

  const getActiveData = useCallback(() => {
    switch (activeSection) {
      case "docentes":
        return docentes;
      case "materias":
        return materias;
      case "grupos":
        return grupos;
      default:
        return [];
    }
  }, [activeSection, docentes, materias, grupos]);

  const getActiveSetter = useCallback(() => {
    switch (activeSection) {
      case "docentes":
        return setDocentes;
      case "materias":
        return setMaterias;
      case "grupos":
        return setGrupos;
      default:
        return () => {};
    }
  }, [activeSection, setDocentes, setMaterias, setGrupos]);

  const filteredItems = useMemo(() => {
    let result = [...getActiveData()];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        switch (activeSection) {
          case "docentes":
            return (
              item.nombre.toLowerCase().includes(query) ||
              item.apellido.toLowerCase().includes(query)
            );
          case "materias":
            return item.nombre.toLowerCase().includes(query);
          case "grupos":
            return item.nombre.toLowerCase().includes(query);
          default:
            return false;
        }
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "nombre":
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case "apellido":
          comparison =
            activeSection === "docentes"
              ? a.apellido.localeCompare(b.apellido)
              : 0;
          break;
        case "grado":
          comparison = activeSection === "grupos" ? a.grado - b.grado : 0;
          break;
        case "fecha":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [getActiveData, activeSection, searchQuery, sortBy, sortOrder]);

  const handleEdit = useCallback(
    (index) => {
      const data = getActiveData();
      const itemIndex = data.findIndex(
        (item) => item.id === filteredItems[index].id
      );
      setEditIndex(itemIndex);
      setModalVisible(true);
    },
    [getActiveData, filteredItems]
  );

  const handleDelete = useCallback(
    (index) => {
      const messageMap = {
        docentes: "docente",
        materias: "materia",
        grupos: "grupo",
      };

      Alert.alert(
        `Eliminar ${messageMap[activeSection]}`,
        `¿Estás seguro de que deseas eliminar este ${messageMap[activeSection]}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            onPress: () => {
              const itemToDelete = filteredItems[index];
              const currentData = getActiveData();
              const updatedData = currentData.filter(
                (item) => item.id !== itemToDelete.id
              );
              getActiveSetter()(updatedData);
            },
          },
        ]
      );
    },
    [activeSection, filteredItems, getActiveData, getActiveSetter]
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const renderItem = ({ item, index }) => {
    switch (activeSection) {
      case "docentes":
        return renderDocenteItem({ item, index });
      case "materias":
        return renderMateriaItem({ item, index });
      case "grupos":
        return renderGrupoItem({ item, index });
      default:
        return null;
    }
  };

  const renderDocenteItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.nombre} {item.apellido}
        </Text>
        <Text style={styles.cardDate}>{item.email || "Sin email registrado"}</Text>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Ionicons name="book-outline" size={16} color="#007BFF" />
          <Text style={styles.statText}>
            Materias: {item.materias?.length || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#007BFF" />
          <Text style={styles.statText}>
            Grupos: {item.grupos?.length || 0}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(index)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(index)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMateriaItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(index)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(index)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGrupoItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardDate}>Turno: {item.turno}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(index)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(index)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getFormComponent = () => {
    switch (activeSection) {
      case "docentes":
        return (
          <DocenteForm
            setModalVisible={setModalVisible}
            editIndex={editIndex}
            setEditIndex={setEditIndex}
            docentes={docentes}
            setDocentes={setDocentes}
          />
        );
      case "materias":
        return (
          <MateriaForm
            setModalVisible={setModalVisible}
            editIndex={editIndex}
            setEditIndex={setEditIndex}
            materias={materias}
            setMaterias={setMaterias}
          />
        );
      case "grupos":
        return (
          <GrupoForm
            setModalVisible={setModalVisible}
            editIndex={editIndex}
            setEditIndex={setEditIndex}
            grupos={grupos}
            setGrupos={setGrupos}
            docentes={docentes}
            materias={materias}
          />
        );
      default:
        return null;
    }
  };

  const getSortOptions = () => {
    switch (activeSection) {
      case "docentes":
        return [
          { key: "nombre", label: "Nombre" },
          { key: "fecha", label: "Creación" },
        ];
      case "materias":
        return [{ key: "nombre", label: "Nombre" }];
      case "grupos":
        return [
          { key: "nombre", label: "Nombre" },
          { key: "turno", label: "Turno" },
        ];
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    const entityMap = {
      docentes: "docentes",
      materias: "materias",
      grupos: "grupos",
    };
    return searchQuery
      ? "Intenta con otra búsqueda"
      : `Presiona el botón + para crear ${entityMap[activeSection]}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === "docentes" && styles.activeTab]}
          onPress={() => {
            setActiveSection("docentes");
            setSearchQuery("");
            setSortBy("nombre");
          }}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={activeSection === "docentes" ? "#007BFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeSection === "docentes" && styles.activeTabText,
            ]}
          >
            Docentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === "materias" && styles.activeTab]}
          onPress={() => {
            setActiveSection("materias");
            setSearchQuery("");
            setSortBy("nombre");
          }}
        >
          <Ionicons
            name="book-outline"
            size={20}
            color={activeSection === "materias" ? "#007BFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeSection === "materias" && styles.activeTabText,
            ]}
          >
            Materias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === "grupos" && styles.activeTab]}
          onPress={() => {
            setActiveSection("grupos");
            setSearchQuery("");
            setSortBy("nombre");
          }}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeSection === "grupos" ? "#007BFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeSection === "grupos" && styles.activeTabText,
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
          placeholder={`Buscar ${activeSection}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <View style={styles.sortButtons}>
          {getSortOptions().map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.activeSortButton,
              ]}
              onPress={() => setSortBy(option.key)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option.key && styles.activeSortButtonText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.sortDirectionButton}
            onPress={toggleSortOrder}
          >
            <Ionicons
              name={
                sortOrder === "asc" ? "arrow-up-outline" : "arrow-down-outline"
              }
              size={18}
              color="#007BFF"
            />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                activeSection === "docentes"
                  ? "person-outline"
                  : activeSection === "materias"
                  ? "book-outline"
                  : "people-outline"
              }
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>No hay {activeSection}</Text>
            <Text style={styles.emptySubText}>{getEmptyMessage()}</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditIndex(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditIndex(null);
        }}
      >
        {getFormComponent()}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#007BFF",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 10,
  },
  sortButtons: {
    justifyContent: "flex-end",
    flexDirection: "row",
    flex: 1,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#eee",
  },
  activeSortButton: {
    backgroundColor: "#e6f2ff",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeSortButtonText: {
    color: "#007BFF",
    fontWeight: "500",
  },
  sortDirectionButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  cardDate: {
    fontSize: 14,
    color: "#666",
  },
  cardStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#007BFF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default AdministracionScreen;