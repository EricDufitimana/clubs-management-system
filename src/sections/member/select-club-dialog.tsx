'use client';

import { useState, useCallback } from 'react';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

type SelectClubDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (clubId: string) => void;
  memberName: string;
  subjectOrientedClub?: {
    name: string;
    id: string;
  } | null;
  softOrientedClub?: {
    name: string;
    id: string;
  } | null;
  isLoading?: boolean;
};

export function SelectClubDialog({
  open,
  onClose,
  onConfirm,
  memberName,
  subjectOrientedClub,
  softOrientedClub,
  isLoading = false,
}: SelectClubDialogProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  const handleConfirm = useCallback(() => {
    if (selectedClubId) {
      onConfirm(selectedClubId);
      setSelectedClubId('');
    }
  }, [selectedClubId, onConfirm]);

  const handleClose = useCallback(() => {
    setSelectedClubId('');
    onClose();
  }, [onClose]);

  const hasMultipleClubs =
    (!!subjectOrientedClub && !!softOrientedClub) ||
    (!subjectOrientedClub && !softOrientedClub) === false;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mark Member as Left</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Select which club to remove <strong>{memberName}</strong> from:
          </Alert>

          {hasMultipleClubs ? (
            <RadioGroup
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              sx={{ gap: 1.5 }}
            >
              {subjectOrientedClub && (
                <FormControlLabel
                  value={subjectOrientedClub.id}
                  control={<Radio />}
                  label={`Subject Oriented: ${subjectOrientedClub.name}`}
                />
              )}
              {softOrientedClub && (
                <FormControlLabel
                  value={softOrientedClub.id}
                  control={<Radio />}
                  label={`Soft Skills: ${softOrientedClub.name}`}
                />
              )}
            </RadioGroup>
          ) : (
            <Alert severity="warning">
              This member is not assigned to any clubs yet.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleConfirm}
          disabled={!selectedClubId || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        >
          {isLoading ? 'Marking as Left...' : 'Mark as Left'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
