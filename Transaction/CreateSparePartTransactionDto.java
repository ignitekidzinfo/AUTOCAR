package com.spring.jwt.SparePartTransaction;

import jakarta.persistence.Column;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSparePartTransactionDto {
    private String partNumber;
    private TransactionType transactionType;
    private String manufacturer;
    private Integer quantity;
    private Integer userId;
    private String billNo;
    private Integer vehicleRegId;
    private String customerName;
    private String name;
    private Integer vendorId;

    // Added/updated fields with consistent naming
    private Long price;
    private Long qty_price;
    private String description;
    private Integer cgst;
    private Integer sgst;
    private Integer totalsgst;
}
