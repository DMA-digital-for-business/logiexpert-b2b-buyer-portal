import { z } from 'zod';

export const invoiceDownloadConfig = {
  apiUrl: import.meta.env.VITE_INVOICE_API_URL || '',
  clientId: import.meta.env.VITE_LOCAL_APP_CLIENT_ID || '',
};

export const isInvoiceDownloadConfigured = Boolean(
  invoiceDownloadConfig.apiUrl && invoiceDownloadConfig.clientId,
);

export type InvoiceDownloadErrorCode =
  'signInRequired' | 'unavailable' | 'accessDenied' | 'requestFailed';

export class InvoiceDownloadError extends Error {
  constructor(public readonly code: InvoiceDownloadErrorCode) {
    super(code);
  }
}

const downloadResponseSchema = z.object({
  downloadUrl: z.url().refine((value) => new URL(value).protocol === 'https:'),
});

type InvoiceDownload = { kind: 'pdf'; blob: Blob; filename: string } | { kind: 'url'; url: string };

function getInvoiceFilename(disposition: string | null, orderId: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition?.match(/filename="([^"]+)"|filename=([^;]+)/i);
  let filename = plain?.[1] || plain?.[2]?.trim();
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded);
    } catch {
      // Fall back to the plain filename if the encoded value is malformed.
    }
  }
  return filename?.split(/[\\/]/).pop() || `fattura-ordine-${orderId}.pdf`;
}

export async function getInvoiceDownload(
  orderId: string,
  config = invoiceDownloadConfig,
): Promise<InvoiceDownload> {
  try {
    if (!config.apiUrl || !config.clientId) throw new InvoiceDownloadError('requestFailed');

    // Fetch a fresh JWT from the storefront session for every download.
    const tokenResponse = await fetch(
      `/customer/current.jwt?app_client_id=${encodeURIComponent(config.clientId)}`,
      { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30_000) },
    );
    if (
      tokenResponse.status === 401 ||
      tokenResponse.status === 403 ||
      tokenResponse.status === 404
    ) {
      throw new InvoiceDownloadError('signInRequired');
    }
    if (!tokenResponse.ok) throw new InvoiceDownloadError('requestFailed');
    const token = (await tokenResponse.text()).trim();
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      throw new InvoiceDownloadError('signInRequired');
    }

    const endpoint = `${config.apiUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(orderId)}/invoice/download`;
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 401) throw new InvoiceDownloadError('signInRequired');
    if (response.status === 403) throw new InvoiceDownloadError('accessDenied');
    if (response.status === 404) throw new InvoiceDownloadError('unavailable');
    if (!response.ok) throw new InvoiceDownloadError('requestFailed');

    const contentType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
    if (contentType === 'application/pdf' || contentType === 'application/octet-stream') {
      const bytes = await response.arrayBuffer();
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
        throw new InvoiceDownloadError('requestFailed');
      }
      return {
        kind: 'pdf',
        blob: new Blob([bytes], { type: 'application/pdf' }),
        filename: getInvoiceFilename(response.headers.get('Content-Disposition'), orderId),
      };
    }

    const result = downloadResponseSchema.safeParse(await response.json());
    if (!result.success) throw new InvoiceDownloadError('requestFailed');
    return { kind: 'url', url: result.data.downloadUrl };
  } catch (error) {
    if (error instanceof InvoiceDownloadError) throw error;
    throw new InvoiceDownloadError('requestFailed');
  }
}
