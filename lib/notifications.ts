import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Configuración de notificaciones
export const configureNotifications = async () => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permiso de notificaciones no concedido");
      return;
    }

    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.error("Error al configurar notificaciones:", error);
  }
};

// Función para enviar notificación local
export const sendLocalNotification = async (title: string, body: string) => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error al enviar notificación:", error);
  }
};

// Función para programar una notificación
export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
) => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger,
    });
  } catch (error) {
    console.error("Error al programar notificación:", error);
  }
};
