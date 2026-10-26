import { useRef, useState } from 'react';
import { Download } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

import {
  getInvoiceDownload,
  InvoiceDownloadError,
  InvoiceDownloadErrorCode,
} from './invoiceDownload';

interface InvoiceDownloadButtonProps {
  orderId: string;
  variant?: 'text' | 'outlined';
}

export function InvoiceDownloadButton({ orderId, variant = 'text' }: InvoiceDownloadButtonProps) {
  const b3Lang = useB3Lang();
  const inFlight = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorCode, setErrorCode] = useState<InvoiceDownloadErrorCode>();

  const download = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsDownloading(true);
    setErrorCode(undefined);
    try {
      const result = await getInvoiceDownload(orderId);
      if (result.kind === 'url') {
        window.location.assign(result.url);
        return;
      }

      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.referrerPolicy = 'no-referrer';
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        // Let the browser start reading the PDF before releasing its object URL.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      setErrorCode(error instanceof InvoiceDownloadError ? error.code : 'requestFailed');
    } finally {
      inFlight.current = false;
      setIsDownloading(false);
    }
  };

  return (
    <Box onClick={(event) => event.stopPropagation()}>
      <Button
        size="small"
        variant={variant}
        disabled={isDownloading}
        aria-label={b3Lang('orders.invoice.downloadForOrder', { orderId })}
        startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />}
        onClick={download}
      >
        {b3Lang(isDownloading ? 'orders.invoice.downloading' : 'orders.invoice.download')}
      </Button>
      {errorCode && <Alert severity="error">{b3Lang(`orders.invoice.${errorCode}`)}</Alert>}
    </Box>
  );
}
