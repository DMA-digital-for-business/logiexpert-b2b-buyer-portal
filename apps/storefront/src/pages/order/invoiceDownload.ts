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

export async function getInvoiceDownloadUrl(orderId: string, config = invoiceDownloadConfig) {
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

    const result = downloadResponseSchema.safeParse(await response.json());
    if (!result.success) throw new InvoiceDownloadError('requestFailed');
    return result.data.downloadUrl;
  } catch (error) {
    if (error instanceof InvoiceDownloadError) throw error;
    throw new InvoiceDownloadError('requestFailed');
  }
}
