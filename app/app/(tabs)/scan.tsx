import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  TextInput,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "./../types";

const GradientView = ({
  colors,
  style,
  children,
}: {
  colors: string[];
  style?: object;
  children: React.ReactNode;
}) => {
  return (
    <View style={[style, { backgroundColor: colors[0] }]}>{children}</View>
  );
};

const BarcodeScannerPage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedImei, setScannedImei] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingModalVisible, setIsProcessingModalVisible] =
    useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAddPhoneModalVisible, setIsAddPhoneModalVisible] = useState(false);
  const [phoneModel, setPhoneModel] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<
    "in_stock" | "sold" | "with_retailer"
  >("in_stock");
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    console.log("Barcode scanned:", data);
    setScanned(true);
    setIsProcessingModalVisible(true);
    const imeiRegex = /^\d{15,17}$/;
    if (imeiRegex.test(data)) {
      console.log("IMEI matched:", data);
      processScannedIMEI(data);
    } else {
      console.log("IMEI did not match:", data);
      setTimeout(() => {
        setIsProcessingModalVisible(false);
        setScanned(false);
      }, 1000);
    }
  };

  const processScannedIMEI = (imei: string): void => {
    console.log("Processing IMEI:", imei);
    setIsLoading(true);
    setScannedImei(imei);
    setTimeout(() => {
      console.log("Timeout finished");
      setIsLoading(false);
      setIsProcessingModalVisible(false);
      setIsAddPhoneModalVisible(true);
    }, 1500);
  };

  const handleAddPhone = () => {
    navigation.navigate("Home", {
      newPhone: {
        id: Date.now().toString(),
        model: phoneModel,
        imei: scannedImei,
        status: phoneStatus,
        dateUpdated: new Date().toISOString(),
      },
    });
    setIsAddPhoneModalVisible(false);
    setPhoneModel("");
    setPhoneStatus("in_stock");
    setScanned(false);
  };

  const handleCameraReady = () => setCameraReady(true);
  const handleCancel = () => navigation.goBack();

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="no-photography" size={64} color="#FF6B6B" />
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <GradientView colors={["#1A237E", "#3949AB"]} style={styles.topHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Scan IMEI</Text>
            <Text style={styles.subtitle}>Point camera at barcode to scan</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </GradientView>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          onCameraReady={handleCameraReady}
          barcodeScannerSettings={{
            barcodeTypes: ["code39", "code128", "ean13", "qr"],
          }}
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
                Align barcode within frame
              </Text>
            </View>
          </View>
        </CameraView>
      </View>

      <Modal
        transparent={true}
        visible={isProcessingModalVisible}
        animationType="fade"
        onRequestClose={() => setIsProcessingModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.processingModal}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.processingText}>
              {isLoading ? "Processing IMEI..." : "Analyzing barcode..."}
            </Text>
            {scannedImei !== "" && (
              <Text style={styles.imeiText}>IMEI: {scannedImei}</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={isAddPhoneModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAddPhoneModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.addPhoneModal}>
            <Text style={styles.modalTitle}>Add Phone Details</Text>
            <Text style={styles.imeiText}>IMEI: {scannedImei}</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Model"
              value={phoneModel}
              onChangeText={setPhoneModel}
            />
            <View style={styles.statusContainer}>
              <Text>Status: </Text>
              <TouchableOpacity onPress={() => setPhoneStatus("in_stock")}>
                <Text
                  style={
                    phoneStatus === "in_stock"
                      ? styles.selectedStatus
                      : styles.statusOption
                  }
                >
                  In Stock
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPhoneStatus("sold")}>
                <Text
                  style={
                    phoneStatus === "sold"
                      ? styles.selectedStatus
                      : styles.statusOption
                  }
                >
                  Sold
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPhoneStatus("with_retailer")}>
                <Text
                  style={
                    phoneStatus === "with_retailer"
                      ? styles.selectedStatus
                      : styles.statusOption
                  }
                >
                  With Retailer
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddPhone}
            >
              <Text style={styles.submitButtonText}>Add to Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsAddPhoneModalVisible(false);
                setScanned(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  topHeader: {
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  placeholderView: { width: 40 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  cameraContainer: { flex: 1, justifyContent: "center" },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanAreaFrame: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: "relative",
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
    bottom: -50,
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
    paddingVertical: 8,
    borderRadius: 20,
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
    marginTop: 20,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: { color: "#FFF", fontSize: 16, fontWeight: "500" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  processingText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
  },
  imeiText: {
    fontSize: 16,
    color: "#0066CC",
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 12,
  },
  addPhoneModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  statusOption: { fontSize: 16, color: "#555" },
  selectedStatus: { fontSize: 16, color: "#0066CC", fontWeight: "bold" },
  submitButton: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "500" },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "500" },
});

export default BarcodeScannerPage;