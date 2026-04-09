'use client';

import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ToastTestPage() {
  const { position, setPosition } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleBasicSuccess = () => {
    toast.success('Profile updated');
  };

  const handleBasicError = () => {
    toast.error('Failed to submit', { description: 'Check your network and retry.' });
  };

  const handleBasicWarning = () => {
    toast.warning('Deadline in 2 hours', { description: 'Assignment: SAT Essay Draft' });
  };

  const handleBasicInfo = () => {
    toast.info('New workshop added');
  };

  const handleWithAction = () => {
    toast.success('Essay referred', {
      description: 'Sent to Dr. Karimov for review.',
      action: {
        label: 'Undo',
        onClick: () => toast.info('Undo action triggered'),
      },
    });
  };

  const handleLoadingSuccess = async () => {
    setIsLoading(true);
    const { resolve } = toast.loading('Saving changes…');
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    resolve('Profile saved successfully');
    setIsLoading(false);
  };

  const handleLoadingError = async () => {
    setIsLoading(true);
    const { reject } = toast.loading('Saving changes…');
    
    // Simulate async operation that fails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    reject('Save failed', { description: 'Please try again.' });
    setIsLoading(false);
  };

  const handleMultiple = () => {
    toast.success('First toast');
    setTimeout(() => toast.error('Second toast'), 500);
    setTimeout(() => toast.warning('Third toast'), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Toast System Test</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Test the custom toast notification system with various variants and features.
        </p>

        {/* Position Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Toast Position</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'top-left',
              'top-center',
              'top-right',
              'bottom-left',
              'bottom-center',
              'bottom-right',
            ].map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  position === pos
                    ? 'bg-purple_blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Variants */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Variants</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBasicSuccess}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Success Toast
            </button>
            <button
              onClick={handleBasicError}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Error Toast
            </button>
            <button
              onClick={handleBasicWarning}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Warning Toast
            </button>
            <button
              onClick={handleBasicInfo}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Info Toast
            </button>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Advanced Features</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleWithAction}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Toast with Action
            </button>
            <button
              onClick={handleMultiple}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Multiple Toasts
            </button>
          </div>
        </div>

        {/* Loading Pattern */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Loading Pattern</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLoadingSuccess}
              disabled={isLoading}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Loading → Success'}
            </button>
            <button
              onClick={handleLoadingError}
              disabled={isLoading}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Loading → Error'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Usage Examples</h2>
          <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
{`// Basic usage
import { toast } from '@/hooks/use-toast';

toast.success('Profile updated');
toast.error('Failed to submit', { description: 'Check your network.' });
toast.warning('Deadline in 2 hours');
toast.info('New workshop added');

// With action
toast.success('Essay referred', {
  description: 'Sent to Dr. Karimov for review.',
  action: {
    label: 'Undo',
    onClick: () => undoReferral(),
  },
});

// Loading pattern
const { resolve, reject } = toast.loading('Saving changes…');
try {
  await api.save();
  resolve('Saved successfully');
} catch {
  reject('Save failed');
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
