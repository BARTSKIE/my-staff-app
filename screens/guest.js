// screens/guest.js
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
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function GuestsScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filters = [
    { key: 'all', label: 'All Users' },
    { key: 'users', label: 'Customers' },
    { key: 'staff', label: 'Staff' },
    { key: 'admins', label: 'Admins' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError('');
      
      // Fetch regular users
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'user'
      }));

      // Fetch staff
      const staffRef = collection(db, 'staff');
      const staffQuery = query(staffRef, orderBy('createdAt', 'desc'));
      const staffSnapshot = await getDocs(staffQuery);
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'staff'
      }));

      // Fetch admins
      const adminsRef = collection(db, 'admins');
      const adminsQuery = query(adminsRef, orderBy('createdAt', 'desc'));
      const adminsSnapshot = await getDocs(adminsQuery);
      const adminsData = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'admin'
      }));

      setUsers(usersData);
      setStaff(staffData);
      setAdmins(adminsData);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const getAllUsers = () => {
    return [...admins, ...staff, ...users];
  };

  const getFilteredUsers = () => {
    const allUsers = getAllUsers();
    
    if (activeFilter === 'all') {
      return allUsers;
    } else if (activeFilter === 'users') {
      return users;
    } else if (activeFilter === 'staff') {
      return staff;
    } else if (activeFilter === 'admins') {
      return admins;
    }
    return allUsers;
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'admin': return '#FF6B6B';
      case 'staff': return '#4ECDC4';
      case 'user': return '#45B7D1';
      default: return '#95A5A6';
    }
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case 'admin': return 'shield';
      case 'staff': return 'person';
      case 'user': return 'person-outline';
      default: return 'help-circle';
    }
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      case 'user': return 'Customer';
      default: return 'Unknown';
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

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const canDeleteUser = (user) => {
    // Staff can only delete customers (users), not other staff or admins
    if (user.type === 'user') return true;
    return false;
  };

  const handleDeleteAccount = async () => {
    if (!selectedUser) return;

    // Check permissions
    if (!canDeleteUser(selectedUser)) {
      Alert.alert(
        "Permission Denied",
        "You can only delete customer accounts. Staff and admin accounts require higher permissions.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete ${selectedUser.fullName}'s account? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => confirmDeleteAccount()
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      
      let collectionName;
      switch (selectedUser.type) {
        case 'admin':
          collectionName = 'admins';
          break;
        case 'staff':
          collectionName = 'staff';
          break;
        case 'user':
          collectionName = 'users';
          break;
        default:
          throw new Error('Invalid user type');
      }

      const userRef = doc(db, collectionName, selectedUser.id);
      await deleteDoc(userRef);

      // Remove from local state
      if (selectedUser.type === 'admin') {
        setAdmins(admins.filter(user => user.id !== selectedUser.id));
      } else if (selectedUser.type === 'staff') {
        setStaff(staff.filter(user => user.id !== selectedUser.id));
      } else {
        setUsers(users.filter(user => user.id !== selectedUser.id));
      }

      setShowDetailsModal(false);
      setSelectedUser(null);
      
      Alert.alert("Success", "Account deleted successfully");
      
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. Please check your permissions.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8A951" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredUsers = getFilteredUsers();

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
        <Text style={styles.headerTitle}>Users & Staff</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getAllUsers().length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{staff.length}</Text>
          <Text style={styles.statLabel}>Staff</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{admins.length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
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
              onPress={fetchUsers}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No users found' 
                : `No ${activeFilter} found`
              }
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              {/* User Avatar and Basic Info */}
              <View style={styles.userHeader}>
                <View style={[styles.avatar, { backgroundColor: getUserTypeColor(user.type) }]}>
                  <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.fullName || 'No Name'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  
                  <View style={styles.userMeta}>
                    <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(user.type) }]}>
                      <Ionicons 
                        name={getUserTypeIcon(user.type)} 
                        size={12} 
                        color="#fff" 
                      />
                      <Text style={styles.userTypeText}>
                        {getUserTypeLabel(user.type)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Additional Information */}
              <View style={styles.userDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Member Since:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(user.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {user.phoneNumber && (
                  <View style={styles.detailItem}>
                    <Ionicons name="call" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{user.phoneNumber}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleViewDetails(user)}
                >
                  <Ionicons name="eye" size={16} color="#666" />
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>User Details</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDetailsModal(false)}
                    disabled={deleting}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* User Avatar and Basic Info */}
                  <View style={styles.modalUserHeader}>
                    <View style={[styles.modalAvatar, { backgroundColor: getUserTypeColor(selectedUser.type) }]}>
                      <Text style={styles.modalAvatarText}>{getInitials(selectedUser.fullName)}</Text>
                    </View>
                    <View style={styles.modalUserInfo}>
                      <Text style={styles.modalUserName}>{selectedUser.fullName || 'No Name'}</Text>
                      <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                      <View style={[styles.modalUserType, { backgroundColor: getUserTypeColor(selectedUser.type) }]}>
                        <Text style={styles.modalUserTypeText}>
                          {getUserTypeLabel(selectedUser.type)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Personal Information Section */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Personal Information</Text>
                    
                    <View style={styles.detailRowModal}>
                      <View style={styles.detailItemModal}>
                        <Ionicons name="person" size={16} color="#6B7280" />
                        <Text style={styles.detailLabelModal}>Full Name</Text>
                        <Text style={styles.detailValueModal}>{selectedUser.fullName || 'Not provided'}</Text>
                      </View>

                      <View style={styles.detailItemModal}>
                        <Ionicons name="mail" size={16} color="#6B7280" />
                        <Text style={styles.detailLabelModal}>Email Address</Text>
                        <Text style={styles.detailValueModal}>{selectedUser.email}</Text>
                      </View>

                      {selectedUser.phoneNumber && (
                        <View style={styles.detailItemModal}>
                          <Ionicons name="call" size={16} color="#6B7280" />
                          <Text style={styles.detailLabelModal}>Phone Number</Text>
                          <Text style={styles.detailValueModal}>{selectedUser.phoneNumber}</Text>
                        </View>
                      )}

                      <View style={styles.detailItemModal}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.detailLabelModal}>Member Since</Text>
                        <Text style={styles.detailValueModal}>{formatDate(selectedUser.createdAt)}</Text>
                      </View>

                      <View style={styles.detailItemModal}>
                        <Ionicons name="key" size={16} color="#6B7280" />
                        <Text style={styles.detailLabelModal}>Account Type</Text>
                        <Text style={styles.detailValueModal}>{getUserTypeLabel(selectedUser.type)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Account Information Section */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Account Information</Text>
                    <View style={styles.accountInfo}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Role Description</Text>
                        <Text style={styles.infoValue}>
                          {selectedUser.type === 'admin' 
                            ? 'Full administrative access with system-wide permissions'
                            : selectedUser.type === 'staff'
                            ? 'Staff access with limited administrative capabilities'
                            : 'Customer account with booking and reservation access'
                          }
                        </Text>
                      </View>
                      
                      {!canDeleteUser(selectedUser) && (
                        <View style={styles.warningBox}>
                          <Ionicons name="warning" size={16} color="#F59E0B" />
                          <Text style={styles.warningText}>
                            This account type requires admin permissions to delete
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowDetailsModal(false)}
                    disabled={deleting}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                  
                  {canDeleteUser(selectedUser) && (
                    <TouchableOpacity 
                      style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                      onPress={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={16} color="#fff" />
                          <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C8A951',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  // Modal Styles
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
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalUserType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalUserTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRowModal: {
    gap: 12,
  },
  detailItemModal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailLabelModal: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 12,
    width: 100,
    fontWeight: '500',
  },
  detailValueModal: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  accountInfo: {
    gap: 12,
  },
  infoItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});