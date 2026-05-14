const DAY_MS = 24 * 60 * 60 * 1000;
const OPENING_WINDOW_DAYS = 30;
const EXPIRING_SOON_DAYS = 7;

export const LIFECYCLE_STORAGE_KEY = 'shiftpay-posting-lifecycle-overrides';

const OPENING_DAY_OFFSETS = {
  '1-0': { created: -10, expires: 20 },
  '1-1': { created: -24, expires: 6 },
  '2-0': { created: -27, expires: 3 },
  '2-1': { created: -12, expires: 18 },
  '3-0': { created: -29, expires: 1 },
  '3-1': { created: -35, expires: -5 },
  '3-2': { created: -18, expires: 12 },
  '4-0': { created: -8, expires: 22 },
  '4-1': { created: -34, expires: -4 },
  '5-0': { created: -21, expires: 9 },
  '5-1': { created: -6, expires: 24 },
};

const SHIFT_DAY_OFFSETS = {
  1: -2,
  2: 1,
  3: -9,
  4: 3,
  5: -14,
};

function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function toDateTimeISO(date, time = '11:59 PM') {
  const [hourPart, minutePart, periodPart] = String(time)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    ?.slice(1) || ['23', '59', 'PM'];
  let hours = Number(hourPart);
  const minutes = Number(minutePart);
  const period = periodPart.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const d = new Date(`${date}T00:00:00`);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function formatDate(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntil(dateValue, now = new Date()) {
  const end = new Date(dateValue);
  return Math.ceil((end - now) / DAY_MS);
}

export function formatExpiryLabel(dateValue, now = new Date()) {
  const days = daysUntil(dateValue, now);
  if (days <= 0) return `Expired ${formatDate(dateValue)}`;
  if (days <= 1) return 'Expires in 24 hours';
  if (days <= 3) return `Expires in ${days} days`;
  if (days <= EXPIRING_SOON_DAYS) return `Expires in ${days} days`;
  return `Expires ${formatDate(dateValue)}`;
}

export function formatRenewedUntil(dateValue) {
  return `Job renewed until ${formatDate(dateValue)}.`;
}

export function readLifecycleOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LIFECYCLE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeLifecycleOverrides(overrides) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LIFECYCLE_STORAGE_KEY, JSON.stringify(overrides));
}

export function buildDemoOpenings(restaurants, now = new Date()) {
  const today = startOfToday(now);

  return restaurants.flatMap((restaurant) =>
    (restaurant.openings || []).map((opening, index) => {
      const id = `${restaurant.id}-${index}`;
      const plan = OPENING_DAY_OFFSETS[id] || {
        created: -index * 3,
        expires: OPENING_WINDOW_DAYS - index * 3,
      };
      const createdAt = addDays(today, plan.created).toISOString();
      const expiresAt = addDays(today, plan.expires).toISOString();

      return withOpeningLifecycle({
        id,
        role: opening.role,
        payRange: opening.payRange,
        urgency: opening.urgency,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantPhoto: restaurant.photoUrl,
        restaurantCity: restaurant.city,
        restaurantRating: restaurant.ratingAverage,
        restaurantRatingCount: restaurant.ratingCount,
        createdAt,
        expiresAt,
        renewedAt: null,
        closedAt: null,
        isActive: true,
      }, now);
    })
  );
}

export function prepareDemoShifts(shifts, now = new Date()) {
  const today = startOfToday(now);

  return shifts.map((shift) => {
    const offset = SHIFT_DAY_OFFSETS[shift.id] ?? 4;
    const date = toISODate(addDays(today, offset));
    return withShiftLifecycle({
      ...shift,
      date,
      expiresAt: toDateTimeISO(date, shift.endTime),
      closedAt: null,
    }, now);
  });
}

export function withOpeningLifecycle(opening, now = new Date()) {
  const closed = Boolean(opening.closedAt);
  const expired = opening.expiresAt ? new Date(opening.expiresAt) <= now : false;
  const expiringSoon = !expired && daysUntil(opening.expiresAt, now) <= EXPIRING_SOON_DAYS;

  let lifecycleStatus = 'active';
  if (closed) lifecycleStatus = 'closed';
  else if (expired) lifecycleStatus = 'expired';
  else if (expiringSoon) lifecycleStatus = 'expiring_soon';

  return {
    ...opening,
    lifecycleStatus,
    expiryLabel: formatExpiryLabel(opening.expiresAt, now),
  };
}

export function withShiftLifecycle(shift, now = new Date()) {
  const closed = Boolean(shift.closedAt);
  const expired = shift.expiresAt ? new Date(shift.expiresAt) <= now : false;
  let lifecycleStatus = 'active';

  if (closed) lifecycleStatus = 'closed';
  else if (shift.status === 'open' && expired) lifecycleStatus = 'expired';
  else if (shift.status === 'completed' || shift.status === 'cancelled') lifecycleStatus = shift.status;
  else if (shift.status === 'claimed') lifecycleStatus = 'claimed';

  return {
    ...shift,
    lifecycleStatus,
  };
}

export function applyLifecycleOverrides(openings, shifts, overrides, now = new Date()) {
  const openingOverrides = overrides.openings || {};
  const shiftOverrides = overrides.shifts || {};

  return {
    openings: openings.map((opening) =>
      withOpeningLifecycle({
        ...opening,
        ...(openingOverrides[opening.id] || {}),
      }, now)
    ),
    shifts: shifts.map((shift) =>
      withShiftLifecycle({
        ...shift,
        ...(shiftOverrides[shift.id] || {}),
      }, now)
    ),
  };
}

export function isActiveOpening(opening) {
  if (!opening.lifecycleStatus) {
    if (opening.isActive === false || opening.closedAt) return false;
    if (opening.expiresAt) return new Date(opening.expiresAt) > new Date();
    return true;
  }
  return opening.lifecycleStatus === 'active' || opening.lifecycleStatus === 'expiring_soon';
}

export function isWorkerFacingShift(shift) {
  if (!shift.lifecycleStatus) {
    if (shift.status !== 'open' || shift.closedAt) return false;
    if (shift.expiresAt) return new Date(shift.expiresAt) > new Date();
    return true;
  }
  return shift.status === 'open' && shift.lifecycleStatus === 'active';
}

export function renewOpening(opening, now = new Date()) {
  const base = opening.expiresAt && new Date(opening.expiresAt) > now
    ? new Date(opening.expiresAt)
    : now;
  const expiresAt = addDays(base, OPENING_WINDOW_DAYS).toISOString();

  return {
    expiresAt,
    renewedAt: now.toISOString(),
    closedAt: null,
    isActive: true,
  };
}

export function closePosting(now = new Date()) {
  return {
    closedAt: now.toISOString(),
    isActive: false,
  };
}

export function makeRepostParams(posting, type) {
  const params = new URLSearchParams();
  params.set('repost', type);
  params.set('role', posting.role || '');
  params.set('city', posting.city || posting.restaurantCity || '');
  params.set('payRate', posting.payRate || posting.payRange || '');
  params.set('description', posting.description || '');
  return params.toString();
}
