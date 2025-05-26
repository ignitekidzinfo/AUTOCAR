package com.spring.jwt.SparePartTransaction;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SparePartTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer sparePartTransactionId;

    @Column(name = "part_number", nullable = false)
    private String partNumber;

    @Column(name = "sparePart_id")
    private Integer sparePartId;

    @Column(name = "part_name", nullable = false)
    private String partName;

    @Column(name = "manufacturer", nullable = false)
    @NotBlank(message = "manufacturer name cannot be blank")
    private String manufacturer;

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "QtyPrice", nullable = false)
    private Long qtyPrice;

    @Column(name = "update_At", nullable = false)
    private LocalDate updateAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "userId", nullable = false)
    private Integer userId;

    @Column(name = "billNo", nullable = false)
    private String billNo;

    @Column(name = "vehicleRegId")
    private Integer vehicleRegId;

    @Column(name = "customerName")
    private String customerName;

    @Column(name = "vendorName")
    private String name;

    @Column
    private Integer cGST;

    @Column
    private Integer sGST;

    @Column
    private Integer totalGST;
}
