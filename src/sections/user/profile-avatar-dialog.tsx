'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTRPC } from '@/trpc/client';
import { useCurrentUser } from '@/hooks/use-current-user';

// ----------------------------------------------------------------------

const AVATARS = Array.from({ length: 25 }, (_, i) => `/assets/images/avatar/avatar-${i + 1}.webp`);

type ProfileAvatarDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileAvatarDialog({ open, onClose }: ProfileAvatarDialogProps) {
  const { user, refetch } = useCurrentUser();
  const trpc = useTRPC();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const updateAvatarMutation = useMutation({
    ...trpc.auth.updateUserAvatar.mutationOptions(),
    onSuccess: () => {
      refetch();
      onClose();
    },
  });

  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleSave = () => {
    if (selectedAvatar) {
      updateAvatarMutation.mutate({ avatarUrl: selectedAvatar });
    }
  };

  const currentAvatar = selectedAvatar || user?.avatarUrl;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, textAlign: 'center', typography: 'h5' }}>
        Choose Your Avatar
      </DialogTitle>
      
      <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 2 }}>
        Select an avatar that represents you
      </Typography>

      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            justifyItems: 'center',
          }}
        >
          {AVATARS.map((avatar) => {
            const isSelected = currentAvatar === avatar;

            return (
              <Box
                key={avatar}
                onClick={() => handleSelectAvatar(avatar)}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(isSelected ? {
                    transform: 'scale(1.15)',
                    boxShadow: (theme) => `0 0 0 4px ${theme.vars.palette.background.paper}, 0 8px 24px -4px ${theme.vars.palette.primary.main}`,
                    zIndex: 1,
                  } : {
                    opacity: 0.7,
                    transform: 'scale(0.95)',
                    '&:hover': {
                      opacity: 1,
                      transform: 'scale(1.05)',
                      zIndex: 1,
                    },
                  }),
                }}
              >
                <Avatar
                  src={avatar}
                  sx={{ 
                    width: '100%', 
                    height: '100%',
                    border: (theme) => isSelected ? `3px solid ${theme.vars.palette.primary.main}` : 'none',
                    bgcolor: 'grey.200',
                  }}
                />
                
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.contrastText',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      '@keyframes popIn': {
                        '0%': { transform: 'scale(0)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!selectedAvatar || updateAvatarMutation.isPending}
            sx={{ px: 4 }}
        >
          {updateAvatarMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
