import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from "expo-location";
import useProtectedApis from "../../../hooks/useProtectedApis";
import { companyBranchInvoicesStatic, transformItem } from "../../../util/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get('window');

// Haversine formula for distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate price with or without GST
const calculatePrice = (basePrice, gstRate = 0.18, includeGst = true) => {
  if (!basePrice || isNaN(basePrice)) {
    return 0;
  }
  if (includeGst) {
    return parseFloat(basePrice);
  }
  return parseFloat(basePrice) / (1 + gstRate);
};

// Calculate GST amount
const calculateGstAmount = (price, gstRate = 0.18, includeGst = true) => {
  if (!price || isNaN(price)) {
    return 0;
  }
  const numPrice = parseFloat(price);
  if (includeGst) {
    return (numPrice * gstRate) / (1 + gstRate);
  }
  return numPrice * gstRate;
};

export default function CreateOrder() {
  const navigation = useNavigation();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [itemsByCompany, setItemsByCompany] = useState(null);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [companyBranchInvoicesData, setCompanyBranchInvoices] = useState(
    companyBranchInvoicesStatic
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gstInclusive, setGstInclusive] = useState(true);
  const { handleGetItemList, handleSubmitOrder } = useProtectedApis();

  // Fetch location + calculate distances
  useEffect(() => {
    (async () => {
      const clientData = await AsyncStorage.getItem("selectedShop");
      if (clientData) {
        setSelectedCompany(JSON.parse(clientData));
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (selectedCompany) {
        setLoading(true);
        try {
          let response = await handleGetItemList();
          setItemsByCompany(response);
        } catch (err) {
          console.error("Error fetching items:", err);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [selectedCompany]);

  const handleQuantityChange = (itemId, change) => {
    setCart((prev) => {
      const newQty = (prev[itemId]?.Quantity || 0) + change;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }

      const item = itemsByCompany.find((i) => i.pid === itemId);
      if (!item) return prev;
      
      const transformedItem = transformItem(item, newQty);

      return { ...prev, [itemId]: transformedItem };
    });
  };

  // Calculate total price based on GST toggle
  const totalPrice = useMemo(() => {
    return Object.entries(cart).reduce((sum, [itemId, itemData]) => {
      if (!itemData || !itemData.TotalAmount) return sum;
      
      // Get base amount (before GST) from database
      const baseAmount = parseFloat(itemData.TotalAmount);
      const gstRate = parseFloat(itemData.GSTPer || 18) / 100;
      
      if (gstInclusive) {
        // Include GST in total
        const gstAmount = baseAmount * gstRate;
        return sum + baseAmount + gstAmount;
      } else {
        // Exclude GST from total (show only base amount)
        return sum + baseAmount;
      }
    }, 0);
  }, [cart, gstInclusive]);
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const InvoiceCreatedOn = new Date();
    const PurchaseOrderDate = new Date();
    const CBXID = await AsyncStorage.getItem("CBXID");

    let ProjectWiseInvoiceProductDetails = {
      AcceptedByXid: null,
      ItemRecorded: null,
    };
    let companyBranchInvoices = {
      ...companyBranchInvoicesData,
      InvoiceCreatedOn,
      PurchaseOrderDate,
      CBXID,
    };

    try {
      let response = await handleSubmitOrder({
        companyBranchInvoices,
        PaymentTransactions: null,
        ProjectWiseInvoiceProductDetails,
        InvoiceProductDetails: Object.values(cart),
      });
      

      setIsSubmitting(false);

      if (response) {
        setCartModalVisible(false);
        navigation.navigate("MenuPage");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      alert("Failed to submit order. Please try again.");
    }
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return itemsByCompany;
    return itemsByCompany?.filter((item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, itemsByCompany]);

  useEffect(() => {
    if (selectedCompany) {
      const { pid, companyName, mobile, email, stateXid } = selectedCompany;

      setCompanyBranchInvoices((prev) => ({
        ...prev,
        ConsineeClientXid: pid,
        ClientCompanyName: companyName,
        CompanyShortName: companyName,
        MobileNo: mobile,
        ClientEmailAddress: email,
        stateXid,
        BuyerClientXid: pid,
      }));
    }
  }, [selectedCompany]);

  return (
    <View style={styles.container}>
      {/* Header with company info */}
      <LinearGradient
        colors={['#6366f1', '#4c5b9eff']} 
        style={styles.headerGradient}
      >
        <View style={styles.selectedCompanyCard}>
          <View>
            <Text style={styles.companyName}>{selectedCompany?.companyName}</Text>
            <Text style={styles.companyDistance}>
              <Ionicons name="location-outline" size={14} color="#f8f9fa" />
              {selectedCompany?.distance}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="information-circle-outline" size={24} color="#f8f9fa" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search field with icon */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for items"
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
      
      <Text style={styles.heading}>
        <Ionicons name="list-outline" size={20} color="#333" /> All Items
      </Text>

      {/* Loader while fetching items */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text>Fetching items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.pid}
          renderItem={({ item }) => {
            const qty = cart[item.pid]?.Quantity || 0;
            const basePrice = parseFloat(item.salePrice || 0);
            const gstAmount = basePrice * 0.18; // GST is always calculated
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
      )}

      {/* Cart summary */}
      {!loading && (
        <TouchableOpacity
          style={[
            styles.cartBtn,
            Object.keys(cart).length === 0 && styles.cartBtnDisabled,
          ]}
          onPress={() => setCartModalVisible(true)}
          disabled={Object.keys(cart).length === 0}
        >
          {Object.keys(cart).length === 0 ? (
            <Text style={styles.cartBtnText}>Add items to cart</Text>
          ) : (
            <View style={styles.cartBtnContent}>
              <View style={styles.cartIconContainer}>
                <Ionicons name="cart" size={22} color="#fff" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{Object.keys(cart).length}</Text>
                </View>
              </View>
              <Text style={styles.cartBtnText}>
                View Cart - ₹{totalPrice.toFixed(2)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <Modal
        visible={cartModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart</Text>
              <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cartDivider} />

            {Object.keys(cart).length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={60} color="#ddd" />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartSubtext}>Add items to proceed with your order</Text>
              </View>
            ) : (
              <FlatList
                data={Object.entries(cart)}
                keyExtractor={([id]) => id}
                renderItem={({ item: [id, itemData] }) => {
                  const truncatedName =
                    itemData.itemName.length > 20
                      ? itemData.itemName.substring(0, 25) + "..."
                      : itemData.itemName;
  
                  return (
                    <View style={styles.cartItem}>
                      <View style={styles.cartItemLeft}>
                        <Text style={styles.cartItemText}>{truncatedName}</Text>
                        <View style={styles.cartItemQty}>
                          <TouchableOpacity 
                            style={styles.cartQtyBtn}
                            onPress={() => handleQuantityChange(id, -1)}
                          >
                            <Ionicons name="remove" size={16} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.cartQtyValue}>{itemData.Quantity}</Text>
                          <TouchableOpacity 
                            style={styles.cartQtyBtn}
                            onPress={() => handleQuantityChange(id, 1)}
                          >
                            <Ionicons name="add" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.cartPriceContainer}>
                        <View>
                          {gstInclusive ? (
                            <Text style={styles.cartItemPrice}>
                              ₹{(() => {
                                if (!itemData || !itemData.TotalAmount) return '0.00';
                                const baseAmount = parseFloat(itemData.TotalAmount);
                                const gstRate = parseFloat(itemData.GSTPer || 18) / 100;
                                const gstAmount = baseAmount * gstRate;
                                return (baseAmount + gstAmount).toFixed(2);
                              })()}
                            </Text>
                          ) : (
                            <View>
                              <Text style={styles.cartItemPrice}>
                                ₹{(() => {
                                  if (!itemData || !itemData.TotalAmount) return '0.00';
                                  const baseAmount = parseFloat(itemData.TotalAmount);
                                  const gstRate = parseFloat(itemData.GSTPer || 18) / 100;
                                  const gstAmount = baseAmount * gstRate;
                                  return `${baseAmount.toFixed(2)} + ${gstAmount.toFixed(2)} GST`;
                                })()}
                              </Text>
                              <Text style={styles.cartItemTotal}>
                                Total: ₹{(() => {
                                  if (!itemData || !itemData.TotalAmount) return '0.00';
                                  const baseAmount = parseFloat(itemData.TotalAmount);
                                  const gstRate = parseFloat(itemData.GSTPer || 18) / 100;
                                  const gstAmount = baseAmount * gstRate;
                                  return (baseAmount + gstAmount).toFixed(2);
                                })()}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
            
            <View style={styles.cartDivider} />

            <View style={styles.totalContainer}>
              <View>
                <Text style={styles.totalLabel}>
                  {gstInclusive ? 'Total Amount (Including GST)' : 'Total Amount (Excluding GST)'}
                </Text>
                {!gstInclusive && (
                  <Text style={styles.totalGstNote}>
                    *GST will be calculated separately
                  </Text>
                )}
                {gstInclusive && (
                  <Text style={styles.totalGstNote}>
                    GST included in above amount
                  </Text>
                )}
              </View>
              <Text style={styles.totalText}>₹{totalPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, Object.keys(cart).length === 0 && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || Object.keys(cart).length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Place Order</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    paddingBottom: 16
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    paddingHorizontal: 16,
    color: "#333",
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  selectedCompanyCard: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#fff",
    marginBottom: 4
  },
  companyDistance: { 
    fontSize: 14, 
    color: "#e9ecef",
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
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
  itemPrice: { 
    fontSize: 15, 
    fontWeight: "700",
    color: "#2a9d8f" 
  },
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
  cartBtn: {
    backgroundColor: "#2a9d8f",
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cartBtnDisabled: {
    backgroundColor: "#e9ecef",
  },
  cartBtnContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e76f51',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16,
    textAlign: 'center',
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
  priceContainer: {
    flexDirection: 'column',
  },
  gstText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  cartPriceContainer: {
    alignItems: 'flex-end',
  },
  cartGstText: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 2,
  },
  totalGstNote: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  cartDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  cartItemLeft: {
    flex: 1,
  },
  cartItemText: { 
    fontSize: 16, 
    fontWeight: '500',
    color: "#343a40",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2a9d8f',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a9d8f',
    marginTop: 2,
  },
  cartItemQty: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cartQtyValue: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: '#212529',
  },
  submitBtn: {
    backgroundColor: "#2a9d8f",
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#adb5bd',
  },
  submitBtnText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold",
    marginRight: 8,
  }
});
