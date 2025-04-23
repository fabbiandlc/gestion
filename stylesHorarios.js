export const stylesHorarios = {
  container: {
    flex: 1,
    backgroundColor: "#121212", // Tema oscuro - fondo principal
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#252525",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    shadowColor: "#444", // Igual que AdministracionScreen
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
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
    backgroundColor: "#1E3A5F", // Igual que AdministracionScreen
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#AAAAAA",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#FFFFFF", // Igual que AdministracionScreen
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252525",
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    color: "#AAAAAA", // Color consistente para el icono de búsqueda
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: "#AAAAAA", // Color del texto de entrada
    placeholderTextColor: "#AAAAAA", // Color del placeholder
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#333333",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewButton: {
    backgroundColor: "#888888", // Gris igual que deleteButton de AdministracionScreen
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF", // Texto blanco
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#AAAAAA",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888888",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#252525",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#AAAAAA",
    marginBottom: 4,
  },
  formInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: "#AAAAAA", // Igual que searchInput
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#1E1E1E",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#1E1E1E", // Fondo consistente para los pickers
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
    backgroundColor: "#1E1E1E", // Fondo consistente para los pickers
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeField: {
    width: "48%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#888888", // Gris igual que deleteButton de AdministracionScreen
  },
  saveButtonText: {
    color: "#FFFFFF", // Texto blanco
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#888888", // Gris igual que deleteButton de AdministracionScreen
  },
  cancelButtonText: {
    color: "#FFFFFF", // Texto blanco
    fontWeight: "600",
    fontSize: 16,
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: "#121212", // Fondo consistente
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#252525",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginLeft: 10,
    color: "#FFFFFF",
  },
  addButton: {
    padding: 5,
  },
  scheduleScrollContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Un poco más claro que el fondo principal para contraste
  },
  scheduleTable: {
    margin: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  timeCell: {
    width: 80,
    height: 60,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderWidth: 0.5,
    borderColor: "#333333",
  },
  timeCellText: {
    fontSize: 12,
    color: "#AAAAAA",
    textAlign: "center",
  },
  dayHeaderCell: {
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A2A2A", // Más oscuro para el encabezado
    borderWidth: 0.5,
    borderColor: "#333333",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2", // Azul de acento para el texto del encabezado
  },
  tableCell: {
    width: 120,
    height: 50, // Altura fija más compacta
    padding: 2,
    borderWidth: 0.5,
    borderColor: "#333333",
    overflow: "hidden",
    backgroundColor: "#1A1A1A", // Fondo consistente para las celdas
  },
  emptyCell: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Fondo consistente para las celdas vacías
  },
  recesoCell: {
    flex: 1,
    backgroundColor: "#2C2C2C", // Ligeramente más claro para distinguir el receso
    justifyContent: "center",
    alignItems: "center",
  },
  recesoText: {
    fontSize: 12,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  classCell: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#444444", // Borde más visible para las clases
  },
  classCellTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000", // Negro para contrastar con los fondos de color de la celda
    textAlign: "center",
  },
  classCellSubtitle: {
    fontSize: 10,
    color: "#333333", // Oscuro para contrastar con los fondos de color de la celda
  },
  classCellTime: {
    fontSize: 9,
    color: "#333333", // Oscuro para contrastar con los fondos de color de la celda
    marginTop: 2,
  },
  legendScrollContainer: {
    maxHeight: 200,
    backgroundColor: "#252525",
  },
  legendContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333333",
    backgroundColor: "#252525",
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  legendText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  legendSubtext: {
    fontSize: 12,
    color: "#AAAAAA",
  },
  legendActions: {
    flexDirection: "row",
  },
  legendButton: {
    padding: 5,
    marginLeft: 5,
    backgroundColor: "#888888", // Fondo gris igual que deleteButton
    borderRadius: 6,
  },
};