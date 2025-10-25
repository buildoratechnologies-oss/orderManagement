import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useGetLiveLocationQuery } from "../../../redux/api/asmApiSlice";

export default function ASMLiveScreen() {
  const {
    data: overviewByIdss,
    isLoading: isLoadingUse,
    refetch,
    isFetching
  } = useGetLiveLocationQuery();

  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [expandedLiveData, setExpandedLiveData] = useState({});
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleUser = (userId) => {
    // Close all if clicking the same user, otherwise open the new user and close others
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedLiveData({});
      setExpandedLogs({});
    } else {
      setExpandedUser(userId);
      // Reset sub-accordions when switching users
      setExpandedLiveData({});
      setExpandedLogs({});
    }
  };

  const toggleLiveData = (userId) => {
    setExpandedLiveData(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleLogs = (userId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const captured = new Date(timestamp);
    const diffMs = now - captured;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const getStatus = (isOnline, capturedAt) => {
    if (!isOnline) return "offline";
    const now = new Date();
    const captured = new Date(capturedAt);
    const diffMins = Math.floor((now - captured) / 60000);
    if (diffMins < 5) return "active";
    if (diffMins < 30) return "idle";
    return "offline";
  };

  const transformData = () => {
    if (
      !overviewByIdss ||
      !Array.isArray(overviewByIdss) ||
      overviewByIdss.length === 0
    )
      return [];

    return overviewByIdss.map((attendance) => {
      const {
        firstName,
        lastName,
        liveDetails,
        attendanceLogs,
        checkInTime,
        checkOutTime,
        remarks,
        loginLatitude,
        loginLongitude,
      } = attendance;
      const displayname = `${firstName} ${lastName}`.trim();

      let latestLocation = null;
      let status = "offline";

      // Get latest live location if available
      if (liveDetails && Array.isArray(liveDetails) && liveDetails.length > 0) {
        const sortedLiveDetails = [...liveDetails].sort(
          (a, b) => new Date(b.capturedAt) - new Date(a.capturedAt)
        );
        latestLocation = sortedLiveDetails[0];
        status = getStatus(latestLocation.isOnline, latestLocation.capturedAt);
      }

      return {
        id: `${attendance.pid}`,
        pid: attendance.pid,
        userXid: attendance.pid,
        displayname,
        status,
        checkInTime,
        checkOutTime,
        remarks,
        loginLatitude,
        loginLongitude,
        latestLocation,
        liveDetails: liveDetails || [],
        attendanceLogs: attendanceLogs || [],
        totalLiveUpdates: liveDetails?.length || 0,
        totalLogs: attendanceLogs?.length || 0,
      };
    });
  };

  const liveData = useMemo(() => transformData(), [overviewByIdss]);

  // Filter data based on expanded state - show only expanded item or all items
  const displayData = useMemo(() => {
    if (expandedUser) {
      return liveData.filter(item => item.id === expandedUser);
    }
    return liveData;
  }, [liveData, expandedUser]);

  const refreshData = async () => {
    // Trigger Redux action to fetch fresh data if needed
    setLoading(true);
    await refetch();
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "idle":
        return "#F59E0B";
      case "offline":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getAccuracyColor = (accuracyStr) => {
    if (accuracyStr === "N/A") return "#6B7280";
    const accuracy = parseFloat(accuracyStr);
    if (accuracy < 100) return "#10B981"; // Good accuracy
    if (accuracy < 500) return "#F59E0B"; // Medium accuracy
    return "#EF4444"; // Poor accuracy
  };

  if (isLoadingUse || isFetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.emptyText}>Loading live tracking data...</Text>
      </View>
    );
  }

  if (!overviewByIdss || overviewByIdss.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="location-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>No live tracking data available</Text>
        <Text style={styles.emptySubtext}>
          Data will appear when users are being tracked
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Refresh */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
          <Ionicons
            name="refresh"
            size={24}
            color="#3B82F6"
            style={{ transform: [{ rotate: loading ? "360deg" : "0deg" }] }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.statValue}>
            {liveData.filter((item) => item.status === "active").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
          <Text style={styles.statValue}>
            {liveData.filter((item) => item.status === "idle").length}
          </Text>
          <Text style={styles.statLabel}>Idle</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#EF4444" }]}>
          <Text style={styles.statValue}>
            {liveData.filter((item) => item.status === "offline").length}
          </Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      {liveData.length === 0 && (
        <View style={styles.emptyListContainer}>
          <Ionicons name="location-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyListText}>No location data available</Text>
        </View>
      )}

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.accordionCard}>
            {/* Main User Header - Collapsible */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleUser(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.headerLeft}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {item.displayname
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.displayname}</Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    />
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
              </View>
              <View style={styles.headerRight}>
                <View style={styles.badgeContainer}>
                  {item.totalLiveUpdates > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.totalLiveUpdates}
                      </Text>
                    </View>
                  )}
                  {item.totalLogs > 0 && (
                    <View
                      style={[styles.badge, { backgroundColor: "#F59E0B" }]}
                    >
                      <Text style={styles.badgeText}>{item.totalLogs}</Text>
                    </View>
                  )}
                </View>
                <Ionicons 
                  name={expandedUser === item.id ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#6B7280"
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {expandedUser === item.id && (
              <View style={styles.expandedContent}>
                {/* Quick Info */}
                <View style={styles.quickInfo}>
                  <View style={styles.quickInfoItem}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.quickInfoText}>
                      Check In:{" "}
                      {item.checkInTime
                        ? new Date(item.checkInTime).toLocaleTimeString()
                        : "--"}
                    </Text>
                  </View>
                  {item.remarks && (
                    <View style={styles.quickInfoItem}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color="#10B981"
                      />
                      <Text
                        style={[styles.quickInfoText, { color: "#10B981" }]}
                      >
                        {item.remarks}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Live Data Accordion */}
                {item.liveDetails.length > 0 && (
                  <View style={styles.subAccordion}>
                    <TouchableOpacity
                      style={styles.subAccordionHeader}
                      onPress={() => toggleLiveData(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subHeaderLeft}>
                        <Ionicons name="pulse" size={20} color="#3B82F6" />
                        <Text style={styles.subAccordionTitle}>
                          Live Location Data
                        </Text>
                        <View
                          style={[styles.badge, { backgroundColor: "#3B82F6" }]}
                        >
                          <Text style={styles.badgeText}>
                            {item.liveDetails.length}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={
                          expandedLiveData[item.id]
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {expandedLiveData[item.id] && (
                      <View style={styles.subAccordionContent}>
                        {item.liveDetails.map((live, index) => (
                          <View key={live.pid} style={styles.liveDataItem}>
                            <View style={styles.liveDataHeader}>
                              <View style={styles.liveDataBadge}>
                                <Ionicons
                                  name={
                                    live.isOnline
                                      ? "checkmark-circle"
                                      : "close-circle"
                                  }
                                  size={16}
                                  color={live.isOnline ? "#10B981" : "#EF4444"}
                                />
                                <Text
                                  style={[
                                    styles.liveDataStatus,
                                    {
                                      color: live.isOnline
                                        ? "#10B981"
                                        : "#EF4444",
                                    },
                                  ]}
                                >
                                  {live.isOnline ? "Online" : "Offline"}
                                </Text>
                              </View>
                              <Text style={styles.liveDataTime}>
                                {getTimeAgo(live.capturedAt)}
                              </Text>
                            </View>
                            <View style={styles.liveDataDetails}>
                              <View style={styles.detailRow}>
                                <Ionicons
                                  name="location"
                                  size={14}
                                  color="#6B7280"
                                />
                                <Text style={styles.detailText}>
                                  {live.latitude.toFixed(6)},{" "}
                                  {live.longitude.toFixed(6)}
                                </Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Ionicons
                                  name="navigate-circle"
                                  size={14}
                                  color="#6B7280"
                                />
                                <Text style={styles.detailText}>
                                  Accuracy: ±{live.accuracy.toFixed(0)}m
                                </Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Ionicons
                                  name="calendar"
                                  size={14}
                                  color="#6B7280"
                                />
                                <Text style={styles.detailText}>
                                  {new Date(live.capturedAt).toLocaleString()}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Attendance Logs Accordion */}
                {item.attendanceLogs.length > 0 && (
                  <View style={styles.subAccordion}>
                    <TouchableOpacity
                      style={styles.subAccordionHeader}
                      onPress={() => toggleLogs(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subHeaderLeft}>
                        <Ionicons name="clipboard" size={20} color="#F59E0B" />
                        <Text style={styles.subAccordionTitle}>
                          Attendance Logs
                        </Text>
                        <View
                          style={[styles.badge, { backgroundColor: "#F59E0B" }]}
                        >
                          <Text style={styles.badgeText}>
                            {item.attendanceLogs.length}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={
                          expandedLogs[item.id] ? "chevron-up" : "chevron-down"
                        }
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {expandedLogs[item.id] && (
                      <View style={styles.subAccordionContent}>
                        {item.attendanceLogs.map((log) => (
                          <View key={log.pid} style={styles.logItem}>
                            <View style={styles.logHeader}>
                              <Ionicons
                                name="business"
                                size={16}
                                color="#6366f1"
                              />
                              <Text style={styles.logCompany}>
                                {log.companyName}
                              </Text>
                            </View>
                            <View style={styles.logDetails}>
                              <View style={styles.detailRow}>
                                <Ionicons
                                  name="log-in"
                                  size={14}
                                  color="#10B981"
                                />
                                <Text style={styles.detailText}>
                                  In:{" "}
                                  {new Date(
                                    log.checkInTimeLog
                                  ).toLocaleTimeString()}
                                </Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Ionicons
                                  name="log-out"
                                  size={14}
                                  color="#EF4444"
                                />
                                <Text style={styles.detailText}>
                                  Out:{" "}
                                  {log.checkOutTimeLog
                                    ? new Date(
                                        log.checkOutTimeLog
                                      ).toLocaleTimeString()
                                    : "--"}
                                </Text>
                              </View>
                              {log.atClientLoginLatitude && (
                                <View style={styles.detailRow}>
                                  <Ionicons
                                    name="location"
                                    size={14}
                                    color="#6B7280"
                                  />
                                  <Text style={styles.detailText}>
                                    {log.atClientLoginLatitude.toFixed(4)},{" "}
                                    {log.atClientLoginLongitude.toFixed(4)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Empty State */}
                {item.liveDetails.length === 0 &&
                  item.attendanceLogs.length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="information-circle-outline"
                        size={32}
                        color="#D1D5DB"
                      />
                      <Text style={styles.emptyStateText}>
                        No tracking data available
                      </Text>
                    </View>
                  )}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={refreshData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingTop: 15 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  statsRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#6B7280" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },

  // Accordion Card Styles
  accordionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },

  // Expanded Content
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  quickInfo: {
    marginBottom: 12,
    gap: 8,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickInfoText: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Sub Accordion
  subAccordion: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  subAccordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  subAccordionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  subAccordionContent: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    gap: 10,
  },

  // Live Data Item
  liveDataItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  liveDataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveDataBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDataStatus: {
    fontSize: 13,
    fontWeight: "600",
  },
  liveDataTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  liveDataDetails: {
    gap: 6,
  },

  // Log Item
  logItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logCompany: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  logDetails: {
    gap: 6,
  },

  // Detail Row
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },

  // Empty States
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
