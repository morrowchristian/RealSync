import { render, screen, fireEvent } from '@testing-library/react';
import ContactCard from '../../../components/ui/ContactCard';
import { renderWithProviders } from '../../test-utils';
import type { Lead } from '../../../types/lead';

const lead: Lead = {
  id: 1,
  full_name: 'Lucas Moreau',
  email: 'lucas.moreau@atlasfreight.example',
  phone: '(469) 555-0107',
  property_address: '12 Freight Way',
  status: 'lost',
  agent: 1,
  created_at: '2026-05-02',
  is_archived: false,
  company: 'Atlas Freight',
  lead_source: 'referral',
  notes: 'No response after three touches. Marking lost; revisit next quarter.',
  preferred_contact: 'email',
  custom_data: { budget: 250000, nickname: 'Luke' },
};

const customFields = [
  {
    id: 1,
    agent: 1,
    name: 'budget',
    label: 'Budget',
    field_type: 'number' as const,
    required: false,
    options: [],
    order: 0,
    is_active: true,
  },
];

describe('ContactCard', () => {
  test('shows every field with email/phone links, labels, and dates', () => {
    renderWithProviders(
      <ContactCard
        lead={lead}
        customFields={customFields}
        ownerName="Alex Rivera"
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByTestId('contact-card')).toBeInTheDocument();
    expect(screen.getByText('Contact card')).toBeInTheDocument();
    expect(screen.getByText('Lucas Moreau')).toBeInTheDocument();
    expect(screen.getByText('Atlas Freight')).toBeInTheDocument();

    const emailLink = screen.getByRole('link', { name: 'lucas.moreau@atlasfreight.example' });
    expect(emailLink).toHaveAttribute('href', 'mailto:lucas.moreau@atlasfreight.example');
    const phoneLink = screen.getByRole('link', { name: '(469) 555-0107' });
    expect(phoneLink).toHaveAttribute('href', 'tel:4695550107');

    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Referral')).toBeInTheDocument();
    // "Email" appears as the Email row label and as the Preferred Contact value.
    expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('May 2, 2026')).toBeInTheDocument();
    expect(screen.getByText(/No response after three touches/)).toBeInTheDocument();
    // Custom-field values, labelled.
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('250000')).toBeInTheDocument();
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByText('Luke')).toBeInTheDocument();
  });

  test('Go back calls onBack and Edit Entry calls onEdit', () => {
    const onBack = jest.fn();
    const onEdit = jest.fn();
    renderWithProviders(
      <ContactCard lead={lead} onBack={onBack} onEdit={onEdit} />
    );
    fireEvent.click(screen.getByTestId('contact-card-back'));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('contact-card-edit-entry'));
    expect(onEdit).toHaveBeenCalled();
  });

  test('Toggle Inline Edit shows the form, toggling back returns to the card', async () => {
    renderWithProviders(
      <ContactCard lead={lead} onBack={jest.fn()} onEdit={jest.fn()} />
    );
    fireEvent.click(screen.getByTestId('contact-card-toggle-edit'));
    expect(await screen.findByTestId('lead-full_name')).toHaveValue('Lucas Moreau');
    expect(screen.getByTestId('lead-lead_source')).toHaveValue('referral');

    fireEvent.click(screen.getByTestId('contact-card-toggle-edit'));
    expect(screen.queryByTestId('lead-full_name')).not.toBeInTheDocument();
    expect(screen.getByTestId('contact-card')).toBeInTheDocument();
    expect(screen.getByText('Lucas Moreau')).toBeInTheDocument();
  });
});
