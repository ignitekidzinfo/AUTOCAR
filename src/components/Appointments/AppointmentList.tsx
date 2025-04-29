import React, { useEffect, useState, ChangeEvent } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  styled,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import apiClient from "Services/apiService";

/** Define the AppointmentDto interface. Some fields can be null. */
interface AppointmentDto {
  appointmentId: number;
  appointmentDate: string;
  customerName: string;
  mobileNo: string;
  vehicleNo: string;
  vehicleMaker: string;
  vehicleModel: string;
  manufacturedYear: string;
  kilometerDriven: string;
  fuelType: string;
  workType: string | null;
  vehicleProblem: string;
  pickUpAndDropService: string;
  userId: number | null;
  status: string | null;
}

/** A styled container for spacing and background. */
const ContainerBox = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
}));

/** A styled heading for a modern look. */
const Heading = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.primary.main,
  textAlign: "center",
  marginBottom: theme.spacing(3),
}));

/** A styled search box (TextField). */
const SearchBox = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 400,
  alignSelf: "center",
}));

/** A styled TableCell for table headers. */
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#f5f5f5",
  fontWeight: 600,
}));

/**
 * The AppointmentList component fetches all appointments from the getAll API,
 * filters them based on search input, and displays the results in a table.
 */
const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  /** Fetch all appointments on component mount using getAll API */
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get<AppointmentDto[]>("/appointments/getAll");
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  /**
   * Filter appointments based on the search term.
   * For nullable fields, fallback to an empty string.
   */
  const filteredAppointments = appointments.filter((appt) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      appt.appointmentDate?.toLowerCase().includes(lowerSearch) ||
      appt.customerName?.toLowerCase().includes(lowerSearch) ||
      appt.mobileNo?.toLowerCase().includes(lowerSearch) ||
      appt.vehicleNo?.toLowerCase().includes(lowerSearch) ||
      appt.vehicleMaker?.toLowerCase().includes(lowerSearch) ||
      appt.vehicleModel?.toLowerCase().includes(lowerSearch) ||
      appt.manufacturedYear?.toLowerCase().includes(lowerSearch) ||
      appt.kilometerDriven?.toLowerCase().includes(lowerSearch) ||
      appt.fuelType?.toLowerCase().includes(lowerSearch) ||
      (appt.workType || "").toLowerCase().includes(lowerSearch) ||
      appt.vehicleProblem?.toLowerCase().includes(lowerSearch) ||
      appt.pickUpAndDropService?.toLowerCase().includes(lowerSearch) ||
      (appt.userId !== null ? String(appt.userId) : "").includes(lowerSearch) ||
      (appt.status || "").toLowerCase().includes(lowerSearch)
    );
  });

  /** Update search term when the user types in the search bar */
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <ContainerBox display="flex" flexDirection="column" alignItems="center">
      <Heading variant="h5">Appointments</Heading>

      {/* Modern Search Bar */}
      <SearchBox
        variant="outlined"
        placeholder="Search appointments..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="primary" />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} style={{ width: "100%", maxWidth: 1200 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Sr.</StyledTableCell>
              <StyledTableCell>Appt Date</StyledTableCell>
              <StyledTableCell>Cust Name</StyledTableCell>
              <StyledTableCell>Cust Mobile</StyledTableCell>
              <StyledTableCell>Veh No</StyledTableCell>
              <StyledTableCell>Veh Maker</StyledTableCell>
              <StyledTableCell>Veh Model</StyledTableCell>
              <StyledTableCell>Manufact Yr</StyledTableCell>
              <StyledTableCell>KM Driven</StyledTableCell>
              <StyledTableCell>Fuel Type</StyledTableCell>
              <StyledTableCell>Work Type</StyledTableCell>
              <StyledTableCell>Service</StyledTableCell>
              <StyledTableCell>Veh Problem</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt, index) => (
                <TableRow key={appt.appointmentId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{appt.appointmentDate}</TableCell>
                  <TableCell>{appt.customerName}</TableCell>
                  <TableCell>{appt.mobileNo}</TableCell>
                  <TableCell>{appt.vehicleNo}</TableCell>
                  <TableCell>{appt.vehicleMaker}</TableCell>
                  <TableCell>{appt.vehicleModel}</TableCell>
                  <TableCell>{appt.manufacturedYear}</TableCell>
                  <TableCell>{appt.kilometerDriven}</TableCell>
                  <TableCell>{appt.fuelType}</TableCell>
                  <TableCell>{appt.workType || ""}</TableCell>
                  <TableCell>{appt.pickUpAndDropService}</TableCell>
                  <TableCell>{appt.vehicleProblem}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} align="center" style={{ padding: "1rem" }}>
                  No Appointments Found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ContainerBox>
  );
};

export default AppointmentList;
