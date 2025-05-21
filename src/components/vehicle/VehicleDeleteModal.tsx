import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import apiClient from 'Services/apiService';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect, useState } from 'react';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  deleteItemId?: number;
  onDeleteSuccess?: (id: number) => void;
  onConfirm?: () => Promise<void>;
  isDeleting?: boolean;
  error?: string | null;
}

export default function VehicleDeleteModal({
  open,
  onClose,
  deleteItemId,
  onDeleteSuccess,
  onConfirm,
  isDeleting = false,
  error = null,
}: DeleteModalProps) {
  const [localIsDeleting, setLocalIsDeleting] = useState(isDeleting);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setLocalIsDeleting(isDeleting);
      setLocalError(error);
    }
  }, [open, isDeleting, error]);

  const handleDeleteRequest = async () => {
    if (onConfirm) {
      await onConfirm();
      return;
    }
    
    if (deleteItemId === undefined) {
      console.error("Delete ID is undefined");
      setLocalError("No vehicle selected for deletion");
      return;
    }

    // Set deleting state immediately for UI feedback
    setLocalIsDeleting(true);
    
    try {
      // First update the UI optimistically
      if (onDeleteSuccess) {
        // Call success handler immediately to update UI
        setTimeout(() => {
          onDeleteSuccess(deleteItemId);
        }, 0);
      }
      
      // Then make the API call in parallel
      apiClient.delete(`/vehicle-reg/delete?vehicleRegId=${deleteItemId}`, {
        timeout: 5000 // Add timeout to prevent long-running requests
      })
      .then(() => {
        console.log(`Vehicle ${deleteItemId} deleted successfully`);
      })
      .catch(err => {
        console.error("Error during background deletion:", err);
        // Even if API fails, we already updated UI, so not showing error
      });
      
      // Close the modal immediately
      onClose();
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      setLocalIsDeleting(false);
      setLocalError(error.response?.data?.message || "Failed to delete vehicle");
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
            {deleteItemId !== undefined || onConfirm
              ? `Are you sure you want to delete this vehicle?`
              : "No vehicle selected for deletion."}
          </Typography>
          {(localError || error) && (
            <Typography color="error" sx={{ mt: 2 }}>
              {localError || error}
            </Typography>
          )}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteRequest}
              disabled={(deleteItemId === undefined && !onConfirm) || localIsDeleting || isDeleting}
            >
              {localIsDeleting || isDeleting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
            <Button variant="outlined" onClick={onClose} disabled={localIsDeleting || isDeleting}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
