import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ASMDOAScreen() {
  const [doaData, setDoaData] = useState([]);
  const [selectedMember, setSelectedMember] = useState("all");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDOAData();
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

  const fetchDOAData = async () => {
    try {
      const mockDOAData = [
        {
          id: "1",
          userXid: "TM001",
          displayname: "John Doe",
          companyName: "ABC Corp",
          itemName: "Product A",
          status: "approved",
          date: "2025-01-20",
          amount: 5000,
        },
        {
          id: "2",
          userXid: "TM002",
          displayname: "Jane Smith",
          companyName: "XYZ Ltd",
          itemName: "Service B",
          status: "pending",
          date: "2025-01-19",
          amount: 3000,
        },
        {
          id: "3",
          userXid: "TM004",
          displayname: "Sarah Wilson",
          companyName: "DEF Inc",
          itemName: "Product C",
          status: "rejected",
          date: "2025-01-18",
          amount: 2000,
        },
      ];
      setDoaData(mockDOAData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching DOA data:", error);
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedMember === "all") return doaData;
    return doaData.filter((item) => item.userXid === selectedMember);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading DOA data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Operation Activities</Text>
        <Text style={styles.headerSubtitle}>
          Track team DOA requests and approvals
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMember === "all" && styles.filterChipActive,
          ]}
          onPress={() => setSelectedMember("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedMember === "all" && styles.filterChipTextActive,
            ]}
          >
            All Team
          </Text>
        </TouchableOpacity>
        {teamMembers.map((member) => (
          <TouchableOpacity
            key={member.userXid}
            style={[
              styles.filterChip,
              selectedMember === member.userXid && styles.filterChipActive,
            ]}
            onPress={() => setSelectedMember(member.userXid)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedMember === member.userXid &&
                  styles.filterChipTextActive,
              ]}
            >
              {member.displayname}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.doaCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <Text style={styles.memberName}>{item.displayname}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.itemName}>Item: {item.itemName}</Text>
              <Text style={styles.amount}>
                Amount: ₹{item.amount.toLocaleString()}
              </Text>
              <Text style={styles.date}>Date: {item.date}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No DOA records</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  filtersContainer: { paddingHorizontal: 20, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  filterChipText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  filterChipTextActive: { color: "white" },
  listContainer: { paddingHorizontal: 20 },
  doaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  companyName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  memberName: { fontSize: 14, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardContent: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12 },
  itemName: { fontSize: 14, color: "#374151", marginBottom: 4 },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  date: { fontSize: 12, color: "#6B7280" },
  emptyContainer: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
});
