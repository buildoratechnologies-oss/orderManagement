import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ASMLiveScreen() {
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      const mockLiveData = [
        { id: "1", displayname: "John Doe", status: "active", location: "Downtown Area", lastUpdate: "2 mins ago", currentActivity: "Client Visit", battery: 85 },
        { id: "2", displayname: "Jane Smith", status: "active", location: "Business District", lastUpdate: "5 mins ago", currentActivity: "Order Processing", battery: 92 },
        { id: "3", displayname: "Mike Johnson", status: "offline", location: "Unknown", lastUpdate: "2 hours ago", currentActivity: "Offline", battery: 15 },
        { id: "4", displayname: "Sarah Wilson", status: "active", location: "Central Plaza", lastUpdate: "1 min ago", currentActivity: "Travel", battery: 78 },
        { id: "5", displayname: "David Brown", status: "idle", location: "Industrial Zone", lastUpdate: "15 mins ago", currentActivity: "Break", battery: 65 },
      ];
      setLiveData(mockLiveData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching live data:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "#10B981";
      case "idle": return "#F59E0B";
      case "offline": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getBatteryColor = (battery) => {
    if (battery > 50) return "#10B981";
    if (battery > 20) return "#F59E0B";
    return "#EF4444";
  };

  if (loading) {
    return <View style={styles.centerContainer}><Text>Loading live data...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <TouchableOpacity onPress={fetchLiveData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Real-time team location and activities</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.statValue}>{liveData.filter(item => item.status === "active").length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
          <Text style={styles.statValue}>{liveData.filter(item => item.status === "idle").length}</Text>
          <Text style={styles.statLabel}>Idle</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#EF4444" }]}>
          <Text style={styles.statValue}>{liveData.filter(item => item.status === "offline").length}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      <FlatList
        data={liveData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.liveCard}>
            <View style={styles.cardHeader}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.displayname}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.batteryContainer}>
                <Ionicons name="battery-half" size={16} color={getBatteryColor(item.battery)} />
                <Text style={[styles.batteryText, { color: getBatteryColor(item.battery) }]}>{item.battery}%</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{item.currentActivity}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>Last update: {item.lastUpdate}</Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchLiveData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  refreshButton: { padding: 8, borderRadius: 20, backgroundColor: "white", elevation: 2 },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 16, marginHorizontal: 4, borderLeftWidth: 4, elevation: 3, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6B7280" },
  listContainer: { paddingHorizontal: 20 },
  liveCard: { backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  batteryContainer: { flexDirection: "row", alignItems: "center" },
  batteryText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },
  cardContent: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { fontSize: 14, color: "#6B7280", marginLeft: 8 },
});