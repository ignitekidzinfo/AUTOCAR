import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { AiOutlineEdit, AiOutlineDelete, AiOutlinePrinter } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import apiClient from "Services/apiService";

const AiOutlineEditIcon = AiOutlineEdit as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;
const AiOutlineDeleteIcon = AiOutlineDelete as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;
const AiOutlinePrinterIcon = AiOutlinePrinter as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;

interface InvoiceItem {
  id: number;
  quantity: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invDate: string;
  totalAmount: number;
  items: InvoiceItem[];
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get("/api/invoices/getAll")
      .then((response) => {
        setInvoices(response.data);
      })
      .catch((error) => {
        console.error("Error fetching invoices:", error);
      });
  }, []);

  // Filter invoices by matching searchTerm with any of the fields
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const totalQuantity = invoice.items.reduce((acc, item) => acc + item.quantity, 0).toString();
    const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(search);
    const invDateMatch = invoice.invDate && invoice.invDate.toLowerCase().includes(search);
    const totalAmountMatch = invoice.totalAmount.toString().toLowerCase().includes(search);
    const totalQuantityMatch = totalQuantity.toLowerCase().includes(search);
    return invoiceNumberMatch || invDateMatch || totalAmountMatch || totalQuantityMatch;
  });

  const handlePrint = (invoice: Invoice) => {
    navigate("/admin/counterbillPdf", { state: invoice });
  };

  const handleEdit = (invoice: Invoice) => {
    navigate(`/admin/counterSale/${invoice.id}`);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: "1600px" }, mx: "auto", py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2">
          List Counter Sale
        </Typography>

        <FormControl sx={{ width: { xs: "100%", sm: "300px" } }} variant="outlined">
          <OutlinedInput
            size="small"
            placeholder="Search by Invoice No, Date, Quantity, or Total..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
          />
        </FormControl>
      </Stack>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "grey.900" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", width: "5%" }}>#</TableCell>
              <TableCell sx={{ color: "#fff", width: "20%" }}>Invoice No.</TableCell>
              <TableCell sx={{ color: "#fff", width: "20%" }}>Date</TableCell>
              <TableCell sx={{ color: "#fff", width: "20%" }}>Quantity</TableCell>
              <TableCell sx={{ color: "#fff", width: "20%" }}>Total</TableCell>
              <TableCell sx={{ color: "#fff", width: "15%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, index) => {
                const totalQuantity = invoice.items.reduce(
                  (acc, item) => acc + item.quantity,
                  0
                );
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.invDate || "—"}</TableCell>
                    <TableCell>{totalQuantity}</TableCell>
                    <TableCell>{invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton color="primary" sx={{ mr: 1 }} onClick={() => handleEdit(invoice)}>
                        <AiOutlineEditIcon size={18} />
                      </IconButton>
                      <IconButton color="error" sx={{ mr: 1 }}>
                        <AiOutlineDeleteIcon size={18} />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handlePrint(invoice)}>
                        <AiOutlinePrinterIcon size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
