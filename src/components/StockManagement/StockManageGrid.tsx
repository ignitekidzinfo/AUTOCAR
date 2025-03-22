import * as React from "react";
import { Card, CardContent, Typography, Grid, CardActionArea, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const reportItems = [
  { text: "ADD New Stock Service", link: "/admin/transaction" },
  { text: "View All Stock", link: "/admin/transaction-list" },
  { text: "Stock By Date", link: "/admin/stock-by-date" },
  { text: "Counter Sale", link: "/admin/counter-sale" },
];

export default function ReportCards() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", p: 3 }}>
      <Grid container spacing={3} sx={{ maxWidth: 900 }}>
        {reportItems.map((item, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card sx={{ minHeight: 150, textAlign: "center", boxShadow: 3, borderRadius: 3 }}>
              <CardActionArea onClick={() => navigate(item.link)}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {item.text}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
