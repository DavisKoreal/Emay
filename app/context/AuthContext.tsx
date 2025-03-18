import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  getFirestore,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { app } from "../config/firebase";

const db = getFirestore(app);

// Define the StoreData interface (replacing ShopData)
interface StoreData {
  contact: string;
  phoneNumber: string;
  name: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the AuthContext type with phoneNumber instead of email
interface AuthContextType {
  storeData: StoreData | null;
  login: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

// Create the AuthContext with default values
export const AuthContext = createContext<AuthContextType>({
  storeData: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  isInitialized: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch store data by phone number instead of email
  const fetchStoreDataByPhoneNumber = async (phoneNumber: string) => {
    try {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, where("phoneNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const storeDoc = querySnapshot.docs[0];
        const data = storeDoc.data();
        
        // Convert Firestore timestamps to JS Date objects
        return {
          ...data,
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt)
        } as StoreData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching store data:", error);
      return null;
    }
  };

  const normalizeDate = (dateValue: any): Date | undefined => {
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    } else if (dateValue && typeof dateValue === "string") {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }
    return undefined;
  };
  
  // Login function updated to use phoneNumber
  const login = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      const data = await fetchStoreDataByPhoneNumber(phoneNumber);
      
      if (data) {
        // Before storing in AsyncStorage, ensure proper date serialization
        const storeDataForStorage = {
          ...data,
          createdAt: data.createdAt ? data.createdAt.toISOString() : undefined,
          updatedAt: data.updatedAt ? data.updatedAt.toISOString() : undefined
        };
        
        setStoreData(data); // Keep Date objects in memory
        await AsyncStorage.setItem("loggedInUser", phoneNumber);
        await AsyncStorage.setItem("storeData", JSON.stringify(storeDataForStorage));
      } else {
        throw new Error("Store not found");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function clears AsyncStorage and resets storeData
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "loggedInUser",
        "storeData",
        "lastOpenedTime",
      ]);
      setStoreData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Load stored data on initialization
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const storedPhoneNumber = await AsyncStorage.getItem("loggedInUser");
        const storedStoreData = await AsyncStorage.getItem("storeData");
        
        if (storedPhoneNumber && storedStoreData) {
          const parsedData = JSON.parse(storedStoreData);
          
          // Convert ISO string dates back to Date objects
          const hydratedData = {
            ...parsedData,
            createdAt: parsedData.createdAt ? new Date(parsedData.createdAt) : undefined,
            updatedAt: parsedData.updatedAt ? new Date(parsedData.updatedAt) : undefined
          };
          
          setStoreData(hydratedData);
        }
      } catch (error) {
        console.error("Error loading stored store data:", error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    loadStoreData();
  }, []);

  return (
    <AuthContext.Provider
      value={{ storeData, login, logout, isLoading, isInitialized }}
    >
      {children}
    </AuthContext.Provider>
  );
};
