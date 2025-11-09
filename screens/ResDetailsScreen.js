// screens/ResDetailsScreen.js
import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ResDetailsScreen({ route, navigation }) {
  const reservationData = route.params?.reservationData;

  // If no data, show error
  if (!reservationData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservation Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>No reservation data found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'checked-in': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'checked-in': return 'bed';
      case 'cancelled': return 'close-circle';
      default: return 'time';
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString() || '0'}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // NEW: Get AM/PM time period
  const getTimePeriod = () => {
    if (reservationData.dayHours > 0) return "AM";
    if (reservationData.overnightHours > 0) return "PM";
    if (reservationData.isWholeResort) return "24 HOURS";
    return "N/A";
  };

  const timePeriod = getTimePeriod();

  const handleCancelReservation = async () => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: async () => {
            try {
              const reservationRef = doc(db, 'reservations', reservationData.id);
              await updateDoc(reservationRef, {
                status: 'cancelled',
                updatedAt: new Date()
              });
              Alert.alert("Success", "Reservation cancelled successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error cancelling reservation:", error);
              Alert.alert("Error", "Failed to cancel reservation");
            }
          }
        }
      ]
    );
  };

  const handleDeleteReservation = async () => {
    Alert.alert(
      "Delete Reservation",
      "This action cannot be undone. Are you sure?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const reservationRef = doc(db, 'reservations', reservationData.id);
              await deleteDoc(reservationRef);
              Alert.alert("Success", "Reservation deleted successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting reservation:", error);
              Alert.alert("Error", "Failed to delete reservation");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservation Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(reservationData.status) }]}>
          <Ionicons name={getStatusIcon(reservationData.status)} size={32} color="#fff" />
          <Text style={styles.statusBannerText}>
            {reservationData.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
          <Text style={styles.reservationId}>
            {reservationData.reservationId}
          </Text>
        </View>

        {/* Guest Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Guest Name</Text>
              <Text style={styles.infoValue}>{reservationData.userFullName || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{reservationData.userEmail || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Number of Guests</Text>
              <Text style={styles.infoValue}>{reservationData.guests || 0} person(s)</Text>
            </View>
          </View>
        </View>

        {/* Reservation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservation Details</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Reservation Date</Text>
              <Text style={styles.infoValue}>{reservationData.date || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="bed" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Room</Text>
              <Text style={styles.infoValue}>
                {reservationData.room?.name || 'Unknown Room'}
                {reservationData.isWholeResort && ' (Whole Resort)'}
              </Text>
            </View>
          </View>

          {/* UPDATED: Added AM/PM Time Period */}
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time Period</Text>
              <Text style={styles.infoValue}>{timePeriod}</Text>
            </View>
          </View>

          {reservationData.checkedIn && reservationData.checkInTime && (
            <View style={styles.infoItem}>
              <Ionicons name="log-in" size={20} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Checked In At</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(reservationData.checkInTime)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="card" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{reservationData.paymentMethod || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash" size={20} color="#C8A951" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={[styles.infoValue, styles.amountText]}>
                {formatCurrency(reservationData.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* CONFIRMED Status - Can Cancel or Delete */}
          {reservationData.status === 'confirmed' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelReservation}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel Reservation</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteReservation}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete Reservation</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CANCELLED Status - Can Delete Only */}
          {reservationData.status === 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteReservation}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delete Reservation</Text>
            </TouchableOpacity>
          )}

          {/* CHECKED-IN Status - No Actions Available */}
          {reservationData.status === 'checked-in' && (
            <View style={styles.noActionsContainer}>
              <Ionicons name="information-circle" size={24} color="#666" />
              <Text style={styles.noActionsText}>
                No actions available for checked-in reservations
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C8A951',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 32,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  reservationId: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  amountText: {
    color: '#C8A951',
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#FFA726',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noActionsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noActionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#C8A951',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});