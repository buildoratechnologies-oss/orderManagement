import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomDropdown from "../../../../components/CustomDropDown";
import { useGetAllAttendanceQuery } from "../../../../redux/api/attendanceApiSlice";

export default function AsmUserAttendance({ userXid }) {
  const currentYear = new Date().getFullYear();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const {
    data: attendanceList = [],
    isLoading,
    refetch,
    isFetching,
  } = useGetAllAttendanceQuery({ userXid }, { skip: !userXid });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => 2010 + i);

  useEffect(() => {
    filterData();
  }, [selectedMonth, selectedYear, attendanceData]);

  const fetchAttendance = async () => {
    try {
      if (attendanceList) {
        refetch();
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendanceData([]);
    }
  };

  useEffect(() => {
    if (attendanceList) {
      setAttendanceData(attendanceList);
    }
  }, [attendanceList]);

  const filterData = () => {
    if (!attendanceData || attendanceData.length === 0) {
      setFilteredData([]);
      return;
    }

    const filtered = attendanceData.filter((item) => {
      if (!item.attendanceDate) {
        return false;
      }

      // Parse the date safely
      let itemDate;
      try {
        itemDate = new Date(item.attendanceDate);

        // Check if date is valid
        if (isNaN(itemDate.getTime())) {
          return false;
        }
      } catch (error) {
        return false;
      }

      const itemMonth = itemDate.getMonth();
      const itemYear = itemDate.getFullYear();

      return itemMonth === selectedMonth && itemYear === selectedYear;
    });

    setFilteredData(filtered);
  };

  const openLogs = (logs) => {
    setSelectedLogs(logs);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const status = item.attStatusXid === 1 ? "Present" : "Absent";
    const statusColor = item.attStatusXid === 1 ? "#10b981" : "#ef4444";
    const statusBgColor = item.attStatusXid === 1 ? "#d1fae5" : "#fee2e2";
    const date = new Date(item.attendanceDate);
    const checkInTime = new Date(item.checkInTime);
    const checkOutTime = item.checkOutTime ? new Date(item.checkOutTime) : null;

    return (
      <View style={styles.attendanceCard}>
        {/* Header with Date and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Icon name="calendar" size={16} color="#6b7280" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusBgColor }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* Time Information */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Icon name="login" size={18} color="#6366f1" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Check In</Text>
                <Text style={styles.timeValue}>
                  {checkInTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.timeItem}>
              <Icon name="logout" size={18} color="#f59e0b" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Check Out</Text>
                <Text style={styles.timeValue}>
                  {checkOutTime
                    ? checkOutTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Remarks */}
        {item.remarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}

        {/* View Logs Button */}
        {item.attendanceLogs && item.attendanceLogs.length > 0 && (
          <TouchableOpacity
            style={styles.logsButton}
            onPress={() => openLogs(item.attendanceLogs)}
          >
            <Icon name="eye" size={16} color="#6366f1" />
            <Text style={styles.logsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.resultsInfoBar}>
          <Icon name="calendar-check" size={16} color="#6366f1" />
          <Text style={styles.resultsText}>
            {filteredData.length} records in {months[selectedMonth]} {selectedYear}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="filter-variant" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={fetchAttendance}
          >
            <Icon name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading || isFetching ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptySubtitle}>
                No attendance records for {months[selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity
                style={styles.currentMonthButton}
                onPress={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth());
                  setSelectedYear(now.getFullYear());
                }}
              >
                <Text style={styles.currentMonthButtonText}>
                  View Current Month
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Logs Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Logs</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#475569" />
              </Pressable>
            </View>

            {selectedLogs.length > 0 ? (
              <ScrollView style={{ marginTop: 10 }}>
                {selectedLogs.map((log, idx) => (
                  <View key={idx} style={styles.logCard}>
                    {log.companyName && (
                      <View style={styles.logRow}>
                        <Icon
                          name="office-building"
                          size={18}
                          color="#16A34A"
                        />
                        <Text style={styles.logText}>
                          Company: {log.companyName}
                        </Text>
                      </View>
                    )}

                    <View style={styles.logRow}>
                      <Icon name="login" size={18} color="#0EA5E9" />
                      <Text style={styles.logText}>
                        Check In: {new Date(log.checkInTimeLog).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.logRowIndented}>
                      <Icon name="map-marker" size={16} color="#EF4444" />
                      <Text style={styles.logSubText}>
                        {log.atClientLoginLatitude}, {log.atClientLoginLongitude}
                      </Text>
                    </View>

                    <View style={styles.logRow}>
                      <Icon name="logout" size={18} color="#F59E0B" />
                      <Text style={styles.logText}>
                        Check Out: {log.checkOutTimeLog ? new Date(log.checkOutTimeLog).toLocaleTimeString() : "—"}
                      </Text>
                    </View>
                    {log.checkOutTimeLog && (
                      <View style={styles.logRowIndented}>
                        <Icon name="map-marker" size={16} color="#22C55E" />
                        <Text style={styles.logSubText}>
                          {log.atClientLogoutLatitude}, {log.atClientLogoutLongitude}
                        </Text>
                      </View>
                    )}

                    {log.remarks && (
                      <View style={styles.logRemarksContainer}>
                        <Icon
                          name="message-text-outline"
                          size={16}
                          color="#64748B"
                        />
                        <Text style={styles.logRemarks}> {log.remarks}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ marginTop: 20, textAlign: "center", color: "#475569" }}>
                No logs available
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.filterModalContent]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Attendance</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.filterOptions}>
              <View style={styles.filterOption}>
                <Text style={styles.filterOptionLabel}>Month</Text>
                <CustomDropdown
                  options={months.map((m, i) => ({ label: m, value: i }))}
                  selectedValue={selectedMonth}
                  onValueChange={(val) => setSelectedMonth(val)}
                />
              </View>

              <View style={styles.filterOption}>
                <Text style={styles.filterOptionLabel}>Year</Text>
                <CustomDropdown
                  options={years.map((y) => ({ label: `${y}`, value: y }))}
                  selectedValue={selectedYear}
                  onValueChange={(val) => setSelectedYear(val)}
                />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth());
                  setSelectedYear(now.getFullYear());
                }}
              >
                <Icon name="calendar-today" size={16} color="#6366f1" />
                <Text style={styles.quickActionText}>Current Month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setSelectedMonth(lastMonth.getMonth());
                  setSelectedYear(lastMonth.getFullYear());
                }}
              >
                <Icon name="calendar-arrow-left" size={16} color="#6366f1" />
                <Text style={styles.quickActionText}>Last Month</Text>
              </TouchableOpacity>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    backgroundColor: "#6e70b3ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 8,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  resultsInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resultsText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Loading
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  currentMonthButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  currentMonthButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // List
  listContainer: {
    paddingBottom: 20,
  },

  // Attendance Cards
  attendanceCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Time Section
  timeSection: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeInfo: {
    marginLeft: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },

  // Remarks
  remarksSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  remarksText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },

  // Logs Button
  logsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  logsButtonText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "500",
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },

  // Log Card Styles
  logCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logRowIndented: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 24,
    marginBottom: 4,
  },
  logText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  logSubText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  logRemarksContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  logRemarks: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
  },

  // Filter Modal Styles
  filterModalContent: {
    maxHeight: "60%",
  },
  filterOptions: {
    marginBottom: 5,
  },
  filterOption: {
    marginBottom: 0,
  },
  filterOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 0,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 12,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    flex: 1,
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
    marginLeft: 6,
  },
  applyFilterButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  applyFilterButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
