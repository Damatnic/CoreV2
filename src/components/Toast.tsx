import React, { useEffect } from 'react';
import { Toast as ToastType } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const Toast: React.FC<{ toast: ToastType, onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div className={`toast toast-${toast.type}`}>
            <div className="toast-message">{toast.message}</div>
            <div className="toast-progress"></div>
        </div>
    );
};

export const ToastContainer: React.FC<{}> = () => {
    const { toasts, removeToast } = useNotification();
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};
