package com.spring.jwt.dto;

import lombok.Data;

@Data
public class DiscountStructureDTO {
    private Integer discountId;
    private String manufacturer;
    private Integer discountA;
    private Integer discountB;
    private Integer discountC;
    private Integer activeSetIndex; // 0=A, 1=B, 2=C
    // Convenience field for clients expecting a single number
    private Integer discount;
}
