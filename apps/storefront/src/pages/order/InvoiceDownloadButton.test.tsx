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

import { invoiceDownloadConfig } from './invoiceDownload';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';

const { server } = startMockServer();
const buildDownloadWith = builder(() => ({
  orderId: faker.number.int({ min: 1, max: 99999 }).toString(),
  clientId: faker.string.alphanumeric(24),
  token: Array.from({ length: 3 }, () => faker.string.alphanumeric(24)).join('.'),
  pdf: `%PDF-1.7\n${faker.string.alphanumeric(64)}\n%%EOF`,
  filename: `FATT_${faker.number.int({ min: 2020, max: 2030 })}_${faker.string.numeric(5)}.pdf`,
  downloadUrl: `https://invoices.odoo.com/web/content/${faker.number.int({ min: 1 })}?download=true&access_token=${faker.string.uuid()}`,
}));
const originalConfig = { ...invoiceDownloadConfig };

function mockCustomerToken(data: ReturnType<typeof buildDownloadWith>) {
  server.use(
    http.get('*/customer/current.jwt', ({ request }) => {
      expect(new URL(request.url).searchParams.get('app_client_id')).toBe(data.clientId);
      expect(request.credentials).toBe('same-origin');
      return HttpResponse.text(data.token);
    }),
  );
}

beforeEach(() => {
  Object.assign(invoiceDownloadConfig, { apiUrl: 'https://api.example/staging/', clientId: '' });
});

afterEach(() => {
  Object.assign(invoiceDownloadConfig, originalConfig);
});

it.each(['plain', 'encoded', 'missing', 'octet-stream'])(
  'downloads the PDF response with a %s filename or content type',
  async (mode) => {
    const data = buildDownloadWith('WHATEVER_VALUES');
    invoiceDownloadConfig.clientId = data.clientId;
    mockCustomerToken(data);
    server.use(
      http.get(
        'https://api.example/staging/orders/:orderId/invoice/download',
        ({ request, params }) => {
          expect(params.orderId).toBe(data.orderId);
          expect(request.headers.get('Authorization')).toBe(`Bearer ${data.token}`);
          expect(request.credentials).toBe('omit');
          const headers = new Headers({
            'Content-Type':
              mode === 'octet-stream' ? 'application/octet-stream' : 'application/pdf',
          });
          if (mode === 'plain') {
            headers.set('Content-Disposition', `attachment; filename="${data.filename}"`);
          } else if (mode === 'encoded') {
            headers.set(
              'Content-Disposition',
              `attachment; filename*=UTF-8''${encodeURIComponent(data.filename)}`,
            );
          }
          return new HttpResponse(data.pdf, { headers });
        },
      ),
    );
    const blobUrl = `blob:${faker.string.uuid()}`;
    vi.mocked(URL.createObjectURL).mockReturnValue(blobUrl);
    let downloadedUrl: string | undefined;
    let downloadedFilename: string | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureDownload(
      this: HTMLAnchorElement,
    ) {
      downloadedUrl = this.href;
      downloadedFilename = this.download;
    });
    const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
    await user.click(
      await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
    );
    await waitFor(() => expect(downloadedUrl).toBe(blobUrl));
    expect(downloadedFilename).toBe(
      mode === 'plain' || mode === 'encoded' ? data.filename : `fattura-ordine-${data.orderId}.pdf`,
    );
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) throw new Error('Expected a PDF blob');
    const reader = new FileReader();
    const contents = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
    });
    reader.readAsText(blob);
    expect(await contents).toBe(data.pdf);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

it.each(['empty', 'invalid'])(
  'shows an error instead of downloading an %s PDF response',
  async (mode) => {
    const data = buildDownloadWith('WHATEVER_VALUES');
    invoiceDownloadConfig.clientId = data.clientId;
    mockCustomerToken(data);
    server.use(
      http.get(
        'https://api.example/staging/orders/:orderId/invoice/download',
        () =>
          new HttpResponse(mode === 'empty' ? '' : faker.lorem.sentence(), {
            headers: { 'Content-Type': 'application/pdf' },
          }),
      ),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
    await user.click(
      await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
    expect(click).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  },
);

it('passes a fresh customer JWT and navigates to the Odoo download in the current window', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  server.use(
    http.get(
      'https://api.example/staging/orders/:orderId/invoice/download',
      async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe(`Bearer ${data.token}`);
        expect(request.credentials).toBe('omit');
        expect(new URL(request.url).pathname).toBe(
          `/staging/orders/${data.orderId}/invoice/download`,
        );
        expect(await request.text()).toBe('');
        return HttpResponse.json(
          { downloadUrl: data.downloadUrl },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      },
    ),
  );
  const navigate = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
  const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null);
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
  await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith(data.downloadUrl));
  expect(openWindow).not.toHaveBeenCalled();
  expect(openOrder).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('does not call the backend when the customer is not signed in', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  const backendRequest = vi.fn();
  server.use(
    http.get('*/customer/current.jwt', () => new HttpResponse(null, { status: 404 })),
    http.get('https://api.example/staging/orders/:orderId/invoice/download', () => {
      backendRequest();
      return HttpResponse.json({ downloadUrl: data.downloadUrl });
    }),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Accedi nuovamente per scaricare la fattura.',
  );
  expect(backendRequest).not.toHaveBeenCalled();
});

it.each([
  [401, 'Accedi nuovamente per scaricare la fattura.'],
  [403, 'Non hai accesso a questa fattura.'],
  [404, 'Fattura non ancora disponibile.'],
])('explains a backend response with status %i', async (status, message) => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  server.use(
    http.get(
      'https://api.example/staging/orders/:orderId/invoice/download',
      () => new HttpResponse(null, { status }),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${data.orderId}`,
  });
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(button).toBeEnabled();
});

it('rejects a download link without HTTPS', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  const navigate = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
  server.use(
    http.get('https://api.example/staging/orders/:orderId/invoice/download', () =>
      HttpResponse.json({ downloadUrl: data.downloadUrl.replace('https:', 'http:') }),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
  expect(navigate).not.toHaveBeenCalled();
});

it('fetches a new token when retrying after a network failure', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  server.use(
    http.get('https://api.example/staging/orders/:orderId/invoice/download', () =>
      HttpResponse.error(),
    ),
  );
  const navigate = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${data.orderId}`,
  });
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
  const nextData = buildDownloadWith({ clientId: data.clientId, orderId: data.orderId });
  mockCustomerToken(nextData);
  server.use(
    http.get('https://api.example/staging/orders/:orderId/invoice/download', ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${nextData.token}`);
      return HttpResponse.json({ downloadUrl: nextData.downloadUrl });
    }),
  );
  await user.click(button);
  await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith(nextData.downloadUrl));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
