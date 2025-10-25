import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import { useGetUserOverviewByIdQuery } from "../../../../redux/api/asmApiSlice";

const AsmUserPlannedVisits = ({ userXid, cbxid }) => {
  const { data: overviewById } = useGetUserOverviewByIdQuery(userXid, {
    skip: !userXid,
  });
  // Get all planned visits without filtering by user
  const getPlannedVisits = () => {
    if (
      !overviewById?.planVisitDetails ||
      !Array.isArray(overviewById.planVisitDetails)
    ) {
      return [];
    }

    // Return all planned visits from the API response
    return overviewById.planVisitDetails;
  };

  const plannedVisits = getPlannedVisits();

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanTypeColor = (planType) => {
    switch (planType) {
      case 1:
        return "#3B82F6"; // Weekly - Blue
      case 2:
        return "#10B981"; // Monthly - Green
      case 3:
        return "#F59E0B"; // Daily - Orange
      default:
        return "#6B7280"; // Default - Gray
    }
  };

  const getVisitStatusColor = (isVisited) => {
    return isVisited ? "#10B981" : "#EF4444";
  };

  const renderPlannedVisitCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Icon name="office-building" size={20} color="#6366f1" />
          <Text style={styles.companyName}>{item.companyName}</Text>
        </View>
        <View
          style={[
            styles.visitStatusBadge,
            {
              backgroundColor: item.isVisited ? "#10B98120" : "#EF444420",
            },
          ]}
        >
          <Icon
            name={item.isVisited ? "check-circle" : "clock-outline"}
            size={14}
            color={getVisitStatusColor(item.isVisited)}
          />
          <Text
            style={[
              styles.visitStatusText,
              { color: getVisitStatusColor(item.isVisited) },
            ]}
          >
            {item.isVisited ? "Visited" : "Pending"}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Plan Name */}
        <View style={styles.infoRow}>
          <Icon name="calendar-text" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Plan:</Text>
          <Text style={styles.infoValue}>{item.planVisitName}</Text>
        </View>

        {/* Plan Type */}
        <View style={styles.infoRow}>
          <Icon name="tag" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Type:</Text>
          <View
            style={[
              styles.planTypeBadge,
              { backgroundColor: getPlanTypeColor(item.planType) + "20" },
            ]}
          >
            <Text
              style={[
                styles.planTypeText,
                { color: getPlanTypeColor(item.planType) },
              ]}
            >
              {item.planTypeName}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.officeAddress}, {item.poBox}
          </Text>
        </View>

        {/* Mobile */}
        <View style={styles.infoRow}>
          <Icon name="phone" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{item.mobile || "--"}</Text>
        </View>

        {/* Plan Start Date */}
        <View style={styles.infoRow}>
          <Icon name="calendar-start" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Start Date:</Text>
          <Text style={styles.infoValue}>{formatDate(item.planStartDate)}</Text>
        </View>

        {/* Visit Details if visited */}
        {item.isVisited && (
          <View style={styles.visitDetailsContainer}>
            <View style={styles.visitDetailsHeader}>
              <Icon name="information" size={16} color="#10B981" />
              <Text style={styles.visitDetailsTitle}>Visit Details</Text>
            </View>
            <View style={styles.visitDetailsContent}>
              <View style={styles.infoRow}>
                <Icon name="clock-check" size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Check In:</Text>
                <Text style={styles.infoValue}>
                  {formatTime(item.isVisited.checkInTimeLog)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="clock-outline" size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Check Out:</Text>
                <Text style={styles.infoValue}>
                  {formatTime(item.isVisited.checkOutTimeLog)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Client Reference */}
        {/* <View style={styles.referenceRow}>
          <Text style={styles.referenceText}>
            Ref: {item.clientReferenceNumber}
          </Text>
        </View> */}
      </View>
    </View>
  );

  if (!plannedVisits || plannedVisits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="calendar-remove" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Planned Visits</Text>
        <Text style={styles.emptySubtitle}>
          No planned visits found for this user
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plannedVisits}
        keyExtractor={(item, index) =>
          item.planVisitDetailXID?.toString() || index.toString()
        }
        renderItem={renderPlannedVisitCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  visitStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  visitStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  planTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  visitDetailsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  visitDetailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  visitDetailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  visitDetailsContent: {
    gap: 8,
  },
  referenceRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  referenceText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
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

export default AsmUserPlannedVisits;
