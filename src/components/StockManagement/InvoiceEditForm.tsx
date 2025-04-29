import React, { FC, useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  FormControl,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField
} from "@mui/material";
import { AiOutlineCalendar, AiOutlineUser, AiOutlinePhone } from "react-icons/ai";
import { MdLocationOn, MdOutlineDirectionsCar } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import apiClient from "Services/apiService";

const AiOutlineCalendarIcon = AiOutlineCalendar as FC<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
const AiOutlineUserIcon = AiOutlineUser as FC<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
const AiOutlinePhoneIcon = AiOutlinePhone as FC<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
const MdLocationOnIcon = MdLocationOn as FC<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
const MdOutlineDirectionsCarIcon = MdOutlineDirectionsCar as FC<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;

interface BillRow {
  id: number;
  sNo: number;
  spareNo: string;
  spareName: string;
  manufacturer: string;
  quantity: string; 
  rate: string; 
  discountPercent: string; 
  discountAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  taxable: number;
  total: number;
  amount: number;
  checked?: boolean;
}

interface SpareRow {
  spareName: string;
  spareNo?: string;
  manufacturer?: string;
  rate: string;
  qty: string;
  discountPercent: string;
  discountAmt: number;
  taxableValue: number;
  total: number;
  cgstPercent?: number;
  sgstPercent?: number;
}

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  adharNo: string;
  gstin: string;
  vehicleNo: string;
  totalAmount: number;
  items: BillRow[];
}

function computeSpareRowTotals(row: SpareRow): SpareRow {
  const rate = row.rate ? Number(row.rate) : 0;
  const qty = row.qty ? Number(row.qty) : 0;
  const discountPercent = row.discountPercent ? Number(row.discountPercent) : 0;
  const lineAmount = rate * qty;
  const discountAmt = (lineAmount * discountPercent) / 100;
  const newTaxable = lineAmount - discountAmt;
  return {
    ...row,
    rate: row.rate || "0",
    qty: row.qty || "0",
    discountPercent: row.discountPercent || "0",
    discountAmt,
    taxableValue: newTaxable,
    total: newTaxable,
  };
}

function computeBillRow(row: BillRow): BillRow {
  const rate = row.rate ? Number(row.rate) : 0;
  const quantity = row.quantity ? Number(row.quantity) : 0;
  const discountPercent = row.discountPercent ? Number(row.discountPercent) : 0;
  const baseAmount = rate * quantity;
  const discountAmt = (baseAmount * discountPercent) / 100;
  const taxable = baseAmount - discountAmt;
  const cgstAmt = (taxable * (row.cgstPercent ?? 0)) / 100;
  const sgstAmt = (taxable * (row.sgstPercent ?? 0)) / 100;
  const total = taxable;
  const amount = total;
  return {
    ...row,
    rate: row.rate || "0",
    quantity: row.quantity || "0",
    discountPercent: row.discountPercent || "0",
    discountAmt,
    cgstAmt,
    sgstAmt,
    taxable,
    total,
    amount,
  };
}

const handleSpareRowChange = (
  key: keyof SpareRow,
  value: string,
  currentRow: SpareRow,
  setRow: (row: SpareRow) => void
) => {
  const updatedRow = { ...currentRow, [key]: value };
  setRow(computeSpareRowTotals(updatedRow));
};

const InvoiceEditForm: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const invoiceData = (location.state as InvoiceData) || null;
  const [invDate, setInvDate] = useState(invoiceData?.invDate || "");
  const [customerName, setCustomerName] = useState(invoiceData?.customerName || "");
  const [customerAddress, setCustomerAddress] = useState(invoiceData?.customerAddress || "");
  const [customerMobile, setCustomerMobile] = useState(invoiceData?.customerMobile || "");
  const [adharNo, setAdharNo] = useState(invoiceData?.adharNo || "");
  const [gstin, setGstin] = useState(invoiceData?.gstin || "");
  const [vehicleNo, setVehicleNo] = useState(invoiceData?.vehicleNo || "");
  const [billRows, setBillRows] = useState<BillRow[]>(invoiceData?.items || []);
  const [spareRow, setSpareRow] = useState<SpareRow>({
    spareName: "",
    spareNo: "",
    manufacturer: "",
    rate: "",
    qty: "",
    discountPercent: "",
    discountAmt: 0,
    taxableValue: 0,
    total: 0,
    cgstPercent: 0,
    sgstPercent: 0,
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem",
    borderRadius: "4px",
    border: isDark ? "1px solid #555" : "1px solid #ccc",
    width: "100%",
    backgroundColor: isDark ? "#424242" : "#fff",
    color: isDark ? "#fff" : "#000",
  };

  const sectionStyle: React.CSSProperties = {
    width: "48%",
    border: isDark ? "1px solid #555" : "1px solid #ccc",
    padding: "1rem",
    borderRadius: "6px",
    backgroundColor: isDark ? "#333" : "#fff",
  };

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: isDark ? "#555" : "#f5f5f5",
    color: isDark ? "#fff" : "#000",
    textAlign: "left",
  };

  const tableCellStyle: React.CSSProperties = {
    border: isDark ? "1px solid #555" : "1px solid #ccc",
    padding: "0.5rem",
    textAlign: "center",
    verticalAlign: "middle",
    backgroundColor: isDark ? "#424242" : "#fff",
    color: isDark ? "#fff" : "#000",
  };

  const containerStyle: React.CSSProperties = {
    width: "90%",
    margin: "auto",
    marginTop: "2rem",
    fontFamily: "Arial, sans-serif",
    backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
    color: isDark ? "#fff" : "#000",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
  };

  const sectionHeader: React.CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const fieldGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1rem",
  };

  const labelStyle: React.CSSProperties = {
    marginBottom: "0.25rem",
    fontWeight: "bold",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const removeBtnStyle: React.CSSProperties = {
    backgroundColor: "red",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const fetchPartDetails = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await apiClient.get(`/Filter/searchBarFilter?searchBarInput=${searchQuery}`);
      setSuggestions(response.data.list || []);
    } catch (error) {
      console.error("Error fetching part details:", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPartDetails(spareRow.spareName);
    }, 500);
    return () => clearTimeout(timer);
  }, [spareRow.spareName, fetchPartDetails]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionSelect = (item: any) => {
    const updatedSpareRow: SpareRow = computeSpareRowTotals({
      spareName: item.partName,
      spareNo: item.partNumber,
      manufacturer: item.manufacturer,
      rate: item.price.toString(),
      qty: "1",
      discountPercent: spareRow.discountPercent,
      discountAmt: 0,
      taxableValue: 0,
      total: 0,
      cgstPercent: item.cgst,
      sgstPercent: item.sgst,
    });
    setSpareRow(updatedSpareRow);
    setSuggestions([]);
    const newBillRow: BillRow = computeBillRow({
      id: Date.now(),
      sNo: billRows.length + 1,
      spareNo: updatedSpareRow.spareNo || "",
      spareName: updatedSpareRow.spareName,
      manufacturer: updatedSpareRow.manufacturer || "",
      quantity: updatedSpareRow.qty,
      rate: updatedSpareRow.rate,
      discountPercent: updatedSpareRow.discountPercent,
      discountAmt: 0,
      cgstPercent: updatedSpareRow.cgstPercent || 0,
      cgstAmt: 0,
      sgstPercent: updatedSpareRow.sgstPercent || 0,
      sgstAmt: 0,
      taxable: 0,
      total: 0,
      amount: 0,
      checked: false,
    });
    setBillRows((prev) => [...prev, newBillRow]);
    setSpareRow({
      spareName: "",
      spareNo: "",
      manufacturer: "",
      rate: "",
      qty: "",
      discountPercent: "",
      discountAmt: 0,
      taxableValue: 0,
      total: 0,
      cgstPercent: 0,
      sgstPercent: 0,
    });
  };

  useEffect(() => {
    setBillRows((prevRows) =>
      prevRows.map((row) =>
        computeBillRow({ ...row, discountPercent: spareRow.discountPercent })
      )
    );
  }, [spareRow.discountPercent]);

  const updateBillRow = (rowId: number, updatedFields: Partial<BillRow>) => {
    setBillRows((prevRows) =>
      prevRows.map((r) => {
        if (r.id === rowId) {
          const merged = { ...r, ...updatedFields };
          return computeBillRow(merged);
        }
        return r;
      })
    );
  };

  const handleRemove = () => {
    setBillRows((prev) => prev.filter((r) => !r.checked));
  };

  const handleSave = async () => {
    if (!customerName) {
      alert("Customer Name is required");
      return;
    }
    if (!adharNo) {
      alert("Aadhaar No is required");
      return;
    }
    if (!customerMobile) {
      alert("Mobile No is required");
      return;
    }
    if (invDate > todayStr) {
      alert("Invoice date cannot be in the future.");
      return;
    }

    const updatedBillRows = billRows.map((row) => computeBillRow(row));
    const totalAmount = updatedBillRows.reduce((acc, curr) => acc + curr.amount, 0);

    for (const row of updatedBillRows) {
      if (!row.manufacturer || row.manufacturer.trim() === "") {
        alert(`Manufacturer is required for spare part: ${row.spareNo}`);
        return;
      }
    }

    const payload = {
      invDate,
      customerName,
      customerAddress,
      customerMobile,
      adharNo,
      gstin,
      vehicleNo,
      discount: 0,
      totalAmount,
      items: updatedBillRows,
    };

    try {
      const invoiceResponse = await apiClient.patch(
        `/api/invoices/update/${invoiceData?.id}`,
        payload
      );

      await Promise.all(
        updatedBillRows.map((row) => {
          const transactionPayload = {
            vehicleRegId: null,
            partNumber: row.spareNo,
            manufacturer: row.manufacturer,
            partName: row.spareName,
            quantity: row.quantity === "" ? 0 : Number(row.quantity),
            amount: row.amount,
            total: row.total,
            transactionType: "DEBIT",
            billNo: 1,
            userId: 7777,
            name: ""
          };
          return apiClient.post("/sparePartTransactions/add", transactionPayload);
        })
      );
      navigate("/admin/counterbillPdf", { state: invoiceResponse.data });
    } catch (error) {
      console.error("Error updating invoice or transactions:", error);
    }
  };

  const handleManageCounterSale = () => {
    navigate("/admin/invoiceList");
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <Button variant="outlined" onClick={handleManageCounterSale}>
          Manage Counter Sale
        </Button>
      </div>

      <div style={headerStyle}>
        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <AiOutlineCalendarIcon />
            <span>Invoice Details</span>
          </div>
          <div style={fieldGroup}>
            <TextField
              id="invDate"
              label="Inv. Date"
              type="date"
              value={invDate}
              onChange={(e) => setInvDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <AiOutlineUserIcon />
            <span>Customer Details</span>
          </div>
          <div style={fieldGroup}>
            <TextField
              id="customerName"
              label="Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
            />
          </div>
          <div style={fieldGroup}>
            <TextField
              id="customerAddress"
              label="Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              fullWidth
            />
          </div>
          <div style={fieldGroup}>
            <TextField
              id="customerMobile"
              label="Mobile No *"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              fullWidth
            />
          </div>
          <div style={fieldGroup}>
            <TextField
              id="adharNo"
              label="Aadhaar No *"
              value={adharNo}
              onChange={(e) => setAdharNo(e.target.value)}
              fullWidth
            />
          </div>
          <div style={fieldGroup}>
            <TextField
              id="gstin"
              label="GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              fullWidth
            />
          </div>
          <div style={fieldGroup}>
            <TextField
              id="vehicleNo"
              label="Vehicle No"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              fullWidth
            />
          </div>
        </div>
      </div>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={tableHeaderStyle}>
            <TableRow>
              <TableCell sx={tableCellStyle}>#</TableCell>
              <TableCell sx={tableCellStyle}>Spare No</TableCell>
              <TableCell sx={tableCellStyle}>Spare Name</TableCell>
              <TableCell sx={tableCellStyle}>Qty</TableCell>
              <TableCell sx={tableCellStyle}>Rate</TableCell>
              <TableCell sx={tableCellStyle}>Discount (%)</TableCell>
              <TableCell sx={tableCellStyle}>Discount Amt</TableCell>
              <TableCell sx={tableCellStyle}>CGST (%)</TableCell>
              <TableCell sx={tableCellStyle}>CGST Amt</TableCell>
              <TableCell sx={tableCellStyle}>SGST (%)</TableCell>
              <TableCell sx={tableCellStyle}>SGST Amt</TableCell>
              <TableCell sx={tableCellStyle}>Taxable</TableCell>
              <TableCell sx={tableCellStyle}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billRows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell sx={tableCellStyle}>{index + 1}</TableCell>
                <TableCell sx={tableCellStyle}>
                  <OutlinedInput
                    value={row.spareNo}
                    onChange={(e) => updateBillRow(row.id, { spareNo: e.target.value })}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <OutlinedInput
                    value={row.spareName}
                    onChange={(e) => updateBillRow(row.id, { spareName: e.target.value })}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <OutlinedInput
                    value={row.quantity}
                    onChange={(e) => updateBillRow(row.id, { quantity: e.target.value })}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <OutlinedInput
                    value={row.rate}
                    onChange={(e) => updateBillRow(row.id, { rate: e.target.value })}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <OutlinedInput
                    value={row.discountPercent}
                    onChange={(e) => updateBillRow(row.id, { discountPercent: e.target.value })}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.discountAmt ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.cgstPercent ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.cgstAmt ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.sgstPercent ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.sgstAmt ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.taxable ?? 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(row.total ?? 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Changes
        </Button>
        <Button variant="outlined" color="error" onClick={handleRemove}>
          Remove Selected
        </Button>
      </Stack>
    </div>
  );
};

export default InvoiceEditForm;
