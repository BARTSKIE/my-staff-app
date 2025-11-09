import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, Animated, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/QRScannerScreen.styles";

const { width, height } = Dimensions.get("window");

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [scanResult, setScanResult] = useState({ success: false, message: "", icon: "close" });
  const isProcessing = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Start scan line animation when camera is active
  useEffect(() => {
    let animation;
    if (cameraActive && !scanned) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [cameraActive, scanned]);

  const showModal = (success, message, icon = "close") => {
    setScanResult({ success, message, icon });
    setShowResultModal(true);
    
    // Animate modal in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowResultModal(false);
      resetScanner();
    });
  };

  const handleBarCodeScanned = async ({ data }) => {
  if (isProcessing.current || !cameraActive) return;
  
  isProcessing.current = true;
  setScanned(true);
  setCameraActive(false);

  try {
    console.log("🔍 QR Data received:", data);
    
    let parsed;
    try {
      parsed = JSON.parse(data);
      console.log("📋 Parsed QR data:", parsed);
    } catch {
      showModal(false, "This QR code is not valid.\nPlease scan a valid reservation QR code.", "scan");
      return;
    }

    const { reservationId, verificationCode } = parsed;
    
    console.log(`🔎 Searching for reservation: ${reservationId}`);
    console.log(`🔑 Verification code from QR: ${verificationCode}`);

    if (!reservationId || !verificationCode) {
      showModal(false, "This QR code is missing required information.\nIt may not be from our system.", "qr-code");
      return;
    }

    // ✅ ADD RETRY LOGIC for timing issues
    let reservation = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !reservation) {
      try {
        // Query Firestore for reservation
        const q = query(
          collection(db, "reservations"),
          where("reservationId", "==", reservationId)
        );
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          reservation = { id: docSnap.id, ...docSnap.data() };
          console.log("📄 Reservation found:", reservation);
          break;
        }

        if (retryCount < maxRetries - 1) {
          console.log(`🔄 No reservation found, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      } catch (error) {
        console.error(`❌ Error fetching reservation (attempt ${retryCount + 1}):`, error);
      }
      retryCount++;
    }

    if (!reservation) {
      console.log("❌ No reservation found after retries");
      showModal(false, "Reservation not found in our system.\nPlease ensure the QR code was generated properly.", "search");
      return;
    }

    console.log("📊 Reservation status:", reservation.status);

    // Check reservation status
    if (reservation.status === 'cancelled') {
      showModal(false, "This reservation has been cancelled.\nPlease contact the front desk for assistance.", "ban");
      return;
    }

    if (reservation.status === 'pending') {
      showModal(false, "This reservation is still pending confirmation.\nPlease wait for confirmation before checking in.", "time");
      return;
    }

    if (reservation.status === 'checked-in') {
      showModal(false, "This reservation has already been checked in.\nCannot check in again.", "alert-circle");
      return;
    }

    // ✅ IMPROVED: Check verification code with better error handling
    const storedVerificationCode = 
      reservation.qrData?.verificationCode || 
      reservation.qrVerificationCode;

    console.log(`🔑 Stored verification code: ${storedVerificationCode}`);

    if (!storedVerificationCode) {
      console.error("❌ No stored verification code found");
      showModal(false, "QR code not properly configured.\nPlease regenerate the QR code from the admin panel.", "warning");
      return;
    }

    if (verificationCode !== storedVerificationCode) {
      console.error("❌ Verification code mismatch");
      console.error(`QR Code: ${verificationCode} | Stored: ${storedVerificationCode}`);
      showModal(false, "Verification code mismatch.\nThis may be an old or regenerated QR code.", "key");
      return;
    }

    // ✅ SUCCESS - All checks passed
    console.log("✅ QR Verified Successfully!");
    showModal(true, "Reservation verified successfully!\nRedirecting to details...", "checkmark");
    
    // Navigate after a short delay to show success message
    setTimeout(() => {
      navigation.replace("ReservationDetails", { reservation });
    }, 1500);
    
  } catch (error) {
    console.error("❌ QR Scan Error:", error);
    showModal(false, "Scanning failed.\nPlease try again or contact support.", "wifi");
  } finally {
    isProcessing.current = false;
  }
};

  const resetScanner = () => {
    isProcessing.current = false;
    setScanned(false);
    setCameraActive(true);
  };

  const handleManualClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color="#C8A951" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need your permission to scan QR codes for reservation verification.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleManualClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cameraActive ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417", "code128", "code39", "ean13", "ean8"]
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      ) : (
        <View style={[styles.camera, styles.cameraDisabled]}>
          <Ionicons name="camera-outline" size={50} color="#fff" />
          <Text style={styles.cameraDisabledText}>Scanner Paused</Text>
        </View>
      )}
      
      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleManualClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <Text style={styles.scannerSubtitle}>Position the QR code within the frame</Text>
          </View>
        </View>

        {/* Scanner Frame */}
        <View style={styles.scannerContainer}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          
          {/* Animated Scan Line */}
          <Animated.View 
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 280]
                  })
                }]
              }
            ]} 
          />
        </View>

        {/* Bottom Instructions */}
        <View style={styles.bottomBar}>
          <Ionicons name="information-circle" size={20} color="#fff" />
          <Text style={styles.instructionText}>
            Scan a valid reservation QR code to check in guests
          </Text>
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="none"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[
              styles.modalIcon,
              { backgroundColor: scanResult.success ? '#4CAF50' : '#FF6B6B' }
            ]}>
              <Ionicons 
                name={scanResult.icon} 
                size={40} 
                color="#fff" 
              />
            </View>
            
            <Text style={styles.modalTitle}>
              {scanResult.success ? "Success!" : "Unable to Verify"}
            </Text>
            
            <Text style={styles.modalMessage}>
              {scanResult.message}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.modalButton,
                { backgroundColor: scanResult.success ? '#4CAF50' : '#FF6B6B' }
              ]} 
              onPress={hideModal}
            >
              <Text style={styles.modalButtonText}>
                {scanResult.success ? "Continue" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}