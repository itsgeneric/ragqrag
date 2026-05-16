import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ModelType, FeedbackRatings } from '../../api/feedback';
import Button from '../common/Button';

type ModelConfig = {
  model_type: ModelType;
  label: string;
};

const MODELS: ModelConfig[] = [
  { model_type: 'plain_llm', label: 'Plain LLM' },
  { model_type: 'mongodb_rag', label: 'MongoDB RAG' },
  { model_type: 'neo4j_kg_rag', label: 'Neo4j KG RAG' },
];

type Props = {
  onSubmit: (values: { model_type: ModelType; ratings: FeedbackRatings }[]) => Promise<void> | void;
  submitting?: boolean;
};

const RATING_KEYS: (keyof FeedbackRatings)[] = ['accuracy', 'completeness', 'coherence', 'helpfulness'];

const FeedbackForm: React.FC<Props> = ({ onSubmit, submitting }) => {
  const [values, setValues] = useState<Record<ModelType, FeedbackRatings>>({
    plain_llm: { accuracy: 0, completeness: 0, coherence: 0, helpfulness: 0 },
    mongodb_rag: { accuracy: 0, completeness: 0, coherence: 0, helpfulness: 0 },
    neo4j_kg_rag: { accuracy: 0, completeness: 0, coherence: 0, helpfulness: 0 },
  });
  const [error, setError] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<{model: ModelType, key: keyof FeedbackRatings, star: number} | null>(null);

  const handleChange = (model: ModelType, key: keyof FeedbackRatings, val: number) => {
    setValues((prev) => ({
      ...prev,
      [model]: {
        ...prev[model],
        [key]: val,
      },
    }));
  };

  const StarRating = ({ model, ratingKey, value }: { model: ModelType, ratingKey: keyof FeedbackRatings, value: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-lg transition-colors ${
              star <= (hoveredStar?.model === model && hoveredStar?.key === ratingKey ? hoveredStar.star : value)
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            onClick={() => handleChange(model, ratingKey, star)}
            onMouseEnter={() => setHoveredStar({model, key: ratingKey, star})}
            onMouseLeave={() => setHoveredStar(null)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Every rating must be provided (1-5)
    for (const model of MODELS) {
      const v = values[model.model_type];
      if (!v) {
        setError('Please rate all models.');
        return;
      }
      const keys: (keyof FeedbackRatings)[] = ['accuracy', 'completeness', 'coherence', 'helpfulness'];
      for (const key of keys) {
        const num = v[key];
        if (num === 0) {
          setError('Please provide ratings for all categories before submitting.');
          return;
        }
        if (num < 1 || num > 5) {
          setError('Ratings must be between 1 and 5 for each model.');
          return;
        }
      }
    }

    await onSubmit(
      MODELS.map((m) => ({
        model_type: m.model_type,
        ratings: values[m.model_type],
      })),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {MODELS.map((model) => (
          <div
            key={model.model_type}
            className={`rounded-2xl border p-4 text-sm shadow-colorful ${
              model.model_type === 'plain_llm'
                ? 'border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10'
                : model.model_type === 'mongodb_rag'
                ? 'border-bright-green/30 bg-gradient-to-br from-bright-green/5 to-bright-green/10'
                : 'border-bright-purple/30 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10'
            }`}
          >
            <div className="mb-3 p-2 rounded-lg border border-white/40 bg-white/50">
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${
                model.model_type === 'plain_llm'
                  ? 'bg-gradient-to-r from-bright-blue to-primary bg-clip-text text-transparent'
                  : model.model_type === 'mongodb_rag'
                  ? 'bg-gradient-to-r from-bright-green to-secondary bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-bright-purple to-accent bg-clip-text text-transparent'
              }`}>
                {model.label}
              </p>
            </div>

            <div className="space-y-3">
              {RATING_KEYS.map((key) => (
                <div key={key} className="p-2 rounded-lg bg-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-main capitalize">{key}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-mono shadow-sm ${
                      values[model.model_type][key] === 0 
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        : model.model_type === 'plain_llm'
                        ? 'bg-gradient-to-r from-bright-blue to-primary text-white'
                        : model.model_type === 'mongodb_rag'
                        ? 'bg-gradient-to-r from-bright-green to-secondary text-white'
                        : 'bg-gradient-to-r from-bright-purple to-accent text-white'
                    }`}>
                      {values[model.model_type][key] === 0 ? 'Not Rated' : `${values[model.model_type][key]}/5`}
                    </span>
                  </div>
                  <StarRating
                    model={model.model_type}
                    ratingKey={key}
                    value={values[model.model_type][key]}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-2xl border border-error/30 bg-gradient-to-br from-error/5 to-error/10">
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          loading={submitting}
          className="bg-gradient-to-r from-bright-indigo to-primary hover:from-primary hover:to-bright-indigo px-6 py-2"
        >
          Submit Feedback
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;


