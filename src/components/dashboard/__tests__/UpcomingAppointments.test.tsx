import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UpcomingAppointments } from '../UpcomingAppointments';

describe('UpcomingAppointments', () => {
  it('renders valid and invalid appointment dates without crashing', () => {
    render(
      <UpcomingAppointments
        appointments={[
          {
            id: 1,
            appointmentDate: '2026-07-15T14:30:00-03:00',
            appointmentTime: '14:30',
            status: 'CONFIRMED',
            pet: { name: 'Pet Sintético' },
            tutor: { name: 'Tutor Sintético' },
          },
          {
            id: 2,
            appointmentDate: 'invalid-date',
            status: 'SCHEDULED',
          },
        ]}
        isLoading={false}
        onAppointmentClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Pet Sintético')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('15/07/2026')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
