import { z } from 'zod';

export interface OdooInvoiceConfig {
  baseUrl: string;
  database: string;
  apiKey: string;
}

export const odooInvoiceConfig: OdooInvoiceConfig = {
  baseUrl: import.meta.env.VITE_ODOO_BASE_URL || '',
  database: import.meta.env.VITE_ODOO_DATABASE_NAME || '',
  apiKey: import.meta.env.VITE_ODOO_API_KEY || '',
};

export const isOdooInvoiceConfigured = Boolean(
  odooInvoiceConfig.baseUrl && odooInvoiceConfig.database && odooInvoiceConfig.apiKey,
);

type InvoiceErrorCode =
  'unavailable' | 'ambiguous' | 'pdfUnavailable' | 'accessDenied' | 'requestFailed';

export class OdooInvoiceError extends Error {
  constructor(public readonly code: InvoiceErrorCode) {
    super(code);
  }
}

const ordersSchema = z.array(z.object({ invoice_ids: z.array(z.number().int()) }));
const invoicesSchema = z.array(
  z.object({ name: z.string(), invoice_pdf_report_file: z.union([z.string(), z.literal(false)]) }),
);

async function searchRead(
  config: OdooInvoiceConfig,
  model: string,
  domain: unknown[],
  fields: string[],
): Promise<unknown> {
  try {
    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, '')}/json/2/${model}/search_read`,
      {
        method: 'POST',
        credentials: 'omit',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Odoo-Database': config.database,
        },
        body: JSON.stringify({ domain, fields, limit: 2, context: { bin_size: false } }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (response.status === 401 || response.status === 403) {
      throw new OdooInvoiceError('accessDenied');
    }
    if (!response.ok) throw new OdooInvoiceError('requestFailed');
    return await response.json();
  } catch (error) {
    if (error instanceof OdooInvoiceError) throw error;
    throw new OdooInvoiceError('requestFailed');
  }
}

export async function getOdooInvoicePdf(orderId: string, config = odooInvoiceConfig) {
  const orders = ordersSchema.safeParse(
    await searchRead(
      config,
      'sale.order',
      [['x_bigcommerce_order_id', '=', orderId]],
      ['invoice_ids'],
    ),
  );
  if (!orders.success) throw new OdooInvoiceError('requestFailed');
  if (orders.data.length > 1) throw new OdooInvoiceError('ambiguous');
  const order = orders.data[0];
  if (!order?.invoice_ids.length) throw new OdooInvoiceError('unavailable');

  const invoices = invoicesSchema.safeParse(
    await searchRead(
      config,
      'account.move',
      [
        ['id', 'in', order.invoice_ids],
        ['move_type', '=', 'out_invoice'],
        ['state', '=', 'posted'],
      ],
      ['name', 'invoice_pdf_report_file'],
    ),
  );
  if (!invoices.success) throw new OdooInvoiceError('requestFailed');
  if (invoices.data.length > 1) throw new OdooInvoiceError('ambiguous');
  const invoice = invoices.data[0];
  if (!invoice) throw new OdooInvoiceError('unavailable');
  if (!invoice.invoice_pdf_report_file) throw new OdooInvoiceError('pdfUnavailable');

  try {
    const binary = atob(invoice.invoice_pdf_report_file);
    if (!binary.startsWith('%PDF-')) throw new OdooInvoiceError('pdfUnavailable');
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return {
      blob: new Blob([bytes], { type: 'application/pdf' }),
      filename: `${invoice.name.replace(/[^\p{L}\p{N}._-]/gu, '_')}.pdf`,
    };
  } catch (error) {
    if (error instanceof OdooInvoiceError) throw error;
    throw new OdooInvoiceError('pdfUnavailable');
  }
}
