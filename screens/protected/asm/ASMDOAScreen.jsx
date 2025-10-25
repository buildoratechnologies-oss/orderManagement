import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

export default function ASMDOAScreen() {
  const [doaData, setDoaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { asmUserOverview } = useSelector((state) => state.asmSliceState);

  useEffect(() => {
    if (asmUserOverview?.doaRequests) {
      setDoaData(asmUserOverview.doaRequests);
      setLoading(false);
    }
  }, [asmUserOverview]);

  const getStatusColor = (requestStatusXid) => {
    switch (requestStatusXid) {
      case 2: // Approved
        return "#10B981";
      case 1: // Pending
        return "#F59E0B";
      case 3: // Rejected
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (requestStatusXid) => {
    switch (requestStatusXid) {
      case 1:
        return "PENDING";
      case 2:
        return "APPROVED";
      case 3:
        return "REJECTED";
      default:
        return "UNKNOWN";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading DOA data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={doaData}
        keyExtractor={(item, index) =>
          `${item.clientXid}-${item.itemXID}-${index}`
        }
        renderItem={({ item }) => (
          <View style={styles.doaCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <Text style={styles.itemName}>{item.itemName}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(item.requestStatusXid) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.requestStatusXid) },
                  ]}
                >
                  {getStatusText(item.requestStatusXid)}
                </Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.issueText}>
                <Text style={styles.label}>Issue: </Text>
                {item.reportIssue}
              </Text>
              {item.remarks && (
                <Text style={styles.remarksText}>
                  <Text style={styles.label}>Remarks: </Text>
                  {item.remarks}
                </Text>
              )}
              <Text style={styles.date}>
                Date: {formatDate(item.reportedDate)}
              </Text>
              {item.doaRequestImages && item.doaRequestImages.length > 0 && (
                <Text style={styles.attachmentText}>
                  📎 {item.doaRequestImages.length} attachment(s)
                </Text>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No DOA records</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingHorizontal: 20, paddingTop: 16 },
  doaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  companyName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  memberName: { fontSize: 14, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardContent: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12 },
  itemName: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  label: { fontWeight: "600", color: "#374151" },
  issueText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 20,
  },
  remarksText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 20,
  },
  date: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  attachmentText: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 6,
    fontWeight: "500",
  },
  emptyContainer: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
});
