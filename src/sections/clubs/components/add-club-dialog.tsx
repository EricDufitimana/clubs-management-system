'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { addClub } from 'src/actions/addClub';

// ----------------------------------------------------------------------

type AddClubDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  onError?: (error: string) => void;
};

export function AddClubDialog({ open, onClose, onAdd, onError }: AddClubDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !description.trim()) {
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());

    try {
      const result = await addClub(formData);
      
      if (result?.error) {
        console.error('[ADD_CLUB_DIALOG] Error:', result.error);
        if (onError) {
          onError(result.error);
        }
      } else if (result?.success) {
        // Reset form
        setName('');
        setDescription('');
        onAdd(); // Refresh the clubs list
        onClose();
      }
    } catch (error) {
      console.error('[ADD_CLUB_DIALOG] Exception:', error);
      if (onError) {
        onError('An error occurred while adding the club');
      }
    } finally {
      setLoading(false);
    }
  }, [name, description, onAdd, onClose, onError]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setName('');
      setDescription('');
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Club</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Fill in the details to create a new club.
        </DialogContentText>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Club Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!name.trim() || !description.trim() || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Adding...' : 'Add Club'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

