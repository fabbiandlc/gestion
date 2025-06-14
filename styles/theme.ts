import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonSmall: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  buttonSmallText: {
    fontSize: 14,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  buttonDanger: {
    backgroundColor: "#ef4444",
  },
  buttonDangerText: {
    color: "#ffffff",
  },
  buttonSuccess: {
    backgroundColor: "#22c55e",
  },
  buttonSuccessText: {
    color: "#ffffff",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  buttonOutlineText: {
    color: "#ffffff",
  },
});
