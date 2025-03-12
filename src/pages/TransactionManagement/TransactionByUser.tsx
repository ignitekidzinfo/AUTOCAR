// TransactionByUser.tsx
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

const TransactionByUser: React.FC = () => {
  const [userId, setUserId] = useState<string>("");
  const [transactionsByUserId, setTransactionsByUserId] = useState<Transaction[]>([]);

  const handleGetByUserId = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/userId", { params: { userId } });
      setTransactionsByUserId(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions by User ID");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Get Transactions by User ID</h1>
      <form onSubmit={handleGetByUserId}>
        <input type="number" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter User ID" />
        <button type="submit">Fetch Transactions</button>
      </form>
      {transactionsByUserId.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Transactions:</h3>
          <pre>{JSON.stringify(transactionsByUserId, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TransactionByUser;
