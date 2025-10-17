export const companyBranchInvoicesStatic = {
  CBXid: 10,
  ConsineeClientXid: 168, // client pid
  InvoiceCreatedOn: "2025-08-23T12:12:22.860Z",
  NamePrefix: "",
  To_Name: "",
  ClientCompanyName: "33434343",
  MobileNo: "3",
  PaymentTerms: "",
  PurchaseOrder: ".",
  PurchaseOrderDate: "2025-08-23T12:12:22.861Z",
  Remarks: "",
  PaymentRemarks: "",
  Validity: "",
  ClientEmailAddress: "",
  Taxes: "",
  formTypeXid: 5,
  CompanyShortName: "",
  TYear: null,
  RefID: 0,
  StateXid: 1,
  PaymentStatusXid: 2, // default 2
  BuyerClientXid: 168,
  lastEditByXid: 20,
  IsProjectWise: false,
  TransactionStatusXid: 2,
};

export const productDetailsStatic = {
  pid: 0,
  ByMRLDisabled: false,
  ByMRL: true,
  IsPurchasing: true,
  id: 2,
  Description: "Wheel Car Wheel",
  HSNCODE: "333",
  Quantity: 1,
  UOM: "NOS",
  QuantityAmount: "333",
  GSTPer: 18,
  SGSTPer: 9,
  SGSTAmount: 29.97,
  CGSTPer: 9,
  CGSTAmount: 29.97,
  IGSTPer: 0,
  IGSTAmount: 0,
  TotalAmount: 333,
  invoiceXID: 0,
  AfterGSTAmount: 392.94,
  lastEditByXid: 20,
  isFromDB: false,
  IsAdditionalCharges: false,
  isDeleted: false,
  error: null,
  ColorCode: "Wheel",
  ItemDescription: "Car Wheel",
  ItemXID: 3259,
  SpecificationTypeXID: null,
  SpecificationTypeXid: null,
  SpecificationTypeDetailsXid: null,
  SpecificationTypeDetailXid: null,
  MaterialTypeXid: null,
  BrandXID: null,
  calculationBy: 0,
  inclusive: false,
};

export const transformItem = (item, quantity) => {
  const GSTPer = item.gstPercentage || 18; // Default to 18% if GST percentage is not provided
  const unitPrice = item.salePrice;
  const totalAmount = unitPrice * quantity;
  const SGSTPer = GSTPer / 2;
  const CGSTPer = GSTPer / 2;

  return {
    pid: item.pid, // Adjust based on your requirement, e.g., item.pid
    ByMRLDisabled: false,
    ByMRL: true,
    IsPurchasing: true,
    id: item.pid, // ID from the item
    Description: `${item.itemName} ${item.itemDescription}`,
    itemName: item?.itemName,
    HSNCODE: item.hsnCode,
    Quantity: quantity,
    UOM: item.uom,
    QuantityAmount: totalAmount.toFixed(2),
    GSTPer: GSTPer,
    SGSTPer: SGSTPer,
    SGSTAmount: (totalAmount * (SGSTPer / 100)).toFixed(2),
    CGSTPer: CGSTPer,
    CGSTAmount: (totalAmount * (CGSTPer / 100)).toFixed(2),
    IGSTPer: 0,
    IGSTAmount: 0,
    TotalAmount: totalAmount.toFixed(2),
    invoiceXID: 0,
    AfterGSTAmount: (totalAmount + (totalAmount * GSTPer) / 100).toFixed(2),
    lastEditByXid: 20, // Adjust as per your requirement
    isFromDB: false,
    IsAdditionalCharges: false,
    isDeleted: false,
    error: null,
    ColorCode: item.itemName,
    ItemDescription: item.itemDescription,
    ItemXID: item.pid,
    SpecificationTypeXID: null,
    MaterialTypeXid: null,
    BrandXID: null,
    calculationBy: 0,
    inclusive: item.inclusive || false,
  };
};

export const getDateInFormate = () => {
  const date = new Date();

  // Get parts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Get only first 2 digits of milliseconds
  const millis = String(date.getMilliseconds()).padStart(3, "0").slice(0, 2);

  // Combine
  const formatted = `${year}-${month}-${day}`;

  return formatted;
};

export const getDateAndTimeInFormate = () => {
  const date = new Date();

  // Get parts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Get only first 2 digits of milliseconds
  const millis = String(date.getMilliseconds()).padStart(3, "0").slice(0, 2);

  // Combine
  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}`;

  return formatted;
};

export const getDateInFormat = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const compareDates = (date1, date2) => {
  const d1 = getDateInFormat(new Date(date1));
  const d2 = getDateInFormat(new Date(date2));
  return d1 === d2;
};