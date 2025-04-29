import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Grid,
  TextField,
  Chip,
  Button,
  Stack,
  Typography,
  Autocomplete,
  TextareaAutosize,
  styled,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Task, NoteAdd, Delete, Save, RemoveCircleOutline, Description } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "Services/apiService";
import JobOptionForm from "components/JobCard/JobOptionForm";

const StyledTextArea = styled(TextareaAutosize)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  fontSize: "0.875rem",
  "&:focus": {
    outline: `2px solid ${theme.palette.primary.main}`,
    borderColor: "transparent",
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: "0.813rem",
  },
}));

// HeaderCard styled component for navigation cards
const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  borderRadius: theme.shape.borderRadius,
  transition: "transform 0.3s, box-shadow 0.3s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: 120, // Fixed height for consistency
  width: '100%', // Use full width of the grid item
  boxShadow: theme.shadows[2],
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[4],
  },
}));

interface JobOption {
  jobCardId: number;
  jobName: string;
  jobType: string;
  jobAction?: string;
}

interface JobCardData {
  vehicleJobCardId: number;
  jobName: string;
  vehicleNumber: string;
  vehicleId: number;
  customerNote: string;
  workShopNote: string;
  jobStatus: string;
  jobType: string;
  jobCardId: number;
}

const JobCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id ? Number(id) : 0;
  const navigate = useNavigate();

  const [selectedJobs, setSelectedJobs] = useState<JobOption[]>([]);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status] = useState("In Progress");
  const [customerNote, setCustomerNote] = useState("");
  const [workshopNote, setWorkshopNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [jobCards, setJobCards] = useState<JobCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    console.log("VehicleRegId from URL:", id);
  }, [id]);

  const fetchJobCards = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/vehicleJobCards/getByVehicleId?vehicleId=${vehicleId}`);
      if (response.data && Array.isArray(response.data)) {
        setJobCards(response.data);
      }
    } catch (error) {
      console.error("Error fetching job cards:", error);
      setMessage("Error fetching job cards.");
    }
  }, [vehicleId]);

  const fetchVehicleData = useCallback(async () => {
    try {
      await apiClient.get(`https://carauto01-production-8b0b.up.railway.app/vehicle-reg/getById?vehicleRegId=${vehicleId}`);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      setMessage("Error fetching vehicle data.");
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicleId !== 0) {
      fetchJobCards();
      fetchVehicleData();
    }
  }, [vehicleId, fetchJobCards, fetchVehicleData]);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(jobSearch);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [jobSearch]);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchJobOptions(debouncedSearch);
    } else {
      // Only fetch all jobs when no search is active
      fetchAllJobOptions();
    }
  }, [debouncedSearch]);

  // Fetch all job options
  const fetchAllJobOptions = async () => {
    try {
      setIsLoading(true);
      const jobResponse = await apiClient.get("/registerJobCard/getAll");
      const data = jobResponse.data;
      
      if (data && Array.isArray(data)) {
        setJobOptions(data);
      } else {
        setJobOptions([]);
      }
    } catch (error) {
      console.error("Error fetching all job options:", error);
      setMessage("Error fetching job options.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch job options based on search
  const fetchJobOptions = async (query: string) => {
    try {
      setIsLoading(true);
      // Use the new search endpoint
      const jobResponse = await apiClient.get(`/registerJobCard/search?query=${query}`);
      const data = jobResponse.data;
      
      if (data && Array.isArray(data)) {
        setJobOptions(data);
      } else {
        setJobOptions([]);
      }
    } catch (error) {
      console.error("Error searching job options:", error);
      setMessage("Error searching job options.");
      setMessageType("error");
      // Fallback to getAllJobs if search fails
      fetchAllJobOptions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSelect = (
    event: React.SyntheticEvent,
    newValue: JobOption | null
  ) => {
    if (newValue && !selectedJobs.find((job) => job.jobCardId === newValue.jobCardId)) {
      setSelectedJobs([...selectedJobs, { ...newValue, jobAction: "No" }]);
    }
    setJobSearch("");
  };

  const removeJob = (jobCardId: number) => {
    setSelectedJobs(selectedJobs.filter((job) => job.jobCardId !== jobCardId));
  };

  const handleJobActionChange = (jobCardId: number, newAction: string) => {
    setSelectedJobs(
      selectedJobs.map((job) =>
        job.jobCardId === jobCardId ? { ...job, jobAction: newAction } : job
      )
    );
  };

  const handleSave = async () => {
    // Validation
    if (selectedJobs.length === 0) {
      setMessage("Please select at least one job.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    const jobCardData = {
      vehicleId: vehicleId,
      vehicleNumber: localStorage.getItem("vehicleNumber") || null,
      jobName: selectedJobs.length > 0 ? selectedJobs[0].jobName : null,
      jobCardId: selectedJobs.length > 0 ? selectedJobs[0].jobCardId : null,
      jobStatus: status,
      jobType: selectedJobs.length > 0 ? selectedJobs[0].jobAction : null,
      customerNote: customerNote,
      workShopNote: workshopNote,
    };

    try {
      const response = await apiClient.post("/api/vehicleJobCards/add", jobCardData);
      setMessage("Job card created successfully!");
      setMessageType("success");
      localStorage.setItem("jobCardDetails", JSON.stringify(response.data));
      
      // Create empty PDF data to ensure PDF generation even without data
      const emptyJobCard = {
        vehicleJobCardId: response.data?.vehicleJobCardId || "N/A",
        jobName: response.data?.jobName || "N/A",
        customerName: "N/A",
        jobStatus: response.data?.jobStatus || "N/A",
        customerNote: response.data?.customerNote || "N/A",
        workShopNote: response.data?.workShopNote || "N/A"
      };
      
      // Ensure we have data for the PDF by storing empty data if needed
      if (!response.data) {
        localStorage.setItem("jobCardDetails", JSON.stringify(emptyJobCard));
      }
      
      // Store vehicle data for PDF if not already stored
      if (!localStorage.getItem("vehicleData")) {
        localStorage.setItem("vehicleData", JSON.stringify({
          vehicleNumber: jobCardData.vehicleNumber || "N/A",
          customerMobileNumber: "N/A",
          customerAddress: "N/A",
          email: "N/A",
          superwiser: "N/A",
          technician: "N/A"
        }));
      }
      
      setSelectedJobs([]);
      setCustomerNote("");
      setWorkshopNote("");
      fetchJobCards();
      window.open("/admin/jobcardpdf", "_blank");
    } catch (error: any) {
      setMessage(
        "Error creating job card: " +
          (error.response?.data?.message || error.message)
      );
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render header cards
  const renderHeaderCards = () => {
    const headerCards = [
      {
        label: "Job Card",
        icon: <Task fontSize="large" color="primary" />,
        value: "jobCard",
        onClick: () => {}, // already on job card
      },
      {
        label: "Spare",
        icon: <Description fontSize="large" color="primary" />,
        value: "spare",
        onClick: () => navigate(`/admin/add-vehicle-part-service/${id}`),
      },
      {
        label: "Service",
        icon: <NoteAdd fontSize="large" color="primary" />,
        value: "service",
        onClick: () => navigate(`/admin/serviceTab/${id}`),
      },
    ];

    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '900px', mx: 'auto' }}>
          {headerCards.map((card) => (
            <Grid item xs={12} sm={4} md={4} key={card.value}>
              <HeaderCard 
                onClick={card.onClick}
                sx={{
                  border: card.value === 'jobCard' ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  backgroundColor: card.value === 'jobCard' ? 'rgba(25, 118, 210, 0.08)' : 'white',
                }}
              >
                <Box sx={{ mb: 1 }}>{card.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {card.label}
                </Typography>
              </HeaderCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="textSecondary">
          Vehicle Registration ID: {id}
        </Typography>
      </Box>
      
      {renderHeaderCards()}
      
      <Paper elevation={3} sx={{ borderRadius: 0, p: { xs: 1.5, sm: 3 }, width: "100%" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          <Task sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          Job Card
          <RemoveCircleOutline sx={{ ml: 1, color: "#ffcccb", fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </Typography>

        <Autocomplete
          options={jobOptions}
          getOptionLabel={(option) => option.jobName || ""}
          onChange={handleJobSelect}
          inputValue={jobSearch}
          onInputChange={(event, newInputValue) => {
            setJobSearch(newInputValue);
          }}
          loading={isLoading}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Search Job Name" 
              variant="outlined" 
              fullWidth 
              sx={{ mb: 2 }} 
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText="No jobs found. Try a different search term."
        />
        {selectedJobs.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 1, sm: 2 }, mb: 2, width: "100%" }}>
            {!isMobile && (
              <Grid container spacing={2} sx={{ fontWeight: 600 }}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Job Name</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Job Type</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2">Job Card ID</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Action</Typography>
                </Grid>
              </Grid>
            )}

            {selectedJobs.map((job) =>
              isMobile ? (
                <Paper key={job.jobCardId} elevation={1} sx={{ p: 1.5, mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
                    <strong>Job Name:</strong> {job.jobName}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                    <strong>Job Type:</strong> {job.jobType}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                    <strong>Job Card ID:</strong> {job.jobCardId}
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel id={`action-label-${job.jobCardId}`}>Action</InputLabel>
                    <Select
                      labelId={`action-label-${job.jobCardId}`}
                      value={job.jobAction || "No"}
                      label="Action"
                      onChange={(e) =>
                        handleJobActionChange(job.jobCardId, e.target.value as string)
                      }
                    >
                      <MenuItem value="No">No</MenuItem>
                      <MenuItem value="Yes/Repair">Yes/Repair</MenuItem>
                      <MenuItem value="Yes/Replace">Yes/Replace</MenuItem>
                      <MenuItem value="Cancel">Cancel</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ mt: 1, textAlign: "right" }}>
                    <IconButton onClick={() => removeJob(job.jobCardId)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ) : (
                <Grid container spacing={2} key={job.jobCardId} sx={{ mt: 1, alignItems: "center" }}>
                  <Grid item xs={4}>
                    <Typography variant="body1">{job.jobName}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body1">{job.jobType}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body1">{job.jobCardId}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`action-label-${job.jobCardId}`}>Action</InputLabel>
                      <Select
                        labelId={`action-label-${job.jobCardId}`}
                        value={job.jobAction || "No"}
                        label="Action"
                        onChange={(e) =>
                          handleJobActionChange(job.jobCardId, e.target.value as string)
                        }
                      >
                        <MenuItem value="No">No</MenuItem>
                        <MenuItem value="Yes/Repair">Yes/Repair</MenuItem>
                        <MenuItem value="Yes/Replace">Yes/Replace</MenuItem>
                        <MenuItem value="Cancel">Cancel</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )
            )}
          </Paper>
        )}

        <Box sx={{ mb: 2 }}>
          <Chip
            label={status}
            color={status === "Completed" ? "success" : status === "In Progress" ? "warning" : "error"}
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: "0.875rem" }}
          />
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              <NoteAdd sx={{ mr: 1, fontSize: { xs: 18, sm: 20 }, verticalAlign: "bottom" }} />
              Customer Note
            </Typography>
            <StyledTextArea
              minRows={isMobile ? 2 : 3}
              placeholder="Enter customer comments..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              <Delete sx={{ mr: 1, fontSize: { xs: 18, sm: 20 }, verticalAlign: "bottom" }} />
              Workshop Note
            </Typography>
            <StyledTextArea
              minRows={isMobile ? 2 : 3}
              placeholder="Enter workshop instructions..."
              value={workshopNote}
              onChange={(e) => setWorkshopNote(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2 }} justifyContent="flex-end">
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }} 
              onClick={handleSave}
            >
              Save Changes
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Task />} 
              sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
            >
              Inspection
            </Button>
          </Stack>
        </Box>

        {message && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={messageType || "info"} sx={{ width: "100%" }}>
              {message}
            </Alert>
          </Box>
        )}
      </Paper>
      <Paper elevation={3} sx={{ mt: 4, p: { xs: 1.5, sm: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Job Cards for Vehicle Number: {vehicleId}
        </Typography>
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxWidth: "100%", 
            overflowX: "auto",
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 1.5 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Job Name</strong></TableCell>
                {!isMobile && <TableCell><strong>Vehicle Number</strong></TableCell>}
                <TableCell><strong>Customer Note</strong></TableCell>
                {!isMobile && <TableCell><strong>Workshop Note</strong></TableCell>}
                <TableCell><strong>Job Type</strong></TableCell>
                {!isMobile && <TableCell><strong>Job Card ID</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {jobCards.map((job) => (
                <TableRow key={job.vehicleJobCardId}>
                  <TableCell>{job.jobName}</TableCell>
                  {!isMobile && <TableCell>{job.vehicleNumber}</TableCell>}
                  <TableCell>
                    {isMobile && job.customerNote.length > 20
                      ? `${job.customerNote.substring(0, 20)}...`
                      : job.customerNote}
                  </TableCell>
                  {!isMobile && <TableCell>{job.workShopNote}</TableCell>}
                  <TableCell>{job.jobType}</TableCell>
                  {!isMobile && <TableCell>{job.jobCardId}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default JobCard;
