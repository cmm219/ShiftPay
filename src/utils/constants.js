// ============================================================
// ShiftPay - Restaurant Staff Marketplace Constants
// ============================================================

// --- Roles ---
export const ROLES = {
  server: {
    id: 'server',
    label: 'Server',
    icon: '\uD83C\uDF7D\uFE0F', // plate with cutlery
    colorClass: 'role-server',
  },
  bartender: {
    id: 'bartender',
    label: 'Bartender',
    icon: '\uD83C\uDF78', // cocktail glass
    colorClass: 'role-bartender',
  },
  cook: {
    id: 'cook',
    label: 'Cook',
    icon: '\uD83D\uDD25', // fire
    colorClass: 'role-cook',
  },
  host: {
    id: 'host',
    label: 'Host',
    icon: '\uD83D\uDCCB', // clipboard
    colorClass: 'role-host',
  },
  dishwasher: {
    id: 'dishwasher',
    label: 'Dishwasher',
    icon: '\uD83E\uDDFD', // sponge
    colorClass: 'role-dishwasher',
  },
  barback: {
    id: 'barback',
    label: 'Barback',
    icon: '\uD83E\uDDCA', // ice
    colorClass: 'role-barback',
  },
};

export const ROLE_LIST = Object.values(ROLES);

// --- Demand Statuses ---
export const DEMAND_STATUSES = {
  in_the_weeds: {
    id: 'in_the_weeds',
    label: 'In the Weeds',
    color: '#F59E0B',
    description: 'High demand — restaurants are actively looking for staff.',
  },
  double_sat: {
    id: 'double_sat',
    label: 'Double Sat',
    color: '#EF4444',
    description: 'Very high demand — multiple urgent openings right now.',
  },
  triple_sat: {
    id: 'triple_sat',
    label: 'Triple Sat',
    color: '#DC2626',
    description: 'Critical demand — immediate staffing needed everywhere.',
  },
  '86d': {
    id: '86d',
    label: "86'd",
    color: '#6B7280',
    description: 'No current demand — market is fully staffed.',
  },
};

export const DEMAND_STATUS_LIST = Object.values(DEMAND_STATUSES);

// --- Certification Types ---
export const CERTIFICATIONS = {
  servsafe: {
    id: 'servsafe',
    label: 'ServSafe',
    icon: '\u2705', // check mark
  },
  tips: {
    id: 'tips',
    label: 'TIPS',
    icon: '\uD83C\uDF7A', // beer mug
  },
  food_handler: {
    id: 'food_handler',
    label: 'Food Handler',
    icon: '\uD83C\uDF54', // hamburger
  },
  cpr_first_aid: {
    id: 'cpr_first_aid',
    label: 'CPR/First Aid',
    icon: '\u2764\uFE0F', // red heart
  },
  alcohol_awareness: {
    id: 'alcohol_awareness',
    label: 'Alcohol Awareness',
    icon: '\uD83C\uDF77', // wine glass
  },
};

export const CERTIFICATION_LIST = Object.values(CERTIFICATIONS);

// --- Availability Options ---
export const AVAILABILITIES = {
  morning: { id: 'morning', label: 'Morning (6 AM - 12 PM)' },
  afternoon: { id: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  evening: { id: 'evening', label: 'Evening (5 PM - 10 PM)' },
  late_night: { id: 'late_night', label: 'Late Night (10 PM - 2 AM)' },
  weekdays: { id: 'weekdays', label: 'Weekdays' },
  weekends: { id: 'weekends', label: 'Weekends' },
  flexible: { id: 'flexible', label: 'Flexible / On-Call' },
};

export const AVAILABILITY_LIST = Object.values(AVAILABILITIES);

// --- Restaurant Types ---
export const RESTAURANT_TYPES = {
  fine_dining: { id: 'fine_dining', label: 'Fine Dining' },
  casual_dining: { id: 'casual_dining', label: 'Casual Dining' },
  fast_casual: { id: 'fast_casual', label: 'Fast Casual' },
  bar_lounge: { id: 'bar_lounge', label: 'Bar / Lounge' },
  cafe: { id: 'cafe', label: 'Cafe' },
  catering: { id: 'catering', label: 'Catering' },
  food_truck: { id: 'food_truck', label: 'Food Truck' },
  hotel_restaurant: { id: 'hotel_restaurant', label: 'Hotel Restaurant' },
};

export const RESTAURANT_TYPE_LIST = Object.values(RESTAURANT_TYPES);

// --- Cities ---
export const CITIES = [
  { id: 'tampa', label: 'Tampa' },
  { id: 'orlando', label: 'Orlando' },
  { id: 'miami', label: 'Miami' },
  { id: 'st_pete', label: 'St. Pete' },
];

// --- Pay Range Defaults ---
export const PAY_RANGE_DEFAULTS = {
  min: 12,
  max: 45,
  step: 1,
  currency: 'USD',
  unit: 'hr',
  formatLabel: (value) => `$${value}/hr`,
};
