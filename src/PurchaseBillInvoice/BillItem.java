package com.spring.jwt.PurchaseBillInvoice;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer billItemId;

    @Column
    private Integer serialNo;

    @Column(nullable = false)
    private String itemName;

    @Column
    private String partNumber;

    @Column
    private String manufacturer;

    @Column
    private Integer sparePartId;

    @Column
    private Double cgstPercentage;

    @Column
    private Double sgstPercentage;

    @Column
    private Double cgstAmount;

    @Column
    private Double sgstAmount;

    @Column
    private Integer quantity;

    @Column
    private Double rate;

    @Column
    private Double amount;

    // Reference to parent bill (bidirectional relationship)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private Bill bill;
} 