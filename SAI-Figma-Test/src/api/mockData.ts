// ── SAI OFFLINE MOCK DATA & HANDLER ──────────────────────────────────
// Provides realistic offline fallback data for all API endpoints when backend is unavailable.
import {
  generateMockBuilding3DData,
  generateMockUnitTour,
  generateMockProjectBuildings,
} from "./mockBuilding3D";

const PROPERTY_IMGS = [
  "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1680416124510-5eae1beca412?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=800&h=600&fit=crop&auto=format",
];

const MOCK_PROPERTIES = [
  { id: 1, title: "Prestige Heights", description: "Stunning 3BHK apartment with panoramic city views, modern amenities, and premium finishes in the heart of Baner.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1450, price: 8500000, price_display: "₹85L", furnishing: "Semi-Furnished", amenities: ["Gym", "Pool", "Parking", "24/7 Security", "Power Backup"], address: "Near Balewadi High Street", locality: "Baner", city: "Pune", latitude: 18.5596, longitude: 73.7871, status: "Ready to Move", is_verified: true, is_rera: true, badge: "AI Pick", match_score: 97, rating: 4.8, dist_metro: "0.8 km Metro", sponsored: true, sponsored_label: "Featured Property", created_at: "2026-01-15T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 1, media_type: "image", url: PROPERTY_IMGS[0], sort_order: 0 }] },
  { id: 2, title: "Godrej Woodsville", description: "Elegant 2BHK apartment in Wakad with modern kitchen, spacious balcony, and lush green surroundings.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1120, price: 6200000, price_display: "₹62L", furnishing: "Unfurnished", amenities: ["Gym", "Garden", "Security", "Clubhouse"], address: "Wakad Main Road", locality: "Wakad", city: "Pune", latitude: 18.5986, longitude: 73.7603, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Top Rated", match_score: 92, rating: 4.6, dist_metro: "1.2 km Metro", created_at: "2026-02-20T10:00:00Z", updated_at: "2026-09-18T10:00:00Z", media: [{ id: 2, media_type: "image", url: PROPERTY_IMGS[1], sort_order: 0 }] },
  { id: 3, title: "Lodha Palacia", description: "Luxurious 4BHK villa with private pool, landscaped garden, and smart home features in Kalyani Nagar.", property_type: "Villa", listing_type: "sale", bhk: 4, area_sqft: 2800, price: 18000000, price_display: "₹1.8Cr", furnishing: "Fully Furnished", amenities: ["Pool", "Club", "EV Charging", "Concierge"], address: "Kalyani Nagar Main Road", locality: "Kalyani Nagar", city: "Pune", latitude: 18.5465, longitude: 73.9016, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 88, rating: 4.9, dist_metro: "2.1 km Metro", created_at: "2026-03-10T10:00:00Z", updated_at: "2026-09-15T10:00:00Z", media: [{ id: 3, media_type: "image", url: PROPERTY_IMGS[2], sort_order: 0 }] },
  { id: 4, title: "Piramal Mahalaxmi", description: "Modern 2BHK rental apartment near IT Park with excellent connectivity and affordable rent.", property_type: "Apartment", listing_type: "rent", bhk: 2, area_sqft: 1050, price: 24000, price_display: "₹24,000/mo", furnishing: "Semi-Furnished", amenities: ["Parking", "Security", "Lift", "Power Backup"], address: "Near Hinjewadi Phase 1", locality: "Hinjewadi", city: "Pune", latitude: 18.5917, longitude: 73.7380, status: "Available", is_verified: true, is_rera: true, badge: "Value Pick", match_score: 85, rating: 4.5, dist_metro: "1.5 km IT Park", sponsored: true, sponsored_label: "Promoted Listing", created_at: "2026-04-05T10:00:00Z", updated_at: "2026-09-22T10:00:00Z", media: [{ id: 4, media_type: "image", url: PROPERTY_IMGS[3], sort_order: 0 }] },
  { id: 5, title: "Mahindra Windchimes", description: "Spacious 3BHK villa with rooftop garden, children's play area, and eco-friendly design.", property_type: "Villa", listing_type: "sale", bhk: 3, area_sqft: 2100, price: 12000000, price_display: "₹1.2Cr", furnishing: "Semi-Furnished", amenities: ["Garden", "Gym", "Pool", "Jogging Track"], address: "Magarpatta Road", locality: "Hadapsar", city: "Pune", latitude: 18.5041, longitude: 73.9267, status: "Under Construction", is_verified: true, is_rera: true, badge: "New Launch", match_score: 83, rating: 4.7, dist_metro: "0.5 km School", created_at: "2026-05-01T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 5, media_type: "image", url: PROPERTY_IMGS[4], sort_order: 0 }] },
  { id: 6, title: "Kolte Patil Life", description: "Compact 1BHK budget apartment ideal for young professionals with modern amenities and metro connectivity.", property_type: "Apartment", listing_type: "sale", bhk: 1, area_sqft: 650, price: 3800000, price_display: "₹38L", furnishing: "Furnished", amenities: ["Parking", "Lift", "Security", "CCTV"], address: "Near Akurdi Station", locality: "Akurdi", city: "Pune", latitude: 18.6478, longitude: 73.7656, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Budget Pick", match_score: 79, rating: 4.3, dist_metro: "0.3 km Metro", created_at: "2026-06-15T10:00:00Z", updated_at: "2026-09-19T10:00:00Z", media: [{ id: 6, media_type: "image", url: PROPERTY_IMGS[5], sort_order: 0 }] },
  { id: 7, title: "Sobha Dream Acres", description: "Premium 2BHK apartment with high ceilings, imported marble flooring, and airport proximity in Viman Nagar.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1200, price: 7200000, price_display: "₹72L", furnishing: "Semi-Furnished", amenities: ["Pool", "Gym", "Club", "Jogging Track"], address: "Viman Nagar Road", locality: "Viman Nagar", city: "Pune", latitude: 18.5679, longitude: 73.9143, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 90, rating: 4.8, dist_metro: "2.0 km Airport", created_at: "2026-07-01T10:00:00Z", updated_at: "2026-09-21T10:00:00Z", media: [{ id: 7, media_type: "image", url: PROPERTY_IMGS[6], sort_order: 0 }] },
  { id: 8, title: "Shapoorji Pallonji EON IT Hub", description: "Modern commercial office space with conference facilities, ample parking, and 24/7 security in Kharadi IT hub.", property_type: "Office Space", listing_type: "commercial", bhk: null, area_sqft: 1750, price: 9500000, price_display: "₹95L", furnishing: "Furnished", amenities: ["Conference", "Parking", "Security", "Cafeteria"], address: "EON IT Park Road", locality: "Kharadi", city: "Pune", latitude: 18.5538, longitude: 73.9436, status: "Ready to Move", is_verified: true, is_rera: true, badge: "AI Pick", match_score: 86, rating: 4.6, dist_metro: "1.0 km Metro", created_at: "2026-08-10T10:00:00Z", updated_at: "2026-09-23T10:00:00Z", media: [{ id: 8, media_type: "image", url: PROPERTY_IMGS[7], sort_order: 0 }] },
  { id: 9, title: "Emerald Court Baner", description: "Beautiful furnished 2BHK rental apartment in Baner with modular kitchen, private balcony, and high-speed Wi-Fi.", property_type: "Apartment", listing_type: "rent", bhk: 2, area_sqft: 1100, price: 28000, price_display: "₹28,000/mo", furnishing: "Fully Furnished", amenities: ["Parking", "Lift", "Security", "Balcony", "Gym"], address: "Baner Road near D-Mart", locality: "Baner", city: "Pune", latitude: 18.5620, longitude: 73.7840, status: "Available", is_verified: true, is_rera: true, badge: "Verified Rental", match_score: 95, rating: 4.7, dist_metro: "0.6 km Metro", created_at: "2026-08-15T10:00:00Z", updated_at: "2026-09-24T10:00:00Z", media: [{ id: 9, media_type: "image", url: PROPERTY_IMGS[1], sort_order: 0 }] },
  { id: 10, title: "Solitaire Park Baner", description: "Spacious 3BHK rental flat in Baner with covered parking, clubhouse, and scenic hill views.", property_type: "Apartment", listing_type: "rent", bhk: 3, area_sqft: 1550, price: 38000, price_display: "₹38,000/mo", furnishing: "Semi-Furnished", amenities: ["Clubhouse", "Swimming Pool", "24/7 Power", "Kids Area"], address: "Pan Card Club Road, Baner", locality: "Baner", city: "Pune", latitude: 18.5645, longitude: 73.7890, status: "Available", is_verified: true, is_rera: true, badge: "Top Pick", match_score: 93, rating: 4.8, dist_metro: "1.0 km Metro", created_at: "2026-08-20T10:00:00Z", updated_at: "2026-09-24T10:00:00Z", media: [{ id: 10, media_type: "image", url: PROPERTY_IMGS[0], sort_order: 0 }] },
  { id: 11, title: "Megapolis Sunway Hinjewadi", description: "Affordable and smart 2BHK flat for sale near Hinjewadi Phase 3 tech parks. Ideal for IT professionals.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 980, price: 5500000, price_display: "₹55L", furnishing: "Semi-Furnished", amenities: ["Bus Shuttle", "Gym", "Playground", "Security"], address: "Phase 3, Hinjewadi", locality: "Hinjewadi", city: "Pune", latitude: 18.5830, longitude: 73.7120, status: "Ready to Move", is_verified: true, is_rera: true, badge: "IT Special", match_score: 94, rating: 4.6, dist_metro: "Next to IT Hub", created_at: "2026-07-12T10:00:00Z", updated_at: "2026-09-22T10:00:00Z", media: [{ id: 11, media_type: "image", url: PROPERTY_IMGS[3], sort_order: 0 }] },
  { id: 12, title: "Signature Tower Wakad", description: "Comfortable 2BHK rental apartment in Wakad with fast expressway access and prime commercial connectivity.", property_type: "Apartment", listing_type: "rent", bhk: 2, area_sqft: 1080, price: 23000, price_display: "₹23,000/mo", furnishing: "Semi-Furnished", amenities: ["Parking", "Lift", "Security", "Solar Water"], address: "Datta Mandir Road, Wakad", locality: "Wakad", city: "Pune", latitude: 18.6010, longitude: 73.7650, status: "Available", is_verified: true, is_rera: true, badge: "Fast Booking", match_score: 91, rating: 4.5, dist_metro: "1.0 km Metro", created_at: "2026-08-01T10:00:00Z", updated_at: "2026-09-23T10:00:00Z", media: [{ id: 12, media_type: "image", url: PROPERTY_IMGS[2], sort_order: 0 }] },
  { id: 13, title: "Panchshil Towers Kharadi", description: "Ultra-luxury 3BHK high-rise apartment in Kharadi overlooking Pune riverfront and golf course.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1850, price: 14500000, price_display: "₹1.45Cr", furnishing: "Fully Furnished", amenities: ["Olympic Pool", "Spa", "Concierge", "Tennis Court"], address: "Tower 4, Kharadi Waterfront", locality: "Kharadi", city: "Pune", latitude: 18.5580, longitude: 73.9520, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Luxury Pick", match_score: 96, rating: 4.9, dist_metro: "1.2 km Metro", created_at: "2026-06-18T10:00:00Z", updated_at: "2026-09-21T10:00:00Z", media: [{ id: 13, media_type: "image", url: PROPERTY_IMGS[6], sort_order: 0 }] },
  { id: 14, title: "Athashri Senior Living Baner", description: "Senior-citizen specialized ground floor 2BHK flat with wide doorways, grab rails, emergency cords, and on-site doctor.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1100, price: 5200000, price_display: "₹52L", furnishing: "Fully Furnished", amenities: ["24/7 Nurse", "Doctor on Call", "Wheelchair Access", "Physiotherapy"], address: "Baner-Pashan Link Road", locality: "Baner", city: "Pune", latitude: 18.5510, longitude: 73.7820, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Senior Friendly", match_score: 98, rating: 4.9, dist_metro: "0.5 km Hospital", created_at: "2026-05-10T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 14, media_type: "image", url: PROPERTY_IMGS[4], sort_order: 0 }] },
  { id: 15, title: "Paranjape Schemes Kothrud", description: "Prestigious 3BHK flat in prime Kothrud with cultural atmosphere, reputed schools, and metro station within 300m.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1400, price: 11500000, price_display: "₹1.15Cr", furnishing: "Semi-Furnished", amenities: ["Metro 300m", "Garden", "Covered Parking", "Solar System"], address: "Paud Road, Kothrud", locality: "Kothrud", city: "Pune", latitude: 18.5074, longitude: 73.8077, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Prime Location", match_score: 95, rating: 4.8, dist_metro: "0.3 km Metro", created_at: "2026-04-14T10:00:00Z", updated_at: "2026-09-19T10:00:00Z", media: [{ id: 15, media_type: "image", url: PROPERTY_IMGS[5], sort_order: 0 }] },
  // ── AMRAVATI ──
  { id: 16, title: "Shivshahi Residency", description: "Spacious 2BHK flat in the heart of Amravati with garden view and modern fittings.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 950, price: 3200000, price_display: "₹32L", furnishing: "Semi-Furnished", amenities: ["Parking", "Security", "Garden", "Lift"], address: "Rajapeth, Amravati", locality: "Rajapeth", city: "Amravati", latitude: 20.9330, longitude: 77.7523, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Value Pick", match_score: 88, rating: 4.4, dist_metro: "1.5 km Bus Stand", created_at: "2026-03-10T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 16, media_type: "image", url: PROPERTY_IMGS[0], sort_order: 0 }] },
  { id: 17, title: "Amravati Green Valley", description: "Premium 3BHK villa with private parking, terrace garden, and Vastu-compliant design.", property_type: "Villa", listing_type: "sale", bhk: 3, area_sqft: 1800, price: 5500000, price_display: "₹55L", furnishing: "Unfurnished", amenities: ["Garden", "Parking", "Terrace", "Water Supply"], address: "Camp Area, Amravati", locality: "Camp", city: "Amravati", latitude: 20.9277, longitude: 77.7561, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 91, rating: 4.6, dist_metro: "2.0 km Railway Station", created_at: "2026-04-01T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 17, media_type: "image", url: PROPERTY_IMGS[2], sort_order: 0 }] },
  // ── NAGPUR ──
  { id: 18, title: "Dharampeth Luxury Flat", description: "Premium 3BHK apartment in prime Dharampeth locality with city skyline views.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1600, price: 9500000, price_display: "₹95L", furnishing: "Semi-Furnished", amenities: ["Gym", "Pool", "Parking", "Clubhouse", "Security"], address: "Dharampeth, Nagpur", locality: "Dharampeth", city: "Nagpur", latitude: 21.1433, longitude: 79.0815, status: "Ready to Move", is_verified: true, is_rera: true, badge: "AI Pick", match_score: 94, rating: 4.7, dist_metro: "1.0 km Metro", created_at: "2026-05-15T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 18, media_type: "image", url: PROPERTY_IMGS[4], sort_order: 0 }] },
  { id: 19, title: "Manish Nagar Villa", description: "Beautiful 4BHK independent villa with private garden and modern architecture.", property_type: "Villa", listing_type: "sale", bhk: 4, area_sqft: 2500, price: 15000000, price_display: "₹1.5Cr", furnishing: "Unfurnished", amenities: ["Garden", "Parking", "Security", "Terrace", "Solar Panel"], address: "Manish Nagar, Nagpur", locality: "Manish Nagar", city: "Nagpur", latitude: 21.1100, longitude: 79.0500, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 90, rating: 4.8, dist_metro: "2.5 km Airport", created_at: "2026-05-20T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 19, media_type: "image", url: PROPERTY_IMGS[6], sort_order: 0 }] },
  // ── MUMBAI ──
  { id: 20, title: "Andheri West Skyline", description: "Modern 2BHK apartment in Andheri West with metro connectivity and premium amenities.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 850, price: 18000000, price_display: "₹1.8Cr", furnishing: "Semi-Furnished", amenities: ["Gym", "Pool", "Parking", "Concierge", "Metro Access"], address: "Lokhandwala, Andheri West", locality: "Andheri West", city: "Mumbai", latitude: 19.1364, longitude: 72.8296, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 95, rating: 4.7, dist_metro: "0.3 km Metro", created_at: "2026-06-01T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 20, media_type: "image", url: PROPERTY_IMGS[1], sort_order: 0 }] },
  { id: 21, title: "Powai Lake View Tower", description: "Luxurious 3BHK apartment overlooking Powai Lake with smart home features.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1400, price: 32000000, price_display: "₹3.2Cr", furnishing: "Fully Furnished", amenities: ["Lake View", "Gym", "Pool", "Clubhouse", "Concierge"], address: "Hiranandani Gardens, Powai", locality: "Powai", city: "Mumbai", latitude: 19.1197, longitude: 72.9074, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Luxury Pick", match_score: 96, rating: 4.9, dist_metro: "1.5 km IT Park", created_at: "2026-06-15T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 21, media_type: "image", url: PROPERTY_IMGS[3], sort_order: 0 }] },
  // ── BANGALORE ──
  { id: 22, title: "Whitefield Tech Park Residency", description: "Modern 2BHK apartment near ITPL and Whitefield metro with smart home features.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1100, price: 7800000, price_display: "₹78L", furnishing: "Semi-Furnished", amenities: ["Gym", "Pool", "Parking", "EV Charging", "Shuttle"], address: "ITPL Main Road, Whitefield", locality: "Whitefield", city: "Bangalore", latitude: 12.9698, longitude: 77.7500, status: "Ready to Move", is_verified: true, is_rera: true, badge: "IT Special", match_score: 93, rating: 4.6, dist_metro: "0.5 km Metro", created_at: "2026-07-01T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 22, media_type: "image", url: PROPERTY_IMGS[5], sort_order: 0 }] },
  // ── HYDERABAD ──
  { id: 23, title: "Gachibowli IT Corridor Flat", description: "Premium 2BHK apartment near Microsoft and Google campuses with excellent connectivity.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1200, price: 8500000, price_display: "₹85L", furnishing: "Semi-Furnished", amenities: ["Gym", "Pool", "Parking", "Clubhouse", "Jogging Track"], address: "Financial District, Gachibowli", locality: "Gachibowli", city: "Hyderabad", latitude: 17.4400, longitude: 78.3489, status: "Ready to Move", is_verified: true, is_rera: true, badge: "AI Pick", match_score: 95, rating: 4.8, dist_metro: "1.0 km IT Park", created_at: "2026-07-15T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 23, media_type: "image", url: PROPERTY_IMGS[7], sort_order: 0 }] },
  // ── NASHIK ──
  { id: 24, title: "Nashik Vineyard Residency", description: "Beautiful 2BHK apartment near Sula vineyards with scenic mountain views.", property_type: "Apartment", listing_type: "sale", bhk: 2, area_sqft: 1050, price: 4200000, price_display: "₹42L", furnishing: "Semi-Furnished", amenities: ["Garden", "Parking", "Security", "Gym"], address: "Gangapur Road, Nashik", locality: "Gangapur Road", city: "Nashik", latitude: 20.0063, longitude: 73.7630, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Top Rated", match_score: 89, rating: 4.5, dist_metro: "1.0 km Market", created_at: "2026-08-01T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 24, media_type: "image", url: PROPERTY_IMGS[0], sort_order: 0 }] },
  // ── JAIPUR ──
  { id: 25, title: "Pink City Heights", description: "Royal 3BHK apartment with Rajasthani architecture near Hawa Mahal.", property_type: "Apartment", listing_type: "sale", bhk: 3, area_sqft: 1500, price: 7500000, price_display: "₹75L", furnishing: "Semi-Furnished", amenities: ["Pool", "Gym", "Parking", "Garden", "Terrace"], address: "Malviya Nagar, Jaipur", locality: "Malviya Nagar", city: "Jaipur", latitude: 26.8584, longitude: 75.8013, status: "Ready to Move", is_verified: true, is_rera: true, badge: "Premium", match_score: 92, rating: 4.6, dist_metro: "1.2 km Metro", created_at: "2026-08-15T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", media: [{ id: 25, media_type: "image", url: PROPERTY_IMGS[2], sort_order: 0 }] },
];

// ── Demo User Accounts ─────────────────────────────────────────────
const DEMO_USERS: Record<string, { id: number; name: string; email: string; role: string; phone: string }> = {
  "buyer@sai.in": { id: 1, name: "Priya Sharma", email: "buyer@sai.in", role: "buyer", phone: "+91 98765 43210" },
  "owner@sai.in": { id: 2, name: "Rahul Sharma", email: "owner@sai.in", role: "seller", phone: "+91 98765 43211" },
  "agent@sai.in": { id: 3, name: "Vikram Patil", email: "agent@sai.in", role: "agent", phone: "+91 98765 43212" },
  "builder@sai.in": { id: 4, name: "Anil Kapoor", email: "builder@sai.in", role: "builder", phone: "+91 98765 43213" },
  "admin@sai.in": { id: 5, name: "Super Admin", email: "admin@sai.in", role: "super_admin", phone: "+91 98765 43214" },
};

// ── Local Storage for Offline State ─────────────────────────────────
function getLocalState(key: string, fallback: any = null) {
  try { const v = localStorage.getItem(`sai_mock_${key}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function setLocalState(key: string, value: any) {
  try { localStorage.setItem(`sai_mock_${key}`, JSON.stringify(value)); } catch {}
}

// ── Intelligent Chatbot ────────────────────────────────────────────
function generateChatResponse(message: string, language: string) {
  const msg = message.toLowerCase();
  const allCities = Array.from(new Set(MOCK_PROPERTIES.map(p => p.city.toLowerCase())));
  const allLocalities = Array.from(new Set(MOCK_PROPERTIES.map(p => p.locality.toLowerCase())));
  const allKnownLocations = Array.from(new Set([...allCities, ...allLocalities]));
  
  let mentionedLocs = allKnownLocations.filter(l => msg.includes(l));
  // Multilingual aliases for quick matching
  if (msg.includes("अमरावती") || msg.includes("अमरावतीत") || msg.includes("अमरावतीमध्ये")) mentionedLocs.push("amravati");
  if (msg.includes("नागपूर") || msg.includes("नागपुर") || msg.includes("नागपूरमध्ये")) mentionedLocs.push("nagpur");
  if (msg.includes("नाशिक") || msg.includes("नाशिकमध्ये")) mentionedLocs.push("nashik");
  if (msg.includes("पुणे") || msg.includes("पुण्यात") || msg.includes("पुण्यामध्ये")) mentionedLocs.push("pune");
  if (msg.includes("मुंबई") || msg.includes("मुंबईत") || msg.includes("मुंबईमध्ये")) mentionedLocs.push("mumbai");
  if (msg.includes("जयपुर") || msg.includes("जयपूर")) mentionedLocs.push("jaipur");

  if (mentionedLocs.length === 0) {
    const locM = msg.match(/\b(?:in|at|near|around)\s+([a-z]{3,20})\b/i);
    if (locM && !["flat", "apartment", "villa", "budget", "sale", "rent", "buy", "house", "homes", "property"].includes(locM[1].toLowerCase())) {
      mentionedLocs = [locM[1].toLowerCase()];
    }
  }

  // Detect BHK
  const bhkMatch = msg.match(/(\d)\s*bhk/i);
  const bhk = bhkMatch ? parseInt(bhkMatch[1]) : null;

  // Detect price
  const priceMatch = msg.match(/(\d+)\s*(lakh|l|lac|cr|crore|k|thousand)/i);
  let maxPrice = 0;
  if (priceMatch) {
    const num = parseInt(priceMatch[1]);
    const unit = priceMatch[2].toLowerCase();
    if (unit.startsWith("cr")) maxPrice = num * 10000000;
    else if (unit.startsWith("k") || unit.startsWith("thou")) maxPrice = num * 1000;
    else maxPrice = num * 100000;
  }

  // Detect property type
  const isVilla = msg.includes("villa") || msg.includes("house") || msg.includes("bungalow");
  const isRent = msg.includes("rent") || msg.includes("rental") || msg.includes("lease") || msg.includes("bhade") || msg.includes("किराय") || msg.includes("भाड");
  const isCommercial = msg.includes("office") || msg.includes("commercial") || msg.includes("shop") || msg.includes("showroom");
  const isCompare = msg.includes("compare") || msg.includes("comparison") || msg.includes("vs") || msg.includes("versus") || msg.includes("तुलना");
  const isInvestment = msg.includes("invest") || msg.includes("roi") || msg.includes("return") || msg.includes("appreciate") || msg.includes("निवेश");
  const isLoan = msg.includes("loan") || msg.includes("emi") || msg.includes("mortgage") || msg.includes("eligib") || msg.includes("लोन");
  const isRera = msg.includes("rera") || msg.includes("fraud") || msg.includes("legal") || msg.includes("verification") || msg.includes("stamp duty") || msg.includes("7/12") || msg.includes("title deed");
  const isSenior = msg.includes("senior") || msg.includes("elder") || msg.includes("retire") || msg.includes("wheelchair") || msg.includes("ground floor");

  // Greeting patterns
  if (msg.match(/^(hi|hello|hey|namaste|namaskar|good morning|good evening|pranam)/i)) {
    const isHi = language === "hi" || msg.includes("namaste") || msg.includes("namaskar");
    return {
      message: isHi
        ? "नमस्ते! 👋 मैं SAI AI असिस्टेंट हूँ। मैं आपकी प्रॉपर्टी खोजने, तुलना करने और सभी रियल एस्टेट सवालों के जवाब देने में मदद कर सकता हूँ।\n\nआप मुझसे किसी भी शहर की प्रॉपर्टीज के बारे में पूछ सकते हैं:\n• अमरावती में 2 BHK फ्लैट 🏢\n• पुणे में रेंटल प्रॉपर्टीज 📍\n• नागपुर में 3 BHK विला 🏡\n• होम लोन और EMI कैलकुलेटर 💰\n\nआप आज क्या देखना चाहते हैं?"
        : "Hello! 👋 I'm SAI AI Assistant, your smart real estate partner.\n\nI can help you across any city in India:\n• Finding verified properties in Amravati, Pune, Nagpur, Mumbai, Nashik, Jaipur & more\n• Locality comparisons & price trends\n• Home loan eligibility & EMI calculations\n• RERA verification & legal title deed checks\n\nWhat are you looking for today?",
      properties: MOCK_PROPERTIES.slice(0, 3),
      intent: "greeting",
      language: isHi ? "Hindi" : "English",
    };
  }

  // RERA / Legal / Fraud / Stamp Duty
  if (isRera) {
    return {
      message: language === "hi"
        ? "🛡️ **SAI कानूनी एवं RERA सत्यापन मार्गदर्शिका:**\n\n1. **RERA पंजीकरण:** महाराष्ट्र में सभी 500+ वर्गमीटर या 8+ फ्लैट्स वाली परियोजनाओं का MahaRERA में पंजीकृत होना अनिवार्य है।\n2. **स्टाम्प ड्यूटी:** वर्तमान दर 7% (5% स्टाम्प ड्यूटी + 1% लोकल बॉडी टैक्स + 1% सेस) है। महिला खरीदारों को 1% की छूट मिलती है!\n3. **टाइटल डीड जांच:** SAI AI सब-रजिस्ट्रार रिकॉर्ड्स और पिछले 30 वर्षों के भार (Encumbrance Certificate) को स्वतः सत्यापित करता है।\n\nक्या आप किसी विशिष्ट प्रॉपर्टी की प्रामाणिकता जांचना चाहते हैं?"
        : "🛡️ **SAI Legal & RERA Verification Insights:**\n\n1. **RERA Compliance:** All ongoing projects in the database must possess an active RERA registration number.\n2. **Stamp Duty:** Current state stamp duty rates apply with special concessions for female buyers.\n3. **Title Deed & 7/12 Extract:** SAI verifies title clearance, ownership trail (30-year search), and encumbrance certificates automatically.\n\nWould you like me to run an AI Trust Report on any listing?",
      properties: MOCK_PROPERTIES.filter(p => p.is_rera).slice(0, 3),
      intent: "legal_rera",
      language: language === "hi" ? "Hindi" : "English",
    };
  }

  // Senior Living
  if (isSenior) {
    const seniorProps = MOCK_PROPERTIES.filter(p => p.title.toLowerCase().includes("senior") || p.locality.toLowerCase().includes("baner"));
    return {
      message: language === "hi"
        ? "👵 **वरिष्ठ नागरिकों के लिए विशेष सुरक्षित आवास:**\n\nSAI ने वरिष्ठ नागरिकों के लिए आरामदायक सुविधाएं छांटी हैं:\n• ग्राउंड फ्लोर या डुअल-लिफ्ट अपार्टमेंट\n• व्हीलचेयर रैंप और एंटी-स्किड फ्लोरिंग\n• अस्पताल 2 किमी के दायरे में\n• 24x7 इमरजेंसी सपोर्ट\n\nयहाँ बेहतरीन विकल्प हैं:"
        : "👵 **Senior-Citizen Friendly Properties:**\n\nSAI has shortlisted residences designed for safety and ease of living:\n• Ground floor or dual-stretcher elevator access\n• Anti-skid flooring, emergency pull-cords, and grab bars\n• Multi-specialty hospitals within 2 km\n• Quiet, green localities with active community spaces\n\nHere are top senior-friendly recommendations:",
      properties: seniorProps.length > 0 ? seniorProps : MOCK_PROPERTIES.slice(0, 3),
      intent: "senior_living",
      language: language === "hi" ? "Hindi" : "English",
    };
  }

  // Compare intent
  if (isCompare) {
    const loc1 = mentionedLocs[0] || "baner";
    const loc2 = mentionedLocs[1] || (loc1 === "baner" ? "wakad" : "hinjewadi");
    const l1Name = loc1.charAt(0).toUpperCase() + loc1.slice(1);
    const l2Name = loc2.charAt(0).toUpperCase() + loc2.slice(2);
    const props = MOCK_PROPERTIES.filter(p => p.locality.toLowerCase().includes(loc1) || p.locality.toLowerCase().includes(loc2) || p.city.toLowerCase().includes(loc1) || p.city.toLowerCase().includes(loc2));

    return {
      message: language === "hi"
        ? `📊 **${l1Name} बनाम ${l2Name} विस्तृत तुलना:**\n\nनीचे दोनों क्षेत्रों की चुनिंदा प्रॉपर्टीज देखें:`
        : `📊 **${l1Name} vs ${l2Name} Locality Comparison:**\n\n📍 Compare these matching properties across locations:`,
      properties: props.length > 0 ? props.slice(0, 4) : MOCK_PROPERTIES.slice(0, 4),
      intent: "comparison",
      language: language === "hi" ? "Hindi" : "English",
    };
  }

  // Loan / EMI intent
  if (isLoan) {
    return {
      message: language === "hi"
        ? "💰 **SAI होम लोन और EMI विवरण:**\n\n🏦 **प्रमुख बैंकों की ब्याज दरें (2026):**\n• SBI: 8.25% - 8.65%\n• HDFC Bank: 8.35% - 8.75%\n• ICICI Bank: 8.40% - 8.80%\n\n📊 **EMI अनुमान (20 वर्ष की अवधि):**\n• ₹50 लाख लोन @ 8.5% = ₹43,391/माह\n• ₹75 लाख लोन @ 8.5% = ₹65,087/माह\n\n💡 आप अपने बायर डैशबोर्ड में 'Loan Calculator' का उपयोग करके सटीक पात्रता देख सकते हैं।"
        : "💰 **Home Loan & EMI Calculation Guide:**\n\n🏦 **Current Bank Interest Rates (2026):**\n• State Bank of India: 8.25% – 8.65%\n• HDFC Bank: 8.35% – 8.75%\n• ICICI Bank: 8.40% – 8.80%\n\n📊 **Quick EMI Estimates (20-Year Tenure @ 8.5%):**\n• ₹50 Lakh Loan: **₹43,391/month** (Down payment: ₹12.5L)\n• ₹75 Lakh Loan: **₹65,087/month** (Down payment: ₹18.75L)\n• ₹1.0 Crore Loan: **₹86,782/month** (Down payment: ₹25.0L)\n\n💡 Check your exact pre-qualified limit in the **Buyer Dashboard** under Loan Calculator!",
      properties: MOCK_PROPERTIES.slice(0, 3),
      intent: "loan_emi",
      language: language === "hi" ? "Hindi" : "English",
    };
  }

  // Property search: filter accurately
  let matched = [...MOCK_PROPERTIES];
  const hasSpecificLocation = mentionedLocs.length > 0;

  if (hasSpecificLocation) {
    matched = matched.filter(p => mentionedLocs.some(l => p.locality.toLowerCase().includes(l) || p.city.toLowerCase().includes(l)));
  }

  if (isRent) {
    matched = matched.filter(p => p.listing_type === "rent");
  } else if (isCommercial) {
    matched = matched.filter(p => p.listing_type === "commercial");
  } else if (isVilla) {
    matched = matched.filter(p => p.property_type.toLowerCase().includes("villa"));
  }

  if (bhk) {
    matched = matched.filter(p => p.bhk === bhk);
  }

  if (maxPrice > 0) {
    matched = matched.filter(p => p.price <= maxPrice);
  }

  const isHi = language === "hi";
  const locLabel = hasSpecificLocation
    ? mentionedLocs.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")
    : "All Locations";
  const typeLabel = isRent ? "Rental Properties" : isCommercial ? "Commercial Spaces" : isVilla ? "Villas" : bhk ? `${bhk} BHK Homes` : "Properties";

  // Critical Requirement 3: NO CROSS-CITY RESULT MIXING
  if (matched.length === 0) {
    const noResultMsg = isHi
      ? `**${locLabel}** में कोई मेल खाती संपत्ति नहीं मिली। क्या आप आस-पास के क्षेत्रों या किसी अन्य शहर में खोजना चाहेंगे?`
      : `No matching properties were found in **${locLabel}**. Would you like to search nearby areas or another city?`;
    return {
      message: noResultMsg,
      properties: [],
      intent: "property_search",
      language: isHi ? "Hindi" : "English",
    };
  }

  const responseMessage = isHi
    ? `🏡 मैंने **${locLabel}** में **${matched.length} ${isRent ? "किराये के लिए" : "खरीदने के लिए"} ${typeLabel}** खोजी हैं:\n\n` +
      matched.slice(0, 3).map((p, i) => `${i + 1}. **${p.title}** — ${p.price_display} · ${p.locality}, ${p.city}\n   📐 ${p.area_sqft} sq ft · ⭐ ${p.rating} · ${p.status}`).join("\n\n") +
      `\n\n💡 नीचे दिए गए कार्ड्स पर क्लिक करके साइट विजिट शेड्यूल करें या विस्तृत विवरण देखें।`
    : `🏡 I found **${matched.length} ${typeLabel}** in **${locLabel}**${isRent ? " for rent" : " for sale"}:\n\n` +
      matched.slice(0, 3).map((p, i) => `${i + 1}. **${p.title}** — **${p.price_display}** · ${p.locality}, ${p.city}\n   📐 ${p.area_sqft} sq ft · ⭐ ${p.rating} · ${p.status} · ${p.is_rera ? "RERA Verified" : "Verified"}`).join("\n\n") +
      `\n\n💡 Click any card below to inspect full photos, schedule a physical visit, or compare options!`;

  return {
    message: responseMessage,
    properties: matched.slice(0, 4),
    intent: "property_search",
    language: isHi ? "Hindi" : "English",
  };
}

// ── Property Documents Mock Generator ──────────────────────────────
export function generateMockPropertyDocuments(propertyId: number) {
  const prop = MOCK_PROPERTIES.find(p => p.id === propertyId) || MOCK_PROPERTIES[0];
  const title = prop?.title || "Prestige Heights";
  const city = prop?.city || "Pune";
  const locality = prop?.locality || "Baner";

  const docs = [
    {
      id: propertyId * 100 + 1,
      property_id: propertyId,
      document_type: "title_deed",
      document_name: "Registered Sale Deed & Title Search Report",
      file_name: `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_sale_deed.pdf`,
      mime_type: "application/pdf",
      file_size: 2450000,
      file_size_formatted: "2.4 MB",
      status: "VERIFIED" as const,
      version: 1,
      uploaded_at: "2026-01-20T10:00:00Z",
      verified_at: "2026-01-22T14:30:00Z",
      verified_by: "Adv. Ramesh Joshi (SAI Legal Team)",
      rera_number: `MAHARERA/P521000${propertyId || 1}91`,
      view_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&fit=crop",
    },
    {
      id: propertyId * 100 + 2,
      property_id: propertyId,
      document_type: "rera_certificate",
      document_name: "MahaRERA Project Registration Certificate",
      file_name: "maharera_registration_cert.pdf",
      mime_type: "application/pdf",
      file_size: 1820000,
      file_size_formatted: "1.8 MB",
      status: "VERIFIED" as const,
      version: 1,
      uploaded_at: "2026-01-20T10:15:00Z",
      verified_at: "2026-01-22T14:35:00Z",
      verified_by: "MahaRERA Portal Sync",
      rera_number: `P521000${propertyId || 1}91`,
      view_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&fit=crop",
    },
    {
      id: propertyId * 100 + 3,
      property_id: propertyId,
      document_type: "occupancy_certificate",
      document_name: "Municipal Sanction Plan & Occupancy Certificate (OC)",
      file_name: "municipal_sanction_occupancy.pdf",
      mime_type: "application/pdf",
      file_size: 3100000,
      file_size_formatted: "3.1 MB",
      status: "VERIFIED" as const,
      version: 1,
      uploaded_at: "2026-01-20T10:30:00Z",
      verified_at: "2026-01-22T15:00:00Z",
      verified_by: "Town Planning Authority",
      view_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&fit=crop",
    },
    {
      id: propertyId * 100 + 4,
      property_id: propertyId,
      document_type: "encumbrance_certificate",
      document_name: "30-Year Non-Encumbrance Certificate (EC Form 15)",
      file_name: "nil_encumbrance_certificate.pdf",
      mime_type: "application/pdf",
      file_size: 1450000,
      file_size_formatted: "1.4 MB",
      status: "VERIFIED" as const,
      version: 1,
      uploaded_at: "2026-01-20T11:00:00Z",
      verified_at: "2026-01-22T15:15:00Z",
      verified_by: "Sub-Registrar Authority",
      view_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&fit=crop",
    },
    {
      id: propertyId * 100 + 5,
      property_id: propertyId,
      document_type: "property_tax",
      document_name: "Municipal Property Tax & Assessment Receipt",
      file_name: "property_tax_receipt.pdf",
      mime_type: "application/pdf",
      file_size: 890000,
      file_size_formatted: "890 KB",
      status: "UNDER_REVIEW" as const,
      version: 1,
      uploaded_at: "2026-02-01T09:00:00Z",
      view_url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&fit=crop",
    },
  ];

  const categories = [
    {
      key: "ownership",
      name: "Title & Ownership Deed",
      status: "VERIFIED" as const,
      weight: 25,
      document_count: 1,
      documents: [docs[0]],
    },
    {
      key: "rera",
      name: "RERA Registration & Approvals",
      status: "VERIFIED" as const,
      weight: 25,
      document_count: 1,
      documents: [docs[1]],
    },
    {
      key: "approvals",
      name: "Municipal Sanction & OC",
      status: "VERIFIED" as const,
      weight: 20,
      document_count: 1,
      documents: [docs[2]],
    },
    {
      key: "project",
      name: "NOC & Encumbrance Certificate",
      status: "VERIFIED" as const,
      weight: 15,
      document_count: 1,
      documents: [docs[3]],
    },
    {
      key: "agreements",
      name: "Property Tax & Utility Receipts",
      status: "UNDER_REVIEW" as const,
      weight: 15,
      document_count: 1,
      documents: [docs[4]],
    },
  ];

  return {
    property_id: propertyId,
    property_title: title,
    city: city,
    locality: locality,
    trust_score: 94,
    trust_grade: "A+ Highly Verified",
    summary: {
      total_uploaded: 5,
      verified_count: 4,
      under_review_count: 1,
      rejected_count: 0,
      status_text: "✓ 4 of 5 core legal documents are fully verified by SAI legal auditors.",
      is_fully_verified: false,
    },
    categories,
    documents: docs,
  };
}

// ── Mock API Handler ───────────────────────────────────────────────
export function handleMockRequest(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || "GET").toUpperCase();
  let body: any = {};
  try { if (options.body && typeof options.body === "string") body = JSON.parse(options.body); } catch {}

  // ── AUTH ENDPOINTS ──────────────────────────────────────────────
  if (endpoint.includes("/auth/login") && method === "POST") {
    const rawEmail = (body.email || "user@sai.in").trim();
    const email = rawEmail.includes("@") ? rawEmail : `${rawEmail}@sai.in`;
    const existingUser = DEMO_USERS[email];
    const inferredRole = body.role || (
      email.includes("owner") || email.includes("seller") ? "seller" :
      email.includes("agent") ? "agent" :
      email.includes("builder") ? "builder" :
      email.includes("admin") ? "super_admin" : "buyer"
    );
    const namePart = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const u = existingUser || {
      id: Math.floor(Math.random() * 899) + 100,
      name: namePart || "User",
      email: email,
      role: inferredRole,
      phone: "+91 98765 43210",
    };
    const token = `mock_token_${u.role}_${Date.now()}`;
    return {
      access_token: token,
      refresh_token: `mock_refresh_${Date.now()}`,
      token_type: "bearer",
      role: u.role,
      user_id: u.id,
      name: u.name,
      email: u.email,
    };
  }

  if (endpoint.includes("/auth/otp/send") && method === "POST") {
    const rawEmail = (body.email || "user@sai.in").trim();
    const email = rawEmail.includes("@") ? rawEmail : `${rawEmail}@sai.in`;
    return {
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      cooldown_seconds: 60,
      expires_in_minutes: 5,
    };
  }

  if (endpoint.includes("/auth/otp/verify") && method === "POST") {
    const rawEmail = (body.email || "user@sai.in").trim();
    const email = rawEmail.includes("@") ? rawEmail : `${rawEmail}@sai.in`;
    const inferredRole = body.role || (
      email.includes("owner") || email.includes("seller") ? "seller" :
      email.includes("agent") ? "agent" :
      email.includes("builder") ? "builder" :
      email.includes("admin") ? "super_admin" : "buyer"
    );
    const existingUser = DEMO_USERS[email];
    const namePart = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const u = existingUser || {
      id: Math.floor(Math.random() * 899) + 100,
      name: body.name || namePart || "User",
      email: email,
      role: inferredRole,
      phone: "+91 98765 43210",
    };
    return {
      access_token: `mock_otp_token_${u.role}_${Date.now()}`,
      refresh_token: `mock_otp_refresh_${Date.now()}`,
      token_type: "bearer",
      role: u.role,
      user_id: u.id,
      name: u.name,
      email: u.email,
    };
  }

  if (endpoint.includes("/auth/register") && method === "POST") {
    return {
      id: 100 + Math.floor(Math.random() * 1000),
      name: body.name || "New User",
      email: body.email,
      phone: body.phone,
      role: body.role || "buyer",
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }

  if (endpoint.includes("/auth/me")) {
    const token = (typeof options.headers === "object" && options.headers !== null) ? "" : "";
    return { id: 1, name: "Priya Sharma", email: "buyer@sai.in", role: "buyer", is_active: true, created_at: "2026-01-01T00:00:00Z" };
  }

  if (endpoint.includes("/auth/logout")) {
    return { message: "Logged out successfully" };
  }

  if (endpoint.includes("/auth/refresh")) {
    return {
      access_token: `mock_token_refreshed_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      token_type: "bearer",
      role: "buyer",
      user_id: 1,
      name: "Priya Sharma",
      email: "buyer@sai.in",
    };
  }

  if (endpoint.includes("/auth/google") || endpoint.includes("/auth/apple")) {
    const provider = endpoint.includes("google") ? "Google" : "Apple";
    throw new Error(`Real ${provider} authentication requires the SAI backend server to be running. Please start the backend server.`);
  }

  if (endpoint.includes("/auth/otp/send") || endpoint.includes("/auth/send-otp")) {
    const isRegister = body?.purpose === "register";
    return {
      success: true,
      message: isRegister
        ? "Verification OTP sent successfully to your registration email address."
        : "OTP sent successfully to your registered email address.",
      cooldown_seconds: 60,
      expires_in_minutes: 5,
      dev_otp: "123456",
      email_dispatched: true,
    };
  }

  if (endpoint.includes("/auth/resend-otp") || endpoint.includes("/auth/otp/resend")) {
    return {
      success: true,
      message: "A new OTP has been sent to your email address.",
      cooldown_seconds: 60,
      expires_in_minutes: 5,
      dev_otp: "123456",
      email_dispatched: true,
    };
  }

  if (endpoint.includes("/auth/verify-otp") || endpoint.includes("/auth/otp/verify")) {
    return {
      success: true,
      message: "OTP verified successfully.",
      reset_token: `mock_reset_${Date.now()}`,
      access_token: `mock_otp_access_${Date.now()}`,
      token_type: "bearer",
      role: "buyer",
      user_id: 1,
      name: "Verified User",
      email: body?.email || "user@sai.in",
    };
  }

  if (endpoint.includes("/auth/forgot-password")) {
    return {
      message: "Password reset token sent to your email.",
      dev_reset_token: `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  if (endpoint.includes("/auth/reset-password")) {
    return { message: "Password has been reset successfully! You can now login with your new password." };
  }

  if (endpoint.includes("/auth/admin/login")) {
    if (body.email === "admin@sai.in") {
      return {
        status: "2fa_required",
        temp_token: `mock_admin_temp_${Date.now()}`,
        email: "admin@sai.in",
      };
    }
    return {
      access_token: `mock_admin_token_${Date.now()}`,
      token_type: "bearer",
      role: "super_admin",
      user_id: 5,
      name: "Super Admin",
    };
  }

  if (endpoint.includes("/auth/admin/2fa/verify")) {
    return {
      access_token: `mock_admin_2fa_${Date.now()}`,
      refresh_token: `mock_admin_refresh_${Date.now()}`,
      token_type: "bearer",
      role: "super_admin",
      user_id: 5,
      name: "Super Admin",
      email: "admin@sai.in",
    };
  }

  // ── AI CHAT ENDPOINT ──────────────────────────────────────────────
  if (endpoint.includes("/ai/chat") && method === "POST") {
    const chatResp = generateChatResponse(body.message || "", body.language || "en");
    return {
      success: true,
      conversation_id: body.conversation_id || `conv_${Date.now()}`,
      intent: chatResp.intent,
      language: chatResp.language,
      message: chatResp.message,
      properties: chatResp.properties,
      actions: [],
    };
  }

  if (endpoint.includes("/ai/compare") && method === "POST") {
    const ids = body.property_ids || [1, 2];
    const props = ids.map((id: number) => MOCK_PROPERTIES.find(p => p.id === id) || MOCK_PROPERTIES[0]);
    return {
      success: true,
      comparison: {
        summary: "Detailed comparison of selected properties based on price, location, amenities, and investment potential.",
        comparison_table: [
          { feature: "Price", ...Object.fromEntries(props.map((p: any) => [p.title, p.price_display])) },
          { feature: "Area", ...Object.fromEntries(props.map((p: any) => [p.title, `${p.area_sqft} sq ft`])) },
          { feature: "Location", ...Object.fromEntries(props.map((p: any) => [p.title, p.locality])) },
          { feature: "Rating", ...Object.fromEntries(props.map((p: any) => [p.title, `⭐ ${p.rating}`])) },
        ],
        pros_cons: Object.fromEntries(props.map((p: any) => [p.title, { pros: ["Great location", "Modern amenities", "Good connectivity"], cons: ["Higher price bracket", "Limited parking"] }])),
        recommendation_reason: "Based on price-to-value ratio and location advantages.",
        best_overall_property_id: props[0]?.id || 1,
      },
      properties: props,
      language: body.language || "en",
    };
  }

  if (endpoint.includes("/ai/recommend") && method === "POST") {
    const recs = MOCK_PROPERTIES.filter(p => {
      if (body.criteria?.bhk && p.bhk !== body.criteria.bhk) return false;
      if (body.criteria?.max_price && p.price > body.criteria.max_price) return false;
      if (body.criteria?.city && !p.city.toLowerCase().includes(body.criteria.city.toLowerCase())) return false;
      return true;
    }).slice(0, 4);
    const hasCityFilter = Boolean(body.criteria?.city);
    return {
      success: true,
      explanation: recs.length > 0
        ? "Based on your criteria, here are the best matching properties."
        : (hasCityFilter ? `No matching properties found in ${body.criteria.city}.` : "Here are some top recommended properties."),
      recommendations: recs.length > 0 ? recs : (hasCityFilter ? [] : MOCK_PROPERTIES.slice(0, 3)),
      language: body.language || "en",
    };
  }

  if (endpoint.includes("/ai/investment-predict") && method === "POST") {
    const prop = MOCK_PROPERTIES.find(p => p.id === body.property_id) || MOCK_PROPERTIES[0];
    const holdYrs = body.holding_years || 5;
    const appreciation = body.expected_annual_appreciation_pct || 8;
    return {
      success: true, property_id: prop.id, property_title: prop.title, current_price: prop.price, area_sqft: prop.area_sqft,
      metrics: {
        monthly_rent_estimate: Math.round(prop.price * 0.004), annual_rental_income: Math.round(prop.price * 0.004 * 12),
        gross_rental_yield_pct: 4.8, price_per_sqft: Math.round(prop.price / prop.area_sqft),
        projected_value_1yr: Math.round(prop.price * 1.08), projected_value_3yr: Math.round(prop.price * Math.pow(1.08, 3)),
        projected_value_5yr: Math.round(prop.price * Math.pow(1.08, 5)), projected_value_10yr: Math.round(prop.price * Math.pow(1.08, 10)),
        holding_period_years: holdYrs, projected_future_value: Math.round(prop.price * Math.pow(1 + appreciation / 100, holdYrs)),
        projected_total_return_pct: Math.round((Math.pow(1 + appreciation / 100, holdYrs) - 1) * 100),
        investment_score_out_of_10: 7.8,
      },
      assumptions: ["Based on historical Pune market data", "Assumes consistent appreciation rate", "Does not account for inflation"],
      disclaimer: "This is an AI-powered estimate for informational purposes only.",
      language: body.language || "en",
    };
  }

  if (endpoint.includes("/ai/languages")) {
    return {
      count: 8,
      languages: [
        { code: "en", name: "English", native_name: "English" },
        { code: "hi", name: "Hindi", native_name: "हिन्दी" },
        { code: "mr", name: "Marathi", native_name: "मराठी" },
        { code: "gu", name: "Gujarati", native_name: "ગુજરાતી" },
        { code: "ta", name: "Tamil", native_name: "தமிழ்" },
        { code: "te", name: "Telugu", native_name: "తెలుగు" },
        { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ" },
        { code: "bn", name: "Bengali", native_name: "বাংলা" },
      ],
    };
  }

  // ── PROPERTIES ENDPOINTS ──────────────────────────────────────────
  if (endpoint.match(/\/properties\/(\d+)\/documents/) && method === "GET") {
    const propId = parseInt(endpoint.match(/\/properties\/(\d+)\/documents/)?.[1] || "1");
    return generateMockPropertyDocuments(propId);
  }

  if (endpoint.match(/\/properties\/(\d+)\/documents/) && method === "POST") {
    const propId = parseInt(endpoint.match(/\/properties\/(\d+)\/documents/)?.[1] || "1");
    return {
      success: true,
      message: "Document uploaded successfully and queued for SAI verification.",
      document: {
        id: Date.now(),
        property_id: propId,
        document_type: "other",
        document_name: "Uploaded Property Document",
        file_name: "uploaded_verification_document.pdf",
        mime_type: "application/pdf",
        file_size: 1048576,
        file_size_formatted: "1.0 MB",
        status: "UNDER_REVIEW",
        version: 1,
        uploaded_at: new Date().toISOString(),
        view_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&fit=crop",
      },
    };
  }

  if (endpoint.match(/\/property-documents\/(\d+)/) && method === "GET") {
    const docId = parseInt(endpoint.match(/\/property-documents\/(\d+)/)?.[1] || "1");
    return {
      id: docId,
      property_id: 1,
      document_type: "title_deed",
      document_name: "Registered Sale Deed & Title Report",
      file_name: "sale_deed_document.pdf",
      mime_type: "application/pdf",
      file_size: 2450000,
      file_size_formatted: "2.4 MB",
      status: "VERIFIED",
      version: 1,
      uploaded_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      verified_by: "Adv. Ramesh Joshi (SAI Legal Team)",
      rera_number: "MAHARERA/P52100024891",
      view_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&fit=crop",
    };
  }

  if (endpoint.includes("/verification/my-documents")) {
    return [
      {
        id: 101,
        user_id: 1,
        property_id: 1,
        property_title: "Prestige Heights",
        account_type: "seller",
        document_type: "title_deed",
        file_name: "prestige_sale_deed.pdf",
        mime_type: "application/pdf",
        file_size: 2450000,
        version: 1,
        status: "VERIFIED",
        uploaded_at: "2026-02-15T10:00:00Z",
        verified_at: "2026-02-16T14:30:00Z",
        verified_by: 5,
      },
      {
        id: 102,
        user_id: 1,
        property_id: 1,
        property_title: "Prestige Heights",
        account_type: "seller",
        document_type: "rera_certificate",
        file_name: "rera_certificate.pdf",
        mime_type: "application/pdf",
        file_size: 1820000,
        version: 1,
        status: "VERIFIED",
        uploaded_at: "2026-02-15T10:15:00Z",
        verified_at: "2026-02-16T14:35:00Z",
        verified_by: 5,
      }
    ];
  }

  if (endpoint.includes("/verification/upload") && method === "POST") {
    return {
      success: true,
      document: {
        id: Date.now(),
        user_id: 1,
        account_type: "seller",
        document_type: "identity_proof",
        file_name: "identity_document.pdf",
        mime_type: "application/pdf",
        file_size: 1540000,
        version: 1,
        status: "UNDER_REVIEW",
        uploaded_at: new Date().toISOString(),
      }
    };
  }

  if (endpoint.includes("/admin/verification/stats")) {
    return {
      total_documents: 24,
      pending_review: 3,
      under_review: 5,
      verified: 14,
      rejected: 2,
      resubmission_required: 0,
    };
  }

  if (endpoint.includes("/admin/verification") && (endpoint.includes("/approve") || endpoint.includes("/reject") || endpoint.includes("/resubmission"))) {
    return { success: true, message: "Verification status updated successfully." };
  }

  if (endpoint.includes("/admin/verification") && method === "GET") {
    return [
      {
        id: 101,
        user_id: 2,
        user_name: "Rahul Sharma",
        user_email: "owner@sai.in",
        property_id: 1,
        property_title: "Prestige Heights",
        account_type: "seller",
        document_type: "title_deed",
        file_name: "prestige_sale_deed.pdf",
        mime_type: "application/pdf",
        file_size: 2450000,
        version: 1,
        status: "VERIFIED",
        uploaded_at: "2026-02-15T10:00:00Z",
      },
      {
        id: 102,
        user_id: 2,
        user_name: "Rahul Sharma",
        user_email: "owner@sai.in",
        property_id: 1,
        property_title: "Prestige Heights",
        account_type: "seller",
        document_type: "rera_certificate",
        file_name: "rera_certificate.pdf",
        mime_type: "application/pdf",
        file_size: 1820000,
        version: 1,
        status: "VERIFIED",
        uploaded_at: "2026-02-15T10:15:00Z",
      }
    ];
  }

  if (endpoint.match(/\/properties\/my/)) {
    return getLocalState("my_properties", []);
  }

  if (endpoint.match(/\/properties\/\d+$/) && method === "GET") {
    const id = parseInt(endpoint.match(/\/properties\/(\d+)/)?.[1] || "1");
    return MOCK_PROPERTIES.find(p => p.id === id) || MOCK_PROPERTIES[0];
  }

  if (endpoint.match(/\/properties\/\d+$/) && method === "DELETE") {
    const id = parseInt(endpoint.match(/\/properties\/(\d+)/)?.[1] || "0");
    const myProps = getLocalState("my_properties", []);
    setLocalState("my_properties", myProps.filter((p: any) => p.id !== id));
    return null;
  }

  if (endpoint.includes("/properties") && method === "POST") {
    const newProp = {
      id: Date.now(),
      title: body.title || "New Property",
      description: body.description || "",
      property_type: body.property_type || "Apartment",
      listing_type: body.listing_type || "sale",
      bhk: body.bhk || 2,
      area_sqft: body.area_sqft || 1200,
      price: body.price || 7500000,
      price_display: body.price ? (body.price >= 10000000 ? `₹${(body.price / 10000000).toFixed(1)}Cr` : `₹${Math.round(body.price / 100000)}L`) : "₹75L",
      amenities: body.amenities || ["Parking", "Lift", "Security"],
      locality: body.locality || "Baner",
      city: body.city || "Pune",
      status: body.status || "available",
      is_verified: false,
      is_rera: false,
      badge: "New",
      match_score: 85,
      rating: 4.5,
      image_url: body.image_url || PROPERTY_IMGS[0],
      images_urls: body.images_urls || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: (body.images_urls || [body.image_url || PROPERTY_IMGS[0]]).map((url: string, i: number) => ({ id: Date.now() + i, media_type: "image", url, sort_order: i })),
    };
    const myProps = getLocalState("my_properties", []);
    myProps.unshift(newProp);
    setLocalState("my_properties", myProps);
    return newProp;
  }

  if (endpoint.includes("/properties/cities") && method === "GET") {
    const cities = Array.from(new Set(MOCK_PROPERTIES.map(p => p.city).filter(Boolean))).sort();
    return cities;
  }

  if (endpoint.includes("/properties/localities") && method === "GET") {
    const queryStr = endpoint.includes("?") ? endpoint.split("?")[1] : "";
    const params = new URLSearchParams(queryStr);
    const cityP = params.get("city")?.toLowerCase();
    let props = MOCK_PROPERTIES;
    if (cityP) props = props.filter(p => p.city.toLowerCase().includes(cityP));
    const locs = Array.from(new Set(props.map(p => p.locality).filter(Boolean))).sort();
    return locs;
  }

  // ── WALKTHROUGH ENDPOINTS ─────────────────────────────────────────
  const walkthroughMatch = endpoint.match(/\/properties\/(\d+)\/walkthrough/);
  if (walkthroughMatch) {
    const propId = parseInt(walkthroughMatch[1]);
    const prop = MOCK_PROPERTIES.find(p => p.id === propId) || MOCK_PROPERTIES[0];
    const scenes: any[] = [
      {
        id: "exterior",
        title: "Exterior",
        duration: 4,
        image_url: prop.media?.[0]?.url || PROPERTY_IMGS[0],
        category: "exterior",
        animation: "ken-burns",
        subtitle: "Discover Your New Home",
        data: {
          property_type: prop.property_type || "Apartment",
          city: prop.city || "Amravati",
          locality: prop.locality || "City Center",
          location: `${prop.locality || "City Center"}, ${prop.city || "Amravati"}`,
          bhk: prop.bhk || 2,
          bhk_display: `${prop.bhk || 2} BHK`,
          price: prop.price_display || `₹${((prop.price || 6000000) / 100000).toFixed(0)} Lakh`,
          area: `${prop.area_sqft || 1200} sq.ft`,
          is_verified: prop.is_verified ?? true,
          is_rera: prop.is_rera ?? true,
        }
      }
    ];

    if (prop.bhk && prop.bhk > 0) {
      scenes.push({
        id: "bedroom",
        title: "Bedrooms",
        duration: 4,
        image_url: prop.media?.[1]?.url || PROPERTY_IMGS[1],
        category: "bedroom",
        animation: "ken-burns",
        data: { count: prop.bhk, label: `${prop.bhk} Bedrooms` }
      });
    }

    if (prop.amenities && prop.amenities.length > 0) {
      scenes.push({
        id: "amenities",
        title: "Amenities & Facilities",
        duration: 4,
        image_url: prop.media?.[2]?.url || null,
        category: "amenity",
        animation: "fade-slide",
        data: { amenities: prop.amenities, has_parking: prop.amenities.some((a: string) => a.toLowerCase().includes("parking")) }
      });
    }

    scenes.push({
      id: "location",
      title: "Location & Neighborhood",
      duration: 4,
      image_url: null,
      category: "location",
      animation: "fade-slide",
      data: {
        city: prop.city,
        locality: prop.locality,
        address: prop.address || `${prop.locality}, ${prop.city}`,
        latitude: prop.latitude,
        longitude: prop.longitude,
        dist_metro: prop.dist_metro,
      }
    });

    scenes.push({
      id: "summary",
      title: "Summary & Next Steps",
      duration: 5,
      image_url: prop.media?.[0]?.url || PROPERTY_IMGS[0],
      category: "summary",
      animation: "fade-slide",
      data: {
        property_id: prop.id,
        title: prop.title,
        price: prop.price_display || `₹${((prop.price || 6000000) / 100000).toFixed(0)} Lakh`,
        area: `${prop.area_sqft || 1200} sq.ft`,
        bhk: prop.bhk,
        location: `${prop.locality}, ${prop.city}`,
      }
    });

    return {
      property_id: prop.id,
      title: prop.title,
      duration: scenes.reduce((acc, s) => acc + s.duration, 0),
      theme: "premium-real-estate",
      transition: "cinematic",
      scenes
    };
  }

  // ── 3D TOUR ENDPOINT ──────────────────────────────────────────────
  const tour3DMatch = endpoint.match(/\/properties\/(\d+)\/3d-tour/);
  if (tour3DMatch) {
    const propId = parseInt(tour3DMatch[1]);
    const prop = MOCK_PROPERTIES.find(p => p.id === propId) || MOCK_PROPERTIES[0];
    const bhk = Math.max(1, Math.min(prop.bhk || 2, 4));
    const isVilla = ["villa", "house", "bungalow"].includes((prop.property_type || "").toLowerCase());
    const ceilingH = 2.85;

    // Build BHK-specific rooms and camera path
    const rooms: any[] = [];
    const doors: any[] = [];
    const camera_path: any[] = [];

    // Exterior camera start
    camera_path.push({
      id: "c1",
      step_name: "Property Front View",
      room_id: "exterior",
      position: [0.0, isVilla ? 5.5 : 7.0, isVilla ? 18.0 : 22.0],
      look_at: [0.0, 3.5, 0.0],
      duration: 4.0,
      action: "none",
      label: "PROPERTY FRONT VIEW"
    });
    camera_path.push({
      id: "c2",
      step_name: "Approach Entrance",
      room_id: "entrance",
      position: [0.0, 1.7, 4.5],
      look_at: [0.0, 1.6, 0.0],
      duration: 3.0,
      action: "none",
      label: "ENTRANCE"
    });
    camera_path.push({
      id: "c3",
      step_name: "Main Door Opens",
      room_id: "entrance",
      position: [0.0, 1.7, 1.8],
      look_at: [0.0, 1.6, -1.0],
      duration: 2.5,
      action: "door_open",
      label: "ENTRANCE"
    });

    // 1. Entrance & Foyer
    rooms.push({
      id: "entrance",
      name: bhk >= 3 ? "Entrance Foyer" : "Entrance",
      type: "entrance",
      order: 1,
      position: { x: 0.0, y: 0.0, z: 1.8 },
      dimensions: { width: 3.0, length: 3.2, height: ceilingH },
      floor_material: "polished_marble",
      wall_color: "#F5F2EB",
      camera_focus: { position: [0.0, 1.7, 3.5], look_at: [0.0, 1.6, -1.0] },
      label: "ENTRANCE",
      subtitle: "Secure entry doorway with video intercom",
      has_actual_image: Boolean(prop.media?.[0]?.url),
      image_url: prop.media?.[0]?.url || null
    });
    doors.push({
      id: "main_door",
      name: "Main Entrance Door",
      is_main_entrance: true,
      position: [0.0, 0.0, 0.0],
      rotation_y: 0.0,
      width: 1.15,
      height: 2.25
    });

    // 2. Living Room
    rooms.push({
      id: "living_room",
      name: bhk === 4 ? "Grand Living Room" : "Hall / Living Room",
      type: "living_room",
      order: 2,
      position: { x: -0.5, y: 0.0, z: -2.8 },
      dimensions: { width: bhk >= 3 ? 6.4 : 5.4, length: 5.5, height: ceilingH },
      floor_material: "hardwood",
      wall_color: "#ECE8E0",
      camera_focus: { position: [0.0, 1.7, -0.8], look_at: [-1.8, 1.5, -4.0] },
      label: "LIVING ROOM",
      subtitle: "Bright expansive living space with decorative accent wall",
      has_actual_image: Boolean(prop.media?.[1]?.url),
      image_url: prop.media?.[1]?.url || null,
      furniture: [
        { type: "sofa_sectional", position: [-1.8, 0.0, -3.8], rotation_y: 0.0 },
        { type: "coffee_table", position: [-1.8, 0.0, -2.4], rotation_y: 0.0 },
        { type: "tv_wall_unit", position: [2.2, 0.0, -2.8], rotation_y: -1.57 }
      ]
    });
    camera_path.push({
      id: "c4",
      step_name: "Enter Living Room",
      room_id: "living_room",
      position: [0.0, 1.7, -1.2],
      look_at: [-1.6, 1.5, -3.8],
      duration: 3.5,
      action: "none",
      label: "LIVING ROOM"
    });

    // Dining (for 3 & 4 BHK)
    if (bhk >= 3) {
      rooms.push({
        id: "dining",
        name: "Dining Area",
        type: "dining",
        order: 3,
        position: { x: 3.8, y: 0.0, z: -2.4 },
        dimensions: { width: 3.8, length: 4.8, height: ceilingH },
        floor_material: "polished_marble",
        wall_color: "#ECE8E0",
        camera_focus: { position: [2.6, 1.7, -1.5], look_at: [4.2, 1.4, -3.2] },
        label: "DINING AREA",
        subtitle: `${bhk >= 4 ? 8 : 6}-seater designer dining space`,
        has_actual_image: false,
        image_url: null
      });
      camera_path.push({
        id: "c_dining",
        step_name: "Dining Area",
        room_id: "dining",
        position: [2.8, 1.7, -1.8],
        look_at: [4.2, 1.4, -3.2],
        duration: 3.0,
        action: "none",
        label: "DINING AREA"
      });
    }

    // 3. Kitchen
    rooms.push({
      id: "kitchen",
      name: bhk >= 3 ? "Modular Kitchen" : "Kitchen",
      type: "kitchen",
      order: rooms.length + 1,
      position: { x: 4.4, y: 0.0, z: -2.6 },
      dimensions: { width: 3.6, length: 4.6, height: ceilingH },
      floor_material: "granite_tile",
      wall_color: "#FFFFFF",
      camera_focus: { position: [3.4, 1.7, -2.0], look_at: [5.2, 1.4, -3.4] },
      label: "KITCHEN",
      subtitle: "Modular kitchen with chimney, quartz counter & cabinets",
      has_actual_image: Boolean(prop.media?.[2]?.url),
      image_url: prop.media?.[2]?.url || null,
      furniture: [
        { type: "kitchen_counter_l", position: [4.4, 0.0, -3.4], rotation_y: 0.0 },
        { type: "refrigerator", position: [5.6, 0.0, -1.0], rotation_y: 3.14 }
      ]
    });
    camera_path.push({
      id: "c_kitchen",
      step_name: "Modular Kitchen",
      room_id: "kitchen",
      position: [3.6, 1.7, -2.2],
      look_at: [5.2, 1.4, -3.5],
      duration: 3.5,
      action: "none",
      label: "KITCHEN"
    });

    // 4. Master Bedroom
    rooms.push({
      id: "master_bedroom",
      name: bhk >= 3 ? "Master Suite" : "Master Bedroom",
      type: "bedroom",
      order: rooms.length + 1,
      position: { x: -2.6, y: 0.0, z: -8.0 },
      dimensions: { width: 5.0, length: 5.4, height: ceilingH },
      floor_material: "teak_wood",
      wall_color: "#E6E2D8",
      camera_focus: { position: [-2.6, 1.7, -6.0], look_at: [-2.6, 1.4, -9.5] },
      label: "MASTER BEDROOM",
      subtitle: "King-size master bedroom with wooden flooring and ensuite access",
      has_actual_image: Boolean(prop.media?.[3]?.url),
      image_url: prop.media?.[3]?.url || null,
      furniture: [
        { type: "king_bed", position: [-2.6, 0.0, -9.5], rotation_y: 3.14 },
        { type: "nightstand_left", position: [-4.2, 0.0, -9.6], rotation_y: 0.0 },
        { type: "nightstand_right", position: [-1.0, 0.0, -9.6], rotation_y: 0.0 }
      ]
    });
    camera_path.push({
      id: "c_master",
      step_name: "Master Bedroom",
      room_id: "master_bedroom",
      position: [-2.2, 1.7, -6.8],
      look_at: [-2.6, 1.4, -9.5],
      duration: 3.5,
      action: "pan_180",
      label: "MASTER BEDROOM"
    });

    // Bedroom 2 (for 2, 3, 4 BHK)
    if (bhk >= 2) {
      rooms.push({
        id: "bedroom_2",
        name: "Child Bedroom / Bedroom 2",
        type: "bedroom",
        order: rooms.length + 1,
        position: { x: 2.2, y: 0.0, z: -8.0 },
        dimensions: { width: 4.4, length: 5.0, height: ceilingH },
        floor_material: "light_oak_wood",
        wall_color: "#EAE7DF",
        camera_focus: { position: [2.2, 1.7, -6.0], look_at: [2.2, 1.4, -9.2] },
        label: "BEDROOM 2",
        subtitle: "Spacious bedroom with study desk and large wardrobe",
        has_actual_image: false,
        image_url: null,
        furniture: [
          { type: "queen_bed", position: [2.2, 0.0, -9.2], rotation_y: 3.14 },
          { type: "study_desk", position: [3.8, 0.0, -7.0], rotation_y: -1.57 }
        ]
      });
      camera_path.push({
        id: "c_bed2",
        step_name: "Bedroom 2",
        room_id: "bedroom_2",
        position: [2.0, 1.7, -6.8],
        look_at: [2.2, 1.4, -9.2],
        duration: 3.0,
        action: "none",
        label: "BEDROOM 2"
      });
    }

    // Bedroom 3 (for 3, 4 BHK)
    if (bhk >= 3) {
      rooms.push({
        id: "bedroom_3",
        name: "Bedroom 3 / Guest Bedroom",
        type: "bedroom",
        order: rooms.length + 1,
        position: { x: 5.0, y: 0.0, z: -13.0 },
        dimensions: { width: 4.4, length: 5.0, height: ceilingH },
        floor_material: "laminate_wood",
        wall_color: "#E8E5DC",
        camera_focus: { position: [4.0, 1.7, -11.5], look_at: [5.2, 1.4, -14.2] },
        label: "BEDROOM 3",
        subtitle: "Comfortable guest bedroom with natural ambient lighting",
        has_actual_image: false,
        image_url: null,
        furniture: [
          { type: "queen_bed", position: [5.0, 0.0, -14.2], rotation_y: 3.14 }
        ]
      });
      camera_path.push({
        id: "c_bed3",
        step_name: "Bedroom 3",
        room_id: "bedroom_3",
        position: [4.2, 1.7, -12.0],
        look_at: [5.2, 1.4, -14.2],
        duration: 3.0,
        action: "none",
        label: "BEDROOM 3"
      });
    }

    // Bedroom 4 (for 4 BHK)
    if (bhk >= 4) {
      rooms.push({
        id: "bedroom_4",
        name: "Bedroom 4 (Study / Guest)",
        type: "bedroom",
        order: rooms.length + 1,
        position: { x: -3.5, y: 0.0, z: -15.5 },
        dimensions: { width: 4.6, length: 5.0, height: ceilingH },
        floor_material: "oak_wood",
        wall_color: "#E7E4DB",
        camera_focus: { position: [-2.2, 1.7, -14.0], look_at: [-3.8, 1.4, -16.8] },
        label: "GUEST BEDROOM",
        subtitle: "Private fourth bedroom or executive home study",
        has_actual_image: false,
        image_url: null,
        furniture: [
          { type: "queen_bed", position: [-3.5, 0.0, -16.8], rotation_y: 3.14 }
        ]
      });
      camera_path.push({
        id: "c_bed4",
        step_name: "Bedroom 4",
        room_id: "bedroom_4",
        position: [-2.5, 1.7, -14.5],
        look_at: [-3.8, 1.4, -16.8],
        duration: 3.0,
        action: "none",
        label: "GUEST BEDROOM"
      });
    }

    // Bathrooms
    rooms.push({
      id: "bathroom_1",
      name: bhk >= 2 ? "Master Attached Bathroom" : "Bathroom",
      type: "bathroom",
      order: rooms.length + 1,
      position: { x: -4.8, y: 0.0, z: -11.4 },
      dimensions: { width: 2.6, length: 3.0, height: ceilingH },
      floor_material: "anti_skid_tiles",
      wall_color: "#DCE1E5",
      camera_focus: { position: [-3.8, 1.7, -10.4], look_at: [-5.0, 1.4, -11.8] },
      label: "BATHROOM 1",
      subtitle: "Modern bathroom with glass partition and rain shower",
      has_actual_image: false,
      image_url: null,
      furniture: [
        { type: "vanity_mirror", position: [-4.8, 0.0, -12.4], rotation_y: 0.0 },
        { type: "toilet_commode", position: [-3.8, 0.0, -12.2], rotation_y: 0.0 }
      ]
    });
    camera_path.push({
      id: "c_bath1",
      step_name: "Bathroom 1",
      room_id: "bathroom_1",
      position: [-3.8, 1.7, -10.8],
      look_at: [-4.8, 1.4, -11.6],
      duration: 2.5,
      action: "none",
      label: "BATHROOM 1"
    });

    if (bhk >= 2) {
      rooms.push({
        id: "bathroom_2",
        name: "Common Bathroom",
        type: "bathroom",
        order: rooms.length + 1,
        position: { x: 5.0, y: 0.0, z: -6.6 },
        dimensions: { width: 2.4, length: 2.8, height: ceilingH },
        floor_material: "anti_skid_tiles",
        wall_color: "#DCE1E5",
        camera_focus: { position: [4.0, 1.7, -6.6], look_at: [5.6, 1.4, -7.2] },
        label: "BATHROOM 2",
        subtitle: "Common washroom with vanity and premium fixtures",
        has_actual_image: false,
        image_url: null
      });
      camera_path.push({
        id: "c_bath2",
        step_name: "Bathroom 2",
        room_id: "bathroom_2",
        position: [4.2, 1.7, -6.6],
        look_at: [5.4, 1.4, -7.2],
        duration: 2.5,
        action: "none",
        label: "BATHROOM 2"
      });
    }

    // Balcony
    rooms.push({
      id: "balcony",
      name: bhk === 4 ? "Balcony / Terrace" : "Balcony",
      type: "balcony",
      order: rooms.length + 1,
      position: { x: 0.0, y: 0.0, z: -12.4 },
      dimensions: { width: 5.4, length: 2.6, height: ceilingH },
      floor_material: "deck_wood",
      wall_color: "#D2CCC0",
      camera_focus: { position: [0.0, 1.7, -11.5], look_at: [0.0, 1.6, -17.5] },
      label: "BALCONY VIEW",
      subtitle: `Open balcony looking out towards ${prop.city || "the city"} horizon`,
      has_actual_image: Boolean(prop.media?.[4]?.url),
      image_url: prop.media?.[4]?.url || null,
      furniture: [
        { type: "balcony_railing", position: [0.0, 0.0, -13.6], rotation_y: 0.0 },
        { type: "coffee_table", position: [0.0, 0.0, -12.4], rotation_y: 0.0 }
      ]
    });
    doors.push({
      id: "door_balcony",
      name: "Balcony Glass Slider",
      is_balcony: true,
      position: [0.0, 0.0, -10.8],
      rotation_y: 0.0,
      width: 2.2,
      height: 2.35
    });

    // Balcony camera steps
    camera_path.push({
      id: "c_balc_open",
      step_name: "Approach Balcony",
      room_id: "balcony",
      position: [0.0, 1.7, -10.2],
      look_at: [0.0, 1.6, -14.0],
      duration: 2.0,
      action: "balcony_open",
      label: "BALCONY VIEW"
    });
    camera_path.push({
      id: "c_balc_walk",
      step_name: "Walk onto Balcony",
      room_id: "balcony",
      position: [0.0, 1.7, -12.0],
      look_at: [0.0, 1.6, -20.0],
      duration: 3.5,
      action: "exterior_view",
      label: "BALCONY VIEW"
    });
    camera_path.push({
      id: "c_balc_pan",
      step_name: "Balcony Outside Pan",
      room_id: "balcony",
      position: [0.0, 1.7, -12.2],
      look_at: [-5.0, 1.8, -20.0],
      duration: 3.0,
      action: "exterior_view",
      label: "BALCONY OUTSIDE VIEW"
    });
    camera_path.push({
      id: "c_pullback",
      step_name: "Return to Front View",
      room_id: "exterior",
      position: [0.0, isVilla ? 6.5 : 8.0, isVilla ? 20.0 : 25.0],
      look_at: [0.0, 4.0, 0.0],
      duration: 4.0,
      action: "none",
      label: "PROPERTY FRONT VIEW"
    });
    camera_path.push({
      id: "c_complete",
      step_name: "Tour Complete",
      room_id: "exterior",
      position: [0.0, isVilla ? 6.5 : 8.0, isVilla ? 20.0 : 25.0],
      look_at: [0.0, 4.0, 0.0],
      duration: 2.0,
      action: "complete",
      label: "TOUR COMPLETE"
    });

    return {
      property_id: prop.id,
      title: prop.title,
      bhk: bhk,
      bedrooms: bhk,
      bathrooms: (prop as any).bathrooms || (bhk === 1 ? 1 : 2),
      balconies: 1,
      property_type: prop.property_type || "apartment",
      city: prop.city || "Pune",
      locality: prop.locality || "Prime Area",
      address: prop.address || `${prop.locality || ""}, ${prop.city || ""}`,
      area_sqft: prop.area_sqft || 1200,
      price_display: prop.price_display || `₹${((prop.price || 6000000) / 100000).toFixed(0)} Lakh`,
      is_verified_floorplan: false,
      floor_plan_url: null,
      scene: {
        units: "meters",
        ceiling_height: ceilingH,
        wall_thickness: 0.15
      },
      building: {
        building_type: isVilla ? "villa" : "apartment",
        total_floors: isVilla ? 2 : (bhk >= 3 ? 14 : 10),
        selected_floor: isVilla ? 1 : (bhk === 2 ? 4 : 7),
        facade_style: "modern_contemporary",
        primary_color: isVilla ? "#F0ECE1" : "#E5E2DC",
        accent_color: isVilla ? "#3A352F" : "#2C4A52",
        glass_tint: "#8FA8B2",
        has_balconies: true,
        city: prop.city || "Pune",
        locality: prop.locality || "City Center"
      },
      rooms,
      doors,
      camera_path,
      exterior: {
        weather: "clear_daylight",
        sun_azimuth: 45,
        sun_altitude: 60
      },
      media: (prop.media || []).map((m: any) => ({
        category: m.category || "exterior",
        urls: [m.url]
      }))
    };
  }

  // ── PROPERTIES COMPARE ENDPOINT ──────────────────────────────────
  if ((endpoint.includes("/properties/compare") || endpoint === "/compare") && method === "POST") {
    const rawIds = (body.property_ids || [1, 2]).map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    const ids = rawIds.length >= 2 ? rawIds.slice(0, 4) : [1, 2];
    
    // Resolve properties from MOCK_PROPERTIES
    let resolved = ids.map((id: number) => MOCK_PROPERTIES.find(p => p.id === id)).filter(Boolean);
    if (resolved.length < 2) {
      resolved = MOCK_PROPERTIES.slice(0, 2);
    }

    const formatInrVal = (amt: number): string => {
      if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
      if (amt >= 100000) return `₹${(amt / 100000).toFixed(1).replace(/\.0$/, "")}L`;
      return `₹${amt.toLocaleString("en-IN")}`;
    };

    // Normalize properties
    const norm_props = resolved.map((p, idx) => {
      const price = Number(p.price) || 0;
      const area = Number(p.area_sqft) || 0;
      const pricePerSqft = (price > 0 && area > 0) ? Math.round(price / area) : null;
      const amList: string[] = Array.isArray(p.amenities)
        ? p.amenities
        : (typeof p.amenities === "string" ? p.amenities.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      const hasParking = amList.some(a => a.toLowerCase().includes("park")) || (p.has_parking ?? true);
      const isUnderConstruction = (p.status || "").toLowerCase().includes("construction");
      const possessionStatus = isUnderConstruction ? "Under Construction" : "Ready to Move";
      const possessionDate = isUnderConstruction ? "Dec 2026" : "Immediate";
      const isVerified = p.is_verified ?? true;
      const isRera = p.is_rera ?? true;
      const img = (p.media && p.media.length > 0 && p.media[0].url) || p.image_url || PROPERTY_IMGS[idx % PROPERTY_IMGS.length];

      return {
        id: p.id,
        title: p.title,
        property_type: (p.property_type || "Apartment"),
        listing_type: (p.listing_type || "sale"),
        status: (p.status || "Ready to Move"),
        bhk: p.bhk,
        bhk_display: p.bhk ? `${p.bhk} BHK` : "—",
        price: price,
        price_display: p.price_display || formatInrVal(price),
        area_sqft: area,
        area_display: area > 0 ? `${area.toLocaleString()} sq.ft` : "—",
        price_per_sqft: pricePerSqft,
        price_per_sqft_display: pricePerSqft ? `₹${pricePerSqft.toLocaleString("en-IN")}/sq.ft` : "— Not Available",
        locality: p.locality || "Baner",
        city: p.city || "Pune",
        state: "Maharashtra",
        country: "India",
        address: p.address || `${p.locality}, ${p.city}`,
        pincode: "411045",
        furnishing: p.furnishing || "Semi-Furnished",
        amenities: amList,
        dist_metro: p.dist_metro || "1.0 km Metro",
        is_verified: isVerified,
        verification_status: isVerified ? "SAI Verified" : "Pending Review",
        is_rera: isRera,
        rera_status: isRera ? "MahaRERA Registered" : "Pending",
        rating: p.rating || 4.7,
        image_url: img,
        media: p.media || [{ id: 1, media_type: "image", url: img, sort_order: 0 }],
        possession_status: possessionStatus,
        possession_date: possessionDate,
        has_parking: hasParking,
        parking_display: hasParking ? "Dedicated Parking ✓" : "No Parking listed",
        rental_yield_estimate: "4.3% gross",
        monthly_rent_estimate: `${formatInrVal(Math.round(price * 0.0035))}/mo`,
        five_year_appreciation: "+42%",
        investment_score: p.match_score ? (p.match_score / 10).toFixed(1) : "8.7",
      };
    });

    const cheapest = norm_props.reduce((min, cur) => cur.price < min.price ? cur : min, norm_props[0]);
    const priciest = norm_props.reduce((max, cur) => cur.price > max.price ? cur : max, norm_props[0]);
    const largest = norm_props.reduce((max, cur) => cur.area_sqft > max.area_sqft ? cur : max, norm_props[0]);
    const smallest = norm_props.reduce((min, cur) => cur.area_sqft < min.area_sqft ? cur : min, norm_props[0]);
    const priceDiff = Math.abs(priciest.price - cheapest.price);
    const areaDiff = Math.abs(largest.area_sqft - smallest.area_sqft);

    // Key differences
    const differences: string[] = [];
    const cities = Array.from(new Set(norm_props.map(p => p.city)));
    if (cities.length > 1) {
      differences.push(`Location Difference: Comparing across different cities (${cities.join(" vs ")}).`);
    }
    const localities = Array.from(new Set(norm_props.map(p => `${p.locality} (${p.city})`)));
    if (cities.length === 1 && localities.length > 1) {
      differences.push(`Locality: Located in different micro-markets (${localities.join(" vs ")}).`);
    }
    if (priceDiff > 0) {
      differences.push(`${cheapest.title} has the lower acquisition cost (${cheapest.price_display} vs ${priciest.price_display}, saving ${formatInrVal(priceDiff)}).`);
    }
    if (areaDiff > 0) {
      differences.push(`${largest.title} provides larger living space (${largest.area_display} vs ${smallest.area_display}, +${areaDiff.toLocaleString()} sq.ft).`);
    }
    const sqftProps = norm_props.filter(p => p.price_per_sqft);
    if (sqftProps.length >= 2) {
      const lowestSq = sqftProps.reduce((min, c) => c.price_per_sqft! < min.price_per_sqft! ? c : min, sqftProps[0]);
      const highestSq = sqftProps.reduce((max, c) => c.price_per_sqft! > max.price_per_sqft! ? c : max, sqftProps[0]);
      if (lowestSq.id !== highestSq.id) {
        const sqGap = highestSq.price_per_sqft! - lowestSq.price_per_sqft!;
        differences.push(`${lowestSq.title} has a more economical rate per sq.ft (${lowestSq.price_per_sqft_display} vs ${highestSq.price_per_sqft_display}, saving ₹${sqGap.toLocaleString("en-IN")}/sq.ft).`);
      }
    }
    const parkingHas = norm_props.filter(p => p.has_parking).map(p => p.title);
    const parkingNo = norm_props.filter(p => !p.has_parking).map(p => p.title);
    if (parkingHas.length > 0 && parkingNo.length > 0) {
      differences.push(`Parking: ${parkingHas.join(", ")} includes dedicated parking; ${parkingNo.join(", ")} does not list parking.`);
    } else if (parkingHas.length === norm_props.length) {
      differences.push("All compared properties provide designated parking.");
    }

    // Amenities
    const allAmenitySets = norm_props.map(p => new Set(p.amenities));
    const commonAmenities = norm_props[0].amenities.filter((a: string) => allAmenitySets.every(s => s.has(a)));
    const uniqueAmenities: Record<string, string[]> = {};
    norm_props.forEach(p => {
      const others = norm_props.filter(op => op.id !== p.id);
      const otherAmenities = new Set(others.flatMap(op => op.amenities));
      uniqueAmenities[p.id] = p.amenities.filter((a: string) => !otherAmenities.has(a));
    });
    const standardAmenities = ["Gym", "Pool", "Parking", "Security", "Clubhouse", "Power Backup", "Garden", "Lift", "EV Charging", "Jogging Track"];
    const checklist = standardAmenities.map(am => {
      const row: Record<string, any> = { amenity: am };
      norm_props.forEach(p => {
        row[p.id] = p.amenities.some((a: string) => a.toLowerCase().includes(am.toLowerCase()));
      });
      return row;
    });

    // Advantages & Considerations
    const advantages: Record<string, string[]> = {};
    const considerations: Record<string, string[]> = {};
    norm_props.forEach(p => {
      const adv: string[] = [];
      const cons: string[] = [];
      if (p.id === cheapest.id && priceDiff > 0) adv.push(`Lowest listed acquisition price (${p.price_display})`);
      if (p.id === priciest.id && priceDiff > 0) cons.push(`Higher capital outlay (${p.price_display})`);
      if (p.id === largest.id && areaDiff > 0) adv.push(`Maximum floor space (${p.area_display})`);
      if (p.id === smallest.id && areaDiff > 0) cons.push(`More compact footprint (${p.area_display})`);
      if (p.has_parking) adv.push("Dedicated parking facility available");
      else cons.push("No parking listed in database records");
      if (p.possession_status === "Ready to Move") adv.push("Ready to move (Immediate possession)");
      else cons.push("Under construction / future possession");
      if (p.is_verified) adv.push("SAI Verified (Ownership & document audit passed)");
      if (p.is_rera) adv.push("RERA registered & compliant");
      if (p.dist_metro) adv.push(`Transit accessibility (${p.dist_metro})`);
      if (p.amenities.length >= 4) adv.push(`Well-equipped with ${p.amenities.length} amenities`);
      advantages[p.id] = adv;
      considerations[p.id] = cons;
    });

    // Requirement matrix
    const reqs = body.user_requirements || {};
    const requirement_matrix: any[] = [];
    if (reqs.budget_max) {
      const bRow: any = { criterion: `Budget ≤ ${formatInrVal(reqs.budget_max)}`, results: {} };
      norm_props.forEach(p => {
        const matched = p.price <= reqs.budget_max;
        bRow.results[p.id] = {
          matched,
          text: matched ? `${p.price_display} (within budget)` : `${p.price_display} (exceeds budget)`
        };
      });
      requirement_matrix.push(bRow);
    }
    if (reqs.bhk) {
      const bhkRow: any = { criterion: `${reqs.bhk} BHK Configuration`, results: {} };
      norm_props.forEach(p => {
        const matched = p.bhk === reqs.bhk;
        bhkRow.results[p.id] = {
          matched,
          text: p.bhk_display
        };
      });
      requirement_matrix.push(bhkRow);
    }
    if (reqs.parking_required) {
      const pRow: any = { criterion: "Dedicated Parking Required", results: {} };
      norm_props.forEach(p => {
        const matched = p.has_parking;
        pRow.results[p.id] = {
          matched,
          text: p.parking_display
        };
      });
      requirement_matrix.push(pRow);
    }
    if (reqs.ready_required) {
      const rRow: any = { criterion: "Possession = Ready to Move", results: {} };
      norm_props.forEach(p => {
        const matched = p.possession_status === "Ready to Move";
        rRow.results[p.id] = {
          matched,
          text: p.possession_status
        };
      });
      requirement_matrix.push(rRow);
    }

    const requirement_match = norm_props.map(p => {
      const matches: string[] = [];
      const mismatches: string[] = [];
      requirement_matrix.forEach(row => {
        if (row.results[p.id]?.matched) matches.push(row.criterion);
        else mismatches.push(row.criterion);
      });
      return {
        property_id: p.id,
        property_title: p.title,
        matches,
        mismatches,
        match_count: matches.length,
        mismatch_count: mismatches.length
      };
    });

    // Priority & Trade-Off Conclusion
    const priority = (body.priority || "balanced").toLowerCase();
    let bestLeader = norm_props[0];
    let recReason = "";

    if (priority === "price") {
      bestLeader = cheapest;
      recReason = `Under your stated priority for **Lowest Price**, **${cheapest.title}** (${cheapest.price_display}) offers the lowest acquisition cost, saving **${formatInrVal(priceDiff)}** compared to ${priciest.title}.\n\n💡 **Trade-off Analysis**: Opting for the lower price means selecting a ${cheapest.area_display} floor plan instead of ${priciest.area_display}, keeping initial capital deployment optimized.`;
    } else if (priority === "area") {
      bestLeader = largest;
      recReason = `Under your stated priority for **Maximum Space**, **${largest.title}** (${largest.area_display}) provides **+${areaDiff.toLocaleString()} sq.ft more usable area**.\n\n💡 **Trade-off Analysis**: The larger living space entails a price difference of **${formatInrVal(priceDiff)}**.`;
    } else if (priority === "parking") {
      const parkProps = norm_props.filter(p => p.has_parking);
      bestLeader = parkProps.length > 0 ? parkProps[0] : norm_props[0];
      recReason = `Under your stated priority for **Dedicated Parking**, **${bestLeader.title}** guarantees verified parking facilities.`;
    } else if (priority === "ready") {
      const readyProps = norm_props.filter(p => p.possession_status === "Ready to Move");
      bestLeader = readyProps.length > 0 ? readyProps[0] : norm_props[0];
      recReason = `Under your stated priority for **Ready Possession**, **${bestLeader.title}** is ready for immediate handover.`;
    } else {
      if (requirement_matrix.length > 0) {
        bestLeader = norm_props.slice().sort((a, b) => {
          const mA = requirement_match.find(rm => rm.property_id === a.id)?.match_count || 0;
          const mB = requirement_match.find(rm => rm.property_id === b.id)?.match_count || 0;
          if (mB !== mA) return mB - mA;
          return a.price - b.price;
        })[0];
        const matchObj = requirement_match.find(rm => rm.property_id === bestLeader.id);
        recReason = `Based on your stated criteria, **${bestLeader.title}** matches **${matchObj?.match_count || 0} of ${requirement_matrix.length} stated requirements**.\n\n💡 **Trade-off Analysis**: SAI's dynamic matching engine factually balances budget, living space, and amenities without subjective bias.`;
      } else {
        bestLeader = cheapest;
        recReason = `**${cheapest.title}** offers the lowest entry price (${cheapest.price_display}), while **${largest.title}** provides the most generous floor area (${largest.area_display}).\n\n💡 **Trade-off Analysis**: Adjust your evaluation priority above to dynamically re-weight trade-offs.`;
      }
    }

    // Comparison fields
    const categoriesConfig = [
      {
        category: "Basic Information",
        items: [
          { field: "Property Name", fn: (p: any) => p.title },
          { field: "Property ID", fn: (p: any) => `#${p.id}` },
          { field: "Property Type", fn: (p: any) => p.property_type },
          { field: "Listing Type", fn: (p: any) => String(p.listing_type).toUpperCase() },
          { field: "Status", fn: (p: any) => p.status },
          { field: "Verification Status", fn: (p: any) => p.verification_status },
        ]
      },
      {
        category: "Location",
        items: [
          { field: "City", fn: (p: any) => p.city },
          { field: "Locality", fn: (p: any) => p.locality },
          { field: "Address", fn: (p: any) => p.address },
          { field: "Transit / Metro", fn: (p: any) => p.dist_metro },
        ]
      },
      {
        category: "Price & Cost",
        items: [
          { field: "Listed Price", fn: (p: any) => p.price_display },
          { field: "Price per sq.ft", fn: (p: any) => p.price_per_sqft_display },
          { field: "Estimated Rent", fn: (p: any) => p.monthly_rent_estimate },
          { field: "Rental Yield", fn: (p: any) => p.rental_yield_estimate },
        ]
      },
      {
        category: "Property Size & Configuration",
        items: [
          { field: "Carpet Area", fn: (p: any) => p.area_display },
          { field: "BHK", fn: (p: any) => p.bhk_display },
          { field: "Furnishing", fn: (p: any) => p.furnishing },
        ]
      },
      {
        category: "Condition & Possession",
        items: [
          { field: "Possession Status", fn: (p: any) => p.possession_status },
          { field: "Possession Date", fn: (p: any) => p.possession_date },
        ]
      },
      {
        category: "Parking & Amenities",
        items: [
          { field: "Parking Available", fn: (p: any) => p.parking_display },
          { field: "Total Amenities", fn: (p: any) => `${p.amenities.length} listed` },
        ]
      },
      {
        category: "Legal & Trust",
        items: [
          { field: "SAI Verified", fn: (p: any) => p.is_verified ? "Yes ✓" : "Pending Review" },
          { field: "RERA Registered", fn: (p: any) => p.is_rera ? "Yes ✓" : "Pending / Unlisted" },
          { field: "Rating", fn: (p: any) => `★ ${p.rating} / 5.0` },
        ]
      }
    ];

    const fields: any[] = [];
    const matrix: Record<string, any[]> = {};
    categoriesConfig.forEach(cat => {
      cat.items.forEach(it => {
        const vals: Record<string, any> = {};
        const valList: string[] = [];
        norm_props.forEach(p => {
          const v = it.fn(p);
          vals[p.id] = v;
          valList.push(String(v));
        });
        const isDifferent = new Set(valList).size > 1;
        fields.push({
          category: cat.category,
          field: it.field,
          values: vals,
          is_different: isDifferent
        });
        matrix[it.field] = valList;
      });
    });

    const comparisonData = {
      properties: norm_props,
      fields,
      matrix,
      differences,
      advantages,
      considerations,
      requirement_matrix,
      requirement_match,
      amenity_comparison: {
        common: commonAmenities,
        unique: uniqueAmenities,
        checklist,
      },
      price_analysis: {
        cheapest_id: cheapest.id,
        cheapest_title: cheapest.title,
        cheapest_price: cheapest.price,
        priciest_id: priciest.id,
        priciest_title: priciest.title,
        priciest_price: priciest.price,
        difference: priceDiff,
        difference_display: formatInrVal(priceDiff),
        explanation: priceDiff > 0
          ? `${cheapest.title} offers an upfront cost advantage of ${formatInrVal(priceDiff)} compared to ${priciest.title}.`
          : "Both properties have comparable listed pricing."
      },
      area_analysis: {
        largest_id: largest.id,
        largest_title: largest.title,
        largest_area: largest.area_sqft,
        smallest_id: smallest.id,
        smallest_title: smallest.title,
        smallest_area: smallest.area_sqft,
        difference: areaDiff,
        difference_display: `${areaDiff.toLocaleString()} sq.ft`,
        explanation: areaDiff > 0
          ? `${largest.title} provides +${areaDiff.toLocaleString()} sq.ft (${Math.round((areaDiff / (smallest.area_sqft || 1)) * 100)}%) more interior usable area.`
          : "Both properties share identical floor plan dimensions."
      },
      recommendation_reason: recReason,
      best_match_id: bestLeader.id,
      summary: `Detailed comparison between ${norm_props.map(p => p.title).join(" and ")} across pricing, space, location, and requirements.`,
    };

    return {
      properties: norm_props,
      comparison: comparisonData,
      matrix,
      differences,
      summary: comparisonData.summary,
      best_match_id: bestLeader.id,
    };
  }

  if (endpoint.includes("/properties") && method === "GET") {
    const queryStr = endpoint.includes("?") ? endpoint.split("?")[1] : "";
    const params = new URLSearchParams(queryStr);
    const cityP = params.get("city")?.toLowerCase();
    const locP = params.get("locality")?.toLowerCase();
    const listTypeP = params.get("listing_type")?.toLowerCase();
    const propTypeP = params.get("property_type")?.toLowerCase();
    const bhkP = params.get("bhk") ? parseInt(params.get("bhk")!) : null;
    const minP = params.get("min_price") ? parseFloat(params.get("min_price")!) : null;
    const maxP = params.get("max_price") ? parseFloat(params.get("max_price")!) : null;

    let items = [...MOCK_PROPERTIES];
    if (cityP && cityP !== "all cities") {
      items = items.filter(p => p.city.toLowerCase().includes(cityP));
    }
    if (locP) {
      items = items.filter(p => p.locality.toLowerCase().includes(locP));
    }
    if (listTypeP) {
      items = items.filter(p => p.listing_type.toLowerCase() === listTypeP);
    }
    if (propTypeP) {
      items = items.filter(p => p.property_type.toLowerCase().includes(propTypeP));
    }
    if (bhkP !== null && !isNaN(bhkP)) {
      items = items.filter(p => p.bhk === bhkP);
    }
    if (minP !== null && !isNaN(minP)) {
      items = items.filter(p => p.price >= minP);
    }
    if (maxP !== null && !isNaN(maxP)) {
      items = items.filter(p => p.price <= maxP);
    }

    return { items, total: items.length, page: 1, limit: 100, pages: 1 };
  }

  // ── SEARCH ENDPOINTS ──────────────────────────────────────────────
  if (endpoint.includes("/search/natural-language") && method === "POST") {
    const query = body.query || "";
    const q = query.toLowerCase();
    let filtered = [...MOCK_PROPERTIES];
    const bhkM = q.match(/(\d)\s*bhk/i);
    if (bhkM) filtered = filtered.filter(p => p.bhk === parseInt(bhkM[1]));

    const allMockCities = Array.from(new Set(MOCK_PROPERTIES.map(p => p.city.toLowerCase())));
    const allMockLocalities = Array.from(new Set(MOCK_PROPERTIES.map(p => p.locality.toLowerCase())));
    const detectedCity = allMockCities.find(c => q.includes(c));
    const detectedLoc = allMockLocalities.find(l => q.includes(l));

    if (detectedCity) filtered = filtered.filter(p => p.city.toLowerCase().includes(detectedCity));
    if (detectedLoc) filtered = filtered.filter(p => p.locality.toLowerCase().includes(detectedLoc));
    if (q.includes("rent")) filtered = filtered.filter(p => p.listing_type === "rent");

    // Critical Requirement 3: NO CROSS-CITY RESULT MIXING
    return {
      query, detected_language: body.language || "en",
      parsed_intent: { bhk: bhkM ? parseInt(bhkM[1]) : null, city: detectedCity || null, locality: detectedLoc || null, preferences: [] },
      structured_filters: {}, items: filtered, total: filtered.length,
    };
  }

  if (endpoint.includes("/search") && method === "GET") {
    return { items: MOCK_PROPERTIES, total: MOCK_PROPERTIES.length, page: 1, limit: 20, pages: 1 };
  }

  // ── CHATBOT ENDPOINT ──────────────────────────────────────────────
  if (endpoint.includes("/chatbot/message") && method === "POST") {
    const chatResp = generateChatResponse(body.message || "", body.language || "en");
    return { reply: chatResp.message, properties: chatResp.properties, suggestions: ["Find 2 BHK in Baner", "Show rental properties", "Compare Baner vs Wakad"], detected_intent: chatResp.intent };
  }

  // ── FAVORITES ENDPOINTS ───────────────────────────────────────────
  if (endpoint.includes("/favorites") && method === "GET") {
    const savedIds = getLocalState("favorites", [1, 2, 7]);
    return MOCK_PROPERTIES.filter(p => savedIds.includes(p.id));
  }

  if (endpoint.match(/\/favorites\/\d+/) && method === "POST") {
    const id = parseInt(endpoint.match(/\/favorites\/(\d+)/)?.[1] || "0");
    const saved = getLocalState("favorites", [1, 2, 7]);
    if (!saved.includes(id)) { saved.push(id); setLocalState("favorites", saved); }
    return { message: "Added to favorites" };
  }

  if (endpoint.match(/\/favorites\/\d+/) && method === "DELETE") {
    const id = parseInt(endpoint.match(/\/favorites\/(\d+)/)?.[1] || "0");
    const saved = getLocalState("favorites", [1, 2, 7]);
    setLocalState("favorites", saved.filter((s: number) => s !== id));
    return null;
  }

  // ── ENQUIRIES ─────────────────────────────────────────────────────
  if (endpoint.includes("/enquiries") && method === "POST") {
    return {
      id: Date.now(), property_id: body.property_id, buyer_id: 1, message: body.message || "Interested in this property",
      status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  }

  if (endpoint.includes("/enquiries") && method === "GET") {
    return [
      { id: 1, property_id: 1, buyer_id: 5, message: "Is immediate registration possible?", status: "new", name: "Ankit Mehta", listing: "3BHK · Baner", time: "1h ago", budget: "₹80–90L", intent: "High", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, property_id: 2, buyer_id: 6, message: "What are the maintenance charges?", status: "replied", name: "Pooja Rao", listing: "2BHK · Kharadi", time: "Yesterday", budget: "₹58–65L", intent: "Medium", reply_text: "Maintenance is ₹2,500/month.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, property_id: 1, buyer_id: 7, message: "Can I inspect the property tomorrow?", status: "scheduled", name: "Sameer Khan", listing: "3BHK · Baner", time: "2 days ago", budget: "₹82–88L", intent: "High", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
  }

  if (endpoint.match(/\/enquiries\/\d+\/reply/)) {
    return { success: true, enquiry: { id: parseInt(endpoint.match(/\/enquiries\/(\d+)/)?.[1] || "1"), reply_text: body.reply_text, status: "replied" } };
  }

  // ── SITE VISITS ───────────────────────────────────────────────────
  if (endpoint.includes("/site-visits") && method === "POST") {
    const visit = {
      id: Date.now(), property_id: body.property_id, buyer_id: 1, scheduled_at: body.scheduled_at || new Date().toISOString(),
      status: "scheduled", notes: body.notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const visits = getLocalState("site_visits", []);
    visits.push(visit);
    setLocalState("site_visits", visits);
    return visit;
  }

  if (endpoint.includes("/site-visits") && method === "GET") {
    return getLocalState("site_visits", []);
  }

  if (endpoint.match(/\/visits\/\d+\/reschedule/)) {
    return { message: "Visit rescheduled successfully" };
  }

  if (endpoint.match(/\/visits\/\d+/) && method === "DELETE") {
    const id = parseInt(endpoint.match(/\/visits\/(\d+)/)?.[1] || "0");
    const visits = getLocalState("site_visits", []);
    setLocalState("site_visits", visits.filter((v: any) => v.id !== id));
    return null;
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────
  if (endpoint.includes("/dashboard")) {
    const savedIds = getLocalState("favorites", [1, 2, 7]);
    const visits = getLocalState("site_visits", []);
    const comparisons = getLocalState("comparisons", [1, 3]);
    return {
      saved_count: savedIds.length,
      upcoming_visits: visits.length || 2,
      comparison_count: comparisons.length,
      unread_notifications: 3,
      loan_eligibility: {
        amount: 4900000, amount_display: "₹49.0L", monthly_income: 85000, tenure_years: 20, interest_rate: 8.5,
        monthly_emi: 42486, monthly_emi_display: "₹42,486", down_payment: 1225000, down_payment_display: "₹12.3L",
        total_interest: 5296640, total_interest_display: "₹53.0L", basis_text: "Based on ₹85,000/mo income · 20yr tenure · 8.5% rate",
      },
      upcoming_visits_data: visits.length > 0 ? visits.map((v: any) => {
        const prop = MOCK_PROPERTIES.find(p => p.id === v.property_id) || MOCK_PROPERTIES[0];
        return { id: v.id, property_id: v.property_id, name: prop.title, loc: `${prop.locality}, ${prop.city}`, date: new Date(v.scheduled_at).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }), status: "scheduled", img: prop.media[0]?.url || PROPERTY_IMGS[0], agent: "Vikram Patil" };
      }) : [
        { id: 901, property_id: 1, name: "Prestige Heights", loc: "Baner, Pune", date: "Sat, Sep 27", status: "scheduled", img: PROPERTY_IMGS[0], agent: "Vikram Patil" },
        { id: 902, property_id: 7, name: "Sobha Dream Acres", loc: "Viman Nagar, Pune", date: "Mon, Sep 29", status: "scheduled", img: PROPERTY_IMGS[6], agent: "Neha Deshmukh" },
      ],
      saved_properties_data: MOCK_PROPERTIES.filter(p => savedIds.includes(p.id)),
      market_insights: {
        city: "Pune", inventory_count: 8452, inventory_label: "Active Listings", avg_price_display: "₹72.5L",
        avg_sqft_display: "₹6,250/sq ft", price_trend: "+8.2% YoY", is_trend_up: true, best_time_to_buy: "Current market is favorable for buyers. New metro connectivity boosting Baner & Wakad.",
      },
      recommendation: {
        text: "SAI analyzed verified property data in Baner & Wakad. High appreciation potential with upcoming metro connectivity!",
        property: { id: 1, title: "Prestige Heights", locality: "Baner", price_display: "₹85L" },
      },
    };
  }

  // ── LOAN ENDPOINTS ────────────────────────────────────────────────
  if (endpoint.includes("/loan/eligibility") && method === "POST") {
    const income = body.monthly_income || 85000;
    const rate = (body.interest_rate || 8.5) / 100 / 12;
    const n = (body.tenure_years || 20) * 12;
    const maxEmi = income * 0.5;
    const compound = Math.pow(1 + rate, n);
    const loan = Math.round(maxEmi * ((compound - 1) / (rate * compound)));
    const emi = Math.round((loan * rate * compound) / (compound - 1));
    const total = emi * n;
    return { eligible_loan: loan, monthly_emi: emi, down_payment: Math.round(loan * 0.25), total_interest: Math.max(0, total - loan), total_repayment: total, tenure_years: body.tenure_years || 20, interest_rate: body.interest_rate || 8.5, monthly_income: income, disclaimer: "This is an estimate." };
  }

  if (endpoint.includes("/loan/emi") && method === "POST") {
    const amount = body.loan_amount || 5000000;
    const rate = (body.interest_rate || 8.5) / 100 / 12;
    const n = (body.tenure_years || 20) * 12;
    const compound = Math.pow(1 + rate, n);
    const emi = Math.round((amount * rate * compound) / (compound - 1));
    const total = emi * n;
    return { monthly_emi: emi, principal: amount, total_interest: Math.max(0, total - amount), total_payment: total, tenure_months: n, interest_rate: body.interest_rate || 8.5, disclaimer: "This is an estimate." };
  }

  // ── COMPARE ENDPOINTS ─────────────────────────────────────────────
  if (endpoint.includes("/compare") && method === "GET") {
    const compIds = getLocalState("comparisons", [1, 3]);
    return { total: compIds.length, properties: MOCK_PROPERTIES.filter(p => compIds.includes(p.id)), matrix: {} };
  }

  if (endpoint.match(/\/compare\/\d+/) && method === "POST") {
    const id = parseInt(endpoint.match(/\/compare\/(\d+)/)?.[1] || "0");
    const comps = getLocalState("comparisons", [1, 3]);
    if (!comps.includes(id)) { comps.push(id); setLocalState("comparisons", comps); }
    return { message: "Added to comparison", comparison_count: comps.length };
  }

  if (endpoint.match(/\/compare\/\d+/) && method === "DELETE") {
    const id = parseInt(endpoint.match(/\/compare\/(\d+)/)?.[1] || "0");
    const comps = getLocalState("comparisons", [1, 3]);
    setLocalState("comparisons", comps.filter((c: number) => c !== id));
    return { message: "Removed from comparison", comparison_count: comps.filter((c: number) => c !== id).length };
  }

  // ── LEADS ─────────────────────────────────────────────────────────
  if (endpoint.includes("/leads") && method === "GET") {
    return [
      { id: 1, agent_id: 3, buyer_id: 5, property_id: 1, status: "NEW", notes: "Interested in 3BHK Baner", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, agent_id: 3, buyer_id: 6, property_id: 2, status: "CONTACTED", notes: "Called for 2BHK Wakad", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, agent_id: 3, buyer_id: 7, property_id: 7, status: "SITE_VISIT", notes: "Visit scheduled at Viman Nagar", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
  }

  if (endpoint.includes("/leads") && method === "POST") {
    return { id: Date.now(), agent_id: 3, ...body, status: body.status || "NEW", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }

  if (endpoint.match(/\/leads\/\d+/) && method === "PATCH") {
    return { id: parseInt(endpoint.match(/\/leads\/(\d+)/)?.[1] || "1"), ...body, updated_at: new Date().toISOString() };
  }

  // ── PROJECTS ──────────────────────────────────────────────────────
  if (endpoint.includes("/projects") && method === "GET") {
    return [
      { id: 1, builder_id: 4, name: "SAI Smart City Phase 1", description: "Premium integrated township", city: "Pune", locality: "Hinjewadi", total_units: 450, status: "ongoing", created_at: new Date().toISOString(), buildings: [{ id: 1, project_id: 1, name: "Tower A", total_floors: 25 }] },
      { id: 2, builder_id: 4, name: "SAI Garden Residency", description: "Eco-friendly residential project", city: "Pune", locality: "Baner", total_units: 280, status: "upcoming", created_at: new Date().toISOString(), buildings: [] },
    ];
  }

  if (endpoint.includes("/projects") && method === "POST") {
    return { id: Date.now(), builder_id: 4, ...body, status: "upcoming", created_at: new Date().toISOString() };
  }

  // ── ADMIN ENDPOINTS ───────────────────────────────────────────────
  if (endpoint.includes("/admin/stats")) {
    return { total_users: 1247, total_buyers: 892, total_sellers: 187, total_agents: 124, total_builders: 44, total_properties: 8452, active_listings: 6891, total_enquiries: 3241, total_site_visits: 1892, open_reports: 12 };
  }

  if (endpoint.includes("/admin/users")) {
    return Object.values(DEMO_USERS).map(u => ({ ...u, is_active: true, created_at: "2026-01-01T00:00:00Z" }));
  }

  if (endpoint.includes("/admin/audit-logs")) {
    return [
      { id: 1, user_id: 1, action: "LOGIN", entity_type: "user", ip_address: "192.168.1.1", created_at: new Date().toISOString() },
      { id: 2, user_id: 2, action: "PROPERTY_CREATED", entity_type: "property", ip_address: "192.168.1.2", created_at: new Date().toISOString() },
    ];
  }

  // ── VERIFICATION ENDPOINTS ─────────────────────────────────────────
  if (endpoint.includes("/verification")) {
    if (endpoint.includes("/stats")) {
      return { total_documents: 0, pending_review: 0, under_review: 0, verified: 0, rejected: 0, resubmission_required: 0 };
    }
    if (method === "POST") {
      return { success: true, document: { id: Date.now(), status: "submitted", document_type: "KYC", file_name: "document.pdf", uploaded_at: new Date().toISOString() } };
    }
    return [];
  }

  // ── AI & CHATBOT ENDPOINTS ─────────────────────────────────────────
  if (endpoint.includes("/ai/chat") || endpoint.includes("/chatbot/message") || (endpoint === "/chat" && method === "POST")) {
    const userMsg = body.message || body.content || "";
    const lang = body.language || "en";
    const chatResp = generateChatResponse(userMsg, lang);
    return {
      success: true,
      reply: chatResp.message,
      message: chatResp.message,
      properties: chatResp.properties || [],
      intent: chatResp.intent,
      detected_intent: chatResp.intent,
      conversation_id: body.conversation_id || "mock_conv_1",
      language: lang,
      map_data: (chatResp.properties || []).map((p: any) => ({
        property_id: p.id,
        latitude: p.latitude || 18.5204,
        longitude: p.longitude || 73.8567,
        title: p.title,
        price: p.price,
        price_display: p.price_display,
        locality: p.locality,
        city: p.city
      })),
      suggestions: [
        "Find 2 BHK in Pune under ₹70L",
        "Compare properties",
        "Which is cheaper?",
        "Investment analysis"
      ],
      actions: ["search_properties", "explore_map"],
      document_actions: []
    };
  }

  if (endpoint.includes("/ai/languages")) {
    return {
      count: 8,
      languages: [
        { code: "en", name: "English", native_name: "English" },
        { code: "hi", name: "Hindi", native_name: "हिन्दी" },
        { code: "mr", name: "Marathi", native_name: "मराठी" },
        { code: "bn", name: "Bengali", native_name: "বাংলা" },
        { code: "gu", name: "Gujarati", native_name: "ગુજરાતી" },
        { code: "ta", name: "Tamil", native_name: "தமிழ்" },
        { code: "te", name: "Telugu", native_name: "తెలుగు" },
        { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ" }
      ]
    };
  }

  // ── CHAT & MESSAGES ───────────────────────────────────────────────
  if (endpoint.includes("/chat")) {
    if (endpoint.includes("/messages") && method === "POST") {
      return { id: Date.now(), conversation_id: 1, sender_id: 1, content: (body as any)?.content || "", is_read: true, created_at: new Date().toISOString() };
    }
    return [];
  }

  // ── BUILDER & AGENT COLLECTIONS ───────────────────────────────────
  if (endpoint.includes("/promotions")) {
    if (method === "POST") return { success: true, message: "Promotion created", promotion_id: Date.now() };
    return [];
  }
  if (endpoint.includes("/builder/units")) return [];
  if (endpoint.includes("/builder/towers")) return [];
  if (endpoint.includes("/builder/enquiries")) return [];
  if (endpoint.includes("/agent/clients")) return [];
  if (endpoint.includes("/agent/enquiries")) return [];
  if (endpoint.includes("/agent/site-visits")) return [];

  // ── UPLOAD ENDPOINT ───────────────────────────────────────────────
  if (endpoint.includes("/upload") && method === "POST") {
    // Return mock URLs for uploaded files
    return { success: true, urls: [PROPERTY_IMGS[Math.floor(Math.random() * PROPERTY_IMGS.length)]] };
  }

  // ── 3D BUILDING & DISCOVERY ENDPOINTS ─────────────────────────────
  if (endpoint.includes("/3d-data")) {
    const bMatch = endpoint.match(/\/buildings\/(\d+)\/3d-data/);
    const bId = bMatch ? Number(bMatch[1]) : 10;
    return generateMockBuilding3DData(bId);
  }

  if (endpoint.includes("/projects/") && endpoint.includes("/buildings")) {
    const pMatch = endpoint.match(/\/projects\/(\d+)\/buildings/);
    const pId = pMatch ? Number(pMatch[1]) : 5;
    return generateMockProjectBuildings(pId);
  }

  if (endpoint.includes("/3d-tour")) {
    const uMatch = endpoint.match(/\/units\/(\d+)\/3d-tour/);
    const uId = uMatch ? Number(uMatch[1]) : 10203;
    return generateMockUnitTour(uId);
  }

  if (endpoint.includes("/floor-plan")) {
    return {
      success: true,
      floor_plan_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format",
      rooms: [
        { name: "Living Room", dimensions: "22' x 14'" },
        { name: "Master Bedroom", dimensions: "16' x 13'" },
        { name: "Kitchen", dimensions: "12' x 9'" },
        { name: "Balcony", dimensions: "14' x 5'" }
      ]
    };
  }

  if (endpoint.includes("/availability")) {
    const uMatch = endpoint.match(/\/units\/(\d+)\/availability/);
    const uId = uMatch ? Number(uMatch[1]) : 10203;
    return { unit_id: uId, status: "available", is_available: true, price: 14500000 };
  }

  if (endpoint.includes("/reserve") && method === "POST") {
    const uMatch = endpoint.match(/\/units\/(\d+)\/reserve/);
    const uId = uMatch ? Number(uMatch[1]) : 10203;
    return {
      success: true,
      message: "Unit successfully reserved for 48 hours. A sales executive has been assigned.",
      booking: {
        id: Date.now(),
        unit_id: uId,
        unit_label: "Flat 20-C",
        floor_number: 20,
        bhk: 3,
        area_sqft: 1520,
        direction: "North-East",
        project_name: "ABC Residency",
        tower_name: "Tower A",
        price: 14500000,
        price_display: "₹1.45 Cr",
        booking_amount: 50000,
        booking_amount_display: "₹50,000",
        status: "reserved",
        created_at: new Date().toISOString(),
      }
    };
  }

  if (endpoint.includes("/book") && method === "POST") {
    const uMatch = endpoint.match(/\/units\/(\d+)\/book/);
    const uId = uMatch ? Number(uMatch[1]) : 10203;
    return {
      success: true,
      message: "Congratulations! Unit booking confirmed with allotment receipt generated.",
      booking: {
        id: Date.now(),
        unit_id: uId,
        unit_label: "Flat 20-C",
        floor_number: 20,
        bhk: 3,
        area_sqft: 1520,
        direction: "North-East",
        project_name: "ABC Residency",
        tower_name: "Tower A",
        price: 14500000,
        price_display: "₹1.45 Cr",
        booking_amount: 100000,
        booking_amount_display: "₹1,00,000",
        status: "booked",
        created_at: new Date().toISOString(),
      }
    };
  }

  if (endpoint.includes("/units/find")) {
    const bData = generateMockBuilding3DData(10);
    const allFlats = bData.floors.flatMap(f => f.units);
    return allFlats.filter(u => u.status === "available");
  }

  if (endpoint.includes("/bookings/my")) {
    return [
      {
        id: 1,
        booking_number: "BK-2026-001",
        unit_id: 10203,
        unit_label: "Flat 20-C",
        tower_name: "Tower A",
        project_name: "ABC Residency",
        floor_number: 20,
        bhk: 3,
        area_sqft: 1520,
        price_display: "₹1.45 Cr",
        booking_amount_display: "₹1,00,000",
        status: "confirmed",
        created_at: new Date().toISOString(),
      }
    ];
  }

  // ── DEFAULT FALLBACK ──────────────────────────────────────────────
  if (method === "GET" && (endpoint.endsWith("s") || endpoint.includes("/list") || endpoint.includes("/my"))) {
    return [];
  }
  return { message: "OK" };
}

export { MOCK_PROPERTIES };
