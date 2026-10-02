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
  downloadUrl: `https://invoices.s3.eu-west-1.amazonaws.com/${faker.string.uuid()}.pdf?signature=${faker.string.alphanumeric(24)}`,
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
  Object.assign(invoiceDownloadConfig, { apiUrl: 'https://api.example/Stage/', clientId: '' });
});

afterEach(() => {
  Object.assign(invoiceDownloadConfig, originalConfig);
});

it('passes the fresh customer JWT and order ID to the backend and follows the S3 link', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  server.use(
    http.get('https://api.example/Stage/orders/:orderId/invoice/download', async ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${data.token}`);
      expect(request.credentials).toBe('omit');
      expect(new URL(request.url).pathname).toBe(`/Stage/orders/${data.orderId}/invoice/download`);
      expect(await request.text()).toBe('');
      return HttpResponse.json({ downloadUrl: data.downloadUrl });
    }),
  );
  let downloadedUrl: string | undefined;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureDownload(
    this: HTMLAnchorElement,
  ) {
    downloadedUrl = this.href;
    expect(this.referrerPolicy).toBe('no-referrer');
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
  await waitFor(() => expect(downloadedUrl).toBe(data.downloadUrl));
  expect(openOrder).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('does not call the backend when the customer is not signed in', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  const backendRequest = vi.fn();
  server.use(
    http.get('*/customer/current.jwt', () => new HttpResponse(null, { status: 404 })),
    http.get('https://api.example/Stage/orders/:orderId/invoice/download', () => {
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
      'https://api.example/Stage/orders/:orderId/invoice/download',
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
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  server.use(
    http.get('https://api.example/Stage/orders/:orderId/invoice/download', () =>
      HttpResponse.json({ downloadUrl: data.downloadUrl.replace('https:', 'http:') }),
    ),
  );
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  await user.click(
    await screen.findByRole('button', { name: `Scarica fattura per l’ordine ${data.orderId}` }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
  expect(click).not.toHaveBeenCalled();
});

it('fetches a new token when retrying after a network failure', async () => {
  const data = buildDownloadWith('WHATEVER_VALUES');
  invoiceDownloadConfig.clientId = data.clientId;
  mockCustomerToken(data);
  server.use(
    http.get('https://api.example/Stage/orders/:orderId/invoice/download', () =>
      HttpResponse.error(),
    ),
  );
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const { user } = renderWithProviders(<InvoiceDownloadButton orderId={data.orderId} />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${data.orderId}`,
  });
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile scaricare la fattura.');
  const nextData = buildDownloadWith({ clientId: data.clientId, orderId: data.orderId });
  mockCustomerToken(nextData);
  server.use(
    http.get('https://api.example/Stage/orders/:orderId/invoice/download', ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${nextData.token}`);
      return HttpResponse.json({ downloadUrl: nextData.downloadUrl });
    }),
  );
  await user.click(button);
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
