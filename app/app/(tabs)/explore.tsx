import React, { useState, useEffect } from "react";
import { StyleSheet, Button, View, ViewStyle, TextStyle } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera"; // Stable import
import DropDownPicker from "react-native-dropdown-picker";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Define types for custom components
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

interface ParallaxScrollViewProps {
  headerBackgroundColor: { light: string; dark: string };
  headerImage: React.ReactNode;
  children: React.ReactNode;
}

interface ThemedTextProps {
  type?: "title" | "defaultSemiBold";
  children: React.ReactNode;
  style?: TextStyle;
}

interface ThemedViewProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

interface IconSymbolProps {
  size: number;
  color: string;
  name: string;
  style: ViewStyle;
}

// Sample phone models
const phoneModels: string[] = [
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "Samsung Galaxy S21",
  "Samsung Galaxy S21+",
  "Samsung Galaxy S21 Ultra",
  "Samsung Galaxy S22",
  "Samsung Galaxy S22+",
  "Samsung Galaxy S22 Ultra",
  "Samsung Galaxy S23",
  "Samsung Galaxy S23+",
  "Samsung Galaxy S23 Ultra",
  "Google Pixel 6",
  "Google Pixel 6 Pro",
  "Google Pixel 7",
  "Google Pixel 7 Pro",
  "Google Pixel 8",
  "Google Pixel 8 Pro",
];

// Define types for DropDownPicker items
interface DropdownItem {
  label: string;
  value: string;
}

export default function ExploreScreen(): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [detectedIMEI, setDetectedIMEI] = useState<string>("");
  const [modelOpen, setModelOpen] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);

  useEffect(() => {
    if (showScanner && !permission) {
      requestPermission();
    }
  }, [showScanner, permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    const imeiRegex = /^\d{15}$/;
    if (imeiRegex.test(data)) {
      setDetectedIMEI(data);
      setShowScanner(false);
    } else {
      alert("Invalid IMEI format. Please try scanning again.");
      setScanned(false);
    }
  };

  const resetDetection = (): void => {
    setScanned(false);
    setDetectedIMEI("");
    setSelectedModel(null);
    setSelectedStatus(null);
    setShowScanner(false);
  };

  const handleConfirm = (): void => {
    console.log({
      imei: detectedIMEI,
      model: selectedModel,
      status: selectedStatus,
    });
    resetDetection();
  };

  const renderScannerView = (): JSX.Element => {
    if (!permission) {
      return <ThemedText>Requesting camera permission...</ThemedText>;
    }

    if (!permission.granted) {
      return (
        <ThemedText>
          No access to camera. Please enable camera permissions.
        </ThemedText>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["code128", "code39", "qr"], // Fixed typo: barCodeTypes -> barcodeTypes
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTargetBox} />
            <ThemedText style={styles.scanInstructions}>
              Position the barcode within the frame
            </ThemedText>
          </View>
          <View style={styles.scannerControls}>
            <Button
              title="Cancel"
              onPress={() => setShowScanner(false)}
              color="gray"
            />
            {scanned && (
              <Button
                title="Scan Again"
                onPress={() => setScanned(false)}
                color="#2196F3"
              />
            )}
          </View>
        </CameraView>
      </View>
    );
  };

  const renderIMEIForm = (): JSX.Element => {
    return (
      <View style={styles.form}>
        <ThemedText style={styles.imeiText}>
          Detected IMEI:{" "}
          <ThemedText type="defaultSemiBold">{detectedIMEI}</ThemedText>
        </ThemedText>

        <View style={styles.dropdownContainer}>
          <ThemedText style={styles.label}>Phone Model:</ThemedText>
          <DropDownPicker
            open={modelOpen}
            value={selectedModel}
            items={phoneModels.map((model) => ({ label: model, value: model }))}
            setOpen={setModelOpen}
            setValue={setSelectedModel}
            placeholder="Select phone model"
            searchable={true}
            zIndex={3000}
            zIndexInverse={1000}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownList}
          />
        </View>

        <View style={styles.dropdownContainer}>
          <ThemedText style={styles.label}>Status:</ThemedText>
          <DropDownPicker
            open={statusOpen}
            value={selectedStatus}
            items={[
              { label: "New", value: "new" },
              { label: "Used", value: "used" },
              { label: "Refurbished", value: "refurbished" },
              { label: "Damaged", value: "damaged" },
            ]}
            setOpen={setStatusOpen}
            setValue={setSelectedStatus}
            placeholder="Select status"
            zIndex={2000}
            zIndexInverse={2000}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownList}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Confirm"
            onPress={handleConfirm}
            disabled={!selectedModel || !selectedStatus}
          />
          <Button title="Start Over" onPress={resetDetection} color="gray" />
        </View>
      </View>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">IMEI Barcode Scanner</ThemedText>
      </ThemedView>

      {showScanner ? (
        renderScannerView()
      ) : detectedIMEI ? (
        renderIMEIForm()
      ) : (
        <View style={styles.introContainer}>
          <ThemedText style={styles.description}>
            Use your camera to scan an IMEI barcode from a device, then select
            the phone model and status.
          </ThemedText>

          <Button
            title="Start IMEI Scan"
            onPress={() => {
              setShowScanner(true);
              setScanned(false);
            }}
          />

          <Collapsible title="How to use this feature">
            <ThemedText>
              1. Point your camera at the device's IMEI barcode (usually found
              on the retail box, back of the device, or under the battery).
            </ThemedText>
            <ThemedText>
              2. The app will automatically detect the 15-digit IMEI number from
              the barcode.
            </ThemedText>
            <ThemedText>
              3. Select the phone model from the dropdown menu.
            </ThemedText>
            <ThemedText>4. Choose the device status.</ThemedText>
            <ThemedText>
              5. Click "Confirm" to submit the information.
            </ThemedText>
          </Collapsible>

          <Collapsible title="About IMEI Numbers">
            <ThemedText>
              An IMEI (International Mobile Equipment Identity) is a 15-digit
              number unique to every mobile device. It's used to identify valid
              devices and can be used to block stolen phones.
            </ThemedText>
            <ThemedText>
              You can usually find the IMEI by dialing *#06# on the device or
              checking in Settings. Most devices also have the IMEI printed on
              the retail box as a barcode.
            </ThemedText>
          </Collapsible>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  } as ViewStyle,
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  } as ViewStyle,
  introContainer: {
    gap: 16,
  } as ViewStyle,
  description: {
    marginBottom: 20,
  } as TextStyle,
  scannerContainer: {
    height: 400,
    marginVertical: 20,
    borderRadius: 8,
    overflow: "hidden",
  } as ViewStyle,
  scanner: {
    flex: 1,
  } as ViewStyle,
  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  scannerTargetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#00FF00",
    backgroundColor: "transparent",
  } as ViewStyle,
  scanInstructions: {
    color: "white",
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  } as TextStyle,
  scannerControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  } as ViewStyle,
  form: {
    paddingVertical: 20,
    gap: 16,
  } as ViewStyle,
  imeiText: {
    fontSize: 16,
    marginBottom: 10,
  } as TextStyle,
  dropdownContainer: {
    marginBottom: 30,
    zIndex: 1000,
  } as ViewStyle,
  label: {
    marginBottom: 8,
  } as TextStyle,
  dropdown: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  } as ViewStyle,
  dropdownList: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  } as ViewStyle,
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  } as ViewStyle,
});