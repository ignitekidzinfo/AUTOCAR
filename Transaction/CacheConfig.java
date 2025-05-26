package com.spring.jwt.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration for the application
 * Enables caching and configures cache managers
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure a simple cache manager for bills
     * This uses an in-memory concurrent map cache
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(java.util.Arrays.asList(
                // SparePart caches
                "spareParts",
                "sparePartById",
                // VehicleReg caches
                "vehicleStatusCache",
                // Filter search cache
                "searchBarFilterCache",
                // JobCard caches
                "jobCards",
                "jobCardById",
                // Bill caches
                "billsCache"
        ));
        return cacheManager;
    }
} 