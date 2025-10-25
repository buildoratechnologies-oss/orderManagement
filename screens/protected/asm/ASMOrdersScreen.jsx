import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function ASMOrdersScreen() {
  const [response, setResponse] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { asmUserOverview } = useSelector((state) => state.asmSliceState);

  // const { data: response, isLoading, refetch } = useGetOrdersListQuery(CBXID, { skip: !CBXID });

  useEffect(() => {
    if (asmUserOverview?.companyBranchInvoices) {
      setIsLoading(true);
      setResponse(asmUserOverview?.companyBranchInvoices);
      setIsLoading(false);
    }
  }, [asmUserOverview]);

  // Map status codes to readable status
  const getOrderStatus = (transactionStatusXid, paymentStatusXid) => {
    // Customize based on your status code mapping
    if (transactionStatusXid === 1) return "completed";
    if (transactionStatusXid === 2) return "pending";
    if (transactionStatusXid === 3) return "processing";
    if (transactionStatusXid === 4) return "cancelled";
    return "pending";
  };

  // Transform API data to match component structure
  const transformOrderData = (apiData) => {
    if (!apiData) return [];

    return apiData.map((order) => ({
      id: order.pid?.toString(),
      userXid: order.userXid,
      orderId: `ORD-${order.pid}`,
      clientName: order.clientCompanyName || "N/A",
      amount: order.sumOfInvoice || 0,
      status: getOrderStatus(
        order.transactionStatusXid,
        order.paymentStatusXid
      ),
      date: order.purchaseOrderDate
        ? new Date(order.purchaseOrderDate).toLocaleDateString("en-IN")
        : "N/A",
      dateObj: order.purchaseOrderDate
        ? new Date(order.purchaseOrderDate)
        : null,
      mobileNo: order.mobileNo,
      refID: order.refID,
      createdOn: order.createdOn,
    }));
  };

  const getFilteredData = () => {
    const ordersData = transformOrderData(response);
    return ordersData;
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

  const OrderCard = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              ₹{item.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{item.mobileNo || "N/A"}</Text>
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
    const completedCount = filtered.filter(
      (item) => item.status === "completed"
    ).length;
    const pendingCount = filtered.filter(
      (item) => item.status === "pending"
    ).length;
    const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);

    return { totalOrders, completedCount, pendingCount, totalAmount };
  };

  const stats = getOrdersStats();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading orders data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Orders</Text>
        <Text style={styles.headerSubtitle}>
          Monitor team orders and performance
        </Text>
      </View> */}

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
          <Text style={styles.statValue}>
            ₹{(stats.totalAmount / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={isLoading}
        //     onRefresh={refetch}
        //     colors={["#3B82F6"]}
        //     tintColor="#3B82F6"
        //   />
        // }
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
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

  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  clearButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
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
