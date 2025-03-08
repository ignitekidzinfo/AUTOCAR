// TransactionAll.tsx
import React, { useState, useEffect } from "react";
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

const TransactionAll: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const fetchAllTransactions = async () => {
    try {
      const response = await apiClient.get("/sparePartTransactions/getAll");
      setAllTransactions(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions");
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>All Transactions</h1>
      <button onClick={fetchAllTransactions}>Refresh List</button>
      <table border={1} cellPadding={5} cellSpacing={0} style={{ width: "100%", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Part Number</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>User ID</th>
            <th>Bill No</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {allTransactions.map((txn) => (
            <tr key={txn.sparePartTransactionId}>
              <td>{txn.sparePartTransactionId}</td>
              <td>{txn.partNumber}</td>
              <td>{txn.transactionType}</td>
              <td>{txn.quantity}</td>
              <td>{txn.userId}</td>
              <td>{txn.billNo}</td>
              <td>{txn.transactionDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionAll;
