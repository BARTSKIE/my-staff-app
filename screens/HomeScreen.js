import React from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/HomeScreen.styles"; // Import the styles

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          {/* Header Section - WITHOUT IMAGE */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Don Elmer's</Text>
            <Text style={styles.subtitle}>Admin</Text>
          </View>

          {/* Main Actions Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate("QRScanner")}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="qr-code" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Scan QR Code</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate("Reservations")}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E8F4FD' }]}>
                <Ionicons name="calendar" size={24} color="#2196F3" />
              </View>
              <Text style={styles.featureTitle}>Reservations</Text>
              <Text style={styles.featureSubtitle}>View all bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate("Rooms")}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#F0F4FF' }]}>
                <Ionicons name="bed" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.featureTitle}>Rooms</Text>
              <Text style={styles.featureSubtitle}>Manage availability</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate("Guests")}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#FFF2E8' }]}>
                <Ionicons name="people" size={24} color="#FF9800" />
              </View>
              <Text style={styles.featureTitle}>Guests</Text>
              <Text style={styles.featureSubtitle}>Guest management</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}