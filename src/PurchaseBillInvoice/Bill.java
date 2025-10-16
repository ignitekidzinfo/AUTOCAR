package com.spring.jwt.PurchaseBillInvoice;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer billId;

    @Column(nullable = false, unique = true)
    private String billNo;

    @Column(nullable = false)
    private LocalDateTime billDate;

    @Column
    private String shopName;

    @Column
    private String shopAddress;

    @Column
    private String shopContact;

    @Column
    private Integer vendorId;

    @Column
    private String vendorName;

    @Column
    private String vendorAddress;

    @Column
    private String vendorContact;

    @Column
    private String vendorGstin;

    @Column
    private Double subTotal;

    @Column
    private Double totalCgst;

    @Column
    private Double totalSgst;

    @Column
    private Double grandTotal;

    @Column
    private Double roundOff;

    @Column
    private Double paidAmount;

    @Column
    private String paymentMode;

    @Column
    private String notes;

    @Column
    private Integer userId;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillItem> items = new ArrayList<>();
} 