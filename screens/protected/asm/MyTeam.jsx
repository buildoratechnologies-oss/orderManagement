import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";
import { useGetMyTeamQuery } from "../../../redux/api/asmApiSlice";

export default function MyTeam({ navigation }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, active, inactive

  const { data: myTeamList, isLoading, error } = useGetMyTeamQuery();
  const { asmUserOverview } = useSelector((state) => state.asmSliceState);

  // Helper function to check if user is present today
  const checkTodayAttendance = (pid) => {
    const userAttendance = asmUserOverview?.userAttendances?.find(
      (user) => user.pid === pid
    );
    if (
      !userAttendance ||
      !userAttendance.userAttedance ||
      userAttendance.userAttedance.length === 0
    ) {
      return { isPresent: false, attendanceCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has checked in today
    const todayAttendance = userAttendance.userAttedance.find((att) => {
      const checkInDate = new Date(att.checkInTime);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    });

    return {
      isPresent: !!todayAttendance,
      attendanceCount: userAttendance.userAttedance.length,
      checkInTime: todayAttendance?.checkInTime,
      checkOutTime: todayAttendance?.checkOutTime,
    };
  };

  // Transform API data to expected format
  useEffect(() => {
    if (myTeamList && Array.isArray(myTeamList)) {
      const transformedData = myTeamList.map((member) => {
        const attendanceInfo = checkTodayAttendance(member.pid);

        return {
          pid: member.pid,
          userXid:
            member.pid?.toString() || `USR${member.branches?.lastEditByXid}`,
          cbXid:
            member.branches?.pid?.toString() || `USR${member.branches.pid}`,
          displayname: `${member.firstName} ${member.lastName}`.trim(),
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.mobile,
          long: member?.branches?.long,
          lat: member?.branches?.lat,
          nameEng: member.nameEng, // Company name
          imageUrl: member.imageUrl,
          // Default values for missing fields
          designation: "Sales Executive", // Default designation
          // status: "active", // Default to active
          lastActive: "Recently",
          totalOrders: Math.floor(Math.random() * 100) + 1, // Random for demo
          monthlyOrders: Math.floor(Math.random() * 20) + 1,
          attendanceRate: Math.floor(Math.random() * 40) + 60, // 60-100%
          currentLocation: member.nameEng || "Office",
          targetAchievement: Math.floor(Math.random() * 60) + 40, // 40-100%
          role: "Sales Executive",
          // Attendance info from Redux
          isPresent: attendanceInfo.isPresent,
          attendanceCount: attendanceInfo.attendanceCount,
          checkInTime: attendanceInfo.checkInTime,
          checkOutTime: attendanceInfo.checkOutTime,
        };
      });

      setTeamMembers(transformedData);
    }
  }, [myTeamList, asmUserOverview]);

  // Filter members based on search query and selected filter
  useEffect(() => {
    let filtered = teamMembers;

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((member) => member.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (member) =>
          member.displayname
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          member.userXid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.nameEng?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, teamMembers, selectedFilter]);

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

  const getTargetColor = (achievement) => {
    if (achievement >= 100) return "#10B981";
    if (achievement >= 80) return "#F59E0B";
    return "#EF4444";
  };

  const FilterButton = ({ title, value, active }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const TeamMemberCard = ({ member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInitials}>
          <Text style={styles.initialsText}>
            {member.displayname
              ? member.displayname
                  .split(" ")
                  .map((n) => n?.[0])
                  .filter(Boolean)
                  .join("")
                  .toUpperCase()
              : "??"}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameAndAttendanceRow}>
            <Text style={styles.memberName}>{member.displayname}</Text>
            <View
              style={[
                styles.attendanceBadge,
                {
                  backgroundColor: member.isPresent ? "#10B98120" : "#EF444420",
                },
              ]}
            >
              <View
                style={[
                  styles.attendanceDot,
                  { backgroundColor: member.isPresent ? "#10B981" : "#EF4444" },
                ]}
              />
              <Text
                style={[
                  styles.attendanceText,
                  { color: member.isPresent ? "#10B981" : "#EF4444" },
                ]}
              >
                {member.isPresent ? "Present" : "Absent"}
              </Text>
            </View>
          </View>
          <Text style={styles.memberEmail}>{member.email}</Text>
          <View style={styles.memberMeta}>
            <Text style={styles.memberXid}>ID: {member.userXid}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(member.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(member.status) },
                ]}
              >
                {member.status}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.memberDetails}>
        <View style={styles.detailItem}>
          <View
            style={[
              styles.designationBadge,
              {
                backgroundColor: getDesignationColor(member.designation) + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.designationText,
                { color: getDesignationColor(member.designation) },
              ]}
            >
              {member.designation}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text style={styles.locationText}>{member.currentLocation}</Text>
          <Text style={styles.lastActiveText}>
            • Last active: {member.lastActive}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.profileButton]}
            onPress={() =>
              navigation.navigate("UserProfileDetails", { user: member })
            }
          >
            <Ionicons name="person-outline" size={16} color="#3B82F6" />
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.performanceButton]}
            onPress={() =>
              navigation.navigate("UserPerformance", { user: member })
            }
          >
            <Ionicons name="stats-chart-outline" size={16} color="#10B981" />
            <Text style={styles.performanceButtonText}>Performance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading team members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to load team</Text>
        <Text style={styles.errorSubtitle}>Please try again later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.pid?.toString() || item.userXid}
        renderItem={({ item }) => <TeamMemberCard member={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No team members found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "No team members available"}
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
    paddingBlock: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  memberInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
  },
  nameAndAttendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  attendanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  memberEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberXid: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  memberDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailItem: {
    marginBottom: 12,
  },
  designationBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  designationText: {
    fontSize: 12,
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  lastActiveText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  profileButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  performanceButton: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  performanceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
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
