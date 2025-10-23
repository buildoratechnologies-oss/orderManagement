import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetOrdersListQuery } from "../../../../redux/api/protectedApiSlice";

export default function AsmUserOrders({ userXid }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [cbxid, setCbxid] = useState(null);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem("CBXID");
      if (v) setCbxid(v);
    })();
  }, []);

  const {
    data: allOrders = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOrdersListQuery(cbxid, { skip: !cbxid });

  const monthLabel = useMemo(
    () =>
      selectedMonth.toLocaleString("en-US", { month: "long", year: "numeric" }),
    [selectedMonth]
  );
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const targetKey = monthKey(selectedMonth);

  const baseOrders = useMemo(() => {
    if (!allOrders?.length) return [];
    const branchFiltered = allOrders.filter((o) => `${o?.cbXid}` === `${cbxid}`);
    const monthFiltered = branchFiltered.filter((o) => {
      if (!o?.createdOn) return false;
      const d = new Date(o.createdOn);
      return monthKey(d) === targetKey;
    });
    return monthFiltered;
  }, [allOrders, cbxid, targetKey]);

  const visibleOrders = useMemo(() => {
    let list = [...baseOrders];
    if (status && status !== "All") {
      list = list.filter((o) => (o?.status ?? "Pending") === status);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (o) =>
          o?.clientCompanyName?.toLowerCase().includes(s) ||
          `${o?.sumOfInvoice ?? ""}`.toLowerCase().includes(s) ||
          (o?.status ?? "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [baseOrders, status, search]);

  const stats = useMemo(() => {
    const total = baseOrders.length;
    const totalAmount = baseOrders.reduce((sum, o) => sum + (Number(o?.sumOfInvoice) || 0), 0);
    const completed = baseOrders.filter((o) => (o?.status ?? "").toLowerCase() === "completed").length;
    const pending = baseOrders.filter((o) => (o?.status ?? "").toLowerCase() === "pending").length;
    return { total, totalAmount, completed, pending };
  }, [baseOrders]);

  const getStatusColor = (s) => {
    switch ((s ?? "").toLowerCase()) {
      case "completed":
      case "delivered":
        return "#10B981";
      case "pending":
      case "processing":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  if (!cbxid || isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load orders</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  const renderOrder = ({ item }) => {
    const statusColor = getStatusColor(item?.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item?.clientCompanyName ?? "—"}</Text>
            <Text style={styles.cardSub}>Order #{item?.pid}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}> 
            <Ionicons name="ellipse" size={10} color={statusColor} style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {(item?.status ?? "Pending").toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.rowItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>
              {item?.createdOn ? new Date(item.createdOn).toLocaleDateString() : "N/A"}
            </Text>
          </View>
          <View style={styles.rowItem}>
            <Ionicons name="cash-outline" size={16} color="#059669" />
            <Text style={styles.rowLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{Number(item?.sumOfInvoice || 0).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  const StatusChip = ({ label }) => {
    const active = status === label;
    const color = getStatusColor(label);
    return (
      <TouchableOpacity
        onPress={() => setStatus(label)}
        style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      >
        <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Premium Gradient Header */}
      <LinearGradient colors={["#6366f1", "#4c5b9e"]} style={styles.gradientHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={[styles.headerIconBtn, showFilters && styles.headerIconBtnActive]}
              onPress={() => setShowFilters((s) => !s)}
            >
              <Ionicons name="filter" size={18} color={showFilters ? "#4f46e5" : "#6b7280"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.monthBtn} onPress={() => setOpen(true)}>
              <Ionicons name="calendar-outline" size={16} color="#6366f1" />
              <Text style={styles.monthText}>{monthLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{Math.round(stats.totalAmount).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search client, status, amount"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        {/* Filters */}
        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {(["All", "Pending", "Completed", "Cancelled"]).map((lbl) => (
              <StatusChip key={lbl} label={lbl} />
            ))}
            {status !== "All" && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setStatus("All")}>
                <Ionicons name="filter" size={14} color="#4f46e5" />
                <Text style={styles.clearFilterText}>Reset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </LinearGradient>

      {/* Orders List */}
      <FlatList
        data={visibleOrders}
        keyExtractor={(item, idx) => String(item?.pid || idx)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={renderOrder}
        refreshing={isFetching}
        onRefresh={refetch}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Ionicons name="bag-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptySub}>No orders for {monthLabel}</Text>
          </View>
        )}
      />

      <DateTimePickerModal
        isVisible={open}
        mode="date"
        onConfirm={(date) => {
          setOpen(false);
          setSelectedMonth(date);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#6b7280" },

  gradientHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  monthBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  monthText: { color: "#6366f1", fontWeight: "600", marginLeft: 6 },
  headerIconBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerIconBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366f1",
  },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#e5e7eb", fontSize: 11, marginTop: 2 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: "#111827" },
  filtersRow: { paddingVertical: 10, gap: 8 },

  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  chipText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFilterText: { color: "#4f46e5", fontWeight: "700", marginLeft: 6, fontSize: 12 },

  listContent: { padding: 16, paddingTop: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  cardBody: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10, gap: 8 },
  rowItem: { flexDirection: "row", alignItems: "center" },
  rowLabel: { fontSize: 13, color: "#6B7280", marginLeft: 6, marginRight: 6 },
  rowValue: { fontSize: 13, color: "#111827", fontWeight: "600" },
  amountValue: { fontSize: 14, color: "#111827", fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginTop: 10 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  errorText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12, textAlign: "center" },
  errorSubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
});
