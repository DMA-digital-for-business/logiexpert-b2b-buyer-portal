import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  faker,
  renderWithProviders,
  waitFor,
} from 'tests/test-utils';

import B3Layout from './B3Layout';

vi.mock('./B3CloseAppButton', () => ({ default: () => null }));
vi.mock('./B3Logo', () => ({ default: () => null }));
vi.mock('./B3MainHeader', () => ({ default: () => null }));
vi.mock('./B3MobileLayout', () => ({ default: () => null }));
vi.mock('./B3Nav', () => ({ default: () => null }));
vi.mock('../B3Dialog', () => ({ default: () => null }));
vi.mock('../CompanyCredit', () => ({ default: () => null }));

describe('B3Layout authentication guard', () => {
  const protectedRoute = '/orders';

  it('keeps the requested route while the customer session is initializing', async () => {
    const content = faker.lorem.words();
    const loggedOutCustomer = buildCompanyStateWith({
      customer: {
        id: 0,
        emailAddress: '',
      },
    });
    const initializingApp = buildGlobalStateWith({ isPageComplete: false });

    const { navigation } = renderWithProviders(<B3Layout>{content}</B3Layout>, {
      initialEntries: [protectedRoute],
      preloadedState: {
        company: loggedOutCustomer,
        global: initializingApp,
      },
    });

    await waitFor(() => {
      expect(navigation).toHaveBeenLastCalledWith(protectedRoute);
    });
    expect(navigation).not.toHaveBeenCalledWith('/login');
  });

  it('redirects an unauthenticated customer after session initialization finishes', async () => {
    const content = faker.lorem.words();
    const loggedOutCustomer = buildCompanyStateWith({
      customer: {
        id: 0,
        emailAddress: '',
      },
    });
    const initializedApp = buildGlobalStateWith({ isPageComplete: true });

    const { navigation } = renderWithProviders(<B3Layout>{content}</B3Layout>, {
      initialEntries: [protectedRoute],
      preloadedState: {
        company: loggedOutCustomer,
        global: initializedApp,
      },
    });

    await waitFor(() => {
      expect(navigation).toHaveBeenLastCalledWith('/login');
    });
  });
});
