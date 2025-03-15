import React, { useState, useEffect, useContext } from "react";
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
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext"; // Adjust path
import { getDoc, doc, collection, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase"; // Adjust path to your Firebase config
import { Picker } from "@react-native-picker/picker";

// **Types**
interface Phone {
  id: string;
  model: string;
  imei: string;
  status: "in_stock" | "sold" | "with_retailer";
  dateUpdated: string;
}

// **Simple GradientView Component**
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

// **Phone Models List**
const phoneModels = [
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro",
  "iPhone 14",
  "iPhone 13 Pro",
  "iPhone 13",
  "Samsung Galaxy S25",
  "Samsung Galaxy S25 Ultra",
  "Samsung Galaxy S24",
  "Samsung Galaxy S24 Ultra",
  "Samsung Galaxy S23",
  "Google Pixel 9",
  "Google Pixel 8",
  "Google Pixel 7",
  "OnePlus 12",
  "OnePlus 11",
  "OnePlus 10 Pro",
  "Xiaomi 14",
  "Xiaomi 13",
  "Sony Xperia 1 V",
  "Nokia G60",
  // Add more models as needed
];

// **HomePage Component**
const HomePage = () => {
  const { storeData, logout } = useContext(AuthContext); // Get storeData and logout from context
  const router = useRouter();

  // **State Definitions**
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [filteredPhones, setFilteredPhones] = useState<Phone[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState<Partial<Phone>>({
    model: "none",
    imei: "",
    status: "in_stock",
    dateUpdated: new Date().toISOString(),
  });
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // **Effect for Fetching Inventory from Firestore**
  useEffect(() => {
    if (storeData && storeData.phoneNumber) {
      const fetchInventory = async () => {
        setIsLoading(true);
        try {
          const inventoryRef = collection(
            firestore,
            "stores",
            storeData.phoneNumber,
            "inventory"
          );
          const querySnapshot = await getDocs(inventoryRef);
          const inventoryData = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Phone))
            .filter((phone) => phone.imei); // Only include phones with an IMEI
          setPhones(inventoryData);
          setFilteredPhones(inventoryData);
        } catch (error) {
          console.error("Error fetching inventory:", error);
          Alert.alert("Error", "Failed to fetch inventory");
        } finally {
          setIsLoading(false);
        }
      };
      fetchInventory();
    }
  }, [storeData]);

  // **Effect for Filtering Phones**
  useEffect(() => {
    filterPhones(activeFilter, searchQuery);
  }, [searchQuery, activeFilter, phones]);

  // **Functions**
  const filterPhones = (filter: string, query: string) => {
    let result = phones.filter((phone) => phone.imei); // Ensure only phones with IMEI are included
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
    if (isNaN(date.getTime())) {
      return "Invalid Date"; // Fallback if date is invalid
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPhoneItem = ({ item }: { item: Phone }) => {
    const statusInfo = getStatusDetails(item.status);
    const getPhoneIcon = (model: string) => {
      return "phone-iphone";
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
            <View style={styles.phoneHeader}>
              <Text style={styles.phoneModel}>{item.model}</Text>
            </View>
            <View style={styles.imeiContainer}>
              <Icon name="fingerprint" size={16} color="#0066CC" />
              <Text style={styles.imeiText}>{item.imei}</Text>
            </View>
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
    if (newPhone.model === "none") {
      Alert.alert("Validation Error", "Please select a phone model");
      return false;
    }
    if (!newPhone.imei) {
      Alert.alert("Validation Error", "IMEI is required");
      return false;
    }
    if (!/^\d{15}$/.test(newPhone.imei)) {
      Alert.alert("Invalid IMEI", "IMEI must be exactly 15 digits");
      return false;
    }
    return true;
  };

  const handleAddPhone = async () => {
    if (!validateForm()) return;
    if (!storeData || !storeData.phoneNumber) {
      Alert.alert("Error", "Store data not available");
      return;
    }
    setIsLoading(true);
    try {
      const inventoryRef = doc(
        firestore,
        "stores",
        storeData.phoneNumber,
        "inventory",
        newPhone.imei!
      );
      const docSnap = await getDoc(inventoryRef);
      if (docSnap.exists()) {
        Alert.alert("Error", "A phone with this IMEI already exists");
        setIsLoading(false);
        return;
      }
      await setDoc(inventoryRef, {
        imei: newPhone.imei,
        model: newPhone.model,
        status: newPhone.status,
        dateUpdated: new Date().toISOString(),
      });
      const newPhoneData: Phone = {
        id: newPhone.imei!,
        imei: newPhone.imei!,
        model: newPhone.model!,
        status: newPhone.status as "in_stock" | "sold" | "with_retailer",
        dateUpdated: new Date().toISOString(),
      };
      setPhones((prevPhones) => [...prevPhones, newPhoneData]);
      setModalVisible(false);
      Alert.alert("Success", "Phone added to inventory");
    } catch (error) {
      console.error("Error adding phone:", error);
      Alert.alert("Error", "Failed to add phone");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleLogout = async () => {
    await logout();
    setIsLogoutModalVisible(false);
    router.replace("/login");
  };

  // **Render**
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <GradientView colors={["#1A237E", "#3949AB"]} style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Cellucity</Text>
            <Text style={styles.subtitle}>
              {storeData?.name || "IMEI Inventory"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setIsLogoutModalVisible(true)}
          >
            <Icon name="account-circle" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </GradientView>
      <View style={styles.subHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#777" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by IMEI or model"
              placeholderTextColor="#999" // Light grey for visibility
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={openAddPhoneModal}
          >
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
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
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IMEI Number:</Text>
                <View style={styles.textInputWrapper}>
                  <Icon
                    name="fingerprint"
                    size={20}
                    color="#777"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.modalInput, styles.imeiInput]}
                    placeholder="Enter 15-digit IMEI"
                    placeholderTextColor="#999" // Light grey for visibility
                    keyboardType="number-pad"
                    maxLength={15}
                    value={newPhone.imei}
                    onChangeText={(text) =>
                      handleInputChange("imei", text.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Model:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={newPhone.model}
                    onValueChange={(itemValue) =>
                      handleInputChange("model", itemValue)
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a model" value="none" />
                    {/* Default option */}
                    {phoneModels.map((model, index) => (
                      <Picker.Item key={index} label={model} value={model} />
                    ))}
                  </Picker>
                </View>
              </View>
              {renderStatusSelector()}
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Logout Modal */}
      <Modal
        visible={isLogoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Logout</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Icon name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={styles.logoutModalContent}>
              <Text style={styles.logoutMessage}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.logoutButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsLogoutModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// **Styles**
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
    paddingVertical: 8,
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
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
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
  filtersContainer: {
    backgroundColor: "#FFF",
    marginTop: 8,
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
  imeiInput: {
    flex: 1,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
  },
  picker: {
    height: 52,
    width: "100%",
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
  logoutModalContent: {
    padding: 20,
    alignItems: "center",
  },
  logoutMessage: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  logoutButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutButton: {
    backgroundColor: "#FF5252",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
});

export default HomePage;
