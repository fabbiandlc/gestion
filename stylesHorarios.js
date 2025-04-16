export const stylesHorarios = {
  container: {
    flex: 1,
    backgroundColor: "#121212", // Matches COLORS.background
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#252525", // Matches COLORS.surface
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333333", // Matches COLORS.border
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
    backgroundColor: "#1E1E1E", // Matches COLORS.inputBg for a subtle highlight
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#AAAAAA", // Matches COLORS.textSecondary
    marginLeft: 6,
  },
  activeTabText: {
    color: "#4A90E2", // Matches COLORS.primary
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252525", // Matches COLORS.surface
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
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: "#FFFFFF", // Matches COLORS.text
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: "#252525", // Matches COLORS.surface
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1, // Added to match DocenteForm
    borderColor: "#333333", // Matches COLORS.border
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF", // Matches COLORS.text
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#AAAAAA", // Matches COLORS.textSecondary
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewButton: {
    backgroundColor: "#4A90E2", // Matches COLORS.primary
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF", // Matches COLORS.white
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
    color: "#AAAAAA", // Matches COLORS.textSecondary
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888888", // Matches COLORS.gray
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
    backgroundColor: "#4A90E2", // Matches COLORS.primary
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
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Matches COLORS.modalOverlay
  },
  modalContent: {
    backgroundColor: "#252525", // Matches COLORS.surface
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1, // Added to match DocenteForm
    borderColor: "#333333", // Matches COLORS.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#FFFFFF", // Matches COLORS.text
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#AAAAAA", // Matches COLORS.textSecondary
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#333333", // Matches COLORS.border
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#1E1E1E", // Matches COLORS.inputBg
    color: "#FFFFFF", // Matches COLORS.text
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#333333", // Matches COLORS.border
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF", // Matches COLORS.text
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
    backgroundColor: "#4A90E2", // Matches COLORS.primary
  },
  saveButtonText: {
    color: "#FFFFFF", // Matches COLORS.white
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#333333", // Matches COLORS.border (consistent with DocenteForm)
  },
  cancelButtonText: {
    color: "#AAAAAA", // Matches COLORS.textSecondary
    fontWeight: "600",
    fontSize: 16,
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#252525", // Matches COLORS.surface
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
    color: "#FFFFFF", // Matches COLORS.text
  },
  addButton: {
    padding: 5,
  },
  scheduleScrollContainer: {
    flex: 1,
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
    backgroundColor: "#1E1E1E", // Matches COLORS.inputBg
    borderWidth: 0.5,
    borderColor: "#333333", // Matches COLORS.border
  },
  timeCellText: {
    fontSize: 12,
    color: "#AAAAAA", // Matches COLORS.textSecondary
    textAlign: "center",
  },
  dayHeaderCell: {
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A90E2", // Matches COLORS.primary
    borderWidth: 0.5,
    borderColor: "#333333", // Matches COLORS.border
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF", // Matches COLORS.white
  },
  tableCell: {
    width: 120,
    height: 60,
    padding: 2,
    borderWidth: 0.5,
    borderColor: "#333333", // Matches COLORS.border
    overflow: "hidden",
  },
  emptyCell: {
    flex: 1,
    backgroundColor: "#252525", // Matches COLORS.surface
  },
  recesoCell: {
    flex: 1,
    backgroundColor: "#333333", // Matches COLORS.border for a subtle contrast
    justifyContent: "center",
    alignItems: "center",
  },
  recesoText: {
    fontSize: 12,
    color: "#AAAAAA", // Matches COLORS.textSecondary
    fontWeight: "500",
  },
  classCell: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
    justifyContent: "center",
    borderColor: "#333333", // Matches COLORS.border
    backgroundColor: "#1E1E1E", // Matches COLORS.inputBg for consistency
  },
  classCellTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2", // Matches COLORS.primary
  },
  classCellSubtitle: {
    fontSize: 10,
    color: "#AAAAAA", // Matches COLORS.textSecondary
  },
  classCellTime: {
    fontSize: 9,
    color: "#AAAAAA", // Matches COLORS.textSecondary
    marginTop: 2,
  },
  legendScrollContainer: {
    maxHeight: 200,
    backgroundColor: "#252525", // Matches COLORS.surface
  },
  legendContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333333", // Matches COLORS.border
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#FFFFFF", // Matches COLORS.text
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333", // Matches COLORS.border
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendInfo: {
    flex: 1,
  },
  legendText: {
    fontSize: 14,
    color: "#FFFFFF", // Matches COLORS.text
  },
  legendSubtext: {
    fontSize: 12,
    color: "#AAAAAA", // Matches COLORS.textSecondary
  },
  legendActions: {
    flexDirection: "row",
  },
  legendButton: {
    padding: 5,
    marginLeft: 5,
  },
};