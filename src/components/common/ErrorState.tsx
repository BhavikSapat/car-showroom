import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, FileQuestion } from 'lucide-react';

interface ErrorStateProps {
  code?: 401 | 403 | 404 | number;
  message?: string;
  onBack?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  code = 403,
  message,
  onBack,
}) => {
  const getErrorDetails = () => {
    switch (code) {
      case 401:
        return {
          title: '401 Unauthorized',
          defaultMsg: 'Your session has expired or your token is invalid. Please login again.',
          icon: <Lock className="w-8 h-8 text-amber-600" />,
        };
      case 403:
        return {
          title: '403 Access Denied',
          defaultMsg: 'Access Denied! You are not allowed to access this restricted endpoint.',
          icon: <ShieldAlert className="w-8 h-8 text-rose-600" />,
        };
      case 404:
        return {
          title: '404 Page Not Found',
          defaultMsg: 'The page or resource you requested does not exist in the CRM backend.',
          icon: <FileQuestion className="w-8 h-8 text-slate-600" />,
        };
      default:
        return {
          title: 'Restricted Access',
          defaultMsg: message || 'You do not have permission to view this section.',
          icon: <ShieldAlert className="w-8 h-8 text-rose-600" />,
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
        {details.icon}
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">{details.title}</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        {message || details.defaultMsg}
      </p>
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-xs hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      )}
    </div>
  );
};
