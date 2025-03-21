import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';

export type StatCardProps = {
  url: string;
  value: string;
  icon: React.ReactNode;
  // trend: 'up' | 'down' | 'neutral';
  // data: number[];
};

function getDaysInMonth(month: number, year: number) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', {
    month: 'short',
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export default function StatCard({
  value,
  icon,
  url
}: StatCardProps) {
  const theme = useTheme();
  const daysInWeek = getDaysInMonth(4, 2024);

  const trendColors = {
    up:
      theme.palette.mode === 'light'
        ? theme.palette.success.main
        : theme.palette.success.dark,
    down:
      theme.palette.mode === 'light'
        ? theme.palette.error.main
        : theme.palette.error.dark,
    neutral:
      theme.palette.mode === 'light'
        ? theme.palette.grey[400]
        : theme.palette.grey[700],
  };

  const labelColors = {
    up: 'success' as const,
    down: 'error' as const,
    neutral: 'default' as const,
  };

  // const color = labelColors[trend];
  // const chartColor = trendColors[trend];
  // const trendValues = { up: '+25%', down: '-25%', neutral: '+5%' };

  return (
    <Link to={url} style={{ textDecoration: 'none' }}>
  <Card variant="outlined" sx={{ height: '100%', flexGrow: 1, cursor: 'pointer' }}>
    <CardContent>
      <Stack direction="column" sx={{ justifyContent: 'space-between', flexGrow: 1, gap: 1 }}>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="p">
              {value}
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ width: '100%', height: 50 }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
</Link>

  );
}
