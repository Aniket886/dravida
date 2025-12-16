import { useState } from 'react';

/**
 * Reusable Reset/Delete Confirmation Modal
 * Requires user to type a confirmation word (default: "DELETE") to proceed.
 */
export default function ResetModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Reset Confirmation',
    message = 'Are you sure you want to proceed?',
    confirmText = 'DELETE',
    loading = false
}) {
    const [confirmation, setConfirmation] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (confirmation === confirmText) {
            onConfirm();
            setConfirmation(''); // Reset input
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#1a1a1a',
                border: '2px solid #e74c3c',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(231, 76, 60, 0.3)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                <h2 style={{ color: '#e74c3c', marginTop: 0 }}>{title}</h2>
                <p style={{ fontSize: '1.2em', lineHeight: '1.5', color: '#e0e0e0' }}>
                    {message}
                </p>

                <div style={{ margin: '30px 0' }}>
                    <p style={{ fontSize: '0.9em', color: '#888', marginBottom: '10px' }}>
                        Type <strong style={{ color: '#fff' }}>{confirmText}</strong> to confirm:
                    </p>
                    <input
                        type="text"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        style={{
                            background: '#333',
                            border: '1px solid #555',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            width: '100%',
                            textAlign: 'center',
                            letterSpacing: '2px'
                        }}
                        placeholder={confirmText}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => {
                            setConfirmation('');
                            onClose();
                        }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'transparent',
                            border: '1px solid #555',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirmation !== confirmText || loading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: confirmation === confirmText ? '#e74c3c' : '#555',
                            border: 'none',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: confirmation === confirmText ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            opacity: confirmation === confirmText ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading && <div className="spinner-small" style={{ width: 16, height: 16, borderTopColor: '#fff' }}></div>}
                        {loading ? 'Reseting...' : 'Confirm Reset'}
                    </button>
                </div>
            </div>
        </div>
    );
}
