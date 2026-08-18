import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from './ErrorPage';

function Boom(): never {
  throw new Error('Feuer außer Kontrolle');
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        errorElement: <ErrorPage />,
        children: [
          { path: '/', element: <Boom /> },
          { path: '*', element: <ErrorPage /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('ErrorPage', () => {
  it('zeigt eine 404-Seite für unbekannte Pfade', () => {
    renderAt('/gibt-es-nicht');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/unauffindbar/i)).toBeInTheDocument();
  });

  it('zeigt eine Absturz-Seite samt Fehlerdetail bei geworfenen Route-Fehlern', () => {
    renderAt('/');
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Feuer außer Kontrolle')).toBeInTheDocument();
  });
});
