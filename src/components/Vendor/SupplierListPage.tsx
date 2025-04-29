import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  styled,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import apiClient from "Services/apiService";

// Define the interface for SupplierDto
interface SupplierDto {
  vendorId: number;
  name: string;
  address: string;
  mobileNumber: number;
  spareBrand: string;
}

// (Optional) Generic paginated response interface
interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

// Styled Paper for the data table container (white background)
const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(3),
  width: "100%",
  overflowX: "auto",
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[4],
  background: "#ffffff"
}));

// Styled TableCell for header (grey background)
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.getContrastText("#616161"),
  backgroundColor: "#616161",
  borderBottom: "none"
}));

// Styled summary box with grey gradient
const SupplierSummaryBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "linear-gradient(135deg, #e0e0e0, #bdbdbd)",
  color: theme.palette.getContrastText("#bdbdbd"),
  padding: theme.spacing(2),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(0.5),
  boxShadow: theme.shadows[2],
}));

// The component for the Supplier List page
const SupplierListPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  });
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get("/vendor/getAll");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers based on the search term using fallback values for null properties.
  const filteredSuppliers = suppliers.filter((supplier) => {
    const search = searchTerm.toLowerCase();
    return (
      (supplier.name || "").toLowerCase().includes(search) ||
      (supplier.address || "").toLowerCase().includes(search) ||
      String(supplier.mobileNumber).toLowerCase().includes(search) ||
      (supplier.spareBrand || "").toLowerCase().includes(search) ||
      supplier.vendorId.toString().includes(search)
    );
  });

  const handleAddSupplier = () => {
    navigate("/supplier/add");
  };

  const handleEdit = (vendorId: number) => {
    navigate(`/supplier/update/${vendorId}`);
  };

  const handleOpenDeleteDialog = (vendorId: number) => {
    setDeleteId(vendorId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await apiClient.delete(`/vendor/delete/${deleteId}`);
      handleCloseDeleteDialog();
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        width: "100%",
        padding: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          mb: 2,
          fontWeight: "bold",
          color: theme.palette.primary.main,
          textAlign: "center",
        }}
      >
        Supplier List
      </Typography>

      {/* Modern Search Bar */}
      <Box sx={{ mb: 2, maxWidth: 600, margin: "auto" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill={theme.palette.primary.main}
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Button variant="contained" color="primary" onClick={handleAddSupplier} sx={{ mb: 2 }}>
        Add New Supplier
      </Button>

      <StyledPaper>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <StyledTableCell>S.No</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell>Mobile</StyledTableCell>
              <StyledTableCell>Spare Brand</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredSuppliers.map((supplier, index) => (
              <TableRow key={supplier.vendorId}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.address}</TableCell>
                <TableCell>{supplier.mobileNumber}</TableCell>
                <TableCell>{supplier.spareBrand}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(supplier.vendorId)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleOpenDeleteDialog(supplier.vendorId)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center" sx={{ py: 2 }}>
                    No suppliers found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledPaper>

      <SupplierSummaryBox>
        <Typography variant="body1">{`Showing ${filteredSuppliers.length} Suppliers`}</Typography>
      </SupplierSummaryBox>

      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Supplier</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this supplier?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: "40vh" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupplierListPage;
