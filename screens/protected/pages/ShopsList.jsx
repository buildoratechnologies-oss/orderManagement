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
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";

import ClientDetailsModal from "./ClientDetailsModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { compareDates, getDateInFormate } from "../../../util/data";
import { useNavigation } from "@react-navigation/native";
import { useGetClientsWithPlannedQuery } from "../../../redux/api/protectedApiSlice";

const DEFAULT_RADIUS_KM = 5;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

const ShopsList = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyClients, setNearbyClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [plannedVisits, setPlannedVisits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("All"); // Tab state
  const [allShopsData, setAllShopsData] = useState([]);
  const [plannedVisitsData, setPlannedVisitsData] = useState([]);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);

  const navigation = useNavigation();
  const {
    data: response,
    isLoading,
    refetch,
  } = useGetClientsWithPlannedQuery();

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
    if (activeTab === "All" && userLocation && clients.length) {
      filterClientsByDistance();
    } else if (
      activeTab === "Planned" &&
      (clients.length || plannedVisits.length)
    ) {
      filterClientsByDistance();
    } else {
      setNearbyClients([]);
    }
  }, [userLocation, clients, plannedVisits, activeTab, radiusKm]);

  const filterClientsByDistance = () => {
    let filtered = [];

    if (activeTab === "All" && userLocation) {
      const withinMeters = radiusKm * 1000;

      // Process regular clients
      const processedClients =
        clients
          ?.map((client) => {
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
              const isWithinRange = distanceInMeters <= withinMeters;
              const distanceInKm = (distanceInMeters / 1000).toFixed(1);
              return {
                ...client,
                distanceMeters: distanceInMeters,
                distanceLabel: `${distanceInKm} km away`,
                isWithinRange,
                dataType: "client",
                tabCategory: "All Shops",
              };
            }
            return {
              ...client,
              isWithinRange: false,
              distanceMeters: Infinity,
              distanceLabel: null,
              dataType: "client",
              tabCategory: "All Shops",
            };
          })
          .filter((c) => c.isWithinRange) || [];

      filtered = processedClients.sort(
        (a, b) => a.distanceMeters - b.distanceMeters
      );
      setAllShopsData(filtered);
    } else if (activeTab === "Planned") {
      // Process planned visits from the plannedVisits array
      const processedPlannedVisits =
        plannedVisits?.map((visit) => {
          let distanceLabel = null;
          let distanceMeters = null;

          // Calculate distance for planned visits if user location and visit coordinates are available
          if (
            userLocation &&
            typeof visit.latitude === "number" &&
            typeof visit.longatitude === "number"
          ) {
            distanceMeters = getDistance(
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              { latitude: visit.latitude, longitude: visit.longatitude }
            );
            const distanceInKm = (distanceMeters / 1000).toFixed(1);
            distanceLabel = `${distanceInKm} km away`;
          }

          return {
            ...visit,
            planned: true,
            distanceMeters,
            distanceLabel,
            dataType: "plannedVisit",
            tabCategory: "Planned Visits",
          };
        }) || [];

      // Sort planned visits by date first, then by distance
      filtered = processedPlannedVisits.sort((a, b) => {
        // First sort by start date if available
        if (a.planStartDate && b.planStartDate) {
          const dateA = new Date(a.planStartDate);
          const dateB = new Date(b.planStartDate);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
        }
        // Then sort by distance
        return (a.distanceMeters || Infinity) - (b.distanceMeters || Infinity);
      });

      setPlannedVisitsData(filtered);
    }

    setNearbyClients(filtered);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();

    // await requestLocation();
    setRefreshing(false);
  };

  // Handle location button press
  const handleLocationPress = (client) => {
    if (!client.latitude || !client.longatitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for this client.",
        [{ text: "OK" }]
      );
      return;
    }

    const latitude = client.latitude;
    const longitude = client.longatitude;
    const label = client.companyName || "Client Location";

    // Create a more detailed location info
    const distanceInfo = client.distanceLabel
      ? `\n🚗 Distance: ${client.distanceLabel}`
      : "";
    const locationInfo =
      `📍 ${client.companyName}${distanceInfo}\n\n` +
      `📍 ${client.officeAddress || "Address not available"}\n\n` +
      `📞 ${client.mobile || "Phone not available"}\n\n` +
      `🗺️ Coordinates:\nLat: ${latitude}\nLng: ${longitude}`;

    Alert.alert("📍 Client Location", locationInfo, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Navigate",
        onPress: () => openNavigation(latitude, longitude, label),
      },
      {
        text: "Google Maps",
        onPress: () => openInGoogleMaps(latitude, longitude, label),
      },
      {
        text: "More Options",
        onPress: () =>
          showMoreLocationOptions(latitude, longitude, label, client),
      },
    ]);
  };

  // Open in Google Maps
  const openInGoogleMaps = (latitude, longitude, label) => {
    const appUrl = Platform.select({
      ios: `comgooglemaps://?q=${latitude},${longitude}&zoom=16`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&zoom=16`;

    // Try to open in Google Maps app first, then fallback to web
    Linking.canOpenURL(appUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(appUrl);
        } else {
          // Fallback to web version
          return Linking.openURL(webUrl);
        }
      })
      .catch((error) => {
        console.error(
          "Error opening Google Maps app, trying web version:",
          error
        );
        // If app fails, try web version
        Linking.openURL(webUrl).catch((webError) => {
          console.error("Error opening Google Maps web:", webError);
          Alert.alert(
            "Error",
            "Unable to open Google Maps. Please check if you have a maps app installed.",
            [{ text: "OK" }]
          );
        });
      });
  };

  // Open in Apple Maps
  const openInAppleMaps = (latitude, longitude, label) => {
    const url = `http://maps.apple.com/?q=${encodeURIComponent(
      label
    )}&ll=${latitude},${longitude}&z=16`;

    Linking.openURL(url).catch((error) => {
      console.error("Error opening Apple Maps:", error);
      Alert.alert("Error", "Unable to open Apple Maps");
    });
  };

  // Open navigation with best available app
  const openNavigation = (latitude, longitude, label) => {
    const destination = `${latitude},${longitude}`;

    const navigationUrl = Platform.select({
      ios: `maps://app?daddr=${destination}&dirflg=d`,
      android: `google.navigation:q=${destination}&mode=d`,
    });

    Linking.canOpenURL(navigationUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(navigationUrl);
        } else {
          // Fallback to Google Maps web with directions
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      })
      .catch((error) => {
        console.error("Navigation error:", error);
        Alert.alert("Error", "Unable to open navigation app");
      });
  };

  // Show more location options
  const showMoreLocationOptions = (latitude, longitude, label, client) => {
    Alert.alert(
      "More Options",
      `Additional options for ${client.companyName}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Apple Maps",
          onPress: () => openInAppleMaps(latitude, longitude, label),
        },
        {
          text: "Copy Coordinates",
          onPress: () => copyCoordinates(latitude, longitude),
        },
        {
          text: "Share Location",
          onPress: () => shareLocation(latitude, longitude, client),
        },
      ]
    );
  };

  // Copy coordinates to clipboard
  const copyCoordinates = async (latitude, longitude) => {
    const coordinates = `${latitude}, ${longitude}`;

    try {
      await Clipboard.setStringAsync(coordinates);
      Alert.alert(
        "📋 Copied!",
        `Coordinates copied to clipboard:\n${coordinates}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error copying coordinates:", error);
      Alert.alert("Error", "Failed to copy coordinates to clipboard", [
        { text: "OK" },
      ]);
    }
  };

  // Share location
  const shareLocation = (latitude, longitude, client) => {
    const shareText =
      `📍 ${client.companyName}\n` +
      `📧 ${client.officeAddress || "Address not available"}\n` +
      `📞 ${client.mobile || "Phone not available"}\n\n` +
      `🗺️ Location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      // You can integrate with React Native Share here if available
      // For now, we'll copy the share text to clipboard
      Clipboard.setStringAsync(shareText);
      Alert.alert(
        "📤 Location Info Copied",
        "Location details have been copied to clipboard. You can paste and share it.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error sharing location:", error);
      Alert.alert("Error", "Failed to prepare location for sharing");
    }
  };

  useEffect(() => {
    (async () => {
      const attendance = await AsyncStorage.getItem("attendanceLog");
      let date = getDateInFormate();
      if (compareDates(date, attendance)) {
        if (response) {
          // Set clients array
          if (response.clients) {
            setClients(response.clients);
          }
          // Set planned visits array
          if (response.plannedVisits) {
            setPlannedVisits(response.plannedVisits);
          }
        }
      } else {
        navigation.navigate("AttendanceScreen");
      }
    })();
  }, [response]);

  const renderItem = ({ item }) => {
    // Handle different data structures for clients vs planned visits
    const displayName = item.companyName || "Unknown Shop";
    const displayAddress = item.officeAddress || "Address not available";
    const displayMobile = item.mobile || "Phone not available";
    const displayRef =
      item.clientReferenceNumber ||
      (item.pid ? `ID: ${item.pid}` : "No reference");

    // Enhanced styling based on data type
    const isPlannedVisit = item.dataType === "plannedVisit";
    const cardStyle = isPlannedVisit
      ? [styles.shopCard, styles.plannedVisitCard]
      : styles.shopCard;

    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => {
          setSelectedClient(item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {/* Tab Category Header */}
        {item.tabCategory && (
          <View style={styles.categoryHeader}>
            <Icon
              name={isPlannedVisit ? "calendar-star" : "store-marker"}
              size={12}
              color={isPlannedVisit ? "#7c3aed" : "#10b981"}
            />
            <Text style={styles.categoryText}>{item.tabCategory}</Text>
          </View>
        )}

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.shopInfo}>
            <Icon
              name={isPlannedVisit ? "calendar-check" : "store"}
              size={18}
              color={isPlannedVisit ? "#dc2626" : "#6366f1"}
            />
            <Text style={styles.shopName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {item.distanceLabel && (
              <View style={styles.distanceBadge}>
                <Icon name="map-marker-distance" size={12} color="#059669" />
                <Text style={styles.distanceText}>{item.distanceLabel}</Text>
              </View>
            )}
            {(item.planned || isPlannedVisit) && (
              <View style={styles.plannedBadge}>
                <Icon name="calendar-check" size={12} color="#dc2626" />
                <Text style={styles.plannedText}>
                  {isPlannedVisit ? "Scheduled" : "Planned"}
                </Text>
              </View>
            )}
            {item.planVisitName && (
              <View style={styles.planNameBadge}>
                <Icon name="clipboard-text" size={12} color="#7c3aed" />
                <Text style={styles.planNameText}>{item.planVisitName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address */}
        {displayAddress && displayAddress !== "Address not available" && (
          <View style={styles.addressContainer}>
            <Icon name="map-marker" size={14} color="#6b7280" />
            <Text style={styles.addressText} numberOfLines={2}>
              {displayAddress}
            </Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          {displayMobile && displayMobile !== "Phone not available" && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color="#6b7280" />
              <Text style={styles.contactText}>{displayMobile}</Text>
            </View>
          )}
          {displayRef && (
            <View style={styles.contactItem}>
              <Icon name="identifier" size={14} color="#6b7280" />
              <Text style={styles.contactText}>Ref: {displayRef}</Text>
            </View>
          )}

          {/* Enhanced info for planned visits */}
          {isPlannedVisit && (
            <>
              {item.planStartDate && (
                <View style={styles.contactItem}>
                  <Icon name="calendar-clock" size={14} color="#dc2626" />
                  <Text style={[styles.contactText, styles.plannedContactText]}>
                    Start: {new Date(item.planStartDate).toLocaleDateString()}{" "}
                    {new Date(item.planStartDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
              {item.planEndDate && (
                <View style={styles.contactItem}>
                  <Icon name="calendar-check" size={14} color="#059669" />
                  <Text style={styles.contactText}>
                    End: {new Date(item.planEndDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {item.planTypeName && (
                <View style={styles.contactItem}>
                  <Icon name="repeat" size={14} color="#7c3aed" />
                  <Text style={[styles.contactText, styles.plannedContactText]}>
                    Type: {item.planTypeName}
                  </Text>
                </View>
              )}
              {item.userXid && (
                <View style={styles.contactItem}>
                  <Icon name="account" size={14} color="#6b7280" />
                  <Text style={styles.contactText}>
                    User ID: {item.userXid}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Regular client info */}
          {!isPlannedVisit && (
            <>
              {item.planStartDate && (
                <View style={styles.contactItem}>
                  <Icon name="calendar" size={14} color="#6b7280" />
                  <Text style={styles.contactText}>
                    {new Date(item.planStartDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {item.planTypeName && (
                <View style={styles.contactItem}>
                  <Icon name="repeat" size={14} color="#6b7280" />
                  <Text style={styles.contactText}>{item.planTypeName}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedClient(item);
              setModalVisible(true);
            }}
          >
            <Icon name="information" size={16} color="#6366f1" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => handleLocationPress(item)}
          >
            <Icon name="map-marker" size={16} color="#fff" />
            <Text
              style={[styles.actionButtonText, styles.primaryActionButtonText]}
            >
              Location
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6366f1" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nearby Shops</Text>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <Icon name="store-search" size={64} color="#6366f1" />
          <ActivityIndicator
            size="large"
            color="#6366f1"
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingTitle}>Finding Nearby Shops</Text>
          <Text style={styles.loadingText}>
            Locating shops within {radiusKm} km of your location...
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
          <Text style={styles.headerTitle}>Nearby Shops</Text>
          <View style={styles.headerActionsRight}>
            <TouchableOpacity
              style={styles.headerAddButton}
              onPress={() => navigation.navigate("AddShop")}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.headerAddText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerRefreshButton}
              onPress={onRefresh}
            >
              <Icon name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Icon name="store" size={16} color="#fff" />
            <Text style={styles.statText}>
              {nearbyClients?.length || 0} shops found
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="map-marker-radius" size={16} color="#fff" />
            <Text style={styles.statText}>Within {radiusKm} km</Text>
          </View>
          <TouchableOpacity
            style={styles.radiusFilterButton}
            onPress={() => setShowRadiusFilter(!showRadiusFilter)}
          >
            <Icon name="tune" size={16} color="#fff" />
            <Text style={styles.statText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Tabs */}
      <View style={styles.tabsContainer}>
        {["All", "Planned"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Icon
              name={tab === "All" ? "store-outline" : "calendar-check"}
              size={16}
              color={activeTab === tab ? "#fff" : "#6b7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {tab === "All"
                  ? activeTab === "All"
                    ? nearbyClients?.length || 0
                    : clients?.length || 0
                  : activeTab === "Planned"
                  ? nearbyClients?.length || 0
                  : plannedVisits?.length || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Radius Filter */}
      {activeTab === "All" && showRadiusFilter && (
        <View style={styles.radiusFilterContainer}>
          <View style={styles.radiusFilterHeader}>
            <Icon name="map-marker-radius" size={20} color="#6366f1" />
            <Text style={styles.radiusFilterTitle}>
              Search Radius: {radiusKm} km
            </Text>
            <TouchableOpacity
              style={styles.radiusFilterClose}
              onPress={() => setShowRadiusFilter(false)}
            >
              <Icon name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.radiusSliderContainer}>
            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabelText}>{MIN_RADIUS_KM} km</Text>
              <Text style={styles.radiusLabelText}>{MAX_RADIUS_KM} km</Text>
            </View>
            <Slider
              style={styles.radiusSlider}
              minimumValue={MIN_RADIUS_KM}
              maximumValue={MAX_RADIUS_KM}
              value={radiusKm}
              onValueChange={(value) => setRadiusKm(Math.round(value))}
              step={1}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#d1d5db"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.radiusPresets}>
              {[5, 10, 20, 30].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.radiusPresetButton,
                    radiusKm === preset && styles.radiusPresetButtonActive,
                  ]}
                  onPress={() => setRadiusKm(preset)}
                >
                  <Text
                    style={[
                      styles.radiusPresetText,
                      radiusKm === preset && styles.radiusPresetTextActive,
                    ]}
                  >
                    {preset}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {nearbyClients.length > 0 ? (
        <FlatList
          data={nearbyClients}
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
          <Icon
            name={activeTab === "All" ? "store-off" : "calendar-remove"}
            size={64}
            color="#d1d5db"
          />
          <Text style={styles.emptyTitle}>
            {activeTab === "All"
              ? `No shops within ${radiusKm} km`
              : "No planned visits"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "All"
              ? "Try refreshing or check your location settings"
              : "No planned shop visits found for today"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Icon name="refresh" size={16} color="#6366f1" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      <ClientDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        client={selectedClient}
        latitude={userLocation?.latitude}
        longitude={userLocation?.longitude}
      />
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
    marginLeft: 8,
  },
  headerActionsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  headerAddText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
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

  // Enhanced Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#fff",
  },
  tabBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },

  // Shop Card Styles
  shopCard: {
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
  shopInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  plannedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  plannedText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#dc2626",
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
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f9ff",
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryActionButton: {
    backgroundColor: "#6366f1",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
    marginLeft: 6,
  },
  primaryActionButtonText: {
    color: "#fff",
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

  // Additional badges for planned visits
  planNameBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 4,
  },
  planNameText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#7c3aed",
    marginLeft: 4,
  },

  // Enhanced styles for tab-based organization
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  plannedVisitCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    backgroundColor: "#fefefe",
  },
  plannedContactText: {
    fontWeight: "600",
    color: "#374151",
  },

  // Radius Filter Button
  radiusFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // Radius Filter Styles
  radiusFilterContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  radiusFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  radiusFilterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    marginLeft: 8,
  },
  radiusFilterClose: {
    padding: 4,
  },
  radiusSliderContainer: {
    padding: 16,
  },
  radiusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  radiusLabelText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  radiusSlider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#6366f1",
    width: 20,
    height: 20,
  },
  radiusPresets: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  radiusPresetButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  radiusPresetButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  radiusPresetText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  radiusPresetTextActive: {
    color: "#fff",
  },
});

export default ShopsList;
