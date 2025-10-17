import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";

// Mock payment data
const paymentsData = [
  { id: "1", amount: 2500, date: "2025-08-01", status: "Success" },
  { id: "2", amount: 1200, date: "2025-08-05", status: "Pending" },
  { id: "3", amount: 1800, date: "2025-08-07", status: "Failed" },
  { id: "4", amount: 3000, date: "2025-08-12", status: "Success" },
  { id: "5", amount: 750, date: "2025-08-14", status: "Pending" },
  { id: "6", amount: 4200, date: "2025-08-15", status: "Success" },
  { id: "7", amount: 1600, date: "2025-08-16", status: "Failed" },
  { id: "8", amount: 2200, date: "2025-08-17", status: "Success" },
];

function PaymentScreen() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null); // store clicked payment
  const [modalVisible, setModalVisible] = useState(false);

  const pageSize = 5;

  // Filter payments
  const filteredPayments = paymentsData.filter((p) =>
    statusFilter === "All" ? true : p.status === statusFilter
  );

  // Pagination
  const paginatedPayments = filteredPayments.slice(0, page * pageSize);

  const openPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterRow}>
          {["All", "Success", "Pending", "Failed"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.activeFilter,
              ]}
              onPress={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === status && styles.activeFilterText,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment List */}
      <FlatList
        data={paginatedPayments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openPaymentDetails(item)}>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text
                  style={[
                    styles.status,
                    item.status === "Success"
                      ? styles.success
                      : item.status === "Pending"
                      ? styles.pending
                      : styles.failed,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
              <Text style={styles.date}>📅 {item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Pagination */}
      {paginatedPayments.length < filteredPayments.length && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={() => setPage(page + 1)}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      )}

      {/* Popup Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPayment && (
              <>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <Text style={styles.modalText}>
                  💰 Amount: ₹{selectedPayment.amount}
                </Text>
                <Text style={styles.modalText}>
                  📅 Date: {selectedPayment.date}
                </Text>
                <Text
                  style={[
                    styles.modalText,
                    selectedPayment.status === "Success"
                      ? styles.success
                      : selectedPayment.status === "Pending"
                      ? styles.pending
                      : styles.failed,
                  ]}
                >
                  ✅ Status: {selectedPayment.status}
                </Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16,paddingBottom:70 },
  filterSection: { marginBottom: 12 },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#555",
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2078a1ff",
    margin: 4,
  },
  filterText: { color: "#2078a1ff", fontSize: 14 },
  activeFilter: { backgroundColor: "#2078a1ff" },
  activeFilterText: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  amount: { fontSize: 20, fontWeight: "700", color: "#333" },
  status: { fontWeight: "700", fontSize: 16 },
  success: { color: "green" },
  pending: { color: "orange" },
  failed: { color: "red" },
  date: { marginTop: 6, fontSize: 14, color: "#666" },
  loadMoreButton: {
    marginVertical: 15,
    alignSelf: "center",
    backgroundColor: "#2078a1ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loadMoreText: { color: "#fff", fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: { fontSize: 16, marginBottom: 8 },
  closeButton: {
    backgroundColor: "#2078a1ff",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});

export default PaymentScreen;
