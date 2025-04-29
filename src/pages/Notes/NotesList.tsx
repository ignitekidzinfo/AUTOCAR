import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Divider,
  Dialog,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  SelectChangeEvent,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  FormLabel,
  TextField,
  InputAdornment,
  CardActionArea,
  DialogContent,
  DialogTitle,
  DialogActions,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Close as CloseIcon, 
  Search as SearchIcon,
  Notes as NotesIcon,
  FileCopy as FileCopyIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import apiClient from 'Services/apiService';

interface ManageNoteDto {
  manageNoteId?: number;
  selectNoteOn: string;
  writeNote: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Get icon based on note type
const getNoteTypeIcon = (type: string) => {
  switch (type) {
    case 'Quotation':
      return <FileCopyIcon fontSize="small" />;
    case 'Job Card':
      return <AssignmentIcon fontSize="small" />;
    case 'Sale Invoice':
      return <DescriptionIcon fontSize="small" />;
    case 'Counter Sale':
      return <LocalOfferIcon fontSize="small" />;
    default:
      return <LocalOfferIcon fontSize="small" />;
  }
};

// Get color based on note type
const getNoteTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'info' => {
  switch (type) {
    case 'Quotation':
      return 'primary';
    case 'Job Card':
      return 'secondary';
    case 'Sale Invoice':
      return 'success';
    case 'Counter Sale':
      return 'info';
    default:
      return 'info';
  }
};

const NotesList: React.FC = () => {
  const theme = useTheme();
  const [notes, setNotes] = useState<ManageNoteDto[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<ManageNoteDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<ManageNoteDto>({ selectNoteOn: '', writeNote: '' });
  const [viewNote, setViewNote] = useState<ManageNoteDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

  // Fetch notes from API
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/manageNotes/all?_t=${timestamp}`) as any;
      const payload = response.data;

      if (Array.isArray(payload)) {
        setNotes(payload);
        setFilteredNotes(payload);
      } else if (payload?.data && Array.isArray(payload.data)) {
        setNotes(payload.data);
        setFilteredNotes(payload.data);
      } else {
        throw new Error('Unexpected data format from server');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching notes');
      setNotes([]);
      setFilteredNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = notes.filter(note => 
      note.writeNote.toLowerCase().includes(query) || 
      note.selectNoteOn.toLowerCase().includes(query) ||
      (note.manageNoteId?.toString().includes(query))
    );
    
    setFilteredNotes(filtered);
  }, [searchQuery, notes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddNote = () => {
    setCurrentNote({ selectNoteOn: '', writeNote: '' });
    setOpenDialog(true);
  };

  const handleEditNote = (note: ManageNoteDto) => {
    setCurrentNote({ ...note });
    setOpenDialog(true);
  };

  const handleViewNote = (note: ManageNoteDto) => {
    setViewNote(note);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewNote(null);
  };

  const handleDeleteNote = async (id?: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent card click when clicking delete
    }
    
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.delete(`/manageNotes/delete?id=${id}&_t=${timestamp}`) as any;
      const success = response.data?.success;

      if (success) {
        // Optimistic UI update - immediately remove the note from the list
        setNotes(prev => prev.filter(note => note.manageNoteId !== id));
        
        setSuccessMessage('Note deleted successfully');
        setOpenSnackbar(true);
      } else {
        throw new Error(response.data?.message || 'Delete failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error deleting note');
      setOpenSnackbar(true);
      // Refresh to ensure UI and server are in sync after error
      fetchNotes();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.writeNote || !currentNote.selectNoteOn) {
      setError('Please fill all required fields');
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    // 1. First close the dialog to ensure it disappears immediately
    setOpenDialog(false);
    
    try {
      const timestamp = new Date().getTime();
      let response: any;

      if (currentNote.manageNoteId) {
        // Update existing note
        response = await apiClient.put(
          `/manageNotes/update?id=${currentNote.manageNoteId}&_t=${timestamp}`,
          currentNote
        );
        
        if (response.data?.success) {
          // Immediately update the UI with the edited note
          setNotes(prev => 
            prev.map(note => note.manageNoteId === currentNote.manageNoteId 
              ? {...currentNote} 
              : note
            )
          );
          setSuccessMessage('Note updated successfully');
        } else {
          throw new Error(response.data?.message || 'Update failed');
        }
      } else {
        // Create new note
        response = await apiClient.post(
          `/manageNotes/create?_t=${timestamp}`,
          currentNote
        );
        
        if (response.data?.success) {
          // Get the new note ID from the response
          const newNoteId = response.data?.data?.manageNoteId;
          
          if (newNoteId) {
            // Add the new note to the state
            const newNote = {...currentNote, manageNoteId: newNoteId};
            setNotes(prev => [...prev, newNote]);
            setSuccessMessage('Note created successfully');
          } else {
            // Fallback if we don't get the ID back
            await fetchNotes();
            setSuccessMessage('Note created successfully');
          }
        } else {
          throw new Error(response.data?.message || 'Create failed');
        }
      }
      
      setOpenSnackbar(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving note');
      setOpenSnackbar(true);
      // Refresh in case of error
      fetchNotes();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentNote(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentNote(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleEditFromView = () => {
    if (viewNote) {
      setCurrentNote({ ...viewNote });
      setOpenViewDialog(false);
      setOpenDialog(true);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            background: `linear-gradient(to right, #8B0000, #440000)`,
            color: 'white'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <NotesIcon sx={{ fontSize: 36, mr: 2 }} />
              <Typography variant="h4" fontWeight="bold">Notes Manager</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNote}
              disabled={loading}
              sx={{ 
                borderRadius: 2, 
                boxShadow: 3,
                px: 3,
                py: 1,
                fontWeight: 'bold',
                backgroundColor: '#ff5722',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#e64a19'
                }
              }}
            >
              Add Note
            </Button>
          </Box>
        </Paper>

        {/* Search Box */}
        <Paper
          elevation={2}
          sx={{ 
            p: 0.5, 
            mb: 4, 
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notes by content, type or ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 2,
                '& fieldset': {
                  border: 'none'
                }
              }
            }}
            sx={{ m: 0 }}
          />
        </Paper>

        {error && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
            <Typography>{error}</Typography>
          </Paper>
        )}

        {loading && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!loading && filteredNotes.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: theme.palette.grey[50] }}>
            <NotesIcon sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              {searchQuery ? "No notes match your search criteria." : "No notes yet. Click \"Add Note\" to create."}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredNotes.map(note => (
              <Grid item xs={12} sm={6} md={4} key={`note-${note.manageNoteId}`}>
                <Card 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 8
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      backgroundColor: (() => {
                        const colorType = getNoteTypeColor(note.selectNoteOn);
                        return theme.palette[colorType].main;
                      })()
                    }
                  }} 
                  elevation={3}
                >
                  <CardActionArea 
                    onClick={() => handleViewNote(note)}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1, pt: 3 }}>
                      <Chip
                        icon={getNoteTypeIcon(note.selectNoteOn)}
                        label={note.selectNoteOn}
                        size="small"
                        color={getNoteTypeColor(note.selectNoteOn)}
                        sx={{ mb: 2, fontWeight: 'medium' }}
                      />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.5em',
                          maxHeight: '4.5em' // 3 lines x 1.5em
                        }}
                      >
                        {note.writeNote}
                      </Typography>
                      {note.manageNoteId && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          ID: {note.manageNoteId}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                  <Divider />
                  <CardActions sx={{ p: 1, justifyContent: 'space-between', bgcolor: theme.palette.grey[50] }}>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(note);
                          }} 
                          disabled={loading}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          onClick={(e) => handleDeleteNote(note.manageNoteId, e)} 
                          disabled={loading}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Tooltip title="Click to view full note">
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pr: 1 }}>
                        Click to view
                      </Typography>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* View Note Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        {viewNote && (
          <>
            <DialogTitle sx={{ 
              p: 0, 
              bgcolor: (() => {
                const colorType = getNoteTypeColor(viewNote.selectNoteOn);
                return theme.palette[colorType].main;
              })(), 
              color: 'white' 
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.3)' }}>
                    {getNoteTypeIcon(viewNote.selectNoteOn)}
                  </Avatar>
                  <Typography variant="h6">
                    View {viewNote.selectNoteOn} Note
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseViewDialog} edge="end" sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 2 }}>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom fontWeight="medium">
                  NOTE TYPE
                </Typography>
                <Chip
                  icon={getNoteTypeIcon(viewNote.selectNoteOn)}
                  label={viewNote.selectNoteOn}
                  color={getNoteTypeColor(viewNote.selectNoteOn)}
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom fontWeight="medium">
                  NOTE CONTENT
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    maxHeight: '300px', 
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    borderRadius: 2,
                    bgcolor: theme.palette.grey[50]
                  }}
                >
                  <Typography variant="body1" lineHeight={1.7}>
                    {viewNote.writeNote}
                  </Typography>
                </Paper>
              </Box>
              {viewNote.manageNoteId && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom fontWeight="medium">
                    NOTE ID
                  </Typography>
                  <Chip 
                    label={viewNote.manageNoteId} 
                    variant="outlined" 
                    size="small" 
                  />
                </Box>
              )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button 
                onClick={handleCloseViewDialog} 
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleEditFromView}
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2 }}
              >
                Edit Note
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Note Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 0, 
          bgcolor: currentNote.manageNoteId ? theme.palette.primary.main : theme.palette.secondary.main, 
          color: 'white' 
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            <Typography variant="h6">
              {currentNote.manageNoteId ? 'Edit Note' : 'Add New Note'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Note On *</InputLabel>
            <Select
              name="selectNoteOn"
              value={currentNote.selectNoteOn}
              onChange={handleSelectChange}
              label="Select Note On *"
              required
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="Quotation">Quotation</MenuItem>
              <MenuItem value="Job Card">Job Card</MenuItem>
              <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
              <MenuItem value="Counter Sale">Counter Sale</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <FormLabel required sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
              Write Note *
            </FormLabel>
            <textarea
              name="writeNote"
              value={currentNote.writeNote}
              onChange={handleInputChange}
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'black',
                backgroundColor: 'white',
                resize: 'vertical', // Allow vertical resizing only
                fontFamily: 'inherit',
                minHeight: '150px',
                lineHeight: '1.5'
              }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color={currentNote.manageNoteId ? 'primary' : 'secondary'}
            onClick={handleSaveNote} 
            disabled={!currentNote.writeNote || !currentNote.selectNoteOn || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <></>}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Saving...' : (currentNote.manageNoteId ? 'Update Note' : 'Save Note')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={5000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={successMessage ? 'success' : 'error'}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {successMessage || error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotesList;

 