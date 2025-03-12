import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {  GridColDef, GridRowsProp } from '@mui/x-data-grid';

interface CustomizedDataGridProps {
  columns: GridColDef[]; // Columns type
  rows: GridRowsProp; // Rows type
  checkboxSelection? : boolean;

}

export default function CustomizedDataGrid({columns ,rows ,checkboxSelection = true} : CustomizedDataGridProps) {
  return (
    <DataGrid
      checkboxSelection ={checkboxSelection}
      rows={rows}
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
