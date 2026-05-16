import { useState, useEffect } from 'react';
import { useGenerateComparison } from '../api/comparison';
import { useSubmitFeedback } from '../api/feedback';
import { useSessionStore } from '../hooks/useSessionStore';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ComparisonPanel from '../components/comparison/ComparisonPanel';
import MetricsTable from '../components/comparison/MetricsTable';
import FeedbackForm from '../components/feedback/FeedbackForm';

const ComparisonPage: React.FC = () => {
  const sessionId = useSessionStore((s) => s.sessionId);
  const lastComparison = useSessionStore((s) => s.lastComparison);
  const setLastComparison = useSessionStore((s) => s.setLastComparison);
  const { mutateAsync, data: newData, isPending, error } = useGenerateComparison();
  const feedbackMutation = useSubmitFeedback();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Use cached data if available, otherwise use new data
  const data = newData || lastComparison;

  // Save comparison data to session store when new data is received
  useEffect(() => {
    if (newData) {
      setLastComparison(newData);
    }
  }, [newData, setLastComparison]);

  const handleRunComparison = async () => {
    if (!sessionId) return;
    const result = await mutateAsync({ session_id: sessionId });
    setLastComparison(result);
  };

  const handleSubmitFeedback = async (entries: Parameters<typeof FeedbackForm>[0]['onSubmit'] extends (
    arg: infer T,
  ) => any
    ? T
    : never) => {
    if (!sessionId) return;
    await feedbackMutation.mutateAsync({
      session_id: sessionId,
      feedbacks: entries,
    });
    setFeedbackSubmitted(true);
  };

    return (
      <div className="flex flex-col min-h-screen w-full gap-5 px-4 py-6 sm:px-6 lg:px-12 bg-background">
      <section className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10 shadow-colorful">
        <div>
          <h2 className="text-base font-semibold bg-gradient-to-r from-bright-blue to-primary bg-clip-text text-transparent">Model Comparison</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleRunComparison}
            disabled={!sessionId}
            loading={isPending}
            className="whitespace-nowrap"
          >
            Generate Comparison
          </Button>
        </div>
      </section>

      {!sessionId && (
        <p className="text-xs text-warning">
          Run a query on the Home page first to create a session, then return here.
        </p>
      )}

      {isPending && <LoadingSpinner label="Generating answers and computing metrics…" />}
      {error && <ErrorState message={error.message} />}

      {data && (
        <>
          <ComparisonPanel data={data} />
          <MetricsTable metrics={data.calculated_metrics} />

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => setFeedbackOpen(true)}
              disabled={feedbackSubmitted}
              className="bg-gradient-to-r from-bright-orange to-bright-red hover:from-bright-pink hover:to-bright-orange"
            >
              {feedbackSubmitted ? 'Thank you for your feedback' : 'Rate Answers'}
            </Button>
          </div>
        </>
      )}

      {feedbackOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-overlay backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-bright-orange/30 bg-gradient-to-br from-bright-orange/5 to-bright-pink/10 p-4 sm:p-6 shadow-bright animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between gap-2 p-3 rounded-2xl border border-bright-orange/20 bg-gradient-to-r from-bright-orange/10 to-bright-pink/10">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] bg-gradient-to-r from-bright-orange to-bright-pink bg-clip-text text-transparent">
                  Rate Answers
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => setFeedbackOpen(false)}
              >
                Close
              </Button>
            </div>
            <FeedbackForm onSubmit={handleSubmitFeedback} submitting={feedbackMutation.isPending} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
