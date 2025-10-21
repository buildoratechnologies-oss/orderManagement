import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import useAuthentication from "../../../hooks/useAuthentication";

function ProfileScreen({ navigation, location }) {
  const { handleGetProfileData } = useAuthentication();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 loading state

  // Derived helpers
  const fullName = (data) =>
    data?.companyName ||
    [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
    data?.name ||
    "Unknown";
  const displayCompany = (data) =>
    data?.companyName ||
    data?.userCompany?.companyBranch?.companies?.nameEng ||
    data?.userCompany?.companyBranch?.nameEng ||
    null;
  const displayAddress = (data) =>
    data?.officeAddress ||
    data?.userCompany?.companyBranch?.poBox ||
    data?.userCompany?.companyBranch?.companies?.address ||
    data?.userCompany?.companyBranch?.branches?.address ||
    null;
  const branchName = (data) => data?.userCompany?.companyBranch?.branches?.nameEng || null;
  const companyPhone = (data) =>
    data?.userCompany?.companyBranch?.phone || data?.userCompany?.companyBranch?.mobile || data?.mobile || null;
  const companyEmail = (data) => data?.userCompany?.companyBranch?.email || null;
  const rolesList = (data) => (Array.isArray(data?.roles) ? data.roles.map((r) => r?.nameEng).filter(Boolean) : []);
  const genderLabel = (g) => (g === "M" ? "Male" : g === "F" ? "Female" : g || "N/A");
  const boolText = (b) => (b ? "Yes" : "No");
  const getInitials = (name) =>
    ((name || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()) || "U";

  useEffect(() => {
    (async () => {
      try {
        let res = await handleGetProfileData();
        if (res) {
          setProfileData(res);
        }
      } catch (err) {
        console.log("❌ Error fetching profile:", err);
      } finally {
        setLoading(false); // stop loader
      }
    })();
  }, []);

  if (loading) {
    // 👇 Show loader while fetching
    return (
      <LinearGradient colors={["#2078a1ff", "#2575fc"]} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1f2937", "#111827"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrap}>
            {profileData?.imageUrl ? (
              <Image source={{ uri: profileData?.imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileFallback}>
                <Text style={styles.fallbackText}>{getInitials(fullName(profileData))}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.userName}>{fullName(profileData)}</Text>
            <Text style={styles.userSubtitle}>{displayCompany(profileData) || "User Profile"}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Ionicons name="id-card-outline" size={14} color="#4338ca" />
                <Text style={styles.badgeText}>PID: {profileData?.pid ?? '-'}</Text>
              </View>
              {rolesList(profileData).length > 0 && (
                <View style={styles.badge}>
                  <Ionicons name="ribbon-outline" size={14} color="#4338ca" />
                  <Text style={styles.badgeText}>{rolesList(profileData).length} role(s)</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{rolesList(profileData).length}</Text>
            <Text style={styles.metricLabel}>Roles</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{branchName(profileData) ? branchName(profileData) : '-'}</Text>
            <Text style={styles.metricLabel}>Branch</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{profileData?.companyXid ?? '-'}</Text>
            <Text style={styles.metricLabel}>Company ID</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          {profileData?.mobile && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#6366f1" />
              <Text style={styles.info}>{profileData.mobile}</Text>
            </View>
          )}
          {profileData?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#6366f1" />
              <Text style={styles.info}>{profileData.email}</Text>
            </View>
          )}
          {profileData?.landLine && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>{profileData.landLine}</Text>
            </View>
          )}
          {profileData?.dialingCode && (
            <View style={styles.infoRow}>
              <Ionicons name="keypad-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>{profileData.dialingCode}</Text>
            </View>
          )}
          {displayAddress(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#6366f1" />
              <Text style={styles.info}>{displayAddress(profileData)}</Text>
            </View>
          )}
          {location ? (
            <View style={styles.locationRowWrap}>
              <View style={styles.infoRow}>
                <Ionicons name="navigate" size={20} color="#6366f1" />
                <Text style={styles.info}>Lat: {location.latitude.toFixed(4)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="navigate-outline" size={20} color="#6366f1" />
                <Text style={styles.info}>Lon: {location.longitude.toFixed(4)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="hourglass" size={20} color="#6366f1" />
              <Text style={styles.info}>Fetching location...</Text>
            </View>
          )}
        </View>

        {/* Company & Branch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Company & Branch</Text>
          {displayCompany(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>{displayCompany(profileData)}</Text>
            </View>
          )}
          {branchName(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>{branchName(profileData)}</Text>
            </View>
          )}
          {companyPhone(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#6366f1" />
              <Text style={styles.info}>{companyPhone(profileData)}</Text>
            </View>
          )}
          {companyEmail(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#6366f1" />
              <Text style={styles.info}>{companyEmail(profileData)}</Text>
            </View>
          )}
          {displayAddress(profileData) && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>{displayAddress(profileData)}</Text>
            </View>
          )}
        </View>

        {/* Account Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#6366f1" />
            <Text style={styles.info}>Gender: {genderLabel(profileData?.gender)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
            <Text style={styles.info}>Two-Factor Enabled: {boolText(profileData?.enable2Factor)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
            <Text style={styles.info}>Account Locked: {boolText(profileData?.isLocked)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.info}>Created On: {profileData?.createdOn || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#6366f1" />
            <Text style={styles.info}>Last Edit: {profileData?.lastEdit || "N/A"}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.chipsRow}>
            <View style={[styles.statusChip, profileData?.isAccepted ? styles.statusOn : styles.statusOff]}>
              <Ionicons name={profileData?.isAccepted ? "checkmark-circle-outline" : "close-circle-outline"} size={16} color={profileData?.isAccepted ? "#065f46" : "#991b1b"} />
              <Text style={[styles.statusText, profileData?.isAccepted ? styles.statusTextOn : styles.statusTextOff]}>Accepted: {boolText(profileData?.isAccepted)}</Text>
            </View>
            <View style={[styles.statusChip, profileData?.enable2Factor ? styles.statusOn : styles.statusOff]}>
              <Ionicons name={profileData?.enable2Factor ? "checkmark-circle-outline" : "close-circle-outline"} size={16} color={profileData?.enable2Factor ? "#065f46" : "#991b1b"} />
              <Text style={[styles.statusText, profileData?.enable2Factor ? styles.statusTextOn : styles.statusTextOff]}>2FA: {boolText(profileData?.enable2Factor)}</Text>
            </View>
            <View style={[styles.statusChip, !profileData?.isLocked ? styles.statusOn : styles.statusOff]}>
              <Ionicons name={!profileData?.isLocked ? "checkmark-circle-outline" : "close-circle-outline"} size={16} color={!profileData?.isLocked ? "#065f46" : "#991b1b"} />
              <Text style={[styles.statusText, !profileData?.isLocked ? styles.statusTextOn : styles.statusTextOff]}>Active: {boolText(!profileData?.isLocked)}</Text>
            </View>
          </View>
          {profileData?.acceptedDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" />
              <Text style={styles.info}>Accepted On: {profileData.acceptedDate}</Text>
            </View>
          )}
        </View>

        {/* Roles */}
        {rolesList(profileData).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Roles</Text>
            <View style={styles.chipsRow}>
              {rolesList(profileData).map((role) => (
                <View key={role} style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 32,
  },
  // Header Card
  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#374151",
    overflow: "hidden",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  profileFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
    backgroundColor: "#312e81",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#e0e7ff",
    fontSize: 24,
    fontWeight: "700",
  },
  headerTextWrap: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  userSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  badgeText: {
    color: "#4338ca",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Summary Metrics
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  metricValue: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  // Cards
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  info: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 10,
  },
  locationRowWrap: {
    marginTop: 4,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },

  // Status chips
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  statusOn: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  statusOff: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  statusTextOn: {
    color: "#065f46",
  },
  statusTextOff: {
    color: "#991b1b",
  },

  // Back button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default ProfileScreen;
