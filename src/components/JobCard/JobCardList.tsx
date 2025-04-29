import React, { useEffect, useState, ChangeEvent } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  styled
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiClient from "Services/apiService";

interface JobCardDto {
  jobCardId: number;
  jobName: string;
  jobType: string;
}

const Container = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(4),
  boxSizing: "border-box",
}));

const JobCardList: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCardDto[]>([]);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<JobCardDto[]>("/registerJobCard/getAll");
        setJobCards(response.data);
      } catch (error) {
        console.error("Error fetching job cards:", error);
      }
    };
    fetchData();
  }, []);

  const filteredJobCards = jobCards.filter((job) => {
    const lowerSearch = search.toLowerCase();
    return (
      job.jobCardId.toString().toLowerCase().includes(lowerSearch) ||
      (job.jobName || "").toLowerCase().includes(lowerSearch) ||
      (job.jobType || "").toLowerCase().includes(lowerSearch)
    );
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleEdit = (jobId: number) => {
    navigate(`/admin/editJob/${jobId}`);
  };

  // Open confirmation dialog and store the job id to delete
  const handleDelete = (jobId: number) => {
    setSelectedJobId(jobId);
    setConfirmOpen(true);
  };

  // Called when user confirms deletion in the dialog
  const handleDeleteConfirmed = async () => {
    if (selectedJobId === null) return;
    try {
      await apiClient.delete(`/registerJobCard/delete/${selectedJobId}`);
      setJobCards((prevJobs) => prevJobs.filter((job) => job.jobCardId !== selectedJobId));
    } catch (error: any) {
      console.error("Error deleting job card:", error);
      alert(error.response?.data?.message || "Error deleting job card");
    } finally {
      setConfirmOpen(false);
      setSelectedJobId(null);
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setSelectedJobId(null);
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mb: 2, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Job Card Management
        </Typography>
        <TextField
          label="Search Job Cards"
          variant="outlined"
          size="small"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by ID, Job Name, or Job Option..."
        />
      </Paper>

      <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Job Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Job Option</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No matching records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredJobCards.map((job, index) => (
                <TableRow key={job.jobCardId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{job.jobName}</TableCell>
                  <TableCell>{job.jobType}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton onClick={() => handleEdit(job.jobCardId)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(job.jobCardId)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this job card?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirmed} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobCardList;
