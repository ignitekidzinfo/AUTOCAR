import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaTools, FaClipboardList, FaCalendarAlt, FaShoppingCart } from "react-icons/fa";

const reportItems = [
  {
    text: "ADD New Stock Service",
    link: "/admin/transaction",
    icon: <FaTools size={40} color="#1976d2" />,
  },
  {
    text: "View All Stock",
    link: "/admin/transaction-list",
    icon: <FaClipboardList size={40} color="#388e3c" />,
  },
  {
    text: "Stock By Date",
    link: "/admin/stock-by-date",
    icon: <FaCalendarAlt size={40} color="#f57c00" />,
  },
  {
    text: "Counter Sale",
    link: "/admin/counter-sale",
    icon: <FaShoppingCart size={40} color="#d32f2f" />,
  },
];

export default function ReportCards() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 5,
        px: 2,
      }}
    >
      <Typography variant="h4" fontWeight="bold" color="#fff" mb={4}>
        Stock Management
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 3,
          maxWidth: "1000px",
        }}
      >
        {reportItems.map((item, index) => (
          <Card
            key={index}
            sx={{
              width: 220,
              height: 150,
              backgroundColor: "transparent", 
              color: "#fff",
              borderRadius: 3,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.3s ease-in-out",
              border: "1px solid rgba(255, 255, 255, 0.2)", 
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea onClick={() => navigate(item.link)} sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {item.icon}
                <Typography variant="subtitle1" fontWeight="bold" mt={2}>
                  {item.text}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mt: 5, color: "#aaa" }}>
        Copyright © AutoCarCarePoint 2025.
      </Typography>
    </Box>
  );
}
