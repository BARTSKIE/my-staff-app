import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Specific validation messages
    if (!email && !password) {
      Alert.alert("⚠️ Missing info", "Please enter both Admin ID and Admin Pass.");
      return;
    }

    if (!email) {
      Alert.alert("⚠️ Missing Admin ID", "Please enter your Admin ID.");
      return;
    }

    if (!password) {
      Alert.alert("⚠️ Missing Admin Pass", "Please enter your Admin Pass.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.code === 'auth/invalid-credential') {
        Alert.alert("❌ Login Failed", "Invalid Admin ID or Admin Pass.");
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("❌ Login Blocked", "Too many failed attempts. Please try again later.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("❌ Invalid Admin ID", "Please enter a valid Admin ID.");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("❌ Network Error", "Please check your internet connection.");
      } else {
        Alert.alert("❌ Login Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Don.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Admin Login</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Icon name="mail" size={20} color="#C8A951" style={styles.icon} />
        <TextInput
          placeholder="Admin ID"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#C8A951" style={styles.icon} />
        <TextInput
          placeholder="Admin Pass"
          placeholderTextColor="#999"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          <Icon
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#C8A951"
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 25,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#333",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: "#C8A951",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});