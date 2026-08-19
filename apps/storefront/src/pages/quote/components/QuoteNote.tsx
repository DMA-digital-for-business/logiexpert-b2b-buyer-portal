import { ChangeEvent, useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Typography } from '@mui/material';

import { B3CollapseContainer } from '@/components/B3CollapseContainer';
import { useB3Lang } from '@/lib/lang';
import {
  isB2BUserSelector,
  rolePermissionSelector,
  setDraftQuoteInfoNote,
  store,
  useAppSelector,
} from '@/store';

interface QuoteNoteProps {
  quoteStatus?: string | number;
  quoteNotes?: string;
  required?: boolean;
  showError?: boolean;
}

export default function QuoteNote(props: QuoteNoteProps) {
  const b3Lang = useB3Lang();
  const { quoteStatus, quoteNotes = '', required = false, showError = false } = props;

  const [noteText, setNoteText] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(required || Boolean(quoteNotes));

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const b2bPermissions = useAppSelector(rolePermissionSelector);

  const quotesActionsPermission = isB2BUser ? b2bPermissions.quotesCreateActionsPermission : true;

  const handleNoteTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteText(event?.target.value || '');
    store.dispatch(setDraftQuoteInfoNote(event?.target.value || ''));
  };

  useEffect(() => {
    const note = store.getState().quoteInfo.draftQuoteInfo.note || '';

    setNoteText(note);
  }, []);

  useEffect(() => {
    store.dispatch(setDraftQuoteInfoNote(noteText || ''));
  }, [noteText]);

  useEffect(() => {
    if (quoteNotes || required || showError) setDefaultOpen(true);
  }, [quoteNotes, required, showError]);

  const isDraftQuote = quoteStatus === 'Draft';
  const showValidationError = required && showError && noteText.trim().length === 0;

  return (
    <Card
      sx={
        isDraftQuote
          ? {
              border: '2px solid',
              borderColor: showValidationError ? 'error.main' : 'warning.light',
              backgroundColor: showValidationError ? '#FFF5F5' : '#FFF9ED',
            }
          : undefined
      }
    >
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer
          title={
            <>
              {isDraftQuote ? b3Lang('global.quoteNote.message') : b3Lang('global.quoteNote.notes')}
              {required && isDraftQuote ? (
                <Box component="span" aria-hidden="true" sx={{ color: 'error.main', ml: '4px' }}>
                  *
                </Box>
              ) : null}
            </>
          }
          defaultOpen={defaultOpen}
        >
          <Box
            sx={{
              padding: '16px 0',
            }}
          >
            {isDraftQuote && (
              <Box
                sx={{
                  mb: '16px',
                  p: '16px',
                  borderRadius: '4px',
                  backgroundColor: showValidationError ? 'rgba(211, 47, 47, 0.08)' : '#FFFFFF',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 700,
                    mb: '4px',
                    color: showValidationError ? 'error.main' : 'text.primary',
                  }}
                >
                  {b3Lang('global.quoteNote.requiredTitle')}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: 'text.secondary',
                  }}
                >
                  {b3Lang('global.quoteNote.requiredHelper')}
                </Typography>
              </Box>
            )}
            {quoteNotes ? (
              <Typography
                variant="body1"
                style={{
                  whiteSpace: 'pre-line',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                {quoteNotes}
              </Typography>
            ) : (
              <Box>
                {quotesActionsPermission ? (
                  <TextField
                    multiline
                    fullWidth
                    required={required}
                    error={showValidationError}
                    helperText={
                      showValidationError
                        ? b3Lang('global.quoteNote.requiredError')
                        : b3Lang('global.quoteNote.messageNote')
                    }
                    rows={6}
                    value={noteText}
                    onChange={handleNoteTextChange}
                    label={b3Lang('global.quoteNote.fieldLabel')}
                    placeholder={b3Lang('global.quoteNote.typeMessage')}
                    size="medium"
                    variant="outlined"
                    sx={{
                      '& .MuiFormLabel-root': {
                        color: 'rgba(0, 0, 0, 0.38)',
                      },
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#FFF',
                      },
                    }}
                  />
                ) : null}
              </Box>
            )}
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}
