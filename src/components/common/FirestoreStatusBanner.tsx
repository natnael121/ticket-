import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check, ExternalLink, X } from 'lucide-react';

export const FirestoreStatusBanner: React.FC = () => {
  const [hasError, setHasError] = useState(firestoreService.hasPermissionError);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return firestoreService.subscribe(() => {
      setHasError(firestoreService.hasPermissionError);
    });
  }, []);

  if (!hasError || dismissed) return null;

  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(rulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.2))',
        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '10px 14px',
        color: '#fca5a5',
        fontSize: '13px',
        zIndex: 9999,
        position: 'sticky',
        top: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <AlertTriangle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#fee2e2' }}>
            Firestore Permission Denied (ticket-c678d)
          </span>
          <span style={{ opacity: 0.8 }}>
            – Firebase Console security rules are currently blocking data storage.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            {expanded ? 'Hide Fix' : 'How to Fix (1 min)'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#e2e8f0',
            lineHeight: '1.5'
          }}
        >
          <p style={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
            Follow these 2 quick steps to allow data to save to your Firestore database:
          </p>

          <ol style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            <li style={{ marginBottom: '6px' }}>
              Open your project Firestore rules:{' '}
              <a
                href="https://console.firebase.google.com/project/ticket-c678d/firestore/rules"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                Firebase Console Rules <ExternalLink size={12} />
              </a>
            </li>
            <li style={{ marginBottom: '6px' }}>
              Replace the rules editor content with the following and click <strong>Publish</strong>:
            </li>
          </ol>

          <div
            style={{
              position: 'relative',
              background: '#0f172a',
              borderRadius: '6px',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#38bdf8',
              marginBottom: '10px'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{rulesCode}</pre>
            <button
              onClick={copyRules}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: copied ? '#16a34a' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            <strong>Optional (for anonymous auth):</strong> Under{' '}
            <a
              href="https://console.firebase.google.com/project/ticket-c678d/authentication/providers"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
            >
              Authentication &gt; Sign-in method
            </a>
            , enable the <strong>Anonymous</strong> provider.
          </div>
        </div>
      )}
    </div>
  );
};
