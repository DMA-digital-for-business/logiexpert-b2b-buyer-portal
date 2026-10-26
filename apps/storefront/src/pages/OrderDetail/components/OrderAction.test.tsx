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

import { invoiceDownloadConfig } from '@/pages/order/invoiceDownload';
import { OrderDetailsState } from '@/pages/OrderDetail/context/OrderDetailsContext';

import { OrderAction } from './OrderAction';

vi.mock('@/pages/order/invoiceDownload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/pages/order/invoiceDownload')>()),
  isInvoiceDownloadConfigured: true,
}));

const { server } = startMockServer();
const buildOrderWith = builder<OrderDetailsState>(() => ({
  orderId: faker.number.int({ min: 1, max: 99999 }),
  products: [],
  orderComments: faker.lorem.sentence(),
}));
const buildDownloadWith = builder(() => ({
  clientId: faker.string.alphanumeric(24),
  token: Array.from({ length: 3 }, () => faker.string.alphanumeric(24)).join('.'),
  downloadUrl: `https://invoices.odoo.com/web/content/${faker.number.int({ min: 1 })}?download=true&access_token=${faker.string.uuid()}`,
}));
const originalConfig = { ...invoiceDownloadConfig };

afterEach(() => Object.assign(invoiceDownloadConfig, originalConfig));

it('downloads the invoice from the order detail instead of showing the legacy invoice buttons', async () => {
  const order = buildOrderWith('WHATEVER_VALUES');
  const data = buildDownloadWith('WHATEVER_VALUES');
  Object.assign(invoiceDownloadConfig, {
    apiUrl: 'https://api.example/staging',
    clientId: data.clientId,
  });
  server.use(
    http.get('*/customer/current.jwt', () => HttpResponse.text(data.token)),
    http.get(
      'https://api.example/staging/orders/:orderId/invoice/download',
      ({ request, params }) => {
        expect(params.orderId).toBe(String(order.orderId));
        expect(request.headers.get('Authorization')).toBe(`Bearer ${data.token}`);
        return HttpResponse.json(
          { downloadUrl: data.downloadUrl },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      },
    ),
  );
  const navigate = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
  const { user } = renderWithProviders(<OrderAction detailsData={order} isCurrentCompany />);
  const button = await screen.findByRole('button', {
    name: `Scarica fattura per l’ordine ${order.orderId}`,
  });
  expect(
    screen.queryByRole('button', { name: /visualizza fattura|stampa fattura/i }),
  ).not.toBeInTheDocument();
  await user.click(button);
  await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith(data.downloadUrl));
});
