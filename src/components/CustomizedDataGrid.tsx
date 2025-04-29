import { DataGrid } from '@mui/x-data-grid';
import { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

interface CustomizedDataGridProps {
  columns: GridColDef[]; 
  rows: GridRowsProp; 
  checkboxSelection?: boolean;
  autoHeight?: boolean;
}

export default function CustomizedDataGrid({
  columns,
  rows,
  checkboxSelection = true,
  autoHeight = false,
}: CustomizedDataGridProps) {
  const [localRows, setLocalRows] = useState<GridRowsProp>(rows);
  
  useEffect(() => {
    console.log('CustomizedDataGrid received new rows:', rows);
    setLocalRows(rows);
  }, [rows]);

  return (
    <DataGrid
      autoHeight={autoHeight}
      checkboxSelection={checkboxSelection}
      rows={localRows}
      columns={columns}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
      pageSizeOptions={[10, 20, 50]}
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
  );
}
