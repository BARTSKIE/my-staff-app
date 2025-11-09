// screens/reservation.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ReservationsScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'checked-in', label: 'Checked In' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, activeFilter]);

  const fetchReservations = async () => {
    try {
      setError('');
      const reservationsRef = collection(db, 'reservations');
      const q = query(reservationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reservationsData = [];
      querySnapshot.forEach((doc) => {
        reservationsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setReservations(reservationsData);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterReservations = () => {
    if (activeFilter === 'all') {
      setFilteredReservations(reservations);
    } else {
      const filtered = reservations.filter(reservation => 
        reservation.status === activeFilter
      );
      setFilteredReservations(filtered);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'checked-in':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'checked-in':
        return 'bed';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString() || '0'}`;
  };

  const getRoomTypeText = (room) => {
    if (room?.type === 'whole_resort' || room?.id === 22) {
      return 'Whole Resort';
    }
    return room?.name || 'Unknown Room';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8A951" />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#C8A951" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservations</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs - Fixed smaller height */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C8A951']}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchReservations}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No reservations found' 
                : `No ${activeFilter} reservations`
              }
            </Text>
          </View>
        ) : (
          filteredReservations.map((reservation) => (
            <TouchableOpacity 
              key={reservation.id}
              style={styles.reservationCard}
              onPress={() => navigation.navigate('ResDetails', { 
                reservationId: reservation.id,
                reservationData: reservation 
              })}
            >
              {/* Status Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon(reservation.status)} 
                    size={16} 
                    color={getStatusColor(reservation.status)} 
                  />
                  <Text 
                    style={[
                      styles.statusText,
                      { color: getStatusColor(reservation.status) }
                    ]}
                  >
                    {reservation.status?.charAt(0).toUpperCase() + reservation.status?.slice(1) || 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.reservationId}>
                  {reservation.reservationId}
                </Text>
              </View>

              {/* Guest Info */}
              <View style={styles.guestInfo}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.guestName}>
                  {reservation.userFullName || 'Unknown Guest'}
                </Text>
              </View>

              {/* Room Info */}
              <View style={styles.roomInfo}>
                <Ionicons name="bed" size={16} color="#666" />
                <Text style={styles.roomText}>
                  {getRoomTypeText(reservation.room)}
                </Text>
              </View>

              {/* Date and Details */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={14} color="#666" />
                  <Text style={styles.detailText}>
                    {reservation.date || formatDate(reservation.createdAt)}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="people" size={14} color="#666" />
                  <Text style={styles.detailText}>
                    {reservation.guests || 1} guest{reservation.guests !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Payment and Amount */}
              <View style={styles.footerRow}>
                <Text style={styles.paymentMethod}>
                  {reservation.paymentMethod || 'N/A'}
                </Text>
                <Text style={styles.amount}>
                  {formatCurrency(reservation.totalAmount)}
                </Text>
              </View>

              {/* Check-in Info if available */}
              {reservation.checkedIn && reservation.checkInTime && (
                <View style={styles.checkInInfo}>
                  <Ionicons name="time" size={12} color="#4CAF50" />
                  <Text style={styles.checkInText}>
                    Checked in: {new Date(reservation.checkInTime).toLocaleString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50, // Fixed height for the filter container
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced vertical padding
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Reduced vertical padding
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    height: 32, // Fixed height for buttons
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#C8A951',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  reservationId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C8A951',
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkInText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
  },
});