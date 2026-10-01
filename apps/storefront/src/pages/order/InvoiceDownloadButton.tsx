import { useRef, useState } from 'react';
import { Download } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

import { getOdooInvoicePdf, OdooInvoiceError } from './odooInvoice';

export function InvoiceDownloadButton({ orderId }: { orderId: string }) {
  const b3Lang = useB3Lang();
  const inFlight = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorCode, setErrorCode] = useState<string>();

  const download = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsDownloading(true);
    setErrorCode(undefined);
    try {
      const { blob, filename } = await getOdooInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        // Give the browser time to start the download before releasing the blob.
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      }
    } catch (error) {
      setErrorCode(error instanceof OdooInvoiceError ? error.code : 'requestFailed');
    } finally {
      inFlight.current = false;
      setIsDownloading(false);
    }
  };

  return (
    <Box onClick={(event) => event.stopPropagation()}>
      <Button
        size="small"
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
