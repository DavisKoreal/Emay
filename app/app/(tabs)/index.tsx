import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Types
interface Product {
  id: string;
  name: string;
  imei: string;
  category: string;
  price: number;
  inStock: boolean;
  lastScanDate?: string;
  soldTo?: string;
  soldType?: 'consumer' | 'retailer';
}

interface RecentTransaction {
  id: string;
  productId: string;
  productName: string;
  imei: string;
  transactionType: 'sold' | 'received' | 'returned';
  customer: string;
  customerType: 'consumer' | 'retailer';
  date: string;
  amount: number;
}

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [inventorySummary, setInventorySummary] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
  });
  const [salesSummary, setSalesSummary] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    retailerSales: 0,
    consumerSales: 0,
  });

  // Simulate data fetching
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Mock data
      setRecentTransactions([
        {
          id: 't1',
          productId: 'p1',
          productName: 'iPhone 15 Pro Max',
          imei: '358382749104927',
          transactionType: 'sold',
          customer: 'TechRetail Ltd',
          customerType: 'retailer',
          date: '2025-03-11T09:30:00',
          amount: 1099.99,
        },
        {
          id: 't2',
          productId: 'p2',
          productName: 'Samsung Galaxy S25',
          imei: '353878551298345',
          transactionType: 'sold',
          customer: 'John Doe',
          customerType: 'consumer',
          date: '2025-03-10T16:45:00',
          amount: 899.99,
        },
        {
          id: 't3',
          productId: 'p3',
          productName: 'Google Pixel 9',
          imei: '358746290187453',
          transactionType: 'received',
          customer: 'Inventory Update',
          customerType: 'consumer',
          date: '2025-03-09T11:20:00',
          amount: 799.99,
        },
        {
          id: 't4',
          productId: 'p4',
          productName: 'OnePlus 12',
          imei: '351987459823017',
          transactionType: 'sold',
          customer: 'ElectroMart',
          customerType: 'retailer',
          date: '2025-03-09T10:15:00',
          amount: 749.99,
        },
      ]);

      setInventorySummary({
        total: 278,
        inStock: 243,
        lowStock: 12,
      });

      setSalesSummary({
        today: 4599.97,
        thisWeek: 15780.45,
        thisMonth: 68452.30,
        retailerSales: 42680.75,
        consumerSales: 25771.55,
      });

      setIsLoading(false);
    }, 1000);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: RecentTransaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => {
        // Navigate to transaction details
        console.log('Navigate to transaction', item.id);
      }}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionTypeIndicator,
              {
                backgroundColor:
                  item.transactionType === 'sold'
                    ? '#4CAF50'
                    : item.transactionType === 'received'
                    ? '#2196F3'
                    : '#FF9800',
              },
            ]}
          />
          <Text style={styles.transactionProduct}>{item.productName}</Text>
        </View>
        <Text style={styles.transactionAmount}>
          {item.transactionType === 'sold' ? '+' : ''}
          {formatCurrency(item.amount)}
        </Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.transactionDetail}>
          <Icon name="fingerprint" size={14} color="#555" />
          <Text style={styles.transactionDetailText}>IMEI: {item.imei}</Text>
        </View>
        
        <View style={styles.transactionDetail}>
          <Icon name="person" size={14} color="#555" />
          <Text style={styles.transactionDetailText}>
            {item.customer} ({item.customerType})
          </Text>
        </View>
        
        <View style={styles.transactionDetail}>
          <Icon name="access-time" size={14} color="#555" />
          <Text style={styles.transactionDetailText}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cellucity Shop</Text>
          <Text style={styles.subtitle}>Inventory & IMEI Tracking</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by IMEI, product name, or customer"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.scanButton}>
          <Icon name="qr-code-scanner" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Icon name="add-shopping-cart" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>New Sale</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Icon name="store" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Retailer Sale</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Icon name="inventory" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Inventory</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Inventory Status</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{inventorySummary.inStock}</Text>
                  <Text style={styles.summaryLabel}>In Stock</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: '#FF5722' }]}>
                    {inventorySummary.lowStock}
                  </Text>
                  <Text style={styles.summaryLabel}>Low Stock</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Today's Sales</Text>
              <Text style={styles.salesValue}>{formatCurrency(salesSummary.today)}</Text>
            </View>
          </View>
          
          {/* Recent Transactions */}
          <View style={styles.recentTransactions}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={recentTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              contentContainerStyle={styles.transactionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scanButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '31%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#0066CC',
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  salesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  recentTransactions: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAllButton: {
    color: '#0066CC',
    fontSize: 14,
  },
  transactionsList: {
    paddingBottom: 16,
  },
  transactionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTypeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  transactionProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionDetails: {
    marginTop: 4,
  },
  transactionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  transactionDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#555',
  }
});

export default HomePage;