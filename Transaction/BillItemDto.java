package com.spring.jwt.SparePartTransaction;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillItemDto {
    private Integer billItemId;
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