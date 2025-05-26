package com.spring.jwt.SparePartTransaction;

import com.spring.jwt.Appointment.ResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.sql.Connection;

@RestController
@RequestMapping("/sparePartTransactions")
public class SparePartTransactionController {

    private final SparePartTransactionService transactionService;
    private final SparePartTransactionRepository transactionRepository;
    private final JdbcTemplate jdbcTemplate;
    private final BillService billService;
    private final BillUtils billUtils;
    private final BillUtils.ShopInfo shopInfo;

    // Create a thread pool for parallel processing with more threads
    private final ExecutorService executorService = Executors.newFixedThreadPool(
            Math.max(Runtime.getRuntime().availableProcessors() * 2, 8)
    );

    public SparePartTransactionController(
            SparePartTransactionService transactionService,
            SparePartTransactionRepository transactionRepository,
            JdbcTemplate jdbcTemplate,
            BillService billService,
            BillUtils billUtils,
            BillUtils.ShopInfo shopInfo) {
        this.transactionService = transactionService;
        this.transactionRepository = transactionRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.billService = billService;
        this.billUtils = billUtils;
        this.shopInfo = shopInfo;
    }

    @PostMapping("/add")
    public ResponseEntity<ResponseDto<SparePartTransactionDto>> createTransaction(
            @RequestBody CreateSparePartTransactionDto transactionDto) {
        try {
            SparePartTransactionDto createdTransaction = transactionService.createTransaction(transactionDto);
            return ResponseEntity.ok(ResponseDto.success("Transaction created successfully", createdTransaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to create transaction", e.getMessage()));
        }
    }

    /**
     * Optimized bulk transaction endpoint using JDBC batch operations for maximum performance
     */
    @PostMapping("/bulkAdd")
    @Transactional
    public ResponseEntity<ResponseDto<Map<String, Object>>> createBulkTransactions(
            @RequestBody BulkTransactionRequest request) {
        long startTime = System.currentTimeMillis();

        List<CreateSparePartTransactionDto> transactions = request.getTransactions();
        if (transactions == null || transactions.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ResponseDto.error("No transactions provided", "The transactions list cannot be empty"));
        }

        Map<String, Object> result = new HashMap<>();
        List<SparePartTransactionDto> createdTransactions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            // For all batch sizes, use direct JDBC batch insert for maximum performance
            processBatchWithJdbc(transactions, createdTransactions, errors, request);

            long endTime = System.currentTimeMillis();
            long processingTime = endTime - startTime;

            result.put("successCount", createdTransactions.size());
            result.put("failureCount", errors.size());
            result.put("processingTimeMs", processingTime);
            result.put("transactions", createdTransactions);

            // Create a bill if transactions were successful
            if (!createdTransactions.isEmpty()) {
                try {
                    // Create a bill request from transaction data
                    BillUtils.TransactionBatchRequest transactionBatchRequest = new BillUtils.TransactionBatchRequest();
                    transactionBatchRequest.setTransactions(createdTransactions);
                    transactionBatchRequest.setVendorId(request.getVendorId());
                    transactionBatchRequest.setVendorName(createdTransactions.get(0).getName());
                    transactionBatchRequest.setInvoiceNo(request.getInvoiceNo());
                    transactionBatchRequest.setUserId(createdTransactions.get(0).getUserId());
                    
                    // Convert transaction data to bill request
                    CreateBillRequest billRequest = billUtils.createBillRequestFromTransaction(
                            transactionBatchRequest, shopInfo);
                    
                    // Create bill
                    BillDto createdBill = billService.createBill(
                            BillController.convertRequestToDto(billRequest));
                    
                    // Add bill info to result
                    result.put("billId", createdBill.getBillId());
                    result.put("billNo", createdBill.getBillNo());
                } catch (Exception e) {
                    // Log error but don't fail the transaction
                    System.err.println("Error creating bill: " + e.getMessage());
                    e.printStackTrace();
                    result.put("billError", "Failed to create bill: " + e.getMessage());
                }
            }

            if (errors.isEmpty()) {
                return ResponseEntity.ok(ResponseDto.success(
                        createdTransactions.size() + " transactions created successfully in " +
                                processingTime + "ms", result));
            } else {
                result.put("errors", errors);
                return ResponseEntity.ok(ResponseDto.success(
                        createdTransactions.size() + " transactions created with " +
                                errors.size() + " failures in " + processingTime + "ms",
                        result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ResponseDto.error("Failed to process bulk transactions", e.getMessage()));
        }
    }

    /**
     * Process transactions using direct JDBC batch operations for maximum performance
     * This bypasses the JPA/Hibernate layer for bulk inserts
     */
    private void processBatchWithJdbc(
            List<CreateSparePartTransactionDto> transactions,
            List<SparePartTransactionDto> createdTransactions,
            List<String> errors,
            BulkTransactionRequest request) {

        try {
            long dataLoadStart = System.currentTimeMillis();

            // Preload all required data with improved optimization
            Map<String, Object> preloadedData = transactionService.preloadDataForBatch(transactions);

            long dataLoadEnd = System.currentTimeMillis();
            System.out.println("Data preloading time: " + (dataLoadEnd - dataLoadStart) + "ms");

            // Process in efficient batches
            int totalSize = transactions.size();

            // Optimize batch size: for smaller batches, use a smaller size for quicker response
            // For larger batches, use a larger size for better throughput
            int optimalBatchSize;
            if (totalSize <= 20) {
                optimalBatchSize = totalSize;
            } else if (totalSize <= 50) {
                optimalBatchSize = 50;
            } else if (totalSize <= 100) {
                optimalBatchSize = 100;
            } else {
                optimalBatchSize = 150;
            }

            System.out.println("Processing " + totalSize + " transactions with batch size " + optimalBatchSize);

            // Prepare batch insert SQL - using actual database column names
            final String SQL = "INSERT INTO spare_part_transaction " +
                    "(part_number, sparePart_id, part_name, manufacturer, customer_name, price, QtyPrice, " +
                    "totalGST, cGST, sGST, update_At, transaction_type, quantity, vehicleRegId, " +
                    "transaction_date, userId, billNo, vendorName) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> spareParts = (Map<String, Map<String, Object>>) preloadedData.get("spareParts");

            // Pre-compute common values to avoid repeated calculations
            final java.sql.Date currentSqlDate = java.sql.Date.valueOf(LocalDate.now());
            final Timestamp currentTimestamp = Timestamp.valueOf(LocalDateTime.now());

            // Extract connection from DataSource with optimized parameters
            Connection connection = null;
            PreparedStatement insertPs = null;
            PreparedStatement updatePs = null;
            boolean committed = false;

            try {
                // Get connection from pool
                connection = jdbcTemplate.getDataSource().getConnection();

                // Disable auto-commit for batch processing
                connection.setAutoCommit(false);

                // Apply MySQL/MariaDB specific optimizations if possible
                try {
                    // Set larger network packet sizes for MySQL
                    connection.createStatement().execute("SET net_buffer_length=1000000");
                    connection.createStatement().execute("SET max_allowed_packet=1000000000");

                    // Disable unique checks and foreign key checks temporarily for massive speed improvement
                    connection.createStatement().execute("SET UNIQUE_CHECKS=0");
                    connection.createStatement().execute("SET FOREIGN_KEY_CHECKS=0");

                    // Set session variables for bulk insert optimization
                    connection.createStatement().execute("SET SESSION tx_isolation='READ-COMMITTED'");
                    connection.createStatement().execute("SET sql_log_bin=0");
                } catch (Exception e) {
                    // Ignore if not supported by the database
                    System.out.println("Could not set MySQL optimizations: " + e.getMessage());
                }

                // Create prepared statements with optimal parameters
                insertPs = connection.prepareStatement(SQL);
                updatePs = connection.prepareStatement(
                        "UPDATE user_part SET quantity = quantity + ? WHERE user_part_id = ?"
                );

                // Use batch size hints for the driver if possible
                try {
                    insertPs.setFetchSize(optimalBatchSize);
                    updatePs.setFetchSize(optimalBatchSize);
                } catch (Exception e) {
                    // Ignore if not supported
                }

                // Prepare for quantity updates and transaction inserts
                Map<String, Integer> quantityChanges = new HashMap<>();

                // Use a retry mechanism for failed transactions
                List<CreateSparePartTransactionDto> retryTransactions = new ArrayList<>();

                long prepareStart = System.currentTimeMillis();

                // Process all transactions in a single batch
                for (int i = 0; i < transactions.size(); i++) {
                    CreateSparePartTransactionDto dto = transactions.get(i);

                    try {
                        String partKey = dto.getPartNumber() + ":" + dto.getManufacturer();
                        Map<String, Object> sparePartData = spareParts.get(partKey);

                        if (sparePartData == null) {
                            errors.add("Spare part not found: " + dto.getPartNumber());
                            continue;
                        }

                        // Calculate values with more efficient math operations
                        Long basePrice = dto.getPrice() != null ? dto.getPrice() : ((Number) sparePartData.get("price")).longValue();
                        Integer cgstValue = dto.getCgst() != null ? dto.getCgst() : ((Number) sparePartData.get("cgst")).intValue();
                        Integer sgstValue = dto.getSgst() != null ? dto.getSgst() : ((Number) sparePartData.get("sgst")).intValue();

                        int totalGSTValue = dto.getTotalsgst() != null ? dto.getTotalsgst() : (cgstValue + sgstValue);

                        // Handle edge case
                        if (dto.getTotalsgst() != null && (dto.getCgst() == null || dto.getSgst() == null)) {
                            cgstValue = totalGSTValue / 2;
                            sgstValue = totalGSTValue / 2;
                        }

                        // Calculate price using efficient math
                        long finalPrice;
                        if (dto.getTransactionType() == TransactionType.CREDIT) {
                            finalPrice = basePrice;
                        } else {
                            finalPrice = basePrice + Math.round((basePrice * totalGSTValue) / 100.0);
                        }

                        long qtyPrice = finalPrice * dto.getQuantity();

                        // Set all parameters for the insert statement
                        insertPs.setString(1, dto.getPartNumber());
                        insertPs.setInt(2, ((Number) sparePartData.get("spare_part_id")).intValue());
                        insertPs.setString(3, (String) sparePartData.get("part_name"));
                        insertPs.setString(4, dto.getManufacturer());
                        insertPs.setString(5, dto.getCustomerName());
                        insertPs.setLong(6, finalPrice);
                        insertPs.setLong(7, qtyPrice);
                        insertPs.setInt(8, totalGSTValue);
                        insertPs.setInt(9, cgstValue);
                        insertPs.setInt(10, sgstValue);
                        insertPs.setDate(11, currentSqlDate); // Use pre-computed date
                        insertPs.setString(12, dto.getTransactionType().toString());
                        insertPs.setInt(13, dto.getQuantity());
                        insertPs.setObject(14, dto.getTransactionType() == TransactionType.DEBIT ? dto.getVehicleRegId() : null);
                        insertPs.setTimestamp(15, currentTimestamp); // Use pre-computed timestamp
                        insertPs.setInt(16, dto.getUserId());
                        insertPs.setString(17, dto.getBillNo());
                        insertPs.setString(18, dto.getName());

                        // Add to batch
                        insertPs.addBatch();

                        // Accumulate quantity changes for each part in a single pass
                        int change = dto.getTransactionType() == TransactionType.CREDIT ? dto.getQuantity() : -dto.getQuantity();
                        quantityChanges.put(partKey, quantityChanges.getOrDefault(partKey, 0) + change);

                        // Create lightweight DTOs for response
                        SparePartTransactionDto createdDto = SparePartTransactionDto.builder()
                                .partNumber(dto.getPartNumber())
                                .partName((String) sparePartData.get("part_name"))
                                .manufacturer(dto.getManufacturer())
                                .quantity(dto.getQuantity())
                                .transactionType(dto.getTransactionType())
                                .build();

                        createdTransactions.add(createdDto);
                    } catch (Exception e) {
                        System.err.println("Error processing transaction " + i + ": " + e.getMessage());
                        errors.add("Error processing transaction " + i + ": " + e.getMessage());
                        // Add to retry list for a second attempt
                        retryTransactions.add(dto);
                    }
                }

                long prepareEnd = System.currentTimeMillis();
                System.out.println("Batch preparation time: " + (prepareEnd - prepareStart) + "ms");

                // 1. Execute all transaction inserts at once
                long execStart = System.currentTimeMillis();
                int[] batchResults = insertPs.executeBatch();
                long execEnd = System.currentTimeMillis();

                System.out.println("Batch insert execution time: " + (execEnd - execStart) + "ms for " + batchResults.length + " items");

                // 2. Execute all quantity updates in a single batch
                @SuppressWarnings("unchecked")
                Map<String, Map<String, Object>> userParts = (Map<String, Map<String, Object>>) preloadedData.get("userParts");

                long updateStart = System.currentTimeMillis();
                int validQuantityUpdates = 0;

                // First validate all quantity changes to ensure we don't go negative
                for (Map.Entry<String, Integer> entry : quantityChanges.entrySet()) {
                    Map<String, Object> userPartData = userParts.get(entry.getKey());
                    if (userPartData != null) {
                        int currentQty = ((Number) userPartData.get("quantity")).intValue();
                        int change = entry.getValue();
                        int newQty = currentQty + change;

                        if (newQty < 0) {
                            errors.add("Insufficient stock for part: " + entry.getKey() +
                                    " (current: " + currentQty + ", change: " + change + ")");
                        } else {
                            // Set parameters for update
                            updatePs.setInt(1, change);
                            updatePs.setInt(2, ((Number) userPartData.get("user_part_id")).intValue());

                            // Add to batch
                            updatePs.addBatch();
                            validQuantityUpdates++;
                        }
                    }
                }

                // Execute all valid quantity updates at once
                if (validQuantityUpdates > 0) {
                    int[] updateResults = updatePs.executeBatch();
                    System.out.println("Quantity updates processed: " + updateResults.length);
                }

                long updateEnd = System.currentTimeMillis();
                System.out.println("Quantity updates execution time: " + (updateEnd - updateStart) + "ms for " + validQuantityUpdates + " items");

                // 3. Process any retry transactions individually
                if (!retryTransactions.isEmpty()) {
                    System.out.println("Retrying " + retryTransactions.size() + " failed transactions individually");

                    int retrySuccess = 0;
                    for (CreateSparePartTransactionDto retryDto : retryTransactions) {
                        try {
                            SparePartTransactionDto created = transactionService.createTransaction(retryDto);
                            createdTransactions.add(created);
                            retrySuccess++;
                        } catch (Exception e) {
                            errors.add("Retry failed for part " + retryDto.getPartNumber() + ": " + e.getMessage());
                        }
                    }

                    System.out.println("Retry successful for " + retrySuccess + " out of " + retryTransactions.size() + " transactions");
                }

                // 4. Restore database settings if they were changed
                try {
                    // Re-enable unique checks and foreign key checks
                    connection.createStatement().execute("SET UNIQUE_CHECKS=1");
                    connection.createStatement().execute("SET FOREIGN_KEY_CHECKS=1");
                    connection.createStatement().execute("SET sql_log_bin=1");
                } catch (Exception e) {
                    // Ignore if not supported
                }

                // 5. Commit all operations in one transaction
                connection.commit();
                committed = true;

                System.out.println("Transaction committed successfully");
            } catch (Exception e) {
                // Rollback on error
                if (connection != null && !committed) {
                    try {
                        connection.rollback();
                    } catch (SQLException rollbackEx) {
                        System.err.println("Error during rollback: " + rollbackEx.getMessage());
                    }
                }
                throw e;
            } finally {
                // Close all resources properly in reverse order
                if (updatePs != null) {
                    try {
                        updatePs.close();
                    } catch (SQLException e) {
                        System.err.println("Error closing update statement: " + e.getMessage());
                    }
                }

                if (insertPs != null) {
                    try {
                        insertPs.close();
                    } catch (SQLException e) {
                        System.err.println("Error closing insert statement: " + e.getMessage());
                    }
                }

                if (connection != null) {
                    try {
                        // Restore auto-commit before returning to pool
                        connection.setAutoCommit(true);
                        connection.close();
                    } catch (SQLException e) {
                        System.err.println("Error closing connection: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            String errorMsg = "Error in processBatchWithJdbc: " + e.getMessage();
            System.err.println(errorMsg);
            e.printStackTrace();
            errors.add(errorMsg);
        }
    }

    /**
     * Process transactions in parallel using CompletableFuture for better performance
     */
    private void processBatchInParallel(
            List<CreateSparePartTransactionDto> transactions,
            List<SparePartTransactionDto> createdTransactions,
            List<String> errors) {

        int batchSize = calculateOptimalBatchSize(transactions.size());
        int numBatches = (transactions.size() + batchSize - 1) / batchSize;

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int i = 0; i < numBatches; i++) {
            int startIdx = i * batchSize;
            int endIdx = Math.min(startIdx + batchSize, transactions.size());
            List<CreateSparePartTransactionDto> batch = transactions.subList(startIdx, endIdx);

            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                for (CreateSparePartTransactionDto dto : batch) {
                    try {
                        SparePartTransactionDto created = transactionService.createTransaction(dto);
                        synchronized (createdTransactions) {
                            createdTransactions.add(created);
                        }
                    } catch (Exception e) {
                        synchronized (errors) {
                            errors.add("Error processing transaction: " + e.getMessage());
                        }
                    }
                }
            }, executorService);

            futures.add(future);
        }

        // Wait for all batches to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    /**
     * Process transactions sequentially within a single transaction boundary
     */
    @Transactional
    private void processBatchSequentially(
            List<CreateSparePartTransactionDto> transactions,
            List<SparePartTransactionDto> createdTransactions,
            List<String> errors) {

        for (CreateSparePartTransactionDto dto : transactions) {
            try {
                SparePartTransactionDto created = transactionService.createTransaction(dto);
                createdTransactions.add(created);
            } catch (Exception e) {
                errors.add("Error processing transaction: " + e.getMessage());
            }
        }
    }

    /**
     * Calculate optimal batch size based on input size
     */
    private int calculateOptimalBatchSize(int totalSize) {
        if (totalSize <= 20) return totalSize; // No batching for small sets
        if (totalSize <= 50) return 10;
        if (totalSize <= 100) return 20;
        return 30; // Larger batch size for very large inputs
    }

    @GetMapping("/GetById")
    public ResponseEntity<ResponseDto<SparePartTransactionDto>> getTransactionById(@RequestParam Integer transactionId) {
        try {
            SparePartTransactionDto transaction = transactionService.getTransactionById(transactionId);
            return ResponseEntity.ok(ResponseDto.success("Transaction retrieved successfully", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Transaction not found", e.getMessage()));
        }
    }

    @GetMapping("getAll")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getAllTransactions() {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getAllTransactions();
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve transactions", e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDto<SparePartTransactionDto>> updateTransaction(
            @RequestParam Integer transactionId,
            @RequestBody SparePartTransactionDto transactionDto) {
        try {
            SparePartTransactionDto updatedTransaction = transactionService.updateTransaction(transactionId, transactionDto);
            return ResponseEntity.ok(ResponseDto.success("Transaction updated successfully", updatedTransaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to update transaction", e.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ResponseDto<Void>> deleteTransaction(@RequestParam Integer transactionId) {
        try {
            transactionService.deleteTransaction(transactionId);
            return ResponseEntity.ok(ResponseDto.success("Transaction deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to delete transaction", e.getMessage()));
        }
    }

    @GetMapping("/getByBillNo")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByBillNo(@RequestParam String billNo) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByBillNo(billNo);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found with Bill No", e.getMessage()));
        }
    }

    @GetMapping("/userId")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByUserId(@RequestParam Integer userId) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByUserId(userId);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for User ID", e.getMessage()));
        }
    }

    @GetMapping("/between-dates")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getTransactionsBetweenDates(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getTransactionsBetweenDates(startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("Failed to retrieve transactions", e.getMessage()));
        }
    }
    @GetMapping("/vehicleRegId")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByVehicleRegId(@RequestParam Integer vehicleRegId) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByVehicleRegId(vehicleRegId);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for Vehicle Registration ID", e.getMessage()));
        }
    }

    @GetMapping("/byPartNumberAndDates")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByPartNumberAndTransactionsBetweenDates(
            @RequestParam Integer sparePartId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByPartNumberAndTransactionsBetweenDates(sparePartId, startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for the given criteria", e.getMessage()));
        }
    }

    @GetMapping("/byTransactionTypeAndNameAndDateRange")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByTransactionTypeAndNameAndDateRange(
            @RequestParam TransactionType transactionType,
            @RequestParam String name,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByTransactionTypeAndNameAndDateRange(transactionType, name, startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for given filters", e.getMessage()));
        }
    }

    @GetMapping("/byNameOrPartNumber")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByNameOrPartNumber(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String partNumber) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getByNameOrPartNumber(name, partNumber);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for given filters", e.getMessage()));
        }

    }

    private SparePartTransactionDto toDto(SparePartTransaction transaction) {
        return SparePartTransactionDto.builder()
                .sparePartTransactionId(transaction.getSparePartTransactionId())
                .partNumber(transaction.getPartNumber())
                .sparePartId(transaction.getSparePartId())
                .partName(transaction.getPartName())
                .manufacturer(transaction.getManufacturer())
                .vehicleRegId(transaction.getVehicleRegId())
                .price(transaction.getPrice())
                .cGST(transaction.getCGST())
                .sGST(transaction.getSGST())
                .qtyPrice(transaction.getQtyPrice())
                .updateAt(transaction.getUpdateAt())
                .transactionType(transaction.getTransactionType())
                .quantity(transaction.getQuantity())
                .transactionDate(transaction.getTransactionDate())
                .userId(transaction.getUserId())
                .billNo(transaction.getBillNo())
                .customerName(transaction.getCustomerName())
                .name(transaction.getName())
                .build();
    }

    @GetMapping("/byTransactionTypeAndDateRange")
    public ResponseEntity<ResponseDto<List<SparePartTransactionDto>>> getByTransactionTypeAndDateRange(
            @RequestParam TransactionType transactionType,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        try {
            List<SparePartTransactionDto> transactions = transactionService.getCreditTransactionsByDateRange(
                    transactionType, startDate, endDate);
            return ResponseEntity.ok(ResponseDto.success("Transactions retrieved successfully", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDto.error("No transactions found for given filters", e.getMessage()));
        }
    }
}

/**
 * Request class for bulk transaction operations
 */
class BulkTransactionRequest {
    private List<CreateSparePartTransactionDto> transactions;
    private Integer vendorId;
    private String invoiceNo;
    private String invoiceDate;

    public List<CreateSparePartTransactionDto> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<CreateSparePartTransactionDto> transactions) {
        this.transactions = transactions;
    }

    public Integer getVendorId() {
        return vendorId;
    }

    public void setVendorId(Integer vendorId) {
        this.vendorId = vendorId;
    }

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public String getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(String invoiceDate) {
        this.invoiceDate = invoiceDate;
    }
}
