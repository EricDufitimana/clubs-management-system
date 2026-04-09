'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

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
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';
import { generateAndSendInvites } from '@/actions/generateInvites';

// ----------------------------------------------------------------------

type LeaderInvite = {
  id: string;
  position: string;
  email: string;
};

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
  const trpc = useTRPC();
  const [leaders, setLeaders] = useState<LeaderInvite[]>([
    { id: '1', position: 'President', email: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Fetch existing invitations
  const { data: invitations, refetch: refetchInvites, isLoading: loadingInvites } = useQuery({
    ...trpc.clubs.getClubInvites.queryOptions({ clubId }),
    enabled: open && !!clubId,
  });

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setLeaders([{ id: '1', position: 'President', email: '' }]);
      setShowSuccessAlert(false);
    }
  }, [open]);

  const addLeader = useCallback(() => {
    const newId = (Math.max(...leaders.map(l => parseInt(l.id, 10))) + 1).toString();
    setLeaders([...leaders, { id: newId, position: '', email: '' }]);
  }, [leaders]);

  const removeLeader = useCallback((id: string) => {
    if (leaders.length > 1) {
      setLeaders(leaders.filter(l => l.id !== id));
    }
  }, [leaders]);

  const updateLeader = useCallback((id: string, field: 'position' | 'email', value: string) => {
    setLeaders(leaders.map(l => l.id === id ? { ...l, [field]: value } : l));
  }, [leaders]);

  const handleSubmit = useCallback(async () => {
    // Filter out empty entries
    const validLeaders = leaders.filter(l => l.position.trim() && l.email.trim());

    if (validLeaders.length === 0) {
      if (onError) {
        onError('Please provide at least one position and email address');
      }
      return;
    }

    // Check for duplicate positions
    const positions = validLeaders.map(l => l.position.toLowerCase());
    const duplicates = positions.filter((p, i) => positions.indexOf(p) !== i);
    if (duplicates.length > 0) {
      if (onError) {
        onError('Duplicate positions are not allowed');
      }
      return;
    }

    setLoading(true);
    setShowSuccessAlert(false);

    try {
      // Send the position title directly as the role
      const invites = validLeaders.map(leader => ({
        role: leader.position.trim(), // Position title goes directly to role
        email: leader.email.trim(),
      }));

      const result = await generateAndSendInvites(clubId, invites);
      
      if (result.error) {
        if (onError) {
          onError(result.error);
        }
      } else if (result.results) {
        // Show success alert
        setShowSuccessAlert(true);
        
        // Clear the form for new invitations
        setLeaders([{ id: '1', position: '', email: '' }]);
        
        // Refetch invitations to show the new ones
        refetchInvites();
        
        // Auto-hide success alert after 5 seconds
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 5000);
        
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
  }, [clubId, leaders, onSuccess, onError, refetchInvites]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  const hasValidLeader = leaders.some(l => l.position.trim() && l.email.trim());

  // No need to format - role now contains the position title directly

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:user-plus-bold-duotone" width={28} />
          <Typography variant="h5" component="span">
            Invite Club Leaders
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {clubName && (
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />} sx={{ mb: 3 }}>
            Send leadership invitations for <strong>{clubName}</strong>. Each invited leader will receive a personalized email with registration instructions.
          </Alert>
        )}

        {showSuccessAlert && (
          <Alert 
            severity="success" 
            icon={<Iconify icon="solar:check-circle-bold" />}
            onClose={() => setShowSuccessAlert(false)}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="body2" fontWeight="bold">
                Invitations Sent Successfully!
              </Typography>
              <Typography variant="caption">
                New invitations have been sent. You can send more below.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Existing Invitations */}
        {loadingInvites ? (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Loading sent invitations
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: '20px',
                    textAlign: 'left',
                    '@keyframes ellipsis': {
                      '0%': { content: '"."' },
                      '33%': { content: '".."' },
                      '66%': { content: '"..."' },
                    },
                    '&::after': {
                      content: '"."',
                      animation: 'ellipsis 1.5s infinite',
                    }
                  }}
                />
              </Typography>
            </Box>
          </Box>
        ) : invitations && invitations.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:history-bold-duotone" width={24} />
              Sent Invitations ({invitations.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Position</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Sent On</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow 
                      key={invite.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        opacity: invite.isUsed || invite.isExpired ? 0.6 : 1
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Iconify 
                            icon="solar:medal-star-bold-duotone" 
                            width={18}
                            color={invite.isUsed ? 'success.main' : 'text.secondary'}
                          />
                          {invite.role}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {invite.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {invite.isUsed ? (
                          <Chip 
                            label="Accepted" 
                            size="small" 
                            color="success"
                            icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                          />
                        ) : invite.isExpired ? (
                          <Chip 
                            label="Expired" 
                            size="small" 
                            color="error"
                            variant="outlined"
                            icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                          />
                        ) : (
                          <Chip 
                            label="Pending" 
                            size="small" 
                            color="warning"
                            variant="outlined"
                            icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invite.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        <Divider sx={{ my: 3 }}>
          <Chip label="Send New Invitations" size="small" />
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
                zIndex: 10,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Sending Invitations
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: '30px',
                      textAlign: 'left',
                      '@keyframes ellipsis': {
                        '0%': { content: '"."' },
                        '33%': { content: '".."' },
                        '66%': { content: '"..."' },
                      },
                      '&::after': {
                        content: '"."',
                        animation: 'ellipsis 1.5s infinite',
                      }
                    }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please wait while we send the emails
                </Typography>
              </Box>
            </Box>
          )}
          
          {leaders.map((leader, index) => (
            <Card 
              key={leader.id}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 2,
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Chip 
                    label={`Leader ${index + 1}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {leaders.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeLeader(leader.id)}
                      disabled={loading}
                      sx={{ 
                        ml: 'auto',
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.lighter'
                        }
                      }}
                    >
                      <Iconify icon="solar:trash-bin-minimalistic-bold" width={20} />
                    </IconButton>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Position Title"
                    placeholder="e.g., President, Vice President"
                    value={leader.position}
                    onChange={(e) => updateLeader(leader.id, 'position', e.target.value)}
                    disabled={loading}
                    size="small"
                    sx={{ flex: '1 1 200px' }}
                    InputProps={{
                      startAdornment: (
                        <Iconify 
                          icon="solar:medal-star-bold-duotone" 
                          width={20}
                          sx={{ mr: 1, color: 'text.disabled' }}
                        />
                      ),
                    }}
                  />
                  
                  <TextField
                    label="Email Address"
                    type="email"
                    placeholder="leader@example.com"
                    value={leader.email}
                    onChange={(e) => updateLeader(leader.id, 'email', e.target.value)}
                    disabled={loading}
                    size="small"
                    sx={{ flex: '1 1 250px' }}
                    InputProps={{
                      startAdornment: (
                        <Iconify 
                          icon="solar:letter-bold-duotone" 
                          width={20}
                          sx={{ mr: 1, color: 'text.disabled' }}
                        />
                      ),
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={24} />}
            onClick={addLeader}
            disabled={loading}
            sx={{ 
              borderStyle: 'dashed',
              borderWidth: 2,
              py: 1.5,
              '&:hover': {
                borderStyle: 'dashed',
                borderWidth: 2,
                bgcolor: 'action.hover'
              }
            }}
          >
            Add Another Leader
          </Button>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Close
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !hasValidLeader}
          startIcon={loading && <CircularProgress size={20} color="inherit" />  }
        >
          {loading ? 'Sending Invitations...' : 'Send Invitations'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
