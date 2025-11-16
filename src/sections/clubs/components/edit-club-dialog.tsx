'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { editClub } from 'src/actions/editClub';

import type { ClubProps } from '../club-table-row';

// ----------------------------------------------------------------------

type EditClubDialogProps = {
  open: boolean;
  club: ClubProps | null;
  onClose: () => void;
  onEdit: () => void;
  onError?: (error: string) => void;
};

export function EditClubDialog({ open, club, onClose, onEdit, onError }: EditClubDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Update form when club changes
  useEffect(() => {
    if (club) {
      setName(club.name);
      setDescription(club.description);
    }
  }, [club]);

  const handleSubmit = useCallback(async () => {
    if (!club || !name.trim() || !description.trim()) {
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());

    try {
      const result = await editClub(club.id, formData);
      
      if (result?.error) {
        console.error('[EDIT_CLUB_DIALOG] Error:', result.error);
        if (onError) {
          onError(result.error);
        }
      } else if (result?.success) {
        onEdit(); // Refresh the clubs list
        onClose();
      }
    } catch (error) {
      console.error('[EDIT_CLUB_DIALOG] Exception:', error);
      if (onError) {
        onError('An error occurred while updating the club');
      }
    } finally {
      setLoading(false);
    }
  }, [club, name, description, onEdit, onClose, onError]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Club</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Update the club details.
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
          {loading ? 'Updating...' : 'Update Club'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

