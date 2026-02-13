import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // Send code to backend for token exchange
    exchangeCodeForToken(code);
  }, []);

  async function exchangeCodeForToken(code: string) {
    try {
      // In production, this would call your backend API
      // For now, we'll simulate the success
      setTimeout(() => {
        setStatus('success');
        setMessage('Google Calendar access granted successfully!');
        
        // Store in localStorage that auth was successful
        localStorage.setItem('google_auth_success', 'true');
        localStorage.setItem('google_auth_time', new Date().toISOString());
        
        // Redirect back to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to complete authorization');
    }
  }

  return (
    <div className="min-h-screen bg-raven-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-raven-card rounded-2xl p-8 border border-raven-border text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-raven-orange mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Authorizing...</h2>
            <p className="text-raven-muted">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-green-400">Success!</h2>
            <p className="text-raven-muted mb-4">{message}</p>
            <p className="text-sm text-raven-muted">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-red-400">Authorization Failed</h2>
            <p className="text-raven-muted mb-4">{message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-raven-orange text-white rounded-lg hover:bg-raven-orange/80 transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
