package com.spring.jwt.SparePartTransaction;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for shop information
 */
@Configuration
public class ShopConfig {

    @Value("${shop.name:Auto Car Care Point}")
    private String shopName;
    
    @Value("${shop.address:Buvasaheb Nagar, Shingnapur Road, Tal.Phaltan(415523), Dist.Satara.}")
    private String shopAddress;
    
    @Value("${shop.contact:9767062794}")
    private String shopContact;
    
    @Bean
    public BillUtils.ShopInfo shopInfo() {
        return new BillUtils.ShopInfo(shopName, shopAddress, shopContact);
    }
} 