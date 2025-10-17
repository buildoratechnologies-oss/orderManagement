import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useProtectedApis from "../../../hooks/useProtectedApis";
import { transformItem } from "../../../util/data";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width, height } = Dimensions.get('window');

export default function OrderDetails() {
  const route = useRoute();
  const navigation=useNavigation()
  const { productId } = route.params;
  const { handleGetOrderDetails, handleGetItemList } = useProtectedApis();
  const [data, setData] = useState({});
  const [cart, setCart] = useState({});
  const [itemsByCompany, setItemsByCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [gstInclusive, setGstInclusive] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        let res = await handleGetOrderDetails(productId);
        if (res) {
          setData(res);
          for (let sitem of res?.invoiceProductDetails ?? []) {
            setCart((prev) => ({
              ...prev,
              [sitem?.itemXID]: {
                ...sitem,
                pid: sitem?.itemXID,
                Quantity: sitem?.quantity,
              },
            }));
          }
        }

        let response = await handleGetItemList();
        setItemsByCompany(response ?? []);
      } catch (err) {
        console.log("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    console.log(cart);
  }, [cart]);
  // Calculate total price based on GST toggle
  const totalPrice = useMemo(() => {
    return Object.entries(cart)?.reduce((sum, [itemId, itemData]) => {
      if (!itemData) return sum;
      
      // Get base amount from existing cart data
      const baseAmount = parseFloat(itemData.totalAmount || itemData.TotalAmount || 0);
      const gstRate = parseFloat(itemData.gstPer || itemData.GSTPer || 18) / 100;
      
      if (gstInclusive) {
        // Include GST in total
        const gstAmount = baseAmount * gstRate;
        return sum + baseAmount + gstAmount;
      } else {
        // Exclude GST from total
        return sum + baseAmount;
      }
    }, 0);
  }, [cart, gstInclusive]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return itemsByCompany;
    return itemsByCompany?.filter((item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, itemsByCompany]);

  const handleQuantityChange = (itemId, change) => {
    setCart((prev) => {
      const newQty = (prev[itemId]?.Quantity || 0) + change;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }

      const item = itemsByCompany.find((i) => i.pid === itemId);
      const transformedItem = transformItem(item, newQty);

      return { ...prev, [itemId]: transformedItem };
    });
  };

  // Calculate GST amount for display
  const gstAmount = useMemo(() => {
    return Object.entries(cart)?.reduce((sum, [itemId, itemData]) => {
      if (!itemData) return sum;
      const baseAmount = parseFloat(itemData.totalAmount || itemData.TotalAmount || 0);
      const gstRate = parseFloat(itemData.gstPer || itemData.GSTPer || 18) / 100;
      return sum + (baseAmount * gstRate);
    }, 0);
  }, [cart]);

  // Calculate subtotal (base amount without GST)
  const subtotal = useMemo(() => {
    return Object.entries(cart)?.reduce((sum, [itemId, itemData]) => {
      if (!itemData) return sum;
      const baseAmount = parseFloat(itemData.totalAmount || itemData.TotalAmount || 0);
      return sum + baseAmount;
    }, 0);
  }, [cart]);

  // Show loader while fetching
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with order info */}
      <LinearGradient
        colors={['#6366f1', '#4c5b9eff']} 
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.orderInfoHeader}>
            <Text style={styles.orderId}>Order #{data?.pid}</Text>
            <Text style={styles.company}>{data?.clientCompanyName}</Text>
            <View style={styles.orderMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#e9ecef" />
                <Text style={styles.metaText}>
                  {data?.createdOn?.split("T")[0]}
                </Text>
              </View>
              <View style={[styles.statusBadge, 
                data?.status === "Pending" ? styles.pendingBadge : styles.completedBadge
              ]}>
                <Text style={styles.statusText}>
                  {data?.status ?? "pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search field with icon */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items in this order"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* GST Toggle Section */}
        <View style={styles.gstToggleContainer}>
          <View style={styles.gstToggleContent}>
            <View>
              <Text style={styles.gstToggleTitle}>GST Display Mode</Text>
              <Text style={styles.gstToggleSubtitle}>
                {gstInclusive ? 'Show final prices with GST' : 'Show GST breakdown separately'}
              </Text>
            </View>
            <Switch
              value={gstInclusive}
              onValueChange={setGstInclusive}
              trackColor={{ false: '#e9ecef', true: '#2a9d8f' }}
              thumbColor={gstInclusive ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#e9ecef"
            />
          </View>
        </View>

        {/* Items Section */}
        <Text style={styles.heading}>
          <Ionicons name="list-outline" size={20} color="#333" /> Order Items
        </Text>
        
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.pid}
          renderItem={({ item }) => {
            const qty = cart[item.pid]?.Quantity || cart[item.pid]?.quantity || 0;
            const basePrice = parseFloat(item.salePrice || 0);
            const gstAmount = basePrice * 0.18;
            const totalPrice = basePrice + gstAmount;
            
            return (
              <View style={styles.itemCard}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.itemName || 'Unknown Item'}</Text>
                  <View style={styles.priceContainer}>
                    {gstInclusive ? (
                      <Text style={styles.itemPrice}>₹{totalPrice.toFixed(2)}</Text>
                    ) : (
                      <>
                        <Text style={styles.itemPrice}>₹{basePrice.toFixed(2)}</Text>
                        <Text style={styles.gstText}>+₹{gstAmount.toFixed(2)} GST = ₹{totalPrice.toFixed(2)}</Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.qtyControls}>
                  {qty > 0 ? (
                    <>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleQuantityChange(item.pid, -1)}
                      >
                        <Ionicons name="remove" size={18} color="#333" />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleQuantityChange(item.pid, 1)}
                      >
                        <Ionicons name="add" size={18} color="#333" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleQuantityChange(item.pid, 1)}
                    >
                      <Text style={styles.addToCartText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            <Ionicons name="receipt-outline" size={18} color="#333" /> Order Summary
          </Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Subtotal (Base Amount)</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>GST (18%)</Text>
              <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, styles.totalText]}>
                {gstInclusive ? 'Total (Including GST)' : 'Total (Excluding GST)'}
              </Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                ₹{totalPrice.toFixed(2)}
              </Text>
            </View>
            
            {!gstInclusive && (
              <Text style={styles.gstNote}>
                *Final amount will include GST at checkout
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {data?.status !== "pending" ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.updateBtn]}
              onPress={() => {
                // Handle update order functionality
                console.log('Update order pressed');
                // You can add navigation or update logic here
              }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Update Order</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.trackBtn]}
              onPress={() => {
                // Handle track order functionality
                console.log('Track order pressed');
                // You can add navigation or tracking logic here
              }}
            >
              <Ionicons name="location-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa"
  },
  
  // Header styles
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  orderInfoHeader: {
    flex: 1,
  },
  orderId: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#fff",
    marginBottom: 4
  },
  company: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#e9ecef",
    marginBottom: 8
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 14,
    color: "#e9ecef",
    marginLeft: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#ff9800'
  },
  completedBadge: {
    backgroundColor: '#4caf50'
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize'
  },
  
  // Content styles
  scrollContent: {
    paddingBottom: 20
  },
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#495057'
  },
  
  // GST Toggle styles
  gstToggleContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gstToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gstToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  gstToggleSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Heading styles
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 16,
    paddingHorizontal: 16,
    color: "#333",
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Item card styles
  itemCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    marginRight: 12 
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#212529",
    marginBottom: 4
  },
  priceContainer: {
    flexDirection: 'column',
  },
  itemPrice: { 
    fontSize: 15, 
    fontWeight: "700",
    color: "#2a9d8f" 
  },
  gstText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  
  // Quantity controls
  qtyControls: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  qtyBtn: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
    color: "#212529",
  },
  addToCartBtn: {
    backgroundColor: "#e6f8f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addToCartText: {
    color: "#2a9d8f",
    fontWeight: "bold",
    fontSize: 14,
  },
  
  // Summary styles
  summaryContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryText: { 
    fontSize: 15, 
    color: "#6c757d",
    fontWeight: '500'
  },
  summaryValue: { 
    fontSize: 15, 
    color: "#212529",
    fontWeight: '600'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12
  },
  totalText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#212529'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a9d8f'
  },
  gstNote: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8
  },
  
  // Action button styles
  actionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  updateBtn: {
    backgroundColor: "#6366f1",
  },
  trackBtn: {
    backgroundColor: "#6f42c1",
  },
  actionText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "bold",
    marginLeft: 8,
  },
});
