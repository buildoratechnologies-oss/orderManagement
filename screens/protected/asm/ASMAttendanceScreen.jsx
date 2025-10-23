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

export default function ASMAttendanceScreen() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMember, setSelectedMember] = useState("all");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    // Mock team members data
    const mockMembers = [
      { userXid: "TM001", displayname: "John Doe" },
      { userXid: "TM002", displayname: "Jane Smith" },
      { userXid: "TM003", displayname: "Mike Johnson" },
      { userXid: "TM004", displayname: "Sarah Wilson" },
      { userXid: "TM005", displayname: "David Brown" },
    ];
    setTeamMembers(mockMembers);
  };

  const fetchAttendanceData = async () => {
    try {
      // Mock attendance data - replace with actual API call
      const mockAttendanceData = [
        {
          id: "1",
          userXid: "TM001",
          displayname: "John Doe",
          date: "2025-01-20",
          status: "present",
          checkInTime: "09:15 AM",
          checkOutTime: "06:30 PM",
          workingHours: "9h 15m",
          location: "Downtown Area",
        },
        {
          id: "2",
          userXid: "TM002",
          displayname: "Jane Smith",
          date: "2025-01-20",
          status: "present",
          checkInTime: "08:45 AM",
          checkOutTime: "05:45 PM",
          workingHours: "9h 00m",
          location: "Business District",
        },
        {
          id: "3",
          userXid: "TM003",
          displayname: "Mike Johnson",
          date: "2025-01-20",
          status: "absent",
          checkInTime: "-",
          checkOutTime: "-",
          workingHours: "0h 00m",
          location: "-",
        },
        {
          id: "4",
          userXid: "TM004",
          displayname: "Sarah Wilson",
          date: "2025-01-20",
          status: "present",
          checkInTime: "08:30 AM",
          checkOutTime: "07:00 PM",
          workingHours: "10h 30m",
          location: "Central Plaza",
        },
        {
          id: "5",
          userXid: "TM005",
          displayname: "David Brown",
          date: "2025-01-20",
          status: "late",
          checkInTime: "10:30 AM",
          checkOutTime: "06:30 PM",
          workingHours: "8h 00m",
          location: "Industrial Zone",
        },
      ];

      setAttendanceData(mockAttendanceData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedMember === "all") {
      return attendanceData;
    }
    return attendanceData.filter(item => item.userXid === selectedMember);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "#10B981";
      case "absent":
        return "#EF4444";
      case "late":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "checkmark-circle";
      case "absent":
        return "close-circle";
      case "late":
        return "time";
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

  const AttendanceCard = ({ item }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.displayname}</Text>
          <Text style={styles.memberDate}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.timeInfo}>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeLabel}>Check In</Text>
            <Text style={styles.timeValue}>{item.checkInTime}</Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeLabel}>Check Out</Text>
            <Text style={styles.timeValue}>{item.checkOutTime}</Text>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="stopwatch-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{item.workingHours}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getAttendanceStats = () => {
    const filtered = getFilteredData();
    const totalRecords = filtered.length;
    const presentCount = filtered.filter(item => item.status === "present").length;
    const absentCount = filtered.filter(item => item.status === "absent").length;
    const lateCount = filtered.filter(item => item.status === "late").length;
    
    return { totalRecords, presentCount, absentCount, lateCount };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading attendance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Attendance</Text>
        <Text style={styles.headerSubtitle}>
          Track team attendance and working hours
        </Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.statValue}>{stats.presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#EF4444" }]}>
          <Text style={styles.statValue}>{stats.absentCount}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
          <Text style={styles.statValue}>{stats.lateCount}</Text>
          <Text style={styles.statLabel}>Late</Text>
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

      {/* Attendance List */}
      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No attendance records</Text>
            <Text style={styles.emptySubtitle}>
              No attendance data available for the selected filter
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
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  attendanceCard: {
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
    alignItems: "center",
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 14,
    color: "#6B7280",
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
  timeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timeItem: {
    alignItems: "center",
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  additionalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
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