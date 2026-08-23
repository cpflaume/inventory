import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { collectClientInfo } from '../feedback/clientInfo';
import { getNavigationHistory, recordNavigation } from '../feedback/navHistory';
import { Button, Modal } from './ui';

/**
 * Schwebender Feedback-Button (unten rechts, wie eine Chat-Bubble). Öffnet ein Popup mit Textfeld;
 * das Feedback wird samt Kontext (aktuelle Seite, Client-/Gerätedetails, Navigationsverlauf) als
 * GitHub-Issue angelegt. Nur sichtbar für angemeldete Benutzer, wenn das Backend Feedback aktiviert
 * hat. Nach dem Absenden erscheint eine kurze Danke-Animation, dann schließt sich das Popup.
 */
export default function FeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();

  // Navigationsverlauf mitschreiben (dient nur als Feedback-Kontext).
  useEffect(() => {
    recordNavigation(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const config = useQuery({
    queryKey: ['feedbackConfig'],
    queryFn: () => api.feedbackConfig(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const submit = useMutation({
    mutationFn: () =>
      api.sendFeedback({
        message: message.trim(),
        path: location.pathname + location.search,
        url: window.location.href,
        client: collectClientInfo(),
        history: getNavigationHistory(),
      }),
    onSuccess: () => {
      setDone(true);
      // Danke-Animation kurz stehen lassen, dann schließen und zurücksetzen.
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        setDone(false);
        setMessage('');
        submit.reset();
      }, 1800);
    },
  });

  // Nur für angemeldete Benutzer und nur wenn das Backend Feedback aktiviert hat.
  if (!user || !config.data?.enabled) return null;

  const close = () => {
    if (submit.isPending || done) return;
    setOpen(false);
    setMessage('');
    submit.reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Feedback geben"
        title="Feedback geben"
        className="no-print fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-moos-600 text-2xl text-white shadow-lg ring-1 ring-moos-700/20 transition hover:scale-105 hover:bg-moos-700 sm:bottom-6"
      >
        💬
      </button>

      {open && (
        <Modal
          title={<span>💬 Feedback</span>}
          onClose={close}
          footer={
            done ? undefined : (
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={close} disabled={submit.isPending}>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => submit.mutate()}
                  disabled={!message.trim() || submit.isPending}
                >
                  {submit.isPending ? 'Wird gesendet…' : 'Absenden'}
                </Button>
              </div>
            )
          }
        >
          {done ? (
            <div className="flex animate-feedback-pop flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moos-100 text-4xl">
                ✅
              </span>
              <p className="text-lg font-bold text-moos-800">Danke für dein Feedback!</p>
              <p className="text-sm text-moos-500">Wir haben es als Ticket festgehalten.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-moos-600">
                Was ist dir aufgefallen? Ein Fehler, eine Idee, ein Lob? Wir legen daraus
                automatisch ein Ticket an – die aktuelle Seite und ein paar technische Details
                gehen zur besseren Nachvollziehbarkeit mit.
              </p>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dein Feedback…"
                rows={5}
                className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
              />
              {submit.isError && (
                <p className="text-sm text-red-600">{(submit.error as Error).message}</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
