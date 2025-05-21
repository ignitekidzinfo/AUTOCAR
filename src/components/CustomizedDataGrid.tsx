import { DataGrid, DataGridProps } from '@mui/x-data-grid';
import { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { memo, useEffect, useState, useMemo, useCallback } from 'react';

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
      setLocalRows(rows);
  }, [rows]);

  const getRowClassName = useCallback((params: any) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd';
  }, []);

  const initialState = useMemo(() => ({
        pagination: { paginationModel: { pageSize: 20 } },
  }), []);

  const slotProps = useMemo(() => ({
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
  }), []);

  const pageSizeOptions = useMemo(() => [10, 20, 50], []);

  return useMemo(() => (
    <DataGrid
      autoHeight={autoHeight}
      checkboxSelection={checkboxSelection}
      rows={localRows}
      columns={columns}
      getRowClassName={getRowClassName}
      initialState={initialState}
      pageSizeOptions={pageSizeOptions}
      disableColumnResize
      density="compact"
      disableVirtualization={disableVirtualization}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      keepNonExistentRowsSelected={keepNonExistentRowsSelected}
      slotProps={slotProps}
      rowBufferPx={100}
      columnBufferPx={100}
      {...rest}
    />
  ), [
    localRows, 
    columns, 
    autoHeight, 
    checkboxSelection, 
    disableVirtualization, 
    disableRowSelectionOnClick, 
    keepNonExistentRowsSelected, 
    getRowClassName,
    initialState,
    pageSizeOptions,
    slotProps,
    rest
  ]);
});

export default CustomizedDataGrid;
