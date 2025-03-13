import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { Camera, CameraView, CameraType, BarcodeScanningResult } from "expo-camera";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

// Types
interface Phone {
  id: string;
  model: string;
  imei: string;
  status: "in_stock" | "sold" | "with_retailer";
  dateUpdated: string;
}

// Simple GradientView component
const GradientView = ({
  colors,
  style,
  children,
}: {
  colors: string[];
  style?: any;
  children?: React.ReactNode;
}) => {
  return (
    <View style={[style, { backgroundColor: colors[0] }]}>{children}</View>
  );
};

const BarcodeScannerPage = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedImei, setScannedImei] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessingModalVisible, setIsProcessingModalVisible] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Request camera permission on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    setIsProcessingModalVisible(true);

    // Validate if the scanned data could be an IMEI
    const imeiRegex = /^\d{15,17}$/;

    if (imeiRegex.test(data)) {
      // Valid IMEI format
      setScannedImei(data);
      processScannedIMEI(data);
    } else {
      // Not a valid IMEI format
      setTimeout(() => {
        setIsProcessingModalVisible(false);
        Alert.alert(
          "Invalid Barcode",
          "The scanned barcode doesn't appear to be a valid IMEI number. Please try again.",
          [
            {
              text: "OK",
              onPress: () => setScanned(false),
            },
          ]
        );
      }, 1000);
    }
  };

  // Process the scanned IMEI
  const processScannedIMEI = (imei: string) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsProcessingModalVisible(false);

      Alert.alert(
        "IMEI Scanned Successfully",
        `Scanned IMEI: ${imei}`,
        [
          {
            text: "Add to Inventory",
            // Uncomment and type navigation if needed
            // onPress: () => {
            //   navigation.navigate("Home", {
            //     scannedImei: imei,
            //     openAddModal: true,
            //   });
            // },
          },
          {
            text: "Scan Again",
            onPress: () => {
              setScannedImei("");
              setScanned(false);
            },
            style: "cancel",
          },
        ]
      );
    }, 1500);
  };

  // Toggle the flashlight
  const toggleTorch = () => {
    setIsTorchOn(!isTorchOn);
  };

  // Handler for camera ready state
  const handleCameraReady = () => {
    setCameraReady(true);
  };

  // Handle when user cancels scanning
  const handleCancel = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
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

      {/* Top Header */}
      <GradientView colors={["#1A237E", "#3949AB"]} style={styles.topHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Scan IMEI</Text>
            <Text style={styles.subtitle}>
              Point camera at barcode to scan
            </Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </GradientView>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onCameraReady={handleCameraReady}
        enableTorch={isTorchOn} // Replaced flashMode with enableTorch
        barcodeScannerSettings={{
          barcodeTypes: ["code39", "code128", "ean13", "qr"],
        }}
      >
          
          <View style={styles.overlay}>
            {/* Scan area frame */}
            <View style={styles.scanAreaFrame}>
              <View style={styles.scanCorner} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View>

            {/* Scan instruction */}
            <View style={styles.scanInstructionContainer}>
              <Text style={styles.scanInstructionText}>
                Align barcode within frame
              </Text>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleTorch}
        >
          <Icon
            name={isTorchOn ? "flash-on" : "flash-off"}
            size={26}
            color={isTorchOn ? "#FFD700" : "#FFF"}
          />
          <Text style={styles.controlText}>
            {isTorchOn ? "Flash On" : "Flash Off"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.scanButton]}
          onPress={() => {
            if (!scanned) {
              setScanned(true);
              handleBarCodeScanned({
                type: "manual",
                data: "123456789012345",
                cornerPoints: [],
                bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
              });
            } else {
              setScanned(false);
            }
          }}
        >
          <Icon name={scanned ? "refresh" : "qr-code-scanner"} size={32} color="#FFF" />
          <Text style={styles.controlText}>
            {scanned ? "Scan Again" : "Scanning..."}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCancel}
        >
          <Icon name="close" size={26} color="#FFF" />
          <Text style={styles.controlText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Processing Modal */}
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
              <Text style={styles.imeiText}>{scannedImei}</Text>
            )}
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
    backgroundColor: "#000",
  },
  topHeader: {
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    paddingBottom: 16,
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
  placeholderView: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
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
    overflow: "hidden",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 40,
    width: 80,
    height: 80,
    marginHorizontal: 20,
  },
  controlText: {
    color: "#FFF",
    marginTop: 8,
    fontSize: 12,
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
  },
});

export default BarcodeScannerPage;