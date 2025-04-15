import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { insert, update, fetchAll, remove } from "./Database";

const ActivitiesContext = createContext();

function ActivitiesProvider({ children }) {
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const dbActivities = await fetchAll("Activities");
        console.log("Activities loaded from DB:", dbActivities);
        setActivities(dbActivities || []);
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };
    loadActivities();
  }, []);

  const saveActivitiesToDb = useCallback(async (updatedActivities) => {
    try {
      const currentDbActivities = await fetchAll("Activities");
      console.log("Current DB activities:", currentDbActivities);
      const currentIds = currentDbActivities.map((a) => a.id);
      const newIds = updatedActivities.map((a) => a.id);

      for (const activity of updatedActivities) {
        console.log("Processing activity:", activity);
        if (currentIds.includes(activity.id)) {
          console.log("Updating activity:", activity);
          await update("Activities", activity, activity.id);
        } else {
          console.log("Inserting new activity:", activity);
          await insert("Activities", activity);
        }
      }

      const itemsToDelete = currentDbActivities.filter(
        (a) => !newIds.includes(a.id)
      );
      for (const item of itemsToDelete) {
        console.log("Removing activity:", item);
        await remove("Activities", item.id);
      }
      console.log("Activities saved to DB successfully");
    } catch (error) {
      console.error("Error saving activities to database:", error);
    }
  }, []);

  const handleSetActivities = useCallback(
    (newActivities) => {
      if (typeof newActivities === "function") {
        setActivities((currentActivities) => {
          const updatedActivities = newActivities(currentActivities);
          console.log("Updated activities (function):", updatedActivities);
          saveActivitiesToDb(updatedActivities);
          return updatedActivities;
        });
      } else if (Array.isArray(newActivities)) {
        console.log("Setting activities directly:", newActivities);
        setActivities(newActivities);
        saveActivitiesToDb(newActivities);
      }
    },
    [saveActivitiesToDb]
  );

  const activitiesForDay = useMemo(() => {
    if (!selectedDate) return [];
    return activities.filter((activity) => {
      const activityDate = new Date(activity.activityDate);
      const year = activityDate.getFullYear();
      const month = String(activityDate.getMonth() + 1).padStart(2, "0");
      const day = String(activityDate.getDate()).padStart(2, "0");
      const normalizedDate = `${year}-${month}-${day}`;
      return normalizedDate === selectedDate;
    });
  }, [activities, selectedDate]);

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        setActivities: handleSetActivities,
        selectedDate,
        setSelectedDate,
        activitiesForDay,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  );
}

export { ActivitiesContext, ActivitiesProvider };