import React from 'react';

export interface BadgeProps {
  status?: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, size = 'sm', children }) => {
  const label = children !== undefined ? children : status;
  const strLabel = typeof label === 'string' ? label : (status || '');
  const norm = strLabel.toUpperCase();

  let colors = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant) {
    switch (variant) {
      case 'success':
        colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        break;
      case 'danger':
        colors = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        break;
      case 'warning':
        colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        break;
      case 'info':
        colors = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
        break;
      case 'purple':
        colors = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
        break;
      case 'neutral':
      default:
        colors = 'bg-slate-800 text-slate-300 border-slate-700';
        break;
    }
  } else {
    if (norm === 'VERIFIED' || norm === 'APPROVED' || norm === 'ACTIVE' || norm === 'AVAILABLE' || norm === 'RESOLVED' || norm === 'SUCCESS') {
      colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (norm === 'PENDING' || norm === 'UNDER_REVIEW' || norm === 'NEW' || norm === 'WARNING') {
      colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (norm === 'REJECTED' || norm === 'SUSPENDED' || norm === 'CLOSED' || norm === 'INACTIVE' || norm === 'CRITICAL') {
      colors = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    } else if (norm === 'RESUBMISSION_REQUIRED' || norm === 'CORRECTION_REQUESTED') {
      colors = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    } else if (norm === 'SUPER_ADMIN' || norm === 'AI PICK' || norm === 'FEATURED' || norm === 'IMPORTANT') {
      colors = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    } else if (norm === 'BUYER') {
      colors = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    } else if (norm === 'OWNER' || norm === 'SELLER') {
      colors = 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    } else if (norm === 'AGENT') {
      colors = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    } else if (norm === 'BUILDER') {
      colors = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${padding} ${colors}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {label || 'Unknown'}
    </span>
  );
};
