import React, { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthContext } from "../../context/AuthContext";
import { app } from "../../config/firebase";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Initialize Firestore
const db = getFirestore(app);

// Define InventoryData interface
interface InventoryData {
  imei: string;
  model: string;
  status: "in_stock" | "sold" | "with_retailer";
}

// Simple background component instead of gradient
const HeaderBackground: React.FC<{
  style?: object;
  children?: React.ReactNode;
}> = ({ style, children }) => {
  return (
    <View style={[style, { backgroundColor: "#1A237E" }]}>{children}</View>
  );
};

const BarcodeScannerPage = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const { storeData } = useContext(AuthContext);

  // Core state
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Phone data state
  const [scannedImei, setScannedImei] = useState("");
  const [phoneModel, setPhoneModel] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<
    "in_stock" | "sold" | "with_retailer"
  >("in_stock");
  const [phoneExists, setPhoneExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle QR code scan result
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    setLoading(true);

    try {
      // Parse QR code data (expected format: "IMEI Model")
      const qrRegex = /^(\d{15,17}) (.+)$/;
      const match = data.match(qrRegex);

      if (!match) {
        throw new Error("Invalid QR code format");
      }

      const imei = match[1];
      const model = match[2];

      // Check if phone exists in inventory
      if (!storeData?.phoneNumber) {
        throw new Error("Store data is missing. Please log in again.");
      }

      if (!storeData) {
        throw new Error("Store data is missing. Please log in again.");
      }
      if (!storeData) {
        throw new Error("Store data is missing. Please log in again.");
      }
      const phoneDoc = await getDoc(
        doc(db, `stores/${storeData.phoneNumber}/inventory`, imei)
      );

      // Set state based on whether phone exists
      if (phoneDoc.exists()) {
        const data = phoneDoc.data() as InventoryData;
        setPhoneExists(true);
        setPhoneModel(data.model);
        setPhoneStatus(data.status);
      } else {
        setPhoneExists(false);
        setPhoneModel(model);
        setPhoneStatus("in_stock");
      }

      setScannedImei(imei);
      setShowModal(true);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to process QR code"
      );
      resetScan();
    } finally {
      setLoading(false);
    }
  };

  // Add phone to inventory
  const handleAddPhone = async () => {
    if (!scannedImei || !phoneModel) {
      setErrorMessage("Model is required");
      return;
    }

    setLoading(true);

    try {
      if (!storeData) {
        setErrorMessage("Store data is missing. Please log in again.");
        setLoading(false);
        return;
      }
      await setDoc(
        doc(db, `stores/${storeData.phoneNumber}/inventory`, scannedImei),
        {
          imei: scannedImei,
          model: phoneModel,
          status: phoneStatus,
          createdAt: serverTimestamp(),
          dateUpdated: serverTimestamp(),
        }
      );

      Alert.alert("Success", "Phone added to inventory");
      resetScan();
    } catch (error) {
      setErrorMessage("Failed to add phone. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update phone status
  const handleUpdatePhone = async () => {
    setLoading(true);

    try {
      if (!storeData) {
        setErrorMessage("Store data is missing. Please log in again.");
        setLoading(false);
        return;
      }
      await updateDoc(
        doc(db, `stores/${storeData.phoneNumber}/inventory`, scannedImei),
        {
          status: phoneStatus,
          dateUpdated: serverTimestamp(),
        }
      );

      Alert.alert("Success", "Phone status updated");
      resetScan();
    } catch (error) {
      setErrorMessage("Failed to update phone. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete phone from inventory
  const handleDeletePhone = async () => {
    setLoading(true);

    try {
      if (!storeData) {
        setErrorMessage("Store data is missing. Please log in again.");
        setLoading(false);
        return;
      }
      await deleteDoc(
        doc(db, `stores/${storeData.phoneNumber}/inventory`, scannedImei)
      );

      Alert.alert("Success", "Phone deleted from inventory");
      resetScan();
    } catch (error) {
      setErrorMessage("Failed to delete phone. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset all states
  const resetScan = () => {
    setShowModal(false);
    setScannedImei("");
    setPhoneModel("");
    setPhoneStatus("in_stock");
    setPhoneExists(false);
    setErrorMessage("");

    // Delay enabling scanning to prevent immediate re-scan
    setTimeout(() => {
      setScanning(true);
    }, 1000);
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="no-photography" size={64} color="#FF6B6B" />
        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1A237E" />

      <HeaderBackground style={styles.topHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>Point camera at QR code to scan</Text>
        </View>
      </HeaderBackground>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanAreaFrame}>
              <View style={styles.scanCorner} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View>
            <View style={styles.scanInstructionContainer}>
              <Text style={styles.scanInstructionText}>
                Align QR code within frame
              </Text>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Phone Modal */}
      <Modal
        transparent={true}
        visible={showModal}
        animationType="slide"
        onRequestClose={resetScan}
      >
        <View style={styles.modalBackground}>
          <View style={styles.phoneModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {phoneExists ? "Update Phone" : "Add New Phone"}
              </Text>
              <TouchableOpacity onPress={resetScan}>
                <Icon name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.imeiContainer}>
                <Icon name="smartphone" size={20} color="#0066CC" />
                <Text style={styles.imeiLabel}>IMEI:</Text>
                <Text style={styles.imeiValue}>{scannedImei}</Text>
              </View>

              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Model"
                value={phoneModel}
                onChangeText={setPhoneModel}
                editable={!phoneExists}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusSelector}>
                {[
                  { value: "in_stock", label: "In Stock" },
                  { value: "sold", label: "Sold" },
                  { value: "with_retailer", label: "With Retailer" },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      phoneStatus === status.value &&
                        styles.statusOptionSelected,
                    ]}
                    onPress={() =>
                      setPhoneStatus(
                        status.value as "in_stock" | "sold" | "with_retailer"
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.statusText,
                        phoneStatus === status.value &&
                          styles.statusTextSelected,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {phoneExists ? (
                <>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdatePhone}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeletePhone}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPhone}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Add to Inventory</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetScan}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
const { width } = Dimensions.get("window");
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  topHeader: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanAreaFrame: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: "relative",
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.5)",
    borderRadius: 12,
  },
  scanCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#4CAF50",
    borderWidth: 3,
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    right: 0,
    left: undefined,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    top: undefined,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: undefined,
    left: undefined,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanInstructionContainer: {
    position: "absolute",
    bottom: -70,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanInstructionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    width: "100%",
    marginBottom: 16,
  },
  imeiContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#F5F7FA",
    borderRadius: 8,
  },
  imeiLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  imeiValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 16,
    fontSize: 16,
  },
  statusSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#F5F5F5",
  },
  statusOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#0066CC",
  },
  statusText: {
    fontSize: 14,
    color: "#555",
  },
  statusTextSelected: {
    color: "#0066CC",
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    marginLeft: 8,
  },
  modalActions: {
    width: "100%",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  updateButton: {
    backgroundColor: "#0066CC",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "#FF5252",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16,
  },
});

export default BarcodeScannerPage;
