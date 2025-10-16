package com.spring.jwt.PurchaseBillInvoice;

import com.spring.jwt.SparePartTransaction.SparePartTransactionDto;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class to help convert between transaction data and bill data
 */
@Component
public class BillUtils {

    /**
     * Creates a bill request from transaction data
     * @param transactionData The transaction data from the frontend
     * @param shopInfo Shop information to include in the bill
     * @return A CreateBillRequest object ready to be saved
     */
    public CreateBillRequest createBillRequestFromTransaction(
            TransactionBatchRequest transactionData,
            ShopInfo shopInfo) {
        
        // Extract vendor information
        String vendorName = transactionData.getVendorName();
        Integer vendorId = transactionData.getVendorId();
        
        // Create bill request
        CreateBillRequest billRequest = CreateBillRequest.builder()
                .billNo(transactionData.getInvoiceNo())
                .billDate(LocalDateTime.now())
                .shopName(shopInfo.getName())
                .shopAddress(shopInfo.getAddress())
                .shopContact(shopInfo.getContact())
                .vendorId(vendorId)
                .vendorName(vendorName)
                .vendorAddress(transactionData.getVendorAddress())
                .vendorContact(transactionData.getVendorContact())
                .vendorGstin(transactionData.getVendorGstin())
                .userId(transactionData.getUserId())
                .paymentMode("Cash") // Default value, can be updated
                .items(new ArrayList<>())
                .build();
        
        // Calculate totals
        double subTotal = 0;
        double totalCgst = 0;
        double totalSgst = 0;
        
        // Convert transaction items to bill items
        List<CreateBillRequest.CreateBillItemRequest> billItems = new ArrayList<>();
        int serialNo = 1;
        
        for (SparePartTransactionDto transaction : transactionData.getTransactions()) {
            // Calculate item values
            double rate = transaction.getPrice() != null ? transaction.getPrice() : 0;
            int quantity = transaction.getQuantity() != null ? transaction.getQuantity() : 0;
            double amount = rate * quantity;
            
            // Calculate GST amounts
            int cgstPercent = transaction.getCGST() != null ? transaction.getCGST() : 0;
            int sgstPercent = transaction.getSGST() != null ? transaction.getSGST() : 0;
            double cgstAmount = (amount * cgstPercent) / 100.0;
            double sgstAmount = (amount * sgstPercent) / 100.0;
            
            // Create bill item
            CreateBillRequest.CreateBillItemRequest billItem = CreateBillRequest.CreateBillItemRequest.builder()
                    .serialNo(serialNo++)
                    .itemName(transaction.getPartName())
                    .partNumber(transaction.getPartNumber())
                    .manufacturer(transaction.getManufacturer())
                    .sparePartId(transaction.getSparePartId())
                    .cgstPercentage((double) cgstPercent)
                    .sgstPercentage((double) sgstPercent)
                    .cgstAmount(cgstAmount)
                    .sgstAmount(sgstAmount)
                    .quantity(quantity)
                    .rate(rate)
                    .amount(amount)
                    .build();
            
            billItems.add(billItem);
            
            // Update totals
            subTotal += amount;
            totalCgst += cgstAmount;
            totalSgst += sgstAmount;
        }
        
        // Set items and totals
        billRequest.setItems(billItems);
        billRequest.setSubTotal(subTotal);
        billRequest.setTotalCgst(totalCgst);
        billRequest.setTotalSgst(totalSgst);
        
        // Calculate grand total and round off
        double totalBeforeRounding = subTotal + totalCgst + totalSgst;
        double grandTotal = Math.round(totalBeforeRounding);
        double roundOff = grandTotal - totalBeforeRounding;
        
        billRequest.setGrandTotal(grandTotal);
        billRequest.setRoundOff(roundOff);
        billRequest.setPaidAmount(grandTotal); // Default to full payment
        
        return billRequest;
    }
    
    /**
     * Simple class to hold shop information
     */
    public static class ShopInfo {
        private String name;
        private String address;
        private String contact;
        
        public ShopInfo(String name, String address, String contact) {
            this.name = name;
            this.address = address;
            this.contact = contact;
        }
        
        public String getName() {
            return name;
        }
        
        public String getAddress() {
            return address;
        }
        
        public String getContact() {
            return contact;
        }
    }
    
    /**
     * Simple class to represent transaction batch request
     */
    public static class TransactionBatchRequest {
        private List<SparePartTransactionDto> transactions;
        private Integer vendorId;
        private String vendorName;
        private String vendorAddress;
        private String vendorContact;
        private String vendorGstin;
        private String invoiceNo;
        private Integer userId;
        
        // Getters and setters
        public List<SparePartTransactionDto> getTransactions() {
            return transactions;
        }
        
        public void setTransactions(List<SparePartTransactionDto> transactions) {
            this.transactions = transactions;
        }
        
        public Integer getVendorId() {
            return vendorId;
        }
        
        public void setVendorId(Integer vendorId) {
            this.vendorId = vendorId;
        }
        
        public String getVendorName() {
            return vendorName;
        }
        
        public void setVendorName(String vendorName) {
            this.vendorName = vendorName;
        }
        
        public String getVendorAddress() {
            return vendorAddress;
        }
        
        public void setVendorAddress(String vendorAddress) {
            this.vendorAddress = vendorAddress;
        }
        
        public String getVendorContact() {
            return vendorContact;
        }
        
        public void setVendorContact(String vendorContact) {
            this.vendorContact = vendorContact;
        }
        
        public String getVendorGstin() {
            return vendorGstin;
        }
        
        public void setVendorGstin(String vendorGstin) {
            this.vendorGstin = vendorGstin;
        }
        
        public String getInvoiceNo() {
            return invoiceNo;
        }
        
        public void setInvoiceNo(String invoiceNo) {
            this.invoiceNo = invoiceNo;
        }
        
        public Integer getUserId() {
            return userId;
        }
        
        public void setUserId(Integer userId) {
            this.userId = userId;
        }
    }
} 