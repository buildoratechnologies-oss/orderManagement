import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useGetAllDOAQuery } from "../../../../redux/api/asmApiSlice";
import { useGetDoaListQuery } from "../../../../redux/api/doaApiSlice";

export default function AsmUserDOA({ userXid }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
    const { data: allDOA = [], isLoading, error } = useGetDoaListQuery();

  
  // Filter DOA by user pid/userXid
  const userDOA = allDOA.filter(item => 
    item.userPid === parseInt(userXid) || 
    item.userXid === userXid ||
    item.pid === parseInt(userXid)
  );

  const monthLabel = useMemo(() => selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }), [selectedMonth]);

  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
  const targetKey = monthKey(selectedMonth);

  const filtered = userDOA.filter((item) => {
    if (!item?.reportedDate) return false;
    const d = new Date(item.reportedDate);
    return monthKey(d) === targetKey;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 1: return '#10B981'; // Active/Approved
      case 2: return '#F59E0B'; // Pending
      case 3: return '#EF4444'; // Rejected
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1: return 'Approved';
      case 2: return 'Pending';
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading DOA records...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load DOA records</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>DOA by month</Text>
        <TouchableOpacity style={styles.monthBtn} onPress={() => setOpen(true)}>
          <Text style={styles.monthText}>{monthLabel}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>Total DOA: {filtered.length}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item?.pid || idx)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: getStatusColor(item.requestStatusXid), borderLeftWidth: 4 }]}>
            <Text style={styles.cardTitle}>{item.companyName}</Text>
            <Text style={styles.row}>Item: {item.itemName}</Text>
            <Text style={[styles.row, { color: getStatusColor(item.requestStatusXid), fontWeight: '600' }]}>
              Status: {getStatusText(item.requestStatusXid)}
            </Text>
            {item.reportedDate && (
              <Text style={styles.row}>Date: {new Date(item.reportedDate).toLocaleDateString()}</Text>
            )}
            {item.description && (
              <Text style={styles.row}>Description: {item.description}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={() => <Text style={styles.empty}>No DOA records in selected month</Text>}
      />

      <DateTimePickerModal
        isVisible={open}
        mode="date"
        onConfirm={(date) => { setOpen(false); setSelectedMonth(date); }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  monthBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  monthText: { color: '#6366f1', fontWeight: '600' },
  count: { marginTop: 10, marginBottom: 10, color: '#374151' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 12, borderRadius: 10 },
  cardTitle: { fontWeight: '700', color: '#111827', marginBottom: 4 },
  row: { color: '#374151', marginTop: 2 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12, textAlign: 'center' },
  errorSubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
});
