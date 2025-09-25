package com.spring.jwt.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class DiscountStructure
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer DiscountId;

    private String manufacturer;

    // Three configurable discount values
    private Integer discountA;
    private Integer discountB;
    private Integer discountC;

    // Which set is currently active (0=A, 1=B, 2=C)
    private Integer activeSetIndex;

}
