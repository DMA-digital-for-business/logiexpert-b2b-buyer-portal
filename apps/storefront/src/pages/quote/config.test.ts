import getAccountFormFields from './config';

describe('quote address fields', () => {
  const translate = (key: string) => key;

  it('identifies the required address fields', () => {
    const fields = getAccountFormFields(false, translate);

    expect(fields.filter(({ required }) => required).map(({ name }) => name)).toEqual([
      'firstName',
      'lastName',
      'country',
      'address',
      'city',
      'state',
      'zipCode',
    ]);
  });

  it('adds explanatory tooltip text to the address label field', () => {
    const fields = getAccountFormFields(false, translate);
    const addressLabelField = fields.find(({ name }) => name === 'label');

    expect(addressLabelField).toMatchObject({
      label: 'quoteDraft.config.addressLabel',
      tooltipText: 'quoteDraft.config.addressLabelTooltip',
    });
  });
});
