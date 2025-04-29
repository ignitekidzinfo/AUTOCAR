import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

interface CustomizedDataGridProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  pageSize?: number;
  checkboxSelection?: boolean;
  disableSelectionOnClick?: boolean;
}

export default function CustomizedDataGrid({
  rows,
  columns,
  pageSize = 10,
  checkboxSelection = false,
  disableSelectionOnClick = true,
}: CustomizedDataGridProps) {
  const [localRows, setLocalRows] = useState<GridRowsProp>([]);
  
  useEffect(() => {
    if (Array.isArray(rows) && rows.length > 0) {
      // Ensure each row has an id
      const processedRows = rows.map((row, index) => ({
        ...row,
        id: row.id || row.vehicleRegId || `row-${index}`,
      }));
      console.log('Updating grid with processed rows:', processedRows);
      setLocalRows(processedRows);
    } else {
      console.log('No rows provided or empty array');
      setLocalRows([]);
    }
  }, [rows]);

  return (
    <Box sx={{
      width: '100%',
      '& .MuiDataGrid-cell': {
        whiteSpace: 'normal',
        lineHeight: 'normal',
        padding: '8px',
        '&:focus': {
          outline: 'none',
        },
      },
      '& .MuiDataGrid-row': {
        minHeight: '52px !important',
      },
    }}>
      <DataGrid
        rows={localRows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: pageSize },
          },
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableSelectionOnClick}
        autoHeight
        getRowHeight={() => 'auto'}
        sx={{
          '& .MuiDataGrid-cell--textLeft': {
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          },
        }}
      />
    </Box>
  );
} 