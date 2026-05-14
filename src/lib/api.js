import { supabase } from './supabase';

// ────────────────────────────────────────────────────────────
// Transform functions: Supabase → mock-compatible shape
// ────────────────────────────────────────────────────────────

function transformWorker(w) {
  return {
    id: w.id,
    name: w.name,
    email: null, // gated behind shift completion
    phone: null, // gated behind shift completion
    city: w.city,
    photoUrl: w.profiles?.photo_url || null,
    roles: w.worker_roles?.map((r) => r.role) || [],
    certifications:
      w.worker_certifications?.map((c) => ({
        type: c.cert_type,
        status: c.status,
        expiryDate: c.expiry_date,
      })) || [],
    availabilityTags: w.worker_availability?.map((a) => a.tag) || [],
    experienceYears: w.experience_years ?? 0,
    restaurantTypes: [],
    preferredRateMin: w.preferred_rate_min ? Number(w.preferred_rate_min) : null,
    preferredRateMax: w.preferred_rate_max ? Number(w.preferred_rate_max) : null,
    ratingAverage: w.rating_average ? Number(w.rating_average) : 0,
    ratingCount: w.rating_count ?? 0,
    demandStatus: w.demand_status,
    bio: w.bio,
    reviews:
      w.reviews?.map((r) => ({
        restaurantName: r.restaurants?.name || 'Unknown',
        rating: r.rating,
        comment: r.comment,
        date: r.date,
      })) || [],
  };
}

function transformRestaurant(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    city: r.city,
    photoUrl: r.photo_url,
    about: r.about,
    employeeCount: r.employee_count ?? 0,
    rolesHiringFor: r.restaurant_hiring_roles?.map((rr) => rr.role) || [],
    ratingAverage: r.rating_average ? Number(r.rating_average) : 0,
    ratingCount: r.rating_count ?? 0,
    openings:
      r.openings?.map((o) => ({
        id: o.id,
        role: o.role,
        payRange: o.pay_range,
        urgency: o.urgency,
        isActive: o.is_active,
        createdAt: o.created_at,
        expiresAt: o.expires_at,
        renewedAt: o.renewed_at,
        closedAt: o.closed_at,
        repostedFromId: o.reposted_from_id,
        lifecycleVersion: o.lifecycle_version,
      })) || [],
  };
}

function transformShift(s) {
  return {
    id: s.id,
    restaurantId: s.restaurant_id,
    restaurantName: s.restaurants?.name || 'Unknown',
    workerId: s.worker_id,
    role: s.role,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    payRate: s.pay_rate ? Number(s.pay_rate) : 0,
    status: s.status,
    isUrgent: s.is_urgent ?? false,
    city: s.city,
    description: s.description,
    expiresAt: combineShiftEnd(s.date, s.end_time),
    closedAt: s.closed_at,
    repostedFromId: s.reposted_from_id,
    requirements: [],
    feedback: null,
  };
}

function transformOpening(o) {
  return {
    id: o.id,
    role: o.role,
    payRange: o.pay_range,
    urgency: o.urgency,
    isActive: o.is_active,
    createdAt: o.created_at,
    expiresAt: o.expires_at,
    renewedAt: o.renewed_at,
    closedAt: o.closed_at,
    repostedFromId: o.reposted_from_id,
    lifecycleVersion: o.lifecycle_version,
    restaurantId: o.restaurant_id || o.restaurants?.id,
    restaurantName: o.restaurants?.name,
    restaurantPhoto: o.restaurants?.photo_url,
    restaurantCity: o.restaurants?.city,
    restaurantRating: o.restaurants?.rating_average ? Number(o.restaurants.rating_average) : 0,
    restaurantRatingCount: o.restaurants?.rating_count ?? 0,
  };
}

function transformPostingReminder(r) {
  return {
    id: r.id,
    postingType: r.posting_type,
    postingId: r.posting_id,
    restaurantId: r.restaurant_id,
    recipientProfileId: r.recipient_profile_id,
    recipientRole: r.recipient_role,
    threshold: r.threshold,
    channel: r.channel,
    status: r.status,
    scheduledFor: r.scheduled_for,
    sentAt: r.sent_at,
    dismissedAt: r.dismissed_at,
    errorMessage: r.error_message,
    lifecycleVersion: r.lifecycle_version,
    createdAt: r.created_at,
  };
}

function combineShiftEnd(date, endTime) {
  if (!date || !endTime) return null;
  return new Date(`${date}T${endTime}`).toISOString();
}

async function fetchOpeningRowById(id) {
  const { data, error } = await supabase
    .from('openings')
    .select(OPENING_SELECT)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function fetchShiftRowById(id) {
  const { data, error } = await supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// ────────────────────────────────────────────────────────────
// Query functions
// ────────────────────────────────────────────────────────────

const WORKER_SELECT = `
  *,
  profiles(photo_url),
  worker_roles(role),
  worker_certifications(cert_type, status, expiry_date),
  worker_availability(tag),
  reviews(rating, comment, date, restaurants(name))
`;

const RESTAURANT_SELECT = `
  *,
  restaurant_hiring_roles(role),
  openings(id, role, pay_range, urgency, is_active, created_at, expires_at, renewed_at, closed_at, reposted_from_id, lifecycle_version)
`;

const SHIFT_SELECT = `
  *,
  restaurants(name)
`;

const OPENING_SELECT = '*, restaurants(id, name, photo_url, city, rating_average, rating_count)';

export async function fetchWorkers() {
  if (!supabase) return { data: [], error: null, fromMock: true };

  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_SELECT)
    .order('rating_average', { ascending: false });

  if (error) return { data: [], error };
  return { data: data.map(transformWorker), error: null };
}

export async function fetchWorkerById(id) {
  if (!supabase) return { data: null, error: null, fromMock: true };

  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_SELECT)
    .eq('id', id)
    .single();

  if (error) return { data: null, error };
  return { data: transformWorker(data), error: null };
}

export async function fetchRestaurants() {
  if (!supabase) return { data: [], error: null, fromMock: true };

  const { data, error } = await supabase
    .from('restaurants')
    .select(RESTAURANT_SELECT)
    .order('rating_average', { ascending: false });

  if (error) return { data: [], error };

  // Filter openings to only active ones
  const transformed = data.map((r) => {
    r.openings = r.openings?.filter((o) => o.is_active) || [];
    return transformRestaurant(r);
  });

  return { data: transformed, error: null };
}

export async function fetchRestaurantById(id) {
  if (!supabase) return { data: null, error: null, fromMock: true };

  const { data, error } = await supabase
    .from('restaurants')
    .select(RESTAURANT_SELECT)
    .eq('id', id)
    .single();

  if (error) return { data: null, error };

  data.openings = data.openings?.filter((o) => o.is_active) || [];
  return { data: transformRestaurant(data), error: null };
}

export async function fetchShifts() {
  if (!supabase) return { data: [], error: null, fromMock: true };

  const { data, error } = await supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .order('date', { ascending: true });

  if (error) return { data: [], error };
  return { data: data.map(transformShift), error: null };
}

export async function fetchShiftById(id) {
  if (!supabase) return { data: null, error: null, fromMock: true };

  const { data, error } = await supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .eq('id', id)
    .single();

  if (error) return { data: null, error };
  return { data: transformShift(data), error: null };
}

export async function fetchOpenings() {
  if (!supabase) return { data: [], error: null, fromMock: true };

  const { data, error } = await supabase
    .from('openings')
    .select(OPENING_SELECT)
    .eq('is_active', true)
    .is('closed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: data.map(transformOpening), error: null };
}

export async function fetchHiringOpenings(restaurantId) {
  if (!supabase) return { data: [], error: null, fromMock: true };
  if (!restaurantId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('openings')
    .select(OPENING_SELECT)
    .eq('restaurant_id', restaurantId)
    .order('expires_at', { ascending: true });

  if (error) return { data: [], error };
  return { data: data.map(transformOpening), error: null };
}

export async function fetchPostingReminders(restaurantId) {
  if (!supabase) return { data: [], error: null, fromMock: true };
  if (!restaurantId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('posting_reminders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('recipient_role', 'hiring_team')
    .neq('status', 'dismissed')
    .order('scheduled_for', { ascending: false });

  if (error) return { data: [], error };
  return { data: data.map(transformPostingReminder), error: null };
}

// ────────────────────────────────────────────────────────────
// Write operations
// ────────────────────────────────────────────────────────────

export async function createShift({ role, date, startTime, endTime, payRate, city, description, isUrgent }) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('create_shift', {
    p_role: role,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_pay_rate: payRate,
    p_city: city,
    p_description: description || null,
    p_is_urgent: isUrgent || false,
  });

  if (error) return { data: null, error };
  return { data: transformShift(data), error: null };
}

export async function createOpening({ role, payRate, isUrgent }) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const restaurantId = await getMyRestaurantId();
  if (restaurantId.error) return { data: null, error: restaurantId.error };
  if (!restaurantId.data) return { data: null, error: { message: 'Not a registered restaurant' } };

  const { data, error } = await supabase
    .from('openings')
    .insert({
      restaurant_id: restaurantId.data,
      role,
      pay_range: payRate ? `$${Number(payRate).toFixed(2)}/hr` : null,
      urgency: isUrgent ? 'urgent' : 'normal',
      is_active: true,
    })
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function renewOpeningById(openingId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('renew_opening', {
    p_opening_id: openingId,
  });

  if (error) return { data: null, error };
  const joined = await fetchOpeningRowById(data.id);
  return { data: transformOpening(joined || data), error: null };
}

export async function closeOpeningById(openingId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('close_opening', {
    p_opening_id: openingId,
  });

  if (error) return { data: null, error };
  const joined = await fetchOpeningRowById(data.id);
  return { data: transformOpening(joined || data), error: null };
}

export async function closeShiftById(shiftId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('close_shift', {
    p_shift_id: shiftId,
  });

  if (error) return { data: null, error };
  const joined = await fetchShiftRowById(data.id);
  return { data: transformShift(joined || data), error: null };
}

export async function dismissPostingReminderById(reminderId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('dismiss_posting_reminder', {
    p_reminder_id: reminderId,
  });

  if (error) return { data: null, error };
  return { data: transformPostingReminder(data), error: null };
}

export async function claimShift(shiftId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.rpc('claim_shift', {
    p_shift_id: shiftId,
  });

  if (error) return { data: null, error };
  return { data: transformShift(data), error: null };
}

export async function getMyWorkerId() {
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase.rpc('get_my_worker_id');
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function getMyRestaurantId() {
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase.rpc('get_my_restaurant_id');
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function createReview({ shiftId, workerId, restaurantId, rating, comment, reviewerType }) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      shift_id: shiftId,
      worker_id: workerId,
      restaurant_id: restaurantId,
      rating,
      comment: comment || null,
      reviewer_type: reviewerType,
      date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function fetchShiftReviews(shiftId) {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('reviews')
    .select('*, workers(name), restaurants(name)')
    .eq('shift_id', shiftId);

  if (error) return { data: [], error };
  return { data, error: null };
}

export async function getShiftPostCount() {
  if (!supabase) return { data: 0, error: null };

  const restaurantId = await getMyRestaurantId();
  if (!restaurantId.data) return { data: 0, error: null };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId.data)
    .gte('created_at', startOfMonth.toISOString());

  if (error) return { data: 0, error };
  return { data: count || 0, error: null };
}

// ────────────────────────────────────────────────────────────
// Payment queries
// ────────────────────────────────────────────────────────────

export async function fetchSubscription() {
  if (!supabase) return { data: null, error: null };

  const restaurantId = await getMyRestaurantId();
  if (!restaurantId.data) return { data: null, error: null };

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', restaurantId.data)
    .single();

  if (error && error.code !== 'PGRST116') return { data: null, error };
  return {
    data: data ? {
      id: data.id,
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
    } : null,
    error: null,
  };
}

export async function createSubscriptionCheckout() {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { type: 'subscription' },
  });

  if (error) return { data: null, error };
  if (data?.url) {
    window.location.assign(data.url);
  }
  return { data, error: null };
}

export async function createInvoiceCheckout(invoiceId) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { type: 'invoice', invoiceId },
  });

  if (error) return { data: null, error };
  if (data?.url) {
    window.location.assign(data.url);
  }
  return { data, error: null };
}

export async function fetchInvoices() {
  if (!supabase) return { data: [], error: null };

  const restaurantId = await getMyRestaurantId();
  if (!restaurantId.data) return { data: [], error: null };

  const { data, error } = await supabase
    .from('invoices')
    .select('*, shifts(role, date)')
    .eq('restaurant_id', restaurantId.data)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return {
    data: data.map(inv => ({
      id: inv.id,
      amount: inv.amount / 100,
      status: inv.status,
      createdAt: inv.created_at,
      shiftRole: inv.shifts?.role,
      shiftDate: inv.shifts?.date,
    })),
    error: null,
  };
}
