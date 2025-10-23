import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ASMTargetsScreen() {
  const [targetsData, setTargetsData] = useState([]);
  const [selectedMember, setSelectedMember] = useState("all");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargetsData();
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    const mockMembers = [
      { userXid: "TM001", displayname: "John Doe" },
      { userXid: "TM002", displayname: "Jane Smith" },
      { userXid: "TM003", displayname: "Mike Johnson" },
      { userXid: "TM004", displayname: "Sarah Wilson" },
      { userXid: "TM005", displayname: "David Brown" },
    ];
    setTeamMembers(mockMembers);
  };

  const fetchTargetsData = async () => {
    try {
      const mockTargetsData = [
        { id: "1", userXid: "TM001", displayname: "John Doe", monthlyTarget: 50000, achieved: 42500, percentage: 85, ordersTarget: 20, ordersAchieved: 17 },
        { id: "2", userXid: "TM002", displayname: "Jane Smith", monthlyTarget: 60000, achieved: 55200, percentage: 92, ordersTarget: 25, ordersAchieved: 23 },
        { id: "3", userXid: "TM003", displayname: "Mike Johnson", monthlyTarget: 40000, achieved: 18000, percentage: 45, ordersTarget: 15, ordersAchieved: 7 },
        { id: "4", userXid: "TM004", displayname: "Sarah Wilson", monthlyTarget: 70000, achieved: 77000, percentage: 110, ordersTarget: 30, ordersAchieved: 33 },
        { id: "5", userXid: "TM005", displayname: "David Brown", monthlyTarget: 45000, achieved: 30150, percentage: 67, ordersTarget: 18, ordersAchieved: 12 },
      ];
      setTargetsData(mockTargetsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching targets data:", error);
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedMember === "all") return targetsData;
    return targetsData.filter(item => item.userXid === selectedMember);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 100) return "#10B981";
    if (percentage >= 80) return "#F59E0B";
    return "#EF4444";
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 100) return "trending-up";
    if (percentage >= 80) return "trending-up";
    return "trending-down";
  };

  if (loading) {
    return <View style={styles.centerContainer}><Text>Loading targets data...</Text></View>;
  }

  const filtered = getFilteredData();
  const avgPerformance = filtered.length > 0 ? Math.round(filtered.reduce((sum, item) => sum + item.percentage, 0) / filtered.length) : 0;
  const totalTarget = filtered.reduce((sum, item) => sum + item.monthlyTarget, 0);
  const totalAchieved = filtered.reduce((sum, item) => sum + item.achieved, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Targets</Text>
        <Text style={styles.headerSubtitle}>Monitor team performance and achievements</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: "#3B82F6" }]}>
          <Text style={styles.summaryValue}>₹{(totalTarget/1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Total Target</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.summaryValue}>₹{(totalAchieved/1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Achieved</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: getPerformanceColor(avgPerformance) }]}>
          <Text style={[styles.summaryValue, { color: getPerformanceColor(avgPerformance) }]}>{avgPerformance}%</Text>
          <Text style={styles.summaryLabel}>Avg Performance</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedMember === "all" && styles.filterChipActive]}
          onPress={() => setSelectedMember("all")}
        >
          <Text style={[styles.filterChipText, selectedMember === "all" && styles.filterChipTextActive]}>All Team</Text>
        </TouchableOpacity>
        {teamMembers.map(member => (
          <TouchableOpacity
            key={member.userXid}
            style={[styles.filterChip, selectedMember === member.userXid && styles.filterChipActive]}
            onPress={() => setSelectedMember(member.userXid)}
          >
            <Text style={[styles.filterChipText, selectedMember === member.userXid && styles.filterChipTextActive]}>{member.displayname}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.targetCard}>
            <View style={styles.cardHeader}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.displayname}</Text>
                <View style={styles.performanceRow}>
                  <Ionicons name={getPerformanceIcon(item.percentage)} size={16} color={getPerformanceColor(item.percentage)} />
                  <Text style={[styles.performanceText, { color: getPerformanceColor(item.percentage) }]}>
                    {item.percentage}% Performance
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.targetSection}>
                <Text style={styles.sectionTitle}>Revenue Target</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(item.percentage, 100)}%`, backgroundColor: getPerformanceColor(item.percentage) }]} />
                  </View>
                  <Text style={styles.progressText}>{item.percentage}%</Text>
                </View>
                <View style={styles.targetDetails}>
                  <Text style={styles.targetText}>Target: ₹{item.monthlyTarget.toLocaleString()}</Text>
                  <Text style={styles.achievedText}>Achieved: ₹{item.achieved.toLocaleString()}</Text>
                </View>
              </View>
              
              <View style={styles.targetSection}>
                <Text style={styles.sectionTitle}>Orders Target</Text>
                <View style={styles.ordersRow}>
                  <View style={styles.ordersStat}>
                    <Text style={styles.ordersValue}>{item.ordersAchieved}</Text>
                    <Text style={styles.ordersLabel}>Achieved</Text>
                  </View>
                  <View style={styles.ordersStat}>
                    <Text style={styles.ordersValue}>{item.ordersTarget}</Text>
                    <Text style={styles.ordersLabel}>Target</Text>
                  </View>
                  <View style={styles.ordersStat}>
                    <Text style={[styles.ordersValue, { color: getPerformanceColor((item.ordersAchieved/item.ordersTarget)*100) }]}>
                      {Math.round((item.ordersAchieved/item.ordersTarget)*100)}%
                    </Text>
                    <Text style={styles.ordersLabel}>Rate</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No target data</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  summaryContainer: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 16, marginHorizontal: 4, borderLeftWidth: 4, elevation: 3, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: "#6B7280" },
  filtersContainer: { paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB" },
  filterChipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  filterChipText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  filterChipTextActive: { color: "white" },
  listContainer: { paddingHorizontal: 20 },
  targetCard: { backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 3 },
  cardHeader: { marginBottom: 16 },
  memberInfo: {},
  memberName: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 6 },
  performanceRow: { flexDirection: "row", alignItems: "center" },
  performanceText: { fontSize: 14, fontWeight: "600", marginLeft: 6 },
  cardContent: { gap: 16 },
  targetSection: {},
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 12 },
  progressContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  progressBar: { flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, marginRight: 12 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: "600", color: "#111827", minWidth: 40 },
  targetDetails: { flexDirection: "row", justifyContent: "space-between" },
  targetText: { fontSize: 14, color: "#6B7280" },
  achievedText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  ordersRow: { flexDirection: "row", justifyContent: "space-around" },
  ordersStat: { alignItems: "center" },
  ordersValue: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  ordersLabel: { fontSize: 12, color: "#6B7280" },
  emptyContainer: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16 },
});