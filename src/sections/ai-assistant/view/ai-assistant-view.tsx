'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';

import { DashboardContent } from '@/layouts/dashboard/content';
import type { ReportData } from '@/trpc/routers/clubs-assistant';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
  reportData?: ReportData | null;
  error?: boolean;
};

// ---------------------------------------------------------------------------
// Starter suggestions
// ---------------------------------------------------------------------------

const STARTER_CHIPS = [
  "Who was late (excused) between the 17th–19th?",
  "Show attendance rate per club this month",
  "List all members of the Debate club",
  "Generate a report of absent students last week",
];

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'text.disabled',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%, 60%, 100%': { transform: 'translateY(0)' },
              '30%': { transform: 'translateY(-6px)' },
            },
          }}
        />
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Report download card
// ---------------------------------------------------------------------------

function ReportCard({ reportData }: { reportData: ReportData }) {
  const theme = useTheme();

  const handleDownload = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const primary = '#1877F2';
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // --- Header band ---
    doc.setFillColor(primary);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Clubs Management System', margin, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 14, { align: 'right' });

    // --- Title block ---
    doc.setTextColor('#1C252E');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, margin, 34);

    let y = 40;
    if (reportData.subtitle) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#637381');
      doc.text(reportData.subtitle, margin, y);
      y += 6;
    }
    if (reportData.date_range) {
      doc.setFontSize(10);
      doc.setTextColor('#919EAB');
      doc.text(`Date range: ${reportData.date_range}`, margin, y);
      y += 6;
    }

    // --- Summary cards ---
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      y += 4;
      const entries = Object.entries(reportData.summary);
      const cardW = Math.min(45, (pageW - margin * 2 - (entries.length - 1) * 6) / entries.length);
      entries.forEach(([label, value], idx) => {
        const x = margin + idx * (cardW + 6);
        doc.setFillColor('#F4F6F8');
        doc.roundedRect(x, y, cardW, 18, 3, 3, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primary);
        doc.text(String(value), x + cardW / 2, y + 10, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#637381');
        doc.text(label, x + cardW / 2, y + 16, { align: 'center' });
      });
      y += 26;
    }

    // --- Data table ---
    autoTable(doc, {
      startY: y,
      head: [reportData.columns],
      body: reportData.rows.map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))),
      headStyles: {
        fillColor: primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: '#F9FAFB' },
      bodyStyles: { fontSize: 8.5, textColor: '#1C252E' },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    // Add footer to every page after the table is drawn
    const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    const footerDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    for (let pg = 1; pg <= totalPages; pg++) {
      doc.setPage(pg);
      doc.setFontSize(8);
      doc.setTextColor('#919EAB');
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by Clubs Management Assistant · ${footerDate}`, margin, pageH - 6);
      doc.text(`Page ${pg} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    doc.save(`${reportData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mt: 1.5,
        borderColor: 'primary.light',
        borderRadius: 2,
        maxWidth: 400,
        background: (t) => (t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[50]),
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Avatar
            sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 40, height: 40, flexShrink: 0 }}
          >
            <Icon icon="solar:file-text-bold-duotone" width={20} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {reportData.title}
            </Typography>
            {reportData.date_range && (
              <Typography variant="caption" color="text.secondary">
                {reportData.date_range}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={`${reportData.rows.length} rows`}
                size="small"
                sx={{ height: 20, fontSize: 11 }}
              />
              <Chip
                label={`${reportData.columns.length} columns`}
                size="small"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Box>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<Icon icon="solar:download-minimalistic-bold" width={16} />}
          onClick={handleDownload}
          sx={{ mt: 1.5 }}
        >
          Download PDF
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            width: 32,
            height: 32,
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <Icon icon="solar:stars-bold" width={16} />
        </Avatar>
      )}

      <Box sx={{ maxWidth: '75%', minWidth: 0 }}>
        {/* Bubble */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : '1px solid',
            borderColor: 'divider',
            boxShadow: (t) => (isUser ? 'none' : t.shadows[1]),
            '& p': { m: 0, lineHeight: 1.7 },
            '& p + p': { mt: 1 },
            '& ul, & ol': { pl: 2.5, my: 0.5 },
            '& li': { mb: 0.25 },
            '& strong': { fontWeight: 600 },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.85em',
              bgcolor: isUser ? 'rgba(255,255,255,0.15)' : 'grey.100',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
            },
            '& pre': {
              bgcolor: isUser ? 'rgba(0,0,0,0.2)' : 'grey.900',
              color: isUser ? 'white' : 'grey.100',
              p: 1.5,
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.82em',
              my: 1,
            },
            '& pre code': { bgcolor: 'transparent', px: 0, py: 0 },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: '0.875em',
              mt: 1,
            },
            '& th': {
              bgcolor: isUser ? 'rgba(255,255,255,0.2)' : 'grey.100',
              fontWeight: 600,
              p: 0.75,
              textAlign: 'left',
              border: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid',
              borderColor: isUser ? undefined : 'divider',
            },
            '& td': {
              p: 0.75,
              border: isUser ? '1px solid rgba(255,255,255,0.15)' : '1px solid',
              borderColor: isUser ? undefined : 'divider',
            },
          }}
        >
          {message.error ? (
            <Typography variant="body2" color="error.main">
              {message.content}
            </Typography>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
        </Paper>

        {/* Report card (inside the bubble area) */}
        {!isUser && message.reportData && (
          <ReportCard reportData={message.reportData} />
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        px: 3,
        pb: 4,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon="solar:stars-bold-duotone" width={40} color="#1877F2" />
      </Box>

      <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask any question about clubs, members, attendance, or sessions.
          I can also generate formal PDF reports from your data.
        </Typography>
      </Box>

      {/* Starter chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
          maxWidth: 600,
        }}
      >
        {STARTER_CHIPS.map((text) => (
          <Chip
            key={text}
            label={text}
            onClick={() => onChipClick(text)}
            clickable
            variant="outlined"
            sx={{
              borderRadius: '20px',
              fontSize: 13,
              height: 36,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'primary.lighter', borderColor: 'primary.main' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function AIAssistantView() {
  const trpc = useTRPC();
  const theme = useTheme();
  const idPrefix = useId();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasStarted = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  const { mutateAsync: sendChat } = useMutation(
    trpc.clubsAssistant.chat.mutationOptions()
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isThinking) return;

      const userMsg: Message = {
        id: `${idPrefix}-${Date.now()}-user`,
        role: 'user',
        content,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);

      // Build messages history for the API
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const result = await sendChat({
          messages: apiMessages,
          conversationId: idPrefix,
        });

        const assistantMsg: Message = {
          id: `${idPrefix}-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.content,
          reportData: result.reportData,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        const errMsg: Message = {
          id: `${idPrefix}-${Date.now()}-err`,
          role: 'assistant',
          content: msg,
          error: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsThinking(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, isThinking, messages, sendChat, idPrefix]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardContent
      maxWidth="xl"
      disablePadding={false}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', pb: 0 }}
    >
      {/* Page header */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask questions about clubs, members, and attendance — or request downloadable reports.
        </Typography>
      </Box>

      {/* Chat panel */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          minHeight: 0,
          mb: 2,
        }}
      >
        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!hasStarted ? (
            <EmptyState onChipClick={(text) => handleSend(text)} />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isThinking && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Icon icon="solar:stars-bold" width={16} />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: '4px 16px 16px 16px',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 1,
                    }}
                  >
                    <TypingIndicator />
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        <Divider />

        {/* Input area */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask about attendance, members, clubs, or request a report…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: 14,
                },
              }}
            />
            <IconButton
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                flexShrink: 0,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              <Icon icon="solar:plain-bold" width={18} />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.75, display: 'block' }}>
            Press Enter to send · Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>
    </DashboardContent>
  );
}
