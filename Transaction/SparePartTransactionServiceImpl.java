package com.spring.jwt.SparePartTransaction;

import com.spring.jwt.SparePart.SparePart;
import com.spring.jwt.SparePart.SparePartRepo;
import com.spring.jwt.UserParts.UserPart;
import com.spring.jwt.UserParts.UserPartRepository;
import com.spring.jwt.VehicleReg.VehicleRegRepository;
import com.spring.jwt.entity.VehicleReg;
import com.spring.jwt.entity.VendorPart;
import com.spring.jwt.repository.VendorPartRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@Service
public class SparePartTransactionServiceImpl implements SparePartTransactionService {

    @Autowired
    private SparePartTransactionRepository transactionRepository;

    @Autowired
    private SparePartRepo sparePartRepository;

    @Autowired
    private UserPartRepository userPartRepository;

    @Autowired
    private VehicleRegRepository vehicleRegRepository;

    @Autowired
    private VendorPartRepository vendorPartRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Cache for frequently accessed entities to reduce database queries in bulk operations
    private final Map<String, SparePart> sparePartCache = new ConcurrentHashMap<>();
    private final Map<String, UserPart> userPartCache = new ConcurrentHashMap<>();
    private final Map<String, Optional<VendorPart>> vendorPartCache = new ConcurrentHashMap<>();
    private final Map<Integer, Optional<VehicleReg>> vehicleRegCache = new ConcurrentHashMap<>();

    /**
     * Optimized createTransaction method with reduced database queries for better performance
     * especially in bulk operations
     */
    @Override
    @Transactional
    public SparePartTransactionDto createTransaction(CreateSparePartTransactionDto transactionDto) {
        // Basic validation
        if (transactionDto.getTransactionType() != TransactionType.CREDIT &&
                transactionDto.getTransactionType() != TransactionType.DEBIT) {
            throw new IllegalArgumentException("Invalid transaction type! Allowed values: CREDIT or DEBIT.");
        }

        Integer userId = transactionDto.getUserId();

        // Handle user resolution for DEBIT transactions with optimized caching
        if (transactionDto.getTransactionType() == TransactionType.DEBIT) {
            if (userId == null && transactionDto.getVehicleRegId() != null) {
                Integer vehicleRegId = transactionDto.getVehicleRegId();

                // Use cached vehicle registration if available
                Optional<VehicleReg> vehicleRegOpt = vehicleRegCache.computeIfAbsent(
                        vehicleRegId,
                        id -> vehicleRegRepository.findUserIdByVehicleRegId(id)
                );

                userId = vehicleRegOpt
                        .map(VehicleReg::getUserId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "No user found for Vehicle Registration ID: " + vehicleRegId));
            }

            if (userId == null) {
                throw new IllegalArgumentException("Either userId or vehicleRegId must be provided for DEBIT transactions.");
            }
        }

        // Get SparePart using cache to reduce database queries
        String sparePartCacheKey = transactionDto.getPartNumber() + ":" + transactionDto.getManufacturer();
        SparePart sparePart = sparePartCache.computeIfAbsent(sparePartCacheKey, key -> {
            return sparePartRepository.findByPartNumberAndManufacturer(
                        transactionDto.getPartNumber(), transactionDto.getManufacturer())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Spare part not found with Part Number: " + transactionDto.getPartNumber()));
        });

        if (sparePart.getPrice() == null || sparePart.getPrice() <= 0) {
            throw new IllegalArgumentException("Invalid price for spare part: " + sparePart.getPartNumber());
        }

        // Get UserPart using cache to reduce database queries
        String userPartCacheKey = sparePart.getPartNumber() + ":" + sparePart.getManufacturer();
        UserPart userPart = userPartCache.computeIfAbsent(userPartCacheKey, key -> {
            return userPartRepository.findByPartNumberAndManufacturer(sparePart.getPartNumber(), sparePart.getManufacturer())
                .orElseGet(() -> {
                    UserPart newUserPart = new UserPart();
                    newUserPart.setPartNumber(sparePart.getPartNumber());
                    newUserPart.setQuantity(0);
                    return userPartRepository.save(newUserPart);
                    });
                });

        // Vendor part handling for CREDIT transaction with caching
        if (transactionDto.getTransactionType() == TransactionType.CREDIT) {
            String vendorCacheKey = transactionDto.getName() + ":" + transactionDto.getPartNumber();

            // Validate bill number
            if (transactionDto.getBillNo() == null || transactionDto.getBillNo().trim().isEmpty()) {
                throw new IllegalArgumentException("Bill number is required for CREDIT transactions.");
            }

            // Check if VendorPart exists and create if needed
            Optional<VendorPart> existingVendorPart = vendorPartCache.computeIfAbsent(
                    vendorCacheKey,
                    key -> vendorPartRepository.findByVendorAndPartNumber(
                            transactionDto.getName(), transactionDto.getPartNumber())
            );

            if (!existingVendorPart.isPresent()) {
                // If VendorPart doesn't exist, create a new one
                VendorPart newVendorPart = new VendorPart();
                newVendorPart.setVendor(transactionDto.getName());
                newVendorPart.setVendorId(transactionDto.getVendorId());
                newVendorPart.setPartNumber(sparePart.getPartNumber());
                newVendorPart.setPartName(sparePart.getPartName());
                newVendorPart.setDescription(sparePart.getDescription());
                newVendorPart.setManufacturer(sparePart.getManufacturer());

                vendorPartRepository.save(newVendorPart);

                // Update cache
                vendorPartCache.put(vendorCacheKey, Optional.of(newVendorPart));
            }
        }

        // Handle quantity updates
        if (transactionDto.getTransactionType() == TransactionType.DEBIT) {
            if (transactionDto.getQuantity() <= 0) {
                throw new IllegalArgumentException("For DEBIT transactions, quantity must be greater than 0.");
            }
            if (userPart.getQuantity() < transactionDto.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock! Available: " + userPart.getQuantity() + ", Requested: " + transactionDto.getQuantity());
            }
            userPart.setQuantity(userPart.getQuantity() - transactionDto.getQuantity());
        } else {
            userPart.setQuantity(userPart.getQuantity() + transactionDto.getQuantity());
        }

        // Update cached UserPart
        userPartCache.put(userPartCacheKey, userPart);

        // Save UserPart to database
        userPartRepository.save(userPart);

        // Price and GST calculation
        long basePrice = transactionDto.getPrice() != null ? transactionDto.getPrice() : sparePart.getPrice();

        // GST calculation
        int cgstValue = (transactionDto.getCgst() != null) ? transactionDto.getCgst() :
                (sparePart.getCGST() != null ? sparePart.getCGST() : 0);

        int sgstValue = (transactionDto.getSgst() != null) ? transactionDto.getSgst() :
                (sparePart.getSGST() != null ? sparePart.getSGST() : 0);

        // Calculate total GST
        int totalGSTValue;
        if (transactionDto.getTotalsgst() != null) {
            totalGSTValue = transactionDto.getTotalsgst();
            if (transactionDto.getCgst() == null || transactionDto.getSgst() == null) {
                cgstValue = totalGSTValue / 2;
                sgstValue = totalGSTValue / 2;
            }
        } else {
            totalGSTValue = cgstValue + sgstValue;
        }

        // Calculate final price
        long finalPrice;
        if (transactionDto.getTransactionType() == TransactionType.CREDIT) {
            finalPrice = basePrice;
        } else {
            double gstAmount = (basePrice * totalGSTValue) / 100.0;
            finalPrice = basePrice + Math.round(gstAmount);
        }

        // Calculate qty_price
        long qtyPrice = finalPrice * transactionDto.getQuantity();

        // Build and save transaction
        SparePartTransaction transaction = SparePartTransaction.builder()
                .partNumber(sparePart.getPartNumber())
                .sparePartId(sparePart.getSparePartId())
                .partName(sparePart.getPartName())
                .manufacturer(sparePart.getManufacturer())
                .customerName(transactionDto.getCustomerName())
                .price(finalPrice)
                .qtyPrice(qtyPrice)
                .totalGST(totalGSTValue)
                .cGST(cgstValue)
                .sGST(sgstValue)
                .updateAt(LocalDate.from(LocalDateTime.now()))
                .transactionType(transactionDto.getTransactionType())
                .quantity(transactionDto.getQuantity())
                .vehicleRegId(transactionDto.getTransactionType() == TransactionType.DEBIT ? transactionDto.getVehicleRegId() : null)
                .transactionDate(LocalDateTime.now())
                .userId(userId)
                .billNo(transactionDto.getBillNo())
                .name(transactionDto.getName())
                .build();

        transaction = transactionRepository.save(transaction);
        return toDto(transaction);
    }

    /**
     * Optimized batch processing method for multiple transactions
     * This method handles multiple transactions in an efficient way
     */
    @Override
    @Transactional
    public List<SparePartTransactionDto> createBatchTransactions(List<CreateSparePartTransactionDto> transactionDtos) {
        List<SparePartTransactionDto> result = new ArrayList<>();

        // Preload common data to reduce database hits
        preloadCommonData(transactionDtos);

        // Process each transaction
        for (CreateSparePartTransactionDto dto : transactionDtos) {
            try {
                SparePartTransactionDto created = createTransaction(dto);
                result.add(created);
            } catch (Exception e) {
                // Log error but continue processing
                System.err.println("Error processing transaction: " + e.getMessage());
            }
        }

        return result;
    }

    /**
     * Preload common data for a batch of transactions to optimize performance
     */
    private void preloadCommonData(List<CreateSparePartTransactionDto> dtos) {
        // Extract unique part numbers and manufacturers
        Set<String> partNumbers = new HashSet<>();
        Set<String> manufacturers = new HashSet<>();
        Set<String> partManufacturerKeys = new HashSet<>();
        Set<Integer> vehicleRegIds = new HashSet<>();

        for (CreateSparePartTransactionDto dto : dtos) {
            partNumbers.add(dto.getPartNumber());
            manufacturers.add(dto.getManufacturer());
            partManufacturerKeys.add(dto.getPartNumber() + ":" + dto.getManufacturer());

            if (dto.getVehicleRegId() != null) {
                vehicleRegIds.add(dto.getVehicleRegId());
            }
        }

        // Bulk load spare parts - use existing methods instead of findAllByPartNumberIn
        for (String partNumber : partNumbers) {
            for (String manufacturer : manufacturers) {
                try {
                    Optional<SparePart> sparePart = sparePartRepository.findByPartNumberAndManufacturer(partNumber, manufacturer);
                    if (sparePart.isPresent()) {
                        sparePartCache.put(partNumber + ":" + manufacturer, sparePart.get());
                    }
                } catch (Exception e) {
                    // Skip if not found
                }
            }
        }

        // Bulk load user parts - use existing methods instead of findAllByPartNumberIn
        for (String partNumber : partNumbers) {
            for (String manufacturer : manufacturers) {
                try {
                    Optional<UserPart> userPart = userPartRepository.findByPartNumberAndManufacturer(partNumber, manufacturer);
                    if (userPart.isPresent()) {
                        userPartCache.put(partNumber + ":" + manufacturer, userPart.get());
                    }
                } catch (Exception e) {
                    // Skip if not found
                }
            }
        }

        // Preload vehicle registrations if needed - use existing methods instead of findAllByVehicleRegIdIn
        if (!vehicleRegIds.isEmpty()) {
            for (Integer vehicleRegId : vehicleRegIds) {
                try {
                    Optional<VehicleReg> vehicleReg = vehicleRegRepository.findUserIdByVehicleRegId(vehicleRegId);
                    if (vehicleReg.isPresent()) {
                        vehicleRegCache.put(vehicleRegId, vehicleReg);
                    }
                } catch (Exception e) {
                    // Skip if not found
                }
            }
        }
    }

    @Override
    public SparePartTransactionDto getTransactionById(Integer transactionId) {
        SparePartTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + transactionId));
        return toDto(transaction);
    }

    @Override
    public List<SparePartTransactionDto> getAllTransactions() {
        List<SparePartTransaction> transactions = transactionRepository.findAll();
        return transactions.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public SparePartTransactionDto updateTransaction(Integer transactionId, SparePartTransactionDto transactionDto) {
        SparePartTransaction existingTransaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + transactionId));

        existingTransaction.setPartNumber(transactionDto.getPartNumber());
        existingTransaction.setSparePartId(transactionDto.getSparePartId());
        existingTransaction.setPartName(transactionDto.getPartName());
        existingTransaction.setManufacturer(transactionDto.getManufacturer());
        existingTransaction.setPrice(transactionDto.getPrice());
        existingTransaction.setQtyPrice(transactionDto.getQtyPrice());
        existingTransaction.setUpdateAt(transactionDto.getUpdateAt());
        existingTransaction.setTransactionType(transactionDto.getTransactionType());
        existingTransaction.setQuantity(transactionDto.getQuantity());
        existingTransaction.setTransactionDate(transactionDto.getTransactionDate());
        existingTransaction.setUserId(transactionDto.getUserId());
        existingTransaction.setBillNo(transactionDto.getBillNo());
        existingTransaction.setCustomerName(transactionDto.getCustomerName());

        existingTransaction = transactionRepository.save(existingTransaction);
        return toDto(existingTransaction);
    }

    @Override
    public void deleteTransaction(Integer transactionId) {
        SparePartTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + transactionId));

        UserPart userPart = userPartRepository.findBySparePart_SparePartId(transaction.getSparePartId())
                .orElseThrow(() -> new RuntimeException("No stock entry found for Spare Part ID: " + transaction.getSparePartId()));

        if (transaction.getTransactionType() == TransactionType.CREDIT) {
            if (userPart.getQuantity() < transaction.getQuantity()) {
                throw new RuntimeException("Cannot delete CREDIT transaction: Not enough stock to reverse.");
            }
            userPart.setQuantity(userPart.getQuantity() - transaction.getQuantity());
        } else if (transaction.getTransactionType() == TransactionType.DEBIT) {
            userPart.setQuantity(userPart.getQuantity() + transaction.getQuantity());
        }
        userPartRepository.save(userPart);

        transactionRepository.deleteById(transactionId);
    }

    @Override
    public List<SparePartTransactionDto> getByBillNo(String billNo) {
        List<SparePartTransaction> transactions = transactionRepository.findByBillNo(billNo);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found with Bill No: " + billNo);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getByUserId(Integer userId) {
        List<SparePartTransaction> transactions = transactionRepository.findByUserId(userId);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for User ID: " + userId);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getByVehicleRegId(Integer vehicleRegId) throws RuntimeException {
        if (vehicleRegId == null) {
            throw new IllegalArgumentException("Vehicle Registration ID cannot be null.");
        }

        VehicleReg vehicleReg = vehicleRegRepository
                .findById(vehicleRegId)
                .orElseThrow(() -> new IllegalArgumentException("No user found for Vehicle Registration ID: " + vehicleRegId));
        Integer userId = vehicleReg.getUserId();
        List<SparePartTransaction> transactions = transactionRepository.findByVehicleRegId(vehicleRegId);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for Vehicle Registration ID: " + vehicleRegId);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getTransactionsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new RuntimeException("Start date and end date cannot be null.");
        }
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date cannot be before start date.");
        }

        List<SparePartTransaction> transactions = transactionRepository.findByTransactionDateBetween(startDate, endDate);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found between " + startDate + " and " + endDate);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getByPartNumberAndTransactionsBetweenDates(Integer sparePartId, LocalDateTime startDate, LocalDateTime endDate) {

        if (sparePartId == null) {
            throw new IllegalArgumentException("Spare Part ID cannot be null.");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        SparePart sparePart = sparePartRepository.findById(sparePartId)
                .orElseThrow(() -> new RuntimeException("Spare part not found with ID: " + sparePartId));

        List<SparePartTransaction> transactions = transactionRepository.findBySparePartIdAndTransactionDateBetween(
                sparePartId, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for Spare Part ID: " + sparePartId +
                    " between " + startDate + " and " + endDate);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getByTransactionTypeAndNameAndDateRange(TransactionType transactionType, String name, LocalDateTime startDate, LocalDateTime endDate) {
        if (transactionType == null || name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Transaction type and name cannot be null or empty.");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        List<SparePartTransaction> transactions = transactionRepository.findByTransactionTypeAndNameAndTransactionDateBetween(
                transactionType, name, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for type: " + transactionType +
                    ", name: " + name + ", between " + startDate + " and " + endDate);
        }

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SparePartTransactionDto> getByNameOrPartNumber(String name, String partNumber) {
        if ((name == null || name.trim().isEmpty()) && (partNumber == null || partNumber.trim().isEmpty())) {
            throw new IllegalArgumentException("Either name or part number must be provided.");
        }

        List<SparePartTransaction> transactions;

        if (name != null && !name.trim().isEmpty() && partNumber != null && !partNumber.trim().isEmpty()) {
            transactions = transactionRepository.findByNameOrPartNumber(name, partNumber);
        } else if (name != null && !name.trim().isEmpty()) {
            transactions = transactionRepository.findByName(name);
        } else {
            transactions = transactionRepository.findByPartNumber(partNumber);
        }

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for given filters.");
        }
        return transactions.stream().map(this::toDto).collect(Collectors.toList());
    }



    @Override
    public List<SparePartTransactionDto> getCreditTransactionsByDateRange(
            TransactionType transactionType, LocalDateTime startDate, LocalDateTime endDate) {
        if (transactionType == null) {
            throw new IllegalArgumentException("Transaction type cannot be null.");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        System.out.println("Filtering " + transactionType + " transactions between " + startDate + " and " + endDate);

        List<SparePartTransaction> transactions = transactionRepository.findByTransactionTypeAndTransactionDateBetween(
                transactionType, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new RuntimeException("No transactions found for type: " + transactionType +
                    ", between " + startDate + " and " + endDate);
        }

        return transactions.stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Preload all necessary data for batch processing
     * This method efficiently loads all required data in a single database query per entity type
     */
    @Override
    public Map<String, Object> preloadDataForBatch(List<CreateSparePartTransactionDto> transactions) {
        long startTime = System.currentTimeMillis();
        System.out.println("Starting preloadDataForBatch for " + transactions.size() + " transactions");

        Map<String, Object> result = new HashMap<>();
        Map<String, Map<String, Object>> spareParts = new HashMap<>();
        Map<String, Map<String, Object>> userParts = new HashMap<>();

        // Extract unique part numbers and manufacturers for efficient fetching
        Set<String> partNumbers = new HashSet<>();
        Set<String> manufacturers = new HashSet<>();

        for (CreateSparePartTransactionDto dto : transactions) {
            partNumbers.add(dto.getPartNumber());
            manufacturers.add(dto.getManufacturer());
        }

        System.out.println("Unique part numbers: " + partNumbers.size());
        System.out.println("Unique manufacturers: " + manufacturers.size());

        // Optimize by generating a list of part number + manufacturer tuples for efficient IN clause
        List<String> partTuples = new ArrayList<>();
        for (String partNumber : partNumbers) {
            for (String manufacturer : manufacturers) {
                partTuples.add("('" + partNumber.replace("'", "''") + "','" + manufacturer.replace("'", "''") + "')");
            }
        }

        int totalTuples = partTuples.size();
        System.out.println("Total part-manufacturer combinations: " + totalTuples);

        // Use direct JDBC for maximum performance
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            // Apply performance optimizations for the connection
            try {
                connection.setAutoCommit(false);
                // Set optimal fetch size for large result sets
                try (PreparedStatement stmt = connection.prepareStatement("SELECT 1")) {
                    stmt.setFetchSize(500);
                }
            } catch (Exception e) {
                System.out.println("Could not apply connection optimizations: " + e.getMessage());
            }

            // Split the tuples into chunks to avoid exceeding database limits
            int MAX_TUPLES_PER_QUERY = 1000;
            int numChunks = (totalTuples + MAX_TUPLES_PER_QUERY - 1) / MAX_TUPLES_PER_QUERY;

            // Load all spare parts with chunked tuple-based queries
            for (int chunk = 0; chunk < numChunks; chunk++) {
                int startIdx = chunk * MAX_TUPLES_PER_QUERY;
                int endIdx = Math.min(startIdx + MAX_TUPLES_PER_QUERY, totalTuples);

                if (startIdx >= totalTuples) break;

                // Build optimized tuple-based query
                String tupleValues = String.join(",", partTuples.subList(startIdx, endIdx));
                String spQuery =
                        "SELECT sp.spare_part_id, sp.part_number, sp.part_name, sp.manufacturer, " +
                                "sp.price, sp.cgst, sp.sgst " +
                                "FROM spare_part sp " +
                                "WHERE (sp.part_number, sp.manufacturer) IN (" + tupleValues + ")";

                try (PreparedStatement ps = connection.prepareStatement(spQuery)) {
                    long queryStart = System.currentTimeMillis();
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String partNumber = rs.getString("part_number");
                            String manufacturer = rs.getString("manufacturer");
                            String key = partNumber + ":" + manufacturer;

                            Map<String, Object> row = new HashMap<>();
                            row.put("spare_part_id", rs.getInt("spare_part_id"));
                            row.put("part_number", partNumber);
                            row.put("part_name", rs.getString("part_name"));
                            row.put("manufacturer", manufacturer);
                            row.put("price", rs.getLong("price"));
                            row.put("cgst", rs.getInt("cgst"));
                            row.put("sgst", rs.getInt("sgst"));

                            spareParts.put(key, row);
                        }
                    }
                    long queryEnd = System.currentTimeMillis();
                    System.out.println("Spare parts chunk " + (chunk+1) + "/" + numChunks +
                            " query time: " + (queryEnd - queryStart) + "ms, found " +
                            spareParts.size() + " parts");
                }
            }

            // Now load user parts with the same approach
            for (int chunk = 0; chunk < numChunks; chunk++) {
                int startIdx = chunk * MAX_TUPLES_PER_QUERY;
                int endIdx = Math.min(startIdx + MAX_TUPLES_PER_QUERY, totalTuples);

                if (startIdx >= totalTuples) break;

                String tupleValues = String.join(",", partTuples.subList(startIdx, endIdx));
                String upQuery =
                        "SELECT up.user_part_id, up.part_number, up.manufacturer, up.quantity " +
                                "FROM user_part up " +
                                "WHERE (up.part_number, up.manufacturer) IN (" + tupleValues + ")";

                try (PreparedStatement ps = connection.prepareStatement(upQuery)) {
                    long queryStart = System.currentTimeMillis();
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String partNumber = rs.getString("part_number");
                            String manufacturer = rs.getString("manufacturer");
                            String key = partNumber + ":" + manufacturer;

                            Map<String, Object> row = new HashMap<>();
                            row.put("user_part_id", rs.getInt("user_part_id"));
                            row.put("part_number", partNumber);
                            row.put("manufacturer", manufacturer);
                            row.put("quantity", rs.getInt("quantity"));

                            userParts.put(key, row);
                        }
                    }
                    long queryEnd = System.currentTimeMillis();
                    System.out.println("User parts chunk " + (chunk+1) + "/" + numChunks +
                            " query time: " + (queryEnd - queryStart) + "ms, found " +
                            userParts.size() + " entries");
                }
            }

            // Create missing user parts for items that don't have entries yet
            List<Map<String, Object>> newUserParts = new ArrayList<>();

            for (Map.Entry<String, Map<String, Object>> entry : spareParts.entrySet()) {
                if (!userParts.containsKey(entry.getKey())) {
                    Map<String, Object> sparePartData = entry.getValue();
                    String partNumber = (String) sparePartData.get("part_number");
                    String manufacturer = (String) sparePartData.get("manufacturer");

                    Map<String, Object> newPart = new HashMap<>();
                    newPart.put("part_number", partNumber);
                    newPart.put("manufacturer", manufacturer);
                    newUserParts.add(newPart);
                }
            }

            // Batch insert any missing user_part records
            if (!newUserParts.isEmpty()) {
                String insertSql = "INSERT INTO user_part (part_number, manufacturer, quantity) VALUES (?, ?, 0)";

                try (PreparedStatement ps = connection.prepareStatement(insertSql, new String[]{"user_part_id"})) {
                    for (Map<String, Object> newPart : newUserParts) {
                        ps.setString(1, (String) newPart.get("part_number"));
                        ps.setString(2, (String) newPart.get("manufacturer"));
                        ps.addBatch();
                    }

                    long insertStart = System.currentTimeMillis();
                    ps.executeBatch();
                    connection.commit();
                    long insertEnd = System.currentTimeMillis();

                    System.out.println("Inserted " + newUserParts.size() + " new user_part records in " +
                            (insertEnd - insertStart) + "ms");

                    // Now fetch the newly created records to get their IDs
                    for (Map<String, Object> newPart : newUserParts) {
                        String partNumber = (String) newPart.get("part_number");
                        String manufacturer = (String) newPart.get("manufacturer");
                        String key = partNumber + ":" + manufacturer;

                        String selectSql = "SELECT user_part_id FROM user_part WHERE part_number = ? AND manufacturer = ?";
                        try (PreparedStatement selectPs = connection.prepareStatement(selectSql)) {
                            selectPs.setString(1, partNumber);
                            selectPs.setString(2, manufacturer);

                            try (ResultSet rs = selectPs.executeQuery()) {
                                if (rs.next()) {
                                    Map<String, Object> row = new HashMap<>();
                                    row.put("user_part_id", rs.getInt("user_part_id"));
                                    row.put("part_number", partNumber);
                                    row.put("manufacturer", manufacturer);
                                    row.put("quantity", 0);

                                    userParts.put(key, row);
                                }
                            }
                        }
                    }
                }
            }

            // Commit all operations
            connection.commit();
        } catch (SQLException e) {
            System.err.println("Error in optimized preloading: " + e.getMessage());
            e.printStackTrace();

            // Fall back to the original implementation if the optimized version fails
            return fallbackPreloadDataForBatch(transactions);
        }

        // Store all preloaded data
        result.put("spareParts", spareParts);
        result.put("userParts", userParts);
        result.put("vehicleRegs", new HashMap<>()); // Not used in the optimized version

        long endTime = System.currentTimeMillis();
        System.out.println("Completed optimized preloadDataForBatch in " + (endTime - startTime) + "ms");

        return result;
    }

    /**
     * Fallback implementation for preloading data if the optimized version fails
     */
    private Map<String, Object> fallbackPreloadDataForBatch(List<CreateSparePartTransactionDto> transactions) {
        System.out.println("Using fallback preloadDataForBatch method");

        Map<String, Object> result = new HashMap<>();
        Map<String, Map<String, Object>> spareParts = new HashMap<>();
        Map<String, Map<String, Object>> userParts = new HashMap<>();
        Map<Integer, Map<String, Object>> vehicleRegs = new HashMap<>();

        // Extract unique part numbers and manufacturers
        Set<String> partNumbers = new HashSet<>();
        Set<String> manufacturers = new HashSet<>();
        Set<Integer> vehicleRegIds = new HashSet<>();

        for (CreateSparePartTransactionDto dto : transactions) {
            partNumbers.add(dto.getPartNumber());
            manufacturers.add(dto.getManufacturer());

            if (dto.getVehicleRegId() != null) {
                vehicleRegIds.add(dto.getVehicleRegId());
            }
        }

        // Use chunking for large IN clauses to avoid SQL limitations
        int chunkSize = 500; // Most databases handle 1000 items in IN clause, use 500 to be safe

        // Process part numbers in chunks if needed
        List<List<String>> partNumberChunks = partNumbers.size() > chunkSize ?
                chunks(new ArrayList<>(partNumbers), chunkSize) :
                Collections.singletonList(new ArrayList<>(partNumbers));

        for (List<String> partNumberChunk : partNumberChunks) {
            // Load all spare parts with a single SQL query for this chunk
            String sparePartQuery = "SELECT sp.spare_part_id, sp.part_number, sp.part_name, sp.manufacturer, " +
                    "sp.price, sp.cgst, sp.sgst " +
                    "FROM spare_part sp " +
                    "WHERE sp.part_number IN (" + formatForInClause(partNumberChunk) + ")";

            List<Map<String, Object>> sparePartRows = jdbcTemplate.queryForList(sparePartQuery);

            for (Map<String, Object> row : sparePartRows) {
                String key = row.get("part_number") + ":" + row.get("manufacturer");
                spareParts.put(key, row);
            }

            // Load all user parts with a single SQL query for this chunk
            String userPartQuery = "SELECT up.user_part_id, up.part_number, up.manufacturer, up.quantity " +
                    "FROM user_part up " +
                    "WHERE up.part_number IN (" + formatForInClause(partNumberChunk) + ")";

            List<Map<String, Object>> userPartRows = jdbcTemplate.queryForList(userPartQuery);

            for (Map<String, Object> row : userPartRows) {
                String key = row.get("part_number") + ":" + row.get("manufacturer");
                userParts.put(key, row);
            }
        }

        // Load vehicle registrations if needed
        if (!vehicleRegIds.isEmpty()) {
            // Process vehicle reg IDs in chunks if needed
            List<List<Integer>> vehicleRegChunks = vehicleRegIds.size() > chunkSize ?
                    chunks(new ArrayList<>(vehicleRegIds), chunkSize) :
                    Collections.singletonList(new ArrayList<>(vehicleRegIds));

            for (List<Integer> vehicleRegChunk : vehicleRegChunks) {
                String vehicleRegQuery = "SELECT vr.vehicle_reg_id, vr.user_id " +
                        "FROM vehicle_reg vr " +
                        "WHERE vr.vehicle_reg_id IN (" + formatForInClause(vehicleRegChunk) + ")";

                List<Map<String, Object>> vehicleRegRows = jdbcTemplate.queryForList(vehicleRegQuery);

                for (Map<String, Object> row : vehicleRegRows) {
                    Integer id = ((Number) row.get("vehicle_reg_id")).intValue();
                    vehicleRegs.put(id, row);
                }
            }
        }

        // Store all preloaded data
        result.put("spareParts", spareParts);
        result.put("userParts", userParts);
        result.put("vehicleRegs", vehicleRegs);

        return result;
    }

    /**
     * Split a list into chunks of specified size
     */
    private <T> List<List<T>> chunks(List<T> list, int chunkSize) {
        List<List<T>> chunks = new ArrayList<>();
        for (int i = 0; i < list.size(); i += chunkSize) {
            chunks.add(list.subList(i, Math.min(i + chunkSize, list.size())));
        }
        return chunks;
    }

    /**
     * Format a collection of values for use in SQL IN clause
     */
    private String formatForInClause(Collection<?> values) {
        if (values == null || values.isEmpty()) {
            return "''";
        }

        StringBuilder sb = new StringBuilder();
        boolean first = true;

        for (Object value : values) {
            if (!first) {
                sb.append(",");
            }

            if (value instanceof String) {
                sb.append("'").append(((String) value).replace("'", "''")).append("'");
            } else {
                sb.append(value);
            }

            first = false;
        }

        return sb.toString();
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

}
