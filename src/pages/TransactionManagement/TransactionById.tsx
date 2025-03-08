// TransactionById.tsx
import React, { useState, FormEvent } from "react";
import apiClient from "Services/apiService";

interface Transaction {
  sparePartTransactionId: number;
  partNumber: string;
  transactionType: "CREDIT" | "DEBIT";
  quantity: number;
  userId: number;
  billNo: string;
  transactionDate: string;
}

const TransactionById: React.FC = () => {
  const [searchId, setSearchId] = useState<string>("");
  const [transactionById, setTransactionById] = useState<Transaction | null>(null);

  const handleGetById = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/GetById", { params: { transactionId: searchId } });
      setTransactionById(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transaction by ID");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>View Transaction by ID</h1>
      <form onSubmit={handleGetById}>
        <input type="number" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Enter Transaction ID" />
        <button type="submit">Fetch Transaction</button>
      </form>
      {transactionById && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Transaction Details:</h3>
          <pre>{JSON.stringify(transactionById, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TransactionById;
