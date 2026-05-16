import { useSessionStore } from '../hooks/useSessionStore';
import { useCleanupSession } from '../api/session';
import Button from '../components/common/Button';

const SettingsPage: React.FC = () => {
  const sessionId = useSessionStore((s) => s.sessionId);
  const setSession = useSessionStore((s) => s.setSession);
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const setReduceMotion = useSessionStore((s) => s.setReduceMotion);
  const cleanupMutation = useCleanupSession();

  const handleCleanup = async () => {
    if (!sessionId) return;
    await cleanupMutation.mutateAsync({ session_id: sessionId });
    setSession(null, '');
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/*<section>*/}
      {/*  <h2 className="text-base font-semibold text-text-main">Session & preferences</h2>*/}
      {/*  <p className="text-xs text-text-muted">*/}
      {/*    Manage the current Neo4j session and control motion preferences.*/}
      {/*  </p>*/}
      {/*</section>*/}

      <section className="glass-card flex flex-col gap-3 rounded-2xl border border-slate-100 bg-card/80 p-4 shadow-soft">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Current Session
        </h3>
        <div className="flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-text-muted">
              Session ID:{' '}
              <span className="font-mono text-[11px] text-text-main">
                {sessionId ? sessionId : 'No active session'}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              Cleaning up will remove session nodes from Neo4j and clear the in-memory cache.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleCleanup}
            disabled={!sessionId || cleanupMutation.isPending}
            loading={cleanupMutation.isPending}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-colorful transition-all hover:scale-[1.02] active:scale-[0.98] font-medium"
          >
            Cleanup session
          </Button>
        </div>
        {cleanupMutation.data && (
          <p className="text-[11px] text-success">{cleanupMutation.data.message}</p>
        )}
      </section>

      {/*<section className="glass-card flex flex-col gap-3 rounded-2xl border border-slate-100 bg-card/80 p-4 shadow-soft">*/}
      {/*  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">*/}
      {/*    Motion & accessibility*/}
      {/*  </h3>*/}
      {/*  <div className="flex items-center justify-between gap-3 text-xs">*/}
      {/*    <div>*/}
      {/*      <p className="text-text-main">Reduce motion</p>*/}
      {/*      <p className="mt-1 text-[11px] text-text-muted">*/}
      {/*        When enabled, disables most Anime.js animations and uses subtle opacity transitions.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*    <button*/}
      {/*      type="button"*/}
      {/*      onClick={() => setReduceMotion(!reduceMotion)}*/}
      {/*      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${*/}
      {/*        reduceMotion ? 'border-primary bg-primary' : 'border-slate-300 bg-slate-200'*/}
      {/*      }`}*/}
      {/*    >*/}
      {/*      <span*/}
      {/*        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${*/}
      {/*          reduceMotion ? 'translate-x-5' : 'translate-x-0.5'*/}
      {/*        }`}*/}
      {/*      />*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</section>*/}
    </div>
  );
};

export default SettingsPage;


