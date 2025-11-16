'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { generateAndSendInvites } from 'src/actions/generateInvites';

// ----------------------------------------------------------------------

type InviteOfficersDialogProps = {
  open: boolean;
  clubId: string;
  clubName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export function InviteOfficersDialog({ 
  open, 
  clubId, 
  clubName,
  onClose, 
  onSuccess,
  onError 
}: InviteOfficersDialogProps) {
  const [presidentEmail, setPresidentEmail] = useState('');
  const [vicePresidentEmail, setVicePresidentEmail] = useState('');
  const [secretaryEmail, setSecretaryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setPresidentEmail('');
      setVicePresidentEmail('');
      setSecretaryEmail('');
      setResults([]);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const invites = [
      { role: 'president' as const, email: presidentEmail.trim() },
      { role: 'vice_president' as const, email: vicePresidentEmail.trim() },
      { role: 'secretary' as const, email: secretaryEmail.trim() }
    ].filter(invite => invite.email); // Only send if email provided

    if (invites.length === 0) {
      if (onError) {
        onError('Please provide at least one email address');
      }
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const result = await generateAndSendInvites(clubId, invites);
      
      if (result.error) {
        if (onError) {
          onError(result.error);
        }
      } else if (result.results) {
        setResults(result.results);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('[INVITE_DIALOG] Exception:', error);
      if (onError) {
        onError('An error occurred while sending invitations');
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, presidentEmail, vicePresidentEmail, secretaryEmail, onSuccess, onError]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Invite Club Officers</DialogTitle>
      <DialogContent>
        {clubName && (
          <DialogContentText sx={{ mb: 3 }}>
            Send invitations to officers for <strong>{clubName}</strong>
          </DialogContentText>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* President */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              President
            </Typography>
            <TextField
              fullWidth
              type="email"
              label="Email address"
              value={presidentEmail}
              onChange={(e) => setPresidentEmail(e.target.value)}
              disabled={loading}
              size="small"
            />
          </Box>
          
          {/* Vice President */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Vice President
            </Typography>
            <TextField
              fullWidth
              type="email"
              label="Email address"
              value={vicePresidentEmail}
              onChange={(e) => setVicePresidentEmail(e.target.value)}
              disabled={loading}
              size="small"
            />
          </Box>
          
          {/* Secretary */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Secretary
            </Typography>
            <TextField
              fullWidth
              type="email"
              label="Email address"
              value={secretaryEmail}
              onChange={(e) => setSecretaryEmail(e.target.value)}
              disabled={loading}
              size="small"
            />
          </Box>
        </Box>

        {/* Results */}
        {results.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Invitations Sent:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {results.map((result, index) => (
                <Alert 
                  key={index}
                  severity={result.emailSent ? 'success' : 'error'}
                  sx={{ py: 0.5 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {result.role === 'vice_president' ? 'Vice President' : result.role.charAt(0).toUpperCase() + result.role.slice(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.email}
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight="bold">
                      {result.emailSent ? '✓ Sent' : '✗ Failed'}
                    </Typography>
                  </Box>
                  {result.emailError && (
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {result.emailError}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {results.length > 0 ? 'Close' : 'Cancel'}
        </Button>
        {results.length === 0 && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || (!presidentEmail.trim() && !vicePresidentEmail.trim() && !secretaryEmail.trim())}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Sending...' : 'Send Invitations'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

