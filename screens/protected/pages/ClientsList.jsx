import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// import ClientDetailsModal from "./ClientDetailsModal"; // Import the new modal component
import useProtectedApis from "../../../hooks/useProtectedApis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { compareDates, getDateInFormate } from "../../../util/data";
import { useNavigation } from "@react-navigation/native";
import { useGetClientsQuery } from "../../../redux/api/protectedApiSlice";

const ClientList = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyClients, setNearbyClients] = useState([]);
  const [clients, setClients] = useState(null);
  const [CBXID, setCBXID] = useState(null);
  const [userXid, setUserXid] = useState(null);

  // search
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = useNavigation();

  const { handleGetOutlets } = useProtectedApis();
  const { data: response, isLoading } = useGetClientsQuery(
    { CBXID, userXid },
    { skip: !CBXID || !userXid }
  );

  const requestLocation = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to find nearby clients."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location.coords);
    } catch (e) {
      Alert.alert("Error", "Unable to fetch your location.");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (userLocation && clients) {
      sortClientsByDistance();
    } else {
      setNearbyClients([]);
    }
  }, [userLocation, clients]);

  const sortClientsByDistance = () => {
    const updated = clients?.map((client) => {
      if (
        typeof client.latitude === "number" &&
        typeof client.longatitude === "number"
      ) {
        const distanceInMeters = getDistance(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          { latitude: client.latitude, longitude: client.longatitude }
        );

        const distanceInKm = (distanceInMeters / 1000).toFixed(1);

        return {
          ...client,
          distanceMeters: distanceInMeters,
          distanceLabel: `${distanceInKm} km away`,
        };
      }
      return {
        ...client,
        distanceMeters: Infinity,
        distanceLabel: null,
      };
    });

    // ✅ Sort by nearest first
    const sorted = updated?.sort((a, b) => a.distanceMeters - b.distanceMeters);

    setNearbyClients(sorted);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await requestLocation();
    setRefreshing(false);
  };

  useEffect(() => {
    if (response) {
      setClients(response);
    }
  }, [response]);

  useEffect(() => {
    (async () => {
      const cbxid = await AsyncStorage.getItem("CBXID");
      const userxid = await AsyncStorage.getItem("userXid");
      const attendance = await AsyncStorage.getItem("attendanceLog");
      let date = getDateInFormate();
      if (compareDates(date, attendance)) {
        setCBXID(cbxid);
        setUserXid(userxid);
      } else {
        navigation.navigate("AttendanceScreen");
      }
    })();
  }, []);

  // ✅ Filter by search query
  const filteredClients = nearbyClients?.filter((client) =>
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() =>
        Alert.alert("Client Details", `Opening ${item.companyName}`)
      }
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <Icon name="office-building" size={18} color="#6366f1" />
          <Text style={styles.companyName} numberOfLines={1}>
            {item.companyName}
          </Text>
        </View>
        {item.distanceLabel && (
          <View style={styles.distanceBadge}>
            <Icon name="map-marker-distance" size={12} color="#059669" />
            <Text style={styles.distanceText}>{item.distanceLabel}</Text>
          </View>
        )}
      </View>

      {/* Address */}
      {item.officeAddress && (
        <View style={styles.addressContainer}>
          <Icon name="map-marker" size={14} color="#6b7280" />
          <Text style={styles.addressText} numberOfLines={2}>
            {item.officeAddress}
          </Text>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        {item.mobile && (
          <View style={styles.contactItem}>
            <Icon name="phone" size={14} color="#6b7280" />
            <Text style={styles.contactText}>{item.mobile}</Text>
          </View>
        )}
        {item.clientReferenceNumber && (
          <View style={styles.contactItem}>
            <Icon name="identifier" size={14} color="#6b7280" />
            <Text style={styles.contactText}>
              Ref: {item.clientReferenceNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert("Action", `Visit ${item.companyName}`)}
        >
          <Icon name="arrow-right-circle" size={16} color="#6366f1" />
          <Text style={styles.actionButtonText}>Visit Client</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6366f1" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nearby Clients</Text>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <Icon name="map-search" size={64} color="#6366f1" />
          <ActivityIndicator
            size="large"
            color="#6366f1"
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingTitle}>Finding Your Location</Text>
          <Text style={styles.loadingText}>
            Please wait while we locate nearby clients...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6366f1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nearby Clients</Text>
          <TouchableOpacity
            style={styles.headerRefreshButton}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Icon name="map-marker" size={16} color="#fff" />
            <Text style={styles.statText}>
              {filteredClients?.length || 0} clients found
            </Text>
          </View>
          {userLocation && (
            <View style={styles.statItem}>
              <Icon name="crosshairs-gps" size={16} color="#fff" />
              <Text style={styles.statText}>Location enabled</Text>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon
          name="magnify"
          size={20}
          color="#9ca3af"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {filteredClients?.length > 0 ? (
        <FlatList
          data={filteredClients}
          renderItem={renderItem}
          keyExtractor={(item) => item.pid.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366f1"]}
              tintColor="#6366f1"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="map-marker-off" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No matching clients" : "No clients found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? "Try adjusting your search terms"
              : "Pull to refresh or check your location settings"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Icon name="refresh" size={16} color="#6366f1" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header Styles
  header: {
    backgroundColor: "#6366f1",
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  headerRefreshButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 8,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginLeft: 4,
  },

  // Search Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#374151",
  },
  clearButton: {
    padding: 4,
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Client Card Styles
  clientCard: {
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
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#059669",
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 6,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f9ff",
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
    marginLeft: 6,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingSpinner: {
    marginTop: 16,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
    marginLeft: 6,
  },
});

export default ClientList;
