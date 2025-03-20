import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
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
import { getDoc, doc, collection, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase"; // Adjust path to your Firebase config
import { Picker } from "@react-native-picker/picker";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from '@react-native-community/datetimepicker';

// **Types**
interface Phone {
  id: string;
  model: string;
  imei: string;
  status: "in_stock" | "sold" | "with_retailer";
  dateUpdated: Date;
  retailerName?: string;
  retailerContact?: string;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [newPhoneModel, setNewPhoneModel] = useState("");
  const [newPhoneImei, setNewPhoneImei] = useState("");
  const [newPhoneStatus, setNewPhoneStatus] = useState("in_stock");
  const [retailerName, setRetailerName] = useState("");

  // **State Definitions**
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [filteredPhones, setFilteredPhones] = useState<Phone[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [retailerContact, setRetailerContact] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editPhoneModel, setEditPhoneModel] = useState("");
  const [editPhoneImei, setEditPhoneImei] = useState("");
  const [editPhoneStatus, setEditPhoneStatus] = useState("in_stock");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editRetailerName, setEditRetailerName] = useState('');
  const [editRetailerContact, setEditRetailerContact] = useState('');

  // **Effect for Fetching Inventory from Firestore**
  useEffect(() => {
    if (storeData && storeData.phoneNumber) {
      // In the useEffect for fetching inventory, update the timestamp handling
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
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // Convert Firestore timestamp to JS Date
                dateUpdated: data.dateUpdated
                  ? data.dateUpdated.toDate()
                  : new Date(),
              } as Phone;
            })
            .filter((phone) => phone.imei);
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
    let result = phones.filter((phone) => phone.imei);
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
    
    // Sort by dateUpdated in descending order (newest first)
    result.sort((a, b) => b.dateUpdated.getTime() - a.dateUpdated.getTime());
    
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

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid Date"; // Fallback if date is invalid
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeletePhone = async (phoneId: string) => {
    if (!storeData || !storeData.phoneNumber) {
      Alert.alert("Error", "Store data not available");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const phoneRef = doc(
        firestore,
        "stores",
        storeData.phoneNumber,
        "inventory",
        phoneId
      );
      await deleteDoc(phoneRef);
      await refreshData();
      setDetailsModalVisible(false);
      Alert.alert("Success", "Phone deleted successfully");
    } catch (error) {
      console.error("Error deleting phone:", error);
      Alert.alert("Error", "Failed to delete phone");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhone = async () => {
    // Validate IMEI
    if (!newPhoneImei || newPhoneImei.length < 15 || newPhoneImei.length > 17) {
      Alert.alert("Error", "Please enter a valid IMEI (15-17 digits)");
      return;
    }
  
    // Validate model
    if (!newPhoneModel) {
      Alert.alert("Error", "Please enter a phone model");
      return;
    }
  
    // Check if retailer/buyer name and contact are required but not provided
    if (
      (newPhoneStatus === "sold" || newPhoneStatus === "with_retailer") &&
      (!retailerName || !retailerContact)
    ) {
      Alert.alert("Error", "Please enter name and contact information");
      return;
    }
  
    setIsLoading(true);
  
    try {
      if (storeData && storeData.phoneNumber) {
        // Define the inventory collection reference
        const inventoryRef = collection(
          firestore,
          "stores",
          storeData.phoneNumber,
          "inventory"
        );
        // Use IMEI as the document ID
        const newPhoneRef = doc(inventoryRef, newPhoneImei);
  
        // Add the phone data without including imei as a field (since it’s the ID)
        await setDoc(newPhoneRef, {
          model: newPhoneModel,
          status: newPhoneStatus,
          dateUpdated: selectedDate || new Date(),
          retailerName: retailerName || null,
          retailerContact: retailerContact || null,
        });
  
        // Refresh the phone list
        await refreshData();
  
        // Reset form and close modal
        setNewPhoneModel("");
        setNewPhoneImei("");
        setNewPhoneStatus("in_stock");
        setRetailerName("");
        setRetailerContact("");
        setSelectedDate(new Date());
        setModalVisible(false);
  
        Alert.alert("Success", "Phone added successfully");
      }
    } catch (error) {
      console.error("Error adding phone:", error);
      Alert.alert("Error", "Failed to add phone");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhoneItem = ({ item }: { item: Phone }) => {
    const statusInfo = getStatusDetails(item.status);
    const getPhoneIcon = (model: string) => {
      return "phone-iphone";
    };
  
    return (
      <TouchableOpacity
        style={styles.phoneItem}
        onPress={() => {
          setSelectedPhone(item);
          setEditPhoneModel(item.model);
          setEditPhoneImei(item.imei);
          setEditPhoneStatus(item.status);
          setDetailsModalVisible(true);
          setEditRetailerName(item.retailerName || ''); // Add this
          setEditRetailerContact(item.retailerContact || ''); 
        }}
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
            {item.retailerName && (item.status === "sold" || item.status === "with_retailer") && (
              <View style={styles.retailerContainer}>
                <Icon name={item.status === "sold" ? "person" : "store"} size={16} color="#666" />
                <Text style={styles.retailerText}>
                  {item.status === "sold" ? "Buyer: " : "Retailer: "}{item.retailerName}
                </Text>
              </View>
            )}
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

  const handleUpdatePhone = async (phoneId: string) => {
    if (!editPhoneModel) {
      Alert.alert("Error", "Phone model cannot be empty");
      return;
    }
  
    setIsLoading(true);
  
    try {
      if (storeData && storeData.phoneNumber) {
        const phoneRef = doc(
          firestore,
          "stores",
          storeData.phoneNumber,
          "inventory",
          phoneId // phoneId is the IMEI
        );
  
        await setDoc(
          phoneRef,
          {
            model: editPhoneModel,
            status: editPhoneStatus,
            dateUpdated: selectedDate || new Date(),
            retailerName: editRetailerName || null,
            retailerContact: editRetailerContact || null,
          },
          { merge: true }
        );
  
        await refreshData();
        setDetailsModalVisible(false);
        Alert.alert("Success", "Phone details updated");
      }
    } catch (error) {
      console.error("Error updating phone:", error);
      Alert.alert("Error", "Failed to update phone details");
    } finally {
      setIsLoading(false);
    }
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

  const handleLogout = async () => {
    await logout();
    setIsLogoutModalVisible(false);
    router.replace("/login");
  };

  const refreshData = async () => {
    if (storeData && storeData.phoneNumber) {
      setIsLoading(true);
      try {
        const inventoryRef = collection(
          firestore,
          "stores",
          storeData.phoneNumber,
          "inventory"
        );
        const querySnapshot = await getDocs(inventoryRef);
        const inventoryData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, // This is the IMEI
            imei: doc.id, // Set imei to the document ID
            model: data.model,
            status: data.status,
            dateUpdated: data.dateUpdated ? data.dateUpdated.toDate() : new Date(),
            retailerName: data.retailerName || undefined,
            retailerContact: data.retailerContact || undefined,
          } as Phone;
        });
        setPhones(inventoryData);
        setFilteredPhones(inventoryData);
      } catch (error) {
        console.error("Error refreshing inventory:", error);
        Alert.alert("Error", "Failed to refresh inventory");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // **Render**
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1A237E" />
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
          <TouchableOpacity 
            style={styles.addButtonSmall} 
            onPress={() => setModalVisible(true)}
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
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshData}
              colors={["#0066CC"]}
            />
          }
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
      {/* Phone Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phone Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Icon name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {selectedPhone && (
              <ScrollView style={styles.formContainer}>
                {/* Mode switcher - View/Edit */}
                <View style={styles.modeSwitcherContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeSwitcherButton,
                      !isEditing && styles.modeSwitcherButtonActive
                    ]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Icon name="visibility" size={18} color={!isEditing ? "#fff" : "#555"} />
                    <Text style={[styles.modeSwitcherText, !isEditing && styles.modeSwitcherTextActive]}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modeSwitcherButton,
                      isEditing && styles.modeSwitcherButtonActive
                    ]}
                    onPress={() => setIsEditing(true)}
                  >
                    <Icon name="edit" size={18} color={isEditing ? "#fff" : "#555"} />
                    <Text style={[styles.modeSwitcherText, isEditing && styles.modeSwitcherTextActive]}>Edit</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Display Mode */}
                {!isEditing ? (
                  <View style={styles.detailsContainer}>
                    {/* Phone Model */}
                    <View style={styles.detailItem}>
                      <Icon name="phone-iphone" size={24} color="#555" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Phone Model</Text>
                        <Text style={styles.detailValue}>{selectedPhone.model}</Text>
                      </View>
                    </View>
                    
                    {/* IMEI */}
                    <View style={styles.detailItem}>
                      <Icon name="fingerprint" size={24} color="#555" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>IMEI Number</Text>
                        <Text style={styles.detailValue}>{selectedPhone.imei}</Text>
                      </View>
                    </View>
                    
                    {/* Status */}
                    <View style={styles.detailItem}>
                      <Icon 
                        name={
                          selectedPhone.status === "in_stock" ? "inventory-2" : 
                          selectedPhone.status === "sold" ? "person" : "store"
                        } 
                        size={24} 
                        color={
                          selectedPhone.status === "in_stock" ? "#4CAF50" : 
                          selectedPhone.status === "sold" ? "#2196F3" : "#FF9800"
                        } 
                      />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={styles.detailValue}>
                          {selectedPhone.status === "in_stock" ? "In Stock" : 
                          selectedPhone.status === "sold" ? "Sold" : "With Retailer"}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Retailer/Buyer Info (Conditional) */}
                    {selectedPhone.status !== "in_stock" && (
                      <>
                        <View style={styles.detailItem}>
                          <Icon name="person" size={24} color="#555" />
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>
                              {selectedPhone.status === "sold" ? "Buyer" : "Retailer"}
                            </Text>
                            <Text style={styles.detailValue}>{selectedPhone.retailerName || "N/A"}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.detailItem}>
                          <Icon name="call" size={24} color="#555" />
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Contact</Text>
                            <Text style={styles.detailValue}>{selectedPhone.retailerContact || "N/A"}</Text>
                          </View>
                        </View>
                      </>
                    )}
                    
                    {/* Date */}
                    <View style={styles.detailItem}>
                      <Icon name="calendar-today" size={24} color="#555" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>{getDateLabel(selectedPhone.status)}</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedPhone.dateUpdated)}</Text>
                      </View>
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setDeleteConfirmVisible(true)}
                      >
                        <Icon name="delete" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Edit Mode */
                  <View style={styles.editContainer}>
                    {/* Phone Model (Editable) */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone Model</Text>
                      <View style={styles.textInputWrapper}>
                        <Icon name="phone-iphone" size={20} color="#555" style={styles.inputIcon} />
                        <TextInput
                          style={styles.modalInput}
                          placeholderTextColor="#666"
                          value={editPhoneModel}
                          onChangeText={setEditPhoneModel}
                        />
                      </View>
                    </View>
                    
                    {/* IMEI Number (Editable) */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>IMEI Number</Text>
                      <View style={styles.textInputWrapper}>
                        <Icon name="fingerprint" size={20} color="#555" style={styles.inputIcon} />
                        <TextInput
                          style={styles.modalInput}
                          value={editPhoneImei}
                          placeholderTextColor="#666"
                          onChangeText={setEditPhoneImei}
                          keyboardType="number-pad"
                          maxLength={17}
                        />
                      </View>
                    </View>
                    
                    {/* Status (Editable) */}
                    <View style={styles.statusSelectorContainer}>
                      <Text style={styles.inputLabel}>Status</Text>
                      <View style={styles.statusButtonsRow}>
                        <TouchableOpacity
                          style={[
                            styles.statusSelectButton,
                            editPhoneStatus === "in_stock" && { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" }
                          ]}
                          onPress={() => setEditPhoneStatus("in_stock")}
                        >
                          <Icon
                            name="inventory-2"
                            size={24}
                            color={editPhoneStatus === "in_stock" ? "#4CAF50" : "#AAA"}
                            style={styles.statusSelectIcon}
                          />
                          <Text style={styles.statusSelectText}>In Stock</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.statusSelectButton,
                            editPhoneStatus === "sold" && { borderColor: "#2196F3", backgroundColor: "#E3F2FD" }
                          ]}
                          onPress={() => setEditPhoneStatus("sold")}
                        >
                          <Icon
                            name="person"
                            size={24}
                            color={editPhoneStatus === "sold" ? "#2196F3" : "#AAA"}
                            style={styles.statusSelectIcon}
                          />
                          <Text style={styles.statusSelectText}>Sold</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.statusSelectButton,
                            editPhoneStatus === "with_retailer" && { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                          ]}
                          onPress={() => setEditPhoneStatus("with_retailer")}
                        >
                          <Icon
                            name="store"
                            size={24}
                            color={editPhoneStatus === "with_retailer" ? "#FF9800" : "#AAA"}
                            style={styles.statusSelectIcon}
                          />
                          <Text style={styles.statusSelectText}>With Retailer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Retailer/Buyer Info (Conditional & Editable) */}
                    {editPhoneStatus !== "in_stock" && (
                      <>
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>
                            {editPhoneStatus === "sold" ? "Buyer Name" : "Retailer Name"}
                          </Text>
                          <View style={styles.textInputWrapper}>
                            <Icon name="person" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput
                              style={styles.modalInput}
                              placeholderTextColor="#666"
                              value={editRetailerName}
                              onChangeText={setEditRetailerName}
                              placeholder={editPhoneStatus === "sold" ? "Enter buyer name" : "Enter retailer name"}
                            />
                          </View>
                        </View>
                        
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Contact Number</Text>
                          <View style={styles.textInputWrapper}>
                            <Icon name="call" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput
                              style={styles.modalInput}
                              value={editRetailerContact}
                              placeholderTextColor="#666"
                              onChangeText={setEditRetailerContact}
                              keyboardType="phone-pad"
                              placeholder="Enter contact number"
                            />
                          </View>
                        </View>
                      </>
                    )}
                    
                    {/* Save Button */}
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => handleUpdatePhone(selectedPhone.id)}
                    >
                      <Icon name="save" size={18} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Icon name="warning" size={40} color="#FF9800" />
            <Text style={styles.confirmModalTitle}>Confirm Delete</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete this phone record? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={() => {
                  if (selectedPhone) {
                    handleDeletePhone(selectedPhone.id);
                  }
                  setDeleteConfirmVisible(false);
                }}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
            {/* Change from View to ScrollView */}
            <ScrollView style={styles.formContainer}>
              {/* Phone Model Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Model</Text>
                <View style={styles.textInputWrapper}>
                  <Icon name="phone-iphone" size={20} color="#555" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter phone model"
                    placeholderTextColor="#666"
                    value={newPhoneModel}
                    onChangeText={setNewPhoneModel}
                  />
                </View>
              </View>

              {/* IMEI Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IMEI Number (15-17 digits)</Text>
                <View style={styles.textInputWrapper}>
                  <Icon name="fingerprint" size={20} color="#555" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter IMEI number"
                    placeholderTextColor="#666"
                    value={newPhoneImei}
                    onChangeText={setNewPhoneImei}
                    keyboardType="number-pad"
                    maxLength={17}
                  />
                </View>
              </View>

              {/* Status Selection */}
              <View style={styles.statusSelectorContainer}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      newPhoneStatus === "in_stock" && { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" }
                    ]}
                    onPress={() => setNewPhoneStatus("in_stock")}
                  >
                    <Icon
                      name="inventory-2"
                      size={24}
                      color={newPhoneStatus === "in_stock" ? "#4CAF50" : "#AAA"}
                      style={styles.statusSelectIcon}
                    />
                    <Text style={styles.statusSelectText}>In Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      newPhoneStatus === "sold" && { borderColor: "#2196F3", backgroundColor: "#E3F2FD" }
                    ]}
                    onPress={() => setNewPhoneStatus("sold")}
                  >
                    <Icon
                      name="person"
                      size={24}
                      color={newPhoneStatus === "sold" ? "#2196F3" : "#AAA"}
                      style={styles.statusSelectIcon}
                    />
                    <Text style={styles.statusSelectText}>Sold</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      newPhoneStatus === "with_retailer" && { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                    ]}
                    onPress={() => setNewPhoneStatus("with_retailer")}
                  >
                    <Icon
                      name="store"
                      size={24}
                      color={newPhoneStatus === "with_retailer" ? "#FF9800" : "#AAA"}
                      style={styles.statusSelectIcon}
                    />
                    <Text style={styles.statusSelectText}>With Retailer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Retailer/Buyer Name - Conditional */}
              {(newPhoneStatus === "sold" || newPhoneStatus === "with_retailer") && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      {newPhoneStatus === "sold" ? "Buyer Name" : "Retailer Name"}
                    </Text>
                    <View style={styles.textInputWrapper}>
                      <Icon 
                        name={newPhoneStatus === "sold" ? "person" : "store"} 
                        size={20} 
                        color="#555" 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholderTextColor="#666"
                        placeholder={newPhoneStatus === "sold" ? "Enter buyer name" : "Enter retailer name"}
                        value={retailerName}
                        onChangeText={setRetailerName}
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      {newPhoneStatus === "sold" ? "Buyer Contact" : "Retailer Contact"}
                    </Text>
                    <View style={styles.textInputWrapper}>
                      <Icon 
                        name="phone" 
                        size={20} 
                        color="#555" 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Enter contact number"
                        placeholderTextColor="#666"
                        value={retailerContact}
                        onChangeText={setRetailerContact}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </>
              )}
              {/* Date Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity 
                  style={styles.textInputWrapper}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="event" size={20} color="#555" style={styles.inputIcon} />
                  <Text style={styles.dateText2}>
                    {selectedDate ? formatDate(selectedDate) : "Select date"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event: any, date?: Date | undefined) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  avatarButton: {
    width: 35,
    height: 35,
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
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
  // Add these to your StyleSheet
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
  retailerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0E0",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  retailerText: {
    fontSize: 14,
    marginLeft: 6,
    color: "#555",
    fontWeight: "500",
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  updateButton: {
    backgroundColor: "#0066CC",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  updateButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  dateText2: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    paddingVertical: 12,
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    alignSelf: 'center',
  },
  modeSwitcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: 100,
  },
  modeSwitcherButtonActive: {
    backgroundColor: '#5C6BC0',
  },
  modeSwitcherText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  modeSwitcherTextActive: {
    color: '#fff',
  },
  
  // View mode styles
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Edit mode styles
  editContainer: {
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Confirmation modal styles
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmDeleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

});

export default HomePage;
