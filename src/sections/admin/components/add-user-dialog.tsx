'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { addUser } from 'src/actions/addUser';

// ----------------------------------------------------------------------

type AddUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  onError?: (error: string) => void;
};

export function AddUserDialog({ open, onClose, onAdd, onError }: AddUserDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      if (onError) {
        onError('Please fill in all required fields');
      }
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      if (onError) {
        onError('Please enter a valid email address');
      }
      return;
    }

    // Password validation
    if (password.length < 6) {
      if (onError) {
        onError('Password must be at least 6 characters long');
      }
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('email', email.trim());
    formData.append('password', password);
    formData.append('role', role);

    try {
      const result = await addUser(formData);
      
      if (result?.error) {
        console.error('[ADD_USER_DIALOG] Error:', result.error);
        if (onError) {
          onError(result.error);
        }
      } else if (result?.success) {
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setRole('admin');
        onAdd();
        onClose();
      }
    } catch (error) {
      console.error('[ADD_USER_DIALOG] Exception:', error);
      if (onError) {
        onError('An error occurred while adding the user');
      }
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, email, password, role, onAdd, onClose, onError]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('admin');
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Fill in the details to create a new user account.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              disabled={loading}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Adding...' : 'Add User'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
}

