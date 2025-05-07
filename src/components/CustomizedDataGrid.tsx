import { DataGrid, DataGridProps } from '@mui/x-data-grid';
import { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { memo, useEffect, useState } from 'react';

interface CustomizedDataGridProps extends Partial<DataGridProps> {
  columns: GridColDef[]; 
  rows: GridRowsProp; 
  checkboxSelection?: boolean;
  autoHeight?: boolean;
  disableVirtualization?: boolean;
  disableRowSelectionOnClick?: boolean;
  keepNonExistentRowsSelected?: boolean;
}

const CustomizedDataGrid = memo(function CustomizedDataGrid({
  columns,
  rows,
  checkboxSelection = true,
  autoHeight = false,
  disableVirtualization = false,
  disableRowSelectionOnClick = false,
  keepNonExistentRowsSelected = false,
  ...rest
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
      disableVirtualization={disableVirtualization}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      keepNonExistentRowsSelected={keepNonExistentRowsSelected}
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
      {...rest}
    />
  );
});

export default CustomizedDataGrid;
