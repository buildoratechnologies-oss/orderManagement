import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsmUserOrders from "./AsmUserOrders";
import AsmUserAttendance from "./AsmUserAttendance";
import AsmUserDOA from "./AsmUserDOA";
import AsmUserPlannedVisits from "./AsmUserPlannedVisits";
// import { useGetUserOverviewByIdQuery } from "../../../../redux/api/asmApiSlice";

const UserPerformance = () => {
  const route = useRoute();
  const { user } = route.params;

  const [activeTab, setActiveTab] = useState("Attendance");
  // Mock data - replace with actual API calls
  // const attendanceData = [
  //   {
  //     id: 1,
  //     date: "2024-01-15",
  //     checkIn: "09:00 AM",
  //     checkOut: "06:30 PM",
  //     status: "Present",
  //     location: "Office",
  //   },
  //   {
  //     id: 2,
  //     date: "2024-01-14",
  //     checkIn: "09:15 AM",
  //     checkOut: "06:45 PM",
  //     status: "Late",
  //     location: "Field",
  //   },
  //   {
  //     id: 3,
  //     date: "2024-01-13",
  //     checkIn: "--",
  //     checkOut: "--",
  //     status: "Absent",
  //     location: "--",
  //   },
  // ];

  // const doaData = [
  //   {
  //     id: 1,
  //     date: "2024-01-15",
  //     client: "ABC Store",
  //     orderValue: "$1,250",
  //     status: "Completed",
  //     notes: "New client acquisition",
  //   },
  //   {
  //     id: 2,
  //     date: "2024-01-14",
  //     client: "XYZ Market",
  //     orderValue: "$850",
  //     status: "Pending",
  //     notes: "Follow-up required",
  //   },
  //   {
  //     id: 3,
  //     date: "2024-01-13",
  //     client: "DEF Shop",
  //     orderValue: "$2,100",
  //     status: "Completed",
  //     notes: "Bulk order",
  //   },
  // ];

  // const ordersData = [
  //   {
  //     id: 1,
  //     orderNumber: "ORD-001",
  //     client: "ABC Store",
  //     amount: "$1,250",
  //     date: "2024-01-15",
  //     status: "Delivered",
  //   },
  //   {
  //     id: 2,
  //     orderNumber: "ORD-002",
  //     client: "XYZ Market",
  //     amount: "$850",
  //     date: "2024-01-14",
  //     status: "Processing",
  //   },
  //   {
  //     id: 3,
  //     orderNumber: "ORD-003",
  //     client: "DEF Shop",
  //     amount: "$2,100",
  //     date: "2024-01-13",
  //     status: "Delivered",
  //   },
  // ];

  const tabs = [
    { id: "Attendance", label: "Attendance", icon: "calendar-check" },
    { id: "DOA", label: "DOA", icon: "clipboard-list" },
    { id: "Orders", label: "Orders", icon: "package-variant" },
    { id: "PlannedVisits", label: "Planned Visits", icon: "map-marker-path" },
  ];

  // const getStatusColor = (status) => {
  //   switch (status.toLowerCase()) {
  //     case "present":
  //     case "completed":
  //     case "delivered":
  //       return "#10b981";
  //     case "late":
  //     case "pending":
  //     case "processing":
  //       return "#f59e0b";
  //     case "absent":
  //     case "cancelled":
  //       return "#ef4444";
  //     default:
  //       return "#6b7280";
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6366f1" barStyle="light-content" />
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? "#fff" : "#6b7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "Attendance" && (
          <AsmUserAttendance userXid={user?.userXid} cbxid={user?.cbXid} />
        )}
        {activeTab === "DOA" && (
          <AsmUserDOA userXid={user?.userXid} cbxid={user?.cbXid} />
        )}
        {activeTab === "Orders" && (
          <AsmUserOrders userXid={user?.userXid} cbxid={user?.cbXid} />
        )}
        {activeTab === "PlannedVisits" && (
          <AsmUserPlannedVisits userXid={user?.userXid} cbxid={user?.cbXid} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  listItemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
});

export default UserPerformance;
