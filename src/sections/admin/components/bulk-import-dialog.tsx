'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha, useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  clubId?: string;
}

interface ImportResult {
  success: boolean;
  summary: {
    totalExtracted: number;
    totalMatched: number;
    availableToAdd: number;
    successfullyAdded: number;
    alreadyMembers: number;
    categoryConflicts: number;
    unmatched: number;
  };
  results: {
    added: Array<{
      studentId: string;
      name: string;
      extractedName: string;
      matchScore: number;
    }>;
    conflicts: Array<{
      studentId: string;
      name: string;
      extractedName: string;
      matchScore: number;
    }>;
    categoryConflicts: Array<{
      studentId: string;
      name: string;
      extractedName: string;
      matchScore: number;
    }>;
    unmatched: string[];
  };
}

export function BulkImportDialog({ 
  open, 
  onClose, 
  onSuccess, 
  onError, 
  clubId 
}: BulkImportDialogProps) {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const bulkImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clubId', clubId || '');

      const response = await fetch('/api/admin/members/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import members');
      }

      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setShowResults(true);
      
      // Invalidate members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: trpc.users.getUsersByClub.queryKey({ clubId: clubId || undefined }),
      });

      const message = `Successfully imported ${data.summary.successfullyAdded} members! ${
        data.summary.alreadyMembers > 0 
          ? `${data.summary.alreadyMembers} were already members.` 
          : ''
      } ${
        data.summary.categoryConflicts > 0 
          ? `${data.summary.categoryConflicts} are already members of a club in the same category.` 
          : ''
      } ${
        data.summary.unmatched > 0 
          ? `${data.summary.unmatched} names could not be matched.` 
          : ''
      }`;

      onSuccess(message);
    },
    onError: (error: any) => {
      onError(error.message || 'Failed to import members');
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (selectedFile && clubId) {
      bulkImportMutation.mutate(selectedFile);
    }
  }, [selectedFile, clubId, bulkImportMutation]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
    setShowResults(false);
    bulkImportMutation.reset();
    onClose();
  }, [onClose, bulkImportMutation]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Bulk Import Members</Typography>
          <IconButton onClick={handleClose} size="small">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showResults ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload an Excel, CSV, PDF, or Word document containing member names. 
              The system will automatically extract and match names with existing student records.
            </Typography>

            {/* File Upload Area */}
            <Box
              sx={{
                border: `2px dashed ${dragActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.8)}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: dragActive 
                  ? alpha(theme.palette.primary.main, 0.04)
                  : theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.5)
                    : alpha(theme.palette.grey[50], 0.8),
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: dragActive 
                    ? alpha(theme.palette.primary.main, 0.08)
                    : theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.primary.main, 0.04),
                  borderColor: theme.palette.primary.main,
                },
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.pdf,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <Iconify 
                icon="solar:cloud-upload-outline" 
                width={48} 
                height={48} 
                color="primary.main"
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" gutterBottom>
                {dragActive ? 'Drop file here' : 'Choose file or drag and drop'}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Supported formats: Excel (.xlsx, .xls), CSV, PDF, Word (.docx)
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            {/* Selected File Info */}
            {selectedFile && (
              <Box sx={{ mt: 3 }}>
                <Alert 
                  severity="info" 
                  action={
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedFile(null)}
                    >
                      <Iconify icon="mingcute:close-line" />
                    </IconButton>
                  }
                >
                  <Typography variant="body2">
                    <strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Loading State */}
            {bulkImportMutation.isPending && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Processing file... This may take a few moments.
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {/* Error State */}
            {bulkImportMutation.error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {bulkImportMutation.error.message}
              </Alert>
            )}
          </Box>
        ) : (
          /* Results View */
          <Box>
            {importResult && (
              <Box>
                {/* Summary */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Import Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`Total Extracted: ${importResult.summary.totalExtracted}`}
                      color="default"
                      size="small"
                    />
                    <Chip 
                      label={`Matched: ${importResult.summary.totalMatched}`}
                      color="info"
                      size="small"
                    />
                    <Chip 
                      label={`Added: ${importResult.summary.successfullyAdded}`}
                      color="success"
                      size="small"
                    />
                    <Chip 
                      label={`Already Members: ${importResult.summary.alreadyMembers}`}
                      color="warning"
                      size="small"
                    />
                    <Chip 
                      label={`Category Conflicts: ${importResult.summary.categoryConflicts}`}
                      color="error"
                      size="small"
                    />
                    <Chip 
                      label={`Unmatched: ${importResult.summary.unmatched}`}
                      color="error"
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Added Members */}
                {importResult.results.added.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom color="success.main">
                      Successfully Added ({importResult.results.added.length})
                    </Typography>
                    <List dense>
                      {importResult.results.added.slice(0, 5).map((member, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={member.name}
                            secondary={`Matched from: "${member.extractedName}" (${member.matchScore}% confidence)`}
                          />
                        </ListItem>
                      ))}
                      {importResult.results.added.length > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${importResult.results.added.length - 5} more`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {/* Conflicts */}
                {importResult.results.conflicts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom color="warning.main">
                      Already Members ({importResult.results.conflicts.length})
                    </Typography>
                    <List dense>
                      {importResult.results.conflicts.slice(0, 3).map((member, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={member.name}
                            secondary={`Matched from: "${member.extractedName}"`}
                          />
                        </ListItem>
                      ))}
                      {importResult.results.conflicts.length > 3 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${importResult.results.conflicts.length - 3} more`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {/* Category Conflicts */}
                {importResult.results.categoryConflicts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom color="error.main">
                      Already Members of Same Category ({importResult.results.categoryConflicts.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      These students are already members of another club in the same category and cannot be added to multiple clubs in the same category.
                    </Typography>
                    <List dense>
                      {importResult.results.categoryConflicts.slice(0, 3).map((member, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={member.name}
                            secondary={`Matched from: "${member.extractedName}"`}
                          />
                        </ListItem>
                      ))}
                      {importResult.results.categoryConflicts.length > 3 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${importResult.results.categoryConflicts.length - 3} more`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {/* Unmatched */}
                {importResult.results.unmatched.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom color="error.main">
                      Could Not Match ({importResult.results.unmatched.length})
                    </Typography>
                    <List dense>
                      {importResult.results.unmatched.slice(0, 3).map((name, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={name} />
                        </ListItem>
                      ))}
                      {importResult.results.unmatched.length > 3 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${importResult.results.unmatched.length - 3} more`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {showResults ? 'Close' : 'Cancel'}
        </Button>
        
        {!showResults && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!selectedFile || !clubId || bulkImportMutation.isPending}
          >
            {bulkImportMutation.isPending ? 'Processing...' : 'Import Members'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
