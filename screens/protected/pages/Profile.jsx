import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import useAuthentication from "../../../hooks/useAuthentication";
import profileIcon from "../../../assets/user.png";

function ProfileScreen({ navigation, location }) {
  const { handleGetProfileData } = useAuthentication();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 loading state

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
    <LinearGradient colors={["#2078a1ff", "#2575fc"]} style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {profileData?.imageUrl ? (
          <Image source={{ uri: profileData?.imageUrl }} style={styles.profileImage} />
        ) : (
          <Image source={profileIcon} style={styles.profileImage} />
        )}
        <Text style={styles.userName}>
          {profileData?.firstName ?? ""} {profileData?.lastName ?? ""}
        </Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#2078a1ff" />
          <Text style={styles.info}>{profileData?.mobile ?? "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#2078a1ff" />
          <Text style={styles.info}>{profileData?.email ?? "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#2078a1ff" />
          <Text style={styles.info}>Hyderabad, India</Text>
        </View>

        {location ? (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color="#2078a1ff" />
              <Text style={styles.info}>Lat: {location.latitude.toFixed(4)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color="#2078a1ff" />
              <Text style={styles.info}>Lon: {location.longitude.toFixed(4)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.infoRow}>
            <Ionicons name="hourglass" size={20} color="#2078a1ff" />
            <Text style={styles.info}>Fetching location...</Text>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // 👈 center loader too
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginVertical: 30,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: "95%",
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  info: {
    fontSize: 16,
    color: "#444",
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 3,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ProfileScreen;
