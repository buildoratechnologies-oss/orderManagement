import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetUserOverviewByIdQuery } from "../../../redux/api/asmApiSlice";

const { width } = Dimensions.get("window");

export default function UserProfileDetails({ route, navigation }) {
  const { user } = route.params || {};
  const { data: overviewById } = useGetUserOverviewByIdQuery(user?.userXid, {
    skip: !user?.userXid,
  });

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>No user data available</Text>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "inactive":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getDesignationColor = (designation) => {
    switch (designation) {
      case "Team Lead":
        return "#8B5CF6";
      case "Senior Sales Executive":
        return "#F59E0B";
      case "Sales Executive":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const handleCall = () => {
    if (user.phone) {
      Linking.openURL(`tel:${user.phone}`);
    } else {
      Alert.alert("No Phone Number", "Phone number is not available for this user.");
    }
  };

  const handleEmail = () => {
    if (user.email) {
      Linking.openURL(`mailto:${user.email}`);
    } else {
      Alert.alert("No Email", "Email is not available for this user.");
    }
  };

  const handleTrack = () => {
    // const latitude = overviewById?.salesExecutiveLiveLocations?.latitude;
    // const longitude = overviewById?.salesExecutiveLiveLocations?.longitude;

    if (user?.lat && user?.long) {
      // Open in Google Maps
      const url = `https://www.google.com/maps/search/?api=1&query=${user?.lat},${user?.long}`;
      Linking.openURL(url);
    } else {
      Alert.alert(
        "Location Unavailable",
        "Location data is not available for this user."
      );
    }
  };

  const InfoCard = ({ title, children }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );

  const InfoRow = ({ icon, label, value, color = "#374151" }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.displayname
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.displayname}</Text>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.designationBadge,
                  {
                    backgroundColor:
                      getDesignationColor(user.designation || user.role) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.designationText,
                    {
                      color: getDesignationColor(user.designation || user.role),
                    },
                  ]}
                >
                  {user.designation || user.role}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(user.status) + "20" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(user.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(user.status) },
                  ]}
                >
                  {user.status?.toUpperCase() || "ACTIVE"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Button */}
        <TouchableOpacity
          style={styles.performanceButton}
          onPress={() => navigation.navigate("UserPerformance", { user })}
        >
          <Ionicons name="analytics" size={24} color="white" />
          <Text style={styles.performanceButtonText}>View Performance</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Contact Information */}
      <InfoCard title="Contact Information">
        <InfoRow icon="mail-outline" label="Email" value={user.email} />
        <InfoRow icon="call-outline" label="Phone" value={user.phone} />
        <InfoRow
          icon="location-outline"
          label="Location Status"
          value={
            overviewById?.salesExecutiveLiveLocations?.isOnline
              ? "Online"
              : "Offline"
          }
          color={
            overviewById?.salesExecutiveLiveLocations?.isOnline
              ? "#10B981"
              : "#EF4444"
          }
        />
        <InfoRow
          icon="time-outline"
          label="Last Updated"
          value={
            overviewById?.salesExecutiveLiveLocations?.capturedAt
              ? new Date(
                  overviewById.salesExecutiveLiveLocations.capturedAt
                ).toLocaleString()
              : "Unknown"
          }
        />
      </InfoCard>

      {/* Performance Overview */}
      <InfoCard title="Performance Overview">
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Orders"
            value={overviewById?.salesOrders?.length || 0}
            subtitle="Orders created"
            color="#3B82F6"
            icon="bag"
          />
          <StatCard
            title="Attendance"
            value={overviewById?.isPresent === 1 ? "Present" : "Absent"}
            subtitle="Today's status"
            color={overviewById?.isPresent === 1 ? "#10B981" : "#EF4444"}
            icon="calendar"
          />
          <StatCard
            title="Planned Visits"
            value={overviewById?.plannedCount || 0}
            subtitle="Scheduled today"
            color="#F59E0B"
            icon="map"
          />
          <StatCard
            title="DOA Requests"
            value={overviewById?.doaRequest?.length || 0}
            subtitle="Total requests"
            color="#8B5CF6"
            icon="document-text"
          />
        </View>
      </InfoCard>

      {/* Work Information */}
      <InfoCard title="Work Information">
        <InfoRow icon="business-outline" label="Department" value="Sales" />
        <InfoRow
          icon="person-outline"
          label="Manager"
          value="Area Sales Manager"
        />
        <InfoRow icon="calendar-outline" label="Join Date" value="Jan 2023" />
        <InfoRow
          icon="briefcase-outline"
          label="Employee ID"
          value={user.userXid}
        />
      </InfoCard>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleCall}
        >
          <Ionicons name="call" size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleEmail}
        >
          <Ionicons name="mail" size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleTrack}
        >
          <Ionicons name="location" size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>Track</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: "white",
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  designationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  designationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  performanceButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  performanceButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    width: (width - 80) / 2,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  secondaryButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
});
