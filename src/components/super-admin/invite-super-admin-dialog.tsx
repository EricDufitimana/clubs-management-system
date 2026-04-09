'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

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
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

interface InviteSuperAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function InviteSuperAdminDialog({ open, onClose, onSuccess, onError }: InviteSuperAdminDialogProps) {
  const trpc = useTRPC();
  const [email, setEmail] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Fetch existing super admin invitations
  const { data: invitations, refetch: refetchInvites, isLoading: loadingInvites } = useQuery({
    ...trpc.superAdminInvites.getInvites.queryOptions(),
    enabled: open,
  });

  const createInviteMutation = useMutation({
    ...trpc.superAdminInvites.createInvite.mutationOptions(),
    onSuccess: (data) => {
      setShowSuccessAlert(true);
      setEmail('');
      refetchInvites();
      
      // Copy invitation link to clipboard
      const inviteLink = `${window.location.origin}/join-super-admin?token=${data.token}`;
      navigator.clipboard.writeText(inviteLink).then(() => {
        console.log('Invitation link copied to clipboard');
      });

      // Auto-hide success alert after 5 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      onError(error.message || 'Failed to create invitation');
    },
  });

  useEffect(() => {
    if (!open) {
      setEmail('');
      setShowSuccessAlert(false);
    }
  }, [open]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      onError('Email is required');
      return;
    }

    createInviteMutation.mutate({ email: email.trim() });
  }, [email, createInviteMutation, onError]);

  const handleClose = useCallback(() => {
    if (!createInviteMutation.isPending) {
      setEmail('');
      setShowSuccessAlert(false);
      onClose();
    }
  }, [createInviteMutation.isPending, onClose]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used': return 'success';
      case 'expired': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'used': return 'solar:check-circle-bold';
      case 'expired': return 'solar:clock-circle-bold';
      case 'pending': return 'solar:clock-circle-bold';
      default: return 'solar:help-circle-bold';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:shield-user-bold-duotone" width={28} />
          <Typography variant="h5" component="span">
            Invite Super Admin
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert 
          severity="info" 
          icon={<Iconify icon="solar:info-circle-bold" />}
          sx={{ mb: 3 }}
        >
          Send a super admin invitation to grant full system access. The invitee will receive a secure link to join as a super administrator.
        </Alert>

        {showSuccessAlert && (
          <Alert 
            severity="success" 
            icon={<Iconify icon="solar:check-circle-bold" />}
            onClose={() => setShowSuccessAlert(false)}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="body2" fontWeight="bold">
                ✅ Invitation Created Successfully!
              </Typography>
              <Typography variant="caption">
                The invitation link has been copied to your clipboard. Share it with the invitee.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Existing Invitations */}
        {loadingInvites ? (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Loading super admin invitations
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
              Super Admin Invitations ({invitations.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Token</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell><strong>Expires</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow 
                      key={invite.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        opacity: invite.status === 'used' || invite.status === 'expired' ? 0.6 : 1
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Iconify 
                            icon="solar:shield-user-bold-duotone" 
                            width={18}
                            color={invite.status === 'used' ? 'success.main' : 'text.secondary'}
                          />
                          <Typography variant="body2">
                            {invite.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Click to copy token">
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => navigator.clipboard.writeText(invite.token)}
                          >
                            <Iconify icon="solar:copy-bold" width={16} />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {invite.token.substring(0, 8)}...{invite.token.substring(invite.token.length - 8)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={invite.status.charAt(0).toUpperCase() + invite.status.slice(1)} 
                          size="small" 
                          color={getStatusColor(invite.status) as any}
                          variant={invite.status === 'pending' ? 'outlined' : 'filled'}
                          icon={<Iconify icon={getStatusIcon(invite.status)} width={16} />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invite.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invite.expires_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ mb: 3, textAlign: 'center', py: 4 }}>
            <Iconify icon="solar:inbox-in-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No super admin invitations sent yet
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }}>
          <Chip label="Send New Invitation" size="small" />
        </Divider>

        <Card 
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
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Iconify icon="solar:user-plus-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Create New Invitation</Typography>
            </Box>
            
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createInviteMutation.isPending}
                required
                sx={{ mb: 2 }}
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

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  type="submit"
                  variant="contained"
                  disabled={createInviteMutation.isPending || !email.trim()}
                  startIcon={createInviteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:paper-plane-bold" />}
                  sx={{ flex: 1 }}
                >
                  {createInviteMutation.isPending ? 'Creating...' : 'Send Invitation'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={createInviteMutation.isPending}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
