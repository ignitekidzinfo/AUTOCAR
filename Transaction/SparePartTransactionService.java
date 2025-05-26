package com.spring.jwt.SparePartTransaction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface SparePartTransactionService {

    SparePartTransactionDto createTransaction(CreateSparePartTransactionDto transactionDto);

    /**
     * Process multiple transactions efficiently in a batch
     * @param transactionDtos List of transaction DTOs to process
     * @return List of created transaction DTOs
     */
    List<SparePartTransactionDto> createBatchTransactions(List<CreateSparePartTransactionDto> transactionDtos);
    
    /**
     * Preload all necessary data for batch processing
     * @param transactions List of transaction DTOs to process
     * @return Map containing preloaded data (spare parts, user parts, etc.)
     */
    Map<String, Object> preloadDataForBatch(List<CreateSparePartTransactionDto> transactions);

    SparePartTransactionDto getTransactionById(Integer transactionId);

    List<SparePartTransactionDto> getAllTransactions();

    SparePartTransactionDto updateTransaction(Integer transactionId, SparePartTransactionDto transactionDto);

    void deleteTransaction(Integer transactionId);

    List<SparePartTransactionDto> getByBillNo(String billNo);

    List<SparePartTransactionDto> getByUserId (Integer userId);

    public List<SparePartTransactionDto> getByVehicleRegId(Integer vehicleRegId);

    List<SparePartTransactionDto> getTransactionsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    List<SparePartTransactionDto> getByPartNumberAndTransactionsBetweenDates(Integer sparePartId, LocalDateTime startDate, LocalDateTime endDate);


    List<SparePartTransactionDto> getByTransactionTypeAndNameAndDateRange(TransactionType transactionType, String name, LocalDateTime startDate, LocalDateTime endDate);

    List<SparePartTransactionDto> getByNameOrPartNumber(String name, String partNumber);

    public List<SparePartTransactionDto> getCreditTransactionsByDateRange ( TransactionType transactionType, LocalDateTime startDate, LocalDateTime endDate);

   }
