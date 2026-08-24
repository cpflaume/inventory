import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import FeedbackWidget from './FeedbackWidget';

const sendFeedback = vi.fn((_body: unknown) =>
  Promise.resolve({ issueNumber: 7, issueUrl: 'http://x/7' }),
);

vi.mock('../api/client', () => ({
  api: {
    feedbackConfig: () => Promise.resolve({ enabled: true }),
    sendFeedback: (body: unknown) => sendFeedback(body),
  },
}));

// Angemeldeter Benutzer, damit der Button erscheint.
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', username: 'audrey@example.org' } }),
}));

function renderWidget() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/lager/1/material']}>
        <FeedbackWidget />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FeedbackWidget', () => {
  it('sendet Feedback mit Kontext und zeigt danach eine Danke-Meldung', async () => {
    renderWidget();

    // Button erscheint erst, wenn die Feedback-Config (aktiv) geladen ist.
    const button = await screen.findByLabelText('Feedback geben');
    fireEvent.click(button);

    const textarea = await screen.findByPlaceholderText('Dein Feedback…');
    fireEvent.change(textarea, { target: { value: 'Regal-Ansicht hakt' } });

    fireEvent.click(screen.getByText('Absenden'));

    // Danke-Animation ersetzt das Formular.
    expect(await screen.findByText('Danke für dein Feedback!')).toBeInTheDocument();

    // Kontext wurde mitgeschickt.
    expect(sendFeedback).toHaveBeenCalledTimes(1);
    const payload = sendFeedback.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(payload.message).toBe('Regal-Ansicht hakt');
    expect(payload.path).toBe('/lager/1/material');
    expect(payload.url).toEqual(expect.any(String));
    expect(payload.client).toEqual(expect.any(Object));
    expect(payload.history).toEqual(expect.any(Array));
  });

  it('sendet nicht bei leerem Text', async () => {
    renderWidget();
    fireEvent.click(await screen.findByLabelText('Feedback geben'));
    const submit = screen.getByText('Absenden') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });
});
