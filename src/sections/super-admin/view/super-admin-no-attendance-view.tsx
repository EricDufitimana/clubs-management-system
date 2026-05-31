'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';

import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';
import { DashboardContent } from '@/layouts/dashboard';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  combination: string | null;
  gender: string | null;
  avatarUrl: string;
  clubs: { name: string; category: string | null }[];
};

type Category = 'subject_oriented_clubs' | 'soft_skills_oriented_clubs';

const CATEGORY_LABELS: Record<Category, string> = {
  subject_oriented_clubs: 'Science Oriented',
  soft_skills_oriented_clubs: 'Soft Skills',
};

// ----------------------------------------------------------------------

function getCombinationAcronym(combination: string | null | undefined): string {
  if (!combination || combination === '-') return '-';
  if (combination.includes('-')) {
    return combination.split('-').map((p) => p.trim().charAt(0).toUpperCase()).join('');
  }
  const words = combination.split(/(?=[A-Z])/);
  const grouped: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] === 'Computer' && words[i + 1] === 'Science') { grouped.push('CS'); i++; }
    else grouped.push(words[i]);
  }
  return grouped.map((w) => w.charAt(0).toUpperCase()).join('');
}

function gradeLabel(grade: string | null): string {
  if (!grade) return '-';
  return grade.replace(/([A-Z])/g, ' $1').trim();
}

/** Returns the Monday of the week that is `offset` weeks from now. */
function getWeekMonday(offset: number): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

// ----------------------------------------------------------------------

export function SuperAdminNoAttendanceView() {
  const theme = useTheme();
  const trpc = useTRPC();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekMonday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekLabel(weekMonday), [weekMonday]);
  const isCurrentWeek = weekOffset === 0;

  const { data, isFetching, isError } = useQuery({
    ...trpc.students.getStudentsWithoutAttendanceThisWeek.queryOptions(
      selectedCategory
        ? { category: selectedCategory, weekStart: weekMonday.toISOString() }
        : undefined
    ),
    enabled: selectedCategory !== null,
  });

  const filtered = useMemo(
    () =>
      (data ?? []).filter((s: Student) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          (s.grade?.toLowerCase().includes(q) ?? false) ||
          s.clubs.some((c) => c.name.toLowerCase().includes(q))
        );
      }),
    [data, search]
  );

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCategoryChange = (_: React.MouseEvent, val: Category | null) => {
    if (val === null) return; // keep at least one selected
    setSelectedCategory(val);
    setPage(0);
    setSearch('');
  };

  const handleWeekChange = (delta: number) => {
    setWeekOffset((prev) => prev + delta);
    setPage(0);
  };

  const handleExportPDF = useCallback(async () => {
    if (!filtered.length || !selectedCategory) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const primary: [number, number, number] = [99, 102, 241];
      const dark: [number, number, number] = [15, 23, 42];
      const muted: [number, number, number] = [100, 116, 139];
      const light: [number, number, number] = [241, 245, 249];
      const white: [number, number, number] = [255, 255, 255];
      const accent: [number, number, number] = [239, 68, 68];

      doc.setFillColor(...primary);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setFillColor(...accent);
      doc.triangle(pageW - 40, 0, pageW, 0, pageW, 28, 'F');

      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`Students Without Attendance — ${CATEGORY_LABELS[selectedCategory]}`, 14, 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Week: ${weekLabel}`, 14, 19);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

      doc.setFillColor(...white);
      doc.roundedRect(pageW - 55, 5, 38, 18, 3, 3, 'F');
      doc.setTextColor(...primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(String(filtered.length), pageW - 36, 17, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text('students', pageW - 36, 21, { align: 'center' });

      doc.setFillColor(...light);
      doc.rect(0, 28, pageW, 10, 'F');
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Excludes Senior 6 students. Shows members with no present record this week.', 14, 34.5);

      const rows = filtered.map((s: Student, i: number) => [
        String(i + 1),
        `${s.last_name}, ${s.first_name}`,
        gradeLabel(s.grade),
        getCombinationAcronym(s.combination),
        s.clubs.map((c) => c.name).join(', ') || '—',
        s.gender ?? '—',
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['#', 'Name', 'Grade', 'Combination', 'Club(s)', 'Gender']],
        body: rows,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          font: 'helvetica',
          textColor: dark,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        headStyles: { fillColor: dark, textColor: white, fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 55, fontStyle: 'bold' },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 20, halign: 'center' },
        },
        didDrawPage: (hookData: any) => {
          const pageNum = hookData.pageNumber ?? doc.getNumberOfPages();
          doc.setFillColor(...primary);
          doc.rect(0, pageH - 10, pageW, 10, 'F');
          doc.setTextColor(...white);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Clubs Management System — Confidential', 14, pageH - 3.5);
          doc.text(`Page ${pageNum}`, pageW - 14, pageH - 3.5, { align: 'right' });
        },
      });

      doc.save(`no-attendance_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert(`PDF export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }, [filtered, selectedCategory, weekLabel]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DashboardContent maxWidth="xl">
      {/* ── Page header ── */}
      <Box sx={{ mb: { xs: 3, md: 5 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">Students Without Attendance</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Active members (excl. Senior&nbsp;6) with no <strong>present</strong> record
            {selectedCategory && (
              <> — <strong>{CATEGORY_LABELS[selectedCategory]}</strong></>
            )}
            &nbsp;·&nbsp;{weekLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            component={Link}
            href="/dashboard/super-admin/reports"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="mingcute:arrow-left-line" />}
          >
            Back to Reports
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={
              exporting
                ? <Iconify icon="svg-spinners:ring-resize" />
                : <Iconify icon="mingcute:file-pdf-2-line" />
            }
            onClick={handleExportPDF}
            disabled={exporting || !filtered.length || !selectedCategory}
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      {/* ── Summary chips (only when data is loaded) ── */}
      {data !== undefined && selectedCategory && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={`${filtered.length} student${filtered.length !== 1 ? 's' : ''} without attendance`}
            color="error"
            variant="filled"
            size="medium"
            icon={<Iconify icon="solar:users-group-rounded-bold-duotone" />}
          />
          <Chip
            label={CATEGORY_LABELS[selectedCategory]}
            color={selectedCategory === 'subject_oriented_clubs' ? 'info' : 'warning'}
            variant="outlined"
            size="medium"
          />
          <Chip
            label={weekLabel}
            color="default"
            variant="outlined"
            size="medium"
            icon={<Iconify icon="solar:calendar-mark-bold-duotone" />}
          />
        </Box>
      )}

      <Card>
        {/* ── Toolbar: category toggle + week navigator + search ── */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: category + week nav */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Category toggle */}
            <ToggleButtonGroup
              exclusive
              value={selectedCategory}
              onChange={handleCategoryChange}
              size="small"
            >
              <ToggleButton value="subject_oriented_clubs">
                <Iconify icon="solar:atom-bold-duotone" sx={{ mr: 0.75 }} />
                Science Oriented
              </ToggleButton>
              <ToggleButton value="soft_skills_oriented_clubs">
                <Iconify icon="solar:star-bold-duotone" sx={{ mr: 0.75 }} />
                Soft Skills
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Divider */}
            <Divider orientation="vertical" flexItem />

            {/* Week navigator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={() => handleWeekChange(-1)}>
                <Iconify icon="mingcute:arrow-left-line" />
              </IconButton>

              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  minWidth: 210,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                  {isCurrentWeek ? 'This Week' : weekOffset < 0 ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago` : `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead`}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                  {weekLabel}
                </Typography>
              </Box>

              <IconButton size="small" onClick={() => handleWeekChange(1)}>
                <Iconify icon="mingcute:arrow-right-line" />
              </IconButton>

              {!isCurrentWeek && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => { setWeekOffset(0); setPage(0); }}
                  sx={{ ml: 0.5, fontSize: 12 }}
                >
                  Today
                </Button>
              )}
            </Box>
          </Box>

          {/* Right: search (only shown once a category is selected) */}
          {selectedCategory && (
            <TextField
              size="small"
              placeholder="Search by name, grade, or club…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mingcute:search-line" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
          )}
        </Box>

        <Divider />

        {/* ── Table area ── */}
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Combination</TableCell>
                  <TableCell>Club(s)</TableCell>
                  <TableCell>Gender</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>

                {/* No category selected yet */}
                {!selectedCategory && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 12, textAlign: 'center' }}>
                        <Iconify
                          icon="solar:filter-bold-duotone"
                          sx={{ width: 56, height: 56, color: 'text.disabled', mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
                          Select a club type to load students
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Choose <strong>Science Oriented</strong> or <strong>Soft Skills</strong> above to see who missed attendance.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Loading — only inside the table */}
                {selectedCategory && isFetching && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="circular" width={36} height={36} />
                            <Skeleton variant="text" width={140} height={20} />
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={120} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width={50} /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {/* Error */}
                {selectedCategory && !isFetching && isError && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Iconify icon="solar:danger-bold-duotone" sx={{ width: 48, height: 48, color: 'error.main', mb: 1.5 }} />
                        <Typography variant="h6" color="error">Failed to load data</Typography>
                        <Typography variant="body2" color="text.secondary">Check your connection and try again.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Empty state */}
                {selectedCategory && !isFetching && !isError && data !== undefined && paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify
                          icon="solar:check-circle-bold-duotone"
                          sx={{ width: 48, height: 48, color: 'success.main', mb: 1.5 }}
                        />
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {search ? 'No results match your search' : 'All students attended!'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {search
                            ? 'Try a different name or grade.'
                            : `Every ${CATEGORY_LABELS[selectedCategory]} member (excl. Senior 6) has at least one present record this week.`}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Data rows */}
                {selectedCategory && !isFetching && !isError && paginated.map((student: Student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={student.avatarUrl}
                          alt={`${student.first_name} ${student.last_name}`}
                          sx={{ width: 36, height: 36 }}
                        />
                        <Typography variant="subtitle2">
                          {student.first_name} {student.last_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{gradeLabel(student.grade)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getCombinationAcronym(student.combination)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {student.clubs.length === 0 ? (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        ) : (
                          student.clubs.map((c) => (
                            <Chip
                              key={c.name}
                              label={c.name}
                              size="small"
                              variant="outlined"
                              color={c.category === 'subject_oriented_clubs' ? 'info' : 'warning'}
                            />
                          ))
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {student.gender ?? '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        {/* Pagination — only when data exists */}
        {selectedCategory && data !== undefined && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        )}
      </Card>
    </DashboardContent>
  );
}
