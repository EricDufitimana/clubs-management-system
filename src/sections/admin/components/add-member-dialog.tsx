'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemButton from '@mui/material/ListItemButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { getAvatarUrl } from 'src/utils/get-avatar';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { getGradeColor, formatCombination, getCombinationColor } from 'src/sections/user/utils/colors';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ----------------------------------------------------------------------

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  combination?: string;
  gender?: 'male' | 'female';
};

type AddMemberDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  onError?: (error: string) => void;
  clubId?: string;
  preloadedStudents?: Student[];
};

export function AddMemberDialog({ open, onClose, onAdd, onError, clubId, preloadedStudents }: AddMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>(preloadedStudents || []);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [existingMembers, setExistingMembers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch students using tRPC (only if not preloaded)
  const { data: studentsData, isLoading: fetching } = useQuery({
    ...trpc.students.getAllStudents.queryOptions(),
    enabled: !!open && !preloadedStudents,
  });

  useEffect(() => {
    if (studentsData) {
      const studentList: Student[] = studentsData.map((student: any) => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        grade: student.grade,
        combination: student.combination,
        gender: student.gender,
      }));
      setStudents(studentList);
    }
  }, [studentsData]);

  // Update students when preloadedStudents prop changes
  useEffect(() => {
    if (preloadedStudents && preloadedStudents.length > 0) {
      setStudents(preloadedStudents);
    }
  }, [preloadedStudents]);

  // Fetch existing members using tRPC
  const { data: existingMembersData } = useQuery({
    ...trpc.clubs.checkClubMembers.queryOptions({ clubId: clubId! }),
    enabled: !!open && !!clubId,
  });

  useEffect(() => {
    if (existingMembersData) {
      setExistingMembers(new Set(existingMembersData.memberIds || []));
    }
  }, [existingMembersData]);

  // Add members mutation
  const addMembersMutation = useMutation({
    ...trpc.clubs.addMembers.mutationOptions(),
    onSuccess: (data) => {
      setMessage({ 
        type: 'success', 
        text: data.message || `Successfully added ${data.added?.length || 0} student(s) to the club` 
      });
      
      // Update existing members
      if (data.added) {
        setExistingMembers(prev => {
          const newSet = new Set(prev);
          data.added.forEach((id: string) => newSet.add(id));
          return newSet;
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.clubs.checkClubMembers.queryKey({ clubId: clubId! }) });

      // Clear selection after a delay
      setTimeout(() => {
        setSelectedStudents(new Set());
        onAdd();
        onClose();
      }, 1500);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message || 'Failed to add members' });
      if (onError) {
        onError(error.message || 'Failed to add members');
      }
    },
  });

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedStudents(new Set());
      setMessage(null);
    }
  }, [open, clubId]);

  const handleToggleStudent = useCallback((studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
    setMessage(null);
  }, []);

  const handleSelectAll = useCallback(() => {
    const filtered = filteredStudents.filter(s => !existingMembers.has(s.id));
    const allSelected = filtered.every(s => selectedStudents.has(s.id));
    
    if (allSelected) {
      // Deselect all filtered
      setSelectedStudents(prev => {
        const newSet = new Set(prev);
        filtered.forEach(s => newSet.delete(s.id));
        return newSet;
      });
    } else {
      // Select all filtered
      setSelectedStudents(prev => {
        const newSet = new Set(prev);
        filtered.forEach(s => newSet.add(s.id));
        return newSet;
      });
    }
    setMessage(null);
  }, []);

  const handleAddMembers = useCallback(() => {
    if (selectedStudents.size === 0 || !clubId) {
      setMessage({ type: 'error', text: 'Please select at least one student' });
      return;
    }

    addMembersMutation.mutate({
      studentIds: Array.from(selectedStudents),
      clubId,
    });
  }, [selectedStudents, clubId, addMembersMutation]);

  const handleClose = useCallback(() => {
    if (!addMembersMutation.isPending) {
      setSearchQuery('');
      setSelectedStudents(new Set());
      setMessage(null);
      onClose();
    }
  }, [addMembersMutation.isPending, onClose]);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(query) || 
           student.grade?.toLowerCase().includes(query) ||
           student.combination?.toLowerCase().includes(query);
  });

  const availableStudents = filteredStudents.filter(s => !existingMembers.has(s.id));
  const filteredSelected = availableStudents.filter(s => selectedStudents.has(s.id));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Club Members</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search students by name, grade, or combination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            disabled={fetching || addMembersMutation.isPending}
          />

          {/* Message */}
          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {/* Select All */}
          {availableStudents.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filteredSelected.length} of {availableStudents.length} selected
              </Typography>
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={fetching || addMembersMutation.isPending}
              >
                {filteredSelected.length === availableStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
          )}

          {/* Loading */}
          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Students List */}
              <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <List dense>
                  {filteredStudents.length === 0 ? (
                    <ListItem>
                      <ListItemText 
                        primary="No students found"
                        secondary={searchQuery ? 'Try adjusting your search query' : 'No students available'}
                      />
                    </ListItem>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudents.has(student.id);
                      const isExistingMember = existingMembers.has(student.id);
                      const avatarUrl = getAvatarUrl(student.gender, BigInt(student.id));

                      return (
                        <ListItem
                          key={student.id}
                          disablePadding
                          secondaryAction={
                            isExistingMember && (
                              <Chip label="Member" size="small" color="success" />
                            )
                          }
                        >
                          <ListItemButton
                            onClick={() => !isExistingMember && handleToggleStudent(student.id)}
                            disabled={isExistingMember || addMembersMutation.isPending}
                            selected={isSelected}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isExistingMember}
                              sx={{ mr: 1 }}
                            />
                            <Avatar src={avatarUrl} sx={{ mr: 2, width: 40, height: 40 }} />
                            <ListItemText
                              primary={`${student.first_name} ${student.last_name}`}
                              secondary={
                                <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                  {student.grade && (
                                    <Label color={getGradeColor(student.grade)} variant="soft">
                                      {student.grade}
                                    </Label>
                                  )}
                                  {student.combination && (
                                    <Label color={getCombinationColor(student.combination)} variant="soft">
                                      {formatCombination(student.combination)}
                                    </Label>
                                  )}
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })
                  )}
                </List>
              </Box>

              {/* Info */}
              {existingMembers.size > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {existingMembers.size} student(s) are already members of this club
                </Typography>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={addMembersMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleAddMembers}
          variant="contained"
          disabled={selectedStudents.size === 0 || !clubId || addMembersMutation.isPending}
          startIcon={addMembersMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {addMembersMutation.isPending ? 'Adding...' : `Add ${selectedStudents.size} Member(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


