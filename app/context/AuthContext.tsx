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

// Define the StoreData interface (no password)
interface StoreData {
  contact: string;
  phoneNumber: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the AuthContext type
interface AuthContextType {
  storeData: StoreData | null;
  login: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  refreshStoreData: () => Promise<void>;
}

// Create the AuthContext with default values
export const AuthContext = createContext<AuthContextType>({
  storeData: null,
  login: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => {},
  isLoading: true,
  isInitialized: false,
  refreshStoreData: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch store data by phone number
  const fetchStoreDataByPhoneNumber = async (phoneNumber: string): Promise<StoreData | null> => {
    try {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, where("phoneNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const storeDoc = querySnapshot.docs[0];
        const data = storeDoc.data();
        return {
          ...data,
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt),
        } as StoreData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching store data:", error);
      return null;
    }
  };

  // Normalize Firestore timestamps or strings to Date objects
  const normalizeDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    if (typeof dateValue.toDate === "function") return dateValue.toDate();
    if (typeof dateValue === "string") {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }
    return undefined;
  };

  // Login function with structured response
  const login = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const data = await fetchStoreDataByPhoneNumber(phoneNumber);

      if (data) {
        const storeDataForStorage = {
          ...data,
          createdAt: data.createdAt ? data.createdAt.toISOString() : undefined,
          updatedAt: data.updatedAt ? data.updatedAt.toISOString() : undefined,
        };
        setStoreData(data);
        await AsyncStorage.setItem("loggedInUser", phoneNumber);
        await AsyncStorage.setItem("storeData", JSON.stringify(storeDataForStorage));
        return { success: true };
      } else {
        return { success: false, error: "Store not found" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An error occurred during login" };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["loggedInUser", "storeData", "lastOpenedTime"]);
      setStoreData(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error; // Let the frontend handle this if needed
    }
  };

  // Refresh store data
  const refreshStoreData = async () => {
    if (storeData?.phoneNumber) {
      setIsLoading(true);
      try {
        const updatedData = await fetchStoreDataByPhoneNumber(storeData.phoneNumber);
        if (updatedData) {
          const storeDataForStorage = {
            ...updatedData,
            createdAt: updatedData.createdAt ? updatedData.createdAt.toISOString() : undefined,
            updatedAt: updatedData.updatedAt ? updatedData.updatedAt.toISOString() : undefined,
          };
          setStoreData(updatedData);
          await AsyncStorage.setItem("storeData", JSON.stringify(storeDataForStorage));
        }
      } catch (error) {
        console.error("Error refreshing store data:", error);
      } finally {
        setIsLoading(false);
      }
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
          const hydratedData = {
            ...parsedData,
            createdAt: parsedData.createdAt ? new Date(parsedData.createdAt) : undefined,
            updatedAt: parsedData.updatedAt ? new Date(parsedData.updatedAt) : undefined,
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
      value={{ storeData, login, logout, isLoading, isInitialized, refreshStoreData }}
    >
      {children}
    </AuthContext.Provider>
  );
};