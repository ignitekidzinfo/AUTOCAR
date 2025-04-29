import React, { useState, FormEvent } from "react";
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
import apiClient from "Services/apiService";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%", // full width
  padding: theme.spacing(3),
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
}));

const SuccessCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
  textAlign: "center",
  backgroundColor: theme.palette.success.light,
  color: theme.palette.success.contrastText,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

interface JobOptionFormData {
  jobName: string;
  jobType: string;
}

const initialFormData: JobOptionFormData = {
  jobName: "",
  jobType: "",
};

const JobOptionForm: React.FC = () => {
  const [formData, setFormData] = useState<JobOptionFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
      return;
    }
    setErrorMsg("");
    try {
      setLoading(true);
      const response = await apiClient.post("/registerJobCard/add", formData);
      // Assuming response.data contains the generated vehicleRegId field
      const generatedId = response.data.vehicleRegId;
      console.log("Job card saved successfully:", response.data);
      setSuccessMsg("Job added successfully!");
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error saving job card:", error);
      setErrorMsg(error.response?.data?.message || "Error saving job card");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <StyledPaper>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}>
          Add New Job Option
        </Typography>
        {errorMsg && (
          <Typography variant="body2" color="error" sx={{ mb: 2, textAlign: "center" }}>
            {errorMsg}
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
          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <StyledButton variant="contained" color="primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </StyledButton>
            <StyledButton variant="outlined" color="secondary" onClick={() => setFormData(initialFormData)}>
              Reset
            </StyledButton>
          </Stack>
        </Box>
      </StyledPaper>

      {successMsg && (
        <SuccessCard>
          <Typography variant="h6">{successMsg}</Typography>
        </SuccessCard>
      )}
    </Box>
  );
};

export default JobOptionForm;
