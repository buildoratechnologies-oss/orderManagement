import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Users({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.displayname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.userXid.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Mock data - replace with actual API call
      const mockUsers = [
        {
          userXid: "USR001",
          displayname: "John Doe",
          email: "john.doe@company.com",
          phone: "+1234567890",
          role: "Sales Representative",
          status: "active",
          lastActive: "2 hours ago",
          totalOrders: 45,
          monthlyOrders: 8,
          attendanceRate: 95,
        },
        {
          userXid: "USR002",
          displayname: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "+1234567891",
          role: "Area Manager",
          status: "active",
          lastActive: "1 hour ago",
          totalOrders: 62,
          monthlyOrders: 12,
          attendanceRate: 98,
        },
        {
          userXid: "USR003",
          displayname: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "+1234567892",
          role: "Sales Representative",
          status: "inactive",
          lastActive: "2 days ago",
          totalOrders: 23,
          monthlyOrders: 3,
          attendanceRate: 78,
        },
        {
          userXid: "USR004",
          displayname: "Sarah Wilson",
          email: "sarah.wilson@company.com",
          phone: "+1234567893",
          role: "Team Lead",
          status: "active",
          lastActive: "30 minutes ago",
          totalOrders: 89,
          monthlyOrders: 15,
          attendanceRate: 99,
        },
        {
          userXid: "USR005",
          displayname: "David Brown",
          email: "david.brown@company.com",
          phone: "+1234567894",
          role: "Sales Representative",
          status: "active",
          lastActive: "4 hours ago",
          totalOrders: 34,
          monthlyOrders: 6,
          attendanceRate: 85,
        },
      ];

      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to fetch users");
      setLoading(false);
    }
  };

  const navigateToUserDetail = (user) => {
    navigation.navigate("UserProfileDetails", {
      user: user,
    });
  };

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

  const getRoleColor = (role) => {
    switch (role) {
      case "Area Manager":
        return "#8B5CF6";
      case "Team Lead":
        return "#F59E0B";
      case "Sales Representative":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const UserCard = ({ user }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigateToUserDetail(user)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInitials}>
          <Text style={styles.initialsText}>
            {user.displayname
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.displayname}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.userXid}>ID: {user.userXid}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(user.status) + "20" },
              ]}
            >
              <Text
                style={[styles.statusText, { color: getStatusColor(user.status) }]}
              >
                {user.status}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailItem}>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(user.role) + "20" },
            ]}
          >
            <Text
              style={[styles.roleText, { color: getRoleColor(user.role) }]}
            >
              {user.role}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.monthlyOrders}</Text>
            <Text style={styles.statLabel}>Monthly Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.attendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>

        <View style={styles.lastActive}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text style={styles.lastActiveText}>
            Last active: {user.lastActive}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users ({filteredUsers.length})</Text>
        <Text style={styles.headerSubtitle}>
          Manage and view user performance
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or ID..."
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
        data={filteredUsers}
        keyExtractor={(item) => item.userXid}
        renderItem={({ item }) => <UserCard user={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "No users available"}
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
  listContainer: {
    paddingHorizontal: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userInitials: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  userXid: {
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
  userDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailItem: {
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  lastActive: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastActiveText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 4,
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