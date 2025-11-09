// screens/RoomDetailsStaff.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, update } from 'firebase/database';
import { app } from '../firebase';

export default function RoomDetailsStaff({ route, navigation }) {
  const { room } = route.params;
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(room.status || 'Active');

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString() || '0'}`;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'room': return 'Room';
      case 'cottage': return 'Cottage';
      case 'whole': return 'Whole Resort';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#4CAF50' : '#F44336';
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      
      const db = getDatabase(app);
      const roomRef = ref(db, `accommodations/${room.id}`);
      
      await update(roomRef, {
        status: newStatus
      });
      
      setCurrentStatus(newStatus);
      setShowStatusModal(false);
      
      Alert.alert(
        "Success",
        `Room status updated to ${newStatus}`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error("Error updating room status:", error);
      Alert.alert("Error", "Failed to update room status");
    } finally {
      setLoading(false);
    }
  };

  const confirmStatusChange = (newStatus) => {
    const action = newStatus === 'Active' ? 'activate' : 'deactivate';
    
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this ${getTypeLabel(room.type).toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: `Yes, ${action}`, 
          style: "destructive",
          onPress: () => handleStatusChange(newStatus)
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
        <Text style={styles.headerTitle}>Room Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: room.image }}
            style={styles.roomImage}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
            <Text style={styles.statusBadgeText}>{currentStatus}</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{room.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{getTypeLabel(room.type)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue}>{room.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Package Type</Text>
              <Text style={styles.infoValue}>{room.packageType || 'Standard'}</Text>
            </View>
          </View>

          <View style={styles.infoItemFull}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {room.description || 'No description available.'}
            </Text>
          </View>
        </View>

        {/* Pricing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          
          {room.type === 'whole' ? (
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>24-Hour Package</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(room.wholeResortPrice)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Day Rate (10 hours)</Text>
                <Text style={styles.pricingValue}>
                  {formatCurrency(room.dayPrice)}
                </Text>
              </View>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Overnight Rate (10 hours)</Text>
                <Text style={styles.pricingValue}>
                  {formatCurrency(room.overnightPrice)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Features & Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features & Amenities</Text>
            <View style={styles.featuresGrid}>
              {room.amenities.map((amenity, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>
                    {typeof amenity === 'string' ? amenity : amenity.name}
                    {amenity.price > 0 && ` (+₱${amenity.price?.toLocaleString()})`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Capacity Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacity</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Max Guests</Text>
              <Text style={styles.infoValue}>
                {room.capacity ? `${room.capacity} guests` : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Management</Text>
          
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={() => setShowStatusModal(true)}
            disabled={loading}
          >
            <View style={styles.statusButtonContent}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusButtonLabel}>Current Status</Text>
                <View style={styles.currentStatus}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]} />
                  <Text style={styles.currentStatusText}>{currentStatus}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <Text style={styles.statusHelpText}>
            Change the status to control whether this accommodation is available for booking.
          </Text>
        </View>
      </ScrollView>

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select new status for {room.name}
            </Text>

            <TouchableOpacity 
              style={[
                styles.statusOption,
                currentStatus === 'Active' && styles.statusOptionSelected
              ]}
              onPress={() => confirmStatusChange('Active')}
            >
              <View style={styles.statusOptionContent}>
                <View style={[styles.statusDotLarge, { backgroundColor: '#4CAF50' }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Active</Text>
                  <Text style={styles.statusOptionDescription}>
                    Available for booking by customers
                  </Text>
                </View>
              </View>
              {currentStatus === 'Active' && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.statusOption,
                currentStatus === 'Inactive' && styles.statusOptionSelected
              ]}
              onPress={() => confirmStatusChange('Inactive')}
            >
              <View style={styles.statusOptionContent}>
                <View style={[styles.statusDotLarge, { backgroundColor: '#F44336' }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Inactive</Text>
                  <Text style={styles.statusOptionDescription}>
                    Not available for booking
                  </Text>
                </View>
              </View>
              {currentStatus === 'Inactive' && (
                <Ionicons name="checkmark" size={20} color="#F44336" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  imageContainer: {
    position: 'relative',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoItemFull: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C8A951',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
  },
  statusButtonLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  currentStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusHelpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  statusOptionSelected: {
    borderColor: '#C8A951',
    backgroundColor: '#FFF9E6',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDotLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusOptionDescription: {
    fontSize: 12,
    color: '#666',
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});