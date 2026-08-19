import { IntlProvider } from 'react-intl';
import { faker, render, screen } from 'tests/test-utils';

import en from '@/lib/lang/locales/en.json';
import italianMessages from '@/lib/lang/locales/it.json';

import OrderStatus from './OrderStatus';

describe('OrderStatus', () => {
  it('displays the translated label for the current order status', () => {
    render(
      <IntlProvider locale="it" messages={{ ...en, ...italianMessages }}>
        <OrderStatus code="Shipped" text={faker.lorem.words()} />
      </IntlProvider>,
    );

    expect(screen.getByText(italianMessages['orders.status.shipped'])).toBeInTheDocument();
  });

  it('preserves a custom status label when the translation matches the system label', () => {
    const customStatusLabel = faker.lorem.words();

    render(
      <IntlProvider locale="en" messages={en}>
        <OrderStatus code="Shipped" text={customStatusLabel} />
      </IntlProvider>,
    );

    expect(screen.getByText(customStatusLabel)).toBeInTheDocument();
  });
});
