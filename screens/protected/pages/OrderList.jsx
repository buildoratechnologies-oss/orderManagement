import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  StatusBar,
  SafeAreaView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
// import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetOrdersListQuery } from "../../../redux/api/protectedApiSlice";

export default function OrderListScreen({ navigation }) {
  const [open, setOpen] = useState(false);
  const [statusValue, setStatusValue] = useState("All");
  const [orderListDetails, setOrderListDetails] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [expandedClient, setExpandedClient] = useState(null);
  const [statusItems, setStatusItems] = useState([
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" },
  ]);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [CBXID, setCBXID] = useState(null);

  const [loading, setLoading] = useState(false); // <-- loading state

  const { data: response,isLoading,refetch } = useGetOrdersListQuery(CBXID,{skip:!CBXID});
  // const CBXID = await AsyncStorage.getItem("CBXID");

  const handleConfirm = (date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  useEffect(() => {
    (async () => {
      const cbxid = await AsyncStorage.getItem("CBXID");
      if (cbxid) {
        setCBXID(cbxid);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); // start loading
      console.log(response)
      if (response) {
        const token = await AsyncStorage.getItem("CBXID");
        let filterredData = response?.filter(
          (item) => item?.cbXid == token
        );
        setOrderListDetails(filterredData);
        setFilteredOrders(filterredData); // Initialize filtered orders
      }
      setLoading(false); // stop loading
    })();
  }, [response]);

  // Filter orders whenever orderListDetails, statusValue, selectedDate, or searchQuery changes
  useEffect(() => {
    let filtered = [...orderListDetails];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((order) => {
        const searchText = searchQuery.toLowerCase();
        return (
          order?.clientCompanyName?.toLowerCase().includes(searchText) ||
          order?.status?.toLowerCase().includes(searchText) ||
          order?.sumOfInvoice?.toString().includes(searchText)
        );
      });
    }

    // Filter by status
    if (statusValue && statusValue !== "All") {
      filtered = filtered.filter((order) => {
        const orderStatus = order?.status || "Pending";
        return orderStatus === statusValue;
      });
    }

    // Filter by date
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split("T")[0];
      filtered = filtered.filter((order) => {
        if (!order?.createdOn) return false;
        const orderDateStr = order.createdOn.split("T")[0];
        return orderDateStr === selectedDateStr;
      });
    }

    setFilteredOrders(filtered);
  }, [orderListDetails, statusValue, selectedDate, searchQuery]);

  // Build grouped view by client when filteredOrders changes
  useEffect(() => {
    const groups = {};
    filteredOrders.forEach((order) => {
      const name = order?.clientCompanyName || "Unknown Client";
      if (!groups[name]) {
        groups[name] = { clientName: name, count: 0, total: 0, orders: [], latestAt: 0 };
      }
      groups[name].count += 1;
      const amt = Number(order?.sumOfInvoice) || 0;
      groups[name].total += amt;
      const ts = order?.createdOn ? new Date(order.createdOn).getTime() : 0;
      if (ts > groups[name].latestAt) groups[name].latestAt = ts;
      groups[name].orders.push(order);
    });
    const groupedArr = Object.values(groups).sort((a, b) => {
      if (b.latestAt !== a.latestAt) return b.latestAt - a.latestAt; // newest client on top
      if (b.count !== a.count) return b.count - a.count; // then by number of orders desc
      return a.clientName.localeCompare(b.clientName); // finally by name asc
    });
    setGroupedClients(groupedArr);
    // collapse expanded client if it no longer exists
    if (expandedClient && !groupedArr.find((g) => g.clientName === expandedClient)) {
      setExpandedClient(null);
    }
  }, [filteredOrders]);

  const renderOrder = ({ item, index }) => {
    const status = item?.status ?? "Pending";
    const statusStyle = getStatusStyle(status);

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("OrderDetails", { productId: item?.pid })
        }
        key={index}
        style={styles.orderCardContainer}
      >
        <View style={styles.modernOrderCard}>
          {/* Header Row */}
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleRow}>
              <Icon name="store" size={20} color="#6366f1" />
              <Text style={styles.customerName}>{item.clientCompanyName}</Text>
            </View>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Icon
                name={statusStyle.icon}
                size={14}
                color={statusStyle.color}
              />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {status}
              </Text>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Icon name="calendar" size={16} color="#6b7280" />
              <Text style={styles.detailLabel}>Order Date:</Text>
              <Text style={styles.detailValue}>
                {item?.createdOn
                  ? new Date(item.createdOn).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="currency-inr" size={16} color="#059669" />
              <Text style={styles.detailLabel}>Total Amount:</Text>
              <Text style={styles.amountValue}>
                ₹{item?.sumOfInvoice?.toLocaleString() ?? "0"}
              </Text>
            </View>

            {item?.pid && (
              <View style={styles.detailRow}>
                <Icon name="identifier" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.detailValue}>{item.pid}</Text>
              </View>
            )}
          </View>

          {/* Action Arrow */}
          <View style={styles.orderAction}>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderClientGroup = ({ item }) => {
    const isExpanded = expandedClient === item.clientName;
    return (
      <View style={styles.clientGroupCardWrapper}>
        <TouchableOpacity
          style={styles.clientGroupCard}
          onPress={() => setExpandedClient(isExpanded ? null : item.clientName)}
        >
          <View style={styles.clientGroupHeader}>
            <View style={styles.clientNameRow}>
              <Icon name="store" size={20} color="#6366f1" />
              <Text style={styles.clientName}>{item.clientName}</Text>
            </View>
            <View style={styles.clientStats}>
              <View style={styles.clientStatBadge}>
                <Icon name="cart-outline" size={14} color="#2563eb" />
                <Text style={[styles.clientStatText, { color: "#2563eb" }]}>{item.count}</Text>
              </View>
              <View style={[styles.clientStatBadge, { backgroundColor: "#ecfeff", borderColor: "#a5f3fc" }]}>
                <Icon name="currency-inr" size={14} color="#0ea5e9" />
                <Text style={[styles.clientStatText, { color: "#0ea5e9" }]}>₹{item.total.toLocaleString()}</Text>
              </View>
              <Icon
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6b7280"
              />
            </View>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.clientOrdersList}>
            {item.orders.map((order, idx) => (
              <View key={order?.pid || idx} style={styles.orderCardContainer}>
                {renderOrder({ item: order, index: idx })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Modern Header */}
      <View style={styles.header}>
        {/* <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Orders</Text>
        </View> */}

        {/* Search Bar with Actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Icon
              name="magnify"
              size={20}
              color="#6b7280"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders, clients, amounts..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
              >
                <Icon name="close-circle" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionBtn, showFilters && styles.actionBtnActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icon
                name="filter-variant"
                size={20}
                color={showFilters ? "#6366f1" : "#6b7280"}
              />
              {(statusValue !== "All" || selectedDate || searchQuery) && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {[
                      statusValue !== "All" ? 1 : 0,
                      selectedDate ? 1 : 0,
                      searchQuery ? 1 : 0,
                    ].reduce((a, b) => a + b)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                setSearchQuery("");
                setStatusValue("All");
                setSelectedDate(null);
                refetch();
              }}
            >
              <Icon name="refresh" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {/* Collapsible Filter Controls */}
        {showFilters && (
          <View style={[styles.filterCard, styles.filterCardAnimated]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter & Sort</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.collapseBtn}
              >
                <Icon name="chevron-up" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.dropdownWrapper}>
                <Text style={styles.filterLabel}>Status</Text>
                <DropDownPicker
                  open={open}
                  value={statusValue}
                  items={statusItems}
                  setOpen={setOpen}
                  setValue={setStatusValue}
                  setItems={setStatusItems}
                  style={styles.modernDropdown}
                  dropDownContainerStyle={styles.modernDropdownContainer}
                  placeholder="All Status"
                  placeholderStyle={styles.dropdownPlaceholder}
                  textStyle={styles.dropdownText}
                />
              </View>

              <View style={styles.datePickerWrapper}>
                <Text style={styles.filterLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.modernCalendarBtn}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Icon name="calendar" size={18} color="#6366f1" />
                  <Text style={styles.calendarBtnText}>
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select Date"}
                  </Text>
                  {selectedDate && (
                    <TouchableOpacity
                      onPress={() => setSelectedDate(null)}
                      style={styles.clearDateBtn}
                    >
                      <Icon name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Active Filters Summary */}
            {(selectedDate || statusValue !== "All") && (
              <View style={styles.activeFilters}>
                <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
                <View style={styles.filterTags}>
                  {statusValue !== "All" && (
                    <View style={styles.filterTag}>
                      <Text style={styles.filterTagText}>{statusValue}</Text>
                      <TouchableOpacity onPress={() => setStatusValue("All")}>
                        <Icon name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedDate && (
                    <View style={styles.filterTag}>
                      <Text style={styles.filterTagText}>
                        {selectedDate.toLocaleDateString()}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedDate(null)}>
                        <Icon name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.clearAllFiltersBtn}
                  onPress={() => {
                    setStatusValue("All");
                    setSelectedDate(null);
                  }}
                >
                  <Icon name="filter-remove" size={16} color="#ef4444" />
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Results Summary */}
        {!loading && !isLoading && (
          <View style={styles.resultsHeader}>
            <Icon name="account-group" size={16} color="#6b7280" />
            <Text style={styles.resultsText}>
              {groupedClients.length} clients • {filteredOrders.length} orders
            </Text>
          </View>
        )}

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />

        {/* Modern Loading Indicator */}
        {loading || isLoading ? (
          <View style={styles.modernLoaderContainer}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingTitle}>Loading Orders...</Text>
              <Text style={styles.loadingSubtext}>
                Please wait while we fetch your orders
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={expandedClient ? groupedClients.filter((g) => g.clientName === expandedClient) : groupedClients}
            renderItem={renderClientGroup}
            keyExtractor={(item, index) => item.clientName + "-" + index}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            ListEmptyComponent={() => (
              <View style={styles.modernEmptyContainer}>
                <View style={styles.emptyCard}>
                  <Icon name="account-off" size={64} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No Clients Found</Text>
                  <Text style={styles.emptyDescription}>
                    Try clearing filters or searching for a different client.
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStatusStyle = (status) => {
  switch (status) {
    case "Pending":
      return {
        color: "#f59e0b",
        badge: { backgroundColor: "#fef3c7" },
        icon: "clock-outline",
      };
    case "Completed":
      return {
        color: "#10b981",
        badge: { backgroundColor: "#d1fae5" },
        icon: "check-circle-outline",
      };
    case "Cancelled":
      return {
        color: "#ef4444",
        badge: { backgroundColor: "#fee2e2" },
        icon: "close-circle-outline",
      };
    case "Processing":
      return {
        color: "#3b82f6",
        badge: { backgroundColor: "#dbeafe" },
        icon: "cog-outline",
      };
    default:
      return {
        color: "#6b7280",
        badge: { backgroundColor: "#f3f4f6" },
        icon: "help-circle-outline",
      };
  }
};

const styles = StyleSheet.create({
  // Base Layout
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Header Styles
  header: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },

  // Search Row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 2,
    flex: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#374151",
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Header Actions
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    position: "relative",
  },
  actionBtnActive: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Filter Card
  filterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    position: "relative",
    zIndex: 9999,
  },
  filterCardAnimated: {
    borderColor: "#6366f1",
    elevation: 4,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  collapseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  dropdownWrapper: {
    flex: 1,
  },
  datePickerWrapper: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modernDropdown: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  modernDropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    elevation: 4,
  },
  dropdownPlaceholder: {
    color: "#9ca3af",
    fontSize: 14,
  },
  dropdownText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  modernCalendarBtn: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 48,
  },
  calendarBtnText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  clearDateBtn: {
    padding: 2,
  },

  // Active Filters
  activeFilters: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  filterTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterTag: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterTagText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllFiltersBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  clearAllFiltersText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },

  // Results Header
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },

  // Client Group Cards
  clientGroupCardWrapper: {
    marginBottom: 4,
  },
  clientGroupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  clientGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  clientStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientStatBadge: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clientStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },
  clientOrdersList: {
    marginTop: 8,
  },

  // Modern Order Cards
  listContainer: {
    paddingBottom: 100,
  },
  cardSeparator: {
    height: 12,
  },
  orderCardContainer: {
    marginBottom: 4,
  },
  modernOrderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Order Details
  orderDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "700",
  },
  orderAction: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },

  // Loading States
  modernLoaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loaderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },

  // Empty States
  modernEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFiltersBtn: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  clearFiltersBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
