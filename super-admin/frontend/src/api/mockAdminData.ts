// Comprehensive Mock / Dummy Data Store for Super Admin Console
// Ensures that all 17 administrative panels always display rich, authentic data.

export interface MockBuyer {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferred_city: string;
  kyc_status: 'VERIFIED' | 'PENDING' | 'NOT_SUBMITTED';
  saved_properties_count: number;
  inquiries_count: number;
  site_visits_count: number;
  is_active: boolean;
  created_at: string;
  preferred_bhk?: number;
  budget_max?: number;
}

export interface MockOwner {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  pan_number?: string;
  properties_count: number;
  kyc_status: 'VERIFIED' | 'PENDING' | 'NOT_SUBMITTED';
  is_active: boolean;
  created_at: string;
}

export interface MockAgent {
  id: number;
  name: string;
  email: string;
  phone: string;
  agency_name: string;
  license_number: string;
  rera_id: string;
  experience_years: number;
  rating: number;
  properties_count: number;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  is_active: boolean;
  created_at: string;
}

export interface MockBuilder {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  office_address: string;
  developer_registration_no: string;
  rera_id: string;
  projects_count: number;
  properties_count: number;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  is_active: boolean;
  created_at: string;
}

export interface MockProperty {
  id: number;
  title: string;
  property_type: string;
  listing_type: string;
  bhk: number;
  area_sqft: number;
  price: number;
  price_display: string;
  city: string;
  locality: string;
  address: string;
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  is_verified: boolean;
  sponsored: boolean;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  rera_approved: boolean;
  rera_number: string;
  created_at: string;
  owner?: { name: string; email: string; phone: string };
  agent?: { name: string; agency_name: string; phone: string };
  builder?: { company_name: string; email: string };
  media: Array<{ id: number; url: string; media_type: string; is_featured: boolean }>;
  documents_count: number;
}

export interface MockDocument {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  account_type: 'buyer' | 'owner' | 'agent' | 'builder';
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_kb: number;
  status: 'VERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'REJECTED';
  ocr_confidence: number;
  extracted_data?: Record<string, any>;
  uploaded_at: string;
}

export interface MockKYCItem {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  account_type: string;
  document_type: string;
  file_name: string;
  status: 'VERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'REJECTED';
  uploaded_at: string;
  ocr_match_rate: number;
  kyc_level: string;
}

export interface MockRERARecord {
  id: number;
  rera_number: string;
  project_name: string;
  promoter_name: string;
  state: string;
  district: string;
  project_type: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verified_at: string;
  expiry_date: string;
}

export interface MockComplaint {
  id: number;
  ticket_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  subject: string;
  description: string;
  internal_notes?: string;
  resolution?: string;
  created_at: string;
}

export interface MockBanner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  target_url?: string;
  badge_text?: string;
  is_active: boolean;
  created_at: string;
}

export interface MockAnnouncement {
  id: number;
  title: string;
  message: string;
  type: string;
  target_role: string;
  is_active: boolean;
  created_at: string;
}

export interface MockFAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
}

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface MockAuditLog {
  id: number;
  action: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  details: Record<string, any>;
  created_at: string;
}

// ── Initial Seed Collections ──

export const initialBuyers: MockBuyer[] = [
  {
    id: 101,
    name: 'Vikramaditya Sharma',
    email: 'vikram.sharma@gmail.com',
    phone: '+91 98220 45192',
    preferred_city: 'Pune',
    kyc_status: 'VERIFIED',
    saved_properties_count: 14,
    inquiries_count: 8,
    site_visits_count: 5,
    is_active: true,
    created_at: '2026-08-14T11:20:00Z',
    preferred_bhk: 3,
    budget_max: 18000000,
  },
  {
    id: 102,
    name: 'Ananya Deshpande',
    email: 'ananya.d@outlook.com',
    phone: '+91 97654 33219',
    preferred_city: 'Pune',
    kyc_status: 'VERIFIED',
    saved_properties_count: 9,
    inquiries_count: 5,
    site_visits_count: 3,
    is_active: true,
    created_at: '2026-08-22T09:40:00Z',
    preferred_bhk: 2,
    budget_max: 9500000,
  },
  {
    id: 103,
    name: 'Rahul Singhania',
    email: 'singhania.rahul@corporate.in',
    phone: '+91 98901 88412',
    preferred_city: 'Mumbai',
    kyc_status: 'PENDING',
    saved_properties_count: 22,
    inquiries_count: 12,
    site_visits_count: 7,
    is_active: true,
    created_at: '2026-09-02T14:15:00Z',
    preferred_bhk: 4,
    budget_max: 45000000,
  },
  {
    id: 104,
    name: 'Pooja Hegde',
    email: 'pooja.hegde@techcorp.com',
    phone: '+91 98231 66720',
    preferred_city: 'Bangalore',
    kyc_status: 'VERIFIED',
    saved_properties_count: 18,
    inquiries_count: 9,
    site_visits_count: 4,
    is_active: true,
    created_at: '2026-09-10T16:05:00Z',
    preferred_bhk: 3,
    budget_max: 22000000,
  },
  {
    id: 105,
    name: 'Arjun K. Nair',
    email: 'arjun.nair@innovate.co',
    phone: '+91 99401 22910',
    preferred_city: 'Pune',
    kyc_status: 'NOT_SUBMITTED',
    saved_properties_count: 6,
    inquiries_count: 3,
    site_visits_count: 1,
    is_active: true,
    created_at: '2026-09-18T10:30:00Z',
    preferred_bhk: 2,
    budget_max: 7500000,
  },
  {
    id: 106,
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@gmail.com',
    phone: '+91 94220 77199',
    preferred_city: 'Pune',
    kyc_status: 'VERIFIED',
    saved_properties_count: 11,
    inquiries_count: 6,
    site_visits_count: 4,
    is_active: true,
    created_at: '2026-09-25T13:45:00Z',
    preferred_bhk: 3,
    budget_max: 16000000,
  },
  {
    id: 107,
    name: 'Karthik Ramanathan',
    email: 'karthik.r@fintech.io',
    phone: '+91 98403 55112',
    preferred_city: 'Mumbai',
    kyc_status: 'PENDING',
    saved_properties_count: 15,
    inquiries_count: 7,
    site_visits_count: 2,
    is_active: true,
    created_at: '2026-10-01T08:10:00Z',
    preferred_bhk: 3,
    budget_max: 32000000,
  },
  {
    id: 108,
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@gmail.com',
    phone: '+91 98840 91823',
    preferred_city: 'Pune',
    kyc_status: 'VERIFIED',
    saved_properties_count: 7,
    inquiries_count: 4,
    site_visits_count: 3,
    is_active: true,
    created_at: '2026-10-03T12:00:00Z',
    preferred_bhk: 2,
    budget_max: 8800000,
  },
];

export const initialOwners: MockOwner[] = [
  {
    id: 201,
    name: 'Rameshwar Patil',
    email: 'ramesh.patil@patilholdings.in',
    phone: '+91 98221 44001',
    company_name: 'Patil Realties & Holdings',
    pan_number: 'AAECP4921K',
    properties_count: 5,
    kyc_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-07-19T10:00:00Z',
  },
  {
    id: 202,
    name: 'Sunita Agarwal',
    email: 'sunita.agarwal@agarwalgroup.com',
    phone: '+91 98230 11984',
    company_name: 'Agarwal Assets Pvt Ltd',
    pan_number: 'BHKPA8192L',
    properties_count: 8,
    kyc_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-08-01T14:30:00Z',
  },
  {
    id: 203,
    name: 'Harishchand Rao',
    email: 'h.rao.pune@gmail.com',
    phone: '+91 94225 33021',
    company_name: 'Individual Owner',
    pan_number: 'CKYPR9011J',
    properties_count: 2,
    kyc_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-08-11T16:20:00Z',
  },
  {
    id: 204,
    name: 'Deepak Chawla',
    email: 'deepak.chawla@mumbairealty.in',
    phone: '+91 98200 77123',
    company_name: 'Chawla Estates LLP',
    pan_number: 'AAFFC3819Q',
    properties_count: 6,
    kyc_status: 'PENDING',
    is_active: true,
    created_at: '2026-08-29T11:10:00Z',
  },
  {
    id: 205,
    name: 'Kavita Shinde',
    email: 'kavita.shinde@shindeproperties.in',
    phone: '+91 98222 89012',
    company_name: 'Shinde Heritage Holdings',
    pan_number: 'APOPS6612R',
    properties_count: 3,
    kyc_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-09-14T09:45:00Z',
  },
  {
    id: 206,
    name: 'Nitin Gadkari',
    email: 'nitin.g.residences@gmail.com',
    phone: '+91 98234 66109',
    company_name: 'Individual Owner',
    pan_number: 'BFEPG4410M',
    properties_count: 1,
    kyc_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-09-22T15:10:00Z',
  },
];

export const initialAgents: MockAgent[] = [
  {
    id: 301,
    name: 'Priya Patel',
    email: 'priya.patel@saiprime.in',
    phone: '+91 98765 43210',
    agency_name: 'Sai Prime Realtors',
    license_number: 'MH-AG-2026-881',
    rera_id: 'RERA-MH-99214',
    experience_years: 7,
    rating: 4.9,
    properties_count: 34,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-07-10T08:30:00Z',
  },
  {
    id: 302,
    name: 'Vikram Malhotra',
    email: 'vikram.m@apexrealty.in',
    phone: '+91 98220 19823',
    agency_name: 'Apex Realty Consultancy',
    license_number: 'MH-AG-2025-412',
    rera_id: 'RERA-MH-44120',
    experience_years: 11,
    rating: 4.8,
    properties_count: 48,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-07-24T12:00:00Z',
  },
  {
    id: 303,
    name: 'Sanjay Joshi',
    email: 'sanjay.joshi@metroedge.com',
    phone: '+91 97640 22109',
    agency_name: 'Metro Edge Estates',
    license_number: 'MH-AG-2026-104',
    rera_id: 'RERA-MH-77312',
    experience_years: 5,
    rating: 4.7,
    properties_count: 19,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-08-15T14:40:00Z',
  },
  {
    id: 304,
    name: 'Ritu Sethi',
    email: 'ritu.sethi@elitehorizon.in',
    phone: '+91 98201 66543',
    agency_name: 'Elite Horizon Brokers',
    license_number: 'MH-AG-2024-903',
    rera_id: 'RERA-MH-33890',
    experience_years: 9,
    rating: 4.9,
    properties_count: 27,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-08-30T10:15:00Z',
  },
  {
    id: 305,
    name: 'Kiran More',
    email: 'kiran.more@puneconsultants.in',
    phone: '+91 94223 88120',
    agency_name: 'Pune Prime Consultant Group',
    license_number: 'MH-AG-2026-559',
    rera_id: 'RERA-MH-Pending',
    experience_years: 3,
    rating: 4.6,
    properties_count: 12,
    verification_status: 'PENDING',
    is_active: true,
    created_at: '2026-09-12T16:20:00Z',
  },
];

export const initialBuilders: MockBuilder[] = [
  {
    id: 401,
    name: 'Godrej Properties Ltd',
    company_name: 'Godrej Properties Ltd',
    email: 'sales@godrejproperties.com',
    phone: '+91 22 6169 8500',
    office_address: 'Godrej One, 5th Floor, Pirojshanagar, Eastern Express Hwy, Vikhroli East, Mumbai',
    developer_registration_no: 'MAH-DEV-1088',
    rera_id: 'MAHARERA-B-991204',
    projects_count: 14,
    properties_count: 280,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 402,
    name: 'Prestige Landmarks',
    company_name: 'Prestige Landmarks',
    email: 'support@prestigelandmarks.in',
    phone: '+91 20 6712 3400',
    office_address: 'Prestige Tower, 9th Floor, Senapati Bapat Road, Shivajinagar, Pune 411016',
    developer_registration_no: 'DEV-REG-552',
    rera_id: 'MAHARERA-B-441029',
    projects_count: 8,
    properties_count: 145,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-06-28T11:30:00Z',
  },
  {
    id: 403,
    name: 'Kolte-Patil Developers',
    company_name: 'Kolte-Patil Developers Ltd',
    email: 'connect@koltepatil.com',
    phone: '+91 20 6622 6500',
    office_address: '2nd Floor, City Point, Dhole Patil Road, Pune 411001',
    developer_registration_no: 'MAH-DEV-2419',
    rera_id: 'MAHARERA-B-772910',
    projects_count: 12,
    properties_count: 210,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-07-05T09:15:00Z',
  },
  {
    id: 404,
    name: 'Panchshil Realty',
    company_name: 'Panchshil Realty',
    email: 'luxury@panchshil.com',
    phone: '+91 20 6647 3200',
    office_address: 'Tech Park One, Tower E, Next to Don Bosco School, Yerwada, Pune 411006',
    developer_registration_no: 'MAH-DEV-3102',
    rera_id: 'MAHARERA-B-883921',
    projects_count: 6,
    properties_count: 98,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-07-18T14:00:00Z',
  },
  {
    id: 405,
    name: 'Rohan Builders & Developers',
    company_name: 'Rohan Builders & Developers Ltd',
    email: 'info@rohanbuilders.com',
    phone: '+91 20 7101 7101',
    office_address: '1 Modi Baug, Shivaji Nagar, Pune 411016',
    developer_registration_no: 'MAH-DEV-4901',
    rera_id: 'MAHARERA-B-552014',
    projects_count: 9,
    properties_count: 160,
    verification_status: 'VERIFIED',
    is_active: true,
    created_at: '2026-08-08T15:45:00Z',
  },
];

export const initialProperties: MockProperty[] = [
  {
    id: 1,
    title: 'Godrej Infinity 3BHK Riverview Residence',
    property_type: 'apartment',
    listing_type: 'sale',
    bhk: 3,
    area_sqft: 1450,
    price: 13500000,
    price_display: '₹1.35 Cr',
    city: 'Pune',
    locality: 'Keshav Nagar / Mundhwa',
    address: 'Survey No 48, Riverview Enclave, Keshav Nagar, Pune 411036',
    status: 'approved',
    is_verified: true,
    sponsored: true,
    bedrooms: 3,
    bathrooms: 3,
    furnishing: 'semi-furnished',
    rera_approved: true,
    rera_number: 'P52100003129',
    created_at: '2026-09-01T10:00:00Z',
    builder: { company_name: 'Godrej Properties Ltd', email: 'sales@godrejproperties.com' },
    media: [
      { id: 101, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
      { id: 102, url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: false },
    ],
    documents_count: 4,
  },
  {
    id: 2,
    title: 'Prestige High Fields Luxury Villa',
    property_type: 'villa',
    listing_type: 'sale',
    bhk: 4,
    area_sqft: 3400,
    price: 38500000,
    price_display: '₹3.85 Cr',
    city: 'Pune',
    locality: 'Koregaon Park Annexe',
    address: 'Lane 7, Koregaon Park Annexe, Pune 411001',
    status: 'approved',
    is_verified: true,
    sponsored: true,
    bedrooms: 4,
    bathrooms: 5,
    furnishing: 'furnished',
    rera_approved: true,
    rera_number: 'P52100018902',
    created_at: '2026-09-05T11:20:00Z',
    builder: { company_name: 'Prestige Landmarks', email: 'support@prestigelandmarks.in' },
    media: [
      { id: 103, url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 5,
  },
  {
    id: 3,
    title: 'Kolte-Patil Life Republic 2BHK Smart Home',
    property_type: 'apartment',
    listing_type: 'sale',
    bhk: 2,
    area_sqft: 980,
    price: 7800000,
    price_display: '₹78 Lakhs',
    city: 'Pune',
    locality: 'Hinjewadi Phase 1 / Marunji',
    address: 'Life Republic Township, Sector R9, Marunji Road, Pune 411057',
    status: 'approved',
    is_verified: true,
    sponsored: false,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: 'semi-furnished',
    rera_approved: true,
    rera_number: 'P52100017116',
    created_at: '2026-09-12T14:10:00Z',
    builder: { company_name: 'Kolte-Patil Developers Ltd', email: 'connect@koltepatil.com' },
    media: [
      { id: 104, url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 3,
  },
  {
    id: 4,
    title: 'Panchshil Towers Signature Penthouse',
    property_type: 'penthouse',
    listing_type: 'sale',
    bhk: 5,
    area_sqft: 5200,
    price: 72000000,
    price_display: '₹7.20 Cr',
    city: 'Pune',
    locality: 'Kharadi World Trade Center',
    address: 'Tower A, Panchshil Towers, EON Free Zone, Kharadi, Pune 411014',
    status: 'approved',
    is_verified: true,
    sponsored: true,
    bedrooms: 5,
    bathrooms: 6,
    furnishing: 'furnished',
    rera_approved: true,
    rera_number: 'P52100002819',
    created_at: '2026-09-18T09:30:00Z',
    builder: { company_name: 'Panchshil Realty', email: 'luxury@panchshil.com' },
    media: [
      { id: 105, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 6,
  },
  {
    id: 5,
    title: 'Rohan Leher 3BHK Garden Duplex',
    property_type: 'apartment',
    listing_type: 'sale',
    bhk: 3,
    area_sqft: 1680,
    price: 15500000,
    price_display: '₹1.55 Cr',
    city: 'Pune',
    locality: 'Baner Balewadi High Street',
    address: 'Near Balewadi Stadium, Baner, Pune 411045',
    status: 'approved',
    is_verified: true,
    sponsored: false,
    bedrooms: 3,
    bathrooms: 3,
    furnishing: 'semi-furnished',
    rera_approved: true,
    rera_number: 'P52100009214',
    created_at: '2026-09-24T16:00:00Z',
    agent: { name: 'Priya Patel', agency_name: 'Sai Prime Realtors', phone: '+91 98765 43210' },
    media: [
      { id: 106, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 3,
  },
  {
    id: 6,
    title: 'Lodha Park Central 4BHK Sea-Facing Haven',
    property_type: 'apartment',
    listing_type: 'sale',
    bhk: 4,
    area_sqft: 2850,
    price: 68000000,
    price_display: '₹6.80 Cr',
    city: 'Mumbai',
    locality: 'Worli South Mumbai',
    address: 'Pandurang Budhkar Marg, Worli, Mumbai 400013',
    status: 'pending',
    is_verified: false,
    sponsored: false,
    bedrooms: 4,
    bathrooms: 4,
    furnishing: 'unfurnished',
    rera_approved: true,
    rera_number: 'P51900001339',
    created_at: '2026-10-02T13:15:00Z',
    owner: { name: 'Sunita Agarwal', email: 'sunita.agarwal@agarwalgroup.com', phone: '+91 98230 11984' },
    media: [
      { id: 107, url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 2,
  },
  {
    id: 7,
    title: 'Viman Nagar Luxury 2BHK Near Phoenix Mall',
    property_type: 'apartment',
    listing_type: 'rent',
    bhk: 2,
    area_sqft: 1100,
    price: 45000,
    price_display: '₹45,000 / mo',
    city: 'Pune',
    locality: 'Viman Nagar',
    address: 'Behind Hyatt Regency, Viman Nagar, Pune 411014',
    status: 'approved',
    is_verified: true,
    sponsored: false,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: 'furnished',
    rera_approved: true,
    rera_number: 'P52100004419',
    created_at: '2026-10-04T11:00:00Z',
    agent: { name: 'Vikram Malhotra', agency_name: 'Apex Realty Consultancy', phone: '+91 98220 19823' },
    media: [
      { id: 108, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 3,
  },
  {
    id: 8,
    title: 'Amanora Park Town Neo Towers 1BHK Studio',
    property_type: 'apartment',
    listing_type: 'sale',
    bhk: 1,
    area_sqft: 620,
    price: 4800000,
    price_display: '₹48 Lakhs',
    city: 'Pune',
    locality: 'Hadapsar / Magarpatta',
    address: 'Sector 2, Amanora Park Town, Hadapsar, Pune 411028',
    status: 'approved',
    is_verified: true,
    sponsored: false,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: 'furnished',
    rera_approved: true,
    rera_number: 'P52100024891',
    created_at: '2026-10-05T08:45:00Z',
    owner: { name: 'Rameshwar Patil', email: 'ramesh.patil@patilholdings.in', phone: '+91 98221 44001' },
    media: [
      { id: 109, url: 'https://images.unsplash.com/photo-1502005229762-ee1b2b89c7d4?auto=format&fit=crop&w=1200&q=80', media_type: 'image', is_featured: true },
    ],
    documents_count: 2,
  },
];

export const initialDocuments: MockDocument[] = [
  {
    id: 501,
    user_id: 301,
    user_name: 'Priya Patel',
    user_email: 'priya.patel@saiprime.in',
    account_type: 'agent',
    document_type: 'rera_certificate',
    file_name: 'MahaRERA_Broker_A52100099214.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 1420,
    status: 'VERIFIED',
    ocr_confidence: 98.6,
    extracted_data: { rera_no: 'A52100099214', broker_name: 'Priya Patel', validity: '2029-12-31' },
    uploaded_at: '2026-09-15T10:20:00Z',
  },
  {
    id: 502,
    user_id: 401,
    user_name: 'Godrej Properties Ltd',
    user_email: 'sales@godrejproperties.com',
    account_type: 'builder',
    document_type: 'project_sanction',
    file_name: 'PMC_Sanction_Plan_Godrej_Infinity.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 4890,
    status: 'VERIFIED',
    ocr_confidence: 99.1,
    extracted_data: { sanction_no: 'PMC/BP/2026/891', fsi_approved: 2.5, floors_sanctioned: 24 },
    uploaded_at: '2026-09-20T14:10:00Z',
  },
  {
    id: 503,
    user_id: 202,
    user_name: 'Sunita Agarwal',
    user_email: 'sunita.agarwal@agarwalgroup.com',
    account_type: 'owner',
    document_type: 'pan_card',
    file_name: 'PAN_Card_Corporate_Agarwal_Assets.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 890,
    status: 'VERIFIED',
    ocr_confidence: 97.4,
    extracted_data: { pan_no: 'BHKPA8192L', name_match: true },
    uploaded_at: '2026-09-28T16:30:00Z',
  },
  {
    id: 504,
    user_id: 305,
    user_name: 'Kiran More',
    user_email: 'kiran.more@puneconsultants.in',
    account_type: 'agent',
    document_type: 'broker_license',
    file_name: 'Pune_Broker_Registration_2026.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 1120,
    status: 'PENDING',
    ocr_confidence: 88.2,
    extracted_data: { rera_pending: true, license_status: 'Under Department Review' },
    uploaded_at: '2026-10-02T11:45:00Z',
  },
  {
    id: 505,
    user_id: 103,
    user_name: 'Rahul Singhania',
    user_email: 'singhania.rahul@corporate.in',
    account_type: 'buyer',
    document_type: 'aadhaar_card',
    file_name: 'Aadhaar_Front_Back_Masked.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 750,
    status: 'UNDER_REVIEW',
    ocr_confidence: 94.0,
    extracted_data: { aadhaar_last4: '8812', name: 'Rahul Singhania', dob_match: true },
    uploaded_at: '2026-10-04T15:10:00Z',
  },
  {
    id: 506,
    user_id: 204,
    user_name: 'Deepak Chawla',
    user_email: 'deepak.chawla@mumbairealty.in',
    account_type: 'owner',
    document_type: 'sale_deed',
    file_name: 'Registered_Sale_Deed_Worli_Apartment.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_kb: 6200,
    status: 'PENDING',
    ocr_confidence: 95.8,
    extracted_data: { index2_registered: true, sub_registrar: 'Mumbai City-IV' },
    uploaded_at: '2026-10-05T09:30:00Z',
  },
];

export const initialKYCQueue: MockKYCItem[] = [
  {
    id: 601,
    user_id: 103,
    user_name: 'Rahul Singhania',
    user_email: 'singhania.rahul@corporate.in',
    user_phone: '+91 98901 88412',
    account_type: 'buyer',
    document_type: 'aadhaar_card',
    file_name: 'Aadhaar_Front_Back_Masked.pdf',
    status: 'UNDER_REVIEW',
    uploaded_at: '2026-10-04T15:10:00Z',
    ocr_match_rate: 94,
    kyc_level: 'Tier-2 Real Estate Compliance',
  },
  {
    id: 602,
    user_id: 305,
    user_name: 'Kiran More',
    user_email: 'kiran.more@puneconsultants.in',
    user_phone: '+91 94223 88120',
    account_type: 'agent',
    document_type: 'broker_license',
    file_name: 'Pune_Broker_Registration_2026.pdf',
    status: 'PENDING',
    uploaded_at: '2026-10-02T11:45:00Z',
    ocr_match_rate: 88,
    kyc_level: 'Broker Regulatory Authorization',
  },
  {
    id: 603,
    user_id: 204,
    user_name: 'Deepak Chawla',
    user_email: 'deepak.chawla@mumbairealty.in',
    user_phone: '+91 98200 77123',
    account_type: 'owner',
    document_type: 'sale_deed',
    file_name: 'Registered_Sale_Deed_Worli_Apartment.pdf',
    status: 'PENDING',
    uploaded_at: '2026-10-05T09:30:00Z',
    ocr_match_rate: 96,
    kyc_level: 'Direct Title Verification',
  },
  {
    id: 604,
    user_id: 107,
    user_name: 'Karthik Ramanathan',
    user_email: 'karthik.r@fintech.io',
    user_phone: '+91 98403 55112',
    account_type: 'buyer',
    document_type: 'pan_card',
    file_name: 'PAN_Card_Karthik_R.pdf',
    status: 'PENDING',
    uploaded_at: '2026-10-06T10:00:00Z',
    ocr_match_rate: 98,
    kyc_level: 'Statutory Identity Proof',
  },
];

export const initialRERARecords: MockRERARecord[] = [
  {
    id: 701,
    rera_number: 'P52100003129',
    project_name: 'Godrej Infinity Phase 2 & 3',
    promoter_name: 'Godrej Properties Ltd',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'Residential & Retail',
    verification_status: 'VERIFIED',
    verified_at: '2026-06-20T10:00:00Z',
    expiry_date: '2028-12-31',
  },
  {
    id: 702,
    rera_number: 'P52100018902',
    project_name: 'Prestige High Fields Residences',
    promoter_name: 'Prestige Landmarks',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'Luxury Villas & Apartments',
    verification_status: 'VERIFIED',
    verified_at: '2026-07-02T11:30:00Z',
    expiry_date: '2029-06-30',
  },
  {
    id: 703,
    rera_number: 'P52100017116',
    project_name: 'Life Republic Sector R9',
    promoter_name: 'Kolte-Patil Developers Ltd',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'Integrated Township',
    verification_status: 'VERIFIED',
    verified_at: '2026-07-15T09:00:00Z',
    expiry_date: '2028-09-30',
  },
  {
    id: 704,
    rera_number: 'P52100002819',
    project_name: 'Panchshil Towers Tower A to E',
    promoter_name: 'Panchshil Realty',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'High-Rise Luxury Residential',
    verification_status: 'VERIFIED',
    verified_at: '2026-08-01T14:00:00Z',
    expiry_date: '2027-12-31',
  },
  {
    id: 705,
    rera_number: 'P51900001339',
    project_name: 'Lodha Park Central Towers',
    promoter_name: 'Macrotech Developers Ltd',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    project_type: 'High-End Residential',
    verification_status: 'VERIFIED',
    verified_at: '2026-08-12T16:15:00Z',
    expiry_date: '2029-03-31',
  },
  {
    id: 706,
    rera_number: 'P52100024891',
    project_name: 'Amanora Gateway Towers 98 & 99',
    promoter_name: 'City Corporation Limited',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'Mixed Development',
    verification_status: 'VERIFIED',
    verified_at: '2026-08-25T12:00:00Z',
    expiry_date: '2028-12-31',
  },
];

export const initialComplaints: MockComplaint[] = [
  {
    id: 801,
    ticket_id: 'CMP-2026-901',
    user_name: 'Amit Deshmukh',
    user_email: 'amit.deshmukh@yahoo.com',
    user_role: 'buyer',
    category: 'Listing Discrepancy',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Carpet area discrepancy in Baner 3BHK listing',
    description: 'The listing states 1450 sqft carpet area, but the sanction floor plan provided during site visit only measures 1180 sqft RERA carpet.',
    internal_notes: 'Requested verified sanction layout and architect certificate from listing owner.',
    resolution: '',
    created_at: '2026-10-04T16:20:00Z',
  },
  {
    id: 802,
    ticket_id: 'CMP-2026-884',
    user_name: 'Meera Kapoor',
    user_email: 'meera.kapoor@example.com',
    user_role: 'buyer',
    category: 'Broker Conduct',
    priority: 'MEDIUM',
    status: 'UNDER_REVIEW',
    subject: 'Agent requested unverified cash token before inspection',
    description: 'Broker asked for ₹25,000 cash upfront to schedule a physical walkthrough of the Koregaon Park apartment without providing an official receipt.',
    internal_notes: 'Issued formal show-cause compliance notice to the brokerage firm.',
    resolution: '',
    created_at: '2026-10-03T11:15:00Z',
  },
  {
    id: 803,
    ticket_id: 'CMP-2026-760',
    user_name: 'Suresh Nambiar',
    user_email: 'suresh.n@gmail.com',
    user_role: 'buyer',
    category: 'Delayed Possession',
    priority: 'HIGH',
    status: 'RESOLVED',
    subject: 'Possession date delayed past MahaRERA committed date',
    description: 'Developer missed Q2 2026 handover without notifying buyer or filing extension form with MahaRERA authority.',
    internal_notes: 'Developer submitted MahaRERA Order copy with Revised Completion Date certificate.',
    resolution: 'Developer issued official compensation interest credit notes to all affected buyers as per RERA Section 18.',
    created_at: '2026-09-22T09:40:00Z',
  },
  {
    id: 804,
    ticket_id: 'CMP-2026-712',
    user_name: 'Kavita Shinde',
    user_email: 'kavita.shinde@shindeproperties.in',
    user_role: 'seller',
    category: 'Spam Inquiries',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: 'Repetitive spam bot inquiries on Hinjewadi commercial plot',
    description: 'Received 40+ repetitive inquiries within 2 hours from unverified anonymous phone numbers.',
    internal_notes: 'Bot traffic filtered via Cloudflare Turnstile rate-limiting.',
    resolution: 'Enhanced CAPTCHA & SMS OTP verification enforced on direct seller contact modal.',
    created_at: '2026-09-15T14:30:00Z',
  },
];

export const initialBanners: MockBanner[] = [
  {
    id: 901,
    title: 'Pune Metro Line 3 Transit Corridor Homes',
    subtitle: 'Explore premium RERA verified residential apartments along Hinjewadi-Shivajinagar Metro',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    target_url: '/search?metro=line3',
    badge_text: 'Festive Launch Offers',
    is_active: true,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 902,
    title: 'Zero Brokerage Direct Owner Verified Listings',
    subtitle: 'Save 100% on brokerage fees with verified Title & Index II legal checks',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    target_url: '/search?direct_owner=true',
    badge_text: 'Verified Owners Only',
    is_active: true,
    created_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 903,
    title: 'MahaRERA Registered Mega Townships 2026',
    subtitle: 'Integrated self-sustaining townships with international schools, malls & clubhouses',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    target_url: '/townships',
    badge_text: 'Exclusive Alliances',
    is_active: true,
    created_at: '2026-09-18T14:30:00Z',
  },
];

export const initialAnnouncements: MockAnnouncement[] = [
  {
    id: 1001,
    title: 'Statutory MahaRERA Q3 Mandatory Disclosure Notice',
    message: 'All registered builders must upload their Q3 progress photos and quarterly financial audit reports before October 31st to maintain active listing status.',
    type: 'WARNING',
    target_role: 'builder',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 1002,
    title: 'Diwali Property Festival 2026 Campaign Announced',
    message: 'Special spotlight placement and zero transaction fees for listings published with 3D Virtual Tours and verified legal certificates.',
    type: 'SUCCESS',
    target_role: 'all',
    is_active: true,
    created_at: '2026-10-03T10:30:00Z',
  },
  {
    id: 1003,
    title: 'Scheduled System Infrastructure Maintenance',
    message: 'Scheduled database indexing and storage node scaling between 2:00 AM - 3:30 AM IST on Sunday. AI search and document uploads will be temporarily paused.',
    type: 'INFO',
    target_role: 'all',
    is_active: true,
    created_at: '2026-10-05T12:00:00Z',
  },
];

export const initialFAQs: MockFAQ[] = [
  {
    id: 1101,
    category: 'Verification & Legal',
    question: 'How does SAI verify MahaRERA registration numbers?',
    answer: 'Our autonomous verification engine cross-references registered project IDs directly with the statutory MahaRERA public portal API, extracting promoter names, validity dates, and sanction layouts in real-time.',
    is_active: true,
  },
  {
    id: 1102,
    category: 'Buyer Protection',
    question: 'What is the SAI 100% Genuine Listing Guarantee?',
    answer: 'Every property marked with the green SAI Verified badge has completed mandatory title search verification, OCR document scrutiny (Index II / Sale Deed), and physical broker geofencing.',
    is_active: true,
  },
  {
    id: 1103,
    category: 'AI Assistant',
    question: 'Which languages does the Qwen AI property advisor support?',
    answer: 'SAI conversational AI natively supports 8 Indic languages including Marathi, Hindi, English, Gujarati, Telugu, Tamil, Kannada, and Bengali with speech-to-text input.',
    is_active: true,
  },
  {
    id: 1104,
    category: 'Owners & Sellers',
    question: 'How long does KYC document approval take for direct owners?',
    answer: 'Thanks to our automated OCR recognition and instant PAN/Aadhaar verification pipeline, 95% of owner KYC documents are reviewed and approved within 15 minutes of upload.',
    is_active: true,
  },
];

export const initialCategories: MockCategory[] = [
  { id: 1, name: 'Luxury Apartments', slug: 'apartments', description: 'Gated community flats with clubhouse and amenities', count: 245 },
  { id: 2, name: 'Independent Villas', slug: 'villas', description: 'Private bungalows and gated row houses', count: 68 },
  { id: 3, name: 'Penthouse Suites', slug: 'penthouses', description: 'Top-floor sky residences with panoramic views', count: 32 },
  { id: 4, name: 'Commercial Offices', slug: 'commercial', description: 'Grade-A tech parks and retail spaces', count: 85 },
  { id: 5, name: 'Residential NA Plots', slug: 'plots', description: 'Collector sanctioned clear-title residential land', count: 54 },
  { id: 6, name: 'Studio Residences', slug: 'studio', description: '1RK & compact studio suites for young professionals', count: 42 },
];

export const initialAuditLogs: MockAuditLog[] = [
  {
    id: 1201,
    action: 'PROPERTY_APPROVED',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'property',
    entity_id: '1',
    ip_address: '127.0.0.1',
    details: { property_title: 'Godrej Infinity 3BHK', previous_status: 'pending', new_status: 'approved' },
    created_at: '2026-10-07T08:14:22Z',
  },
  {
    id: 1202,
    action: 'KYC_VERIFIED',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'user',
    entity_id: '101',
    ip_address: '127.0.0.1',
    details: { user_name: 'Vikramaditya Sharma', kyc_type: 'Aadhaar + PAN' },
    created_at: '2026-10-07T07:45:10Z',
  },
  {
    id: 1203,
    action: 'AGENT_VERIFICATION_UPDATED',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'agent',
    entity_id: '301',
    ip_address: '127.0.0.1',
    details: { agency: 'Sai Prime Realtors', license_number: 'MH-AG-2026-881', new_status: 'VERIFIED' },
    created_at: '2026-10-06T18:22:45Z',
  },
  {
    id: 1204,
    action: 'BROADCAST_SENT',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'broadcast',
    entity_id: '1002',
    ip_address: '127.0.0.1',
    details: { title: 'Diwali Property Festival 2026', target_role: 'all', recipients: 1420 },
    created_at: '2026-10-05T14:10:00Z',
  },
  {
    id: 1205,
    action: 'USER_ACTIVATED',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'user',
    entity_id: '104',
    ip_address: '127.0.0.1',
    details: { email: 'pooja.hegde@techcorp.com', reason: 'Identity verification cleared' },
    created_at: '2026-10-04T12:00:30Z',
  },
  {
    id: 1206,
    action: 'ADMIN_LOGIN_SUCCESS',
    user_id: 5,
    user_name: 'Super Admin',
    user_email: 'admin@sai.in',
    entity_type: 'admin_auth',
    entity_id: '5',
    ip_address: '127.0.0.1',
    details: { auth_mode: 'TOTP 2FA Authenticated', session_valid_minutes: 1440 },
    created_at: '2026-10-07T06:30:00Z',
  },
];
