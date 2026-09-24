import { store } from '@/store';
import { QuoteItem } from '@/types/quotes';
import { pushAnalyticsEvent } from '@/utils/analytics';

type QuoteEvent = 'add_to_quote' | 'view_quote' | 'remove_from_quote';

export function pushQuoteEvent(event: QuoteEvent, products: QuoteItem[]) {
  const { enteredInclusiveTax } = store.getState().storeConfigs.currencies;
  const items = products
    .filter(({ node }) => Number(node.quantity) > 0)
    .map(({ node }) => {
      const product = node.productsSearch;
      const price = Number(node.basePrice) - (enteredInclusiveTax ? Number(node.taxPrice || 0) : 0);

      return {
        item_id: String(node.productId || product.id),
        item_name: node.productName || product.name,
        ...(product.brand ? { item_brand: product.brand } : {}),
        ...(product.category ? { item_category: product.category } : {}),
        ...(product.category2 ? { item_category2: product.category2 } : {}),
        ...(node.variantSku ? { item_variant: node.variantSku } : {}),
        price: Math.max(0, price),
        quantity: Number(node.quantity),
      };
    });

  if (!items.length) return;

  pushAnalyticsEvent(event, {
    currency: 'EUR',
    value: items.reduce((total, item) => total + item.price * item.quantity, 0),
    items,
    ...(event === 'remove_from_quote'
      ? {}
      : { item_count: items.reduce((total, item) => total + item.quantity, 0) }),
  });
}
