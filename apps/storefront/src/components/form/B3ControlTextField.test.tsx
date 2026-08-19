import { useForm } from 'react-hook-form';
import { faker, renderWithProviders, screen } from 'tests/test-utils';

import { B3ControlTextField } from './B3ControlTextField';

interface TestFieldProps {
  label: string;
  required?: boolean;
  tooltipText?: string;
}

function TestField({ label, required = false, tooltipText }: TestFieldProps) {
  const { control } = useForm();

  return (
    <B3ControlTextField
      control={control}
      default=""
      errors={{}}
      extraPadding={{}}
      fieldType="text"
      label={label}
      name="addressLabel"
      required={required}
      tooltipText={tooltipText}
      variant="filled"
    />
  );
}

describe('B3ControlTextField', () => {
  it('displays supporting information in a tooltip', async () => {
    const label = faker.lorem.words();
    const tooltipText = faker.lorem.sentence();
    const { user } = renderWithProviders(<TestField label={label} tooltipText={tooltipText} />);

    await user.hover(screen.getByLabelText(tooltipText));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(tooltipText);
    expect(screen.getByRole('textbox', { name: label })).toBeInTheDocument();
  });

  it('marks required fields as required', () => {
    const label = faker.lorem.words();

    renderWithProviders(<TestField label={label} required />);

    expect(screen.getByRole('textbox', { name: label })).toBeRequired();
  });
});
