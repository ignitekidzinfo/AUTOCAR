package com.spring.jwt.PurchaseBillInvoice;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;

    @Autowired
    public BillServiceImpl(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    @Override
    @Transactional
    public BillDto createBill(BillDto billDto) {
        // Set creation timestamp
        if (billDto.getCreatedAt() == null) {
            billDto.setCreatedAt(LocalDateTime.now());
        }
        billDto.setUpdatedAt(LocalDateTime.now());

        // Convert DTO to entity
        Bill bill = convertToEntity(billDto);
        
        // Save the bill
        Bill savedBill = billRepository.save(bill);
        
        // Return the saved bill as DTO
        return convertToDto(savedBill);
    }

    @Override
    public BillDto getBillById(Integer billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new EntityNotFoundException("Bill not found with ID: " + billId));
        
        return convertToDto(bill);
    }

    @Override
    public BillDto getBillByBillNo(String billNo) {
        Bill bill = billRepository.findByBillNo(billNo)
                .orElseThrow(() -> new EntityNotFoundException("Bill not found with Bill No: " + billNo));
        
        return convertToDto(bill);
    }

    @Override
    public List<BillDto> getAllBills() {
        List<Bill> bills = billRepository.findAll();
        return bills.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getBillsByVendorId(Integer vendorId) {
        List<Bill> bills = billRepository.findByVendorId(vendorId);
        return bills.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getBillsByUserId(Integer userId) {
        List<Bill> bills = billRepository.findByUserId(userId);
        return bills.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getBillsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<Bill> bills = billRepository.findByBillDateBetween(startDate, endDate);
        return bills.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getBillsByVendorAndDateRange(Integer vendorId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Bill> bills = billRepository.findByVendorIdAndBillDateBetween(vendorId, startDate, endDate);
        return bills.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public BillDto updateBill(Integer billId, BillDto billDto) {
        System.out.println("[updateBill] Incoming DTO: billId=" + billId + ", items=" + (billDto.getItems() != null ? billDto.getItems().size() : 0));
        Bill existingBill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id " + billId));

        existingBill.setBillDate(billDto.getBillDate());
        existingBill.setUpdatedAt(LocalDateTime.now());

        // STEP 1️⃣ Create a map of existing items for quick lookup
        Map<Integer, BillItem> existingItemsMap = existingBill.getItems().stream()
                .filter(i -> i.getBillItemId() != null)
                .collect(Collectors.toMap(BillItem::getBillItemId, item -> item));
        // Track IDs that existed prior to update (used to decide safe deletions only among old rows)
        var existingIdSet = existingBill.getItems().stream()
                .map(BillItem::getBillItemId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        // STEP 2️⃣ Iterate through DTO items (update in-place or add new)
        java.util.Set<Integer> incomingIds = new java.util.HashSet<>();
        for (BillItemDto dtoItem : billDto.getItems()) {
            Integer incomingId = dtoItem.getBillItemId() != null ? dtoItem.getBillItemId() : dtoItem.getTransactionId();
            if (incomingId != null) incomingIds.add(incomingId);

            if (incomingId != null && existingItemsMap.containsKey(incomingId)) {
                // Update existing managed entity in-place
                BillItem existingItem = existingItemsMap.get(incomingId);
                existingItem.setItemName(dtoItem.getItemName());
                existingItem.setQuantity(dtoItem.getQuantity());
                existingItem.setRate(dtoItem.getRate());
                existingItem.setAmount(dtoItem.getAmount());
                existingItem.setCgstPercentage(dtoItem.getCgstPercentage());
                existingItem.setSgstPercentage(dtoItem.getSgstPercentage());
                System.out.println("[updateBill] Updated item id=" + existingItem.getBillItemId());
            } else {
                // Create and attach a new entity
                BillItem newItem = new BillItem();
                newItem.setItemName(dtoItem.getItemName());
                newItem.setQuantity(dtoItem.getQuantity());
                newItem.setRate(dtoItem.getRate());
                newItem.setAmount(dtoItem.getAmount());
                newItem.setCgstPercentage(dtoItem.getCgstPercentage());
                newItem.setSgstPercentage(dtoItem.getSgstPercentage());
                newItem.setBill(existingBill);
                existingBill.getItems().add(newItem);
                System.out.println("[updateBill] Created new item for name=" + dtoItem.getItemName());
            }
        }

        // STEP 3️⃣ Remove deleted items (those not in the DTO)
        // STEP 3️⃣ Remove items only if at least one incoming item carries an identifier
        // STEP 3️⃣ Do NOT delete absent items during update.
        // Rationale: frontend may send partial item list when editing a single row.
        // Deletions should be explicit via a dedicated endpoint.
        System.out.println("[updateBill] Skipping deletion of items on update (preserve existing rows)");

        // STEP 4️⃣ Nothing else to do; updates done in-place and new items already added

        // STEP 5️⃣ Save and return
        Bill saved = billRepository.save(existingBill);
        return convertToDto(saved);
    }



    @Override
    @Transactional
    public void deleteBill(Integer billId) {
        // Check if bill exists
        if (!billRepository.existsById(billId)) {
            throw new EntityNotFoundException("Bill not found with ID: " + billId);
        }
        
        // Delete the bill
        billRepository.deleteById(billId);
    }

    // Helper method to convert Bill entity to BillDto
    private BillDto convertToDto(Bill bill) {
        BillDto billDto = BillDto.builder()
                .billId(bill.getBillId())
                .billNo(bill.getBillNo())
                .billDate(bill.getBillDate())
                .shopName(bill.getShopName())
                .shopAddress(bill.getShopAddress())
                .shopContact(bill.getShopContact())
                .vendorId(bill.getVendorId())
                .vendorName(bill.getVendorName())
                .vendorAddress(bill.getVendorAddress())
                .vendorContact(bill.getVendorContact())
                .vendorGstin(bill.getVendorGstin())
                .subTotal(bill.getSubTotal())
                .totalCgst(bill.getTotalCgst())
                .totalSgst(bill.getTotalSgst())
                .grandTotal(bill.getGrandTotal())
                .roundOff(bill.getRoundOff())
                .paidAmount(bill.getPaidAmount())
                .paymentMode(bill.getPaymentMode())
                .notes(bill.getNotes())
                .userId(bill.getUserId())
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .items(new ArrayList<>())
                .build();
        
        // Convert and add bill items
        if (bill.getItems() != null) {
            billDto.setItems(bill.getItems().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList()));
        }
        
        return billDto;
    }

    // Helper method to convert BillItem entity to BillItemDto
    private BillItemDto convertToDto(BillItem billItem) {
        return BillItemDto.builder()
                .billItemId(billItem.getBillItemId())
                .serialNo(billItem.getSerialNo())
                .itemName(billItem.getItemName())
                .partNumber(billItem.getPartNumber())
                .manufacturer(billItem.getManufacturer())
                .sparePartId(billItem.getSparePartId())
                .cgstPercentage(billItem.getCgstPercentage())
                .sgstPercentage(billItem.getSgstPercentage())
                .cgstAmount(billItem.getCgstAmount())
                .sgstAmount(billItem.getSgstAmount())
                .quantity(billItem.getQuantity())
                .rate(billItem.getRate())
                .amount(billItem.getAmount())
                .build();
    }

    // Helper method to convert BillDto to Bill entity
    private Bill convertToEntity(BillDto billDto) {
        Bill bill = Bill.builder()
                .billId(billDto.getBillId())
                .billNo(billDto.getBillNo())
                .billDate(billDto.getBillDate())
                .shopName(billDto.getShopName())
                .shopAddress(billDto.getShopAddress())
                .shopContact(billDto.getShopContact())
                .vendorId(billDto.getVendorId())
                .vendorName(billDto.getVendorName())
                .vendorAddress(billDto.getVendorAddress())
                .vendorContact(billDto.getVendorContact())
                .vendorGstin(billDto.getVendorGstin())
                .subTotal(billDto.getSubTotal())
                .totalCgst(billDto.getTotalCgst())
                .totalSgst(billDto.getTotalSgst())
                .grandTotal(billDto.getGrandTotal())
                .roundOff(billDto.getRoundOff())
                .paidAmount(billDto.getPaidAmount())
                .paymentMode(billDto.getPaymentMode())
                .notes(billDto.getNotes())
                .userId(billDto.getUserId())
                .createdAt(billDto.getCreatedAt())
                .updatedAt(billDto.getUpdatedAt())
                .items(new ArrayList<>())
                .build();
        
        // Convert and add bill items
        if (billDto.getItems() != null) {
            List<BillItem> billItems = billDto.getItems().stream()
                    .map(itemDto -> {
                        BillItem item = convertToEntity(itemDto);
                        item.setBill(bill);
                        return item;
                    })
                    .collect(Collectors.toList());
            
            bill.setItems(billItems);
        }
        
        return bill;
    }

    // Helper method to convert BillItemDto to BillItem entity
    private BillItem convertToEntity(BillItemDto billItemDto) {
        return BillItem.builder()
                .billItemId(billItemDto.getBillItemId())
                .serialNo(billItemDto.getSerialNo())
                .itemName(billItemDto.getItemName())
                .partNumber(billItemDto.getPartNumber())
                .manufacturer(billItemDto.getManufacturer())
                .sparePartId(billItemDto.getSparePartId())
                .cgstPercentage(billItemDto.getCgstPercentage())
                .sgstPercentage(billItemDto.getSgstPercentage())
                .cgstAmount(billItemDto.getCgstAmount())
                .sgstAmount(billItemDto.getSgstAmount())
                .quantity(billItemDto.getQuantity())
                .rate(billItemDto.getRate())
                .amount(billItemDto.getAmount())
                .build();
    }
} 