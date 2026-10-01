import {
  builder,
  faker,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { InvoiceDownloadButton } from './InvoiceDownloadButton';
import { odooInvoiceConfig } from './odooInvoice';

const { server } = startMockServer();
const buildDownloadWith = builder(() => ({
  orderId: faker.number.int({ min: 1, max: 99999 }).toString(),
  invoiceId: faker.number.int({ min: 1, max: 99999 }),
  invoiceName: faker.string.alphanumeric(12),
  pdf: `%PDF-1.7\n${faker.string.alphanumeric(32)}`,
  apiKey: faker.string.uuid(),
  database: faker.string.alphanumeric(12),
}));
const originalConfig = { ...odooInvoiceConfig };

beforeEach(() => {
  Object.assign(odooInvoiceConfig, {
    baseUrl: 'https://odoo.example',
    database: faker.string.alphanumeric(12),
    apiKey: faker.string.uuid(),
  });
});

afterEach(() => {
  Object.assign(odooInvoiceConfig, originalConfig);
});

it('downloads the linked invoice PDF without opening the order', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  Object.assign(odooInvoiceConfig, { database: data.database, apiKey: data.apiKey });
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', async ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${data.apiKey}`);
      expect(request.headers.get('X-Odoo-Database')).toBe(data.database);
      expect(await request.json()).toMatchObject({
        domain: [['x_bigcommerce_order_id', '=', data.orderId]],
        fields: ['invoice_ids'],
      });
      return HttpResponse.json([{ invoice_ids: [data.invoiceId] }]);
    }),
    http.post('https://odoo.example/json/2/account.move/search_read', async ({ request }) => {
      expect(await request.json()).toMatchObject({
        domain: [
          ['id', 'in', [data.invoiceId]],
          ['move_type', '=', 'out_invoice'],
          ['state', '=', 'posted'],
        ],
        context: { bin_size: false },
      });
      return HttpResponse.json([
        { name: data.invoiceName, invoice_pdf_report_file: btoa(data.pdf) },
      ]);
    }),
  );
  let downloadedFilename: string | undefined;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureDownload(
    this: HTMLAnchorElement,
  ) {
    downloadedFilename = this.download;
  });
  const openOrder = vi.fn();
  const { user } = renderWithProviders(
    <table>
      <tbody>
        <tr onClick={openOrder}>
          <td>
            <InvoiceDownloadButton orderId={data.orderId} />
          </td>
        </tr>
      </tbody>
    </table>,
  );
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  await waitFor(() => expect(downloadedFilename).toBe(`${data.invoiceName}.pdf`));
  expect(openOrder).not.toHaveBeenCalled();
  expect(URL.createObjectURL).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'application/pdf' }),
  );
});

it('explains when the order has no invoice yet', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', () =>
      HttpResponse.json([{ invoice_ids: [] }]),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Fattura non ancora disponibile.');
});

it('explains when the saved PDF is missing', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', () =>
      HttpResponse.json([{ invoice_ids: [data.invoiceId] }]),
    ),
    http.post('https://odoo.example/json/2/account.move/search_read', () =>
      HttpResponse.json([{ name: data.invoiceName, invoice_pdf_report_file: false }]),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Il PDF della fattura non è ancora disponibile in Odoo.',
  );
});

it('allows retrying after Odoo denies access', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  server.use(
    http.post(
      'https://odoo.example/json/2/sale.order/search_read',
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${data.orderId}`,
  });
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Accesso a Odoo negato. Contatta l’assistenza.',
  );
  expect(button).toBeEnabled();
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', () => HttpResponse.json([])),
  );
  await user.click(button);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Fattura non ancora disponibile.'),
  );
});

it('does not choose an invoice when several Odoo orders match', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', () =>
      HttpResponse.json([{ invoice_ids: [data.invoiceId] }, { invoice_ids: [data.invoiceId] }]),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Trovate più corrispondenze in Odoo.');
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('reports a network failure and lets the customer try again', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  server.use(
    http.post('https://odoo.example/json/2/sale.order/search_read', () => HttpResponse.error()),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${data.orderId}`,
  });
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
  expect(button).toBeEnabled();
});
