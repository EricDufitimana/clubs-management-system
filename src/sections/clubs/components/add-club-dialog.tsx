'use client';

import { useState, useCallback } from 'react';
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
  const [category, setCategory] = useState<'subject_oriented_clubs' | 'soft_skills_oriented_clubs'>('subject_oriented_clubs');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createClubMutation = useMutation({
    ...trpc.clubs.createClub.mutationOptions(),
    onSuccess: () => {
      // Reset form
      setName('');
      setDescription('');
      setCategory('subject_oriented_clubs');
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
      onAdd(); // Refresh the clubs list
      onClose();
    },
    onError: (error: any) => {
      console.error('[ADD_CLUB_DIALOG] Error:', error);
      if (onError) {
        onError(error.message || 'An error occurred while adding the club');
      }
    },
  });

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !description.trim()) {
      return;
    }

    createClubMutation.mutate({
      club_name: name.trim(),
      club_description: description.trim(),
      category: category,
    });
  }, [name, description, category, createClubMutation]);

  const handleClose = useCallback(() => {
    if (!createClubMutation.isPending) {
      setName('');
      setDescription('');
      setCategory('subject_oriented_clubs');
      onClose();
    }
  }, [createClubMutation.isPending, onClose]);

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
            disabled={createClubMutation.isPending}
          />
          <FormControl fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as 'subject_oriented_clubs' | 'soft_skills_oriented_clubs')}
              disabled={createClubMutation.isPending}
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
            disabled={createClubMutation.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createClubMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!name.trim() || !description.trim() || createClubMutation.isPending}
          startIcon={createClubMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {createClubMutation.isPending ? 'Adding...' : 'Add Club'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

