import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import apiClient from 'Services/apiService';
import CircularProgress from '@mui/material/CircularProgress';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  deleteItemId?: number;
  onDeleteSuccess?: (id: number) => void;
  isDeleting?: boolean;
  error?: string | null;
}

export default function VehicleDeleteModal({
  open,
  onClose,
  deleteItemId,
  onDeleteSuccess,
  isDeleting = false,
  error = null,
}: DeleteModalProps) {
  const handleDeleteRequest = async () => {
    if (deleteItemId === undefined) {
      console.error("Delete ID is undefined");
      return;
    }
    try {
      await apiClient.delete(`/vehicle-reg/delete?vehicleRegId=${deleteItemId}`);
      if (onDeleteSuccess) onDeleteSuccess(deleteItemId);
      onClose();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Delete Vehicle
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {deleteItemId !== undefined
              ? `Are you sure you want to delete this vehicle?`
              : "No vehicle selected for deletion."}
          </Typography>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteRequest}
              disabled={deleteItemId === undefined || isDeleting}
            >
              {isDeleting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
            <Button variant="outlined" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
