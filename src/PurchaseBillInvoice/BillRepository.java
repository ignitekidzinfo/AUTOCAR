package com.spring.jwt.PurchaseBillInvoice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Integer> {
    Optional<Bill> findByBillNo(String billNo);
    List<Bill> findByVendorId(Integer vendorId);
    List<Bill> findByUserId(Integer userId);
    List<Bill> findByBillDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Bill> findByVendorIdAndBillDateBetween(Integer vendorId, LocalDateTime startDate, LocalDateTime endDate);
} 