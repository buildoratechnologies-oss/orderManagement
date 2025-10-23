import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ASMDashboard({ navigation }) {
  const [dashboardStats, setDashboardStats] = useState({
    totalTeamMembers: 0,
    activeMembers: 0,
    todayAttendance: 0,
    monthlyOrders: 0,
    pendingDOA: 0,
    liveExecutives: 0,
    targetsAchieved: 0,
    totalTargets: 0,
  });

  useEffect(() => {
    // Mock data - replace with actual API calls
    setDashboardStats({
      totalTeamMembers: 12,
      activeMembers: 10,
      todayAttendance: 8,
      monthlyOrders: 145,
      pendingDOA: 5,
      liveExecutives: 6,
      targetsAchieved: 8,
      totalTargets: 12,
    });
  }, []);

  const StatCard = ({ title, value, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ModuleCard = ({ title, subtitle, icon, color, onPress, badge }) => (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress}>
      <View style={[styles.moduleIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={32} color={color} />
        {badge && badge > 0 && (
          <View style={styles.moduleBadge}>
            <Text style={styles.moduleBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleSubtitle}>{subtitle}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.moduleArrow} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Management Overview</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Team Members"
          value={dashboardStats.totalTeamMembers}
          subtitle={`${dashboardStats.activeMembers} active`}
          icon="people"
          color="#3B82F6"
          onPress={() => navigation.navigate("MyTeam")}
        />
        <StatCard
          title="Today's Attendance"
          value={`${dashboardStats.todayAttendance}/${dashboardStats.totalTeamMembers}`}
          subtitle={`${Math.round((dashboardStats.todayAttendance/dashboardStats.totalTeamMembers)*100)}% present`}
          icon="calendar"
          color="#10B981"
          onPress={() => navigation.navigate("ASMAttendance")}
        />
        <StatCard
          title="Monthly Orders"
          value={dashboardStats.monthlyOrders}
          icon="bag"
          color="#8B5CF6"
          onPress={() => navigation.navigate("ASMOrders")}
        />
        <StatCard
          title="Live Executives"
          value={dashboardStats.liveExecutives}
          subtitle="Currently active"
          icon="radio"
          color="#F59E0B"
          onPress={() => navigation.navigate("ASMLive")}
        />
      </View>

      {/* Module Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Management</Text>
        
        <View style={styles.moduleGrid}>
          <ModuleCard
            title="My Team"
            subtitle="View and manage team members"
            icon="people-outline"
            color="#3B82F6"
            onPress={() => navigation.navigate("MyTeam")}
          />
          
          <ModuleCard
            title="Attendance"
            subtitle="Track team attendance"
            icon="calendar-outline"
            color="#10B981"
            onPress={() => navigation.navigate("ASMAttendance")}
          />
        </View>

        <View style={styles.moduleGrid}>
          <ModuleCard
            title="Orders"
            subtitle="Monitor team orders"
            icon="bag-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate("ASMOrders")}
          />
          
          <ModuleCard
            title="DOA"
            subtitle="Daily operation activities"
            icon="document-text-outline"
            color="#EF4444"
            onPress={() => navigation.navigate("ASMDOA")}
            badge={dashboardStats.pendingDOA}
          />
        </View>

        <View style={styles.moduleGrid}>
          <ModuleCard
            title="Live Tracking"
            subtitle="Real-time executive tracking"
            icon="radio-outline"
            color="#F59E0B"
            onPress={() => navigation.navigate("ASMLive")}
          />
          
          <ModuleCard
            title="Targets"
            subtitle="Team performance targets"
            icon="trophy-outline"
            color="#06B6D4"
            onPress={() => navigation.navigate("ASMTargets")}
          />
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Team Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: "#10B981" }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>5 team members marked attendance</Text>
              <Text style={styles.activityTime}>30 minutes ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: "#3B82F6" }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>New order submitted by John Doe</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: "#F59E0B" }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>DOA request pending approval</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statsContainer: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 48) / 2,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statCardInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  moduleGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  moduleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  moduleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  moduleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  moduleBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  moduleSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  moduleArrow: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});