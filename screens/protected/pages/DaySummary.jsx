import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
  Image,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useGetDaySummarryDetailsQuery } from "../../../redux/api/protectedApiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDateInFormate } from "../../../util/data";

export default function DaySummary({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Logs modal state
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Format date for API (assuming the API expects a specific format)
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `/${year}-${month}-${day}`; // Adjust format based on your API requirements
  };

  const {
    data: daySummaryData,
    error,
    isLoading,
    refetch
  } = useGetDaySummarryDetailsQuery(formatDateForAPI(selectedDate));

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      const displayName = await AsyncStorage.getItem("displayName");
      setUserDetails({ displayName });
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Handlers for logs modal
  const openLogs = (record) => {
    setSelectedRecord(record);
    setSelectedLogs(Array.isArray(record?.attendanceLogs) ? record.attendanceLogs : []);
    setLogsModalVisible(true);
  };

  const closeLogs = () => {
    setLogsModalVisible(false);
    setSelectedRecord(null);
    setSelectedLogs([]);
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return '#27ae60';
      case 'absent':
        return '#e74c3c';
      case 'leave':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'https://img.icons8.com/ios-filled/50/checkmark.png';
      case 'absent':
        return 'https://img.icons8.com/ios-filled/50/cancel.png';
      case 'leave':
        return 'https://img.icons8.com/ios-filled/50/time.png';
      default:
        return 'https://img.icons8.com/ios-filled/50/help.png';
    }
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const inTime = new Date(checkIn);
    const outTime = new Date(checkOut);
    const diffMs = outTime - inTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const AttendanceCard = ({ record, onPress }) => {
    const isCheckedOut = record.checkOutTime !== null;
    const workingHours = calculateWorkingHours(record.checkInTime, record.checkOutTime);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.attendanceCard, { borderLeftColor: getStatusColor(record.remarks) }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <Image
              source={{ uri: getStatusIcon(record.remarks) }}
              style={[styles.statusIcon, { tintColor: getStatusColor(record.remarks) }]}
            />
            <View>
              <Text style={styles.statusText}>{record.remarks}</Text>
              <Text style={styles.dateText}>{formatDate(record.attendanceDate)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.remarks) }]}>
            <Text style={styles.statusBadgeText}>{record.remarks}</Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/login.png' }}
              style={styles.timeIcon}
            />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Check In</Text>
              <Text style={styles.timeValue}>{formatTime(record.checkInTime) || 'Not recorded'}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/logout.png' }}
              style={styles.timeIcon}
            />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={[styles.timeValue, !isCheckedOut && styles.pendingText]}>
                {isCheckedOut ? formatTime(record.checkOutTime) : 'Still working'}
              </Text>
            </View>
          </View>

          {workingHours && (
            <View style={styles.workingHoursContainer}>
              <Image
                source={{ uri: 'https://img.icons8.com/ios-filled/50/clock.png' }}
                style={styles.timeIcon}
              />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Working Hours</Text>
                <Text style={styles.workingHoursText}>{workingHours}</Text>
              </View>
            </View>
          )}
        </View>

        {(record.loginLatitude && record.loginLongitude) && (
          <View style={styles.locationContainer}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/marker.png' }}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              Location: {record.loginLatitude.toFixed(4)}, {record.loginLongitude.toFixed(4)}
            </Text>
          </View>
        )}

        {Array.isArray(record.attendanceLogs) && record.attendanceLogs.length > 0 && (
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.viewLogsButton} onPress={onPress}>
              <Image
                source={{ uri: 'https://img.icons8.com/ios-glyphs/24/list.png' }}
                style={styles.viewLogsIcon}
              />
              <Text style={styles.viewLogsButtonText}>
                View Logs ({record.attendanceLogs.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading day summary...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Image
            source={{ uri: "https://img.icons8.com/ios/100/error.png" }}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>Failed to load summary</Text>
          <Text style={styles.errorSubtext}>{error.message || "Please try again"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!daySummaryData || daySummaryData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Image
            source={{ uri: "https://img.icons8.com/ios/100/no-data.png" }}
            style={styles.noDataIcon}
          />
          <Text style={styles.noDataText}>No attendance records</Text>
          <Text style={styles.noDataSubtext}>No attendance data found for this date</Text>
        </View>
      );
    }

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryHeaderText}>Attendance Records</Text>
          <Text style={styles.recordCount}>{daySummaryData.length} record{daySummaryData.length !== 1 ? 's' : ''}</Text>
        </View>
        {daySummaryData.map((record, index) => (
          <AttendanceCard
            key={record.pid || index}
            record={record}
            onPress={() => openLogs(record)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Date Selection */}
      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Select Date</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Image
            source={{ uri: "https://img.icons8.com/ios-glyphs/30/calendar.png" }}
            style={styles.calendarIcon}
          />
          <Text style={styles.selectedDateText}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Image
            source={{ uri: "https://img.icons8.com/ios-glyphs/30/expand-arrow.png" }}
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Attendance Logs Modal */}
      <Modal
        visible={logsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeLogs}
      >
        <View style={styles.logsModalOverlay}>
          <View style={styles.logsModalContainer}>
            <View style={styles.logsModalHeader}>
              <Text style={styles.logsModalTitle}>Visit Logs</Text>
              <TouchableOpacity onPress={closeLogs} style={styles.logsCloseButton}>
                <Image
                  source={{ uri: 'https://img.icons8.com/ios-glyphs/24/macos-close.png' }}
                  style={styles.logsCloseIcon}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.logsList}>
              {(!selectedLogs || selectedLogs.length === 0) ? (
                <Text style={styles.logsEmptyText}>No logs available</Text>
              ) : (
                selectedLogs.map((log) => (
                  <View key={log.pid} style={styles.logItem}>
                    <View style={styles.logHeaderRow}>
                      <Text style={styles.logCompany}>{log.companyName || 'Unknown Client'}</Text>
                    </View>
                    <View style={styles.logTimes}>
                      <Text style={styles.logTimeLabel}>In:</Text>
                      <Text style={styles.logTimeValue}>{formatTime(log.checkInTimeLog) || '—'}</Text>
                      <Text style={[styles.logTimeLabel, { marginLeft: 16 }]}>Out:</Text>
                      <Text style={styles.logTimeValue}>{formatTime(log.checkOutTimeLog) || '—'}</Text>
                    </View>
                    {(log.atClientLoginLatitude && log.atClientLoginLongitude) && (
                      <Text style={styles.logLatLng}>
                        {log.atClientLoginLatitude.toFixed(4)}, {log.atClientLoginLongitude.toFixed(4)}
                      </Text>
                    )}
                    <View style={styles.logsDivider} />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#2c3e50',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  dateSection: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  calendarIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#3498db',
  },
  selectedDateText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownIcon: {
    width: 18,
    height: 18,
    tintColor: '#95a5a6',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorIcon: {
    width: 60,
    height: 60,
    tintColor: '#e74c3c',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataIcon: {
    width: 60,
    height: 60,
    tintColor: '#95a5a6',
    marginBottom: 15,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  recordCount: {
    fontSize: 14,
    color: '#7f8c8d',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeContainer: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#7f8c8d',
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  pendingText: {
    color: '#e67e22',
    fontStyle: 'italic',
  },
  workingHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  workingHoursText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#3498db',
  },
  locationText: {
    fontSize: 12,
    color: '#7f8c8d',
    flex: 1,
  },

  // Logs Modal styles
  logsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logsModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  logsCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
  },
  logsCloseIcon: {
    width: 20,
    height: 20,
    tintColor: '#2c3e50',
  },
  logsList: {
    maxHeight: '100%',
  },
  logItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  logTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logTimeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 4,
  },
  logTimeValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  logLatLng: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  logsDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 12,
  },
  logsEmptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: 20,
  },

  // Footer with View Logs button
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewLogsIcon: {
    width: 16,
    height: 16,
    tintColor: 'white',
    marginRight: 6,
  },
  viewLogsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
