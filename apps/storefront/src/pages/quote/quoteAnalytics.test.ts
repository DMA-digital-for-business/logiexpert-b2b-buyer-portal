import { builder, faker } from 'tests/test-utils';

import { store } from '@/store';
import { QuoteItem } from '@/types/quotes';

import { pushQuoteEvent } from './quoteAnalytics';

const buildQuoteItemWith = builder<QuoteItem>(() => ({
  node: {
    id: faker.string.uuid(),
    basePrice: faker.number.int({ min: 10, max: 100 }),
    taxPrice: faker.number.int({ min: 1, max: 9 }),
    quantity: faker.number.int({ min: 1, max: 10 }),
    optionList: '[]',
    productId: faker.number.int(),
    productName: faker.commerce.productName(),
    variantSku: faker.string.alphanumeric(8),
    calculatedValue: {},
    productsSearch: {
      id: faker.number.int(),
      name: faker.commerce.productName(),
    } as QuoteItem['node']['productsSearch'],
  },
}));

describe('quote analytics', () => {
  it('pushes quote items and quantities to the storefront data layer', () => {
    const product = buildQuoteItemWith('WHATEVER_VALUES');
    const analyticsWindow = window as Window & { dataLayer?: Record<string, unknown>[] };
    analyticsWindow.dataLayer = [];

    pushQuoteEvent('add_to_quote', [product]);

    const { enteredInclusiveTax } = store.getState().storeConfigs.currencies;
    const expectedPrice =
      product.node.basePrice - (enteredInclusiveTax ? product.node.taxPrice : 0);

    expect(analyticsWindow.dataLayer).toEqual([
      expect.objectContaining({
        event: 'add_to_quote',
        currency: 'EUR',
        value: expectedPrice * product.node.quantity,
        item_count: product.node.quantity,
        items: [
          expect.objectContaining({
            item_id: String(product.node.productId),
            price: expectedPrice,
            quantity: product.node.quantity,
          }),
        ],
      }),
    ]);
  });
});
