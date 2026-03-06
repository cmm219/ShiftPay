import { ROLES, DEMAND_STATUSES } from '../utils/constants';

const certStatusConfig = {
  verified: {
    bg: 'bg-success-soft',
    text: 'text-success',
    icon: '\u2705',
  },
  pending: {
    bg: 'bg-warning-soft',
    text: 'text-warning',
    icon: '\u23F3',
  },
  expired: {
    bg: 'bg-bg-elevated',
    text: 'text-text-muted line-through',
    icon: '\u274C',
  },
};

const demandStatusConfig = {
  in_the_weeds: {
    bg: 'bg-warning-soft',
    text: 'text-warning',
  },
  double_sat: {
    bg: 'bg-success-soft',
    text: 'text-success',
  },
  triple_sat: {
    bg: 'bg-gradient-to-r from-purple-500/20 to-accent-soft',
    text: 'text-purple-400',
  },
  '86d': {
    bg: 'bg-danger-soft',
    text: 'text-danger',
  },
};

export default function Badge({ type, value, certStatus }) {
  const base =
    'rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1';

  if (type === 'role') {
    const role = ROLES[value];
    const label = role ? `${role.icon} ${role.label}` : value;
    return (
      <span
        className={`${base} bg-bg-elevated text-text-primary border border-border-subtle`}
      >
        {label}
      </span>
    );
  }

  if (type === 'cert') {
    const config = certStatusConfig[certStatus] || certStatusConfig.pending;
    return (
      <span className={`${base} ${config.bg} ${config.text}`}>
        {config.icon} {value}
      </span>
    );
  }

  if (type === 'status') {
    const config = demandStatusConfig[value];
    if (!config) return null;
    const status = DEMAND_STATUSES[value];
    const label = status ? status.label : value;
    return (
      <span className={`${base} ${config.bg} ${config.text}`}>
        {label}
      </span>
    );
  }

  if (type === 'availability') {
    return (
      <span className={`${base} bg-accent-soft text-accent`}>
        {value}
      </span>
    );
  }

  return (
    <span className={`${base} bg-bg-elevated text-text-secondary`}>
      {value}
    </span>
  );
}
