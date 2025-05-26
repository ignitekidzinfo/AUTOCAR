package com.spring.jwt.SparePartTransaction;

import com.spring.jwt.Appointment.ResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bills")
public class BillController {

    private final BillService billService;

    @Autowired
    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseDto<BillDto>> createBill(@RequestBody BillDto billDto) {
        try {
            BillDto createdBill = billService.createBill(billDto);
            return ResponseEntity.ok(ResponseDto.success("Bill created successfully", createdBill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to create bill", e.getMessage()));
        }
    }
    
    @PostMapping("/createFromRequest")
    public ResponseEntity<ResponseDto<BillDto>> createBillFromRequest(@RequestBody CreateBillRequest request) {
        try {
            // Convert request to DTO
            BillDto billDto = convertRequestToDto(request);
            
            // Create bill
            BillDto createdBill = billService.createBill(billDto);
            
            return ResponseEntity.ok(ResponseDto.success("Bill created successfully", createdBill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to create bill", e.getMessage()));
        }
    }

    @GetMapping("/{billId}")
    public ResponseEntity<ResponseDto<BillDto>> getBillById(@PathVariable Integer billId) {
        try {
            BillDto bill = billService.getBillById(billId);
            return ResponseEntity.ok(ResponseDto.success("Bill retrieved successfully", bill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bill", e.getMessage()));
        }
    }

    @GetMapping("/billNo/{billNo}")
    public ResponseEntity<ResponseDto<BillDto>> getBillByBillNo(@PathVariable String billNo) {
        try {
            BillDto bill = billService.getBillByBillNo(billNo);
            return ResponseEntity.ok(ResponseDto.success("Bill retrieved successfully", bill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bill", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseDto<List<BillDto>>> getAllBills() {
        try {
            List<BillDto> bills = billService.getAllBills();
            return ResponseEntity.ok(ResponseDto.success("Bills retrieved successfully", bills));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bills", e.getMessage()));
        }
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<ResponseDto<List<BillDto>>> getBillsByVendorId(@PathVariable Integer vendorId) {
        try {
            List<BillDto> bills = billService.getBillsByVendorId(vendorId);
            return ResponseEntity.ok(ResponseDto.success("Bills retrieved successfully", bills));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bills", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseDto<List<BillDto>>> getBillsByUserId(@PathVariable Integer userId) {
        try {
            List<BillDto> bills = billService.getBillsByUserId(userId);
            return ResponseEntity.ok(ResponseDto.success("Bills retrieved successfully", bills));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bills", e.getMessage()));
        }
    }

    @GetMapping("/dateRange")
    public ResponseEntity<ResponseDto<List<BillDto>>> getBillsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<BillDto> bills = billService.getBillsByDateRange(startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Bills retrieved successfully", bills));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bills", e.getMessage()));
        }
    }

    @GetMapping("/vendor/{vendorId}/dateRange")
    public ResponseEntity<ResponseDto<List<BillDto>>> getBillsByVendorAndDateRange(
            @PathVariable Integer vendorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<BillDto> bills = billService.getBillsByVendorAndDateRange(vendorId, startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Bills retrieved successfully", bills));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bills", e.getMessage()));
        }
    }

    @PutMapping("/update/{billId}")
    public ResponseEntity<ResponseDto<BillDto>> updateBill(
            @PathVariable Integer billId,
            @RequestBody BillDto billDto) {
        try {
            BillDto updatedBill = billService.updateBill(billId, billDto);
            return ResponseEntity.ok(ResponseDto.success("Bill updated successfully", updatedBill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to update bill", e.getMessage()));
        }
    }
    
    @PutMapping("/updateFromRequest/{billId}")
    public ResponseEntity<ResponseDto<BillDto>> updateBillFromRequest(
            @PathVariable Integer billId,
            @RequestBody CreateBillRequest request) {
        try {
            // Convert request to DTO
            BillDto billDto = convertRequestToDto(request);
            billDto.setBillId(billId);
            
            // Update bill
            BillDto updatedBill = billService.updateBill(billId, billDto);
            
            return ResponseEntity.ok(ResponseDto.success("Bill updated successfully", updatedBill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to update bill", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{billId}")
    public ResponseEntity<ResponseDto<Void>> deleteBill(@PathVariable Integer billId) {
        try {
            billService.deleteBill(billId);
            return ResponseEntity.ok(ResponseDto.success("Bill deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to delete bill", e.getMessage()));
        }
    }
    
    @GetMapping("/printData/{billId}")
    public ResponseEntity<ResponseDto<BillDto>> getBillPrintData(@PathVariable Integer billId) {
        try {
            // Get the bill data for frontend PDF rendering
            BillDto bill = billService.getBillById(billId);
            return ResponseEntity.ok(ResponseDto.success("Bill print data retrieved successfully", bill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve bill print data", e.getMessage()));
        }
    }
    
    // Helper method to convert CreateBillRequest to BillDto
    public static BillDto convertRequestToDto(CreateBillRequest request) {
        BillDto billDto = BillDto.builder()
                .billNo(request.getBillNo())
                .billDate(request.getBillDate())
                .shopName(request.getShopName())
                .shopAddress(request.getShopAddress())
                .shopContact(request.getShopContact())
                .vendorId(request.getVendorId())
                .vendorName(request.getVendorName())
                .vendorAddress(request.getVendorAddress())
                .vendorContact(request.getVendorContact())
                .vendorGstin(request.getVendorGstin())
                .subTotal(request.getSubTotal())
                .totalCgst(request.getTotalCgst())
                .totalSgst(request.getTotalSgst())
                .grandTotal(request.getGrandTotal())
                .roundOff(request.getRoundOff())
                .paidAmount(request.getPaidAmount())
                .paymentMode(request.getPaymentMode())
                .notes(request.getNotes())
                .userId(request.getUserId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();
        
        // Convert and add bill items
        if (request.getItems() != null) {
            List<BillItemDto> billItems = request.getItems().stream()
                    .map(BillController::convertRequestItemToDto)
                    .collect(Collectors.toList());
            
            billDto.setItems(billItems);
        }
        
        return billDto;
    }
    
    // Helper method to convert CreateBillItemRequest to BillItemDto
    public static BillItemDto convertRequestItemToDto(CreateBillRequest.CreateBillItemRequest itemRequest) {
        return BillItemDto.builder()
                .serialNo(itemRequest.getSerialNo())
                .itemName(itemRequest.getItemName())
                .partNumber(itemRequest.getPartNumber())
                .manufacturer(itemRequest.getManufacturer())
                .sparePartId(itemRequest.getSparePartId())
                .cgstPercentage(itemRequest.getCgstPercentage())
                .sgstPercentage(itemRequest.getSgstPercentage())
                .cgstAmount(itemRequest.getCgstAmount())
                .sgstAmount(itemRequest.getSgstAmount())
                .quantity(itemRequest.getQuantity())
                .rate(itemRequest.getRate())
                .amount(itemRequest.getAmount())
                .build();
    }
} 