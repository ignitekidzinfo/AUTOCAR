import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import apiClient from "Services/apiService";// adjust the import path as necessary

// Define TypeScript interfaces based on your backend DTOs
interface Transaction {
  sparePartTransactionId: number;
  partNumber: string;
  sparePartId: number;
  partName: string;
  manufacturer: string;
  price: number;
  qtyPrice: number;
  updateAt: string;
  transactionType: "CREDIT" | "DEBIT";
  quantity: number;
  transactionDate: string;
  userId: number;
  billNo: string;
}

interface CreateTransaction {
  transactionType: "CREDIT" | "DEBIT";
  userId?: number;
  vehicleRegId?: number;
  partNumber: string;
  quantity: number;
  billNo?: string;
}

const Transaction: React.FC = () => {
  // Create form state
  const [createData, setCreateData] = useState<CreateTransaction>({
    transactionType: "CREDIT",
    userId: undefined,
    vehicleRegId: undefined,
    partNumber: "",
    quantity: 1,
    billNo: ""
  });

  // States for listing and search results
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [transactionById, setTransactionById] = useState<Transaction | null>(null);
  const [searchId, setSearchId] = useState<string>("");
  const [billNo, setBillNo] = useState<string>("");
  const [transactionsByBillNo, setTransactionsByBillNo] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [transactionsByUserId, setTransactionsByUserId] = useState<Transaction[]>([]);
  const [vehicleRegId, setVehicleRegId] = useState<string>("");
  const [transactionsByVehicleRegId, setTransactionsByVehicleRegId] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [transactionsBetweenDates, setTransactionsBetweenDates] = useState<Transaction[]>([]);

  // Update form state
  const [updateId, setUpdateId] = useState<string>("");
  const [updateData, setUpdateData] = useState<Partial<Transaction>>({
    partNumber: "",
    transactionType: "CREDIT",
    quantity: 0,
    userId: 0,
    billNo: ""
  });

  // Delete transaction state
  const [deleteId, setDeleteId] = useState<string>("");

  // Handlers for the create form
  const handleCreateChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ? Number(value) : value
    }));
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/sparePartTransactions/add", createData);
      alert(response.data.message || "Transaction created successfully");
      fetchAllTransactions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create transaction");
    }
  };

  // Fetch all transactions
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

  // Get transaction by ID
  const handleGetById = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/GetById", { params: { transactionId: searchId } });
      setTransactionById(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transaction by ID");
    }
  };

  // Get transactions by Bill Number
  const handleGetByBillNo = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/getByBillNo", { params: { billNo } });
      setTransactionsByBillNo(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions by Bill No");
    }
  };

  // Get transactions by User ID
  const handleGetByUserId = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/userId", { params: { userId } });
      setTransactionsByUserId(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions by User ID");
    }
  };

  // Get transactions by Vehicle Registration ID
  const handleGetByVehicleRegId = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/vehicleRegId", { params: { vehicleRegId } });
      setTransactionsByVehicleRegId(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions by Vehicle Reg ID");
    }
  };

  // Get transactions between dates
  const handleGetBetweenDates = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.get("/sparePartTransactions/between-dates", {
        params: { startDate, endDate }
      });
      setTransactionsBetweenDates(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to fetch transactions between dates");
    }
  };

  // Handlers for update form
  const handleUpdateChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "userId" || name === "sparePartId" ? Number(value) : value
    }));
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put("/sparePartTransactions/update", updateData, {
        params: { transactionId: updateId }
      });
      alert(response.data.message || "Transaction updated successfully");
      fetchAllTransactions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update transaction");
    }
  };

  // Handler for delete
  const handleDeleteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.delete("/sparePartTransactions/delete", {
        params: { transactionId: deleteId }
      });
      alert(response.data.message || "Transaction deleted successfully");
      fetchAllTransactions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete transaction");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Spare Part Transactions</h1>

      {/* Create Transaction Form */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Create Transaction</h2>
        <form onSubmit={handleCreateSubmit}>
          <div>
            <label>Transaction Type:</label>
            <select name="transactionType" value={createData.transactionType} onChange={handleCreateChange}>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </div>
          <div>
            <label>User ID:</label>
            <input
              type="number"
              name="userId"
              value={createData.userId || ""}
              onChange={handleCreateChange}
              placeholder="Enter User ID"
            />
          </div>
          {createData.transactionType === "DEBIT" && (
            <div>
              <label>Vehicle Reg ID:</label>
              <input
                type="number"
                name="vehicleRegId"
                value={createData.vehicleRegId || ""}
                onChange={handleCreateChange}
                placeholder="Enter Vehicle Reg ID"
              />
            </div>
          )}
          <div>
            <label>Part Number:</label>
            <input
              type="text"
              name="partNumber"
              value={createData.partNumber}
              onChange={handleCreateChange}
              placeholder="Enter Part Number"
            />
          </div>
          <div>
            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={createData.quantity}
              onChange={handleCreateChange}
              min="1"
            />
          </div>
          {createData.transactionType === "CREDIT" && (
            <div>
              <label>Bill Number:</label>
              <input
                type="text"
                name="billNo"
                value={createData.billNo}
                onChange={handleCreateChange}
                placeholder="Enter Bill Number"
              />
            </div>
          )}
          <button type="submit">Create Transaction</button>
        </form>
      </section>

      {/* List All Transactions */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>All Transactions</h2>
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
      </section>

      {/* Get Transaction By ID */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Get Transaction By ID</h2>
        <form onSubmit={handleGetById}>
          <input
            type="number"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Transaction ID"
          />
          <button type="submit">Fetch Transaction</button>
        </form>
        {transactionById && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Transaction Details:</h3>
            <pre>{JSON.stringify(transactionById, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Get Transactions By Bill No */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Get Transactions By Bill No</h2>
        <form onSubmit={handleGetByBillNo}>
          <input
            type="text"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            placeholder="Enter Bill Number"
          />
          <button type="submit">Fetch Transactions</button>
        </form>
        {transactionsByBillNo.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Transactions:</h3>
            <pre>{JSON.stringify(transactionsByBillNo, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Get Transactions By User ID */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Get Transactions By User ID</h2>
        <form onSubmit={handleGetByUserId}>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
          />
          <button type="submit">Fetch Transactions</button>
        </form>
        {transactionsByUserId.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Transactions:</h3>
            <pre>{JSON.stringify(transactionsByUserId, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Get Transactions By Vehicle Reg ID */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Get Transactions By Vehicle Reg ID</h2>
        <form onSubmit={handleGetByVehicleRegId}>
          <input
            type="number"
            value={vehicleRegId}
            onChange={(e) => setVehicleRegId(e.target.value)}
            placeholder="Enter Vehicle Reg ID"
          />
          <button type="submit">Fetch Transactions</button>
        </form>
        {transactionsByVehicleRegId.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Transactions:</h3>
            <pre>{JSON.stringify(transactionsByVehicleRegId, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Get Transactions Between Dates */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Get Transactions Between Dates</h2>
        <form onSubmit={handleGetBetweenDates}>
          <div>
            <label>Start Date:</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>End Date:</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button type="submit">Fetch Transactions</button>
        </form>
        {transactionsBetweenDates.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Transactions:</h3>
            <pre>{JSON.stringify(transactionsBetweenDates, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Update Transaction */}
      <section style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
        <h2>Update Transaction</h2>
        <form onSubmit={handleUpdateSubmit}>
          <div>
            <label>Transaction ID to Update:</label>
            <input
              type="number"
              value={updateId}
              onChange={(e) => setUpdateId(e.target.value)}
              placeholder="Enter Transaction ID"
            />
          </div>
          <div>
            <label>Part Number:</label>
            <input
              type="text"
              name="partNumber"
              value={updateData.partNumber || ""}
              onChange={handleUpdateChange}
              placeholder="Enter Part Number"
            />
          </div>
          <div>
            <label>Transaction Type:</label>
            <select name="transactionType" value={updateData.transactionType} onChange={handleUpdateChange}>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </div>
          <div>
            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={updateData.quantity || ""}
              onChange={handleUpdateChange}
              min="1"
            />
          </div>
          <div>
            <label>User ID:</label>
            <input
              type="number"
              name="userId"
              value={updateData.userId || ""}
              onChange={handleUpdateChange}
              placeholder="Enter User ID"
            />
          </div>
          <div>
            <label>Bill Number:</label>
            <input
              type="text"
              name="billNo"
              value={updateData.billNo || ""}
              onChange={handleUpdateChange}
              placeholder="Enter Bill Number"
            />
          </div>
          <button type="submit">Update Transaction</button>
        </form>
      </section>

      {/* Delete Transaction */}
      <section style={{ border: "1px solid #ccc", padding: "1rem" }}>
        <h2>Delete Transaction</h2>
        <form onSubmit={handleDeleteSubmit}>
          <input
            type="number"
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            placeholder="Enter Transaction ID to delete"
          />
          <button type="submit">Delete Transaction</button>
        </form>
      </section>
    </div>
  );
};

export default Transaction;
