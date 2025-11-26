'use client';

import { useState } from 'react';
import { DemoFeedback } from '@/lib/firebase/firebase-types';
import { StarRating } from '@/components/ui/common';
import { useFirebase } from '@/contexts/data/FirebaseContext';

interface DemoFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<DemoFeedback>) => Promise<void>;
  demoId: string;
  demoName: string;
  completionTime: number; // in minutes
}

export const DemoFeedbackModal: React.FC<DemoFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  demoId,
  demoName,
  completionTime,
}) => {
  const { submitMandatoryFeedback } = useFirebase();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [difficulty, setDifficulty] = useState<DemoFeedback['difficulty']>('medium');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [mostHelpfulFeature, setMostHelpfulFeature] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!feedback.trim()) {
      alert('Please provide your feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit mandatory feedback to separate collection
      await submitMandatoryFeedback({
        demoId,
        demoName,
        rating,
        feedback: feedback.trim(),
        difficulty,
        wouldRecommend,
        completionTime,
      });

      // Also call the original onSubmit for backward compatibility
      await onSubmit({
        demoId,
        demoName,
        rating,
        feedback: feedback.trim(),
        completionTime,
        difficulty,
        wouldRecommend,
        mostHelpfulFeature: mostHelpfulFeature.trim() || undefined,
        suggestions: suggestions.trim() || undefined,
      });

      // Reset form
      setRating(0);
      setFeedback('');
      setDifficulty('medium');
      setWouldRecommend(true);
      setMostHelpfulFeature('');
      setSuggestions('');

      onClose();
    } catch (err) {
      // Error in demo feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping but show a warning
    if (
      confirm(
        'Are you sure you want to skip feedback? Your input helps us improve the demos for everyone!'
      )
    ) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm'>
      <div className='relative w-full max-w-2xl mx-4 bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='relative p-6 border-b border-white/10'>
          <div className='absolute inset-0 bg-gradient-to-r from-brand-500/10 via-accent-500/10 to-brand-500/10 rounded-t-2xl'></div>
          <div className='relative z-10'>
            <h2 className='text-2xl font-bold text-white mb-2'>🎉 Demo Completed!</h2>
            <p className='text-brand-200'>
              Help us improve <span className='font-semibold text-accent-400'>{demoName}</span> with
              your feedback
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Rating */}
          <div>
            <label className='block text-sm font-medium text-white mb-3'>
              Overall Rating <span className='text-red-400'>*</span>
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              maxRating={5}
              size='lg'
              showLabels={true}
              disabled={isSubmitting}
            />
          </div>

          {/* Feedback */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              Your Feedback <span className='text-red-400'>*</span>
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder='What did you think about this demo? What worked well? What could be improved?'
              rows={4}
              className='w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none'
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              How difficult was this demo?
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as DemoFeedback['difficulty'])}
              className='w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
            >
              <option value='very_easy'>Very Easy</option>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
              <option value='very_hard'>Very Hard</option>
            </select>
          </div>

          {/* Recommendation */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              Would you recommend this demo to others?
            </label>
            <div className='flex items-center space-x-6'>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='recommend'
                  checked={wouldRecommend === true}
                  onChange={() => setWouldRecommend(true)}
                  className='w-4 h-4 text-brand-500 border-white/20 focus:ring-brand-500 bg-white/5'
                />
                <span className='ml-2 text-white'>Yes 👍</span>
              </label>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='recommend'
                  checked={wouldRecommend === false}
                  onChange={() => setWouldRecommend(false)}
                  className='w-4 h-4 text-brand-500 border-white/20 focus:ring-brand-500 bg-white/5'
                />
                <span className='ml-2 text-white'>No 👎</span>
              </label>
            </div>
          </div>

          {/* Most Helpful Feature */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              What was the most helpful feature? (Optional)
            </label>
            <input
              type='text'
              value={mostHelpfulFeature}
              onChange={e => setMostHelpfulFeature(e.target.value)}
              placeholder='e.g., Step-by-step guidance, Interactive examples, Clear explanations...'
              className='w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
            />
          </div>

          {/* Suggestions */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              Suggestions for improvement (Optional)
            </label>
            <textarea
              value={suggestions}
              onChange={e => setSuggestions(e.target.value)}
              placeholder='Any ideas on how we could make this demo better?'
              rows={3}
              className='w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none'
            />
          </div>

          {/* Completion Stats */}
          <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
            <h4 className='text-sm font-medium text-white mb-2'>📊 Your Stats</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-white/70'>Completion Time:</span>
                <div className='text-brand-400 font-medium'>{completionTime} minutes</div>
              </div>
              <div>
                <span className='text-white/70'>Demo:</span>
                <div className='text-accent-400 font-medium'>{demoName}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex items-center justify-between pt-4 border-t border-white/10'>
            <button
              type='button'
              onClick={handleSkip}
              disabled={isSubmitting}
              className='px-6 py-3 text-white/70 hover:text-white transition-colors duration-200 disabled:opacity-50'
            >
              Skip for now
            </button>

            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={onClose}
                disabled={isSubmitting}
                className='px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg transition-all duration-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting || !feedback.trim() || rating === 0}
                className='px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-xl'
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback 🚀'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
