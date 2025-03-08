
import React from "react";
import { Link } from "react-router-dom";
import TransactionAdd from "./TransactionAdd";

const TransactionNav: React.FC = () => {
  return (
    <nav style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
      <Link to="/transaction/add">Add Transaction</Link>
      <Link to="/transaction/all">View All Transactions</Link>
      <Link to="/transaction/by-id">View by ID</Link>
      <Link to="/transaction/by-bill">By Bill No</Link>
      <Link to="/transaction/by-user">By User ID</Link>
      <Link to="/transaction/by-vehicle">By Vehicle Reg ID</Link>
      <Link to="/transaction/between-dates">Between Dates</Link>
      <Link to="/transaction/update">Update Transaction</Link>
    </nav>
  );
};

export default TransactionNav;
