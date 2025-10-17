import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import useProtectedApis from "../../../hooks/useProtectedApis";
import useDoaApis from "../../../hooks/useDoaApis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useUploadDoaImageInfoMutation } from "../../../redux/api/doaApiSlice";
import useAttendanceApis from "../../../hooks/useAttendanceApis";

export default function DOAPage() {
  const { handleUploadMultipleImages, isUploading } = useAttendanceApis();
  const [isCheckIn, setIsCheckIn] = useState(false);
  const [doaList, setDoaList] = useState([]);
  const [orderPopupVisible, setOrderPopupVisible] = useState(false);
  const [itemPopupVisible, setItemPopupVisible] = useState(false);
  const [formPopupVisible, setFormPopupVisible] = useState(false);
  const [detailsPopupVisible, setDetailsPopupVisible] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDoa, setSelectedDoa] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [reportIssue, setReportIssue] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [userXid, setUserXid] = useState(null);

  const [ordersData, setOrdersData] = useState([]);
  const [itemsData, setItemsData] = useState([]);

  const [loadingDoa, setLoadingDoa] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter and search states
  const [searchText, setSearchText] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('from'); // 'from' or 'to'
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filteredDoaList, setFilteredDoaList] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { handleSubmitDOA, handleGetDOAList } = useDoaApis();
  const { handleGetOrdersList, handleGetOrderDetails } = useProtectedApis();
  const [uploadDoaImageInfoMutation] = useUploadDoaImageInfoMutation();
  const handleAddDoa = () => setOrderPopupVisible(true);

  // Filter and search functions
  const applyFilters = () => {
    let filtered = [...doaList];

    // Apply search filter
    if (searchText.trim()) {
      filtered = filtered.filter(item => 
        (item.companyName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (item.itemName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (item.reportIssue || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply date filter
    if (fromDate || toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.reportedDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && to) {
          return itemDate >= from && itemDate <= to;
        } else if (from) {
          return itemDate >= from;
        } else if (to) {
          return itemDate <= to;
        }
        return true;
      });
    }

    setFilteredDoaList(filtered);
  };

  const clearFilters = () => {
    setSearchText("");
    setFromDate(null);
    setToDate(null);
    setFilteredDoaList(doaList);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'from') {
        setFromDate(selectedDate);
      } else {
        setToDate(selectedDate);
      }
    }
  };

  const openDatePicker = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const getStatusColor = (statusXid) => {
    switch (statusXid) {
      case 1: return '#f39c12'; // Pending
      case 2: return '#27ae60'; // Approved
      case 3: return '#e74c3c'; // Rejected
      default: return '#95a5a6'; // Unknown
    }
  };

  const getStatusText = (statusXid) => {
    switch (statusXid) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    (async () => {
      let visitCheckIn = await AsyncStorage.getItem("visitCheckIn");
      if (visitCheckIn) setIsCheckIn(true);

      // Get user data for lastEditByXid
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        const decoded = jwtDecode(storedToken);
        setUserXid(decoded?.nameid || 20); // fallback to 20 if not found
      }

      setLoadingDoa(true);
      let response = await handleGetDOAList();
      if (response) {
        setDoaList(response);
        setFilteredDoaList(response);
      }
      setLoadingDoa(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingOrders(true);
      let response = await handleGetOrdersList();
      if (response) setOrdersData(response);
      setLoadingOrders(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      (async () => {
        setLoadingItems(true);
        let response = await handleGetOrderDetails(selectedOrder?.pid);
        if (response) setItemsData(response?.invoiceProductDetails ?? []);
        setLoadingItems(false);
      })();
    }
  }, [selectedOrder]);

  // Apply filters when search text, dates, or doaList changes
  useEffect(() => {
    applyFilters();
  }, [searchText, fromDate, toDate, doaList]);

  const handleRestartState = () => {
    setFormPopupVisible(false);
    setSelectedOrder(null);
    setSelectedItem(null);
    setRemarks("");
    setReportIssue("");
    setSelectedImages([]);
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setOrderPopupVisible(false);
    setItemPopupVisible(true);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setItemPopupVisible(false);
    setFormPopupVisible(true);
  };

  const handleUploadImages = async (list, pid) => {
    try {
      const imagesData = list.map((img) => ({
        doaRequestXid: pid,
        typeOfDoc: img.typeOfDoc,
        savedName: img.savedName,
        originalName: img.originalName,
        imagePath: img?.imagePath, // As per your format requirement
        docExtension: img.docExtension,
        // lastEditByXid: img.lastEditByXid, 
      }));
      console.log(imagesData);
      await uploadDoaImageInfoMutation(imagesData);
      await handleUploadMultipleImages([...imagesData]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedOrder || !selectedItem) return;
    try {
      setSubmitting(true);
      // Prepare images data for submission
      // const imagesData = selectedImages.map((img) => ({
      //   itemXid: selectedItem.itemXID,
      //   typeOfDoc: img.typeOfDoc,
      //   savedName: img.savedName,
      //   originalName: img.originalName,
      //   imagePath: "string", // As per your format requirement
      //   docExtension: img.docExtension,
      //   lastEditByXid: img.lastEditByXid,
      // }));

      const newDoa = {
        clientXid: selectedOrder.consineeClientXid,
        itemXID: selectedItem.itemXID,
        reportedDate: new Date().toISOString(),
        reportIssue,
        requestStatusXid: 1,
        remarks,
        // images: imagesData, // Include images in the DOA object
      };

      console.log("DOA Submission Data:", newDoa);
      // console.log("Images Data:", imagesData);

      const res = await handleSubmitDOA(newDoa);
      if (res) {
        //details
        console.log(res);
        await handleUploadImages(selectedImages, res?.details);
        const updatedList = [newDoa, ...doaList];
        setDoaList(updatedList);
        setFilteredDoaList(updatedList);
        handleRestartState();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (doa) => {
    setSelectedDoa(doa);
    setDetailsPopupVisible(true);
  };

  // Image selection functions
  const handleImagePicker = async () => {
    if (selectedImages.length >= 4) {
      Alert.alert("Maximum Images", "You can select up to 4 images only.");
      return;
    }

    // Request permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Access to media library is required.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4 - selectedImages.length, // Remaining slots
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => {
          const fileName =
            asset.uri.split("/").pop() || `image_${Date.now()}_${index}.jpg`;
          const fileExtension =
            fileName.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = `image/${
            fileExtension === "jpg" ? "jpeg" : fileExtension
          }`;

          return {
            itemXid: selectedItem?.itemXID || 0,
            typeOfDoc: "Asset",
            savedName: `rc-upload-${Date.now()}-${index}.${fileExtension}`,
            originalName: fileName,
            imagePath: asset.uri,
            docExtension: mimeType,
            lastEditByXid: userXid || 20,
            localUri: asset.uri,
          };
        });

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select images. Please try again.");
    }
  };

  const handleDeleteImage = (index) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <MaterialIcons name="assignment" size={28} color="#667eea" />
            <Text style={styles.title}>DOA Management</Text>
          </View>
          <Text style={styles.subtitle}>
            {filteredDoaList.length} of {doaList.length} items
          </Text>
        </View> */}
        {isCheckIn && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddDoa}>
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.addButtonGradient}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add DOA</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Search and Filter Controls */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, item, or issue..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "filter" : "filter-outline"} 
            size={20} 
            color={showFilters ? "#667eea" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      {/* Date Filter Controls */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Date Range Filter</Text>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => openDatePicker('from')}
            >
              <Ionicons name="calendar-outline" size={16} color="#667eea" />
              <Text style={styles.dateButtonText}>
                {fromDate ? fromDate.toLocaleDateString() : 'From Date'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => openDatePicker('to')}
            >
              <Ionicons name="calendar-outline" size={16} color="#667eea" />
              <Text style={styles.dateButtonText}>
                {toDate ? toDate.toLocaleDateString() : 'To Date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {(fromDate || toDate || searchText) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="refresh-outline" size={16} color="#e74c3c" />
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* DOA List */}
      <View style={styles.listContainer}>
        {loadingDoa ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading DOA data...</Text>
          </View>
        ) : filteredDoaList?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={64} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              {doaList.length === 0 ? 'No DOA Data Available' : 'No items match your filters'}
            </Text>
            {doaList.length > 0 && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredDoaList}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.doaCard,
                  { transform: [{ scale: 1 }] }
                ]}
                onPress={() => handleViewDetails(item)}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={['#fff', '#f8f9ff']} 
                  style={styles.cardGradient}
                >
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.requestStatusXid) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.requestStatusXid)}</Text>
                  </View>

                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconContainer}>
                      <MaterialIcons name="business" size={20} color="#667eea" />
                    </View>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.companyName || "Unknown Company"}
                      </Text>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {item.itemName || "Unknown Item"}
                      </Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardInfoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.cardInfoText}>
                        {new Date(item.reportedDate).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {item.reportIssue && (
                      <View style={styles.cardInfoRow}>
                        <Ionicons name="warning-outline" size={16} color="#f39c12" />
                        <Text style={styles.cardInfoText} numberOfLines={2}>
                          {item.reportIssue}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.viewMore}>Tap for details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#667eea" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* DOA Details Popup */}
      <Modal transparent visible={detailsPopupVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 DOA Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailsPopupVisible(false)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedDoa && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="business" size={20} color="#667eea" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Company: </Text>
                      {selectedDoa.companyName ?? "N/A"}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="inventory" size={20} color="#28a745" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Item: </Text>
                      {selectedDoa.itemName ?? "N/A"}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={20} color="#f39c12" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Reported: </Text>
                      {new Date(selectedDoa.reportedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="flag" size={20} color={getStatusColor(selectedDoa.requestStatusXid)} style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Status: </Text>
                      <Text style={{color: getStatusColor(selectedDoa.requestStatusXid), fontWeight: '600'}}>
                        {getStatusText(selectedDoa.requestStatusXid) ?? "N/A"}
                      </Text>
                    </Text>
                  </View>
                  
                  {selectedDoa.reportIssue && (
                    <View style={styles.detailRow}>
                      <Ionicons name="warning" size={20} color="#dc3545" style={styles.detailIcon} />
                      <Text style={styles.detailText}>
                        <Text style={styles.boldText}>Issue: </Text>
                        {selectedDoa.reportIssue}
                      </Text>
                    </View>
                  )}
                  
                  {selectedDoa.remarks && (
                    <View style={styles.detailRow}>
                      <Ionicons name="chatbox" size={20} color="#6f42c1" style={styles.detailIcon} />
                      <Text style={styles.detailText}>
                        <Text style={styles.boldText}>Remarks: </Text>
                        {selectedDoa.remarks}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDetailsPopupVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Orders Popup */}
      <Modal transparent visible={orderPopupVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Select Order</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setOrderPopupVisible(false);
                  handleRestartState();
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {loadingOrders ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.emptyStateText}>Loading orders...</Text>
                </View>
              ) : ordersData?.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="inbox" size={64} color="#e0e0e0" style={styles.emptyStateIcon} />
                  <Text style={styles.emptyStateText}>No Orders Available</Text>
                  <Text style={styles.emptyStateSubtext}>There are currently no orders to display</Text>
                </View>
              ) : (
                ordersData.map((item, index) => (
                  <TouchableOpacity
                    key={item.pid}
                    style={styles.modalItem}
                    onPress={() => handleOrderSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MaterialIcons name="business" size={18} color="#667eea" style={{ marginRight: 8 }} />
                      <Text style={styles.modalItemText}>{item.clientCompanyName}</Text>
                    </View>
                    <Text style={styles.modalItemSubtext}>PO: {item.purchaseOrder}</Text>
                    <Text style={styles.modalItemSubtext}>Total: ₹{item.sumOfInvoice}</Text>
                  </TouchableOpacity>
                ))
              )}
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setOrderPopupVisible(false);
                  handleRestartState();
                }}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Items Popup */}
      <Modal transparent visible={itemPopupVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Select Item</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setItemPopupVisible(false);
                  handleRestartState();
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {loadingItems ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.emptyStateText}>Loading items...</Text>
                </View>
              ) : itemsData?.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="inventory" size={64} color="#e0e0e0" style={styles.emptyStateIcon} />
                  <Text style={styles.emptyStateText}>No Items Available</Text>
                  <Text style={styles.emptyStateSubtext}>No items found for this order</Text>
                </View>
              ) : (
                itemsData.map((item, index) => (
                  <TouchableOpacity
                    key={item.itemXID}
                    style={styles.modalItem}
                    onPress={() => handleItemSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MaterialIcons name="inventory" size={18} color="#28a745" style={{ marginRight: 8 }} />
                      <Text style={styles.modalItemText}>{item.description}</Text>
                    </View>
                    {item.quantity && (
                      <Text style={styles.modalItemSubtext}>Qty: {item.quantity}</Text>
                    )}
                    {item.rate && (
                      <Text style={styles.modalItemSubtext}>Rate: ₹{item.rate}</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setItemPopupVisible(false);
                  handleRestartState();
                }}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Form Popup */}
      <Modal transparent visible={formPopupVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Submit DOA Request</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setFormPopupVisible(false);
                  handleRestartState();
                }}
                disabled={submitting}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Selected Information Card */}
              <View style={styles.selectedInfoCard}>
                <View style={styles.selectedInfoRow}>
                  <MaterialIcons name="inventory" size={20} color="#007bff" style={styles.selectedInfoIcon} />
                  <Text style={styles.selectedInfoText}>
                    {selectedItem?.description || 'Unknown Item'}
                  </Text>
                </View>
                <View style={styles.selectedInfoRow}>
                  <MaterialIcons name="business" size={20} color="#007bff" style={styles.selectedInfoIcon} />
                  <Text style={styles.selectedInfoText}>
                    {selectedOrder?.clientCompanyName || 'Unknown Client'}
                  </Text>
                </View>
              </View>
              
              {/* Report Issue Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Report Issue *</Text>
                <TextInput
                  style={[styles.input, reportIssue && styles.inputFocused]}
                  placeholder="Describe the issue with this item..."
                  placeholderTextColor="#999"
                  value={reportIssue}
                  onChangeText={setReportIssue}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Remarks Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={[styles.input, remarks && styles.inputFocused]}
                  placeholder="Additional comments or notes..."
                  placeholderTextColor="#999"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Image Selection Section */}
              <View style={styles.imageSection}>
                <Text style={styles.imageSectionTitle}>
                  Images ({selectedImages.length}/4)
                </Text>

                <TouchableOpacity
                  style={[
                    styles.imagePickerButton,
                    selectedImages.length >= 4 &&
                      styles.imagePickerButtonDisabled,
                  ]}
                  onPress={handleImagePicker}
                  disabled={selectedImages.length >= 4}
                >
                  <Text
                    style={[
                      styles.imagePickerButtonText,
                      selectedImages.length >= 4 &&
                        styles.imagePickerButtonTextDisabled,
                    ]}
                  >
                    {selectedImages.length >= 4
                      ? "Maximum 4 Images Selected"
                      : "+ Select Images"}
                  </Text>
                </TouchableOpacity>

                {/* Display Selected Images */}
                {selectedImages.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {selectedImages.map((image, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image
                          source={{ uri: image.localUri }}
                          style={styles.selectedImage}
                        />
                        <TouchableOpacity
                          style={styles.deleteImageButton}
                          onPress={() => handleDeleteImage(index)}
                        >
                          <Text style={styles.deleteImageButtonText}>×</Text>
                        </TouchableOpacity>
                        <Text style={styles.imageFileName} numberOfLines={1}>
                          {image.originalName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (submitting || isUploading || !reportIssue.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={handleFormSubmit}
                  disabled={submitting || isUploading || !reportIssue.trim()}
                >
                  {submitting || isUploading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>
                        {isUploading ? 'Uploading...' : 'Submitting...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Submit DOA Request</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setFormPopupVisible(false);
                    handleRestartState();
                  }}
                  disabled={submitting || isUploading}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    paddingTop: 5,
  },
  
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#333",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 36,
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14,
    marginLeft: 4,
  },
  
  // Search and Filter Styles
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e1e5ff",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  filterButton: {
    backgroundColor: "#f8f9ff",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e1e5ff",
  },
  
  // Filter Container
  filterContainer: {
    backgroundColor: "#f8f9ff",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e1e5ff",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateButton: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e1e5ff",
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffe6e6",
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#e74c3c",
    fontWeight: "500",
  },
  
  // List Container
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#333",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#666",
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#667eea",
    borderRadius: 20,
  },
  clearFiltersButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Enhanced Card Styles
  doaCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 60,
  },
  cardIconContainer: {
    backgroundColor: "#f0f2ff",
    borderRadius: 25,
    padding: 10,
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  cardContent: {
    marginBottom: 12,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  viewMore: { 
    color: "#667eea", 
    fontSize: 14, 
    fontWeight: "500",
  },
  
  // Enhanced Modal Styles
  boldText: { 
    fontWeight: "700",
    color: "#2c3e50"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: width * 0.90,
    borderRadius: 20,
    padding: 0,
    maxHeight: height * 0.8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    backgroundColor: "#667eea",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  modalContent: {
    padding: 24,
    maxHeight: height * 0.6,
  },
  detailsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: { 
    fontSize: 16, 
    color: "#495057",
    flex: 1,
    lineHeight: 24,
  },
  modalItem: {
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalItemText: { 
    fontSize: 16, 
    color: "#2c3e50",
    fontWeight: "500",
    lineHeight: 22,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalCloseButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 16,
  },
  formContainer: {
    padding: 24,
  },
  selectedInfoCard: {
    backgroundColor: "#e8f4fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  selectedInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedInfoIcon: {
    marginRight: 8,
  },
  selectedInfoText: {
    fontSize: 16,
    color: "#0c63d4",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#2c3e50",
    backgroundColor: "#f8f9fa",
  },
  inputFocused: {
    borderColor: "#667eea",
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#6c757d",
    elevation: 1,
  },
  submitButtonText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  label: { 
    fontSize: 16, 
    marginBottom: 12,
    color: "#495057",
    lineHeight: 24,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
  },

  // Enhanced Image selection styles
  imageSection: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2c3e50",
    flexDirection: "row",
    alignItems: "center",
  },
  imagePickerButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#17a2b8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imagePickerButtonDisabled: {
    backgroundColor: "#adb5bd",
    elevation: 0,
  },
  imagePickerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  imagePickerButtonTextDisabled: {
    color: "#6c757d",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  imageContainer: {
    width: "48%",
    marginBottom: 16,
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  deleteImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#dc3545",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  deleteImageButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  imageFileName: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
});
