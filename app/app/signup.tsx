import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";
import { useRouter } from "expo-router";

const db = getFirestore(app);
const { width } = Dimensions.get("window");

const SignUp = () => {
  // Updated state variables
  const [supplierFirstName, setSupplierFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Updated input validation
  const validateInputs = () => {
    if (!supplierFirstName.trim()) {
      Alert.alert("Error", "Please enter your first name");
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!storeName.trim()) {
      Alert.alert("Error", "Please enter your store name");
      return false;
    }
    if (!/^[0-9]{4}$/.test(passcode)) {
      Alert.alert("Error", "Passcode must be exactly 4 digits");
      return false;
    }
    return true;
  };

  // Updated signup handler
  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    const storeId = phoneNumber; // Using phoneNumber as the unique store ID

    try {
      const storeRef = doc(db, "stores", storeId);
      const storeSnapshot = await getDoc(storeRef);

      if (storeSnapshot.exists()) {
        Alert.alert("Error", "A store with this phone number already exists");
        setLoading(false);
        return;
      }

      await setDoc(storeRef, {
        firstName: supplierFirstName,
        phoneNumber,
        storeName,
        passcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create placeholder subcollections
      await setDoc(doc(db, "stores", storeId, "inventory", "placeholder"), {});
      await setDoc(doc(db, "stores", storeId, "users", "placeholder"), {});

      Alert.alert("Success", "You have been registered successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert(
        "Error",
        "An error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a2a6c", "#b21f1f"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <MaterialCommunityIcons
              name="account-plus"
              size={50}
              color="#fff"
              style={styles.icon}
            />
            <Text style={styles.welcomeText}>Supplier Registration</Text>
            <Text style={styles.subtitleText}>Enter your details below</Text>

            {/* Supplier First Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={supplierFirstName}
                  onChangeText={setSupplierFirstName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="phone"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Store Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="store"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your store name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={storeName}
                  onChangeText={setStoreName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Passcode Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>4-digit Passcode</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 4-digit passcode"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={passcode}
                  onChangeText={setPasscode}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={24}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.registerText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace("/login")}
              disabled={loading}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },
  icon: {
    alignSelf: "center",
    marginVertical: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 15,
    paddingLeft: 10,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  picker: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  registerButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  registerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    textDecorationLine: "underline",
    marginBottom: 60,
  },
});

export default SignUp;
