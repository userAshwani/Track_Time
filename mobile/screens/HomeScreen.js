import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchTasksByHorizon } from "../services/api";

function formatMinutes(minutes = 0) {
  const normalizedMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function TaskItem({ task }) {
  const timeAllocated = Math.max(1, Number(task.timeAllocated) || 1);
  const timeSpent = Math.max(0, Number(task.timeSpent) || 0);
  const progress = Math.min(100, Math.round((timeSpent / timeAllocated) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.status}>{String(task.status).replace("_", " ")}</Text>
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Time Utilization</Text>
        <Text style={styles.progressValue}>{progress}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatMinutes(timeSpent)} spent</Text>
        <Text style={styles.metaText}>{formatMinutes(timeAllocated)} allocated</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const dailyTasks = await fetchTasksByHorizon("1_Day");
      setTasks(dailyTasks);
    } catch (loadError) {
      setError(loadError.message || "Unable to load daily tasks.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Track Time</Text>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Daily execution horizon</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#0f2f5f" size="large" />
          <Text style={styles.centerText}>Loading daily tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadTasks({ refreshing: true })}
              tintColor="#0f2f5f"
            />
          }
          ListHeaderComponent={
            error ? <Text style={styles.errorText}>{error}</Text> : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No daily tasks assigned</Text>
                <Text style={styles.emptyText}>
                  Tasks created in the 1_Day horizon will appear here.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => <TaskItem task={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#08214a",
    borderBottomColor: "#123b73",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
    marginTop: 8,
  },
  subtitle: {
    color: "#dbeafe",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 6,
  },
  listContent: {
    gap: 12,
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  status: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
    borderWidth: 1,
    color: "#1e3a8a",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  description: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  progressLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  progressValue: {
    color: "#08214a",
    fontSize: 13,
    fontWeight: "900",
  },
  progressTrack: {
    backgroundColor: "#e2e8f0",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    height: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#0f2f5f",
    height: "100%",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  centerText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  errorText: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 14,
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 4,
  },
});
