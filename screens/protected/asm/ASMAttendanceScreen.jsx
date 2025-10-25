import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSelector } from "react-redux";

export default function ASMAttendanceScreen() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [response, setResponse] = useState([]);
  const { asmUserOverview } = useSelector((state) => state.asmSliceState);

  useEffect(() => {
    if (asmUserOverview?.userAttendances) {
      setLoading(true);
      processAttendanceData(asmUserOverview?.userAttendances);
      setLoading(false);
    }
  }, [asmUserOverview]);

  const processAttendanceData = (data) => {
    const attendanceRecords = [];

    data.forEach((user) => {
      // Process user attendance records
      if (user.userAttedance && user.userAttedance.length > 0) {
        user.userAttedance.forEach((attendance) => {
          const checkIn = attendance.checkInTime
            ? new Date(attendance.checkInTime)
            : null;
          const checkOut = attendance.checkOutTime
            ? new Date(attendance.checkOutTime)
            : null;

          // Calculate working hours
          let workingHours = "-";
          if (checkIn && checkOut) {
            const diff = checkOut - checkIn;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            workingHours = `${hours}h ${minutes}m`;
          }

          // Determine status
          let status = "present";
          if (checkIn) {
            const checkInHour = checkIn.getHours();
            if (checkInHour > 9) {
              status = "late";
            }
          }

          // Get location from attendance logs if available
          let location = "Office";
          if (
            attendance.attendanceLogs &&
            attendance.attendanceLogs.length > 0
          ) {
            location = attendance.attendanceLogs[0].companyName || "Office";
          }

          attendanceRecords.push({
            id: attendance.pid.toString(),
            userXid: user.pid.toString(),
            displayname: user.firstName,
            date: checkIn ? checkIn.toLocaleDateString() : "-",
            status: status,
            checkInTime: checkIn
              ? checkIn.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            checkOutTime: checkOut
              ? checkOut.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            workingHours: workingHours,
            location: location,
            attendanceLogs: attendance.attendanceLogs || [],
          });
        });
      } else {
        // User with no attendance - mark as absent
        attendanceRecords.push({
          id: `absent-${user.pid}`,
          userXid: user.pid.toString(),
          displayname: user.firstName,
          date: new Date().toLocaleDateString(),
          status: "absent",
          checkInTime: "-",
          checkOutTime: "-",
          workingHours: "0h 00m",
          location: "-",
          attendanceLogs: [],
        });
      }
    });

    setAttendanceData(attendanceRecords);
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

  const AttendanceCard = ({ item }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.displayname}</Text>
          <Text style={styles.memberDate}>{item.date}</Text>
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
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(
      (item) => item.status === "present"
    ).length;
    const absentCount = attendanceData.filter(
      (item) => item.status === "absent"
    ).length;
    const lateCount = attendanceData.filter(
      (item) => item.status === "late"
    ).length;

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

      {/* Attendance List */}
      <FlatList
        data={attendanceData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No attendance records</Text>
            <Text style={styles.emptySubtitle}>
              No attendance data available
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
    paddingTop:15
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
