import React, { FC, useRef } from "react";
import  { useState, useEffect } from "react";

import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,TextField,
  FormControl,
  FormLabel,FormGroup,Checkbox,
  styled,
  CircularProgress,
} from "@mui/material";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
}));

const Title = styled(Typography)(() => ({
  fontWeight: 700,
  fontSize: "1.1rem",
}));

const SubTitle = styled(Typography)(() => ({
  fontSize: "0.95rem",
  fontWeight: 600,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontWeight: 600,
  textDecoration: "underline",
}));

const LabelText = styled(Typography)(() => ({
  fontWeight: 500,
  display: "inline-block",
  minWidth: 100,
}));

const ValueText = styled(Typography)(() => ({
  display: "inline-block",
  marginLeft: 6,
}));

const JobCardPDF: React.FC = () => {
  const jobCardNo = 0;
  const customerName = "null";
  const contact = "null";
  const email = "null";
  const gstNo = "null";
  const rtoNo = "null";
  const vehicleNo = "null";
  const technicianName = "null";
  const oilType = "null";
  const coolant = "null";
  const ramLock = "null";
  const documentReq = "null";
  const costOfRepairs = "Estimated Cost";
  const washType = "Exterior Wash";
  const tyreAir = "Yes";
  const interiorWash = "Yes";
  const termsAndConditions =
    "I do agree the owner is any scratch, workshop for repair, but the parts need to repair or any can be chargeable...";

  const [serviceBooklet, setServiceBooklet] = useState<string>("");
  const [rimLock, setRimLock] = useState<string>("");
  const [documentReg, setDocumentReg] = useState<string>("");
  const [toolKit, setToolKit] = useState<string>("");
  const [fuelLevel, setFuelLevel] = useState<string>("");
  const [carWash, setCarWash] = useState<string>("Yes");
  const [engineWash, setEngineWash] = useState<string>("Yes");
  const [interiorWashOption, setInteriorWashOption] = useState<string>("Yes");

  const handleSave = () => {
    alert("Save clicked!");
    generatePDF();
  };

  const handleClose = () => {
    alert("Close clicked!");
  };

  const [jobCardDetails, setJobCardDetails] = useState<any | null>(null); 
  const [vehicledata, setVehicleData] = useState<any | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const storedJobCardDetails = localStorage.getItem("jobCardDetails");

  const invoiceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const storedJobCardDetails = localStorage.getItem("jobCardDetails");
    const storedVehicleDataDetails = localStorage.getItem("vehicleData");

    if (storedJobCardDetails) {
      const parsedJobCardDetails = JSON.parse(storedJobCardDetails);
      console.log("Job Card Details:", parsedJobCardDetails);
      setJobCardDetails(parsedJobCardDetails);
    } else {
      // Create default empty job card data
      setJobCardDetails({
        vehicleJobCardId: "N/A",
        jobName: "No Job Selected",
        customerName: "N/A",
        jobStatus: "N/A",
        customerNote: "N/A",
        workShopNote: "N/A"
      });
    }
    
    if (storedVehicleDataDetails) {
      setVehicleData(JSON.parse(storedVehicleDataDetails));
    } else {
      // Create default empty vehicle data
      setVehicleData({
        vehicleNumber: "N/A",
        customerMobileNumber: "N/A",
        customerAadharNo: "N/A",
        customerAddress: "N/A",
        email: "N/A",
        customerGstin: "N/A",
        vehicleModelName: "N/A",
        kmsDriven: "N/A",
        superwiser: "N/A",
        technician: "N/A"
      });
    }
    
    // Set loading false after data processing
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading job card details...</Typography>
      </Box>
    );
  }

  const generatePDF = async () => {
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) {
      console.error("Invoice element not found!");
      return;
    }

    const options = { scale: 2 };
    const canvas = await html2canvas(invoiceElement, options as any);
    const imgData = canvas.toDataURL("image/png", 0.7);

    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let finalHeight = imgHeight;
    let scaleFactor = 1;

    if (finalHeight > pageHeight) {
      scaleFactor = pageHeight / imgHeight;
      finalHeight = pageHeight;
    }

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true, 
    });
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
    pdf.save("invoice.pdf");
  };

  return (
    <Box ref={invoiceRef} sx={{ width: "100%", p: 2 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Header>
          <Box>
            <Title>AUTO Car Care Point</Title>
            <Typography variant="body2">
              At/Post Bhubtal Nagar, Shinganapur Road, Kolki, Tal/Phaltan -
              415523, Dist. Satara.
              <br />
              Contact: 9876543210 / 7359871234
              <br />
              Email: autocarepoint@gmail.com
            </Typography>
          </Box>
          <Box textAlign="right">
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "flex-end",
                mb: 1,
              }}
            >
              <Button variant="contained" size="small" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outlined" size="small" onClick={generatePDF}>
                Print
              </Button>
            </Box>
            <SubTitle sx={{
                          
                          fontWeight: "bold", 
                          color: "text.primary",
                        }}>Job Card No: {jobCardDetails.vehicleJobCardId || "N/A"}</SubTitle>
            <SubTitle>Superwiser Name: {vehicledata.superwiser || "N/A"}</SubTitle>

            <SubTitle>Technician Name: {vehicledata.technician || "N/A"}</SubTitle>
          </Box>
        </Header>
        <Divider />

        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <LabelText>Customer Name:</LabelText>
              <ValueText>{jobCardDetails?.customerName || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Contact:</LabelText>
              <ValueText>{vehicledata?.customerMobileNumber || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Adhar NO:</LabelText>
              <ValueText>{vehicledata?.customerAadharNo || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Address:</LabelText>
              <ValueText>{vehicledata?.customerAddress || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Email:</LabelText>
              <ValueText>{vehicledata?.email || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>GST No:</LabelText>
              <ValueText>{vehicledata?.customerGstin || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Model:</LabelText>
              <ValueText>{vehicledata?.vehicleModelName || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Vehicle No:</LabelText>
              <ValueText>{vehicledata?.vehicleNumber || "N/A"}</ValueText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabelText>Kms Driven:</LabelText>
              <ValueText>{vehicledata?.kmsDriven || "N/A"}</ValueText>
            </Grid>
          </Grid>
        </Box>
        <Divider />
        <Box sx={{ mt: 2 }}>
          <TableContainer component={Paper} sx={{ border: '1px solid #000' }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', width: '20%' }}>
                    Service Booklet:
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000', width: '15%' }}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={serviceBooklet}
                        onChange={(e) => setServiceBooklet(e.target.value)}
                      >
                        <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', width: '20%' }}>
                    Fuel Level
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000', width: '15%' }}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={fuelLevel}
                        onChange={(e) => setFuelLevel(e.target.value)}
                      >
                        <FormControlLabel value="1/4" control={<Radio size="small" />} label="1/4" />
                        <FormControlLabel value="1/2" control={<Radio size="small" />} label="1/2" />
                        <FormControlLabel value="3/4" control={<Radio size="small" />} label="3/4" />
                        <FormControlLabel value="Full" control={<Radio size="small" />} label="Full" />
                      </RadioGroup>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', width: '20%' }}>
                    Estimated Cost Of Repairs:
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>
                    Rim Lock:
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={rimLock}
                        onChange={(e) => setRimLock(e.target.value)}
                      >
                        <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    </FormControl>
                  </TableCell>
                  <TableCell colSpan={2} sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <LabelText>Car Wash:</LabelText>
                    <select 
                      style={{ padding: '2px', marginLeft: '5px' }}
                      value={carWash}
                      onChange={(e) => setCarWash(e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>
                    Document Reg.Papers:
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={documentReg}
                        onChange={(e) => setDocumentReg(e.target.value)}
                      >
                        <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    </FormControl>
                  </TableCell>
                  <TableCell colSpan={2} sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <LabelText>Engine Wash:</LabelText>
                    <select 
                      style={{ padding: '2px', marginLeft: '5px' }}
                      value={engineWash}
                      onChange={(e) => setEngineWash(e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>
                    Tool Kit:
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={toolKit}
                        onChange={(e) => setToolKit(e.target.value)}
                      >
                        <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    </FormControl>
                  </TableCell>
                  <TableCell colSpan={2} sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <LabelText>Interior Wash:</LabelText>
                    <select 
                      style={{ padding: '2px', marginLeft: '5px' }}
                      value={interiorWashOption}
                      onChange={(e) => setInteriorWashOption(e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Divider sx={{ width: '100%', backgroundColor: 'black', height: 2, marginY: 2 }} />

        <TableContainer component={Paper} sx={{ width: "100%", mb: 0, border: "1px solid black" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  colSpan={4} 
                  sx={{ 
                    fontWeight: 'bold', 
                    borderBottom: "1px solid black", 
                    backgroundColor: "#f5f5f5",
                    p: 1
                  }}
                >
                  Inspection
                  <Typography sx={{ float: "right", fontWeight: "bold" }}>Present</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid #ddd", p: 1 }}>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Paid Service/Running Repair"
                  />
                </TableCell>
                <TableCell sx={{ border: "1px solid #ddd", p: 1 }}>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Body Shop/Paint"
                  />
                </TableCell>
                <TableCell sx={{ border: "1px solid #ddd", p: 1 }}>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="A.C/Accessories"
                  />
                </TableCell>
                <TableCell sx={{ border: "1px solid #ddd", p: 1 }}>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Car Detailing"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <TableContainer component={Paper} sx={{ width: "100%", mt: 0, border: "1px solid black", borderTop: "none" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', border: "1px solid black", width: "5%" }}>Sr.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: "1px solid black", width: "25%" }}>Customer Complaint/ Work Desc.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: "1px solid black", width: "25%" }}>Actual Workshop Finding</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: "1px solid black", width: "25%" }}>Action Taken</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: "1px solid black", width: "20%" }}>Cost Of Part & Labour</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid black", p: 1 }}>1</TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}>{jobCardDetails?.jobName || "OIL /OIL FILTER REPLYS'ENT"}</TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
                <TableCell sx={{ border: "1px solid black", p: 1 }}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <TableContainer component={Paper} sx={{ width: "100%", mt: 0, border: "1px solid black", borderTop: "none" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: "1px solid black", p: 1 }}>
                  Workshop Note:
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ p: 1, minHeight: "30px" }}>
                  {jobCardDetails?.workShopNote || jobCardDetails?.workshopNote || jobCardDetails?.workshop_note || "No workshop notes available"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <TableContainer component={Paper} sx={{ width: "100%", mt: 3, border: "1px solid black" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: "1px solid black", p: 1 }}>
                  Terms & Conditions:
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ p: 1 }}>
                  <Typography variant="body2">
                    1)- I have given my car to my swatch workshop for repair, but the parts used to repair my car have no complaints, and all expenses for the car will be billed without bargaining, I will stand by the bill.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    2)-If there is any damage to my vehicle while working or parked in the garage, I will not ask for compensation or make any complaint.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    3)-I have ensured that the insurance is valid before taking my car to the workshop, which will not hold the workshop and staff responsible for any accident while working on my car.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <TableContainer component={Paper} sx={{ width: "100%", mt: 0, border: "1px solid black", borderTop: "none" }}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: "50%", p: 2, borderRight: "1px solid black" }}>
                  <Typography sx={{ fontWeight: "bold" }}>Customer Signature / Thumb</Typography>
                </TableCell>
                <TableCell sx={{ width: "50%", p: 2 }}>
                  <Typography sx={{ fontWeight: "bold" }}>Service Advisor Signature</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default JobCardPDF;