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
public class BillDto {
    private Integer billId;
    private String billNo;
    private LocalDateTime billDate;
    private String shopName;
    private String shopAddress;
    private String shopContact;
    private Integer vendorId;
    private String vendorName;
    private String vendorAddress;
    private String vendorContact;
    private String vendorGstin;
    private Double subTotal;
    private Double totalCgst;
    private Double totalSgst;
    private Double grandTotal;
    private Double roundOff;
    private Double paidAmount;
    private String paymentMode;
    private String notes;
    private Integer userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BillItemDto> items = new ArrayList<>();
} 