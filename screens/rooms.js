// screens/rooms.js
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
  Image,
  StatusBar
} from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { app } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function RoomsScreen({ navigation }) {
  const [accommodations, setAccommodations] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'room', label: 'Rooms' },
    { key: 'cottage', label: 'Cottages' },
    { key: 'whole', label: 'Whole Resort' }
  ];

  useEffect(() => {
    fetchAccommodations();
    
    // Cleanup function
    return () => {
      const db = getDatabase(app);
      const accommodationsRef = ref(db, 'accommodations');
      off(accommodationsRef);
    };
  }, []);

  useEffect(() => {
    filterAccommodations();
  }, [accommodations, activeFilter]);

  const fetchAccommodations = () => {
    try {
      setError('');
      const db = getDatabase(app);
      const accommodationsRef = ref(db, 'accommodations');
      
      setLoading(true);
      
      onValue(accommodationsRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          // Convert object to array and add the key as id
          const accommodationsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          
          setAccommodations(accommodationsArray);
        } else {
          setAccommodations([]);
          setError('No accommodations found');
        }
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('Error fetching accommodations:', error);
        setError('Failed to load accommodations');
        setLoading(false);
        setRefreshing(false);
      });
      
    } catch (err) {
      console.error('Error in fetchAccommodations:', err);
      setError('Failed to load accommodations');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAccommodations = () => {
    if (activeFilter === 'all') {
      setFilteredAccommodations(accommodations);
    } else {
      const filtered = accommodations.filter(acc => 
        acc.type === activeFilter
      );
      setFilteredAccommodations(filtered);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccommodations();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'room':
        return '#4CAF50';
      case 'cottage':
        return '#2196F3';
      case 'whole':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'room':
        return 'bed';
      case 'cottage':
        return 'home';
      case 'whole':
        return 'business';
      default:
        return 'help-circle';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'room':
        return 'Room';
      case 'cottage':
        return 'Cottage';
      case 'whole':
        return 'Whole Resort';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#4CAF50' : '#F44336';
  };

  const getStatusText = (status) => {
    return status === 'Active' ? 'Available' : 'Unavailable';
  };

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString() || '0'}`;
  };

  const getStartingPrice = (accommodation) => {
    if (accommodation.type === 'whole') {
      return accommodation.wholeResortPrice;
    }
    return accommodation.dayPrice || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8A951" />
          <Text style={styles.loadingText}>Loading accommodations...</Text>
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
        <Text style={styles.headerTitle}>Accommodations</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
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
              onPress={fetchAccommodations}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAccommodations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bed" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No accommodations found' 
                : `No ${activeFilter} accommodations`
              }
            </Text>
          </View>
        ) : (
          filteredAccommodations.map((accommodation) => (
            <TouchableOpacity 
              key={accommodation.id}
              style={[
                styles.accommodationCard,
                accommodation.status !== 'Active' && styles.unavailableCard
              ]}
              onPress={() => navigation.navigate('RoomDetails', { 
                room: accommodation 
              })}
            >
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: accommodation.image }}
                  style={[
                    styles.accommodationImage,
                    accommodation.status !== 'Active' && styles.unavailableImage
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>
                    FROM {formatCurrency(getStartingPrice(accommodation))}
                  </Text>
                </View>
                
                {/* Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(accommodation.type) }]}>
                  <Ionicons 
                    name={getTypeIcon(accommodation.type)} 
                    size={12} 
                    color="#fff" 
                  />
                  <Text style={styles.typeBadgeText}>
                    {getTypeLabel(accommodation.type)}
                  </Text>
                </View>

                {/* Unavailable Overlay */}
                {accommodation.status !== 'Active' && (
                  <View style={styles.unavailableOverlay}>
                    <Text style={styles.unavailableText}>UNAVAILABLE</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.accommodationName}>
                    {accommodation.name}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(accommodation.status) }
                    ]} />
                    <Text style={styles.statusText}>
                      {getStatusText(accommodation.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {accommodation.description || 'Comfortable accommodation with modern amenities.'}
                </Text>

                {/* Pricing Information */}
                <View style={styles.pricingContainer}>
                  {accommodation.type === 'whole' ? (
                    <View style={styles.pricingRow}>
                      <Text style={styles.pricingLabel}>24-Hour Package:</Text>
                      <Text style={styles.pricingValue}>
                        {formatCurrency(accommodation.wholeResortPrice)}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>Day Rate:</Text>
                        <Text style={styles.pricingValue}>
                          {formatCurrency(accommodation.dayPrice)}
                        </Text>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>Overnight:</Text>
                        <Text style={styles.pricingValue}>
                          {formatCurrency(accommodation.overnightPrice)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Features */}
                {accommodation.features && accommodation.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresLabel}>Includes:</Text>
                    <View style={styles.featuresList}>
                      {accommodation.features.slice(0, 3).map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name="checkmark" size={12} color="#4CAF50" />
                          <Text style={styles.featureText}>
                            {typeof feature === 'string' ? feature : feature.name}
                          </Text>
                        </View>
                      ))}
                      {accommodation.features.length > 3 && (
                        <Text style={styles.moreFeatures}>
                          +{accommodation.features.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* View Details Button */}
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('RoomDetails', { 
                    room: accommodation 
                  })}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#C8A951" />
                </TouchableOpacity>
              </View>
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
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    height: 32,
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
  accommodationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  unavailableCard: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  accommodationImage: {
    width: '100%',
    height: '100%',
  },
  unavailableImage: {
    opacity: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  accommodationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  pricingContainer: {
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  featuresContainer: {
    marginBottom: 12,
  },
  featuresLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#C8A951',
    fontStyle: 'italic',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8A951',
    marginRight: 4,
  },
});