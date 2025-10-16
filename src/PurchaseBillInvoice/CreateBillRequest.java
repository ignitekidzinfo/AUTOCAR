package com.spring.jwt.PurchaseBillInvoice;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBillRequest {
    // Bill header information
    private String billNo;
    private LocalDateTime billDate;
    
    // Shop information
    private String shopName;
    private String shopAddress;
    private String shopContact;
    
    // Vendor information
    private Integer vendorId;
    private String vendorName;
    private String vendorAddress;
    private String vendorContact;
    private String vendorGstin;
    
    // Totals
    private Double subTotal;
    private Double totalCgst;
    private Double totalSgst;
    private Double grandTotal;
    private Double roundOff;
    private Double paidAmount;
    
    // Additional information
    private String paymentMode;
    private String notes;
    private Integer userId;
    
    // Bill items
    private List<CreateBillItemRequest> items = new ArrayList<>();
    
    // Inner class for bill items
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateBillItemRequest {
        private Integer serialNo;
        private String itemName;
        private String partNumber;
        private String manufacturer;
        private Integer sparePartId;
        private Double cgstPercentage;
        private Double sgstPercentage;
        private Double cgstAmount;
        private Double sgstAmount;
        private Integer quantity;
        private Double rate;
        private Double amount;
    }
} 