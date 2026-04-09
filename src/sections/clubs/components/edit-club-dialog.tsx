'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { useTRPC } from '@/trpc/client';

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
  const [category, setCategory] = useState<'subject_oriented_clubs' | 'soft_skills_oriented_clubs'>('subject_oriented_clubs');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Update form when club changes
  useEffect(() => {
    if (club) {
      setName(club.name);
      setDescription(club.description);
      setCategory(club.category || 'subject_oriented_clubs');
    }
  }, [club]);

  const updateClubMutation = useMutation({
    ...trpc.clubs.updateClub.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
      onEdit(); // Refresh the clubs list
      onClose();
    },
    onError: (error: any) => {
      console.error('[EDIT_CLUB_DIALOG] Error:', error);
      if (onError) {
        onError(error.message || 'An error occurred while updating the club');
      }
    },
  });

  const handleSubmit = useCallback(() => {
    if (!club || !name.trim() || !description.trim()) {
      return;
    }

    updateClubMutation.mutate({
      clubId: club.id,
      club_name: name.trim(),
      club_description: description.trim(),
      category: category,
    });
  }, [club, name, description, category, updateClubMutation]);

  const handleClose = useCallback(() => {
    if (!updateClubMutation.isPending) {
      onClose();
    }
  }, [updateClubMutation.isPending, onClose]);

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
            disabled={updateClubMutation.isPending}
          />
          <FormControl fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as 'subject_oriented_clubs' | 'soft_skills_oriented_clubs')}
              disabled={updateClubMutation.isPending}
            >
              <MenuItem value="subject_oriented_clubs">Subject Oriented</MenuItem>
              <MenuItem value="soft_skills_oriented_clubs">Soft Skills Oriented</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={updateClubMutation.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateClubMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!name.trim() || !description.trim() || updateClubMutation.isPending}
          startIcon={updateClubMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {updateClubMutation.isPending ? 'Updating...' : 'Update Club'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

