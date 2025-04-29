import React, { useEffect, useState, FormEvent } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  styled,
  FormHelperText
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { useParams } from "react-router-dom";
import apiClient from "Services/apiService";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%", // use full width of parent container
  padding: theme.spacing(3),
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
}));

interface JobOptionFormData {
  jobName: string;
  jobType: string;
}

const initialFormData: JobOptionFormData = {
  jobName: "",
  jobType: "",
};

const EditJobOptionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ID from URL
  const [formData, setFormData] = useState<JobOptionFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch data for given id on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await apiClient.get(`/registerJobCard/getById/${id}`);
          // Assuming response.data returns a job card object with fields jobName and jobType
          const data = response.data;
          setFormData({
            jobName: data.jobName || "",
            jobType: data.jobType || "",
          });
        } catch (error: any) {
          console.error("Error fetching job card data:", error);
          setErrorMsg("Failed to fetch job card data.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleJobTypeChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, jobType: e.target.value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Basic validation
    if (!formData.jobName.trim() || !formData.jobType.trim()) {
      setErrorMsg("Please fill in all required fields.");
      setSuccessMsg("");
      return;
    }
    setErrorMsg("");
    try {
      setLoading(true);
      const response = await apiClient.patch(`/registerJobCard/update/${id}`, formData);
      console.log("Job card updated successfully:", response.data);
      setSuccessMsg("Job card updated successfully!");
    } catch (error: any) {
      console.error("Error updating job card:", error);
      setErrorMsg(error.response?.data?.message || "Error updating job card");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}>
        Edit Job Option
      </Typography>
      {errorMsg && (
        <Typography variant="body2" color="error" sx={{ mb: 2, textAlign: "center" }}>
          {errorMsg}
        </Typography>
      )}
      {successMsg && (
        <Typography variant="body2" color="success.main" sx={{ mb: 2, textAlign: "center" }}>
          {successMsg}
        </Typography>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        {/* Job Name Field */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Job Name <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter Job Name"
            value={formData.jobName}
            onChange={handleChange}
            required
            size="small"
            name="jobName"
          />
        </Box>
        {/* Job Type Select */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Select Job Type <span style={{ color: "red" }}>*</span>
          </Typography>
          <FormControl fullWidth size="small" required>
            <InputLabel id="job-type-label">Job Type</InputLabel>
            <Select
              labelId="job-type-label"
              value={formData.jobType}
              label="Job Type"
              onChange={handleJobTypeChange}
            >
              <MenuItem value="">
                <em>Select a job type</em>
              </MenuItem>
              <MenuItem value="Inspection">Inspection</MenuItem>
              <MenuItem value="Problem">Problem</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Stack direction="row" spacing={2} justifyContent="center">
          <StyledButton variant="contained" color="primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Update"}
          </StyledButton>
        </Stack>
      </Box>
    </StyledPaper>
  );
};

export default EditJobOptionForm;
