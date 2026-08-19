import { IntlProvider } from 'react-intl';
import { builder, faker, render, screen } from 'tests/test-utils';

import en from '@/lib/lang/locales/en.json';
import { BillingAddress, ContactInfo, QuoteInfoAndExtrafieldsItemProps } from '@/types/quotes';

import QuoteInfo from './QuoteInfo';

const buildContactInfoWith = builder<ContactInfo>(() => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  companyName: faker.company.name(),
  phoneNumber: faker.phone.number(),
}));

const buildAddressWith = builder<BillingAddress>(() => ({
  address: faker.location.streetAddress(),
  addressId: faker.number.int(),
  apartment: faker.location.secondaryAddress(),
  city: faker.location.city(),
  companyName: faker.company.name(),
  country: faker.location.country(),
  firstName: faker.person.firstName(),
  label: faker.lorem.word(),
  lastName: faker.person.lastName(),
  phoneNumber: faker.phone.number(),
  state: faker.location.state(),
  zipCode: faker.location.zipCode(),
}));

const buildQuoteInfoWith = builder<QuoteInfoAndExtrafieldsItemProps>(() => ({
  info: {
    quoteTitle: faker.lorem.words(),
    referenceNumber: faker.string.uuid(),
  },
  extraFields: [],
  recipients: [],
}));

const noAddress = buildAddressWith({
  address: '',
  apartment: '',
  city: '',
  companyName: '',
  country: '',
  firstName: '',
  label: '',
  lastName: '',
  phoneNumber: '',
  state: '',
  zipCode: '',
});

const renderQuoteInfo = (status: string, translations: Record<string, string>) =>
  render(
    <IntlProvider locale="en" messages={{ ...en, ...translations }}>
      <QuoteInfo
        billingAddress={noAddress}
        contactInfo={buildContactInfoWith('WHATEVER_VALUES')}
        quoteAndExtraFieldsInfo={buildQuoteInfoWith('WHATEVER_VALUES')}
        shippingAddress={noAddress}
        status={status}
      />
    </IntlProvider>,
  );

describe('QuoteInfo missing address messages', () => {
  it('displays translated prompts for a draft quote', () => {
    const addBillingAddress = faker.lorem.sentence();
    const addShippingAddress = faker.lorem.sentence();

    renderQuoteInfo('Draft', {
      'global.quoteInfo.addBillingAddress': addBillingAddress,
      'global.quoteInfo.addShippingAddress': addShippingAddress,
    });

    expect(screen.getByText(addBillingAddress)).toBeInTheDocument();
    expect(screen.getByText(addShippingAddress)).toBeInTheDocument();
  });

  it('displays translated missing-address messages for a submitted quote', () => {
    const noBillingAddress = faker.lorem.sentence();
    const noShippingAddress = faker.lorem.sentence();

    renderQuoteInfo('Submitted', {
      'global.quoteInfo.noBillingAddress': noBillingAddress,
      'global.quoteInfo.noShippingAddress': noShippingAddress,
    });

    expect(screen.getByText(noBillingAddress)).toBeInTheDocument();
    expect(screen.getByText(noShippingAddress)).toBeInTheDocument();
  });
});
