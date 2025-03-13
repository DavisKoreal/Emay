import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

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

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [filteredPhones, setFilteredPhones] = useState<Phone[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  // Add Phone Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState<Partial<Phone>>({
    model: "",
    imei: "",
    status: "in_stock",
    dateUpdated: new Date().toISOString(),
  });
  const [scannerActive, setScannerActive] = useState(false);

  // Mock data loading
  useEffect(() => {
    loadPhones();
  }, []);

  // Apply search filter
  useEffect(() => {
    filterPhones(activeFilter, searchQuery);
  }, [searchQuery, activeFilter, phones]);

  const loadPhones = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockPhones: Phone[] = [
        {
          id: "1",
          model: "iPhone 15 Pro",
          imei: "353267890123456",
          status: "in_stock",
          dateUpdated: "2025-03-10T14:30:00",
        },
        {
          id: "2",
          model: "Samsung Galaxy S25",
          imei: "357123456789012",
          status: "sold",
          dateUpdated: "2025-03-09T10:15:00",
        },
        {
          id: "3",
          model: "Google Pixel 9",
          imei: "359876543210987",
          status: "with_retailer",
          dateUpdated: "2025-03-08T16:45:00",
        },
        {
          id: "4",
          model: "Samsung Galaxy S25 Ultra",
          imei: "358765432109876",
          status: "sold",
          dateUpdated: "2025-03-07T09:20:00",
        },
        {
          id: "5",
          model: "iPhone 15",
          imei: "352876543210987",
          status: "in_stock",
          dateUpdated: "2025-03-06T11:10:00",
        },
        {
          id: "6",
          model: "OnePlus 12",
          imei: "356987654321098",
          status: "sold",
          dateUpdated: "2025-03-05T15:30:00",
        },
      ];
      setPhones(mockPhones);
      setFilteredPhones(mockPhones);
      setIsLoading(false);
    }, 1000);
  };

  const filterPhones = (filter: string, query: string) => {
    let result = [...phones];
    if (filter !== "all") {
      result = result.filter((phone) => phone.status === filter);
    }
    if (query.trim() !== "") {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(
        (phone) =>
          phone.imei.includes(lowercaseQuery) ||
          phone.model.toLowerCase().includes(lowercaseQuery)
      );
    }
    setFilteredPhones(result);
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "in_stock":
        return { label: "In Stock", color: "#4CAF50", icon: "inventory-2" };
      case "sold":
        return { label: "Sold", color: "#2196F3", icon: "person" };
      case "with_retailer":
        return { label: "With Retailer", color: "#FF9800", icon: "store" };
      default:
        return { label: "Unknown", color: "#757575", icon: "help" };
    }
  };

  const getDateLabel = (status: string) => {
    switch (status) {
      case "in_stock":
        return "Added on";
      case "sold":
        return "Sold on";
      case "with_retailer":
        return "Left on";
      default:
        return "Updated on";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPhoneItem = ({ item }: { item: Phone }) => {
    const statusInfo = getStatusDetails(item.status);
    const getPhoneIcon = (model: string) => {
      if (model.toLowerCase().includes("iphone")) return "phone-iphone";
      if (model.toLowerCase().includes("samsung")) return "smartphone";
      if (model.toLowerCase().includes("pixel")) return "tablet-android";
      return "devices";
    };

    return (
      <TouchableOpacity
        style={styles.phoneItem}
        onPress={() => console.log("Selected phone with IMEI:", item.imei)}
      >
        <View style={styles.phoneItemInner}>
          <View style={styles.phoneIconWrapper}>
            <Icon name={getPhoneIcon(item.model)} size={28} color="#0066CC" />
          </View>
          <View style={styles.phoneContent}>
            {/* Header: Model only */}
            <View style={styles.phoneHeader}>
              <Text style={styles.phoneModel}>{item.model}</Text>
            </View>

            {/* Middle Content: IMEI */}
            <View style={styles.imeiContainer}>
              <Icon name="fingerprint" size={16} color="#0066CC" />
              <Text style={styles.imeiText}>{item.imei}</Text>
            </View>

            {/* Footer: Date and Status */}
            <View style={styles.phoneFooter}>
              <View style={styles.dateContainer}>
                <Icon name="event" size={14} color="#888" />
                <Text style={styles.dateText}>
                  {getDateLabel(item.status)} {formatDate(item.dateUpdated)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusInfo.color },
                ]}
              >
                <Icon
                  name={statusInfo.icon}
                  size={14}
                  color="#fff"
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>{statusInfo.label}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filter: string, label: string, icon: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setActiveFilter(filter)}
      >
        <View
          style={[
            styles.filterIconWrapper,
            isActive && styles.filterIconWrapperActive,
          ]}
        >
          <Icon name={icon} size={18} color={isActive ? "#FFF" : "#555"} />
        </View>
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getCountByStatus = (status: string) => {
    if (status === "all") return phones.length;
    return phones.filter((phone) => phone.status === status).length;
  };

  // Add Phone Modal Functions
  const openAddPhoneModal = () => {
    setNewPhone({
      model: "",
      imei: "",
      status: "in_stock",
      dateUpdated: new Date().toISOString(),
    });
    setModalVisible(true);
  };

  const handleInputChange = (field: keyof Phone, value: string) => {
    setNewPhone((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (
    status: "in_stock" | "sold" | "with_retailer"
  ) => {
    setNewPhone((prev) => ({ ...prev, status }));
  };

  const validateForm = (): boolean => {
    if (!newPhone.model || !newPhone.imei) {
      Alert.alert("Validation Error", "Phone model and IMEI are required");
      return false;
    }

    // Check for duplicate IMEI
    if (phones.some((phone) => phone.imei === newPhone.imei)) {
      Alert.alert(
        "Duplicate IMEI",
        "A phone with this IMEI already exists in the inventory"
      );
      return false;
    }

    // Validate IMEI format (typically 15-17 digits)
    const imeiRegex = /^\d{15,17}$/;
    if (!imeiRegex.test(newPhone.imei)) {
      Alert.alert("Invalid IMEI", "IMEI should be 15-17 digits");
      return false;
    }

    return true;
  };

  const handleAddPhone = () => {
    if (!validateForm()) return;

    const newId = (
      Math.max(...phones.map((p) => parseInt(p.id)), 0) + 1
    ).toString();

    const phoneToAdd: Phone = {
      id: newId,
      model: newPhone.model!,
      imei: newPhone.imei!,
      status: newPhone.status as "in_stock" | "sold" | "with_retailer",
      dateUpdated: newPhone.dateUpdated!,
    };

    // Add the new phone to the phones array
    setPhones((prevPhones) => [...prevPhones, phoneToAdd]);

    // Close the modal
    setModalVisible(false);

    // Show success message
    Alert.alert("Success", "Phone added to inventory");
  };

  // Mock barcode scanner function
  const handleScanBarcode = () => {
    // In a real app, this would open the camera for scanning
    // For this implementation, we'll just simulate finding a barcode
    setScannerActive(true);

    // Simulate scanning process with a timeout
    setTimeout(() => {
      // Generate a random valid IMEI
      const randomIMEI = Array(15)
        .fill(0)
        .map(() => Math.floor(Math.random() * 10))
        .join("");

      // Update the IMEI field with the scanned value
      setNewPhone((prev) => ({ ...prev, imei: randomIMEI }));
      setScannerActive(false);

      // Show success message
      Alert.alert("IMEI Scanned", `Scanned IMEI: ${randomIMEI}`);
    }, 2000);
  };

  // Render the status selector in the modal
  const renderStatusSelector = () => {
    const statuses = [
      {
        value: "in_stock",
        label: "In Stock",
        icon: "inventory-2",
        color: "#4CAF50",
      },
      { value: "sold", label: "Sold", icon: "person", color: "#2196F3" },
      {
        value: "with_retailer",
        label: "With Retailer",
        icon: "store",
        color: "#FF9800",
      },
    ];

    return (
      <View style={styles.statusSelectorContainer}>
        <Text style={styles.inputLabel}>Status:</Text>
        <View style={styles.statusButtonsRow}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusSelectButton,
                newPhone.status === status.value && {
                  borderColor: status.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() =>
                handleStatusChange(
                  status.value as "in_stock" | "sold" | "with_retailer"
                )
              }
            >
              <Icon
                name={status.icon}
                size={20}
                color={status.color}
                style={styles.statusSelectIcon}
              />
              <Text
                style={[
                  styles.statusSelectText,
                  newPhone.status === status.value && {
                    color: status.color,
                    fontWeight: "bold",
                  },
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      {/* Top Header */}
      <GradientView colors={["#1A237E", "#3949AB"]} style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Cellucity</Text>
            <Text style={styles.subtitle}>IMEI Inventory Tracker</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton}>
            <Icon name="account-circle" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </GradientView>
      {/* Search and Stats */}
      <View style={styles.subHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#777" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by IMEI or model"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>
          {/* Add button moved next to search bar */}
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={openAddPhoneModal}
          >
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: "#D4EFDF" }]}>
            <Icon name="inventory-2" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{getCountByStatus("in_stock")}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#BBDEFB" }]}>
            <Icon name="person" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{getCountByStatus("sold")}</Text>
            <Text style={styles.statLabel}>Sold</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FFE0B2" }]}>
            <Icon name="store" size={24} color="#FF9800" />
            <Text style={styles.statValue}>
              {getCountByStatus("with_retailer")}
            </Text>
            <Text style={styles.statLabel}>With Retailer</Text>
          </View>
        </ScrollView>
      </View>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {renderFilterButton(
            "all",
            `All (${getCountByStatus("all")})`,
            "list"
          )}
          {renderFilterButton(
            "in_stock",
            `In Stock (${getCountByStatus("in_stock")})`,
            "inventory-2"
          )}
          {renderFilterButton(
            "sold",
            `Sold (${getCountByStatus("sold")})`,
            "person"
          )}
          {renderFilterButton(
            "with_retailer",
            `With Retailer (${getCountByStatus("with_retailer")})`,
            "store"
          )}
        </ScrollView>
      </View>
      {/* Phones List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPhones}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoneItem}
          contentContainerStyle={styles.phonesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color="#DDD" />
              <Text style={styles.emptyText}>No phones found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try a different search term"
                  : "Add a phone to get started"}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.resetButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Add Phone Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Phone</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {scannerActive ? (
              <View style={styles.scannerContainer}>
                <View style={styles.mockScanner}>
                  <Icon name="qr-code-scanner" size={64} color="#0066CC" />
                  <Text style={styles.scannerText}>Scanning...</Text>
                  <ActivityIndicator
                    size="large"
                    color="#0066CC"
                    style={styles.scannerLoader}
                  />
                </View>
              </View>
            ) : (
              <ScrollView style={styles.formContainer}>
                {/* Phone Model Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Model:</Text>
                  <View style={styles.textInputWrapper}>
                    <Icon
                      name="smartphone"
                      size={20}
                      color="#777"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. iPhone 15 Pro"
                      value={newPhone.model}
                      onChangeText={(text) => handleInputChange("model", text)}
                    />
                  </View>
                </View>

                {/* IMEI Input with Scanner */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>IMEI Number:</Text>
                  <View style={styles.imeiInputContainer}>
                    <View style={styles.textInputWrapper}>
                      <Icon
                        name="fingerprint"
                        size={20}
                        color="#777"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.modalInput, styles.imeiInput]}
                        placeholder="15-17 digit IMEI"
                        keyboardType="number-pad"
                        value={newPhone.imei}
                        onChangeText={(text) => handleInputChange("imei", text)}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={handleScanBarcode}
                    >
                      <Icon name="qr-code-scanner" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status Selector */}
                {renderStatusSelector()}

                {/* Date Updated Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Date:</Text>
                  <View style={styles.textInputWrapper}>
                    <Icon
                      name="calendar-today"
                      size={20}
                      color="#777"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.dateDisplay}>
                      {formatDate(
                        newPhone.dateUpdated || new Date().toISOString()
                      )}
                    </Text>
                  </View>
                  <Text style={styles.helperText}>
                    Date is automatically set to today
                  </Text>
                </View>

                {/* Form Buttons */}
                <View style={styles.formButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddPhone}
                  >
                    <Text style={styles.submitButtonText}>Add Phone</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// Add the new styles for the modal and form elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  topHeader: {
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  subHeader: {
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
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
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 58,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  // New add button style for the small button next to search
  addButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: "row",
  },
  statCard: {
    width: 110,
    height: 90,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: "#FFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersScroll: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: "#BBDEFB",
  },
  filterIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    marginRight: 6,
  },
  filterIconWrapperActive: {
    backgroundColor: "#0066CC",
  },
  filterText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#004080",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  phonesList: {
    padding: 16,
    paddingBottom: 100,
  },
  phoneItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  phoneItemInner: {
    flexDirection: "row",
    padding: 12,
  },
  phoneIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  phoneContent: {
    flex: 1,
  },
  phoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  phoneModel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "500",
  },
  imeiContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  imeiText: {
    fontSize: 14,
    marginLeft: 6,
    color: "#555",
    fontWeight: "500",
  },
  phoneFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: "#0066CC",
    fontWeight: "500",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  textInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  imeiInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imeiInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: "#0066CC",
    borderRadius: 10,
    width: 50,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  statusSelectorContainer: {
    marginBottom: 20,
  },
  statusButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusSelectButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  statusSelectIcon: {
    marginBottom: 6,
  },
  statusSelectText: {
    fontSize: 12,
    color: "#555",
  },
  dateDisplay: {
    fontSize: 16,
    color: "#333",
  },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  formButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#0066CC",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  scannerContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  mockScanner: {
    alignItems: "center",
    justifyContent: "center",
  },
  scannerText: {
    fontSize: 18,
    color: "#0066CC",
    marginTop: 16,
    fontWeight: "500",
  },
  scannerLoader: {
    marginTop: 20,
  },
});

export default HomePage;
