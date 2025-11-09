import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ReservationDetailsScreen({ route, navigation }) {
  const { reservation } = route.params;
  const [loading, setLoading] = useState(false);

  // Extract proper fields from Firestore structure
  const guestName = reservation.qrData?.guestName || reservation.userFullName || "N/A";
  const roomName = reservation.room?.name || reservation.qrData?.room || "N/A";
  const checkInDate = reservation.qrData?.date || reservation.date || "N/A";
  const totalAmount = reservation.totalAmount || 0;
  const paymentMethod = reservation.paymentMethod || "N/A";
  const status = reservation.status || "confirmed";
  const checkedIn = reservation.checkedIn || false;
  const verificationCode = reservation.qrVerificationCode || reservation.qrData?.verificationCode || "N/A";
  const guests = reservation.guests || 1;
  const dayHours = reservation.dayHours || 0;
  const overnightHours = reservation.overnightHours || 0;
  
  // NEW: Simple AM/PM based on hours
  const getTimePeriod = () => {
    if (dayHours > 0) return "AM";
    if (overnightHours > 0) return "PM";
    if (reservation.isWholeResort) return "24 HOURS";
    return "N/A";
  };

  const timePeriod = getTimePeriod();

  // Determine if check-in is allowed
  const canCheckIn = () => status !== "checked-in" && !checkedIn;

  const handleCheckIn = async () => {
    if (!canCheckIn()) return;

    try {
      setLoading(true);

      if (!reservation.id) {
        Alert.alert("Error", "Reservation ID missing.");
        return;
      }

      const ref = doc(db, "reservations", reservation.id);
      await updateDoc(ref, {
        status: "checked-in",
        checkedIn: true,
        checkInTime: new Date().toISOString(),
      });

      Alert.alert("✅ Success", "Guest checked in successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Check-in error:", error);
      Alert.alert("❌ Error", "Failed to update check-in.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "checked-in": return "#4CAF50";
      case "confirmed": return "#FFA000";
      case "cancelled": return "#F44336";
      default: return "#757575";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "checked-in": return "Checked In";
      case "confirmed": return "Confirmed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Reservation Details</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>

        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Guest Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Guest Name</Text>
              <Text style={styles.infoValue}>{guestName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Number of Guests</Text>
              <Text style={styles.infoValue}>{guests}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Room</Text>
              <Text style={styles.infoValue}>{roomName}</Text>
            </View>
            <View style={styles.infoItem}>
              {/* UPDATED: Now shows simple AM/PM */}
              <Text style={styles.infoLabel}>Time Period</Text>
              <Text style={styles.infoValue}>{timePeriod}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Date</Text>
            <Text style={styles.sectionValue}>{checkInDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Payment Details</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentAmount}>₱{totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentMethod}>{paymentMethod}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Verification</Text>
            <View style={styles.verificationBox}>
              <Text style={styles.verificationCode}>{verificationCode}</Text>
              <Text style={styles.verificationLabel}>Verification Code</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!canCheckIn() || loading) && styles.disabledButton,
            ]}
            onPress={handleCheckIn}
            disabled={!canCheckIn() || loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "🔄 Processing..." : "✅ Check In Guest"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>← Back to Reservations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#eaeaea",
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sectionValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666",
  },
  paymentAmount: {
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "bold",
  },
  paymentMethod: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  verificationBox: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eaeaea",
    marginTop: 8,
  },
  verificationCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C8A951",
    letterSpacing: 2,
    marginBottom: 4,
  },
  verificationLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
  },
  actionsContainer: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#C8A951",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#C8A951",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    shadowColor: "transparent",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#666",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});