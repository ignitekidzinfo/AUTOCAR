package com.spring.jwt.PurchaseBillInvoice;

import java.time.LocalDateTime;
import java.util.List;

public interface BillService {
    BillDto createBill(BillDto billDto);
    BillDto getBillById(Integer billId);
    BillDto getBillByBillNo(String billNo);
    List<BillDto> getAllBills();
    List<BillDto> getBillsByVendorId(Integer vendorId);
    List<BillDto> getBillsByUserId(Integer userId);
    List<BillDto> getBillsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    List<BillDto> getBillsByVendorAndDateRange(Integer vendorId, LocalDateTime startDate, LocalDateTime endDate);
    BillDto updateBill(Integer billId, BillDto billDto);
    void deleteBill(Integer billId);
}