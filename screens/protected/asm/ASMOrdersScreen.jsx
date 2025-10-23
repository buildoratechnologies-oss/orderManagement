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

export default function ASMOrdersScreen() {
  const [ordersData, setOrdersData] = useState([]);
  const [selectedMember, setSelectedMember] = useState("all");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdersData();
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

  const fetchOrdersData = async () => {
    try {
      const mockOrdersData = [
        {
          id: "1",
          userXid: "TM001",
          displayname: "John Doe",
          orderId: "ORD-2025-001",
          clientName: "ABC Corporation",
          amount: 15000,
          status: "completed",
          date: "2025-01-20",
          items: 5,
        },
        {
          id: "2",
          userXid: "TM002",
          displayname: "Jane Smith",
          orderId: "ORD-2025-002",
          clientName: "XYZ Industries",
          amount: 25000,
          status: "pending",
          date: "2025-01-20",
          items: 8,
        },
        {
          id: "3",
          userXid: "TM001",
          displayname: "John Doe",
          orderId: "ORD-2025-003",
          clientName: "DEF Company",
          amount: 12000,
          status: "processing",
          date: "2025-01-19",
          items: 3,
        },
        {
          id: "4",
          userXid: "TM004",
          displayname: "Sarah Wilson",
          orderId: "ORD-2025-004",
          clientName: "GHI Solutions",
          amount: 30000,
          status: "completed",
          date: "2025-01-19",
          items: 12,
        },
        {
          id: "5",
          userXid: "TM005",
          displayname: "David Brown",
          orderId: "ORD-2025-005",
          clientName: "JKL Enterprises",
          amount: 8000,
          status: "cancelled",
          date: "2025-01-18",
          items: 2,
        },
      ];

      setOrdersData(mockOrdersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders data:", error);
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedMember === "all") {
      return ordersData;
    }
    return ordersData.filter(item => item.userXid === selectedMember);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "processing":
        return "#3B82F6";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "processing":
        return "sync";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const MemberFilter = ({ member, active }) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={() => setSelectedMember(member.userXid)}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {member.displayname}
      </Text>
    </TouchableOpacity>
  );

  const OrderCard = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.memberName}>{item.displayname}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>₹{item.amount.toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="list-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>{item.items}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{item.date}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getOrdersStats = () => {
    const filtered = getFilteredData();
    const totalOrders = filtered.length;
    const completedCount = filtered.filter(item => item.status === "completed").length;
    const pendingCount = filtered.filter(item => item.status === "pending").length;
    const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);
    
    return { totalOrders, completedCount, pendingCount, totalAmount };
  };

  const stats = getOrdersStats();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading orders data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Orders</Text>
        <Text style={styles.headerSubtitle}>
          Monitor team orders and performance
        </Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: "#3B82F6" }]}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.statValue}>{stats.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
          <Text style={styles.statValue}>{stats.pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#8B5CF6" }]}>
          <Text style={styles.statValue}>₹{(stats.totalAmount / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Team Member Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedMember === "all" && styles.filterChipActive]}
          onPress={() => setSelectedMember("all")}
        >
          <Text style={[styles.filterChipText, selectedMember === "all" && styles.filterChipTextActive]}>
            All Team
          </Text>
        </TouchableOpacity>
        {teamMembers.map(member => (
          <MemberFilter
            key={member.userXid}
            member={member}
            active={selectedMember === member.userXid}
          />
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              No orders available for the selected filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 2,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "white",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  clientName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  orderDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});