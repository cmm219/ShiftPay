import { supabase } from './supabase';

// ────────────────────────────────────────────────────────────
// Transform functions: Supabase → mock-compatible shape
// ────────────────────────────────────────────────────────────

function transformWorker(w) {
  return {
    id: w.id,
    name: w.name,
    email: w.profiles?.email || null,
    phone: w.profiles?.phone || null,
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
        role: o.role,
        payRange: o.pay_range,
        urgency: o.urgency,
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
    requirements: [],
    feedback: null,
  };
}

// ────────────────────────────────────────────────────────────
// Query functions
// ────────────────────────────────────────────────────────────

const WORKER_SELECT = `
  *,
  profiles(email, phone, photo_url),
  worker_roles(role),
  worker_certifications(cert_type, status, expiry_date),
  worker_availability(tag),
  reviews(rating, comment, date, restaurants(name))
`;

const RESTAURANT_SELECT = `
  *,
  restaurant_hiring_roles(role),
  openings(role, pay_range, urgency, is_active)
`;

const SHIFT_SELECT = `
  *,
  restaurants(name)
`;

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
