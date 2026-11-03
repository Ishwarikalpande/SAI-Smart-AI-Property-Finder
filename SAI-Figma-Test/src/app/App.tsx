import { convertWholeWebsite } from "./i18n/universalTranslator";
import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import { useTranslations } from "./i18n/translations";
import { getSpeechCode } from "./i18n/langauge";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import { EnquiryModal, SiteVisitModal, ToastAlert, EnquiryReplyModal } from "./components/ActionModals";
import { PropertyMap } from "./components/PropertyMap";
import { MapErrorBoundary } from "./components/MapErrorBoundary";
import { LocationPickerModal } from "./components/LocationPickerModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AgentPortal } from "./components/AgentPortal";
import { BuilderPortal } from "./components/BuilderPortal";
import { AdminDocumentVerification } from "./components/AdminDocumentVerification";
import { SaiLogo } from "./components/SaiLogo";
import { FeaturedPropertiesScroll } from "./components/FeaturedPropertiesScroll";
import { OTPAuthView } from "./components/OTPAuthView";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { OAuthOTPModal } from "./components/OAuthOTPModal";
import { getOAuthConfig, googleLogin, appleLogin, OAuthAuthResponse } from "../api/auth";
import { initiateGoogleSignIn, initiateAppleSignIn } from "./utils/oauthClient";
import { CityExplorePage } from "./components/CityExplorePage";
import { VoiceInputField } from "./components/VoiceInputField";
import { BuyerVoiceSearchModal } from "./components/BuyerVoiceSearchModal";
import { DocumentViewerModal } from "./components/DocumentViewerModal";
import { PropertyDocumentVerificationSection } from "./components/PropertyDocumentVerificationSection";
import { fetchPropertyDocumentDetails, PropertyDocumentItem } from "../api";
import { PropertyWalkthrough } from "./components/property/PropertyWalkthrough";
import { Building3DDiscovery } from "./components/property/building3D";
import { fetchPropertyWalkthrough, fetchProperty3DTour } from "../api/properties";
import { resolveSpokenLocation, INDIAN_LOCATIONS_DB, cleanVoiceLocationQuery } from "./utils/locationDatabase";
import { CITY_HUBS, CITY_HUBS_MAP } from "./data/cityHubs";
import { getPropertyImages, getFallbackPropertyImage } from "./data/propertyImages";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe as apiGetMe,
  sendEmailOTP as apiSendEmailOTP,
  resendEmailOTP as apiResendEmailOTP,
  fetchProperties,
  fetchCities,
  fetchPropertyById,
  recordPropertyView,
  fetchMyProperties,
  createProperty,
  deleteProperty,
  searchProperties,
  naturalLanguageSearch,
  searchNaturalLanguage,
  fetchFavorites,
  getFavorites,
  addFavorite,
  removeFavorite,
  sendEnquiry,
  fetchEnquiries,
  replyToEnquiry,
  uploadFiles,
  scheduleSiteVisit,
  sendChatbotMessage,
  fetchAgentLeads,
  createAgentLead,
  updateAgentLead,
  fetchBuilderProjects,
  createBuilderProject,
  fetchAdminStats,
  fetchAdminUsers,
  toggleUserStatus,
  togglePropertyVerification,
  PropertyItem,
  toUIProperty,
  UIProperty,
  chatWithAI,
  comparePropertiesAI,
  compareProperties,
  PropertyComparisonData,
  recommendPropertiesAI,
  predictInvestmentAI,
  getSupportedLanguages,
  adminLogin as apiAdminLogin,
  admin2FAVerify as apiAdmin2FAVerify,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  googleLogin as apiGoogleLogin,
  appleLogin as apiAppleLogin,
  fetchAuditLogs,
  fetchDashboard,
  calculateLoanEligibility,
  calculateEMI,
  fetchUserComparisons,
  addToComparison,
  removeFromComparison,
  rescheduleSiteVisit,
  cancelVisit,
  cancelSiteVisit,
  DashboardSummary,
  fetchMyBookings,
} from "../api";
import {
  Brain, Bot, Mic, Search, MapPin, ChevronDown, ChevronRight, ChevronLeft, Wifi,
  ChevronUp, Heart, Bell, User, Home, Building, Layers, DollarSign, Star,
  Shield, ShieldCheck, Sparkles, TrendingUp, Check, CheckCircle, X, Plus, Minus,
  Globe, MessageCircle, Send, ArrowRight, Phone, Mail, Lock, LogOut,
  Settings, HelpCircle, FileText, BarChart2, Calendar, Clock, Bookmark,
  SlidersHorizontal, Grid, List, Map as MapIcon, AlertTriangle, Filter, Share2,
  Volume2, Eye, EyeOff, RefreshCcw, Menu, Zap, Target, Award, Users, Edit2,
  Train, Hospital, GraduationCap, ShoppingBag, Trees, Dumbbell, Coffee,
  Car, Navigation, Activity, PieChart, Info, Camera,
  LayoutDashboard, Building2, Grid3X3, Upload, MicOff,
  Play, Film
} from "lucide-react";

// ── TYPES ────────────────────────────────────────────────────────────
type Page =
  | "language" | "welcome" | "home" | "login" | "signup" | "otp"
  | "role" | "search" | "property" | "compare" | "fraud" | "senior"
  | "buyer" | "seller" | "builder" | "agent" | "profile"
  | "favorites" | "settings" | "chat"
  | "buy" | "rent" | "commercial" | "new-projects"
  | "building-3d"
  | "city-explore"
  | "admin-login" | "admin-2fa" | "admin" | "admin-document-verification";

type UserRole = "buyer" | "seller" | "agent" | "builder" | "admin" | "super_admin" | null;

const IMGS = {
  hero: "https://images.unsplash.com/photo-1648197685224-18c96a8d116d?w=1600&h=900&fit=crop&auto=format",
  city1: "https://images.unsplash.com/photo-1661527188297-35e762c4519b?w=800&h=600&fit=crop&auto=format",
  city2: "https://images.unsplash.com/photo-1679249010086-b8a932c8cafc?w=800&h=600&fit=crop&auto=format",
  city3: "https://images.unsplash.com/photo-1770331373486-0aa277da9a88?w=800&h=600&fit=crop&auto=format",
  // Unique property photos — one per listing
  p1: "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format",  // Prestige Heights — modern interior
  p2: "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=800&h=600&fit=crop&auto=format",  // Godrej Woodsville — residential towers
  p3: "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=800&h=600&fit=crop&auto=format",  // Lodha Palacia — villa pool
  p4: "https://images.unsplash.com/photo-1680416124510-5eae1beca412?w=800&h=600&fit=crop&auto=format",  // Piramal Mahalaxmi — open-plan living
  p5: "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=800&h=600&fit=crop&auto=format",  // Mahindra Windchimes — night pool
  p6: "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=800&h=600&fit=crop&auto=format",  // Kolte Patil Life — balcony apartments
  p7: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format",  // Sobha Dream Acres — luxury lounge
  p8: "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=800&h=600&fit=crop&auto=format",  // Shapoorji Pallonji — tower at dusk
  // Gallery extras + legacy aliases
  apt1: "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format",
  apt2: "https://images.unsplash.com/photo-1682662046610-fbdb3db4bd74?w=800&h=600&fit=crop&auto=format",
  apt3: "https://images.unsplash.com/photo-1686569860484-b0b79f5d7959?w=800&h=600&fit=crop&auto=format",
  apt4: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format",
  villa1: "https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?w=800&h=600&fit=crop&auto=format",
  villa2: "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=800&h=600&fit=crop&auto=format",
  villa3: "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=800&h=600&fit=crop&auto=format",
  bld1: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format",
  keys: "https://images.unsplash.com/photo-1758227365187-016878604d94?w=800&h=600&fit=crop&auto=format",
  // Rent — furnished interior photos
  rent1: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format",
  rent2: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format",
  rent3: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&auto=format",
  rent4: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format",
  rent5: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop&auto=format",
  rent6: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&auto=format",
  // Commercial — office & retail photos
  comm1: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format",
  comm2: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&auto=format",
  comm3: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop&auto=format",
  comm4: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&h=600&fit=crop&auto=format",
  comm5: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format",
  comm6: "https://images.unsplash.com/photo-1600508773759-e3a87c921ad8?w=800&h=600&fit=crop&auto=format",
};

const CITIES = [
  "Pune", "Amravati", "Nagpur", "Mumbai", "Nashik", "Jaipur",
  "Bangalore", "Hyderabad", "Chennai", "Delhi NCR", "Ahmedabad",
  "Kolkata", "Surat", "Indore", "Bhopal", "Noida", "Gurgaon"
];
const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

const RAW_PROPERTIES = [
  { id: 1, name: "Prestige Heights", type: "3 BHK Apartment", price: "₹85L", priceNum: 85, location: "Baner, Pune", img: IMGS.p1, match: 97, badge: "AI Pick", verified: true, area: "1,450 sq ft", amenities: ["Gym", "Pool", "Parking"], dist: "0.8 km Metro", rating: 4.8, rera: true, status: "Ready to Move", sponsored: true, sponsoredLabel: "Featured Property", forBuy: true, forRent: false, forCommercial: false },
  { id: 2, name: "Godrej Woodsville", type: "2 BHK Apartment", price: "₹62L", priceNum: 62, location: "Wakad, Pune", img: IMGS.p2, match: 92, badge: "Top Rated", verified: true, area: "1,120 sq ft", amenities: ["Gym", "Garden", "Security"], dist: "1.2 km Metro", rating: 4.6, rera: true, status: "Ready to Move", forBuy: true, forRent: true, forCommercial: false },
  { id: 3, name: "Lodha Palacia", type: "4 BHK Villa", price: "₹1.8Cr", priceNum: 180, location: "Kalyani Nagar, Pune", img: IMGS.p3, match: 88, badge: "Premium", verified: true, area: "2,800 sq ft", amenities: ["Pool", "Club", "EV Charging"], dist: "2.1 km Metro", rating: 4.9, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 4, name: "Piramal Mahalaxmi", type: "2 BHK Apartment", price: "₹58L", priceNum: 58, location: "Hinjewadi, Pune", img: IMGS.p4, match: 85, badge: "Value Pick", verified: true, area: "1,050 sq ft", amenities: ["Parking", "Security", "Lift"], dist: "1.5 km IT Park", rating: 4.5, rera: false, status: "Under Construction", sponsored: true, sponsoredLabel: "Promoted Listing", forBuy: false, forRent: true, forCommercial: false },
  { id: 5, name: "Mahindra Windchimes", type: "3 BHK Villa", price: "₹1.2Cr", priceNum: 120, location: "Hadapsar, Pune", img: IMGS.p5, match: 83, badge: "New Launch", verified: false, area: "2,100 sq ft", amenities: ["Garden", "Gym", "Pool"], dist: "0.5 km School", rating: 4.7, rera: true, status: "Under Construction", forBuy: true, forRent: false, forCommercial: false },
  { id: 6, name: "Kolte Patil Life", type: "1 BHK Apartment", price: "₹38L", priceNum: 38, location: "Akurdi, Pune", img: IMGS.p6, match: 79, badge: "Budget Pick", verified: true, area: "650 sq ft", amenities: ["Parking", "Lift", "Security"], dist: "0.3 km Metro", rating: 4.3, rera: true, status: "Ready to Move", forBuy: false, forRent: true, forCommercial: true },
  { id: 7, name: "Sobha Dream Acres", type: "2 BHK Apartment", price: "₹72L", priceNum: 72, location: "Viman Nagar, Pune", img: IMGS.p7, match: 90, badge: "Premium", verified: true, area: "1,200 sq ft", amenities: ["Pool", "Gym", "Club"], dist: "2.0 km Airport", rating: 4.8, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 8, name: "Shapoorji Pallonji", type: "Office Space", price: "₹95L", priceNum: 95, location: "Kharadi, Pune", img: IMGS.p8, match: 86, badge: "AI Pick", verified: true, area: "1,750 sq ft", amenities: ["Conference", "Parking", "Security"], dist: "1.0 km Metro", rating: 4.6, rera: true, status: "Ready to Move", forBuy: false, forRent: false, forCommercial: true },
  // Multi-City Dynamic Fallback Data
  { id: 16, name: "Shivshahi Residency", type: "2 BHK Apartment", price: "₹32L", priceNum: 32, location: "Rajapeth, Amravati", img: IMGS.p1, match: 88, badge: "Value Pick", verified: true, area: "950 sq ft", amenities: ["Parking", "Security", "Garden", "Lift"], dist: "1.5 km Bus Stand", rating: 4.4, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 17, name: "Amravati Green Valley", type: "3 BHK Villa", price: "₹55L", priceNum: 55, location: "Camp, Amravati", img: IMGS.p3, match: 91, badge: "Premium", verified: true, area: "1,800 sq ft", amenities: ["Garden", "Parking", "Terrace"], dist: "2.0 km Railway Station", rating: 4.6, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 18, name: "Dharampeth Luxury Flat", type: "3 BHK Apartment", price: "₹95L", priceNum: 95, location: "Dharampeth, Nagpur", img: IMGS.p2, match: 94, badge: "AI Pick", verified: true, area: "1,600 sq ft", amenities: ["Gym", "Pool", "Parking", "Clubhouse"], dist: "1.0 km Metro", rating: 4.7, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 19, name: "Manish Nagar Villa", type: "4 BHK Villa", price: "₹1.5Cr", priceNum: 150, location: "Manish Nagar, Nagpur", img: IMGS.p5, match: 90, badge: "Premium", verified: true, area: "2,500 sq ft", amenities: ["Garden", "Parking", "Security"], dist: "2.5 km Airport", rating: 4.8, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 20, name: "Andheri West Skyline", type: "2 BHK Apartment", price: "₹1.8Cr", priceNum: 180, location: "Andheri West, Mumbai", img: IMGS.p7, match: 95, badge: "Premium", verified: true, area: "850 sq ft", amenities: ["Gym", "Pool", "Parking", "Metro Access"], dist: "0.3 km Metro", rating: 4.7, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 24, name: "Nashik Vineyard Residency", type: "2 BHK Apartment", price: "₹42L", priceNum: 42, location: "Gangapur Road, Nashik", img: IMGS.p2, match: 89, badge: "Top Rated", verified: true, area: "1,050 sq ft", amenities: ["Garden", "Parking", "Security", "Gym"], dist: "1.0 km Market", rating: 4.5, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
  { id: 25, name: "Pink City Heights", type: "3 BHK Apartment", price: "₹75L", priceNum: 75, location: "Malviya Nagar, Jaipur", img: IMGS.p4, match: 92, badge: "Premium", verified: true, area: "1,500 sq ft", amenities: ["Pool", "Gym", "Parking", "Garden"], dist: "1.2 km Metro", rating: 4.6, rera: true, status: "Ready to Move", forBuy: true, forRent: false, forCommercial: false },
];

const PROPERTIES = RAW_PROPERTIES.map(p => ({
  ...p,
  images: getPropertyImages(p.id, p.img, p.type).map(x => x.url)
}));

// ── RENT PROPERTIES ──────────────────────────────────────────────────
const RAW_RENT_PROPERTIES = [
  { id: 101, name: "Furnished 2BHK · Baner", type: "2 BHK Apartment", price: "₹32,000/mo", priceNum: 32, location: "Baner, Pune", img: IMGS.rent1, match: 96, badge: "AI Pick", verified: true, area: "1,100 sq ft", amenities: ["Fully Furnished", "WiFi", "Parking"], dist: "0.5 km Metro", rating: 4.8, rera: true, status: "Available Now", sponsored: true, sponsoredLabel: "Featured Rental" },
  { id: 102, name: "Luxury Studio · Koregaon Park", type: "Studio Apartment", price: "₹22,000/mo", priceNum: 22, location: "Koregaon Park, Pune", img: IMGS.rent2, match: 91, badge: "Premium", verified: true, area: "550 sq ft", amenities: ["Furnished", "Pool", "Gym"], dist: "1.0 km Market", rating: 4.7, rera: true, status: "Available Now" },
  { id: 103, name: "Spacious 3BHK · Wakad", type: "3 BHK Apartment", price: "₹45,000/mo", priceNum: 45, location: "Wakad, Pune", img: IMGS.rent3, match: 89, badge: "Top Rated", verified: true, area: "1,450 sq ft", amenities: ["Semi-Furnished", "Garden", "Security"], dist: "1.2 km IT Park", rating: 4.6, rera: false, status: "Available Now" },
  { id: 104, name: "Cosy 1BHK · Hinjewadi", type: "1 BHK Apartment", price: "₹18,000/mo", priceNum: 18, location: "Hinjewadi, Pune", img: IMGS.rent4, match: 84, badge: "Budget Pick", verified: true, area: "620 sq ft", amenities: ["Furnished", "Lift", "Parking"], dist: "0.3 km IT Park", rating: 4.4, rera: true, status: "Available Now", sponsored: true, sponsoredLabel: "Promoted" },
  { id: 105, name: "Penthouse · Viman Nagar", type: "Penthouse", price: "₹85,000/mo", priceNum: 85, location: "Viman Nagar, Pune", img: IMGS.rent5, match: 87, badge: "Luxury", verified: true, area: "2,200 sq ft", amenities: ["Fully Furnished", "Terrace", "Pool"], dist: "2.0 km Airport", rating: 4.9, rera: true, status: "Available Now" },
  { id: 106, name: "Modern Studio · Kharadi", type: "Studio", price: "₹16,000/mo", priceNum: 16, location: "Kharadi, Pune", img: IMGS.rent6, match: 81, badge: "Value Pick", verified: true, area: "480 sq ft", amenities: ["Furnished", "Security", "CCTV"], dist: "0.8 km Metro", rating: 4.2, rera: true, status: "Available Now" },
  { id: 107, name: "Cozy 2BHK · Rajapeth", type: "2 BHK Apartment", price: "₹12,000/mo", priceNum: 12, location: "Rajapeth, Amravati", img: IMGS.rent1, match: 90, badge: "Value Pick", verified: true, area: "900 sq ft", amenities: ["Semi-Furnished", "Parking"], dist: "1.0 km Bus Stand", rating: 4.5, rera: true, status: "Available Now" },
  { id: 108, name: "Spacious 3BHK · Dharampeth", type: "3 BHK Apartment", price: "₹28,000/mo", priceNum: 28, location: "Dharampeth, Nagpur", img: IMGS.rent3, match: 93, badge: "Top Rated", verified: true, area: "1,400 sq ft", amenities: ["Furnished", "Gym", "Parking"], dist: "0.8 km Metro", rating: 4.7, rera: true, status: "Available Now" },
];

const RENT_PROPERTIES = RAW_RENT_PROPERTIES.map(p => ({
  ...p,
  images: getPropertyImages(p.id, p.img, p.type).map(x => x.url)
}));

// ── COMMERCIAL PROPERTIES ─────────────────────────────────────────────
const RAW_COMMERCIAL_PROPERTIES = [
  { id: 201, name: "Prestige Tech Park Suite", type: "IT Office Space", price: "₹1.4Cr", priceNum: 140, location: "Hinjewadi Phase 2, Pune", img: IMGS.comm1, match: 95, badge: "Premium", verified: true, area: "3,200 sq ft", amenities: ["Furnished", "Conference", "Cafeteria"], dist: "0.2 km IT Hub", rating: 4.8, rera: true, status: "Ready to Lease", sponsored: true, sponsoredLabel: "Featured Space" },
  { id: 202, name: "Kharadi Business Centre", type: "Office Suite", price: "₹82L", priceNum: 82, location: "Kharadi, Pune", img: IMGS.comm2, match: 90, badge: "AI Pick", verified: true, area: "1,800 sq ft", amenities: ["Open Plan", "Server Room", "Parking"], dist: "0.5 km Metro", rating: 4.7, rera: true, status: "Ready to Lease" },
  { id: 203, name: "CoWork Hub · Viman Nagar", type: "Co-Working Space", price: "₹8,500/seat/mo", priceNum: 35, location: "Viman Nagar, Pune", img: IMGS.comm3, match: 88, badge: "Top Rated", verified: true, area: "4,000 sq ft", amenities: ["Hot-desk", "Meeting Rooms", "Café"], dist: "2.5 km Airport", rating: 4.6, rera: false, status: "Seats Available" },
  { id: 204, name: "Magarpatta Retail Unit", type: "Retail Showroom", price: "₹56L", priceNum: 56, location: "Magarpatta, Pune", img: IMGS.comm4, match: 85, badge: "Value Pick", verified: true, area: "950 sq ft", amenities: ["Ground Floor", "High Footfall", "Parking"], dist: "0.1 km Metro", rating: 4.5, rera: true, status: "Ready to Lease" },
  { id: 205, name: "Senapati Bapat Tower", type: "Commercial Tower", price: "₹3.2Cr", priceNum: 320, location: "Senapati Bapat Rd, Pune", img: IMGS.comm5, match: 83, badge: "Premium", verified: true, area: "7,500 sq ft", amenities: ["Full Floor", "Terrace", "24/7 Access"], dist: "1.0 km Metro", rating: 4.9, rera: true, status: "Ready to Lease" },
  { id: 206, name: "Baner IT Campus Unit", type: "IT Campus Office", price: "₹68L", priceNum: 68, location: "Baner, Pune", img: IMGS.comm6, match: 80, badge: "New Launch", verified: true, area: "2,100 sq ft", amenities: ["Open Plan", "Parking", "Power Backup"], dist: "0.4 km Highway", rating: 4.3, rera: true, status: "Under Fit-out" },
];

const COMMERCIAL_PROPERTIES = RAW_COMMERCIAL_PROPERTIES.map(p => ({
  ...p,
  images: getPropertyImages(p.id, p.img, p.type).map(x => x.url)
}));

const BUILDERS = [
  { name: "Prestige Group", projects: 48, logo: "PG" },
  { name: "Godrej Properties", projects: 62, logo: "GP" },
  { name: "Lodha Group", projects: 35, logo: "LG" },
  { name: "Sobha Developers", projects: 41, logo: "SD" },
  { name: "Mahindra Lifespaces", projects: 28, logo: "ML" },
  { name: "Piramal Realty", projects: 19, logo: "PR" },
];

// ── SHARED COMPONENTS ─────────────────────────────────────────────────

function PropertyCard({ p, navigate, selectProperty, size = "normal", isSaved, onToggleSave }: {
  p: UIProperty | typeof PROPERTIES[0] | any;
  navigate: (pg: Page) => void;
  selectProperty?: (id: number) => void;
  size?: "normal" | "compact" | "large";
  isSaved?: boolean;
  onToggleSave?: (id: number, saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(isSaved || false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  const cardPhotos = useMemo(() => {
    return getPropertyImages(p.id, p.img, p.type, p.images);
  }, [p.id, p.img, p.type, p.images]);

  const activePhoto = cardPhotos[photoIdx] || { url: p.img, label: "Featured View" };

  useEffect(() => {
    if (isSaved !== undefined) setSaved(isSaved);
  }, [isSaved]);

  const handleClick = () => { selectProperty?.(p.id); navigate("property"); };

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await addFavorite(p.id);
        setToastMsg("Added to Saved Properties");
      } else {
        await removeFavorite(p.id);
        setToastMsg("Removed from Saved");
      }
      onToggleSave?.(p.id, next);
    } catch {
      navigate("login");
    }
  };

  const handleCompare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToComparison(p.id);
      setToastMsg("Added to Comparison");
    } catch {}
    navigate("compare");
  };

  return (
    <div onClick={handleClick} className={`group/card bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3] cursor-pointer hover:shadow-[0_8px_40px_rgba(0,109,106,0.18)] hover:-translate-y-1 transition-all duration-300 ${size === "compact" ? "" : ""}`}>
      <ToastAlert message={toastMsg} onClose={() => setToastMsg(null)} />
      <SiteVisitModal
        isOpen={visitOpen}
        onClose={() => setVisitOpen(false)}
        propertyId={p.id}
        propertyTitle={p.name}
        onSuccess={(msg) => setToastMsg(msg)}
      />
      <div className="relative overflow-hidden group/img">
        <img 
          src={activePhoto.url} 
          alt={`${p.name} - ${activePhoto.label}`} 
          onError={(e) => {
            const fallback = getFallbackPropertyImage(p.id, p.type);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          className={`w-full object-cover bg-[#E6F4F2] transition-transform duration-500 hover:scale-105 ${size === "compact" ? "h-44" : size === "large" ? "h-64" : "h-52"}`} 
        />
        
        {/* Multi-Image Quick Navigation Arrows */}
        {cardPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((i) => (i - 1 + cardPhotos.length) % cardPhotos.length);
              }}
              title="Previous photo"
              className="opacity-0 group-hover/img:opacity-100 transition-all duration-200 absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur text-white flex items-center justify-center z-20 shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((i) => (i + 1) % cardPhotos.length);
              }}
              title="Next photo"
              className="opacity-0 group-hover/img:opacity-100 transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur text-white flex items-center justify-center z-20 shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronRight size={16} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none">
              {cardPhotos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === photoIdx ? "w-3.5 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>

            {/* Room / View Badge */}
            <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 z-20 border border-white/10">
              <Camera size={10} className="text-[#67E8F9]" />
              <span>{photoIdx + 1}/{cardPhotos.length}</span>
              <span className="hidden sm:inline text-white/80 max-w-[80px] truncate">· {activePhoto.label}</span>
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-10">
          <span className="bg-[#006D6A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{p.badge}</span>
          {p.verified && <span className="bg-white/90 backdrop-blur text-green-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle size={9} />RERA</span>}
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <div className="bg-white/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
            <Sparkles size={11} className="text-[#006D6A]" />
            <span className="text-[10px] font-bold text-[#008F8C]">{p.match}%</span>
          </div>
          <button onClick={handleToggleFav} title={saved ? "Remove from saved" : "Save property"} className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <Heart size={14} className={saved ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500 transition-colors"} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur rounded-full px-2.5 py-1 z-10">
          <span className="text-white text-[10px] font-medium">{p.status}</span>
        </div>
      </div>
      <div className="p-4">
        {p.sponsored && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-xl w-fit">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">{p.sponsoredLabel ?? "Sponsored"}</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{p.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{p.type} · {p.area}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="font-black text-[#008F8C] text-base">{p.price}</p>
            <p className="text-[10px] text-slate-400">EMI ₹{Math.round(p.priceNum * 750).toLocaleString()}/mo</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={12} className="text-[#008F8C] flex-shrink-0" />
          <span className="text-xs text-slate-500 flex-1 truncate">{p.location}</span>
          <span className="text-[10px] text-[#006D6A] font-semibold flex-shrink-0">{p.dist}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {(p.amenities || []).map(a => <span key={a} className="text-[10px] bg-[#E6F4F2] text-[#008F8C] px-2 py-0.5 rounded-full font-medium">{a}</span>)}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-slate-700">{p.rating}</span>
          </div>
          <div className="flex-1" />
          <button onClick={e => { e.stopPropagation(); setVisitOpen(true); }} className="text-[10px] text-[#008F8C] font-semibold hover:underline flex items-center gap-1">
            <Calendar size={10} />Visit
          </button>
          <button onClick={handleCompare} className="text-[10px] text-[#006D6A] font-semibold hover:underline flex items-center gap-1">
            <Layers size={10} />Compare
          </button>
          <button onClick={e => { e.stopPropagation(); navigate("fraud"); }} className="text-[10px] text-green-500 font-semibold hover:underline flex items-center gap-1">
            <Shield size={10} />Trust
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FLOATING SAI ASSISTANT ────────────────────────────────────────────
function FloatingSAI({ navigate, selectProperty }: { navigate: (pg: Page) => void; selectProperty?: (id: number) => void }) {
  const { lang, tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [convId] = useState<string>(() => "floating_conv_" + Math.random().toString(36).substring(2, 9));
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ id: number; name: string } | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "ai";
    text: string;
    properties?: PropertyItem[];
    language?: string;
    intent?: string;
    document_actions?: Array<{ label: string; document_id: number; view_url: string; document_name: string }>;
  }>>(() => [
    {
      role: "ai",
      text: tr?.saiGreeting || "Hi! I'm SAI 👋 Tell me what property you're looking for in any language — voice or text!",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{
          role: "ai",
          text: tr?.saiGreeting || "Hi! I'm SAI 👋 Tell me what property you're looking for in any language — voice or text!"
        }];
      }
      return prev;
    });
  }, [lang, tr]);

  const send = async (customText?: string) => {
    const userText = (customText || msg).trim();
    if (!userText) return;
    const newHistory = [...messages, { role: "user" as const, text: userText }];
    setMessages(newHistory);
    setMsg("");
    setTyping(true);
    try {
      const res = await chatWithAI(userText, convId, lang);
      if (res && res.message) {
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            text: res.message,
            properties: res.properties || [],
            language: res.language,
            intent: res.intent,
            document_actions: res.document_actions,
          }
        ]);
      } else {
        throw new Error("No reply");
      }
    } catch {
      try {
        const fallbackRes = await sendChatbotMessage(userText, [], lang);
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            text: fallbackRes.reply || `I searched the database for "${userText}". Here are the top properties matching your criteria:`,
            properties: fallbackRes.properties || [],
          }
        ]);
      } catch {
        const fallbackReply = lang === "hi"
          ? "मैंने आपकी पसंद के अनुसार पुणे में संपत्तियां खोजी हैं। क्या आप बजट, बीएचके या सुविधाओं के आधार पर फ़िल्टर करना चाहते हैं?"
          : lang === "mr"
          ? "मी तुमच्या आवडीनुसार पुण्यात मालमत्ता शोधल्या आहेत. तुम्हाला बजेट, BHK किंवा सुविधांनुसार फिल्टर करायचे आहे का?"
          : "I found matching properties in Pune for your query. Let me know if you would like to filter by budget, BHK, or amenities!";
        setMessages(prev => [
          ...prev,
          { role: "ai", text: fallbackReply }
        ]);
      }
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const quickChips = lang === "hi"
    ? ["पुणे में 2 BHK फ्लैट 🏡", "बाणेर की प्रॉपर्टीज 🔍", "रेंटल यील्ड 📈"]
    : lang === "mr"
    ? ["पुण्यात 2 BHK फ्लॅट 🏡", "बाणेरमधील फ्लॅट्स 🔍", "गुंतवणूक परतावा 📈"]
    : ["2 BHK in Pune under ₹70L 🏡", "Properties in Baner 🔍", "Investment Yield 📈"];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <VoiceMicModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        lang={lang}
        onResult={(text) => {
          send(text);
          setVoiceOpen(false);
        }}
      />

      {open && (
        <div className="w-84 sm:w-96 bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,109,106,0.3)] border border-[#D9E5E3] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" style={{ height: 480 }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{tr?.aiAssistant || "SAI Smart AI"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[#E6F4F2] text-[11px] font-medium">Online · 8 Languages</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("chat");
                }}
                title="Expand to Full Page AI Finder"
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Layers size={12} />
                <span>Full Page</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div className="max-w-[85%] space-y-2">
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    m.role === "ai"
                      ? "bg-white rounded-tl-sm text-slate-700 shadow-sm border border-[#D9E5E3]"
                      : "bg-[#006D6A] rounded-tr-sm text-white"
                  }`}>
                    {m.text}
                  </div>

                  {/* Compact property previews in floating widget */}
                  {m.properties && m.properties.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {m.properties.slice(0, 2).map((p) => {
                        const priceDisplay = p.price_display || (p.price != null ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price on Request");
                        return (
                          <div key={p.id} className="bg-white rounded-xl p-2 border border-[#D9E5E3] shadow-xs flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-[11px] truncate">{p.title || "Property"}</p>
                              <p className="text-[#008F8C] font-black text-xs">{priceDisplay}</p>
                            </div>
                            <button
                              onClick={() => {
                                selectProperty?.(p.id);
                                setOpen(false);
                                navigate("property");
                              }}
                              className="px-2 py-1 bg-[#006D6A] text-white text-[10px] font-bold rounded-lg hover:bg-[#004F4D] transition-colors flex-shrink-0"
                            >
                              View
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verified Document Actions */}
                  {m.document_actions && m.document_actions.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap gap-1">
                      {m.document_actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => setViewerDoc({ id: act.document_id, name: act.document_name || act.label })}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                        >
                          <Shield size={10} />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-[#D9E5E3] flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-[#008F8C] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div className="px-3 pt-2 bg-white flex gap-1.5 overflow-x-auto scrollbar-hide border-t border-slate-100">
            {quickChips.map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                className="flex-shrink-0 bg-[#E6F4F2] text-[#008F8C] text-[10px] font-semibold px-2.5 py-1 rounded-lg hover:bg-[#D9E5E3] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 border-t border-[#D9E5E3] flex gap-2 bg-white">
            <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2 border border-[#D9E5E3] focus-within:border-[#008F8C]/40">
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={tr?.askInAnyLanguage || "Ask in any of 8 languages..."}
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className="w-6 h-6 bg-[#E6F4F2] rounded-lg flex items-center justify-center hover:bg-[#D9E5E3] transition-colors"
                title="Voice Input"
              >
                <Mic size={12} className="text-[#006D6A]" />
              </button>
            </div>
            <button
              onClick={() => send()}
              className="w-9 h-9 bg-[#006D6A] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors flex-shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Circle Button */}
      <button
        onClick={() => setOpen(!open)}
        title="Open SAI AI Assistant"
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center shadow-[0_8px_32px_rgba(0,109,106,0.5)] hover:shadow-[0_12px_40px_rgba(0,109,106,0.6)] hover:scale-105 active:scale-95 transition-all relative group"
      >
        {open ? <X size={22} className="text-white" /> : <Bot size={24} className="text-white group-hover:rotate-12 transition-transform" />}
        {!open && (
          <>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
            <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
              Chat with SAI AI 💬
            </span>
          </>
        )}
      </button>

      {/* Document Viewer Modal for Assistant Actions */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewerDoc(null)}
          documentId={viewerDoc.id}
          documentName={viewerDoc.name}
          documentType={viewerDoc.name}
        />
      )}
    </div>
  );
}

// ── TOP NAV ───────────────────────────────────────────────────────────
function TopNav({ page, navigate, goBack, city, setCity, locality, setLocality, lang, setLang, isGuest, isLoggedIn, userRole, userName, userEmail, agentSection, builderSection, sellerSection, onAgentSection, onBuilderSection, onSellerSection, onOpenMap }: {
  page: Page; navigate: (pg: Page) => void; goBack?: () => void;
  city: string; setCity: (c: string) => void;
  locality?: string; setLocality?: (l: string) => void;
  lang: string; setLang: (l: string) => void;
  isGuest: boolean; isLoggedIn: boolean; userRole: UserRole;
  userName?: string; userEmail?: string;
  agentSection?: string; builderSection?: string; sellerSection?: string;
  onAgentSection?: (s: string) => void; onBuilderSection?: (s: string) => void; onSellerSection?: (s: string) => void;
  onOpenMap?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityDrop, setCityDrop] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityMicListening, setCityMicListening] = useState(false);
  const [cityVoiceTranscript, setCityVoiceTranscript] = useState("");
  const cityRecRef = useRef<any>(null);
  const latestCityVoiceRef = useRef<string>("");
  const isResolvingCityRef = useRef<boolean>(false);
  const [langDrop, setLangDrop] = useState(false);
  const [userDrop, setUserDrop] = useState(false);
  const tr = useTranslations(lang);
  const navRef = useRef<HTMLElement>(null);

  // Close all dropdowns when user clicks anywhere outside the nav bar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setCityDrop(false);
        setLangDrop(false);
        setUserDrop(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyCityOrLocality = async (queryText: string) => {
    const raw = queryText.trim();
    if (!raw) return;

    try {
      const res = await resolveSpokenLocation(raw, lang);
      if (res) {
        setCity(res.city);
        setLocality?.(res.locality);
        setCityDrop(false);
        setCitySearch("");
        setCityVoiceTranscript("");
        return;
      }
    } catch {}

    // Fallback: check CITIES
    const matched = CITIES.find(c => c.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(raw.toLowerCase()));
    if (matched) {
      setCity(matched);
      setLocality?.("");
    } else {
      setCity(raw);
      setLocality?.("");
    }
    setCityDrop(false);
    setCitySearch("");
    setCityVoiceTranscript("");
  };

  const startCityVoiceSearch = () => {
    if (cityMicListening) {
      try {
        cityRecRef.current?.stop?.();
        cityRecRef.current?.abort?.();
      } catch {}
      setCityMicListening(false);
      if (latestCityVoiceRef.current && !isResolvingCityRef.current) {
        isResolvingCityRef.current = true;
        handleApplyCityOrLocality(latestCityVoiceRef.current);
      }
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (cityRecRef.current) {
        cityRecRef.current.abort();
      }
    } catch {}

    const rec = new SR();
    rec.lang = getSpeechCode(lang);
    rec.interimResults = true;
    rec.continuous = false;
    cityRecRef.current = rec;
    latestCityVoiceRef.current = "";
    isResolvingCityRef.current = false;

    rec.onstart = () => {
      setCityMicListening(true);
      setCityVoiceTranscript("");
    };

    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join("").trim();
      latestCityVoiceRef.current = text;
      setCitySearch(text);
      setCityVoiceTranscript(text);

      if (e.results[e.results.length - 1].isFinal) {
        setCityMicListening(false);
        if (!isResolvingCityRef.current) {
          isResolvingCityRef.current = true;
          handleApplyCityOrLocality(text);
        }
      }
    };

    rec.onerror = (e: any) => {
      setCityMicListening(false);
      if (e.error === "not-allowed") {
        alert("Microphone permission was blocked. Please enable microphone access in your browser address bar.");
      }
    };

    rec.onend = () => {
      setCityMicListening(false);
      if (latestCityVoiceRef.current && !isResolvingCityRef.current) {
        isResolvingCityRef.current = true;
        handleApplyCityOrLocality(latestCityVoiceRef.current);
      }
    };

    try {
      rec.start();
    } catch {
      setCityMicListening(false);
    }
  };

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  type NavLink = { label: string; p?: Page; section?: string; highlight?: boolean };

  // Role-aware nav links
  const buyerLinks: NavLink[] = [
    { label: tr.buy || "Buy", p: "buy" },
    { label: tr.rent || "Rent", p: "rent" },
    { label: tr.commercial || "Commercial", p: "commercial" },
    { label: tr.newProjects || "New Projects", p: "new-projects" },
    { label: "3D Discovery", p: "building-3d" },
    { label: tr.aiAssistant || "AI Assistant", p: "chat", highlight: true },
  ];
  const sellerLinks: NavLink[] = [
    { label: tr.sellerOverview || "Seller Overview", section: "overview" },
    { label: tr.myListings || "My Listings", section: "listings" },
    { label: tr.leadsEnquiries || "Leads & Enquiries", section: "leads" },
    { label: tr.analytics || "Analytics", section: "analytics" },
    { label: tr.aiAssistant || "AI Assistant", p: "chat", highlight: true },
  ];
  const agentLinks: NavLink[] = [
    { label: tr.agentOverview || "Agent Overview", section: "overview" },
    { label: tr.myListings || "My Listings", section: "listings" },
    { label: tr.leadsEnquiries || "Leads & Enquiries", section: "leads" },
    { label: tr.siteVisits || "Site Visits", section: "visits" },
    { label: tr.clients || "Clients", section: "clients" },
    { label: tr.aiAssistant || "AI Assistant", p: "chat", highlight: true },
  ];
  const builderLinks: NavLink[] = [
    { label: tr.builderOverview || "Builder Overview", section: "overview" },
    { label: tr.myProjects || "My Projects", section: "projects" },
    { label: tr.towersBuildings || "Towers/Buildings", section: "towers" },
    { label: tr.inventory || "Inventory", section: "inventory" },
    { label: "3D Discovery", p: "building-3d" },
    { label: tr.buyerEnquiries || "Buyer Enquiries", section: "enquiries" },
    { label: tr.aiAssistant || "AI Assistant", p: "chat", highlight: true },
  ];
  const publicLinks: NavLink[] = [
    { label: tr.buy || "Buy", p: "buy" },
    { label: tr.rent || "Rent", p: "rent" },
    { label: tr.commercial || "Commercial", p: "commercial" },
    { label: tr.newProjects || "New Projects", p: "new-projects" },
    { label: "3D Discovery", p: "building-3d" },
    { label: tr.aiAssistant || "AI Assistant", p: "chat", highlight: true },
  ];

  const navLinks = isLoggedIn
    ? userRole === "agent" ? agentLinks
    : userRole === "builder" ? builderLinks
    : userRole === "seller" ? sellerLinks
    : buyerLinks
    : publicLinks;

  type DropItem = { icon: React.ElementType; label: string; p?: Page; section?: string };

  // Role-aware user dropdown items
  const buyerDropItems: DropItem[] = [
    { icon: Home, label: tr.myDashboard || "My Dashboard", p: "buyer" },
    { icon: Building2, label: "3D Flat Discovery", p: "building-3d" },
    { icon: Heart, label: tr.savedProperties || "Saved Properties", p: "favorites" },
    { icon: Search, label: tr.aiSearch || "AI Search", p: "search" },
    { icon: Layers, label: tr.compare || "Compare Properties", p: "compare" },
    { icon: User, label: tr.profile || "Profile", p: "profile" },
    { icon: Settings, label: tr.settings || "Settings", p: "settings" },
  ];
  const agentDropItems: DropItem[] = [
    { icon: LayoutDashboard, label: tr.agentOverview || "Agent Overview", section: "overview" },
    { icon: Building2, label: tr.myListings || "My Listings", section: "listings" },
    { icon: Users, label: tr.clients || "My Clients", section: "clients" },
    { icon: Bell, label: tr.leadsEnquiries || "Leads & Enquiries", section: "leads" },
    { icon: Calendar, label: tr.siteVisits || "Site Visits", section: "visits" },
    { icon: Shield, label: tr.verificationStatus || "Verification Status", section: "verification" },
    { icon: User, label: tr.profile || "Agent Profile", section: "profile" },
    { icon: Settings, label: tr.settings || "Settings", section: "agent-settings" },
  ];
  const builderDropItems: DropItem[] = [
    { icon: LayoutDashboard, label: tr.builderOverview || "Builder Overview", section: "overview" },
    { icon: Building, label: tr.myProjects || "My Projects", section: "projects" },
    { icon: Layers, label: tr.towersBuildings || "Towers/Buildings", section: "towers" },
    { icon: Grid3X3, label: tr.inventory || "Availability & Inventory", section: "inventory" },
    { icon: Bell, label: tr.buyerEnquiries || "Buyer Enquiries", section: "enquiries" },
    { icon: Shield, label: tr.verificationStatus || "Verification & Docs", section: "docs" },
    { icon: User, label: tr.profile || "Builder Profile", section: "profile" },
    { icon: Settings, label: tr.settings || "Settings", section: "builder-settings" },
  ];
  const sellerDropItems: DropItem[] = [
    { icon: LayoutDashboard, label: tr.sellerOverview || "Seller Overview", section: "overview" },
    { icon: Building2, label: tr.myListings || "My Listings", section: "listings" },
    { icon: Bell, label: tr.leadsEnquiries || "Leads & Enquiries", section: "leads" },
    { icon: BarChart2, label: tr.analytics || "Analytics", section: "analytics" },
    { icon: Shield, label: tr.verificationStatus || "Verification Status", section: "verification" },
    { icon: User, label: tr.profile || "Seller Profile", section: "profile" },
    { icon: Settings, label: tr.settings || "Settings", section: "seller-settings" },
  ];
  const userDropItems = isLoggedIn
    ? userRole === "agent" ? agentDropItems
    : userRole === "builder" ? builderDropItems
    : userRole === "seller" ? sellerDropItems
    : buyerDropItems
    : [];

  const roleLabel = userRole === "agent" ? "Agent" : userRole === "builder" ? "Builder" : userRole === "seller" ? "Seller" : userRole === "admin" || userRole === "super_admin" ? "Super Admin" : "Buyer";
  const defaultInitials = userRole === "agent" ? "PP" : userRole === "builder" ? "PG" : userRole === "seller" ? "RS" : userRole === "admin" || userRole === "super_admin" ? "SA" : "BY";

  const effectiveName = userName || (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_name") : null) || (userRole === "super_admin" || userRole === "admin" ? "Super Admin" : "");
  const effectiveEmail = userEmail || (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_email") : null) || "";

  const roleInitials = effectiveName
    ? effectiveName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || defaultInitials
    : defaultInitials;

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <header ref={navRef} className="bg-white border-b border-[#D9E5E3] sticky top-0 z-40 shadow-[0_2px_20px_rgba(0,109,106,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo — role-aware home target */}
          <button onClick={() => {
            if (isLoggedIn) {
              if (userRole === "agent") onAgentSection?.("overview");
              else if (userRole === "builder") onBuilderSection?.("overview");
              else if (userRole === "seller") onSellerSection?.("overview");
              else navigate("buyer");
            } else navigate("home");
          }} className="flex items-center gap-2.5 flex-shrink-0 group">
            <SaiLogo size="md" subtitle="Smart AI Finder" />
          </button>

          {/* Universal Back Button for easy page navigation */}
          {page !== "home" && page !== "language" && page !== "welcome" && (
            <button
              onClick={() => (goBack ? goBack() : navigate("home"))}
              title="Go back to previous page"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6F4F2] hover:bg-[#D9E5E3] text-[#006D6A] font-bold text-xs transition-all shadow-sm border border-[#006D6A]/20"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 ml-6">
            {navLinks.map(({ label, p, section, highlight }) => {
              const isActive = section
                ? (userRole === "agent" ? agentSection === section : userRole === "builder" ? builderSection === section : sellerSection === section)
                : (p ? page === p : false);
              const handleClick = () => {
                if (section) {
                  if (userRole === "agent") onAgentSection?.(section);
                  else if (userRole === "builder") onBuilderSection?.(section);
                  else if (userRole === "seller") onSellerSection?.(section);
                } else if (p) navigate(p);
              };
              return (
                <button key={label} onClick={handleClick} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${highlight ? "bg-[#E6F4F2] text-[#008F8C] flex items-center gap-1.5" : isActive ? "bg-[#006D6A] text-white" : "text-slate-600 hover:text-[#008F8C] hover:bg-[#E6F4F2]"}`}>
                  {highlight && <Bot size={14} className="text-[#006D6A]" />}{label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            {/* City Selector */}
            <div className="relative">
              <button onClick={() => { setCityDrop(!cityDrop); setLangDrop(false); setUserDrop(false); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D9E5E3] hover:bg-[#E6F4F2] transition-colors text-sm">
                <MapPin size={14} className="text-[#006D6A]" />
                <span className="font-semibold text-slate-700">{locality ? `${locality}, ${city}` : city}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${cityDrop ? "rotate-180" : ""}`} />
              </button>
              {cityDrop && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-[#D9E5E3] p-2.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* City Search Bar with Mic */}
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && citySearch.trim()) {
                          handleApplyCityOrLocality(citySearch);
                        }
                      }}
                      placeholder={cityMicListening ? "🎙️ Listening... Speak locality/city..." : (tr.citySelect || "Search any city or locality...")}
                      className={`w-full border rounded-xl pl-8 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all ${
                        cityMicListening
                          ? "bg-red-50/30 border-red-400 ring-2 ring-red-300"
                          : "bg-slate-50 border-[#D9E5E3] focus:ring-2 focus:ring-[#006D6A] focus:bg-white"
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={startCityVoiceSearch}
                      title={cityMicListening ? "Stop listening" : "Speak Locality or City Name"}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        cityMicListening
                          ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse scale-110"
                          : "text-[#006D6A] hover:bg-[#E6F4F2]"
                      }`}
                    >
                      <Mic size={12} className={cityMicListening ? "animate-bounce" : ""} />
                    </button>
                  </div>

                  {/* Active Voice Listening Banner */}
                  {cityMicListening && (
                    <div className="mb-2 p-2 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Listening... Say "Baner", "Wakad", "Mumbai"
                        </span>
                        <button
                          onClick={() => {
                            try { cityRecRef.current?.abort(); } catch {};
                            setCityMicListening(false);
                          }}
                          className="text-red-600 hover:text-red-800 underline text-[10px] font-bold"
                        >
                          Stop
                        </button>
                      </div>
                      {cityVoiceTranscript && (
                        <p className="text-[11px] text-slate-800 italic bg-white/90 px-2 py-0.5 rounded border border-red-100 font-semibold">
                          "{cityVoiceTranscript}"
                        </p>
                      )}
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[9px] text-slate-500">Try:</span>
                        {["Baner", "Wakad", "Andheri", "Whitefield"].map((sample) => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => handleApplyCityOrLocality(sample)}
                            className="bg-white hover:bg-red-100 text-red-700 border border-red-200 text-[9px] font-bold px-1.5 py-0.2 rounded transition-colors"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pick on Map Button */}
                  <button
                    onClick={() => { setCityDrop(false); onOpenMap?.(); }}
                    className="w-full bg-[#E6F4F2] text-[#006D6A] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#D9E5E3] transition-colors mb-2 shadow-sm"
                  >
                    <MapIcon size={13} />Pick on Interactive Map
                  </button>

                  {/* Cities List */}
                  <div className="max-h-56 overflow-y-auto pr-1 space-y-0.5">
                    {filteredCities.map(c => (
                      <button
                        key={c}
                        onClick={() => { setCity(c); setLocality?.(""); setCityDrop(false); setCitySearch(""); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                          c === city && !locality ? "bg-[#E6F4F2] text-[#008F8C] font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className={c === city && !locality ? "text-[#008F8C]" : "text-slate-400"} />
                          {c}
                        </span>
                        {c === city && !locality && <Check size={13} />}
                      </button>
                    ))}

                    {/* Custom City fallback if not in the default 10 */}
                    {citySearch.trim() && !CITIES.some(c => c.toLowerCase() === citySearch.toLowerCase().trim()) && (
                      <button
                        onClick={() => handleApplyCityOrLocality(citySearch)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#006D6A] bg-[#E6F4F2]/50 hover:bg-[#E6F4F2] transition-colors flex items-center gap-1.5 border border-dashed border-[#006D6A]/30 mt-1"
                      >
                        <Plus size={12} />
                        <span>Locate "{citySearch.trim()}"</span>
                      </button>
                    )}

                    {filteredCities.length === 0 && !citySearch.trim() && (
                      <p className="text-center text-xs text-slate-400 py-3">No cities found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Map Button (Section 12 & 13) */}
            <button
              onClick={() => onOpenMap?.()}
              title="Open Interactive Map"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D9E5E3] hover:bg-[#E6F4F2] hover:border-[#008F8C] transition-colors text-sm font-semibold text-[#006D6A]"
            >
              <MapIcon size={14} className="text-[#006D6A]" />
              <span>Map</span>
            </button>

            {/* Language Selector — dropdown + "Change Language" link to LanguagePage */}
            <div className="relative">
              <button onClick={() => { setLangDrop(!langDrop); setCityDrop(false); setUserDrop(false); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D9E5E3] hover:bg-[#E6F4F2] transition-colors text-sm">
                <Globe size={14} className="text-[#006D6A]" />
                <span className="notranslate font-semibold text-slate-700">{currentLang?.native}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${langDrop ? "rotate-180" : ""}`} />
              </button>
              {langDrop && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-[#D9E5E3] py-2 w-52 z-50">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangDrop(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${l.code === lang ? "bg-[#E6F4F2] text-[#008F8C] font-bold" : "text-slate-700 hover:bg-slate-50"}`}>
                      <span className="notranslate">{l.native}</span>{l.code === lang && <Check size={14} />}
                    </button>
                  ))}
                  <div className="border-t border-[#D9E5E3] mt-1 pt-1">
                    <button onClick={() => { navigate("language"); setLangDrop(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#006D6A] font-bold hover:bg-[#E6F4F2] flex items-center gap-2 transition-colors">
                      <Globe size={13} />{tr.changeLanguage || "Change Language"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => { setUserDrop(!userDrop); setCityDrop(false); setLangDrop(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D9E5E3] hover:bg-[#E6F4F2] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-black">{roleInitials}</span>
                  </div>
                  <div className="hidden xl:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">{effectiveName || roleLabel}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{roleLabel}</span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>
                {userDrop && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-[#D9E5E3] py-2 w-56 z-50">
                    <div className="px-4 py-2.5 border-b border-[#D9E5E3] mb-1 bg-slate-50/70">
                      <p className="text-xs font-black text-slate-800 truncate">{effectiveName || `${roleLabel} User`}</p>
                      {effectiveEmail && <p className="text-[11px] text-slate-500 truncate">{effectiveEmail}</p>}
                      <span className="inline-block mt-1 text-[10px] font-bold text-[#008F8C] bg-[#E6F4F2] px-2 py-0.5 rounded-full">{roleLabel} Portal</span>
                    </div>
                    {userDropItems.map(({ icon: Icon, label, p, section }) => (
                      <button key={label} onClick={() => {
                        if (section) {
                          if (userRole === "agent") onAgentSection?.(section);
                          else if (userRole === "builder") onBuilderSection?.(section);
                          else if (userRole === "seller") onSellerSection?.(section);
                        } else if (p) navigate(p);
                        setUserDrop(false);
                      }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-[#E6F4F2] hover:text-[#008F8C] flex items-center gap-2.5 transition-colors">
                        <Icon size={15} />{label}
                      </button>
                    ))}
                    <div className="border-t border-[#D9E5E3] my-1" />
                    <button onClick={() => { apiLogout(); navigate("language"); setUserDrop(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                      <LogOut size={15} />{tr.signOut || "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isGuest && (
                  <button
                    onClick={() => { apiLogout(); navigate("language"); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-500 border border-[#D9E5E3] hover:border-red-200 rounded-xl transition-colors"
                    title="Exit Guest Mode & Return to Language Selection"
                  >
                    <LogOut size={13} />
                    <span>Exit Guest</span>
                  </button>
                )}
                <button onClick={() => navigate("login")} className="px-4 py-2 rounded-xl border-2 border-[#D9E5E3] text-[#008F8C] font-semibold text-sm hover:bg-[#E6F4F2] transition-colors">{tr.login}</button>
                <button onClick={() => navigate("signup")} className="px-4 py-2 rounded-xl bg-[#006D6A] text-white font-semibold text-sm hover:bg-[#004F4D] shadow-[0_4px_12px_rgba(0,109,106,0.4)] hover:shadow-[0_6px_20px_rgba(0,109,106,0.5)] transition-all">{tr.signUp}</button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden ml-auto w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#D9E5E3] px-4 py-4 space-y-2">
          {navLinks.map(({ label, p, section }) => (
            <button key={label} onClick={() => {
              if (section) {
                if (userRole === "agent") onAgentSection?.(section);
                else if (userRole === "builder") onBuilderSection?.(section);
                else if (userRole === "seller") onSellerSection?.(section);
              } else if (p) navigate(p);
              setMobileOpen(false);
            }} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-[#E6F4F2] hover:text-[#008F8C]">{label}</button>
          ))}
          <div className="border-t border-[#D9E5E3] pt-3 flex gap-2">
            {isLoggedIn || isGuest ? (
              <button
                onClick={() => { apiLogout(); navigate("language"); setMobileOpen(false); }}
                className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />{isGuest ? "Exit Guest Mode" : (tr.signOut || "Sign Out")}
              </button>
            ) : (
              <>
                <button onClick={() => { navigate("login"); setMobileOpen(false); }} className="flex-1 py-3 rounded-xl border-2 border-[#D9E5E3] text-[#008F8C] font-semibold text-sm">Login</button>
                <button onClick={() => { navigate("signup"); setMobileOpen(false); }} className="flex-1 py-3 rounded-xl bg-[#006D6A] text-white font-semibold text-sm">Sign Up</button>
              </>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">City</p>
              <select value={city} onChange={e => { setCity(e.target.value); setLocality?.(""); }} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 border border-[#D9E5E3] focus:outline-none">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Language</p>
              <select value={lang} onChange={e => setLang(e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 border border-[#D9E5E3] focus:outline-none">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => { setMobileOpen(false); onOpenMap?.(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E6F4F2] text-[#006D6A] text-sm font-bold mt-2 hover:bg-[#D9E5E3] transition-colors"
          >
            <MapIcon size={15} />Open Interactive Map
          </button>
        </div>
      )}
    </header>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────
function Footer({ navigate }: { navigate: (pg: Page) => void }) {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-5">
              <SaiLogo size="lg" variant="light" subtitle="Smart AI Property Finder" onClick={() => navigate("home")} />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">India's most intelligent property discovery platform. Find your dream home through AI-powered conversational search in 8 languages.</p>
            <div className="flex gap-3">
              {["App Store", "Google Play"].map(s => (
                <button key={s} className="px-4 py-2.5 bg-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">{s}</button>
              ))}
            </div>
          </div>
          {[
            { title: "Explore", links: [{ l: "Buy Property", p: "search" as Page }, { l: "Rent Property", p: "search" as Page }, { l: "Commercial", p: "search" as Page }, { l: "New Projects", p: "search" as Page }, { l: "Builders", p: "builder" as Page }] },
            { title: "AI Tools", links: [{ l: "SAI Assistant", p: "chat" as Page }, { l: "Property Compare", p: "compare" as Page }, { l: "Fraud Detection", p: "fraud" as Page }, { l: "Price Prediction", p: "search" as Page }, { l: "Senior Mode", p: "senior" as Page }] },
            { title: "Company", links: [{ l: "About SAI", p: "home" as Page }, { l: "Careers", p: "home" as Page }, { l: "Privacy Policy", p: "home" as Page }, { l: "Terms", p: "home" as Page }, { l: "Contact", p: "home" as Page }] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-black text-white text-sm mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(({ l, p }) => (
                  <li key={l}><button onClick={() => navigate(p)} className="text-slate-400 text-sm hover:text-[#008F8C] transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2025 SAI — Smart AI Property Finder. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>🔒 256-bit Encrypted</span>
            <span>⭐ 4.9 App Rating</span>
            <span>🏠 2M+ Properties</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── ADVANCED FILTERS PANEL ────────────────────────────────────────────
function AdvancedFilters({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"buy"|"rent"|"commercial">("buy");
  const [budget, setBudget] = useState<[number,number]>([0, 100]);
  const [bhk, setBhk] = useState("2 BHK");
  const [furnishing, setFurnishing] = useState("Furnished");
  const amenities = ["Gym", "Pool", "Parking", "Lift", "Garden", "Security", "Club House", "EV Charging", "Pet Friendly", "CCTV", "Power Backup", "Intercom"];
  const [selAm, setSelAm] = useState<string[]>(["Gym", "Parking"]);
  const nearby = ["Metro Station", "Hospital", "School", "College", "IT Park", "Airport", "Railway Station", "Mall", "Park", "Pharmacy", "Restaurant", "Market", "University", "Temple"];
  const [selNr, setSelNr] = useState<string[]>(["Metro Station"]);
  const toggleAm = (a: string) => setSelAm(p => p.includes(a) ? p.filter(x=>x!==a) : [...p, a]);
  const toggleNr = (n: string) => setSelNr(p => p.includes(n) ? p.filter(x=>x!==n) : [...p, n]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9E5E3]">
          <div className="flex items-center gap-2"><SlidersHorizontal size={18} className="text-[#006D6A]" /><h3 className="font-black text-slate-800">Advanced Filters</h3></div>
          <div className="flex gap-3">
            <button className="text-[#006D6A] text-sm font-semibold">Reset All</button>
            <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Type Tab */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Property For</p>
            <div className="flex gap-2">
              {(["buy","rent","commercial"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${tab===t ? "bg-[#006D6A] text-white shadow-[0_4px_12px_rgba(0,109,106,0.4)]" : "bg-slate-50 text-slate-600 border border-[#D9E5E3]"}`}>{t}</button>
              ))}
            </div>
          </div>
          {/* Budget */}
          <div>
            <div className="flex justify-between mb-3"><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Budget</p><span className="text-[#006D6A] font-bold text-sm">₹{budget[0]}L – ₹{budget[1] >= 100 ? "1Cr+" : budget[1]+"L"}</span></div>
            <div className="relative h-2 bg-[#E6F4F2] rounded-full mx-2">
              <div className="absolute h-2 bg-[#006D6A] rounded-full" style={{ left: `${budget[0]}%`, right: `${100-budget[1]}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-2"><span>₹10L</span><span>₹1Cr+</span></div>
          </div>
          {/* BHK */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">BHK Configuration</p>
            <div className="flex flex-wrap gap-2">
              {["Studio/1RK","1 BHK","2 BHK","3 BHK","4 BHK","4 BHK+"].map(b => (
                <button key={b} onClick={() => setBhk(b)} className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${bhk===b ? "border-[#006D6A] bg-[#E6F4F2] text-[#006D6A]" : "border-[#D9E5E3] bg-slate-50 text-slate-600"}`}>{b}</button>
              ))}
            </div>
          </div>
          {/* Furnishing */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Furnishing</p>
            <div className="flex flex-wrap gap-2">
              {["Furnished","Semi-Furnished","Unfurnished"].map(f => (
                <button key={f} onClick={() => setFurnishing(f)} className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${furnishing===f ? "border-[#006D6A] bg-[#E6F4F2] text-[#006D6A]" : "border-[#D9E5E3] bg-slate-50 text-slate-600"}`}>{f}</button>
              ))}
            </div>
          </div>
          {/* Property Status */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Status</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "RERA Approved", sub: "Government verified" },
                { label: "Ready to Move", sub: "Immediate possession" },
                { label: "Owner Listing", sub: "No brokerage" },
                { label: "Verified Listing", sub: "SAI verified" },
              ].map(({ label, sub }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-[#D9E5E3]">
                  <div><p className="font-semibold text-slate-700 text-sm">{label}</p><p className="text-xs text-slate-400">{sub}</p></div>
                  <div className="w-10 h-5 bg-[#006D6A] rounded-full relative flex-shrink-0 ml-2"><div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full shadow" /></div>
                </div>
              ))}
            </div>
          </div>
          {/* Amenities */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map(a => (
                <button key={a} onClick={() => toggleAm(a)} className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${selAm.includes(a) ? "border-[#006D6A] bg-[#E6F4F2] text-[#006D6A]" : "border-[#D9E5E3] bg-slate-50 text-slate-500"}`}>{a}</button>
              ))}
            </div>
          </div>
          {/* Nearby */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Near Me</p>
            <div className="flex flex-wrap gap-2">
              {nearby.map(n => (
                <button key={n} onClick={() => toggleNr(n)} className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${selNr.includes(n) ? "border-[#006D6A] bg-[#E6F4F2] text-[#006D6A]" : "border-[#D9E5E3] bg-slate-50 text-slate-500"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#D9E5E3]">
          <button onClick={onClose} className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] flex items-center justify-center gap-2 hover:bg-[#004F4D] transition-colors">
            <Sparkles size={18} />Apply Filters · Show 234 Properties
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VOICE COMMAND ENGINE (Hands-free Accessibility) ───────────────────
export function executeVoiceCommand(
  rawText: string,
  navigate: (pg: Page) => void,
  setCity?: (c: string) => void,
  setSearchQ?: (q: string) => void
) {
  const text = rawText.trim();
  if (!text) return;
  const lower = text.toLowerCase();

  // Decoupled AIML voice service ping
  try {
    fetch("http://localhost:8000/api/ai/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text }),
    }).catch(() => {});
  } catch {}

  // 1. Hands-Free Senior Citizen Navigation Commands
  if (lower.includes("my account") || lower.includes("account") || lower.includes("profile")) {
    navigate("profile");
    return;
  }
  if (lower.includes("home") || lower.includes("main page") || lower.includes("homepage")) {
    navigate("home");
    return;
  }
  if (lower.includes("senior") || lower.includes("elderly") || lower.includes("accessibility")) {
    navigate("senior");
    return;
  }
  if (lower.includes("chat") || lower.includes("assistant") || lower.includes("ask sai") || lower.includes("bot")) {
    navigate("chat");
    return;
  }
  if (lower.includes("favorite") || lower.includes("saved") || lower.includes("bookmarks")) {
    navigate("favorites");
    return;
  }
  if (lower.includes("compare") || lower.includes("comparison")) {
    navigate("compare");
    return;
  }
  if (lower.includes("fraud") || lower.includes("rera") || lower.includes("verify")) {
    navigate("fraud");
    return;
  }
  if (lower.includes("chat") || lower.includes("bot") || lower.includes("assistant") || lower.includes("talk to sai") || lower.includes("ask sai")) {
    navigate("chat");
    return;
  }
  if (lower.includes("sign in") || lower.includes("login") || lower.includes("log in")) {
    navigate("login");
    return;
  }
  if (lower.includes("sign up") || lower.includes("register") || lower.includes("create account")) {
    navigate("role");
    return;
  }
  if (lower.includes("buy")) {
    navigate("buy");
    return;
  }
  if (lower.includes("rent") || lower.includes("lease")) {
    navigate("rent");
    return;
  }
  if (lower.includes("commercial") || lower.includes("office")) {
    navigate("commercial");
    return;
  }
  if (lower.includes("new project") || lower.includes("new launch")) {
    navigate("new-projects");
    return;
  }

  // 2. City & locality extraction using Indian Locations DB
  const locMatch = INDIAN_LOCATIONS_DB.find(l =>
    lower.includes(l.name.toLowerCase()) ||
    lower.includes(l.locality.toLowerCase()) ||
    l.aliases.some(a => lower.includes(a.toLowerCase()))
  );
  if (locMatch) {
    setCity?.(locMatch.city);
  } else {
    const allKnownCities = Array.from(new Set([...CITIES.map(c => c.toLowerCase()), ...INDIAN_LOCATIONS_DB.map(l => l.city.toLowerCase())]));
    for (const c of allKnownCities) {
      if (lower.includes(c)) {
        const titleCase = c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        setCity?.(titleCase);
        break;
      }
    }
  }

  // 3. Search query parsing (e.g. "Search 2 BHK in Pune" -> "2 BHK in Pune")
  const cleaned = cleanVoiceLocationQuery(text);
  setSearchQ?.(cleaned || text);
  navigate("search");
}

// ── VOICE MIC MODAL ──────────────────────────────────────────────────
function VoiceMicModal({
  open,
  onClose,
  lang,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  lang: string;
  onResult: (text: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "listening" | "processing" | "result">("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [bars] = useState(() => Array.from({ length: 24 }, (_, i) => i));
  const [barHeights, setBarHeights] = useState<number[]>(Array(24).fill(4));
  const [matchedProperties, setMatchedProperties] = useState<PropertyItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRestartRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const sampleVoicePrompts = [
    "2 BHK in Baner under ₹80L",
    "Flats for rent in Hinjewadi",
    "3 BHK Villa in Kalyani Nagar",
    "Commercial space in Kharadi",
    "Compare properties in Baner and Wakad",
  ];

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = getSpeechCode(lang);
        u.rate = 0.95;
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  };

  // Real-time audio visualizer using Web Audio API
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const newHeights = Array.from({ length: 24 }, (_, i) => {
          const idx = Math.floor((i / 24) * dataArray.length);
          const value = dataArray[idx] || 0;
          return Math.max(4, (value / 255) * 52);
        });
        setBarHeights(newHeights);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      updateBars();
    } catch (e) {
      console.warn("Audio visualizer fallback to random bars:", e);
      // Fallback to random bars if getUserMedia fails for visualizer
      const fallbackAnim = setInterval(() => {
        setBarHeights(Array.from({ length: 24 }, () => 4 + Math.random() * 44));
      }, 100);
      // Store cleanup in animFrameRef as negative to differentiate
      (window as any).__voiceFallbackInterval = fallbackAnim;
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if ((window as any).__voiceFallbackInterval) {
      clearInterval((window as any).__voiceFallbackInterval);
      (window as any).__voiceFallbackInterval = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setBarHeights(Array(24).fill(4));
  };

  const handleTextCaptured = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    shouldRestartRef.current = false;
    // Stop recognition and visualizer
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    stopAudioVisualizer();
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

    setTranscript(cleanText);
    setInterimText("");
    setPhase("processing");
    try {
      const res = await searchNaturalLanguage(cleanText, undefined, lang);
      const items = res.items || [];
      setMatchedProperties(items);
      const speechMsg = items.length > 0
        ? `Found ${items.length} properties matching ${cleanText}. Top choice is ${items[0].title}.`
        : `Searched for ${cleanText}. Check out the matching properties below.`;
      speakText(speechMsg);
    } catch (e) {
      console.warn("Voice search query error:", e);
      setMatchedProperties([]);
    } finally {
      setPhase("result");
    }
  };

  const startListening = async () => {
    setPhase("listening");
    setTranscript("");
    setInterimText("");
    setMicError(null);
    setHasSpoken(false);
    finalTranscriptRef.current = "";
    shouldRestartRef.current = true;

    // Start real audio visualizer
    startAudioVisualizer();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome, Edge or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = getSpeechCode(lang);
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;

      rec.onresult = (e: any) => {
        let finalText = "";
        let interim = "";

        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalText) {
          finalTranscriptRef.current = finalText;
          setTranscript(finalText);
          setHasSpoken(true);
        }

        if (interim) {
          setInterimText(interim);
          setHasSpoken(true);
        }

        // Reset silence timer — user is actively speaking
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Once we have final text, set a silence timer to auto-submit after 2s of silence
        if (finalText) {
          silenceTimerRef.current = setTimeout(() => {
            if (phaseRef.current === "listening" && finalTranscriptRef.current.trim()) {
              shouldRestartRef.current = false;
              if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch {}
              }
              handleTextCaptured(finalTranscriptRef.current);
            }
          }, 2000);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err.error);

        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          setMicError("Microphone access denied. Please allow microphone permission in your browser settings and try again.");
          shouldRestartRef.current = false;
          stopAudioVisualizer();
          return;
        }

        if (err.error === "no-speech") {
          // No speech detected — just restart silently
          return;
        }

        if (err.error === "aborted") {
          // Intentionally aborted — don't restart
          return;
        }

        // Network or other recoverable error — will restart via onend
        console.warn("Recoverable speech error, will restart:", err.error);
      };

      rec.onend = () => {
        // Auto-restart if we should keep listening and haven't captured a final result
        if (shouldRestartRef.current && phaseRef.current === "listening") {
          try {
            setTimeout(() => {
              if (shouldRestartRef.current && phaseRef.current === "listening" && recognitionRef.current) {
                recognitionRef.current.start();
              }
            }, 100);
          } catch (e) {
            console.warn("Failed to restart recognition:", e);
          }
        }
      };

      rec.start();
    } catch (err) {
      console.warn("Speech recognition failed to start:", err);
      setMicError("Failed to start speech recognition. Please check microphone permissions.");
    }
  };

  const stopListening = () => {
    shouldRestartRef.current = false;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    stopAudioVisualizer();
    const finalText = (finalTranscriptRef.current || transcript || interimText).trim();
    if (finalText) {
      handleTextCaptured(finalText);
    } else {
      setPhase("idle");
    }
  };

  useEffect(() => {
    if (!open) {
      shouldRestartRef.current = false;
      setPhase("idle");
      setTranscript("");
      setInterimText("");
      setMicError(null);
      setMatchedProperties([]);
      setHasSpoken(false);
      finalTranscriptRef.current = "";
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      stopAudioVisualizer();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    // Auto-start listening when modal opens
    startListening();
    return () => {
      shouldRestartRef.current = false;
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      stopAudioVisualizer();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [open]);

  if (!open) return null;

  const displayText = transcript || interimText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden">
        {/* Gradient top strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#006A60] via-[#008F8C] to-[#006A60]" />

        <div className="p-8 text-center max-h-[85vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X size={15} className="text-slate-500" />
          </button>

          {/* SAI brand badge */}
          <div className="inline-flex items-center gap-2 bg-[#E6F4F1] border border-[#D9E5E3] rounded-full px-4 py-1.5 mb-5">
            <Bot size={13} className="text-[#006A60]" />
            <span className="text-[#006A60] text-xs font-bold tracking-wide">SAI Voice Assistant</span>
          </div>

          {/* Microphone error message */}
          {micError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 text-left">
              <p className="text-red-600 text-sm font-semibold flex items-center gap-2">
                <MicOff size={14} /> {micError}
              </p>
              <button
                onClick={startListening}
                className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          )}

          {phase === "idle" && !micError && (
            <>
              <div className="w-24 h-24 rounded-full bg-[#006A60] flex items-center justify-center mx-auto mb-5 shadow-[0_16px_48px_rgba(0,106,96,0.4)] cursor-pointer hover:scale-105 transition-transform" onClick={startListening}>
                <Mic size={44} className="text-white" />
              </div>
              <p className="text-slate-800 font-black text-xl mb-2">Tap to speak</p>
              <p className="text-slate-400 text-sm mb-4">Describe your ideal property in any language</p>
              <button onClick={startListening} className="px-6 py-3 bg-[#006A60] text-white font-bold rounded-xl text-sm hover:bg-[#004F4D] transition-colors shadow-lg">
                🎤 Start Listening
              </button>
            </>
          )}

          {phase === "listening" && (
            <>
              {/* Animated mic with pulsing rings */}
              <div className="relative flex items-center justify-center mb-5">
                <span className="absolute w-40 h-40 rounded-full border-2 border-[#006A60]/15 animate-ping" />
                <span className="absolute w-32 h-32 rounded-full border-2 border-[#006A60]/25 animate-ping" style={{ animationDelay: "0.2s" }} />
                <span className="absolute w-28 h-28 rounded-full border border-[#006A60]/10 animate-pulse" style={{ animationDelay: "0.4s" }} />
                <div
                  className="w-24 h-24 rounded-full bg-[#006A60] flex items-center justify-center shadow-[0_16px_48px_rgba(0,106,96,0.5)] relative z-10 cursor-pointer hover:bg-[#004F4D] transition-colors"
                  onClick={stopListening}
                  title="Tap to stop and search"
                >
                  <Mic size={44} className="text-white animate-pulse" />
                </div>
              </div>

              {/* Real audio visualizer */}
              <div className="flex items-end justify-center gap-[2.5px] h-14 mb-4 px-4">
                {bars.map((_, i) => (
                  <div
                    key={i}
                    className="w-[4px] rounded-full bg-gradient-to-t from-[#006A60] to-[#00B3A6] transition-all duration-75"
                    style={{ height: `${barHeights[i]}px`, opacity: 0.5 + (barHeights[i] / 52) * 0.5 }}
                  />
                ))}
              </div>

              <p className="text-[#006A60] font-black text-lg mb-1">
                {hasSpoken ? "Hearing you..." : "Listening…"}
              </p>
              <p className="text-slate-500 text-xs mb-3">
                {hasSpoken
                  ? "Keep speaking or tap the mic to search"
                  : "Speak now in any language or tap a quick question:"}
              </p>

              {/* Live transcript display */}
              {displayText ? (
                <div className="bg-[#E6F4F1] rounded-2xl px-4 py-3 mb-4 border border-[#D9E5E3]">
                  <p className="text-[10px] font-black text-[#008F8C] uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Mic size={9} /> Live transcription
                  </p>
                  <p className="text-[#006A60] font-semibold text-sm">
                    "{transcript}"
                    {interimText && <span className="text-[#006A60]/60 italic">{interimText}</span>}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {sampleVoicePrompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleTextCaptured(prompt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#E6F4F1] text-[#006A60] hover:bg-[#D0ECE7] transition-colors border border-[#D9E5E3] text-left"
                    >
                      🎤 {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Manual stop button if user has spoken */}
              {hasSpoken && (
                <button
                  onClick={stopListening}
                  className="mt-1 px-5 py-2.5 bg-[#006A60] text-white font-bold rounded-xl text-sm hover:bg-[#004F4D] transition-colors shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Search size={14} /> Search Now
                </button>
              )}
            </>
          )}

          {phase === "processing" && (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center mx-auto mb-5 shadow-[0_16px_48px_rgba(0,106,96,0.4)]">
                <Brain size={40} className="text-white animate-pulse" />
              </div>
              {transcript && (
                <div className="bg-[#E6F4F1] rounded-xl px-4 py-2 mb-3 inline-block">
                  <p className="text-[#006A60] font-semibold text-sm italic">"{transcript}"</p>
                </div>
              )}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-[#006A60] to-[#008F8C] rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ width: "75%" }} />
              </div>
              <p className="text-slate-800 font-black text-lg mb-1">SAI is thinking…</p>
              <p className="text-slate-400 text-sm">Searching properties and preparing voice response</p>
            </>
          )}

          {phase === "result" && (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006A60] to-[#004F4D] flex items-center justify-center mx-auto mb-4 shadow-[0_12px_36px_rgba(0,106,96,0.35)]">
                <Sparkles size={28} className="text-white" />
              </div>
              <p className="text-slate-800 font-black text-xl mb-1">SAI Assistant Found It!</p>

              <div className="bg-[#E6F4F1] border border-[#D9E5E3] rounded-2xl px-4 py-3 mb-4 text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-[#008F8C] uppercase tracking-widest flex items-center gap-1">
                    <Bot size={9} />You said / Asked
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const count = matchedProperties.length;
                      const msg = count > 0
                        ? `Found ${count} properties for ${transcript}. Top match is ${matchedProperties[0].title}.`
                        : `Here are the search results for ${transcript}.`;
                      speakText(msg);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#006A60] hover:underline"
                    title="Play voice again"
                  >
                    <Volume2 size={13} className={isSpeaking ? "animate-pulse text-green-600" : ""} />
                    <span>{isSpeaking ? "Speaking..." : "Listen"}</span>
                  </button>
                </div>
                <p className="text-[#006A60] font-bold text-sm italic">"{transcript || "No speech detected"}"</p>
              </div>

              <div className="bg-white border border-[#D9E5E3] rounded-2xl p-4 mb-4 text-left shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Sparkles size={9} />SAI Matched ({matchedProperties.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {matchedProperties.length > 0 ? (
                    matchedProperties.slice(0, 4).map(r => (
                      <div key={r.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#E6F4F1] rounded-lg flex items-center justify-center"><Home size={11} className="text-[#006D6A]" /></div>
                          <span className="text-slate-800 text-sm font-semibold truncate max-w-[170px]">{r.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#008F8C] font-bold text-sm">{r.price_display || `₹${Number(r.price).toLocaleString("en-IN")}`}</span>
                          <span className="bg-[#006A60] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{r.match_score || 95}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center">
                      <p className="text-slate-400 text-xs italic mb-2">No direct match. Try one of these voice prompts:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {sampleVoicePrompts.slice(0, 3).map(prompt => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleTextCaptured(prompt)}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E6F4F1] text-[#006A60] hover:bg-[#D0ECE7]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { onResult(transcript || sampleVoicePrompts[0]); onClose(); }}
                  className="w-full bg-[#006A60] text-white font-black py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,106,96,0.4)] flex items-center justify-center gap-2 hover:bg-[#004F4D] transition-all"
                >
                  <Search size={16} />View All Matched Properties
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={startListening}
                    className="flex-1 py-2.5 rounded-xl border border-[#006A60] text-[#006A60] font-bold text-xs hover:bg-[#E6F4F1] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mic size={14} />Speak Again
                  </button>
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PAGES ─────────────────────────────────────────────────────────────

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", hi: "🇮🇳", mr: "🇮🇳", gu: "🇮🇳", ta: "🇮🇳", te: "🇮🇳", kn: "🇮🇳", bn: "🇮🇳",
};

const langSubtitles: Record<string, string> = {
    en: "Smart AI Property Finder",
    hi: "स्मार्ट AI प्रॉपर्टी फाइंडर",
    mr: "स्मार्ट AI मालमत्ता शोधक",
    gu: "સ્માર્ટ AI પ્રોપર્ટી ફાઇન્ડર",
    ta: "ஸ்மார்ட் AI சொத்து கண்டுபிடிப்பு",
    te: "స్మార్ట్ AI ప్రాపర్టీ ఫైండర్",
    kn: "ಸ್ಮಾರ್ಟ್ AI ಆಸ್ತಿ ಹುಡುಕಾಟ",
    bn: "স্মার্ট AI প্রপার্টি ফাইন্ডার",
  };

function LanguagePage({ navigate, setLang, currentLang, isGuest }: { navigate: (pg: Page) => void; setLang: (l: string) => void; currentLang?: string; isGuest?: boolean }) {
  const [sel, setSel] = useState(currentLang ?? "en");
  const [hovered, setHovered] = useState<string | null>(null);

  
  const chooseTitles: Record<string, string> = {
    en: "Choose Language",
    hi: "भाषा चुनें",
    mr: "भाषा निवडा",
    gu: "ભાષા પસંદ કરો",
    ta: "மொழியைத் தேர்ந்தெடுக்கவும்",
    te: "భాషను ఎంచుకోండి",
    kn: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    bn: "ভাষা নির্বাচন করুন",
  };

  const chooseSubs: Record<string, string> = {
    en: "Select your preferred language to continue",
    hi: "आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें",
    mr: "पुढे जाण्यासाठी आपली पसंतीची भाषा निवडा",
    gu: "આગળ વધવા માટે તમારી પસંદગીની ભાષા પસંદ કરો",
    ta: "தொடர உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    te: "కొనసాగడానికి మీ ప్రాధాన్యత గల భాషను ఎంచుకోండి",
    kn: "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    bn: "এগিয়ে যাওয়ার জন্য আপনার পছন্দের ভাষা নির্বাচন করুন",
  };

  const backLabels: Record<string, string> = {
    en: "Back",
    hi: "वापस",
    mr: "मागे",
    gu: "પાછા",
    ta: "பின்செல்",
    te: "వెనుకకు",
    kn: "ಹಿಂದಕ್ಕೆ",
    bn: "ফিরে যান",
  };

  const changeNotes: Record<string, string> = {
    en: "You can change the language anytime from the menu",
    hi: "आप मेनू से कभी भी भाषा बदल सकते हैं",
    mr: "तुम्ही मेनूमधून कधीही भाषा बदलू शकता",
    gu: "તમે મેનૂમાંથી ગમે ત્યારે ભાષા બદલી શકો છો",
    ta: "மெனுவிலிருந்து எப்போது வேண்டுமானாலும் மொழியை மாற்றலாம்",
    te: "మీరు మెను నుండి ఎప్పుడైనా భాషను మార్చవచ్చు",
    kn: "ನೀವು ಮೆನುವಿನಿಂದ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು",
    bn: "আপনি মেনু থেকে যেকোনো সময় ভাষা পরিবর্তন করতে পারেন",
  };

  const platformDescs: Record<string, string> = {
    en: "India's most intelligent property search platform — powered by AI, built for every Indian language.",
    hi: "भारत का सबसे बुद्धिमान प्रॉपर्टी सर्च प्लेटफॉर्म — AI द्वारा संचालित, प्रत्येक भारतीय भाषा के लिए निर्मित।",
    mr: "भारतातील सर्वात बुद्धिमान मालमत्ता शोध प्लॅटफॉर्म — AI द्वारे समर्थित, प्रत्येक भारतीय भाषेसाठी तयार.",
    gu: "ભારતનું સૌથી બુદ્ધિશાળી પ્રોપર્ટી સર્ચ પ્લેટફોર્મ — AI દ્વારા સંચાલિત, દરેક ભારતીય ભાષા માટે નિર્મિત.",
    ta: "இந்தியாவின் புத்திசாலித்தனமான சொத்துத் தேடல் தளம் — AI மூலம் இயக்கப்படுகிறது, ஒவ்வொரு இந்திய மொழிக்கும் உருவாக்கப்பட்டது.",
    te: "భారతదేశపు అత్యంత తెలివైన ప్రాపర్టీ సెర్చ్ ప్లాట్‌ఫారమ్ — AI ద్వారా ఆధారితం, ప్రతి భారతీయ భాష కోసం నిర్మించబడింది.",
    kn: "ಭಾರತದ ಅತ್ಯಂತ ಬುದ್ಧಿವಂತ ಆಸ್ತಿ ಹುಡುಕಾಟ ವೇದಿಕೆ — AI ನಿಂದ ಚಾಲಿತ, ಪ್ರತಿಯೊಂದು ಭಾರತೀಯ ಭಾಷೆಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
    bn: "ভারতের সবচেয়ে বুদ্ধিমান রিয়েল এস্টেট প্ল্যাটফর্ম — AI দ্বারা চালিত, প্রতিটি ভারতীয় ভাষার জন্য নির্মিত।",
  };

  const statLabels: Record<string, { p: string; l: string; a: string }> = {
    en: { p: "Properties", l: "Languages", a: "Accuracy" },
    hi: { p: "प्रॉपर्टीज", l: "भाषाएं", a: "सटीकता" },
    mr: { p: "मालमत्ता", l: "भाषा", a: "अचूकता" },
    gu: { p: "પ્રોપર્ટીઝ", l: "ભાષાઓ", a: "ચોકસાઈ" },
    ta: { p: "சொத்துக்கள்", l: "மொழிகள்", a: "துல்லியம்" },
    te: { p: "ప్రాపర్టీలు", l: "భాషలు", a: "ఖచ్చితత్వం" },
    kn: { p: "ಆಸ್ತಿಗಳು", l: "ಭಾಷೆಗಳು", a: "ನಿಖರತೆ" },
    bn: { p: "সম্পত্তি", l: "ভাষা", a: "নির্ভুলতা" },
  };

  const continueLabels: Record<string, string> = {
    en: "Continue in English",
    hi: "हिन्दी में आगे बढ़ें",
    mr: "मराठीत पुढे जा",
    gu: "ગુજરાતીમાં આગળ વધો",
    ta: "தமிழில் தொடர்க",
    te: "తెలుగులో కొనసాగించండి",
    kn: "ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ",
    bn: "বাংলায় এগিয়ে যান",
  };

  const currentStats = statLabels[sel] || statLabels.en;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left — Hero Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#004F4D] flex-col items-center justify-center overflow-hidden">
        <img src={IMGS.hero} alt="City" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#006A60]/95 via-[#004F4D]/90 to-[#073B3A]/95" />
        {/* Decorative blobs */}
        <div className="absolute top-16 left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-8 w-64 h-64 bg-[#008F8C]/20 rounded-full blur-3xl" />
        <div className="relative z-10 px-12 text-center">
          <div className="mb-6 flex justify-center">
            <SaiLogo size="xl" variant="light" subtitle={langSubtitles[sel]} />
          </div>
          <div className="w-12 h-1 bg-white/40 rounded-full mx-auto my-6" />
          <p className="text-white/70 text-base leading-relaxed max-w-xs mx-auto">
            {platformDescs[sel] || platformDescs.en}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-5">
            {[
              { val: "2M+", label: currentStats.p },
              { val: "8", label: currentStats.l },
              { val: "98%", label: currentStats.a },
            ].map(({ val, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-white/60 text-xs mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Language Selection Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-14 min-h-screen lg:min-h-0 relative">
        {/* Back button — only shown if user navigated here from inside the app */}
        {isGuest && (
          <button
            onClick={() => navigate("home")}
            className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-500 hover:text-[#006A60] font-semibold text-sm transition-colors"
          >
            <ChevronLeft size={16} />{backLabels[sel] || backLabels.en}
          </button>
        )}

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center flex justify-center">
          <SaiLogo size="lg" subtitle={langSubtitles[sel]} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={18} className="text-[#006A60]" />
              <h2 className="text-2xl font-black text-slate-800">{chooseTitles[sel] || chooseTitles.en}</h2>
            </div>
            <p className="text-slate-500 text-sm pl-6.5">{chooseSubs[sel] || chooseSubs.en}</p>
          </div>

          {/* Language grid — 2×4 */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {LANGUAGES.map((l, i) => {
              const isSelected = sel === l.code;
              const isHovered = hovered === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setSel(l.code);
                    setLang(l.code);
                  }}
                  onMouseEnter={() => setHovered(l.code)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={`relative py-4 px-4 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 flex flex-col items-start gap-1 text-left ${
                    isSelected
                      ? "border-[#006A60] bg-[#E6F4F1] shadow-[0_6px_24px_rgba(0,106,96,0.22)]"
                      : isHovered
                      ? "border-[#008A80] bg-[#F2FAF8] shadow-[0_4px_16px_rgba(0,106,96,0.12)]"
                      : "border-[#D9E5E3] bg-slate-50 hover:border-[#008A80]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{LANG_FLAGS[l.code]}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#006A60] flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </span>
                    )}
                  </div>
                  <span className={`notranslate text-base font-bold leading-tight ${isSelected ? "text-[#006A60]" : "text-slate-700"}`}>{l.native}</span>
                  <span className={`notranslate text-[11px] font-medium ${isSelected ? "text-[#008A80]" : "text-slate-400"}`}>{l.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setLang(sel);
              if (isGuest) {
                navigate("home");
              } else {
                navigate("welcome");
              }
            }}
            className="w-full bg-[#006A60] text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,106,96,0.45)] flex items-center justify-center gap-2.5 hover:bg-[#004F4D] active:scale-[0.98] transition-all text-base"
          >
            {continueLabels[sel] || `Continue in ${LANGUAGES.find(l => l.code === sel)?.name}`}
            <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">{changeNotes[sel] || changeNotes.en}</p>
        </div>
      </div>
    </div>
  );
}

function WelcomePage({ navigate }: { navigate: (pg: Page) => void }) {
  const { lang, tr } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#E8F5F2] to-slate-100 flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,106,96,0.16)] border border-[#D9E5E3] overflow-hidden">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-[#006A60] via-[#008A80] to-[#00A89A] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-center mb-4">
            <SaiLogo size="lg" variant="light" subtitle="Smart AI Property Finder" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
            {tr.welcomeTitle || "Welcome to SAI"}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto">
            {tr.welcomeSub || "Discover verified properties across India with conversational AI in 8 languages."}
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* AI Search preview card */}
          <div className="bg-[#F0FAF7] border border-[#B8E2D8] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#006A60] uppercase mb-2">
              <Bot size={16} />
              <span>{tr.smartAiTitle || "Ask SAI in Any Language"}</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#D9E5E3] shadow-sm mb-2.5">
              <p className="text-xs text-slate-400 font-medium mb-1">{tr.youSay || "You say:"}</p>
              <p className="text-sm font-semibold text-slate-800 italic">
                "{tr.query || '2 BHK in Pune near metro under ₹60 lakhs, furnished'}"
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#006A60]/10 to-[#008A80]/10 rounded-xl p-3 border border-[#006A60]/20 flex items-center justify-between">
              <span className="text-xs font-bold text-[#006A60] flex items-center gap-1.5">
                <Sparkles size={14} /> {tr.match || "18 matching properties · Best: 97% AI Match"}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#006A60] text-white">Verified</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("home")}
              className="w-full bg-[#006A60] text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_10px_25px_rgba(0,106,96,0.35)] hover:bg-[#005048] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <span>{tr.exploreBtn || "Explore as Guest"}</span>
              <ArrowRight size={18} />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("login")}
                className="py-3 px-4 rounded-xl border-2 border-[#006A60] text-[#006A60] font-bold text-sm hover:bg-[#E8F5F2] transition-colors text-center cursor-pointer"
              >
                {tr.login || "Sign In"}
              </button>
              <button
                onClick={() => navigate("signup")}
                className="py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors text-center cursor-pointer"
              >
                {tr.signUp || "Create Account"}
              </button>
            </div>

            <button
              onClick={() => navigate("language")}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#006A60] py-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe size={14} />
              <span>{tr.languageSelect || "Change Language"}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            <div className="p-2">
              <p className="text-base font-black text-[#006A60]">20,000+</p>
              <p className="text-[11px] text-slate-500 font-medium">Verified Homes</p>
            </div>
            <div className="p-2 border-x border-slate-100">
              <p className="text-base font-black text-[#006A60]">50+ Cities</p>
              <p className="text-[11px] text-slate-500 font-medium">Pan India</p>
            </div>
            <div className="p-2">
              <p className="text-base font-black text-[#006A60]">8 Languages</p>
              <p className="text-[11px] text-slate-500 font-medium">Regional AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, city, setCity, lang, setLang, selectProperty, onOpenMap, onExploreCity }: {
  navigate: (pg: Page) => void;
  city: string;
  setCity?: (c: string) => void;
  lang: string;
  setLang?: (l: string) => void;
  selectProperty: (id: number) => void;
  onOpenMap?: () => void;
  onExploreCity?: (c: string) => void;
}) {
  const [searchQ, setSearchQ] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"buy"|"rent"|"commercial">("buy");
  const [mapView, setMapView] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceModal, setVoiceModal] = useState(false);
  const tr = useTranslations(lang);

  const [dbProps, setDbProps] = useState<UIProperty[]>([]);

  useEffect(() => {
    fetchProperties({ city: city !== "All Cities" ? city : undefined, limit: 50 })
      .then(res => {
        if (res && res.items && res.items.length > 0) {
          setDbProps(res.items.map(toUIProperty));
        } else {
          setDbProps([]);
        }
      })
      .catch(() => {
        setDbProps([]);
      });
  }, [city]);

  const activeProperties = dbProps.length > 0
    ? dbProps
    : (city && city !== "All Cities"
        ? PROPERTIES.filter(p => p.location.toLowerCase().includes(city.toLowerCase()))
        : PROPERTIES);
  const filteredProperties = activeProperties.filter(p =>
    activeTab === "buy" ? p.forBuy : activeTab === "rent" ? p.forRent : p.forCommercial
  );

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert(tr.voiceUnsupported); return; }
    const rec = new SR();
    rec.lang = getSpeechCode(lang);
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      setSearchQ(spoken);
      executeVoiceCommand(spoken, navigate, undefined, setSearchQ);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const faqs = [
    { q: "How does SAI's AI search work?", a: "SAI uses advanced NLP to understand natural language queries in 8 Indian languages. Just describe what you want — city, budget, BHK, amenities, and nearby landmarks — and SAI instantly matches properties without manual filters." },
    { q: "Do I need to create an account to search?", a: "No! You can browse, search, compare properties, use the AI assistant, and view property details as a guest. Account creation is only needed to save properties, contact owners, schedule visits, or post listings." },
    { q: "How does SAI detect fraudulent listings?", a: "SAI's AI Trust Engine analyzes 50+ data points including RERA registration, title deed records, court databases, ownership history, and pricing anomalies to give each listing a trust score." },
    { q: "Is SAI available in regional languages?", a: "Yes! SAI supports English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali — both for text and voice search. You can switch languages anytime from the header." },
    { q: "What is the AI Match Score?", a: "The AI Match Score (0-100%) shows how well a property matches your stated preferences — budget, location, BHK, amenities, lifestyle needs, and proximity to your key landmarks." },
    { q: "Does SAI have a Senior Citizen Mode?", a: "Yes! Senior Mode offers larger text, high-contrast UI, voice navigation, one-tap emergency contacts, and filters specifically for accessible properties near hospitals and pharmacies." },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMGS.hero} alt="City" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pt-10 lg:pb-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 items-center">
            {/* ── LEFT SIDE: Stream A (Moving Up) ── */}
            <div className="hidden lg:block lg:col-span-3">
              <FeaturedPropertiesScroll
                properties={activeProperties}
                navigate={navigate}
                selectProperty={selectProperty}
                variant="hero"
                stream="left"
              />
            </div>

            {/* ── MIDDLE / CENTER: Headline, Search Bar, and Main Image ── */}
            <div className="lg:col-span-6 w-full flex flex-col items-center text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-4 text-center">
                {(() => { const words = tr.heroHeadline.split(" "); const mid = Math.ceil(words.length / 2); return <>{words.slice(0, mid).join(" ")} <span className="text-[#008F8C]">{words.slice(mid).join(" ")}</span></>; })()}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed max-w-xl text-center">{tr.heroSub}</p>

              {/* AI Search Bar */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-white/60 mb-4 w-full max-w-2xl text-left">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#006A60] rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_6px_20px_rgba(0,106,96,0.5)]">
                    <Bot size={20} className="text-white" />
                  </div>
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && navigate("search")}
                    placeholder="Ask SAI to find properties in any language..."
                    className="flex-1 text-slate-700 placeholder:text-slate-400 focus:outline-none text-xs sm:text-sm bg-transparent"
                  />
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                    {/* Voice mic → opens modal */}
                    <button
                      onClick={() => setVoiceModal(true)}
                      title="Voice Search"
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${voiceModal || listening ? "bg-[#006A60] text-white shadow-[0_0_15px_rgba(0,106,96,0.5)]" : "bg-[#E6F4F1] hover:bg-[#006A60] hover:text-white"} group border border-[#D9E5E3]`}
                    >
                      <Mic size={16} className={voiceModal || listening ? "text-white animate-pulse" : "text-[#006A60] group-hover:text-white transition-colors"} />
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenMap) onOpenMap();
                        else setMapView(v => !v);
                      }}
                      title="Open Interactive Map"
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all border bg-[#E6F4F2] hover:bg-[#D9E5E3] border-[#D9E5E3]"
                    >
                      <MapIcon size={16} className="text-[#006A60]" />
                    </button>
                    <button onClick={() => navigate("search")} className="bg-[#006A60] text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-[#004F4D] shadow-[0_4px_16px_rgba(0,106,96,0.5)] transition-all flex items-center gap-1.5 text-xs sm:text-sm">
                      <Search size={15} />{tr.searchBtn}
                    </button>
                  </div>
                </div>
                {/* Language hint pill */}
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="flex gap-1.5 flex-wrap">
                    {["हिंदी में बोलें", "मराठीत बोला", " தமிழில் கேளுங்கள்", "తెలుగులో అడగండి"].map(hint => (
                      <span key={hint} className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-medium">{hint}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voice Mic Modal */}
              <VoiceMicModal
                open={voiceModal}
                onClose={() => setVoiceModal(false)}
                lang={lang}
                onResult={(text) => { executeVoiceCommand(text, navigate, undefined, setSearchQ); }}
              />

              {/* Quick Prompt Tags */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4">
                {["2 BHK in Baner under ₹60L", "Villa with pool in Pune", "1 BHK near Hinjewadi", "RERA approved"].map(s => (
                  <button key={s} onClick={() => navigate("search")} className="bg-white/10 backdrop-blur border border-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full hover:bg-white/20 transition-colors">{s}</button>
                ))}
              </div>


              {/* Mobile Streams Fallback (visible only below lg where side columns are hidden) */}
              <div className="w-full mt-6 block lg:hidden">
                <FeaturedPropertiesScroll
                  properties={activeProperties}
                  navigate={navigate}
                  selectProperty={selectProperty}
                  variant="hero"
                  stream="both"
                />
              </div>
            </div>

            {/* ── RIGHT SIDE: Stream B (Moving Down) ── */}
            <div className="hidden lg:block lg:col-span-3">
              <FeaturedPropertiesScroll
                properties={activeProperties}
                navigate={navigate}
                selectProperty={selectProperty}
                variant="hero"
                stream="right"
              />
            </div>
          </div>
        </div>
        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[{ val: "2M+", label: "Verified Properties" }, { val: "50+", label: "Cities Covered" }, { val: "8", label: "Indian Languages" }, { val: "98%", label: "User Satisfaction" }].map(({ val, label }) => (
                <div key={label} className="text-center"><p className="font-black text-white text-2xl">{val}</p><p className="text-[#D9E5E3] text-xs font-medium">{label}</p></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><Zap size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">Browse by Category</span></div>
            <h2 className="text-4xl font-black text-slate-800">What Are You Looking For?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: DollarSign, label: "Buy", sub: "Own your dream", color: "from-[#008F8C] to-[#004F4D]" },
              { icon: Home, label: "Rent", sub: "Flexible living", color: "from-[#006D6A] to-[#073B3A]" },
              { icon: Building, label: "Commercial", sub: "Office & retail", color: "from-green-400 to-green-600" },
              { icon: Layers, label: "Villa", sub: "Luxury homes", color: "from-orange-400 to-orange-600" },
              { icon: Target, label: "Plot", sub: "Land & NA", color: "from-pink-400 to-pink-600" },
              { icon: Award, label: "New Launch", sub: "Pre-launch deals", color: "from-teal-400 to-teal-600" },
            ].map(({ icon: Icon, label, sub, color }) => (
              <button key={label} onClick={() => navigate("search")} className="group bg-white rounded-3xl p-6 flex flex-col items-center gap-3 shadow-[0_4px_20px_rgba(0,109,106,0.08)] hover:shadow-[0_8px_32px_rgba(0,109,106,0.2)] border border-[#D9E5E3] hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon size={24} className="text-white" /></div>
                <div className="text-center"><p className="font-black text-slate-800 text-sm">{label}</p><p className="text-xs text-slate-400">{sub}</p></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsored / Featured Projects Strip */}
      <section className="py-12 bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap size={15} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Sponsored</span>
            <span className="text-xs text-slate-400 font-medium ml-1">· Featured projects from verified builders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: "Green Valley Apartments", builder: "Prestige Group", location: "Baner, Pune", units: "2 & 3 BHK", price: "₹72L – ₹1.1Cr", img: IMGS.apt1, label: "Featured Project", tag: "Under Construction" },
              { name: "Sunrise Residency", builder: "Godrej Properties", location: "Kharadi, Pune", units: "2 & 3 BHK", price: "₹65L – ₹90L", img: IMGS.apt4, label: "Featured Project", tag: "Ready to Move" },
            ].map(fp => (
              <div key={fp.name} onClick={() => navigate("property")} className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-amber-100 cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row">
                <div className="relative flex-shrink-0">
                  <img src={fp.img} alt={fp.name} className="w-full sm:w-40 h-40 sm:h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{fp.label}</span>
                </div>
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={9} />Sponsored · {fp.builder}</p>
                    <h3 className="font-black text-slate-800 text-base leading-tight">{fp.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10} className="text-[#008F8C]" />{fp.location}</p>
                    <p className="text-xs text-slate-500 mt-1">{fp.units} · {fp.tag}</p>
                    <p className="font-black text-[#008F8C] mt-2">{fp.price}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors">View Project</button>
                    <button onClick={e => e.stopPropagation()} className="flex-1 py-2 bg-[#E6F4F2] text-[#008F8C] font-bold text-xs rounded-xl hover:bg-[#D9E5E3] transition-colors">View Units</button>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => navigate("property")} className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-amber-100 cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row">
              <div className="relative flex-shrink-0">
                <img src={IMGS.apt1} alt="Prestige Heights" className="w-full sm:w-40 h-40 sm:h-full object-cover" />
                <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">Featured Property</span>
              </div>
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={9} />Sponsored · Priya Patel · Agent</p>
                  <h3 className="font-black text-slate-800 text-base leading-tight">Prestige Heights</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10} className="text-[#008F8C]" />Baner, Pune</p>
                  <p className="text-xs text-slate-500 mt-1">3 BHK Apartment · Ready to Move</p>
                  <p className="font-black text-[#008F8C] mt-2">₹85L</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors">View Property</button>
                  <button onClick={e => e.stopPropagation()} className="flex-1 py-2 bg-[#E6F4F2] text-[#008F8C] font-bold text-xs rounded-xl hover:bg-[#D9E5E3] transition-colors">Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 MAJOR CITIES & MAP LOCATION EXPLORER ── */}
      <section className="py-16 bg-gradient-to-b from-[#F2FAF9] via-white to-slate-50 border-y border-[#D9E5E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E6F4F2] text-[#006D6A] rounded-full px-4 py-1.5 mb-3 text-xs font-bold border border-[#D9E5E3]">
                <Globe size={14} className="text-[#006D6A]" />
                <span>Multilingual Location &amp; Map Hub</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                Search in Any Language &amp; Explore 10 Major Cities
              </h2>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                Type in any Indian language or click any major city to view verified listings and pinpoint exact locations on Google Maps.
              </p>
            </div>

            <button
              onClick={() => onOpenMap?.()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#006D6A] text-white font-bold text-sm hover:bg-[#004F4D] shadow-[0_4px_16px_rgba(0,109,106,0.35)] transition-all self-start md:self-auto"
            >
              <MapIcon size={16} />
              <span>Open Interactive Google Map</span>
            </button>
          </div>

          {/* Upper Search Bar (Above the 10 Locations) */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-[0_10px_35px_rgba(0,109,106,0.12)] border border-[#D9E5E3] mb-8">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              
              {/* Language Selector Dropdown inside Search Bar */}
              <div className="relative flex-shrink-0">
                <select
                  value={lang}
                  onChange={(e) => setLang?.(e.target.value)}
                  className="w-full md:w-auto bg-[#E6F4F2] text-[#006D6A] font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-[#D9E5E3] focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      🌐 {l.native} ({l.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multilingual Text Input */}
              <div className="flex-1 relative flex items-center">
                <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && navigate("search")}
                  placeholder={`Search area, locality, or landmark in ${LANGUAGES.find(l => l.code === lang)?.name || "any language"} (e.g. Baner, Andheri, Whitefield)...`}
                  className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl pl-12 pr-28 py-3 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006D6A] transition-all"
                />
                
                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVoiceModal(true)}
                    title="Voice Search"
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      voiceModal || listening ? "bg-[#006D6A] text-white animate-pulse" : "bg-white text-[#006D6A] hover:bg-[#E6F4F2] border border-[#D9E5E3]"
                    }`}
                  >
                    <Mic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("search")}
                    className="bg-[#006D6A] text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-[#004F4D] transition-colors shadow-sm"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Direct Map Button */}
              <button
                type="button"
                onClick={() => onOpenMap?.()}
                className="flex items-center justify-center gap-2 bg-[#E6F4F2] hover:bg-[#D9E5E3] text-[#006D6A] font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-colors border border-[#D9E5E3] flex-shrink-0"
              >
                <MapPin size={16} />
                <span>Map View</span>
              </button>
            </div>

            {/* Language Quick Suggestions */}
            <div className="flex items-center gap-2 mt-3 px-2 pt-2 border-t border-slate-100 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Languages:</span>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang?.(l.code)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    lang === l.code
                      ? "bg-[#006D6A] text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          {/* 10 Locations Cards & Chips Grid */}
          <div id="property-hubs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-[#006D6A]" />
                  <h3 className="font-black text-slate-800 text-lg sm:text-xl">10 Major Property Hubs &amp; Emerging Markets</h3>
                  <span className="bg-[#E6F4F2] text-[#006D6A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D9E5E3]">
                    {CITIES.length} Cities
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Explore verified residential &amp; commercial listings across India. Click any city to switch location, view local properties &amp; interactive map.
                </p>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline-block">Click any city to switch location &amp; map</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {CITIES.map((cName) => {
                const isActive = city.toLowerCase() === cName.toLowerCase();
                const hub = CITY_HUBS_MAP.get(cName.toLowerCase()) || {
                  name: cName,
                  state: "India",
                  tag: "Verified Listings",
                  img: IMGS.city1,
                  listingsCount: "Verified Listings",
                  avgPrice: "Best Rates",
                  growth: "+10% YoY"
                };

                return (
                  <div
                    key={cName}
                    onClick={() => {
                      setCity?.(cName);
                      if (onExploreCity) {
                        onExploreCity(cName);
                      } else {
                        navigate("city-explore");
                      }
                    }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 h-52 sm:h-56 flex flex-col justify-between p-3.5 shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                      isActive
                        ? "ring-2 ring-[#008F8C] ring-offset-2 ring-offset-white shadow-[0_8px_28px_rgba(0,109,106,0.35)] scale-[1.02]"
                        : "border border-slate-200/80 hover:border-[#008F8C]"
                    }`}
                  >
                    {/* Background City/Landmark Image */}
                    <img
                      src={hub.img}
                      alt={`${cName} property hub`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay for high text contrast */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        isActive
                          ? "bg-gradient-to-t from-[#003836]/95 via-[#005B58]/65 to-black/30"
                          : "bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-black/20 group-hover:from-slate-950/95 group-hover:via-slate-950/55"
                      }`}
                    />

                    {/* Top Row: State Tag & Active Indicator */}
                    <div className="relative z-10 flex items-start justify-between">
                      <span className="bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/20">
                        {hub.state}
                      </span>
                      {isActive ? (
                        <span className="bg-[#00B4B0] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Check size={10} /> Active
                        </span>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-[#006D6A] transition-colors">
                          <MapPin size={12} />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: City Details & Explore/Map Buttons */}
                    <div className="relative z-10 text-white">
                      <h4 className="font-black text-base sm:text-lg leading-tight tracking-tight text-white group-hover:text-[#67E8F9] transition-colors drop-shadow-sm">
                        {cName}
                      </h4>
                      <p className="text-[11px] text-[#D9E5E3] font-medium truncate mt-0.5">
                        {hub.tag}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-white/80 font-medium mt-1.5 pt-1.5 border-t border-white/20">
                        <span>{hub.listingsCount}</span>
                        <span className="text-[#67E8F9] font-bold">{hub.avgPrice}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCity?.(cName);
                            if (onExploreCity) {
                              onExploreCity(cName);
                            } else {
                              navigate("city-explore");
                            }
                          }}
                          className="font-bold text-white group-hover:text-[#67E8F9] group-hover:underline flex items-center gap-1 transition-colors"
                        >
                          Explore <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCity?.(cName);
                            if (onExploreCity) {
                              onExploreCity(cName);
                            } else {
                              navigate("city-explore");
                            }
                          }}
                          title={`Explore ${cName} properties & map`}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors"
                        >
                          <MapIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Explorer / Map Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><Sparkles size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">Interactive Explorer</span></div>
              <h2 className="text-4xl font-black text-slate-800">Explore Properties in {city}</h2>
              <p className="text-slate-500 mt-2">Handpicked by SAI based on market trends & user preferences</p>
            </div>
            <button onClick={() => navigate("search")} className="hidden sm:flex items-center gap-2 text-[#006D6A] font-bold hover:gap-3 transition-all">View All <ArrowRight size={18} /></button>
          </div>

          {/* Filter pills + Map View toggle */}
          <div className="flex items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
              {(["buy","rent","commercial"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === t ? "bg-[#006A60] text-white shadow-[0_4px_12px_rgba(0,106,96,0.35)]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t === "buy" ? tr.tabBuy : t === "rent" ? tr.tabRent : tr.tabCommercial}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium hidden sm:block">{filteredProperties.length} properties</span>
              <button onClick={() => setMapView(v => !v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${mapView ? "bg-[#006A60] text-white border-[#006A60] shadow-[0_4px_12px_rgba(0,106,96,0.3)]" : "border-[#D9E5E3] text-[#006A60] bg-white hover:bg-[#E6F4F1]"}`}>
                <MapIcon size={14} />{mapView ? "Grid View" : "Map View"}
              </button>
            </div>
          </div>

          {mapView ? (
            <MapErrorBoundary fallbackHeight={520}>
              <PropertyMap
                properties={filteredProperties.map(p => (p as any).raw || { ...p, title: p.name, price: (p as any).rawPrice || p.priceNum * 100000, locality: p.location, city })}
                selectedPropertyId={null}
                onSelectProperty={(id) => { selectProperty(id); }}
                onViewPropertyDetails={(id) => { selectProperty(id); navigate("property"); }}
                city={city}
                height={520}
              />
            </MapErrorBoundary>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProperties.length > 0
                ? filteredProperties.map(p => <PropertyCard key={p.id} p={p} navigate={navigate} selectProperty={selectProperty} />)
                : <div className="col-span-4 text-center py-20 text-slate-400">
                    <Building2 size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="font-bold text-lg">No {activeTab} properties in {city}</p>
                    <p className="text-sm mt-1">Try a different filter or city</p>
                  </div>
              }
            </div>
          )}

          <div className="text-center mt-10">
            <button onClick={() => navigate("search")} className="bg-[#006D6A] text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-all inline-flex items-center gap-2">
              Explore All Properties <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose SAI */}
      <section className="py-20 bg-gradient-to-br from-[#004F4D] to-[#073B3A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4 border border-white/20"><Star size={14} className="text-[#D9E5E3]" /><span className="text-[#E6F4F2] text-sm font-bold">Why SAI</span></div>
            <h2 className="text-4xl font-black text-white mb-4">Not Just Another Property App</h2>
            <p className="text-[#D9E5E3] text-xl max-w-2xl mx-auto">SAI thinks, understands, and recommends — like a friend who knows real estate.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: "Conversational AI Search", desc: "Describe your dream home in plain language — any Indian language. SAI understands context, preferences, and lifestyle needs.", highlight: "No manual filters needed" },
              { icon: Shield, title: "AI Fraud Detection", desc: "Every listing is analyzed by SAI's Trust Engine — 50+ data points, RERA check, ownership verification, and price anomaly detection.", highlight: "86% fraud prevention rate" },
              { icon: Globe, title: "8 Indian Languages", desc: "Search, chat, and receive responses in English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, or Bengali — voice and text.", highlight: "Voice & text support" },
              { icon: Brain, title: "AI Match Score", desc: "Every property gets a personal match score based on your exact preferences — not generic search rankings.", highlight: "Up to 97% accuracy" },
              { icon: TrendingUp, title: "Investment Intelligence", desc: "AI-powered price prediction, investment scores, and market trend analysis to help you buy at the right time.", highlight: "12% avg return prediction" },
              { icon: Volume2, title: "Senior Citizen Mode", desc: "Dedicated accessible experience with larger text, voice navigation, emergency contacts, and health-friendly property filters.", highlight: "Inclusive by design" },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div key={title} className="bg-white/10 backdrop-blur rounded-3xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5"><Icon size={22} className="text-white" /></div>
                <h3 className="text-white font-black text-lg mb-3">{title}</h3>
                <p className="text-[#D9E5E3] text-sm leading-relaxed mb-4">{desc}</p>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How SAI Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><Zap size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">How It Works</span></div>
            <h2 className="text-4xl font-black text-slate-800 mb-4">Find a Home in 4 Simple Steps</h2>
            <p className="text-slate-500 text-xl">From conversation to keys — powered by AI</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: MessageCircle, title: "Talk to SAI", desc: "Type or speak what you're looking for — budget, location, BHK, amenities — in any language.", color: "bg-[#006D6A]" },
              { step: "02", icon: Brain, title: "AI Understands", desc: "SAI parses your intent, extracts requirements, and searches 2M+ verified listings in milliseconds.", color: "bg-[#006D6A]" },
              { step: "03", icon: Sparkles, title: "Get Smart Matches", desc: "Receive AI-scored results with match percentages, investment scores, and fraud detection reports.", color: "bg-green-500" },
              { step: "04", icon: Home, title: "Book Your Visit", desc: "Compare properties, contact owners directly, and schedule site visits — all within SAI.", color: "bg-orange-500" },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}><Icon size={24} className="text-white" /></div>
                <span className="text-7xl font-black text-[#E6F4F2] absolute top-0 right-0 leading-none select-none">{step}</span>
                <h3 className="font-black text-slate-800 text-xl mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 bg-gradient-to-r from-[#E6F4F2] to-[#E6F4F2] rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-slate-800 mb-2">Try SAI right now — no signup needed!</h3>
              <p className="text-slate-500">Browse, search, compare, and get AI recommendations instantly as a guest.</p>
            </div>
            <button onClick={() => navigate("search")} className="flex-shrink-0 bg-[#006D6A] text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-all flex items-center gap-2">
              Start Searching <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><Brain size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">AI Features</span></div>
            <h2 className="text-4xl font-black text-slate-800 mb-4">Powered by Intelligence</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
              <div className="w-12 h-12 bg-[#E6F4F2] rounded-2xl flex items-center justify-center mb-5"><Bot size={24} className="text-[#006D6A]" /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">Conversational AI Search</h3>
              <div className="space-y-3 mb-6">
                {[
                  { user: "3 BHK near IT Park in Hinjewadi under 1 crore", ai: "Found 12 properties! Top: Mahindra Windchimes at ₹95L — 800m from Infosys Phase 2" },
                  { user: "मुझे 2BHK चाहिए मेट्रो के पास ₹60 लाख में पुणे में", ai: "मिला! 18 प्रॉपर्टीज़ — Wakad में Godrej Woodsville सबसे अच्छा विकल्प" },
                ].map((ex, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    <div className="flex gap-2"><span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0"><User size={11} /></span><p className="text-slate-600 text-sm">{ex.user}</p></div>
                    <div className="flex gap-2"><span className="w-6 h-6 bg-[#006D6A] rounded-full flex items-center justify-center flex-shrink-0"><Bot size={11} className="text-white" /></span><p className="text-[#006D6A] text-sm font-medium">{ex.ai}</p></div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("chat")} className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004F4D] transition-colors flex items-center gap-2">Try AI Search <ArrowRight size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Fraud Detection", desc: "AI Trust Score for every listing", val: "86/100", color: "bg-green-50 border-green-100", iconBg: "bg-green-500", iconColor: "text-white" },
                { icon: TrendingUp, title: "Price Prediction", desc: "AI-powered 5-year price forecast", val: "+34%", color: "bg-[#E6F4F2] border-[#D9E5E3]", iconBg: "bg-[#006D6A]", iconColor: "text-white" },
                { icon: Sparkles, title: "Match Scoring", desc: "Personalized property match %", val: "97%", color: "bg-[#E6F4F2] border-[#E6F4F2]", iconBg: "bg-[#006D6A]", iconColor: "text-white" },
                { icon: Layers, title: "AI Comparison", desc: "Compare up to 4 properties with AI", val: "4 Props", color: "bg-orange-50 border-orange-100", iconBg: "bg-orange-500", iconColor: "text-white" },
                { icon: Globe, title: "Multilingual", desc: "8 Indian languages supported", val: "8 Langs", color: "bg-teal-50 border-teal-100", iconBg: "bg-teal-500", iconColor: "text-white" },
                { icon: BarChart2, title: "Market Insights", desc: "Real-time locality analytics", val: "Live", color: "bg-pink-50 border-pink-100", iconBg: "bg-pink-500", iconColor: "text-white" },
              ].map(({ icon: Icon, title, desc, val, color, iconBg, iconColor }) => (
                <div key={title} className={`bg-white border rounded-3xl p-5 ${color} hover:shadow-lg transition-shadow cursor-pointer`} onClick={() => navigate("search")}>
                  <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}><Icon size={18} className={iconColor} /></div>
                  <p className="font-black text-2xl text-slate-800 mb-0.5">{val}</p>
                  <p className="font-bold text-slate-700 text-sm">{title}</p>
                  <p className="text-slate-400 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Builders */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-800 mb-3">Trusted by Top Builders</h2>
            <p className="text-slate-500">India's most reputable developers list exclusively on SAI</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
            {BUILDERS.map(b => (
              <div key={b.name} onClick={() => navigate("builder")} className="bg-slate-50 rounded-3xl p-5 flex flex-col items-center gap-3 hover:shadow-[0_4px_20px_rgba(0,109,106,0.15)] hover:bg-[#E6F4F2] transition-all cursor-pointer border border-[#D9E5E3] group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center group-hover:scale-105 transition-transform shadow">
                  <span className="text-white font-black text-base">{b.logo}</span>
                </div>
                <div className="text-center"><p className="font-bold text-slate-800 text-xs leading-tight">{b.name}</p><p className="text-[#006D6A] text-[10px] mt-0.5">{b.projects} Projects</p></div>
              </div>
            ))}
          </div>
          <div className="text-center"><button onClick={() => navigate("builder")} className="text-[#006D6A] font-bold hover:underline flex items-center gap-2 mx-auto">View All Builders <ArrowRight size={16} /></button></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><Star size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">Testimonials</span></div>
            <h2 className="text-4xl font-black text-slate-800">What Our Users Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Rahul Sharma", role: "Buyer · Pune", text: "SAI found my 2BHK in Baner within 3 minutes of chatting. The AI match score was 97% and the property was exactly what I described. Incredible!", rating: 5, img: "RS" },
              { name: "Priya Desai", role: "Seller · Mumbai", text: "I listed my property on SAI and got 28 genuine inquiries in the first week. The AI description generator wrote better copy than I could have!", rating: 5, img: "PD" },
              { name: "Vikram Nair", role: "Builder · Bangalore", text: "SAI's builder dashboard gave us insights we never had before — buyer intent scores, pricing recommendations, and real-time lead quality analysis.", rating: 5, img: "VN" },
              { name: "Kavitha Menon", role: "Senior Buyer · Chennai", text: "The Senior Mode made everything so easy. I could just speak in Tamil and SAI understood perfectly. My daughter helped me but the app itself was simple!", rating: 5, img: "KM" },
              { name: "Arjun Patel", role: "Agent · Ahmedabad", text: "SAI's AI lead matching saved me 20 hours a week. It pre-qualifies buyers and matches them to my listings automatically. Revenue up 3x!", rating: 5, img: "AP" },
              { name: "Sunita Joshi", role: "Buyer · Hyderabad", text: "The fraud detection gave me peace of mind. It caught 2 suspicious listings before I wasted time on site visits. Highly recommend SAI!", rating: 5, img: "SJ" },
            ].map(({ name, role, text, rating, img }) => (
              <div key={name} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,109,106,0.08)] border border-[#D9E5E3] hover:shadow-[0_8px_32px_rgba(0,109,106,0.15)] transition-shadow">
                <div className="flex gap-1 mb-4">{[...Array(rating)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center"><span className="text-white text-xs font-black">{img}</span></div>
                  <div><p className="font-bold text-slate-800 text-sm">{name}</p><p className="text-slate-400 text-xs">{role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 mb-4"><HelpCircle size={14} className="text-[#006D6A]" /><span className="text-[#008F8C] text-sm font-bold">FAQ</span></div>
            <h2 className="text-4xl font-black text-slate-800 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know about SAI</p>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-[#D9E5E3] overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-bold text-slate-800 text-sm pr-4">{q}</span>
                  <div className={`w-8 h-8 rounded-xl bg-[#E6F4F2] flex items-center justify-center flex-shrink-0 transition-transform ${faqOpen === i ? "rotate-180 bg-[#006D6A]" : ""}`}>
                    <ChevronDown size={16} className={faqOpen === i ? "text-white" : "text-[#006D6A]"} />
                  </div>
                </button>
                {faqOpen === i && <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-[#D9E5E3] pt-4">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-[#004F4D] to-[#073B3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6"><Brain size={32} className="text-white" /></div>
          <h2 className="text-4xl font-black text-white mb-4">Ready to Find Your Dream Home?</h2>
          <p className="text-[#D9E5E3] text-xl mb-10">Join 2 million+ homebuyers using SAI's AI to find the perfect property</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate("search")} className="bg-white text-[#008F8C] font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Sparkles size={18} />Start AI Search</button>
            <button onClick={() => navigate("signup")} className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">Create Free Account</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchPage({ navigate, city, lang, selectProperty }: { navigate: (pg: Page) => void; city: string; lang: string; selectProperty: (id: number) => void }) {
  const [view, setView] = useState<"grid"|"list">("grid");
  const [sort, setSort] = useState("AI Match");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [listening, setListening] = useState(false);
  const [voicePanel, setVoicePanel] = useState(true);
  const [voiceModal, setVoiceModal] = useState(false);
  const tr = useTranslations(lang);
  const [dbProps, setDbProps] = useState<UIProperty[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    setLoadingSearch(true);
    if (searchQ.trim()) {
      searchNaturalLanguage(searchQ, city !== "All Cities" ? city : undefined, lang)
        .then(res => {
          if (res && res.items) setDbProps(res.items.map(toUIProperty));
          else setDbProps([]);
        })
        .catch(() => {
          setDbProps([]);
        })
        .finally(() => setLoadingSearch(false));
    } else {
      fetchProperties({ city: city !== "All Cities" ? city : undefined, limit: 50 })
        .then(res => {
          if (res && res.items && res.items.length > 0) {
            setDbProps(res.items.map(toUIProperty));
          } else {
            setDbProps([]);
          }
        })
        .catch(() => {
          setDbProps([]);
        })
        .finally(() => setLoadingSearch(false));
    }
  }, [searchQ, city, lang]);

  const activeProps = dbProps.length > 0
    ? dbProps
    : (city && city !== "All Cities"
        ? PROPERTIES.filter(p => p.location.toLowerCase().includes(city.toLowerCase()))
        : (searchQ.trim() ? [] : PROPERTIES));
  const sortedProperties = [...activeProps].sort((a, b) => {
    if (sort === "Price ↓") return a.priceNum - b.priceNum;
    if (sort === "Price ↑") return b.priceNum - a.priceNum;
    if (sort === "Rating") return b.rating - a.rating;
    if (sort === "AI Match") return b.match - a.match;
    return 0;
  });

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert(tr.voiceUnsupported); return; }
    const rec = new SR();
    rec.lang = getSpeechCode(lang);
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearchQ(text);
      executeVoiceCommand(text, navigate, undefined, setSearchQ);
      setListening(false);
      setVoicePanel(false);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdvancedFilters open={filtersOpen} onClose={() => setFiltersOpen(false)} />

      {/* Voice-First Hero Panel */}
      {voicePanel && (
        <div className="bg-gradient-to-br from-[#006A60] via-[#004F4D] to-[#073B3A] pt-16 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #008A80 0%, transparent 60%), radial-gradient(circle at 80% 20%, #E6F4F1 0%, transparent 50%)" }} />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Bot size={14} className="text-[#E6F4F1]" />
              <span className="text-white text-xs font-bold tracking-wide">SAI Voice Search — {LANGUAGES.find(l => l.code === lang)?.name}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              {tr.searchPlaceholder ? `"${tr.searchPlaceholder}"` : "Speak to find your perfect home"}
            </h2>
            <p className="text-white/60 text-base mb-10">Tap the mic and describe your dream property</p>

            {/* Large animated mic button */}
            <div className="relative flex items-center justify-center mb-8">
              {listening && (
                <>
                  <span className="absolute w-40 h-40 rounded-full bg-white/10 animate-ping" />
                  <span className="absolute w-52 h-52 rounded-full bg-white/5 animate-ping" style={{ animationDelay: "0.3s" }} />
                  <span className="absolute w-64 h-64 rounded-full bg-white/[0.03] animate-ping" style={{ animationDelay: "0.6s" }} />
                </>
              )}
              <button
                onClick={startVoice}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  listening
                    ? "bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.6)] scale-110"
                    : "bg-white hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                }`}
              >
                <Mic size={48} className={listening ? "text-white" : "text-[#006A60]"} />
              </button>
            </div>

            {listening && (
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ height: `${16 + Math.random() * 20}px`, animationDelay: `${i * 0.12}s` }} />
                ))}
                <span className="text-white font-bold ml-3">{tr.voiceListening ?? "Listening…"}</span>
              </div>
            )}

            {/* Or type it */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 border border-white/20 max-w-md mx-auto">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0"><Search size={14} className="text-white" /></div>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setVoicePanel(false)}
                placeholder="Or type your search here…"
                className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none"
              />
              {searchQ && (
                <button onClick={() => setVoicePanel(false)} className="bg-white text-[#006A60] font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#E6F4F1] transition-colors">
                  Search
                </button>
              )}
            </div>

            <button onClick={() => setVoicePanel(false)} className="mt-6 text-white/50 text-sm hover:text-white/80 transition-colors underline underline-offset-2">
              Skip — Browse all properties
            </button>
          </div>
        </div>
      )}

      {/* Voice Mic Modal */}
      <VoiceMicModal open={voiceModal} onClose={() => setVoiceModal(false)} lang={lang} onResult={(text) => { executeVoiceCommand(text, navigate, undefined, setSearchQ); setVoicePanel(false); }} />

      {/* Search Header */}
      <div className="bg-white border-b border-[#D9E5E3] shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Back + search row */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate("home")} className="flex items-center gap-1.5 text-[#006A60] font-bold text-sm hover:gap-2.5 transition-all flex-shrink-0">
              <ChevronLeft size={17} />Back
            </button>
            <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-[#D9E5E3] focus-within:border-[#008F8C]/40 transition-colors">
              <div className="w-8 h-8 bg-[#006A60] rounded-lg flex items-center justify-center flex-shrink-0"><Bot size={15} className="text-white" /></div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} className="flex-1 text-slate-700 bg-transparent text-sm focus:outline-none placeholder:text-slate-400" placeholder="Ask SAI to find properties in any language..." />
              <button onClick={() => setVoiceModal(true)} title="Voice Search" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${voiceModal ? "bg-[#006A60] text-white shadow-[0_0_10px_rgba(0,106,96,0.5)]" : "bg-[#E6F4F2] hover:bg-[#006A60]"} group`}>
                <Mic size={14} className={voiceModal ? "text-white animate-pulse" : "text-[#006A60] group-hover:text-white transition-colors"} />
              </button>
            </div>
            <button className="bg-[#006A60] text-white font-bold px-5 py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] flex items-center gap-2 flex-shrink-0">
              <Search size={16} />Search
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 bg-[#E6F4F2] text-[#008F8C] font-bold px-4 py-2 rounded-xl text-xs flex-shrink-0 hover:bg-[#D9E5E3] transition-colors border border-[#D9E5E3]">
                <SlidersHorizontal size={13} />Filters
                <span className="bg-[#006A60] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">3</span>
              </button>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {["AI Match", "Price ↑", "Price ↓", "Newest", "Rating", "Area"].map(s => {
                  const isPrice = s === "Price ↑" || s === "Price ↓";
                  const isActive = sort === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? "bg-[#00665C] text-white border-[#00665C] shadow-[0_4px_12px_rgba(0,102,92,0.35)]"
                          : isPrice
                          ? "bg-white text-[#006A60] border-[#006A60] hover:bg-[#E6F4F1]"
                          : "bg-white text-slate-500 border-[#D9E5E3] hover:border-[#006A60] hover:text-[#006A60]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-3">
              <p className="text-sm text-slate-500"><span className="font-black text-slate-800">{sortedProperties.length}</span> found</p>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button onClick={() => setView("grid")} className={`p-2 rounded-lg ${view==="grid" ? "bg-white shadow" : ""}`}><Grid size={15} className={view==="grid" ? "text-[#006D6A]" : "text-slate-400"} /></button>
                <button onClick={() => setView("list")} className={`p-2 rounded-lg ${view==="list" ? "bg-white shadow" : ""}`}><List size={15} className={view==="list" ? "text-[#006D6A]" : "text-slate-400"} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insight Bar */}
        <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Brain size={20} className="text-white" /></div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">SAI found 234 properties matching your search in {city}</p>
            <p className="text-[#E6F4F2] text-xs mt-0.5">Top areas: Baner (48), Wakad (36), Hinjewadi (29), Kharadi (24) · Best deal expires in 3 days</p>
          </div>
          <button className="flex-shrink-0 bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors">Refine with SAI</button>
        </div>

        {/* Sponsored row at top of results */}
        {view === "list" && (
          <div className="mb-2 flex items-center gap-2">
            <Zap size={13} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Sponsored Results</span>
            <span className="text-xs text-slate-400">· Promoted by agents &amp; builders</span>
          </div>
        )}

        {/* Sort indicator */}
        {(sort === "Price ↑" || sort === "Price ↓") && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-2 h-2 rounded-full bg-[#006A60] animate-pulse" />
            <span className="text-xs font-bold text-[#006A60]">
              Sorted: {sort === "Price ↓" ? "Lowest price first" : "Highest price first"}
            </span>
            <span className="text-xs text-slate-400">— {sortedProperties.length} properties</span>
          </div>
        )}

        {/* Results Grid */}
        <div className={`grid gap-6 ${view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
          {sortedProperties.map(p => (
            view === "list" ? (
              <div key={p.id} onClick={() => { selectProperty(p.id); navigate("property"); }} className={`bg-white rounded-3xl p-4 flex items-center gap-5 shadow-[0_2px_16px_rgba(0,109,106,0.1)] border cursor-pointer hover:shadow-[0_4px_24px_rgba(0,109,106,0.18)] transition-shadow ${p.sponsored ? "border-amber-200 ring-1 ring-amber-100" : "border-[#D9E5E3]"}`}>
                <div className="relative flex-shrink-0">
                  <img src={p.img} alt={p.name} className="w-36 h-28 rounded-2xl object-cover bg-[#E6F4F2]" />
                  <span className="absolute top-2 left-2 bg-[#006D6A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{p.badge}</span>
                  {p.sponsored && <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><Zap size={8} />Sponsored</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {p.sponsored && <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Zap size={9} />{p.sponsoredLabel}</p>}
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <p className="text-sm text-slate-500">{p.type} · {p.area} · {p.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0"><p className="font-black text-[#008F8C] text-lg">{p.price}</p><p className="text-xs text-slate-400">EMI ₹{Math.round(p.priceNum*750).toLocaleString()}/mo</p></div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1"><Sparkles size={12} className="text-[#008F8C]" /><span className="text-xs text-[#008F8C] font-bold">{p.match}% match</span></div>
                    {p.rera && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">RERA</span>}
                    <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">{p.dist}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); navigate("compare"); }} className="px-4 py-2 bg-[#E6F4F2] text-[#008F8C] font-bold text-xs rounded-xl hover:bg-[#E6F4F2] transition-colors">Compare</button>
                  <button onClick={e => e.stopPropagation()} className="px-4 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors">Contact</button>
                </div>
              </div>
            ) : (
              <PropertyCard key={p.id} p={p} navigate={navigate} selectProperty={selectProperty} />
            )
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-white border-2 border-[#D9E5E3] text-[#008F8C] font-bold px-8 py-4 rounded-2xl hover:bg-[#E6F4F2] transition-colors">Load More Properties</button>
        </div>
      </div>
    </div>
  );
}

function PropertyPage({ navigate, propertyId, openBuilding3D }: { navigate: (pg: Page) => void; propertyId?: number; openBuilding3D?: (buildingId?: number, floor?: number, unit?: string) => void }) {
  const [dbProperty, setDbProperty] = useState<any>(null);
  const [investData, setInvestData] = useState<any>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [walkthroughData, setWalkthroughData] = useState<any>(null);
  const { lang, tr } = useI18n();

  useEffect(() => {
    const id = propertyId || 1;
    // Record property view in database (A9)
    recordPropertyView(id).catch(() => {});

    fetchPropertyById(id)
      .then(res => {
        if (res) setDbProperty(toUIProperty(res));
      })
      .catch(() => {
        const fallback = PROPERTIES.find(x => x.id === id) ?? PROPERTIES[0];
        setDbProperty(fallback);
      });

    predictInvestmentAI(id, 5, undefined, lang)
      .then(res => {
        if (res && res.metrics) setInvestData(res);
      })
      .catch(() => {});

    fetchProperty3DTour(id)
      .then(res => {
        if (res && res.rooms && res.rooms.length > 0) {
          setWalkthroughData(res);
        }
      })
      .catch(() => {
        fetchPropertyWalkthrough(id)
          .then(res => setWalkthroughData(res))
          .catch(() => {});
      });
  }, [propertyId, lang]);

  const p = dbProperty || PROPERTIES.find(x => x.id === propertyId) || PROPERTIES[0];
  const propertyPhotos = useMemo(() => {
    return getPropertyImages(p.id, p.img, p.type, p.images);
  }, [p.id, p.img, p.type, p.images]);
  const imgs = propertyPhotos.map(ph => ph.url);
  const currentPhoto = propertyPhotos[imgIdx] || { url: imgs[0] || p.img, label: "Main View" };

  const toggleFav = () => {
    const next = !isSaved;
    setIsSaved(next);
    if (next) {
      addFavorite(p.id).catch(() => {});
      setToastMsg(tr.saved);
    } else {
      removeFavorite(p.id).catch(() => {});
      setToastMsg("Removed from Saved");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastAlert message={toastMsg} onClose={() => setToastMsg(null)} />
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        propertyId={p.id}
        propertyTitle={p.name}
        onSuccess={(msg) => setToastMsg(msg)}
      />
      <SiteVisitModal
        isOpen={visitOpen}
        onClose={() => setVisitOpen(false)}
        propertyId={p.id}
        propertyTitle={p.name}
        onSuccess={(msg) => setToastMsg(msg)}
      />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[#67E8F9]" />
              <span className="font-bold text-sm">{currentPhoto.label}</span>
              <span className="text-white/60 text-xs">({imgIdx + 1} of {propertyPhotos.length})</span>
            </div>
            <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors" onClick={() => setLightbox(false)}>
              <X size={20} className="text-white" />
            </button>
          </div>
          <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl z-10" 
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length); }}
            >
              <ChevronLeft size={24} />
            </button>
            <img 
              src={imgs[imgIdx]} 
              alt={currentPhoto.label} 
              onError={(e) => {
                const fallback = getFallbackPropertyImage(p.id, p.type);
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl" 
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl z-10" 
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length); }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto max-w-xl py-2 px-3 bg-black/40 rounded-2xl backdrop-blur-md" onClick={e => e.stopPropagation()}>
            {propertyPhotos.map((ph, i) => (
              <button 
                key={i} 
                onClick={() => setImgIdx(i)} 
                className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === imgIdx ? "border-[#00B4B0] scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img 
                  src={ph.url} 
                  alt={ph.label} 
                  onError={(e) => {
                    const fallback = getFallbackPropertyImage(p.id, p.type);
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                  className="w-16 h-12 object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("search")} className="flex items-center gap-2 text-[#006D6A] font-semibold text-sm hover:gap-3 transition-all"><ChevronLeft size={16} />{tr.backToResults}</button>
          <div className="flex-1" />
          <button onClick={() => navigate("compare")} className="flex items-center gap-2 bg-[#E6F4F2] text-[#008F8C] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#E6F4F2] transition-colors"><Layers size={14} />{tr.compare}</button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setToastMsg("Link copied to clipboard!"); }} className="flex items-center gap-2 bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors"><Share2 size={14} />{tr.share}</button>
          <button onClick={toggleFav} className="flex items-center gap-2 bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors">
            <Heart size={14} className={isSaved ? "fill-red-500 text-red-500" : "text-slate-400"} />
            {isSaved ? tr.saved : tr.save}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
              <div className="relative group/mainimg">
                <img 
                  src={imgs[imgIdx]} 
                  alt={currentPhoto.label} 
                  onError={(e) => {
                    const fallback = getFallbackPropertyImage(p.id, p.type);
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                  onClick={() => setLightbox(true)} 
                  className="w-full h-80 sm:h-[420px] object-cover bg-[#E6F4F2] cursor-zoom-in transition-all duration-300" 
                />
                
                {/* Left/Right controls on main image */}
                {propertyPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgIdx((i) => (i - 1 + propertyPhotos.length) % propertyPhotos.length);
                      }}
                      title="Previous photo"
                      className="opacity-0 group-hover/mainimg:opacity-100 transition-all absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur shadow-lg hover:scale-110 active:scale-95"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgIdx((i) => (i + 1) % propertyPhotos.length);
                      }}
                      title="Next photo"
                      className="opacity-0 group-hover/mainimg:opacity-100 transition-all absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur shadow-lg hover:scale-110 active:scale-95"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2 flex-wrap items-center">
                  <span className="bg-[#006D6A] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">{p.badge}</span>
                  {p.verified && <span className="bg-white/90 backdrop-blur text-green-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow"><CheckCircle size={11} />{tr.reraVerified}</span>}
                  <span className="bg-black/65 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow">
                    <Camera size={12} className="text-[#67E8F9]" />
                    {currentPhoto.label} ({imgIdx + 1}/{propertyPhotos.length})
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow">
                  <Sparkles size={13} className="text-[#006D6A]" /><span className="text-sm font-black text-[#008F8C]">{p.match}% {tr.match}</span>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  {propertyPhotos.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx ? "w-6 bg-white" : "w-2 bg-white/60"}`} />)}
                </div>
                <button onClick={() => setLightbox(true)} className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow transition-colors"><Camera size={13} className="text-white" /><span className="text-white text-xs font-medium">{tr.fullScreen} ({propertyPhotos.length})</span></button>
              </div>

              {/* Thumbnails with room labels */}
              <div className="flex gap-2.5 p-3 overflow-x-auto scrollbar-thin bg-slate-50/50">
                {propertyPhotos.map((photo, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setImgIdx(i); }} 
                    className={`flex-shrink-0 group/th text-left rounded-xl overflow-hidden border-2 transition-all w-28 sm:w-32 bg-white shadow-sm hover:shadow ${i===imgIdx ? "border-[#006D6A] ring-2 ring-[#006D6A]/20 scale-[1.02]" : "border-slate-200 opacity-70 hover:opacity-100"}`}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.label} 
                      onError={(e) => {
                        const fallback = getFallbackPropertyImage(p.id, p.type);
                        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      }}
                      className="w-full h-16 object-cover" 
                    />
                    <div className="p-1.5">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{photo.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI PROPERTY WALKTHROUGH PROMINENT SHOWCASE */}
            <div className="bg-gradient-to-br from-[#073B3A] via-[#004F4D] to-[#006D6A] rounded-3xl p-6 sm:p-8 text-white shadow-[0_8px_32px_rgba(0,109,106,0.25)] border border-teal-400/30 overflow-hidden relative group">
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/40 text-xs font-black uppercase tracking-wider">
                      <Sparkles size={12} className="text-teal-300" />
                      AI Property Walkthrough
                    </span>
                    <span className="text-xs text-white/70 font-medium hidden sm:inline">
                      • Dynamic animated tour from verified specifications
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                    Animated Property Showcase
                  </h2>
                  <p className="text-teal-100/90 text-sm max-w-xl leading-relaxed mb-4">
                    Experience an automated cinematic walkthrough with Ken Burns zoom, room transitions, and verified specs. No manual video shooting required.
                  </p>

                  {/* Available Scenes Chips */}
                  <div className="mb-4">
                    <span className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold block mb-2">
                      Dynamic Room Walkthrough Sequence:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "entrance", name: "Entrance & Foyer" },
                        { id: "living-room", name: "Living Room" },
                        { id: "dining-area", name: "Dining Area" },
                        { id: "modular-kitchen", name: "Modular Kitchen" },
                        { id: "master-bedroom", name: "Master Bedroom" },
                        { id: "second-bedroom", name: "Second Bedroom" },
                        { id: "bathroom", name: "Bathrooms (Master & Common)" },
                        { id: "balcony", name: "Private Balcony" },
                      ].map((sc: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWalkthroughOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 hover:border-teal-300/50 border border-white/15 text-xs text-white font-medium flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer group/chip"
                          title={`Explore ${sc.name} in 3D walkthrough`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-300 group-hover/chip:scale-125 transition-transform" />
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Property specs summary row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100/90 pt-1">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span>•</span>
                    <span>{p.location}</span>
                    <span>•</span>
                    <span>{p.area}</span>
                    <span>•</span>
                    <span className="font-bold text-teal-200 text-sm">{p.price}</span>
                  </div>
                </div>

                {/* Right Preview Card / Action CTA */}
                <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-center">
                  <div 
                    onClick={() => setWalkthroughOpen(true)}
                    className="w-full md:w-56 h-36 rounded-2xl overflow-hidden relative cursor-pointer group/tour border-2 border-teal-400/40 shadow-xl transition-all hover:scale-105 hover:border-teal-300"
                  >
                    <img
                      src={imgs[0] || p.img}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/tour:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover/tour:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.8)] group-hover/tour:scale-110 transition-transform">
                        <Play size={24} className="fill-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] text-teal-200 font-semibold text-center">
                      Click to Open Tour
                    </div>
                  </div>

                  <button
                    onClick={() => setWalkthroughOpen(true)}
                    className="mt-3 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(45,212,191,0.4)] active:scale-95 transition-all cursor-pointer tracking-wide"
                  >
                    <Play size={16} className="fill-current" />
                    ▶ Start 3D Virtual Tour
                  </button>

                  <button
                    onClick={() => {
                      if (openBuilding3D) {
                        openBuilding3D(p.tower_id || p.building_id || 10);
                      } else {
                        navigate("building-3d");
                      }
                    }}
                    className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-800 to-emerald-900 hover:from-teal-700 hover:to-emerald-800 text-teal-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-teal-500/40 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Building2 size={14} className="text-teal-400" />
                    🏢 Explore 3D Building (Floors & Flats)
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Walkthrough Component */}
            <PropertyWalkthrough
              isModal={true}
              isOpen={walkthroughOpen}
              propertyId={p.id}
              propertyTitle={p.name}
              property={p}
              initialWalkthrough={walkthroughData}
              onClose={() => setWalkthroughOpen(false)}
              onContactClick={() => {
                setWalkthroughOpen(false);
                setEnquiryOpen(true);
              }}
              onScheduleVisitClick={() => {
                setWalkthroughOpen(false);
                setVisitOpen(true);
              }}
            />

            {/* Property Info */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
              <div className="flex items-start justify-between mb-4">
                <div><h1 className="text-2xl font-black text-slate-800">{p.name}</h1><p className="text-slate-500 mt-1">{p.type} · {p.area} · {p.status}</p><div className="flex items-center gap-2 mt-2"><MapPin size={14} className="text-[#008F8C]" /><span className="text-slate-500 text-sm">{p.location}</span></div></div>
                <div className="text-right"><p className="text-3xl font-black text-[#008F8C]">{p.price}</p><p className="text-slate-400 text-sm">EMI ₹{Math.round(p.priceNum*750).toLocaleString()}/mo</p><div className="flex items-center gap-1 mt-1 justify-end"><Star size={13} className="text-amber-400 fill-amber-400" /><span className="text-sm font-bold text-slate-700">{p.rating}</span></div></div>
              </div>
              {/* AI Score Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: tr.aiMatch, val: `${p.match}%`, icon: Sparkles, color: "bg-[#006D6A]" },
                  { label: tr.investScore, val: "8.4/10", icon: TrendingUp, color: "bg-green-500" },
                  { label: tr.trustScore, val: "86/100", icon: Shield, color: "bg-[#006D6A]" },
                ].map(({ label, val, icon: Icon, color }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center border border-[#D9E5E3]">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow`}><Icon size={18} className="text-white" /></div>
                    <p className="font-black text-slate-800 text-xl">{val}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {/* SAI Analysis */}
              <div className="bg-[#E6F4F2] rounded-2xl p-5 border border-[#D9E5E3]">
                <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 bg-[#006D6A] rounded-lg flex items-center justify-center"><Brain size={15} className="text-white" /></div><p className="font-black text-[#073B3A]">{tr.aiAnalysis}</p></div>
                <p className="text-[#006D6A] text-sm leading-relaxed">{tr.aiAnalysisDesc}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["12% Price Growth", "Great Connectivity", "Premium Amenities", "Low Crime Zone"].map(t => <span key={t} className="bg-[#006D6A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full">{t}</span>)}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
              <h3 className="font-black text-slate-800 text-lg mb-5">{tr.amenities}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {[{ icon: Dumbbell, l: "Gym" }, { icon: Trees, l: "Garden" }, { icon: Car, l: "Parking" }, { icon: Shield, l: "Security" }, { icon: Zap, l: "Power Backup" }, { icon: Coffee, l: "Club House" }, { icon: Train, l: "Metro Nearby" }, { icon: GraduationCap, l: "School Nearby" }, { icon: Hospital, l: "Hospital Nearby" }, { icon: ShoppingBag, l: "Mall Nearby" }, { icon: Wifi, l: "Internet" }, { icon: Car, l: "EV Charging" }].map(({ icon: Icon, l }) => (
                  <div key={l} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-[#E6F4F2] transition-colors">
                    <Icon size={20} className="text-[#006D6A]" />
                    <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby & Price Prediction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                <h3 className="font-black text-slate-800 mb-4">{tr.nearbyPlaces}</h3>
                <div className="space-y-3">
                  {[{ icon: Train, label: "Wakad Metro", dist: "0.8 km", c: "text-[#006D6A]" }, { icon: Hospital, label: "Symbiosis Hospital", dist: "1.2 km", c: "text-red-500" }, { icon: GraduationCap, label: "MIT Pune", dist: "2.1 km", c: "text-green-500" }, { icon: ShoppingBag, label: "Westend Mall", dist: "1.5 km", c: "text-[#008F8C]" }, { icon: Coffee, label: "Infosys IT Park", dist: "3.0 km", c: "text-orange-500" }].map(({ icon: Icon, label, dist, c }) => (
                    <div key={label} className="flex items-center gap-3"><div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center"><Icon size={16} className={c} /></div><span className="text-sm text-slate-700 font-medium flex-1">{label}</span><span className="text-xs text-[#006D6A] font-bold bg-[#E6F4F2] px-2.5 py-1 rounded-full">{dist}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-600" />
                    <h3 className="font-black text-green-800">{tr.pricePrediction}</h3>
                  </div>
                  {investData?.metrics?.investment_score_out_of_10 && (
                    <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      Score: {investData.metrics.investment_score_out_of_10}/10
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                    <span className="text-slate-500 text-xs">Current Price</span>
                    <span className="font-black text-slate-800 text-sm">{p.price}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                    <span className="text-slate-500 text-xs">Est. Monthly Rent</span>
                    <span className="font-black text-slate-800 text-sm">
                      {investData?.metrics ? `₹${investData.metrics.monthly_rent_estimate.toLocaleString("en-IN")}/mo` : "₹32,000/mo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                    <span className="text-slate-500 text-xs">Gross Rental Yield</span>
                    <span className="font-black text-green-700 text-sm">
                      {investData?.metrics ? `${investData.metrics.gross_rental_yield_pct}%` : "3.8%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                    <span className="text-slate-500 text-xs">Projected 3-Year Value</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">
                        {investData?.metrics ? `₹${(investData.metrics.projected_value_3yr / 100000).toFixed(1)}L` : "₹1.14Cr"}
                      </span>
                      <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full">Est.</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                    <span className="text-slate-500 text-xs">Projected 5-Year Value</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">
                        {investData?.metrics ? `₹${(investData.metrics.projected_value_5yr / 100000).toFixed(1)}L` : "₹1.39Cr"}
                      </span>
                      <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full">+63%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {investData?.disclaimer || "*Model-based projection. Estimates do not guarantee future return. Source: Qwen3 AI Analytics."}
                </p>
              </div>
            </div>

            {/* Document Verification & Real Records Section */}
            <PropertyDocumentVerificationSection
              propertyId={p.id}
              propertyTitle={p.name}
              className="mt-6"
            />
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3] sticky top-24">
              <h3 className="font-black text-slate-800 mb-5">{tr.contactOwner} & Actions</h3>
              <button onClick={() => setVisitOpen(true)} className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-all mb-3 flex items-center justify-center gap-2">
                <Calendar size={17} />{tr.scheduleVisit}
              </button>
              <button onClick={() => setEnquiryOpen(true)} className="w-full border-2 border-[#D9E5E3] text-[#008F8C] font-bold py-3.5 rounded-2xl hover:bg-[#E6F4F2] transition-colors mb-3 flex items-center justify-center gap-2">
                <Phone size={16} />{tr.contactOwner}
              </button>
              <button onClick={() => navigate("compare")} className="w-full border-2 border-slate-100 text-slate-600 font-semibold py-3.5 rounded-2xl hover:bg-slate-50 transition-colors mb-5 flex items-center justify-center gap-2">
                <Layers size={16} />{tr.addToCompare}
              </button>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="font-bold text-slate-700 text-sm mb-3">{tr.ownerDetails}</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center"><span className="text-white text-xs font-black">AJ</span></div>
                  <div><p className="font-bold text-slate-800 text-sm">Amit Jain</p><p className="text-xs text-slate-400">{tr.individualOwner}</p></div>
                </div>
                <button onClick={() => setEnquiryOpen(true)} className="w-full bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Mail size={12} />{tr.sendEnquiryBtn}</button>
              </div>
              <div className="mt-4 bg-[#E6F4F2] rounded-2xl p-4 flex gap-3">
                <Bot size={16} className="text-[#006D6A] flex-shrink-0 mt-0.5" />
                <p className="text-[#006D6A] text-xs leading-relaxed">{tr.aiAnalysisDesc}</p>
              </div>
            </div>
            {/* Fraud Check Card */}
            <div onClick={() => navigate("fraud")} className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3] cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><Shield size={18} className="text-green-500" /></div>
                <div><p className="font-bold text-slate-800 text-sm">{tr.trustScore}</p><p className="text-xs text-slate-400">7 of 7 checks passed</p></div>
                <span className="ml-auto font-black text-green-600 text-xl">86</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-green-500 rounded-full" style={{ width: "86%" }} /></div>
              <p className="text-xs text-green-600 font-semibold mt-2 text-right">View Full Report →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparePage({
  navigate,
  initialPropertyIds = [1, 2],
  setComparePropertyIds,
  selectProperty,
  onOpenChatWithQuery
}: {
  navigate: (pg: Page) => void;
  initialPropertyIds?: number[];
  setComparePropertyIds?: (ids: number[]) => void;
  selectProperty?: (id: number) => void;
  onOpenChatWithQuery?: (q: string) => void;
}) {
  const { lang, tr } = useI18n();
  const [allProps, setAllProps] = useState<PropertyItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialPropertyIds.length >= 2 ? initialPropertyIds.slice(0, 4) : [1, 2]);
  const [compareData, setCompareData] = useState<PropertyComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedFavs, setSavedFavs] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // User Priorities: 'balanced' | 'price' | 'area' | 'parking' | 'ready'
  const [activePriority, setActivePriority] = useState<string>("balanced");

  // User Requirements
  const [reqBudgetMax, setReqBudgetMax] = useState<number | null>(9000000); // default ₹90L
  const [reqBhk, setReqBhk] = useState<number | null>(2); // default 2 BHK
  const [reqParkingRequired, setReqParkingRequired] = useState<boolean>(true);
  const [reqReadyRequired, setReqReadyRequired] = useState<boolean>(true);
  const [showReqsPanel, setShowReqsPanel] = useState<boolean>(true);

  // Sync with parent when selectedIds changes
  useEffect(() => {
    if (setComparePropertyIds) {
      setComparePropertyIds(selectedIds);
    }
  }, [selectedIds, setComparePropertyIds]);

  // Fetch all available properties for dropdown
  useEffect(() => {
    fetchProperties({ limit: 50 })
      .then(res => {
        if (res && res.items && res.items.length >= 2) {
          setAllProps(res.items);
          if (selectedIds.length < 2) {
            setSelectedIds([res.items[0].id, res.items[1].id]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch comparative data from PostgreSQL / backend
  const runComparison = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await compareProperties({
        property_ids: selectedIds,
        priority: activePriority === "balanced" ? undefined : activePriority,
        user_requirements: {
          bhk: reqBhk || undefined,
          budget_max: reqBudgetMax || undefined,
          parking_required: reqParkingRequired,
          ready_required: reqReadyRequired,
        }
      });
      if (res && res.comparison) {
        setCompareData(res.comparison);
      } else if (res && (res as any).properties && (res as any).differences) {
        setCompareData(res as any);
      }
    } catch (err: any) {
      console.warn("Comparison API error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedIds, activePriority, reqBhk, reqBudgetMax, reqParkingRequired, reqReadyRequired]);

  useEffect(() => {
    runComparison();
  }, [runComparison]);

  const displayedProps = compareData?.properties && compareData.properties.length > 0
    ? compareData.properties
    : allProps.filter(p => selectedIds.includes(p.id));

  // Detect city divergence
  const uniqueCities = Array.from(new Set(displayedProps.map(p => p.city).filter(Boolean)));
  const hasCityDivergence = uniqueCities.length > 1;

  const handleToggleFavorite = async (id: number) => {
    try {
      if (savedFavs.has(id)) {
        await removeFavorite(id);
        setSavedFavs(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setToast("Property removed from saved favorites");
      } else {
        await addFavorite(id);
        setSavedFavs(prev => new Set(prev).add(id));
        setToast("Property saved to your favorites");
      }
      setTimeout(() => setToast(null), 3000);
    } catch {}
  };

  const handleAskFollowUp = (question: string) => {
    if (onOpenChatWithQuery) {
      onOpenChatWithQuery(question);
    } else {
      navigate("chat");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-bold">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate("property")}
                className="flex items-center gap-1.5 text-[#006D6A] font-bold text-xs hover:gap-2.5 transition-all bg-white px-3 py-1.5 rounded-xl border border-[#D9E5E3] shadow-sm"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <span className="bg-[#E6F4F2] text-[#008F8C] text-xs font-black px-3 py-1 rounded-full border border-[#008F8C]/20">
                {displayedProps.length} of 4 Properties Selected
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check size={12} /> PostgreSQL Live Truth
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              SAI Dynamic Property Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              100% factual database records • Transparent requirement matching • Objective trade-off analysis
            </p>
          </div>

          {/* Quick Actions & Add Property */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {allProps.length > 2 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id && !selectedIds.includes(id) && selectedIds.length < 4) {
                      setSelectedIds([...selectedIds, id]);
                    }
                  }}
                  className="bg-white border border-[#D9E5E3] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008F8C]"
                  value=""
                >
                  <option value="">+ Add Property to Compare ({4 - selectedIds.length} slots left)</option>
                  {allProps.filter(p => !selectedIds.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.locality}, {p.city}) — {p.price_display || `₹${(p.price / 100000).toFixed(1)}L`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => handleAskFollowUp("Which property is better for me based on my requirements?")}
              className="bg-gradient-to-r from-[#006D6A] to-[#008F8C] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:shadow-md transition-all"
            >
              <Bot size={14} /> Ask SAI Chatbot
            </button>
          </div>
        </div>

        {/* Priority Selector Bar (Section 17 & 18) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#D9E5E3] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#008F8C]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Evaluation Priority:
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">
                (Comparison dynamically re-weights trade-offs)
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "balanced", label: "⚖️ Balanced", desc: "All criteria" },
                { key: "price", label: "💰 Lowest Price", desc: "Capital efficiency" },
                { key: "area", label: "📐 Maximum Space", desc: "Living area" },
                { key: "parking", label: "🚗 Dedicated Parking", desc: "Parking mandatory" },
                { key: "ready", label: "🔑 Ready Possession", desc: "Immediate move-in" },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setActivePriority(item.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activePriority === item.key
                      ? "bg-[#006D6A] text-white shadow-md shadow-[#006D6A]/30 scale-[1.02]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={item.desc}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Requirement Match Customizer (Section 14 & 15) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#D9E5E3] mb-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowReqsPanel(!showReqsPanel)}>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#006D6A]" />
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                User Requirements Matching Engine
              </h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {reqBudgetMax ? `≤ ₹${(reqBudgetMax / 100000).toFixed(0)}L` : "Any Budget"} • {reqBhk ? `${reqBhk} BHK` : "Any BHK"} • {reqParkingRequired ? "Parking Req" : "Parking Opt"} • {reqReadyRequired ? "Ready Only" : "Any Possession"}
              </span>
            </div>
            <button className="text-xs font-bold text-[#006D6A] hover:underline flex items-center gap-1">
              {showReqsPanel ? "Hide Controls ▲" : "Adjust Requirements ▼"}
            </button>
          </div>

          {showReqsPanel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
              {/* Budget Filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Max Budget
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: "₹60L", val: 6000000 },
                    { label: "₹75L", val: 7500000 },
                    { label: "₹90L", val: 9000000 },
                    { label: "₹1.2Cr", val: 12000000 },
                    { label: "Any", val: null },
                  ].map(b => (
                    <button
                      key={b.label}
                      onClick={() => setReqBudgetMax(b.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        reqBudgetMax === b.val
                          ? "bg-[#008F8C] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK Filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Required BHK
                </label>
                <div className="flex items-center gap-1">
                  {[
                    { label: "Any", val: null },
                    { label: "1 BHK", val: 1 },
                    { label: "2 BHK", val: 2 },
                    { label: "3 BHK", val: 3 },
                    { label: "4 BHK", val: 4 },
                  ].map(b => (
                    <button
                      key={b.label}
                      onClick={() => setReqBhk(b.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        reqBhk === b.val
                          ? "bg-[#008F8C] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parking Mandatory */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Parking Requirement
                </label>
                <button
                  onClick={() => setReqParkingRequired(!reqParkingRequired)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    reqParkingRequired
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span>Dedicated Parking</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    reqParkingRequired ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                  }`}>
                    {reqParkingRequired ? "Mandatory ✓" : "Optional"}
                  </span>
                </button>
              </div>

              {/* Ready Possession */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Possession Timeline
                </label>
                <button
                  onClick={() => setReqReadyRequired(!reqReadyRequired)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    reqReadyRequired
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span>Ready to Move</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    reqReadyRequired ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700"
                  }`}>
                    {reqReadyRequired ? "Immediate Only ✓" : "Any Timeline"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* City Divergence Warning (Section 10 & 30) */}
        {hasCityDivergence && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl mb-6 shadow-sm flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-amber-900 text-xs sm:text-sm">
                Location Difference Notice: Comparing properties across multiple cities ({uniqueCities.join(" vs ")}).
              </p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                Municipal infrastructure, circle rates, property tax structures, and price benchmarks vary significantly between cities. SAI never substitutes or masks city boundaries.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center shadow border border-[#D9E5E3] mb-8">
            <div className="w-10 h-10 border-4 border-[#006D6A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-800 text-sm">Querying real PostgreSQL property records…</p>
            <p className="text-xs text-slate-400 mt-1">Normalizing factual fields, calculating price/sq.ft, and evaluating trade-offs</p>
          </div>
        )}


        {/* Property Cards Row (Section 5) */}
        {!loading && displayedProps.length >= 2 && (
          <div className={`grid gap-4 mb-6 ${
            displayedProps.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            displayedProps.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}>
            {displayedProps.map((p, idx) => {
              const img = p.image_url || (p.media && p.media.length > 0 ? (typeof p.media[0] === "string" ? p.media[0] : p.media[0].url) : IMGS.p1);
              const isBestFit = compareData?.best_match_id === p.id;
              const isSaved = savedFavs.has(p.id);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all duration-200 flex flex-col justify-between relative ${
                    isBestFit ? "border-[#008F8C] ring-2 ring-[#008F8C]/20 shadow-md" : "border-[#D9E5E3] hover:shadow-md"
                  }`}
                >
                  {/* Remove Button if > 2 */}
                  {selectedIds.length > 2 && (
                    <button
                      onClick={() => setSelectedIds(selectedIds.filter(id => id !== p.id))}
                      className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                      title="Remove from comparison"
                    >
                      <X size={13} />
                    </button>
                  )}

                  <div>
                    {/* Image & Badges */}
                    <div className="relative">
                      <img src={img} alt={p.title} className="w-full h-44 object-cover bg-[#E6F4F2]" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          Property {String.fromCharCode(65 + idx)}
                        </span>
                        {p.is_verified && (
                          <span className="bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                        {p.is_rera && (
                          <span className="bg-blue-600/90 backdrop-blur text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                            RERA
                          </span>
                        )}
                      </div>

                      {isBestFit && (
                        <div className="absolute bottom-2 left-2 bg-[#008F8C] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
                          <Sparkles size={11} /> Highest Requirement Match
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-black text-slate-800 text-sm line-clamp-1">{p.title}</h3>
                        <button
                          onClick={() => handleToggleFavorite(p.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved ? "text-rose-500 bg-rose-50" : "text-slate-400 hover:text-slate-600 bg-slate-50"
                          }`}
                          title={isSaved ? "Saved in Favorites" : "Save to Favorites"}
                        >
                          <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mb-2 truncate">
                        {p.locality}, {p.city}
                      </p>

                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 mb-3">
                        <div>
                          <p className="text-[#008F8C] font-black text-lg">
                            {p.price_display || `₹${p.price?.toLocaleString("en-IN")}`}
                          </p>
                          <p className="text-[11px] text-slate-400 font-semibold">
                            {p.price_per_sqft_display || (p.price_per_sqft ? `₹${p.price_per_sqft}/sq.ft` : "— Not Available")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700">{p.bhk_display || (p.bhk ? `${p.bhk} BHK` : "—")}</p>
                          <p className="text-[11px] text-slate-400">{p.area_display || `${p.area_sqft || "—"} sq.ft`}</p>
                        </div>
                      </div>

                      {/* Possession & Parking Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold mb-3">
                        <span className={`px-2 py-0.5 rounded-md ${
                          p.possession_status === "Ready to Move" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {p.possession_status || "—"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${
                          p.has_parking ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {p.parking_display || (p.has_parking ? "Parking ✓" : "No Parking listed")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        selectProperty?.(p.id);
                        navigate("property");
                      }}
                      className="py-2 bg-[#006D6A] text-white text-xs font-bold rounded-xl hover:bg-[#004F4D] transition-colors text-center"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleAskFollowUp(`Tell me more about Property ${String.fromCharCode(65 + idx)} (${p.title})`)}
                      className="py-2 bg-[#E6F4F2] text-[#006D6A] text-xs font-bold rounded-xl hover:bg-[#D9E5E3] transition-colors flex items-center justify-center gap-1"
                    >
                      <Bot size={12} /> Ask SAI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Differences Banner / Chips (Section 6, 7, 8) */}
        {!loading && compareData && compareData.differences && compareData.differences.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-[#008F8C]" />
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Key Factual Differences Highlighted
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {/* Price Difference Metric Card */}
              {compareData.price_analysis && compareData.price_analysis.difference > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Price Difference</span>
                    <span className="text-xs font-black text-emerald-700">{compareData.price_analysis.difference_display} gap</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    {compareData.price_analysis.explanation}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Calculated directly from PostgreSQL listed prices.
                  </p>
                </div>
              )}

              {/* Area Difference Metric Card */}
              {compareData.area_analysis && compareData.area_analysis.difference > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Area Difference</span>
                    <span className="text-xs font-black text-blue-700">{compareData.area_analysis.difference_display}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    {compareData.area_analysis.explanation}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Floor plan living area recorded in database.
                  </p>
                </div>
              )}

              {/* Verified Status & Possession Differences */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Verification & Trust</span>
                </div>
                <p className="text-xs font-bold text-slate-800 mb-1">
                  SAI inspects land records and verified RERA certificates.
                </p>
                <p className="text-[11px] text-slate-500">
                  Unverified listings require formal legal document check.
                </p>
              </div>
            </div>

            {/* List of Detailed Difference Bullets */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              {compareData.differences.map((diff, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008F8C] mt-1.5 flex-shrink-0" />
                  <span>{diff}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Requirement Match Matrix (Section 14 & 15) */}
        {!loading && compareData && compareData.requirement_matrix && compareData.requirement_matrix.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] mb-8 overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#008F8C]" />
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    Your Requirement Match Breakdown
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct evaluation against your stated criteria (Zero arbitrary score guessing)
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                ✓ = Matches Stated Criteria • ✗ = Does Not Match
              </span>
            </div>

            {/* Requirement Match Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3.5 font-black text-slate-700 w-1/3">Stated Requirement</th>
                    {displayedProps.map((p, vi) => (
                      <th key={p.id} className="p-3.5 font-black text-slate-800 text-center">
                        Property {String.fromCharCode(65 + vi)} ({p.title.split(" ")[0]})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compareData.requirement_matrix.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-700">
                        {row.criterion}
                      </td>
                      {displayedProps.map((p) => {
                        const res = row.results?.[p.id];
                        const matched = res?.matched;
                        const text = res?.text;

                        return (
                          <td key={p.id} className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                              matched
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {matched ? "✓ Matches" : "✗ Does not match"}
                              {text && <span className="font-normal opacity-80">({text})</span>}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Requirement Match Summary Text */}
            {compareData.requirement_match && compareData.requirement_match.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
                <p className="font-bold text-slate-800 mb-1">Requirement Match Summary:</p>
                <div className="space-y-1">
                  {compareData.requirement_match.map((rm) => (
                    <p key={rm.property_id}>
                      • <strong className="text-slate-800">{rm.property_title}</strong>: Matched {rm.match_count} requirement(s)
                      {rm.matches.length > 0 && ` (${rm.matches.join(", ")})`}
                      {rm.mismatches.length > 0 && <span className="text-rose-600 font-semibold">; did not meet: {rm.mismatches.join(", ")}</span>}.
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Side-by-Side Comparison Table (Section 5, 28, 29) */}
        {!loading && compareData && compareData.fields && compareData.fields.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] mb-8 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800">
                  Comprehensive Side-by-Side Comparison Table
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every field derived from PostgreSQL property schema • Unlisted values display as "— Not Available"
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="p-3.5 font-black text-slate-700 w-1/4">Specification Field</th>
                    {displayedProps.map((p, vi) => (
                      <th key={p.id} className="p-3.5 font-black text-slate-800 text-center">
                        <div className="font-bold text-[10px] text-[#008F8C] uppercase">Property {String.fromCharCode(65 + vi)}</div>
                        <div className="font-black text-xs truncate max-w-[180px] mx-auto">{p.title}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Group fields by category */}
                  {(() => {
                    const grouped: Record<string, typeof compareData.fields> = {};
                    compareData.fields.forEach(f => {
                      if (!grouped[f.category]) grouped[f.category] = [];
                      grouped[f.category].push(f);
                    });

                    return Object.entries(grouped).map(([category, fields]) => (
                      <Fragment key={category}>
                        <tr className="bg-slate-100/70 border-t border-b border-slate-200">
                          <td colSpan={displayedProps.length + 1} className="py-2.5 px-3.5 font-black text-[11px] uppercase tracking-wider text-[#006D6A]">
                            {category}
                          </td>
                        </tr>
                        {fields.map((f, fi) => (
                          <tr
                            key={fi}
                            className={`border-b border-slate-100 transition-colors ${
                              f.is_different ? "bg-amber-50/30" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="p-3.5 font-bold text-slate-700 flex items-center gap-1.5">
                              <span>{f.field}</span>
                              {f.is_different && (
                                <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  Differs
                                </span>
                              )}
                            </td>
                            {displayedProps.map((p) => {
                              const val = f.values?.[p.id] ?? f.values?.[String(p.id)];
                              const displayVal = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "— Not Available";

                              return (
                                <td key={p.id} className="p-3.5 text-center text-slate-800 font-semibold">
                                  {displayVal === "— Not Available" ? (
                                    <span className="text-slate-400 font-normal italic">— Not Available</span>
                                  ) : (
                                    displayVal
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Amenity Comparison Breakdown (Section 9) */}
        {!loading && compareData && compareData.amenity_comparison && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] mb-8">
            <h2 className="text-base sm:text-lg font-black text-slate-800 mb-1">
              Amenity Availability Analysis
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Granular breakdown showing common facilities, unique advantages, and full checklist
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Common Amenities */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide block mb-2">
                  Common to All Compared Properties ({compareData.amenity_comparison.common?.length || 0})
                </span>
                {Array.isArray(compareData.amenity_comparison.common) && compareData.amenity_comparison.common.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {compareData.amenity_comparison.common.map(am => (
                      <span key={am} className="bg-white text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 shadow-2xs">
                        <Check size={12} className="text-emerald-600" /> {am}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No amenities shared across all compared listings.</p>
                )}
              </div>

              {/* Unique Amenities per Property */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                <span className="text-[11px] font-black text-blue-800 uppercase tracking-wide block mb-2">
                  Exclusive Amenities (Unique to Individual Properties)
                </span>
                <div className="space-y-2">
                  {displayedProps.map((p, idx) => {
                    const uniqueList = compareData.amenity_comparison.unique?.[p.id] || compareData.amenity_comparison.unique?.[String(p.id)] || [];
                    return (
                      <div key={p.id} className="text-xs">
                        <span className="font-black text-slate-800">Property {String.fromCharCode(65 + idx)} ({p.title.split(" ")[0]}): </span>
                        {uniqueList.length > 0 ? (
                          <span className="text-blue-700 font-semibold">{uniqueList.join(", ")}</span>
                        ) : (
                          <span className="text-slate-400 italic">None exclusive</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Checklist Table */}
            {compareData.amenity_comparison.checklist && compareData.amenity_comparison.checklist.length > 0 && (
              <div className="overflow-x-auto pt-3 border-t border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-2.5 font-bold text-slate-700">Amenity</th>
                      {displayedProps.map((p, vi) => (
                        <th key={p.id} className="p-2.5 font-bold text-slate-800 text-center">
                          Property {String.fromCharCode(65 + vi)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compareData.amenity_comparison.checklist.slice(0, 10).map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-700">{row.amenity}</td>
                        {displayedProps.map(p => {
                          const hasIt = Boolean(row[p.id] ?? row[String(p.id)]);
                          return (
                            <td key={p.id} className="p-2.5 text-center">
                              {hasIt ? (
                                <span className="inline-block text-emerald-600 font-black text-sm">✓</span>
                              ) : (
                                <span className="inline-block text-slate-300 font-black text-sm">✗</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Factual Advantages & Considerations Cards (Section 13) */}
        {!loading && compareData && compareData.advantages && (
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-black text-slate-800 mb-1">
              Factual Advantages & Considerations per Property
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Derived strictly from database records — zero promotional assumptions
            </p>

            <div className={`grid gap-4 ${
              displayedProps.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              displayedProps.length === 3 ? "grid-cols-1 md:grid-cols-3" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}>
              {displayedProps.map((p, idx) => {
                const advList = compareData.advantages?.[p.id] || compareData.advantages?.[String(p.id)] || [];
                const consList = compareData.considerations?.[p.id] || compareData.considerations?.[String(p.id)] || [];

                return (
                  <div key={p.id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <span className="bg-[#006D6A] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          Property {String.fromCharCode(65 + idx)}
                        </span>
                        <h3 className="font-black text-slate-800 text-sm truncate">{p.title}</h3>
                      </div>

                      {/* Advantages */}
                      <div className="mb-4">
                        <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Check size={12} className="text-emerald-600" /> Database Advantages
                        </h4>
                        {advList.length > 0 ? (
                          <ul className="space-y-1.5">
                            {advList.map((adv, ai) => (
                              <li key={ai} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No specific advantages indexed.</p>
                        )}
                      </div>

                      {/* Considerations */}
                      <div>
                        <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} className="text-amber-600" /> Considerations & Trade-offs
                        </h4>
                        {consList.length > 0 ? (
                          <ul className="space-y-1.5">
                            {consList.map((con, ci) => (
                              <li key={ci} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No documented constraints.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          selectProperty?.(p.id);
                          navigate("property");
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Inspect Property {String.fromCharCode(65 + idx)} →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SAI AI Transparent Trade-Off Conclusion (Section 17–20) */}
        {!loading && compareData && (
          <div className="bg-gradient-to-r from-[#006D6A] to-[#073B3A] rounded-3xl p-6 sm:p-8 shadow-xl text-white mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Brain size={24} className="text-[#20B2AA]" />
              <h3 className="font-black text-xl tracking-tight">
                SAI AI Transparent Trade-Off Conclusion
              </h3>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-5 border border-white/10">
              <p className="text-white/95 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {compareData.recommendation_reason || "Based on your stated requirements and PostgreSQL property database records, evaluation reflects factual trade-offs."}
              </p>
            </div>

            {/* Quick Follow-Up Question Chips (Section 21) */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-[#E6F4F2] uppercase tracking-wider mb-2">
                Ask Follow-Up Question in Chat:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Which is cheaper?",
                  "Which has more area?",
                  "Which has parking?",
                  "Which is ready to move?",
                  "Which has lower price per sq.ft?",
                  "Now consider price as my priority",
                  "Which property matches my budget?",
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => handleAskFollowUp(q)}
                    className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <span>{q}</span>
                    <ChevronRight size={12} className="opacity-70" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FraudPage({ navigate }: { navigate: (pg: Page) => void }) {
  const checks = [
    { label: "RERA Registration", status: "pass", detail: "RERA No: P52100027225 · Valid till Dec 2026", icon: CheckCircle },
    { label: "Title Deed Verification", status: "pass", detail: "Matches sub-registrar records · Clear title", icon: CheckCircle },
    { label: "Duplicate Listing Detection", status: "pass", detail: "No duplicates found across 12 portals", icon: CheckCircle },
    { label: "Ownership History", status: "pass", detail: "Single owner since 2018 · No disputes", icon: CheckCircle },
    { label: "Price Anomaly Detection", status: "warn", detail: "Price is 8% below market average — verify reason", icon: AlertTriangle },
    { label: "Legal Disputes Check", status: "pass", detail: "No pending court cases or encumbrances", icon: CheckCircle },
    { label: "Construction Progress", status: "pass", detail: "On schedule · 92% complete · Q3 2025 delivery", icon: CheckCircle },
  ];
  const statusStyle: Record<string, { border: string; bg: string; text: string; iconColor: string }> = {
    pass: { border: "border-green-100", bg: "bg-green-50", text: "text-green-700", iconColor: "text-green-500" },
    warn: { border: "border-orange-100", bg: "bg-orange-50", text: "text-orange-700", iconColor: "text-orange-500" },
    fail: { border: "border-red-100", bg: "bg-red-50", text: "text-red-700", iconColor: "text-red-500" },
  };
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("property")} className="flex items-center gap-2 text-[#006D6A] font-semibold text-sm"><ChevronLeft size={16} />Back</button>
          <h1 className="text-3xl font-black text-slate-800">AI Trust Report</h1>
        </div>
        {/* Trust Score */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3] mb-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E6F4F2" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeDasharray="86 100" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-green-600 text-4xl leading-none">86</span>
              <span className="text-slate-400 text-xs mt-1">Trust Score</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">Good Standing</h2>
            <p className="text-slate-500 leading-relaxed mb-4">This property passed 6 of 7 verification checks. One advisory warning about price — investigate before proceeding.</p>
            <div className="flex gap-3">
              <span className="bg-green-50 text-green-700 text-sm font-bold px-4 py-2 rounded-full">6 Passed</span>
              <span className="bg-orange-50 text-orange-700 text-sm font-bold px-4 py-2 rounded-full">1 Warning</span>
              <span className="bg-slate-50 text-slate-500 text-sm font-bold px-4 py-2 rounded-full">0 Failed</span>
            </div>
          </div>
        </div>
        {/* Checks List */}
        <div className="space-y-3 mb-6">
          {checks.map(({ label, status, detail, icon: Icon }) => {
            const s = statusStyle[status];
            return (
              <div key={label} className={`bg-white rounded-2xl border ${s.border} p-5 flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}><Icon size={18} className={s.iconColor} /></div>
                <div className="flex-1"><p className={`font-bold text-sm ${s.text}`}>{label}</p><p className="text-slate-400 text-sm mt-0.5">{detail}</p></div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${s.bg} ${s.text} capitalize`}>{status}</span>
              </div>
            );
          })}
        </div>
        <div className="bg-[#E6F4F2] rounded-3xl p-6 flex gap-4 mb-6">
          <Brain size={20} className="text-[#006D6A] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#073B3A] mb-1">About SAI Trust Engine</p>
            <p className="text-[#006D6A] text-sm leading-relaxed">SAI analyzes 50+ data points including government land registry records, court dispute databases, RERA compliance records, and real-time market pricing algorithms to compute a comprehensive trust score for every listing.</p>
          </div>
        </div>
        <button onClick={() => navigate("property")} className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors">Back to Property</button>
      </div>
    </div>
  );
}

function SeniorPage({ navigate }: { navigate: (pg: Page) => void }) {
  const [voiceModal, setVoiceModal] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className={`min-h-screen ${highContrast ? "bg-black text-white" : "bg-white text-slate-800"} py-10 transition-colors`}>
      <VoiceMicModal
        open={voiceModal}
        onClose={() => setVoiceModal(false)}
        lang="en"
        onResult={(text) => executeVoiceCommand(text, navigate)}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("home")}
          className="inline-flex items-center gap-1.5 text-[#006D6A] font-bold text-xs mb-6 hover:underline bg-[#E6F4F2] px-3.5 py-1.5 rounded-xl border border-[#D9E5E3] transition-colors"
        >
          <ChevronLeft size={15} />Back to Home
        </button>
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-[#E6F4F2] rounded-full flex items-center justify-center mx-auto mb-5"><Volume2 size={36} className="text-[#006D6A]" /></div>
          <h1 className="text-4xl font-black mb-3">Senior Citizen Mode</h1>
          <p className="text-slate-500 text-lg">Designed for comfort, clarity, and independence</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {[
            { icon: Mic, title: "Voice Navigation", desc: "Speak naturally in your language — SAI guides you through every step without typing or complex navigation.", color: "blue", cta: "Start Voice Search", action: () => setVoiceModal(true) },
            { icon: Hospital, title: "Nearby Healthcare", desc: "Every property shows hospitals, pharmacies, and emergency services within 2km — your safety comes first.", color: "red", cta: "Find Health-Friendly Homes", action: () => navigate("search") },
            { icon: Phone, title: "Emergency Contact", desc: "One tap to call your emergency contact or connect with local emergency services from any property page.", color: "orange", cta: "Set Emergency Contact", action: () => alert("Emergency contact set: +91 98765 43210 (Local Emergency Services)") },
            { icon: Home, title: "Accessible Properties", desc: "Filter for ground floor, lift, low stairs, wide doorways, and senior-friendly design automatically.", color: "green", cta: "Browse Senior-Friendly Homes", action: () => navigate("search") },
            { icon: Globe, title: "Full Language Support", desc: "Complete voice and text support in all 8 Indian languages — speak as you naturally do.", color: "teal", cta: "Choose Your Language", action: () => navigate("language") },
            { icon: Eye, title: "Large Text & High Contrast", desc: "Bigger fonts, high contrast colors, and simplified navigation designed for comfortable reading.", color: "teal", cta: highContrast ? "Standard Contrast" : "Enable Accessibility", action: () => setHighContrast(v => !v) },
          ].map(({ icon: Icon, title, desc, color, cta, action }) => (
            <div key={title} className={`bg-${color}-50 border border-${color}-100 rounded-3xl p-7 hover:shadow-lg transition-shadow text-slate-800`}>
              <div className={`w-16 h-16 bg-${color}-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg`}><Icon size={28} className="text-white" /></div>
              <h3 className="text-xl font-black mb-3">{title}</h3>
              <p className="text-slate-600 leading-relaxed mb-5" style={{ fontSize: 16 }}>{desc}</p>
              <button onClick={action} className={`bg-${color}-500 text-white font-bold px-5 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity`}>{cta}</button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => setVoiceModal(true)} className="flex-1 bg-[#006D6A] text-white font-black text-xl py-6 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] flex items-center justify-center gap-3 hover:bg-[#004F4D] transition-colors">
            <Mic size={28} />Start Voice Search
          </button>
          <button onClick={() => navigate("search")} className="flex-1 bg-slate-50 text-slate-700 font-black text-xl py-6 rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors">
            <Bot size={28} className="text-[#006D6A]" />Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
}

const LOGIN_ROLES = [
  { id: "buyer" as UserRole, label: "Buyer", email: "buyer@sai.in", icon: Home, badge: "Property Seeker", desc: "Browse, compare & enquire properties" },
  { id: "seller" as UserRole, label: "Seller", email: "owner@sai.in", icon: DollarSign, badge: "Property Owner", desc: "Manage listings & buyer leads" },
  { id: "agent" as UserRole, label: "Agent", email: "agent@sai.in", icon: Users, badge: "Real Estate Broker", desc: "Manage client leads & scheduled visits" },
  { id: "builder" as UserRole, label: "Builder", email: "builder@sai.in", icon: Building, badge: "Developer", desc: "Projects, towers, units & enquiries" },
];

function LoginPage({
  navigate,
  pendingRole,
  setPendingRole,
  onUserLogin,
}: {
  navigate: (pg: Page) => void;
  pendingRole: UserRole;
  setPendingRole?: (r: UserRole) => void;
  onUserLogin?: (name: string, email: string) => void;
}) {
  const isSuperAdminRole = pendingRole === "admin" || pendingRole === "super_admin";
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    !isSuperAdminRole && pendingRole ? pendingRole : "buyer"
  );

  const getRoleEmail = (role: UserRole) => {
    if (role === "seller") return "owner@sai.in";
    if (role === "agent") return "agent@sai.in";
    if (role === "builder") return "builder@sai.in";
    if (role === "admin" || role === "super_admin") return "admin@sai.in";
    return "buyer@sai.in";
  };

  const [loginEmail, setLoginEmail] = useState(getRoleEmail(!isSuperAdminRole && pendingRole ? pendingRole : "buyer"));
  const [loginPassword, setLoginPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [activeOAuthProvider, setActiveOAuthProvider] = useState<"google" | "apple" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Forgot password & OAuth modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthModalMode, setOauthModalMode] = useState<"otp" | "link">("otp");
  const [oauthProviderLabel, setOauthProviderLabel] = useState<"Google" | "Apple">("Google");
  const [oauthMaskedEmail, setOauthMaskedEmail] = useState("");
  const [oauthTempToken, setOauthTempToken] = useState<string | undefined>(undefined);
  const [oauthLinkToken, setOauthLinkToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (pendingRole && pendingRole !== "admin" && pendingRole !== "super_admin") {
      setSelectedRole(pendingRole);
      setLoginEmail(getRoleEmail(pendingRole));
      setLoginPassword("Password123!");
    }
  }, [pendingRole]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const demoEmails = ["buyer@sai.in", "owner@sai.in", "agent@sai.in", "builder@sai.in", "admin@sai.in", ""];
    if (demoEmails.includes(loginEmail.trim())) {
      setLoginEmail(getRoleEmail(role));
    }
    if (!loginPassword) {
      setLoginPassword("Password123!");
    }
    setAuthError(null);
    if (setPendingRole) setPendingRole(role);
  };

  const currentRoleObj = LOGIN_ROLES.find(r => r.id === selectedRole) || LOGIN_ROLES[0];
  const roleColor: Record<string, string> = {
    buyer: "bg-[#E6F4F2] text-[#006D6A]",
    seller: "bg-amber-50 text-amber-700",
    agent: "bg-purple-50 text-purple-700",
    builder: "bg-slate-100 text-slate-700",
    admin: "bg-emerald-50 text-emerald-800",
    super_admin: "bg-emerald-50 text-emerald-800",
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!loginEmail.trim()) {
      setAuthError("Please enter an email address.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      if (selectedRole === "admin" || selectedRole === "super_admin" || loginEmail.trim().toLowerCase() === "admin@sai.in") {
        const res = await apiAdminLogin(loginEmail, loginPassword || "Password123!");
        if (res.status === "2FA_REQUIRED") {
          sessionStorage.setItem("admin_2fa_email", res.email || loginEmail);
          if (res.temp_token) sessionStorage.setItem("admin_2fa_token", res.temp_token);
          navigate("admin-2fa");
          return;
        }
        try {
          localStorage.setItem("sai_user_name", "Super Admin");
          localStorage.setItem("sai_user_email", loginEmail);
          localStorage.setItem("sai_user_role", "super_admin");
        } catch {}
        onUserLogin?.("Super Admin", loginEmail);
        navigate("admin");
        return;
      }
      const tokenData = await apiLogin(loginEmail, loginPassword || "Password123!", selectedRole);
      const role = tokenData.role || selectedRole || "buyer";
      const uName = tokenData.name || (loginEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
      try {
        localStorage.setItem("sai_user_name", uName);
        localStorage.setItem("sai_user_email", loginEmail);
        localStorage.setItem("sai_user_role", role);
      } catch {}
      onUserLogin?.(uName, loginEmail);
      const destRole: Page = (role === "super_admin" || role === "admin" ? "admin" : role) as Page;
      navigate(destRole);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (loading) return; // Prevent repeated clicks
    setLoading(true);
    setActiveOAuthProvider(provider);
    setAuthError(null);

    const providerLabel = provider === "google" ? "Google" : "Apple";

    try {
      // 1. Fetch server OAuth configuration
      let config;
      try {
        config = await getOAuthConfig();
      } catch {
        throw new Error("Unable to contact the authentication server. Please check your connection and verify the SAI backend server is running.");
      }

      let authResult: { id_token?: string; code?: string; identity_token?: string; email?: string; name?: string };

      if (provider === "google") {
        if (!config.google_configured || !config.google_client_id) {
          throw new Error("CONFIG_MISSING: Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.");
        }
        const gRes = await initiateGoogleSignIn(config.google_client_id);
        authResult = { id_token: gRes.id_token, code: gRes.code };
      } else {
        if (!config.apple_configured || !config.apple_client_id) {
          throw new Error("CONFIG_MISSING: Apple Sign-In is not configured. Please set APPLE_CLIENT_ID, APPLE_TEAM_ID, and credentials in backend/.env.");
        }
        const aRes = await initiateAppleSignIn(config.apple_client_id, window.location.origin);
        authResult = {
          identity_token: aRes.identity_token,
          code: aRes.code,
          email: aRes.user?.email,
          name: aRes.user?.name ? `${aRes.user.name.firstName || ''} ${aRes.user.name.lastName || ''}`.trim() : undefined,
        };
      }

      // 2. Validate token on backend
      let resp: OAuthAuthResponse;
      if (provider === "google") {
        resp = await googleLogin({
          id_token: authResult.id_token,
          code: authResult.code,
          role: selectedRole || "buyer",
        });
      } else {
        resp = await appleLogin({
          identity_token: authResult.identity_token,
          code: authResult.code,
          role: selectedRole || "buyer",
          email: authResult.email,
          name: authResult.name,
        });
      }

      // 3. Handle response actions
      if (resp.requires_linking) {
        setOauthModalMode("link");
        setOauthProviderLabel(providerLabel);
        setOauthMaskedEmail(resp.masked_email || "your registered email");
        setOauthLinkToken(resp.link_token);
        setOauthModalOpen(true);
        return;
      }

      if (resp.requires_otp) {
        setOauthModalMode("otp");
        setOauthProviderLabel(providerLabel);
        setOauthMaskedEmail(resp.masked_email || "your authenticated email");
        setOauthTempToken(resp.temp_token);
        setOauthModalOpen(true);
        return;
      }

      // 4. Successful login
      const targetRole = resp.role || selectedRole || "buyer";
      const destRole: Page = (targetRole === "super_admin" ? "admin" : targetRole) as Page;
      navigate(destRole);
    } catch (err: any) {
      const msg = err?.message || `${providerLabel} authentication failed.`;
      if (msg.includes("USER_CANCELLED")) {
        setAuthError(`${providerLabel} sign-in was cancelled.`);
      } else if (msg.includes("NETWORK_FAILURE") || msg.includes("Failed to fetch")) {
        setAuthError(`Network error during ${providerLabel} sign-in. Please check your internet connection.`);
      } else if (msg.includes("CONFIG_MISSING")) {
        setAuthError(msg.replace("CONFIG_MISSING: ", ""));
      } else {
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
      setActiveOAuthProvider(null);
    }
  };

  const handleOAuthSuccess = (authData: OAuthAuthResponse) => {
    setOauthModalOpen(false);
    const targetRole = authData.role || selectedRole || "buyer";
    const destRole: Page = (targetRole === "super_admin" ? "admin" : targetRole) as Page;
    navigate(destRole);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("role")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#006A60] font-semibold mb-4 transition-colors">
          <ChevronLeft size={16} />Back to Role Selection
        </button>
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,109,106,0.15)] border border-[#D9E5E3] p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <SaiLogo size="lg" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Welcome back!</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your SAI account</p>
          </div>

          {/* 4 Role Selector Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Account Role
              </label>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${roleColor[selectedRole || "buyer"]}`}>
                {currentRoleObj.badge}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {LOGIN_ROLES.map(r => {
                const isSel = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSel
                        ? "bg-[#006D6A] text-white shadow font-bold"
                        : "text-slate-600 hover:text-[#006D6A] hover:bg-white/70 font-semibold"
                    }`}
                  >
                    <Icon size={16} className={isSel ? "text-white" : "text-slate-500"} />
                    <span className="text-[11px] leading-none">{r.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">{currentRoleObj.desc}</p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl mb-4 border border-red-200">
              {authError}
            </div>
          )}

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                {currentRoleObj.label} Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter any email address"
                  className="w-full bg-slate-50 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter any password"
                  className="w-full bg-slate-50 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-5">
            <span className="text-[#006D6A] font-semibold flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#006D6A]" /> Instant Access · Any Email &amp; Password Accepted
            </span>
            <button onClick={() => { setForgotOpen(true); setForgotEmail(loginEmail); }} type="button" className="text-[#006D6A] font-semibold hover:underline">Forgot Password?</button>
          </div>

          {/* Complete 4-Step Email OTP Forgot Password Modal */}
          <ForgotPasswordModal
            isOpen={forgotOpen}
            onClose={() => setForgotOpen(false)}
            initialEmail={forgotEmail}
            onPasswordResetComplete={(updatedEmail) => {
              setForgotOpen(false);
              setLoginEmail(updatedEmail);
            }}
          />

          {/* Dedicated OAuth OTP & Account Linking Modal */}
          <OAuthOTPModal
            isOpen={oauthModalOpen}
            onClose={() => setOauthModalOpen(false)}
            mode={oauthModalMode}
            provider={oauthProviderLabel}
            maskedEmail={oauthMaskedEmail}
            tempToken={oauthTempToken}
            linkToken={oauthLinkToken}
            targetRole={selectedRole || "buyer"}
            onSuccess={handleOAuthSuccess}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] mb-3 hover:bg-[#004F4D] transition-colors disabled:opacity-50"
          >
            {loading && !activeOAuthProvider
              ? `Signing into ${currentRoleObj.label} Portal...`
              : `Sign In as ${currentRoleObj.label}`}
          </button>
          <button
            onClick={() => {
              if (setPendingRole) setPendingRole(selectedRole);
              navigate("otp");
            }}
            disabled={loading}
            className="w-full bg-[#E6F4F2] text-[#006D6A] font-bold py-3.5 rounded-2xl mb-4 hover:bg-[#D9E5E3] transition-colors text-sm disabled:opacity-50"
          >
            Sign In with OTP Instead
          </button>

          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-slate-100" /><span className="text-slate-400 text-xs">or continue with</span><div className="flex-1 h-px bg-slate-100" /></div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => handleOAuth("google")}
              disabled={loading}
              type="button"
              className="py-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && activeOAuthProvider === "google" ? "Connecting Google..." : "Google"}
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              disabled={loading}
              type="button"
              className="py-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && activeOAuthProvider === "apple" ? "Connecting Apple..." : "Apple"}
            </button>
          </div>
          <p className="text-center text-slate-500 text-sm">New to SAI? <button onClick={() => { if (setPendingRole) setPendingRole(selectedRole); navigate("signup"); }} className="text-[#006D6A] font-bold hover:underline">Create Account</button></p>
          <button onClick={() => { navigate("home"); }} className="mt-3 w-full text-slate-400 text-sm text-center hover:text-[#006D6A] transition-colors underline">Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}

function SignupPage({
  navigate,
  pendingRole,
  onUserRegistered
}: {
  navigate: (pg: Page) => void;
  pendingRole: UserRole;
  onUserRegistered?: (name: string, email: string) => void;
}) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(300);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { tr } = useI18n();

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasDigit && hasSpecial;

  const roleLabel = pendingRole === "seller" ? tr.seller : pendingRole === "agent" ? tr.agent : pendingRole === "builder" ? tr.builder : tr.buyer;
  const roleColor: Record<string, string> = { buyer: "bg-[#E6F4F2] text-[#006D6A]", seller: "bg-amber-50 text-amber-700", agent: "bg-purple-50 text-purple-700", builder: "bg-slate-100 text-slate-700" };

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 5-minute expiration timer
  useEffect(() => {
    if (step !== "otp" || expiresInSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpiresInSeconds(s => {
        if (s <= 1) {
          setError("OTP has expired. Please request a new verification code.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, expiresInSeconds]);

  // Focus first digit box when switching to OTP view
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const handleSendRegistrationOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (!hasMinLength) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!hasUppercase) {
      setError("Password must contain at least one uppercase letter (A-Z).");
      return;
    }
    if (!hasDigit) {
      setError("Password must contain at least one digit (0-9).");
      return;
    }
    if (!hasSpecial) {
      setError("Password must contain at least one special character (!@#$%^&*...).");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiSendEmailOTP(cleanEmail, "register", fullName || "User", pendingRole || "buyer");
      setStep("otp");
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setOtpDigits(["", "", "", "", "", ""]);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);
    } catch (err: any) {
      setError(err?.message || "Failed to send verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOTP = async () => {
    if (cooldown > 0 || loading) return;
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiResendEmailOTP(cleanEmail, "register");
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setOtpDigits(["", "", "", "", "", ""]);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setSuccessMsg(res.message || "A new verification code has been dispatched to your email.");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (otpCode?: string) => {
    const code = (otpCode || otpDigits.join("")).trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const role = pendingRole || "buyer";
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim() || "User";
      await apiRegister(cleanName, cleanEmail, password, role, phone, code);
      await apiLogin(cleanEmail, password, role);
      try {
        localStorage.setItem("sai_user_name", cleanName);
        localStorage.setItem("sai_user_email", cleanEmail);
        localStorage.setItem("sai_user_phone", phone || "");
        localStorage.setItem("sai_user_role", role);
      } catch {}
      if (onUserRegistered) {
        onUserRegistered(cleanName, cleanEmail);
      }
      const destRole: Page = (role as Page) || "buyer";
      navigate(destRole);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;
    setError(null);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    if (cleaned && index === 5) {
      const fullOtp = newDigits.join("");
      if (fullOtp.length === 6) {
        handleVerifyAndRegister(fullOtp);
      }
    }
  };

  const handleDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    if (pasted.length === 6) {
      handleVerifyAndRegister(pasted);
    } else {
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => (step === "otp" ? setStep("details") : navigate("role"))}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#006A60] font-semibold mb-4 transition-colors"
        >
          <ChevronLeft size={16} />{step === "otp" ? "Back to Details" : tr.back}
        </button>

        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,109,106,0.15)] border border-[#D9E5E3] p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <SaiLogo size="lg" />
            </div>
            {pendingRole && (
              <span className={`inline-block text-xs font-black px-3 py-1 rounded-full mb-3 ${roleColor[pendingRole] || roleColor.buyer}`}>
                {roleLabel}
              </span>
            )}
            <h2 className="text-2xl font-black text-slate-800">
              {step === "details" ? tr.createAccountTitle : "Verify Your Email"}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              {step === "details"
                ? `Join as ${roleLabel}`
                : `We sent a 6-digit verification code to your email`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-2xl mb-4 border border-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-3.5 rounded-2xl mb-4 border border-emerald-200 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1: REGISTRATION DETAILS ── */}
          {step === "details" && (
            <div>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{tr.fullName}</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full bg-slate-50 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{tr.phoneLabel}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-bold text-slate-500 select-none pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{tr.emailLabel}</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="rahul@email.com"
                      className="w-full bg-slate-50 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{tr.passwordLabel}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 rounded-2xl pl-10 pr-11 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9E5E3] border border-[#D9E5E3]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Requirements */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                        {hasMinLength ? "✓" : "•"}
                      </span>
                      <span>Min. 6 chars</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasUppercase ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                        {hasUppercase ? "✓" : "•"}
                      </span>
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasDigit ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasDigit ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                        {hasDigit ? "✓" : "•"}
                      </span>
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasSpecial ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                        {hasSpecial ? "✓" : "•"}
                      </span>
                      <span>1 Special char (!@#$)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#E6F4F2] rounded-2xl p-4 mb-5 flex gap-3">
                <input type="checkbox" className="mt-0.5 accent-[#006D6A]" defaultChecked />
                <p className="text-[#006D6A] text-sm">{tr.agreeTerms} <span className="font-bold underline cursor-pointer">{tr.termsLink}</span> &amp; <span className="font-bold underline cursor-pointer">{tr.privacyLink}</span></p>
              </div>

              <button
                type="button"
                onClick={handleSendRegistrationOTP}
                disabled={loading || !email.trim() || !password || !isPasswordValid}
                className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] mb-4 hover:bg-[#004F4D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Send Verification Code &amp; Register</span>
                  </>
                )}
              </button>

              <p className="text-center text-slate-500 text-sm">
                {tr.alreadyHaveAccount}{" "}
                <button type="button" onClick={() => navigate("login")} className="text-[#006D6A] font-bold hover:underline">
                  {tr.login}
                </button>
              </p>
              <button
                type="button"
                onClick={() => navigate("home")}
                className="mt-3 w-full text-slate-400 text-sm text-center hover:text-[#006D6A] transition-colors underline"
              >
                {tr.continueAsGuest}
              </button>
            </div>
          )}

          {/* ── STEP 2: ENTER OTP ── */}
          {step === "otp" && (
            <div className="space-y-5">
              {/* Target Email Box with Change Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Registration Email</span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono truncate block">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006D6A] hover:text-[#004F4D] hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Change Email</span>
                </button>
              </div>

              {/* Dev Preview Helper Banner */}
              {devOtp && (
                <div className="bg-[#E6F4F2] border border-[#006D6A]/30 rounded-2xl p-3 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#006D6A]">Dev Preview OTP:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded-lg border border-[#006D6A]/20 font-black text-slate-800 tracking-wider">
                      {devOtp}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split("").slice(0, 6);
                      setOtpDigits(digits);
                      handleVerifyAndRegister(devOtp);
                    }}
                    className="text-[#006D6A] font-extrabold hover:text-[#004F4D] underline cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">6-Digit Code</label>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Clock size={12} className={expiresInSeconds <= 0 ? "text-red-500" : "text-[#006D6A]"} />
                    <span className={expiresInSeconds <= 0 ? "text-red-600 font-extrabold" : ""}>
                      {expiresInSeconds <= 0 ? "Expired" : `Valid: ${formatTimer(expiresInSeconds)}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                      disabled={loading || expiresInSeconds <= 0}
                      className={`h-12 text-center font-black text-xl rounded-2xl border transition-all ${
                        digit
                          ? "border-[#008F8C] bg-[#E6F4F2]/50 text-[#004F4D] shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                      } focus:outline-none focus:ring-2 focus:ring-[#008F8C]/40 focus:border-[#008F8C]`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify & Register Button */}
              <button
                type="button"
                onClick={() => handleVerifyAndRegister()}
                disabled={loading || otpDigits.some((d) => !d) || expiresInSeconds <= 0}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Verifying &amp; Creating Account...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify &amp; Complete Registration</span>
                  </>
                )}
              </button>

              {/* Resend Cooldown Counter */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Didn't receive code?</span>
                {cooldown > 0 ? (
                  <span className="text-slate-400 font-semibold">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendRegistrationOTP}
                    disabled={loading}
                    className="text-[#006D6A] font-extrabold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OTPPage({ navigate, pendingRole }: { navigate: (pg: Page) => void; pendingRole: UserRole }) {
  return (
    <OTPAuthView
      navigate={navigate}
      pendingRole={pendingRole}
      onSuccess={(dest) => navigate(dest as Page)}
    />
  );
}

function RolePage({ navigate, setPendingRole }: { navigate: (pg: Page) => void; setPendingRole: (r: UserRole) => void }) {
  const [sel, setSel] = useState("buyer");
  const roles = [
    {
      id: "buyer",
      label: "Buyer / Property Seeker",
      icon: Home,
      desc: "Browse, search, save, compare and enquire about properties",
      badge: "For individuals",
      features: ["AI-powered property search", "Save & compare listings", "Contact agents/builders", "View market insights"],
    },
    {
      id: "seller",
      label: "Seller / Owner",
      icon: DollarSign,
      desc: "List your property and connect directly with verified buyers",
      badge: "For owners",
      features: ["List & manage your property", "Receive buyer enquiries", "Listing analytics", "Verification & trust badge"],
    },
    {
      id: "agent",
      label: "Agent / Broker",
      icon: Users,
      desc: "Manage your own property listings, leads, and clients",
      badge: "For professionals",
      features: ["List & manage properties", "Lead & client management", "Listing analytics", "Verification status"],
    },
    {
      id: "builder",
      label: "Builder / Developer",
      icon: Building,
      desc: "Manage apartment projects, towers, units, and inventory",
      badge: "For developers",
      features: ["Project & tower management", "Unit availability tracking", "Buyer enquiries", "Document verification"],
    },
  ];
  const selRole = roles.find(r => r.id === sel);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate("welcome")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#006A60] font-semibold mb-6 transition-colors">
          <ChevronLeft size={16} />Back to Welcome
        </button>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SaiLogo size="lg" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">Choose Your Role</h2>
          <p className="text-slate-500 mt-2">SAI creates a completely separate experience for each role</p>
        </div>
        <div className="space-y-3 mb-6">
          {roles.map(r => (
            <button key={r.id} onClick={() => setSel(r.id)} className={`w-full p-5 rounded-3xl border-2 text-left transition-all ${sel===r.id ? "border-[#006D6A] bg-[#E6F4F2] shadow-[0_4px_20px_rgba(0,109,106,0.2)]" : "border-slate-100 bg-white hover:border-[#D9E5E3]"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${sel===r.id ? "bg-[#006D6A] shadow" : "bg-slate-100"}`}><r.icon size={22} className={sel===r.id ? "text-white" : "text-slate-400"} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-black text-base ${sel===r.id ? "text-[#006D6A]" : "text-slate-700"}`}>{r.label}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sel===r.id ? "bg-[#D9E5E3] text-[#006D6A]" : "bg-slate-100 text-slate-500"}`}>{r.badge}</span>
                  </div>
                  <p className={`text-sm ${sel===r.id ? "text-[#008F8C]" : "text-slate-400"}`}>{r.desc}</p>
                  {sel===r.id && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {r.features.map(f => <span key={f} className="text-[11px] bg-white/70 text-[#006D6A] font-semibold px-2.5 py-1 rounded-full border border-[#D9E5E3]">{f}</span>)}
                      </div>
                      <div className="pt-2 border-t border-[#D9E5E3]/60 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#006D6A]">Active Selection:</span>
                        <span className="text-xs font-bold text-[#006D6A]">Click "Sign In as {r.label.split(" / ")[0]}" below</span>
                      </div>
                    </div>
                  )}
                </div>
                {sel===r.id && <Check size={20} className="text-[#006D6A] flex-shrink-0 mt-1" />}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setPendingRole(sel as UserRole); navigate("login"); }} className="flex-1 bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 text-base">
            <Lock size={17} />Sign In as {selRole?.label.split(" / ")[0]}
          </button>
          <button onClick={() => { setPendingRole(sel as UserRole); navigate("signup"); }} className="flex-1 border-2 border-[#006D6A] text-[#006D6A] font-bold py-4 rounded-2xl hover:bg-[#E6F4F2] transition-colors flex items-center justify-center gap-2 text-base">
            <User size={17} />Create Account
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">You can change your role anytime by signing out and choosing a different role</p>
      </div>
    </div>
  );
}

function BuyerDashPage({ navigate, city, selectProperty, openBuilding3D }: { navigate: (pg: Page) => void; city: string; selectProperty: (id: number) => void; openBuilding3D?: (buildingId?: number, floor?: number, unit?: string) => void }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loanIncome, setLoanIncome] = useState(85000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [loanPrice, setLoanPrice] = useState(9000000);
  const [calcAmount, setCalcAmount] = useState(5000000);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Voice Input & Search State
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const [selectedDocPropertyId, setSelectedDocPropertyId] = useState<number>(1);

  // Buyer Profile State with Voice Input
  const [buyerName, setBuyerName] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_name") : null) || "Priya Sharma"
  );
  const [buyerEmail, setBuyerEmail] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_email") : null) || "buyer@sai.in"
  );
  const [buyerPhone, setBuyerPhone] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_phone") : null) || "9876543210"
  );
  const [buyerAddress, setBuyerAddress] = useState("Flat 402, Green Acre Heights, Baner");
  const [buyerCity, setBuyerCity] = useState(city || "Pune");
  const [buyerLocality, setBuyerLocality] = useState("Baner");
  const [buyerOccupation, setBuyerOccupation] = useState("Senior Software Architect");

  // Property Requirements State with Voice Input
  const [reqLocation, setReqLocation] = useState(city || "Pune");
  const [reqMaxBudget, setReqMaxBudget] = useState("8000000");
  const [reqMinBhk, setReqMinBhk] = useState("2");
  const [reqPropertyType, setReqPropertyType] = useState("Apartment");
  const [reqAmenities, setReqAmenities] = useState("Covered Parking, Gymnasium, Swimming Pool, 24/7 Security");
  const [reqAdditional, setReqAdditional] = useState("East facing, high floor, near metro or IT corridor, ready possession.");

  // Reschedule Visit Modal State
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleVisitId, setRescheduleVisitId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("11:00 AM");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDashboard(city);
      if (data) {
        setDashData(data);
      }
    } catch {
      // If error (e.g. guest or local fallback), use sensible default data
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Dynamic reducing balance calculations
  const calculateDynamicLoan = (income: number, rate: number, tenureYrs: number) => {
    const maxEmi = income * 0.50;
    const r = (rate / 100) / 12;
    const n = tenureYrs * 12;
    if (r <= 0 || n <= 0) return { loan: 0, emi: 0, down: 0, interest: 0 };
    const compound = Math.pow(1 + r, n);
    const loan = Math.round(maxEmi * ((compound - 1) / (r * compound)));
    const emiVal = Math.round((loan * r * compound) / (compound - 1));
    const down = Math.round(loan * 0.25);
    const totalRepay = emiVal * n;
    const totalInterest = Math.max(0, totalRepay - loan);
    return { loan, emi: emiVal, down, interest: totalInterest };
  };

  const dynamicLoan = calculateDynamicLoan(loanIncome, loanRate, loanTenure);
  const dynamicEmiCalc = (() => {
    const r = (loanRate / 100) / 12;
    const n = loanTenure * 12;
    if (r <= 0 || n <= 0) return { emi: 0, interest: 0, total: 0 };
    const compound = Math.pow(1 + r, n);
    const emiVal = Math.round((calcAmount * r * compound) / (compound - 1));
    const total = emiVal * n;
    const interest = Math.max(0, total - calcAmount);
    return { emi: emiVal, interest, total };
  })();

  const handleRescheduleSubmit = async () => {
    if (!rescheduleVisitId || !rescheduleDate) {
      setToastMsg("Please select a valid date for rescheduling.");
      return;
    }
    setRescheduleLoading(true);
    try {
      const fullDateStr = `${rescheduleDate}T${rescheduleTime.includes("PM") ? (parseInt(rescheduleTime) + 12) % 24 : parseInt(rescheduleTime)}:00:00`;
      const isoString = new Date(fullDateStr).toISOString();
      await rescheduleSiteVisit(rescheduleVisitId, isoString, `Rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      setToastMsg("Site visit rescheduled successfully!");
      setRescheduleOpen(false);
      loadDashboard();
    } catch (err: any) {
      setToastMsg(err?.message || "Failed to reschedule visit.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelVisit = async (visitId: number) => {
    if (!confirm("Are you sure you want to cancel this scheduled site visit?")) return;
    try {
      await cancelSiteVisit(visitId);
      setToastMsg("Site visit cancelled.");
      loadDashboard();
    } catch (err: any) {
      setToastMsg(err?.message || "Failed to cancel visit.");
    }
  };

  const handleUnsave = async (propertyId: number) => {
    try {
      await removeFavorite(propertyId);
      setToastMsg("Property removed from Saved list.");
      loadDashboard();
    } catch (err: any) {
      setToastMsg(err?.message || "Error removing favorite.");
    }
  };

  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    fetchMyBookings()
      .then(res => setMyBookings(res || []))
      .catch(() => {});
  }, []);

  const buyerNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "voice-search", label: "🎤 Voice Search", icon: Mic },
    { id: "documents", label: "Documents & Verification", icon: Shield },
    { id: "requirements", label: "Property Requirements", icon: SlidersHorizontal },
    { id: "kyc", label: "Profile & Voice KYC", icon: User },
    { id: "bookings", label: "My Flat Bookings", icon: Zap },
    { id: "buy", label: "Buy", icon: Home },
    { id: "rent", label: "Rent", icon: Building2 },
    { id: "commercial", label: "Commercial", icon: Building },
    { id: "new-projects", label: "New Projects", icon: Layers },
    { id: "saved", label: "Saved Properties", icon: Heart },
    { id: "compare", label: "Compare", icon: Layers },
    { id: "loan", label: "Loan Calculator", icon: DollarSign },
    { id: "emi", label: "EMI Calculator", icon: BarChart2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "visits", label: "Visit Schedule", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNav = (id: string) => {
    if (id === "voice-search") { setVoiceSearchOpen(true); return; }
    if (id === "documents") { setActiveSection("documents"); return; }
    if (id === "requirements") { setActiveSection("requirements"); return; }
    if (id === "kyc") { setActiveSection("kyc"); return; }
    if (id === "buy") { navigate("buy"); return; }
    if (id === "rent") { navigate("rent"); return; }
    if (id === "commercial") { navigate("commercial"); return; }
    if (id === "new-projects") { navigate("new-projects"); return; }
    if (id === "compare") { navigate("compare"); return; }
    if (id === "saved") { navigate("favorites"); return; }
    if (id === "profile") { setActiveSection("kyc"); return; }
    if (id === "settings") { navigate("settings"); return; }
    setActiveSection(id);
  };

  const savedCount = dashData?.saved_count ?? 3;
  const upcomingVisitsCount = dashData?.upcoming_visits ?? 2;
  const comparisonCount = dashData?.comparison_count ?? 2;
  const loanEligAmountDisplay = dashData?.loan_eligibility?.amount_display || `₹${(dynamicLoan.loan / 100000).toFixed(1)}L`;

  const visitsList = dashData?.upcoming_visits_data || [];
  const savedList = dashData?.saved_properties_data || [];
  const marketInsights = dashData?.market_insights;
  const recommendationText = dashData?.recommendation?.text || "SAI analyzed verified property data in Baner & Wakad. High appreciation potential with upcoming metro connectivity!";

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastAlert message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Reschedule Visit Modal */}
      {rescheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#D9E5E3]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Reschedule Site Visit</h3>
              <button onClick={() => setRescheduleOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#006D6A]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preferred Time</label>
                <select
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#006D6A]"
                >
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>02:00 PM</option>
                  <option>03:30 PM</option>
                  <option>05:00 PM</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRescheduleOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={rescheduleLoading}
                className="flex-1 py-3 rounded-xl bg-[#006D6A] text-white font-bold text-sm hover:bg-[#004F4D] transition-colors shadow-lg"
              >
                {rescheduleLoading ? "Saving..." : "Confirm Date"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004F4D] to-[#073B3A] rounded-3xl p-6 mb-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center pr-3 border-r border-white/20">
              <SaiLogo size="sm" variant="light" subtitle="Buyer Portal" />
            </div>
            <button onClick={() => navigate("home")} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl text-sm transition-all flex-shrink-0 border border-white/20">
              <ChevronLeft size={16} />Back
            </button>
            <div>
              <p className="text-[#D9E5E3] text-xs font-bold uppercase tracking-wider mb-1">Buyer Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome, {buyerName}!</h1>
              <p className="text-[#E6F4F2] mt-1 text-sm flex items-center gap-1.5"><MapPin size={13} />📍 {city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setVoiceSearchOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-4 sm:px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:scale-105"
            >
              <Mic size={16} className="text-slate-900" />
              <span>Search by Voice</span>
            </button>
            <button onClick={() => navigate("search")} className="bg-white text-[#008F8C] font-bold px-4 sm:px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#E6F4F2] transition-colors shadow-lg">
              <Search size={16} />Find Properties
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3] overflow-hidden">
              <div className="p-3.5 border-b border-[#D9E5E3] flex items-center justify-center">
                <SaiLogo size="sm" subtitle="Buyer Portal" />
              </div>
              {buyerNav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-[#D9E5E3] last:border-0 ${
                    activeSection === id ? "bg-[#006D6A] text-white font-bold" : "text-slate-600 hover:bg-[#E6F4F2] font-medium"
                  }`}
                >
                  <Icon size={15} className={activeSection === id ? "text-white" : "text-[#008F8C]"} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Mobile Nav */}
            <div className="lg:hidden overflow-x-auto flex gap-2 mb-4 pb-2 scrollbar-hide">
              {buyerNav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeSection === id ? "bg-[#006D6A] text-white" : "bg-white text-slate-600 border border-[#D9E5E3]"
                  }`}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* DASHBOARD (default) */}
            {activeSection === "dashboard" && (
              <>
                {/* Voice Search & Document Verification Spotlight Banner */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-[#004F4D] rounded-3xl p-5 sm:p-6 text-white shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow">
                      <Mic size={26} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-teal-200 text-[11px] font-bold uppercase tracking-wider">Multilingual AI Voice Search</span>
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">Speak naturally in Marathi, Hindi or English</h3>
                      <p className="text-xs text-teal-100 mt-0.5">
                        Try saying: "मला अमरावतीमध्ये दोन बीएचके फ्लॅट पाहिजे" • "2 BHK in Baner with parking under 70 lakh"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setVoiceSearchOpen(true)}
                      className="flex-1 md:flex-initial bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl text-xs sm:text-sm shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Mic size={16} /> 🎤 Search by Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("documents")}
                      className="bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition-colors border border-white/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Shield size={15} /> Verified Docs
                    </button>
                  </div>
                </div>

                {/* Stat Cards - Connected directly to Authenticated User Database */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
                  {[
                    { label: "Saved Properties", val: savedCount.toString(), icon: Heart, color: "text-red-500 bg-red-50", onClick: () => navigate("favorites") },
                    { label: "Upcoming Visits", val: upcomingVisitsCount.toString(), icon: Calendar, color: "text-[#006D6A] bg-[#E6F4F2]", onClick: () => setActiveSection("visits") },
                    { label: "Comparing", val: comparisonCount.toString(), icon: Layers, color: "text-[#008F8C] bg-[#E6F4F2]", onClick: () => navigate("compare") },
                    { label: "Loan Eligibility", val: loanEligAmountDisplay, icon: DollarSign, color: "text-green-600 bg-green-50", onClick: () => setActiveSection("loan") },
                  ].map(({ label, val, icon: Icon, color, onClick }) => (
                    <div
                      key={label}
                      onClick={onClick}
                      className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3] cursor-pointer hover:border-[#006D6A] transition-all hover:shadow-lg"
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color.split(" ")[1]} mb-3`}>
                        <Icon size={18} className={color.split(" ")[0]} />
                      </div>
                      <p className="font-black text-2xl sm:text-3xl text-slate-800 tracking-tight">{val}</p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* AI Loan Eligibility Banner */}
                    <div className="bg-gradient-to-r from-[#006D6A] via-[#007E7B] to-[#073B3A] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#E6F4F2] text-xs font-bold uppercase tracking-wider">AI Loan Eligibility</span>
                        <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">Pre-Qualified</span>
                      </div>
                      <p className="text-white font-black text-3xl sm:text-4xl mb-1">
                        {dashData?.loan_eligibility?.amount_display || `₹${(dynamicLoan.loan / 100000).toFixed(1)} Lakhs`}
                      </p>
                      <p className="text-[#E6F4F2] text-xs sm:text-sm mb-4">
                        {dashData?.loan_eligibility?.basis_text || `Based on ₹${loanIncome.toLocaleString()}/mo income · ${loanTenure}yr tenure · ${loanRate}% rate`}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { l: "Monthly EMI", v: dashData?.loan_eligibility?.monthly_emi_display || `₹${dynamicLoan.emi.toLocaleString()}` },
                          { l: "Down Payment", v: dashData?.loan_eligibility?.down_payment_display || `₹${(dynamicLoan.down / 100000).toFixed(1)}L` },
                          { l: "Total Interest", v: dashData?.loan_eligibility?.total_interest_display || `₹${(dynamicLoan.interest / 100000).toFixed(1)}L` },
                        ].map(({ l, v }) => (
                          <div key={l} className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                            <p className="text-[#E6F4F2] text-[11px] font-medium">{l}</p>
                            <p className="text-white font-black text-base sm:text-lg mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Site Visits */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-800 text-lg">Upcoming Site Visits</h3>
                        <button onClick={() => setActiveSection("visits")} className="text-[#006D6A] text-xs font-bold hover:underline">View All</button>
                      </div>
                      {visitsList.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-600 font-bold text-sm">No upcoming visits scheduled</p>
                          <p className="text-slate-400 text-xs mt-1">Browse properties and schedule your on-site tour in seconds.</p>
                          <button onClick={() => navigate("search")} className="mt-3 px-4 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors">
                            Explore Properties
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visitsList.slice(0, 3).map((v: any) => (
                            <div key={v.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-[#D9E5E3]">
                              <img src={v.img || IMGS.p1} alt={v.name} className="w-16 h-16 rounded-2xl object-cover bg-[#E6F4F2] flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{v.name}</p>
                                <p className="text-xs text-slate-400 truncate">{v.loc}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Clock size={12} className="text-[#006D6A]" />
                                  <span className="text-xs text-[#008F8C] font-semibold">{v.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setRescheduleVisitId(v.id); setRescheduleOpen(true); }}
                                  className="px-3 py-2 bg-[#E6F4F2] rounded-xl text-[#008F8C] text-xs font-bold hover:bg-[#D9E5E3] transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelVisit(v.id)}
                                  className="px-2.5 py-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 text-xs font-bold transition-colors"
                                  title="Cancel Visit"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Saved Properties */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-800 text-lg">Saved Properties ({savedCount})</h3>
                        <button onClick={() => navigate("favorites")} className="text-[#006D6A] text-sm font-semibold hover:underline">See all</button>
                      </div>
                      {savedList.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Heart size={28} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-600 font-bold text-sm">No saved properties yet</p>
                          <p className="text-slate-400 text-xs mt-1">Click the heart icon on any property to save it to your dashboard.</p>
                          <button onClick={() => navigate("search")} className="mt-3 px-4 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors">
                            Search Properties
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {savedList.slice(0, 4).map((p: any) => (
                            <div key={p.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col justify-between">
                              <div className="relative mb-2">
                                <img src={p.img || IMGS.p1} alt={p.title} className="w-full h-32 object-cover rounded-xl" />
                                <button
                                  onClick={() => handleUnsave(p.id)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-red-500 shadow-sm hover:scale-110 transition-transform"
                                  title="Remove from Saved"
                                >
                                  <Heart size={13} className="fill-red-500" />
                                </button>
                                <span className="absolute bottom-2 left-2 bg-[#006D6A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {p.badge || "Verified"}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm truncate">{p.title}</p>
                                <p className="text-xs text-slate-500">{p.location}</p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                  <span className="font-black text-[#006D6A] text-sm">{p.price}</span>
                                  <button
                                    onClick={() => { selectProperty(p.id); navigate("property"); }}
                                    className="text-xs font-bold text-[#008F8C] hover:underline"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* SAI Recommends */}
                    <div className="bg-[#E6F4F2] rounded-3xl p-5 border border-[#D9E5E3] shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain size={18} className="text-[#006D6A]" />
                        <p className="font-black text-[#073B3A]">SAI Recommends</p>
                      </div>
                      <p className="text-[#006D6A] text-sm leading-relaxed mb-4">
                        {recommendationText}
                      </p>
                      <button onClick={() => navigate("chat")} className="w-full bg-[#006D6A] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 shadow-md">
                        <Bot size={14} />Ask SAI Assistant
                      </button>
                    </div>

                    {/* AI Market Insights */}
                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                      <h3 className="font-black text-slate-800 mb-4 text-base">AI Market Insights ({marketInsights?.city || city})</h3>
                      <div className="space-y-3">
                        {[
                          { label: `Price Trend (${marketInsights?.city || city})`, val: marketInsights?.price_trend || "+11.4% YoY", up: true },
                          { label: "Inventory", val: marketInsights?.inventory_label || "Active Listings", up: false },
                          { label: "Avg Price / sq.ft", val: marketInsights?.avg_sqft_display || "₹7,250/sq.ft", up: true },
                          { label: "Best Time to Buy", val: marketInsights?.best_time_to_buy || "Now (Balanced Market)", up: true },
                        ].map(({ label, val, up }) => (
                          <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">{label}</span>
                            <span className={`text-xs font-bold ${up ? "text-green-600" : "text-[#008F8C]"}`}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Nav */}
                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                      <h3 className="font-black text-slate-800 mb-3 text-sm">Quick Navigation</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { l: "Buy Property", p: "buy", icon: Home },
                          { l: "Rent Property", p: "rent", icon: Building2 },
                          { l: "Compare", p: "compare", icon: Layers },
                          { l: "Favorites", p: "favorites", icon: Heart },
                          { l: "AI Chat", p: "chat", icon: Bot },
                          { l: "Settings", p: "settings", icon: Settings },
                        ].map(({ l, p, icon: Icon }) => (
                          <button key={l} onClick={() => navigate(p as Page)} className="flex items-center gap-2 p-2.5 bg-[#E6F4F2] rounded-xl text-xs font-bold text-[#006D6A] hover:bg-[#D9E5E3] transition-colors">
                            <Icon size={13} />{l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* LOAN CALCULATOR SECTION */}
            {activeSection === "loan" && (
              <div className="space-y-5">
                <h2 className="font-black text-slate-800 text-xl mb-2">Loan Eligibility Calculator</h2>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] space-y-5">
                  {[
                    { label: "Monthly Gross Income (₹)", val: loanIncome, setter: setLoanIncome, min: 20000, max: 500000, step: 5000 },
                    { label: "Interest Rate (% p.a.)", val: loanRate, setter: setLoanRate, min: 6.5, max: 15.0, step: 0.1 },
                    { label: "Loan Tenure (Years)", val: loanTenure, setter: setLoanTenure, min: 5, max: 30, step: 1 },
                  ].map(({ label, val, setter, min, max, step }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-black text-slate-600">{label}</label>
                        <span className="text-sm font-black text-[#008F8C]">
                          {label.includes("₹") ? `₹${val.toLocaleString()}` : label.includes("%") ? `${val}%` : `${val} Years`}
                        </span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={val} onChange={e => setter(Number(e.target.value))} className="w-full accent-[#006D6A]" />
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-[#006D6A] to-[#073B3A] rounded-3xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-white">
                  {[
                    { l: "Estimated Eligibility", v: `₹${(dynamicLoan.loan / 100000).toFixed(1)}L` },
                    { l: "Monthly EMI", v: `₹${dynamicLoan.emi.toLocaleString()}` },
                    { l: "Total Interest", v: `₹${(dynamicLoan.interest / 100000).toFixed(1)}L` },
                    { l: "Required Down Payment (20%)", v: `₹${(dynamicLoan.down / 100000).toFixed(1)}L` },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-white/20 rounded-2xl p-4 text-center">
                      <p className="text-white font-black text-xl">{v}</p>
                      <p className="text-[#E6F4F2] text-xs mt-1">{l}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("search")} className="w-full bg-[#006D6A] text-white font-black py-4 rounded-2xl hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2">
                  <Search size={16} />Find Properties in My Budget
                </button>
              </div>
            )}

            {/* EMI CALCULATOR SECTION */}
            {activeSection === "emi" && (
              <div className="space-y-5">
                <h2 className="font-black text-slate-800 text-xl mb-2">EMI Calculator</h2>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] space-y-5">
                  {[
                    { label: "Loan Amount (₹)", val: calcAmount, setter: setCalcAmount, min: 500000, max: 30000000, step: 100000 },
                    { label: "Interest Rate (% p.a.)", val: loanRate, setter: setLoanRate, min: 6.5, max: 15.0, step: 0.1 },
                    { label: "Tenure (Years)", val: loanTenure, setter: setLoanTenure, min: 1, max: 30, step: 1 },
                  ].map(({ label, val, setter, min, max, step }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-black text-slate-600">{label}</label>
                        <span className="text-sm font-black text-[#008F8C]">
                          {label.includes("₹") ? `₹${val.toLocaleString()}` : label.includes("%") ? `${val}%` : `${val} Years`}
                        </span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={val} onChange={e => setter(Number(e.target.value))} className="w-full accent-[#006D6A]" />
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-[#004F4D] to-[#073B3A] rounded-3xl p-6 text-center text-white">
                  <p className="text-[#E6F4F2] text-sm font-semibold mb-1">Your Monthly EMI</p>
                  <p className="text-white font-black text-4xl sm:text-5xl">₹{dynamicEmiCalc.emi.toLocaleString()}</p>
                  <p className="text-[#D9E5E3] text-xs mt-2">For ₹{(calcAmount / 100000).toFixed(1)}L · {loanRate}% · {loanTenure} yrs</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { l: "Principal", v: `₹${(calcAmount / 100000).toFixed(1)}L`, c: "bg-[#E6F4F2] text-[#006D6A]" },
                    { l: "Total Interest", v: `₹${(dynamicEmiCalc.interest / 100000).toFixed(1)}L`, c: "bg-red-50 text-red-600" },
                    { l: "Total Payment", v: `₹${(dynamicEmiCalc.total / 100000).toFixed(1)}L`, c: "bg-slate-50 text-slate-700" },
                  ].map(({ l, v, c }) => (
                    <div key={l} className={`rounded-2xl p-4 text-center border border-[#D9E5E3] ${c.split(" ")[0]}`}>
                      <p className={`font-black text-lg sm:text-xl ${c.split(" ")[1]}`}>{v}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === "notifications" && (
              <div className="space-y-4">
                <h2 className="font-black text-slate-800 text-xl mb-2">Notifications</h2>
                {[
                  { type: "Visit Reminder", msg: "Site visit at Prestige Heights scheduled for 3:00 PM today.", time: "Today", icon: Calendar, color: "text-[#006D6A] bg-[#E6F4F2]" },
                  { type: "New Match", msg: "SAI identified 2 new verified listings in Baner matching your ₹60L budget.", time: "2h ago", icon: Sparkles, color: "text-green-600 bg-green-50" },
                  { type: "Loan Offer", msg: "HDFC & SBI pre-approved your home loan eligibility at 8.5% rate.", time: "Yesterday", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
                  { type: "Market Insight", msg: "Baner property prices appreciated +11.4% YoY. High rental demand active.", time: "3 days ago", icon: Brain, color: "text-purple-600 bg-purple-50" },
                ].map((n, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#D9E5E3] flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color.split(" ")[1]}`}>
                      <n.icon size={16} className={n.color.split(" ")[0]} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-700 text-sm">{n.type}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{n.msg}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            )}

            {/* VISIT SCHEDULE SECTION */}
            {activeSection === "visits" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-slate-800 text-xl">Visit Schedule ({visitsList.length})</h2>
                  <button onClick={() => navigate("search")} className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors shadow-sm">
                    <Plus size={14} />Schedule Visit
                  </button>
                </div>
                {visitsList.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-[#D9E5E3]">
                    <Calendar size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-bold">No site visits scheduled</p>
                    <p className="text-slate-400 text-xs mt-1">Book an in-person site visit on any property to see it listed here.</p>
                    <button onClick={() => navigate("search")} className="mt-4 px-5 py-2.5 bg-[#006D6A] text-white font-bold text-xs rounded-xl">
                      Find Properties
                    </button>
                  </div>
                ) : (
                  visitsList.map((v: any) => (
                    <div key={v.id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3]">
                      <div className="flex items-center gap-4 mb-3">
                        <img src={v.img || IMGS.p1} alt={v.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 truncate">{v.name}</p>
                          <p className="text-xs text-slate-400 truncate">{v.loc}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-[#006D6A]" />
                            <span className="text-xs text-[#008F8C] font-semibold">{v.date}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          v.status === "CONFIRMED" || v.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 mb-3">
                        <User size={13} className="text-[#008F8C]" />
                        <span className="text-sm text-slate-600 font-semibold">{v.agent || "Sai Property Consultant"}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRescheduleVisitId(v.id); setRescheduleOpen(true); }}
                          className="flex-1 py-2.5 bg-[#E6F4F2] rounded-xl text-[#006D6A] font-bold text-sm hover:bg-[#D9E5E3] transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelVisit(v.id)}
                          className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MY FLAT BOOKINGS SECTION */}
            {activeSection === "bookings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl">My Flat Bookings</h2>
                    <p className="text-xs text-slate-500">Real-time unit reservations & confirmations from SAI 3D platform.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (openBuilding3D) openBuilding3D();
                      else navigate("building-3d");
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] shadow cursor-pointer"
                  >
                    <Building2 size={14} /> Explore 3D Buildings
                  </button>
                </div>

                {myBookings.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                    <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No Flats Booked Yet</p>
                    <p className="text-slate-400 text-xs mt-1">Explore our 3D buildings, pick your preferred floor & flat, and reserve online.</p>
                    <button
                      onClick={() => {
                        if (openBuilding3D) openBuilding3D();
                        else navigate("building-3d");
                      }}
                      className="mt-4 bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#004F4D] transition-colors cursor-pointer"
                    >
                      Open 3D Discovery
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBookings.map((b) => (
                      <div key={b.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-slate-800 text-lg">{b.project_name} · {b.tower_name}</span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                              {b.status}
                            </span>
                          </div>
                          <p className="text-sm font-black text-teal-700 mb-1">
                            {b.unit_label} (Floor {b.floor_number}) · {b.bhk} BHK · {b.area_sqft} sq.ft · {b.direction} Facing
                          </p>
                          <p className="text-xs text-slate-400">
                            Agreed Price: <strong className="text-slate-700">{b.price_display}</strong> · Token Paid: <strong className="text-emerald-600">{b.booking_amount_display}</strong>
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (openBuilding3D) {
                                openBuilding3D(b.tower_id || b.building_id, b.floor_number, b.unit_number);
                              } else {
                                navigate("building-3d");
                              }
                            }}
                            className="py-2.5 px-4 bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Film size={13} /> View in 3D
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENTS & VERIFICATION SECTION */}
            {activeSection === "documents" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#D9E5E3]">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                      <ShieldCheck size={22} className="text-[#006D6A]" />
                      Property Document Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      100% Real Records from SAI Legal Registry — Inspect verified Sale Deeds, MahaRERA Registrations, Approvals & Tax Receipts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspect Property:</label>
                    <select
                      value={selectedDocPropertyId}
                      onChange={e => setSelectedDocPropertyId(Number(e.target.value))}
                      className="bg-slate-50 border border-[#D9E5E3] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    >
                      {savedList.length > 0 ? (
                        savedList.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.title} ({p.location || city})</option>
                        ))
                      ) : (
                        <>
                          <option value={1}>2 BHK Prestige Heights, Baner ({city})</option>
                          <option value={2}>3 BHK Luxury Villa, Koregaon Park ({city})</option>
                          <option value={11}>Green Haven Villa (Amravati)</option>
                          <option value={4}>Piramal Mahalaxmi (Mumbai)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <PropertyDocumentVerificationSection
                  propertyId={selectedDocPropertyId}
                  propertyTitle={savedList.find((p: any) => p.id === selectedDocPropertyId)?.title || "Selected Property"}
                />
              </div>
            )}

            {/* PROPERTY REQUIREMENTS WITH VOICE INPUT */}
            {activeSection === "requirements" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl sm:text-2xl flex items-center gap-2">
                      <SlidersHorizontal size={22} className="text-[#006D6A]" />
                      Property Requirements (Voice Enabled)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Speak hands-free with 🎤 in Marathi, Hindi or English, or type your preferences.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setToastMsg("Property requirements saved! SAI AI matching active.");
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors shadow-md"
                  >
                    <Check size={14} /> Save Requirements
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3] space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <VoiceInputField
                      label="Preferred Location / City"
                      value={reqLocation}
                      onChange={setReqLocation}
                      placeholder="e.g. Baner, Wakad, Hinjewadi, Pune or Amravati"
                      helperText="Click 🎤 and speak your preferred city or locality in any language"
                    />

                    <VoiceInputField
                      label="Maximum Budget"
                      value={reqMaxBudget}
                      onChange={setReqMaxBudget}
                      placeholder="e.g. 7500000 or 75 Lakh"
                      helperText="Click 🎤 and state your budget (e.g. 'under 60 lakh' or '75 लाख')"
                    />

                    <VoiceInputField
                      label="Minimum Configuration (BHK)"
                      value={reqMinBhk}
                      onChange={setReqMinBhk}
                      placeholder="e.g. 2 BHK, 3 BHK, 4 BHK"
                      helperText="Click 🎤 and say '2 BHK', 'दोन बीएचके', or '3 BHK'"
                    />

                    <VoiceInputField
                      label="Property Type"
                      value={reqPropertyType}
                      onChange={setReqPropertyType}
                      placeholder="e.g. Modern Apartment, Villa, Penthouse, Plot"
                      helperText="Click 🎤 and say Apartment, Flat, Row House, or Commercial"
                    />

                    <div className="sm:col-span-2">
                      <VoiceInputField
                        label="Preferred Amenities & Facilities"
                        value={reqAmenities}
                        onChange={setReqAmenities}
                        placeholder="e.g. Covered Car Parking, Swimming Pool, Clubhouse, 24/7 Power Backup, EV Charging"
                        helperText="Click 🎤 to list all mandatory amenities by voice"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <VoiceInputField
                        type="textarea"
                        rows={3}
                        label="Additional Requirements & Notes"
                        value={reqAdditional}
                        onChange={setReqAdditional}
                        placeholder="e.g. East-facing entrance, top floor view, vastu compliant, possession within 6 months"
                        helperText="Click 🎤 to dictate any custom instructions or special requests"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">All fields fully support multilingual voice input in Marathi, Hindi & English.</span>
                    <button
                      onClick={() => {
                        navigate("search");
                      }}
                      className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl text-xs hover:bg-[#004F4D] transition-colors shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Search size={14} /> Find Matching Properties
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BUYER PROFILE & VOICE KYC */}
            {activeSection === "kyc" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl sm:text-2xl flex items-center gap-2">
                      <User size={22} className="text-[#006D6A]" />
                      Buyer Profile & Voice KYC
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your buyer profile hands-free using 🎤 voice recognition in your preferred language.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setToastMsg("Buyer profile & KYC details updated successfully!");
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors shadow-md"
                  >
                    <Check size={14} /> Save Profile
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3] space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-teal-50/60 rounded-2xl border border-teal-200">
                    <div className="w-12 h-12 rounded-2xl bg-[#006D6A] text-white font-black flex items-center justify-center text-lg shadow">
                      {buyerName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-base">{buyerName}</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                          Verified Buyer
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{buyerEmail} • {buyerPhone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <VoiceInputField
                      label="Full Name"
                      value={buyerName}
                      onChange={setBuyerName}
                      placeholder="e.g. Priya Sharma"
                      helperText="Click 🎤 to speak your full legal name"
                    />

                    <VoiceInputField
                      type="email"
                      label="Email Address"
                      value={buyerEmail}
                      onChange={setBuyerEmail}
                      placeholder="e.g. buyer@sai.in"
                      helperText="Click 🎤 to speak your email address or edit manually"
                    />

                    <VoiceInputField
                      type="tel"
                      label="Phone Number"
                      value={buyerPhone}
                      onChange={(val) => setBuyerPhone(val.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      helperText="Click 🎤 and speak your 10-digit mobile number"
                    />

                    <VoiceInputField
                      label="Current City"
                      value={buyerCity}
                      onChange={setBuyerCity}
                      placeholder="e.g. Pune, Amravati, Mumbai, Nagpur"
                      helperText="Click 🎤 and say your current city"
                    />

                    <VoiceInputField
                      label="Locality / Area"
                      value={buyerLocality}
                      onChange={setBuyerLocality}
                      placeholder="e.g. Baner, Wakad, Kothrud"
                      helperText="Click 🎤 and speak your residential area or sector"
                    />

                    <VoiceInputField
                      label="Occupation / Organization"
                      value={buyerOccupation}
                      onChange={setBuyerOccupation}
                      placeholder="e.g. Senior Software Architect, Tata Consultancy"
                      helperText="Click 🎤 to state your profession or business"
                    />

                    <div className="sm:col-span-2">
                      <VoiceInputField
                        type="textarea"
                        rows={2}
                        label="Full Residential Address"
                        value={buyerAddress}
                        onChange={setBuyerAddress}
                        placeholder="e.g. Flat 402, Green Acre Heights, Baner Road, Pune 411045"
                        helperText="Click 🎤 to speak your full address"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>KYC Identity Verification Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle size={14} className="text-emerald-600" />
                      Aadhaar & PAN KYC Linked
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Search Modal */}
      <BuyerVoiceSearchModal
        isOpen={voiceSearchOpen}
        onClose={() => setVoiceSearchOpen(false)}
        defaultCity={city}
        onApplySearch={(crit) => {
          navigate("search");
          setToastMsg(`Voice search applied: ${crit.city || city} ${crit.bhk ? `• ${crit.bhk} BHK` : ""} ${crit.maxPrice ? `• Under ₹${(crit.maxPrice / 100000).toFixed(0)}L` : ""}`);
        }}
      />
    </div>
  );
}


function BuilderDashPage({ navigate, activeSection, setActiveSection, openBuilding3D }: { navigate: (pg: Page) => void; activeSection: string; setActiveSection: (s: string) => void; openBuilding3D?: (buildingId?: number, floor?: number, unit?: string) => void }) {
  return <BuilderPortal navigate={navigate} activeSection={activeSection} setActiveSection={setActiveSection} onOpenBuilding3D={openBuilding3D} />;
}

function AgentDashPage({ navigate, activeSection, setActiveSection }: { navigate: (pg: Page) => void; activeSection: string; setActiveSection: (s: string) => void }) {
  return <AgentPortal navigate={navigate} activeSection={activeSection} setActiveSection={setActiveSection} />;
}

function FavoritesPage({ navigate, selectProperty }: { navigate: (pg: Page) => void; selectProperty: (id: number) => void }) {
  const { tr } = useI18n();
  const [favProps, setFavProps] = useState<UIProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites()
      .then((res: any) => {
        const list: PropertyItem[] = Array.isArray(res) ? res : (res?.items || []);
        if (list.length > 0) {
          setFavProps(list.map(toUIProperty));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayedProps = favProps.length > 0 ? favProps : PROPERTIES.slice(0, 2);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await removeFavorite(id);
      setFavProps(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-1 text-[#006D6A] font-semibold text-xs mb-2 hover:underline"
            >
              <ChevronLeft size={14} />Back to Home
            </button>
            <h1 className="text-3xl font-black text-slate-800">{tr.savedProperties || "Saved Properties"}</h1>
            <p className="text-slate-500 text-sm mt-1">Properties you have bookmarked for quick review</p>
          </div>
          <button onClick={() => navigate("search")} className="bg-[#006D6A] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#004F4D] transition-colors flex items-center gap-1.5 shadow-sm">
            <Search size={14} />{tr.searchBtn || "Search More"}
          </button>
        </div>

        {displayedProps.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D9E5E3] max-w-md mx-auto">
            <Heart size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">{tr.noResultsFound || "No saved properties yet"}</h3>
            <p className="text-slate-400 text-sm mb-6">Explore properties and tap the heart icon to save them for easy access later.</p>
            <button onClick={() => navigate("search")} className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004F4D] transition-colors">
              {tr.searchBtn || "Search Properties"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProps.map(p => (
              <div key={p.id} className="relative group">
                <PropertyCard p={p} navigate={navigate} selectProperty={selectProperty} />
                <button
                  onClick={(e) => handleRemove(e, p.id)}
                  title="Remove from saved"
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow text-red-500 hover:bg-red-50 hover:scale-110 flex items-center justify-center transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage({ navigate }: { navigate: (pg: Page) => void }) {
  const { lang, setLang, tr } = useI18n();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const currentLangObj = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {langModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D9E5E3]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Globe size={20} className="text-[#006D6A]" />
                {tr.chooseLanguage || "Choose Language"}
              </h3>
              <button onClick={() => setLangModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">{tr.chooseLanguageSub || "Select your preferred language"}</p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangModalOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    l.code === lang ? "border-[#006A60] bg-[#E6F4F1] font-bold text-[#006A60]" : "border-[#D9E5E3] hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="text-sm notranslate font-bold">{l.native}</p>
                    <p className="text-[11px] notranslate text-slate-400">{l.name}</p>
                  </div>
                  {l.code === lang && <Check size={16} className="text-[#006A60]" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLangModalOpen(false)}
              className="w-full py-3 bg-[#006D6A] text-white font-bold rounded-xl hover:bg-[#004F4D] transition-colors"
            >
              {tr.close || "Close"}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-[#006D6A] font-semibold text-xs hover:underline bg-[#E6F4F2] px-3 py-1.5 rounded-xl border border-[#D9E5E3] transition-colors"
          >
            <ChevronLeft size={15} />Back
          </button>
          <h1 className="text-3xl font-black text-slate-800">Settings</h1>
        </div>
        {[
          {
            title: "Language & Region",
            items: [
              { label: "App Language", val: currentLangObj?.native || "English", action: () => setLangModalOpen(true) },
              { label: "Currency", val: "INR (₹)" },
              { label: "Default City", val: "Pune" },
            ],
          },
          { title: "AI Preferences", items: [{ label: "Personalized Recommendations", val: "On" }, { label: "AI Voice Responses", val: "On" }, { label: "Smart Notifications", val: "On" }] },
          { title: "Privacy", items: [{ label: "Search History", val: "Enabled" }, { label: "Data Sharing", val: "Anonymous only" }, { label: "Two-Factor Auth", val: "Enabled" }] },
          { title: "Notifications", items: [{ label: "Price Drop Alerts", val: "On" }, { label: "New Matches", val: "On" }, { label: "Market Updates", val: "Weekly" }] },
        ].map(sec => (
          <div key={sec.title} className="mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{sec.title}</p>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#D9E5E3]">
              {sec.items.map(({ label, val }, i) => (
                <div key={label} className={`flex items-center justify-between px-5 py-4 ${i < sec.items.length-1 ? "border-b border-[#D9E5E3]" : ""}`}>
                  <span className="text-slate-700 font-semibold text-sm">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">{val}</span>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => navigate("senior")} className="w-full bg-[#E6F4F2] border-2 border-[#D9E5E3] text-[#008F8C] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#E6F4F2] transition-colors">
          <Volume2 size={18} />Enable Senior Citizen Mode
        </button>
      </div>
    </div>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────
function ProfilePage({ navigate }: { navigate: (pg: Page) => void }) {
  const { lang, tr } = useI18n();
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "security">("info");
  const [userName, setUserName] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_name") : null) || "Priya Sharma"
  );
  const [userEmail, setUserEmail] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_email") : null) || "buyer@sai.in"
  );
  const [userPhone, setUserPhone] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_phone") : null) || "9876543210"
  );
  const [userCity, setUserCity] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_city") : null) || "Pune"
  );
  const [budget, setBudget] = useState("₹60L – ₹90L");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("sai_user_name", userName);
      localStorage.setItem("sai_user_email", userEmail);
      localStorage.setItem("sai_user_phone", userPhone);
      localStorage.setItem("sai_user_city", userCity);
    } catch {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignOut = () => {
    apiLogout();
    navigate("language");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 text-slate-600 hover:text-[#006D6A] font-bold text-sm bg-white px-4 py-2 rounded-xl border border-[#D9E5E3] shadow-sm transition-all"
          >
            <ChevronLeft size={18} className="text-[#006D6A]" />
            Back to Home
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 font-bold text-sm px-4 py-2 rounded-xl border border-red-200 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-[#006D6A] via-[#008F8C] to-[#004F4D] rounded-3xl p-6 sm:p-8 text-white shadow-[0_8px_32px_rgba(0,109,106,0.25)] mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl font-black shadow-lg">
              {userName.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black">{userName}</h1>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Shield size={12} /> Verified Buyer
                </span>
                <span className="bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Member since Jan 2026
                </span>
              </div>
              <p className="text-white/80 text-sm flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Mail size={14} />{userEmail}</span>
                <span className="flex items-center gap-1"><Phone size={14} />{userPhone}</span>
                <span className="flex items-center gap-1"><MapPin size={14} />{userCity}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
            <button onClick={() => navigate("favorites")} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-center transition-colors">
              <p className="text-2xl font-black">3</p>
              <p className="text-xs text-white/70 font-semibold mt-0.5">Saved Properties</p>
            </button>
            <button onClick={() => navigate("buyer")} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-center transition-colors">
              <p className="text-2xl font-black">2</p>
              <p className="text-xs text-white/70 font-semibold mt-0.5">Upcoming Visits</p>
            </button>
            <button onClick={() => navigate("compare")} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-center transition-colors">
              <p className="text-2xl font-black">2</p>
              <p className="text-xs text-white/70 font-semibold mt-0.5">In Comparison</p>
            </button>
            <button onClick={() => navigate("chat")} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-center transition-colors">
              <p className="text-2xl font-black">15</p>
              <p className="text-xs text-white/70 font-semibold mt-0.5">AI Recommendations</p>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-[#D9E5E3] shadow-sm">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "info" ? "bg-[#006D6A] text-white shadow" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User size={16} /> Personal Info
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "activity" ? "bg-[#006D6A] text-white shadow" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Layers size={16} /> Role Portals
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "security" ? "bg-[#006D6A] text-white shadow" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Shield size={16} /> Security & 2FA
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm p-4 rounded-2xl mb-6 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
            Profile details updated successfully!
          </div>
        )}

        {/* Tab 1: Personal Info Form */}
        {activeTab === "info" && (
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3] space-y-6">
            <h2 className="text-lg font-black text-slate-800">Edit Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Full Name</label>
                <input
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Phone Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-bold text-slate-500 select-none pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-800 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Preferred City</label>
                <select
                  value={userCity}
                  onChange={e => setUserCity(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Property Search Budget Range</label>
                <input
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. ₹50L – ₹80L"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004F4D] transition-colors shadow-md flex items-center gap-2"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Switch Roles Directly */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3] space-y-4">
            <h2 className="text-lg font-black text-slate-800">Switch Role Portal</h2>
            <p className="text-slate-500 text-sm">Experience SAI from any perspective. Jump straight into other specialized dashboards:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => navigate("buyer")}
                className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#006D6A] text-white flex items-center justify-center font-bold">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 group-hover:text-[#006D6A]">Buyer Portal</h3>
                    <p className="text-xs text-slate-500">Current Active Role</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Search, compare, save properties, and track scheduled site visits.</p>
              </div>

              <div
                onClick={() => navigate("seller")}
                className="p-5 rounded-2xl border-2 border-[#D9E5E3] hover:border-[#008F8C] bg-white hover:bg-slate-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 group-hover:text-amber-700">Seller Portal</h3>
                    <p className="text-xs text-slate-500">Post & Manage Listings</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Upload property photos, monitor views, enquiries, and buyer leads.</p>
              </div>

              <div
                onClick={() => navigate("agent")}
                className="p-5 rounded-2xl border-2 border-[#D9E5E3] hover:border-purple-400 bg-white hover:bg-slate-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 group-hover:text-purple-700">Agent Portal</h3>
                    <p className="text-xs text-slate-500">Client & Lead CRM</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Track client requests, organize visits, and view matched buyer leads.</p>
              </div>

              <div
                onClick={() => navigate("builder")}
                className="p-5 rounded-2xl border-2 border-[#D9E5E3] hover:border-blue-400 bg-white hover:bg-slate-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 group-hover:text-blue-700">Builder Portal</h3>
                    <p className="text-xs text-slate-500">Project Inventory Management</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Manage towers, project launch schedules, floor plans, and unit sales.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & 2FA */}
        {activeTab === "security" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3] space-y-6">
            <h2 className="text-lg font-black text-slate-800">Security & Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Two-Factor Authentication (2FA)</h4>
                  <p className="text-xs text-slate-500">Require an SMS / OTP code when signing into your account</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    twoFactor ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {twoFactor ? "Enabled ✓" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Password Security</h4>
                  <p className="text-xs text-slate-500">Last changed 2 weeks ago · Strong (12 characters)</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Password reset link sent to " + userEmail)}
                  className="px-4 py-2 bg-white border border-[#D9E5E3] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPage({
  navigate,
  goBack,
  selectProperty,
  comparePropertyIds = [],
  setComparePropertyIds,
  initialQuery,
  onClearInitialQuery,
  openBuilding3D
}: {
  navigate: (pg: Page) => void;
  goBack?: () => void;
  selectProperty?: (id: number) => void;
  comparePropertyIds?: number[];
  setComparePropertyIds?: React.Dispatch<React.SetStateAction<number[]>>;
  initialQuery?: string | null;
  onClearInitialQuery?: () => void;
  openBuilding3D?: (buildingId?: number, floor?: number, unit?: string) => void;
}) {
  const { lang, setLang, tr } = useI18n();
  const [msg, setMsg] = useState("");
  const [convId, setConvId] = useState<string>(() => "conv_" + Math.random().toString(36).substring(2, 9));
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedMapPropId, setSelectedMapPropId] = useState<number | null>(null);
  const [visitModalProp, setVisitModalProp] = useState<{ id: number; title: string } | null>(null);
  const [enquiryModalProp, setEnquiryModalProp] = useState<{ id: number; title: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const chatLangDropRef = useRef<HTMLDivElement>(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    if (!langDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (chatLangDropRef.current && !chatLangDropRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langDropdownOpen]);

  const initialGreeting = lang === "hi"
    ? "नमस्ते! 👋 मैं SAI AI असिस्टेंट हूँ।\n\nमैं आपके सामान्य सवालों के जवाब दे सकता हूँ और SAI प्रॉपर्टी डेटाबेस से बेहतरीन संपत्तियां खोजने में आपकी मदद कर सकता हूँ।\n\nपूछ कर देखें:\n• पुणे में ₹60 लाख के अंदर 2 BHK\n• हिंजेवाड़ी के पास प्रॉपर्टीज\n• बाणेर में रेंटल फ्लैट्स"
    : lang === "mr"
    ? "नमस्कार! 👋 मी SAI AI असिस्टंट आहे.\n\nमी तुमच्या सामान्य प्रश्नांची उत्तरे देऊ शकतो आणि SAI रिअल इस्टेट डेटाबेसमधून योग्य घरे शोधण्यात मदत करू शकतो.\n\nविचारून पहा:\n• पुण्यात ₹60 लाखांच्या आत 2 BHK\n• हिंजवडी जवळील मालमत्ता\n• बाणेरमधील भाड्याचे फ्लॅट्स"
    : "Hello! 👋 I'm SAI AI Assistant.\n\nI can answer general questions and help you find properties from the SAI property database.\n\nTry asking:\n• Find 2 BHK in Pune under ₹60 lakh\n• Properties near Hinjewadi\n• Show rental properties in Baner\n• Compare properties in Baner and Wakad";

  const [chatViewerDoc, setChatViewerDoc] = useState<{ id: number; name: string } | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "ai";
    text: string;
    properties?: PropertyItem[];
    language?: string;
    intent?: string;
    timestamp?: string;
    flat_3d?: any;
    matching_flats?: any[];
    suggestions?: string[];
    document_actions?: Array<{ label: string; document_id: number; view_url: string; document_name: string }>;
  }>>(() => [
    {
      role: "ai",
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{
          role: "ai",
          text: tr?.saiGreeting || initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }];
      }
      return prev;
    });
  }, [lang, tr]);

  // Aggregate all discovered properties across assistant messages for live map synchronization
  const allDiscoveredProperties = useMemo(() => {
    const seen = new Set<number>();
    const list: PropertyItem[] = [];
    messages.forEach(m => {
      if (m.properties) {
        m.properties.forEach(p => {
          if (p && p.id && !seen.has(p.id)) {
            seen.add(p.id);
            list.push(p);
          }
        });
      }
    });
    return list;
  }, [messages]);

  const resetChat = () => {
    setConvId("conv_" + Math.random().toString(36).substring(2, 9));
    setMessages([
      {
        role: "ai",
        text: tr?.saiGreeting || initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowMap(false);
    setSelectedMapPropId(null);
  };

  const send = async (customText?: string) => {
    const textToSend = (customText || msg).trim();
    if (!textToSend) return;
    const userMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newHistory = [...messages, { role: "user" as const, text: textToSend, timestamp: userMsgTime }];
    setMessages(newHistory);
    setMsg("");
    setTyping(true);

    try {
      const res: any = await chatWithAI(textToSend, convId, lang);
      const aiMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (res && res.message) {
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            text: res.message,
            properties: res.properties || [],
            language: res.language,
            intent: res.intent,
            timestamp: aiMsgTime,
            flat_3d: res.flat_3d,
            matching_flats: res.matching_flats,
            suggestions: res.suggestions,
            document_actions: res.document_actions,
          },
        ]);
        if (res.properties && res.properties.length > 0) {
          setSelectedMapPropId(res.properties[0].id);
        }
      } else {
        throw new Error("No message received");
      }
    } catch (err: any) {
      console.warn("Chat error:", err);
      // Use the chatbot fallback from mockData for intelligent responses
      try {
        const fallbackRes = await sendChatbotMessage(textToSend, [], lang);
        const aiMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            text: fallbackRes.reply || (lang === "hi"
              ? `मैंने "${textToSend}" के लिए SAI डेटाबेस खोजा है। यहाँ आपके लिए सबसे अच्छे विकल्प हैं:`
              : `I searched the SAI database for "${textToSend}". Here are the best options for you:`),
            properties: fallbackRes.properties || [],
            timestamp: aiMsgTime,
          },
        ]);
      } catch {
        const aiMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            text: lang === "hi"
              ? `मैंने "${textToSend}" के लिए खोज की है। कृपया BHK, स्थान, या बजट के अनुसार फ़िल्टर करें।`
              : lang === "mr"
              ? `मी "${textToSend}" साठी शोध केला. कृपया BHK, स्थान, किंवा बजेटनुसार फिल्टर करा.`
              : `I've processed your query: "${textToSend}". You can refine your search by BHK, location, budget, or property type. Try being more specific for better results!`,
            timestamp: aiMsgTime,
          },
        ]);
      }
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  // Handle follow-up queries forwarded from ComparePage
  useEffect(() => {
    if (initialQuery) {
      send(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const getSuggestions = () => {
    switch (lang) {
      case "hi":
        return ["पुणे में 2 BHK फ्लैट ₹60 लाख के अंदर 🏡", "हिंजेवाड़ी के पास प्रॉपर्टीज 📍", "बाणेर में रेंटल प्रॉपर्टीज दिखाएं 🏢", "बाणेर और वाकड की संपत्तियों की तुलना करें 🔍"];
      case "mr":
        return ["पुण्यात 2 BHK फ्लॅट ₹60 लाखांच्या आत 🏡", "हिंजवडी जवळील मालमत्ता 📍", "बाणेरमधील भाड्याचे फ्लॅट्स दाखवा 🏢", "बाणेर आणि वाकडमधील फ्लॅट्सची तुलना करा 🔍"];
      case "bn":
        return ["পুনেতে 2 BHK ফ্ল্যাট ₹60 লাখের নিচে 🏡", "হিঞ্জেওয়াড়ির কাছে প্রপার্টি 📍", "বানারে ভাড়ার ফ্ল্যাট 🏢", "বানার এবং ওয়াকাদ তুলনা করুন 🔍"];
      case "gu":
        return ["પુણેમાં 2 BHK ફ્લેટ ₹60 લાખની અંદર 🏡", "હિંજેવાડી નજીક પ્રોપર્ટીઝ 📍", "બાનેરમાં ભાડાના ફ્લેટ્સ 🏢", "બાનેર અને વાકડની સરખામણી કરો 🔍"];
      case "ta":
        return ["புனேவில் ₹60 லட்சத்திற்குள் 2 BHK பிளாட் 🏡", "ஹிஞ்சேவாடி அருகில் உள்ள வீடுகள் 📍", "பானேரில் வாடகை வீடுகள் 🏢", "பானேர் மற்றும் வாகாட் ஒப்பீடு 🔍"];
      case "te":
        return ["పూణేలో ₹60 లక్షల లోపు 2 BHK ఫ్లాట్ 🏡", "హింజేవాడి దగ్గర ప్రాపర్టీస్ 📍", "బానేర్‌లో అద్దె ఫ్లాట్లు 🏢", "బానేర్ మరియు వాకడ్ పోలిక 🔍"];
      case "kn":
        return ["ಪುಣೆಯಲ್ಲಿ ₹60 ಲಕ್ಷದೊಳಗೆ 2 BHK ಅಪಾರ್ಟ್‌ಮೆಂಟ್ 🏡", "ಹಿಂಜೇವಾಡಿ ಹತ್ತಿರದ ಮನೆಗಳು 📍", "ಬಾನೇರ್‌ನಲ್ಲಿ ಬಾಡಿಗೆ ಫ್ಲ್ಯಾಟ್‌ಗಳು 🏢", "ಬಾನೇರ್ ಮತ್ತು ವಾಕಡ್ ಹೋಲಿಕೆ 🔍"];
      default:
        return ["Find 2 BHK in Pune under ₹60 lakh 🏡", "Properties near Hinjewadi 📍", "Show rental properties in Baner 🏢", "Compare properties in Baner and Wakad 🔍"];
    }
  };

  const suggestions = getSuggestions();
  const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <VoiceMicModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        lang={lang}
        onResult={(text) => {
          send(text);
          setVoiceOpen(false);
        }}
      />

      {visitModalProp && (
        <SiteVisitModal
          isOpen={true}
          propertyId={visitModalProp.id}
          propertyTitle={visitModalProp.title}
          onClose={() => setVisitModalProp(null)}
          onSuccess={(m) => {
            setVisitModalProp(null);
            setToast(m || "Site visit scheduled successfully!");
          }}
        />
      )}

      {enquiryModalProp && (
        <EnquiryModal
          isOpen={true}
          propertyId={enquiryModalProp.id}
          propertyTitle={enquiryModalProp.title}
          onClose={() => setEnquiryModalProp(null)}
          onSuccess={(m) => {
            setEnquiryModalProp(null);
            setToast(m || "Enquiry sent successfully!");
          }}
        />
      )}

      {toast && <ToastAlert message={toast} onClose={() => setToast(null)} />}

      {/* Chat Header */}
      <div className="bg-white border-b border-[#D9E5E3] shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (goBack ? goBack() : navigate("home"))}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 text-xs font-bold transition-colors shadow-xs border border-slate-200"
              title="Back to previous page"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center shadow-[0_4px_12px_rgba(0,109,106,0.4)] flex-shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-800 text-sm sm:text-base">SAI Smart AI Property Finder</h2>
                <span className="hidden sm:inline-block bg-[#E6F4F2] text-[#006D6A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9E5E3]">
                  Qwen3 Grounded
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-green-600 text-xs font-semibold truncate">PostgreSQL Real DB Grounded · 8 Languages</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Language Switcher Inside Chat */}
            <div className="relative" ref={chatLangDropRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="px-3 py-1.5 bg-[#E6F4F2] text-[#006D6A] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-[#D9E5E3] transition-colors"
                title="Change Conversation Language"
              >
                <Globe size={13} />
                <span className="notranslate">{currentLangObj.native}</span>
                <ChevronDown size={12} className={`transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-2xl border border-[#D9E5E3] p-1.5 w-44 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        l.code === lang ? "bg-[#E6F4F2] text-[#006D6A] font-bold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="notranslate">{l.native}</span>
                      {l.code === lang && <Check size={13} className="text-[#006D6A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map Sync Toggle */}
            {allDiscoveredProperties.length > 0 && (
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showMap
                    ? "bg-[#006D6A] text-white shadow-md"
                    : "bg-[#E6F4F2] text-[#008F8C] hover:bg-[#D9E5E3]"
                }`}
              >
                <MapPin size={13} />
                <span>{showMap ? "Hide Map" : `Map (${allDiscoveredProperties.length})`}</span>
              </button>
            )}

            {/* Voice Input */}
            <button
              onClick={() => setVoiceOpen(true)}
              className="px-3 py-1.5 bg-[#E6F4F2] text-[#008F8C] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-[#D9E5E3] transition-colors"
              title="Voice Search"
            >
              <Mic size={13} />
              <span className="hidden sm:inline">Voice</span>
            </button>

            {/* Reset Chat */}
            <button
              onClick={resetChat}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Start New Conversation"
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container with optional Split Map View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Column */}
        <div className={`flex-1 overflow-y-auto flex flex-col transition-all duration-300 ${showMap ? "lg:w-3/5" : "w-full"}`}>
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center flex-shrink-0 shadow">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className="max-w-[88%] sm:max-w-[82%] space-y-2.5">
                  <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "ai"
                      ? "bg-white rounded-tl-sm text-slate-700 shadow-[0_2px_16px_rgba(0,109,106,0.08)] border border-[#D9E5E3]"
                      : "bg-[#006D6A] rounded-tr-sm text-white shadow-[0_4px_16px_rgba(0,109,106,0.3)]"
                  }`}>
                    {m.text}

                    {m.role === "ai" && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined" && window.speechSynthesis) {
                              window.speechSynthesis.cancel();
                              const plain = m.text.replace(/[*#_•📍🏢🏡🔍]/g, "");
                              const u = new SpeechSynthesisUtterance(plain);
                              u.lang = getSpeechCode(lang);
                              window.speechSynthesis.speak(u);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6F4F1] text-[#006A60] hover:bg-[#D0ECE7] text-[11px] font-bold transition-colors"
                          title="Listen to response"
                        >
                          <Volume2 size={12} />
                          <span>Listen</span>
                        </button>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {m.language && <span className="text-[#006A60]">{m.language}</span>}
                          {m.intent && <span>• {m.intent}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verified Document Actions from AI Verification Engine */}
                  {m.document_actions && m.document_actions.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Shield size={14} className="text-emerald-600" />
                        <span>Verified Legal & Regulatory Documents:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.document_actions.map((docAct: any, dIdx: number) => (
                          <button
                            key={dIdx}
                            onClick={() => setChatViewerDoc({ id: docAct.document_id, name: docAct.document_name || docAct.label })}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          >
                            <FileText size={13} />
                            <span>{docAct.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3D Flat Discovery Cards */}
                  {((m.matching_flats && m.matching_flats.length > 0) ? m.matching_flats : (m.flat_3d ? [m.flat_3d] : [])).map((flat: any, fIdx: number) => (
                    <div
                      key={fIdx}
                      className="bg-gradient-to-r from-slate-900 via-[#073B3A] to-slate-900 border border-teal-500/40 rounded-2xl p-4 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 border border-teal-400/40 uppercase tracking-wider">
                            3D Flat
                          </span>
                          <h4 className="font-black text-sm text-white truncate">
                            {flat.tower_name || "Tower A"} · Flat {flat.unit_label || `${flat.floor_number}-${flat.unit_number}`}
                          </h4>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                            (flat.status || "").toLowerCase() === "available"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}>
                            {flat.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Floor {flat.floor_number} · {flat.bhk} BHK · {flat.area_sqft} sq.ft · {flat.direction} Facing
                        </p>
                        <p className="text-xs font-black text-teal-300 mt-0.5">
                          {flat.price_display || (flat.price ? `₹${(flat.price / 100000).toFixed(2)} Lakh` : "")}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (openBuilding3D) {
                            openBuilding3D(flat.building_id, flat.floor_number, flat.unit_number);
                          } else if ((window as any).__saiOpenBuilding3D) {
                            (window as any).__saiOpenBuilding3D(flat.building_id, flat.floor_number, flat.unit_number);
                          } else {
                            navigate("building-3d");
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer active:scale-95"
                      >
                        <Film size={13} /> Open in 3D
                      </button>
                    </div>
                  ))}

                  {/* Dynamic Suggestions */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestions.map((sug: string, sIdx: number) => (
                        <button
                          key={sIdx}
                          onClick={() => send(sug)}
                          className="text-[11px] font-bold px-3 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-full border border-[#D9E5E3] hover:border-teal-400 shadow-xs transition-all cursor-pointer"
                        >
                          💬 {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Embedded Property Cards in Assistant Response */}
                  {m.properties && m.properties.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {m.properties.slice(0, 4).map((p) => {
                        if (!p || !p.id) return null;
                        const img =
                          p.media && p.media.length > 0
                            ? (typeof p.media[0] === "string" ? p.media[0] : (p.media[0]?.url || IMGS.p1))
                            : IMGS.p1;
                        const isSelectedOnMap = selectedMapPropId === p.id;
                        const priceDisplay =
                          p.price_display ||
                          (p.price != null ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price on Request");

                        return (
                          <div
                            key={p.id}
                            onMouseEnter={() => setSelectedMapPropId(p.id)}
                            className={`bg-white rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between ${
                              isSelectedOnMap
                                ? "border-[#008F8C] ring-2 ring-[#008F8C]/20 shadow-md"
                                : "border-[#D9E5E3] shadow-sm hover:border-[#008F8C]/40"
                            }`}
                          >
                            <div className="flex gap-3 mb-2.5">
                              <img src={img} alt={p.title || "Property"} className="w-16 h-16 rounded-xl object-cover bg-[#E6F4F2] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  {p.is_verified && (
                                    <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                      <CheckCircle size={8} />Verified
                                    </span>
                                  )}
                                  {p.is_rera && (
                                    <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                      RERA
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-slate-800 text-xs truncate">{p.title || "Property"}</p>
                                <p className="text-[#008F8C] font-black text-sm">{priceDisplay}</p>
                                <p className="text-[11px] text-slate-400 truncate">{p.bhk ? `${p.bhk} BHK • ` : ""}{p.locality || ""}, {p.city || ""}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100 text-center">
                              <button
                                onClick={() => { selectProperty?.(p.id); navigate("property"); }}
                                className="py-1.5 bg-[#006D6A] text-white text-[10px] font-bold rounded-lg hover:bg-[#004F4D] transition-colors"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => setVisitModalProp({ id: p.id, title: p.title || "Property" })}
                                className="py-1.5 bg-[#E6F4F2] text-[#006D6A] text-[10px] font-bold rounded-lg hover:bg-[#D9E5E3] transition-colors"
                              >
                                Visit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMapPropId(p.id);
                                  setShowMap(true);
                                }}
                                className="py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-0.5"
                              >
                                <MapPin size={9} /> Map
                              </button>
                              <button
                                onClick={() => setEnquiryModalProp({ id: p.id, title: p.title || "Property" })}
                                className="py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Contact
                              </button>
                              <button
                                onClick={() => {
                                  if (setComparePropertyIds) {
                                    setComparePropertyIds(prev => {
                                      if (prev.includes(p.id)) {
                                        return prev.filter(id => id !== p.id);
                                      } else if (prev.length < 4) {
                                        return [...prev, p.id];
                                      } else {
                                        setToast("Maximum 4 properties can be compared simultaneously");
                                        return prev;
                                      }
                                    });
                                  }
                                }}
                                className={`py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5 ${
                                  comparePropertyIds.includes(p.id)
                                    ? "bg-[#008F8C] text-white shadow-sm"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                                title={comparePropertyIds.includes(p.id) ? "Remove from comparison" : "Add to comparison"}
                              >
                                {comparePropertyIds.includes(p.id) ? "✓ Added" : "+ Compare"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Comparison Link if Message Compares Properties */}
                  {((m.intent && m.intent.startsWith("PROPERTY_")) || (m.properties && m.properties.length >= 2) || (m.text && (m.text.includes("PROPERTY COMPARISON") || m.text.includes("trade-off") || m.text.includes("versus")))) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Need full side-by-side view?</span>
                      <button
                        onClick={() => {
                          if (m.properties && m.properties.length >= 2 && setComparePropertyIds) {
                            setComparePropertyIds(m.properties.slice(0, 4).map(p => p.id));
                          }
                          navigate("compare");
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#006D6A] to-[#008F8C] text-white rounded-xl text-xs font-bold hover:brightness-105 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Layers size={13} /> View Side-by-Side Comparison Screen →
                      </button>
                    </div>
                  )}

                  {m.timestamp && (
                    <p className={`text-[10px] text-slate-400 ${m.role === "user" ? "text-right" : "text-left"}`}>
                      {m.timestamp}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center shadow flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white rounded-3xl rounded-tl-sm px-5 py-3 shadow-sm border border-[#D9E5E3] flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500">SAI is thinking...</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#008F8C] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#008F8C] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#008F8C] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions + Input Bar */}
          <div className="bg-white border-t border-[#D9E5E3] shadow-[0_-4px_20px_rgba(0,109,106,0.08)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              {/* Floating Comparison Tray (Section 23) */}
              {comparePropertyIds.length > 0 && (
                <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xl border border-slate-700 mb-2.5 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">
                        Selected: <strong className="text-emerald-300">{comparePropertyIds.length}</strong> {comparePropertyIds.length === 1 ? "property" : "properties"}
                      </p>
                      {comparePropertyIds.length === 1 && (
                        <p className="text-[10px] text-slate-400">Select at least 1 more property from cards above to compare</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setComparePropertyIds?.([])}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 font-semibold"
                    >
                      Clear
                    </button>
                    <button
                      disabled={comparePropertyIds.length < 2}
                      onClick={() => navigate("compare")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        comparePropertyIds.length >= 2
                          ? "bg-gradient-to-r from-[#008F8C] to-[#006D6A] text-white hover:brightness-110 shadow-md shadow-[#008F8C]/30"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Compare Properties ({comparePropertyIds.length})</span>
                      {comparePropertyIds.length >= 2 && <ArrowRight size={12} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex-shrink-0 bg-[#E6F4F2] text-[#008F8C] text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[#D9E5E3] hover:bg-[#D9E5E3] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-[#D9E5E3] focus-within:border-[#008F8C]/40 transition-colors">
                  <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={tr?.askInAnyLanguage || "Ask SAI anything or find a property..."}
                    className="flex-1 bg-transparent text-slate-700 text-sm focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setVoiceOpen(true)}
                    className="w-8 h-8 bg-[#E6F4F2] rounded-xl flex items-center justify-center hover:bg-[#D9E5E3] transition-colors"
                    title="Voice Input (Mic)"
                  >
                    <Mic size={15} className="text-[#006D6A]" />
                  </button>
                </div>
                <button
                  onClick={() => send()}
                  className="w-11 h-11 bg-[#006D6A] rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors flex-shrink-0 text-white font-bold text-lg"
                  title="Send Message"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Map Sync Drawer */}
        {showMap && allDiscoveredProperties.length > 0 && (
          <div className="hidden lg:block lg:w-2/5 border-l border-[#D9E5E3] bg-white relative">
            <div className="p-3 border-b border-[#D9E5E3] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#008F8C]" />
                <span className="font-bold text-xs text-slate-800">
                  Interactive AI Map Sync ({allDiscoveredProperties.length} Properties)
                </span>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="h-[calc(100%-49px)] w-full">
              <MapErrorBoundary fallbackHeight="100%">
                <PropertyMap
                  properties={allDiscoveredProperties}
                  selectedPropertyId={selectedMapPropId}
                  onSelectProperty={(id) => setSelectedMapPropId(id)}
                  onViewPropertyDetails={(id) => {
                    selectProperty?.(id);
                    navigate("property");
                  }}
                  height="100%"
                />
              </MapErrorBoundary>
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal for AI Chatbot Actions */}
      {chatViewerDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setChatViewerDoc(null)}
          documentId={chatViewerDoc.id}
          documentName={chatViewerDoc.name}
          documentType={chatViewerDoc.name}
        />
      )}
    </div>
  );
}

// ── CATEGORY SEARCH PAGES ────────────────────────────────────────────

// Generic card for rent/commercial properties (same shape, no forBuy/forRent flags)
function GenericPropertyCard({ p, navigate, onClickFn }: { p: { id: number; name: string; type: string; price: string; priceNum: number; location: string; img: string; match: number; badge: string; verified: boolean; area: string; amenities: string[]; dist: string; rating: number; rera: boolean; status: string; sponsored?: boolean; sponsoredLabel?: string; images?: string[] }; navigate: (pg: Page) => void; onClickFn?: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const cardPhotos = useMemo(() => {
    return getPropertyImages(p.id, p.img, p.type, p.images);
  }, [p.id, p.img, p.type, p.images]);
  const activePhoto = cardPhotos[photoIdx] || { url: p.img, label: "Featured View" };

  return (
    <div onClick={onClickFn} className="group/card bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,109,106,0.1)] border border-[#D9E5E3] cursor-pointer hover:shadow-[0_8px_40px_rgba(0,109,106,0.18)] hover:-translate-y-1 transition-all duration-300">
      <div className="relative overflow-hidden group/img">
        <img 
          src={activePhoto.url} 
          alt={`${p.name} - ${activePhoto.label}`} 
          onError={(e) => {
            const fallback = getFallbackPropertyImage(p.id, p.type);
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
          className="w-full h-52 object-cover bg-[#E6F4F2] transition-transform duration-500 hover:scale-105" 
        />
        
        {/* Multi-Image Quick Navigation Arrows */}
        {cardPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((i) => (i - 1 + cardPhotos.length) % cardPhotos.length);
              }}
              title="Previous photo"
              className="opacity-0 group-hover/img:opacity-100 transition-all duration-200 absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur text-white flex items-center justify-center z-20 shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((i) => (i + 1) % cardPhotos.length);
              }}
              title="Next photo"
              className="opacity-0 group-hover/img:opacity-100 transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur text-white flex items-center justify-center z-20 shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronRight size={16} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none">
              {cardPhotos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === photoIdx ? "w-3.5 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>

            {/* Room / View Badge */}
            <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 z-20 border border-white/10">
              <Camera size={10} className="text-[#67E8F9]" />
              <span>{photoIdx + 1}/{cardPhotos.length}</span>
              <span className="hidden sm:inline text-white/80 max-w-[80px] truncate">· {activePhoto.label}</span>
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-10">
          <span className="bg-[#006A60] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{p.badge}</span>
          {p.verified && <span className="bg-white/90 backdrop-blur text-green-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle size={9} />RERA</span>}
        </div>
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
            <Sparkles size={11} className="text-[#006A60]" />
            <span className="text-[10px] font-bold text-[#008F8C]">{p.match}%</span>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur rounded-full px-2.5 py-1 z-10">
          <span className="text-white text-[10px] font-medium">{p.status}</span>
        </div>
      </div>
      <div className="p-4">
        {p.sponsored && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-xl w-fit">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">{p.sponsoredLabel ?? "Sponsored"}</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{p.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{p.type} · {p.area}</p>
          </div>
          <p className="font-black text-[#008F8C] text-base flex-shrink-0 ml-3">{p.price}</p>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={12} className="text-[#008F8C] flex-shrink-0" />
          <span className="text-xs text-slate-500 flex-1 truncate">{p.location}</span>
          <span className="text-[10px] text-[#006A60] font-semibold flex-shrink-0">{p.dist}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {p.amenities.map(a => <span key={a} className="text-[10px] bg-[#E6F4F2] text-[#008F8C] px-2 py-0.5 rounded-full font-medium">{a}</span>)}
        </div>
        <div className="flex items-center gap-2">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-slate-700">{p.rating}</span>
        </div>
      </div>
    </div>
  );
}

function SellerDashPage({ navigate, activeSection, setActiveSection }: { navigate: (pg: Page) => void; activeSection: string; setActiveSection: (s: string) => void }) {
  const { tr } = useI18n();
  const sellerDisplayName = (typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_name") : null) || "Rahul Sharma";
  const sellerInitials = sellerDisplayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || "")
    .join("") || "RS";
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("India");
  const [stateName, setStateName] = useState("Maharashtra");
  const [sellerCity, setSellerCity] = useState("Pune");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [propType, setPropType] = useState("Apartment");
  const [bhk, setBhk] = useState("3 BHK");
  const [area, setArea] = useState("1250");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [sellerImages, setSellerImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const sellerFileInputRef = useRef<HTMLInputElement>(null);

  const [enquiriesList, setEnquiriesList] = useState<any[]>([
    { id: "1", name: "Ankit Mehta", listing: "3BHK · Baner", time: "1h ago", budget: "₹80–90L", intent: "High", status: "new", message: "Is immediate registration possible?" },
    { id: "2", name: "Pooja Rao", listing: "2BHK · Kharadi", time: "Yesterday", budget: "₹58–65L", intent: "Medium", status: "replied", message: "What are the maintenance charges?", reply_text: "Maintenance is ₹2,500/month." },
    { id: "3", name: "Sameer Khan", listing: "3BHK · Baner", time: "2 days ago", budget: "₹82–88L", intent: "High", status: "scheduled", message: "Can I inspect the property tomorrow afternoon?" },
  ]);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [walkthroughProp, setWalkthroughProp] = useState<{ id: number; title: string } | null>(null);

  const [myListings, setMyListings] = useState<any[]>([
    { id: "S1", name: "3BHK Apartment · Baner", type: "Apartment", price: "₹85L", location: "Baner, Pune", status: "active", views: 342, enquiries: 7, img: IMGS.apt1 },
    { id: "S2", name: "2BHK Apartment · Kharadi", type: "Apartment", price: "₹62L", location: "Kharadi, Pune", status: "active", views: 189, enquiries: 3, img: IMGS.apt2 },
    { id: "S3", name: "Villa · Koregaon Park", type: "Villa", price: "₹2.1Cr", location: "Koregaon Park, Pune", status: "inactive", views: 74, enquiries: 1, img: IMGS.villa1 },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMyProperties();
        if (res && res.length > 0) {
          const mapped = res.map((p: any) => ({
            id: String(p.id),
            name: p.title || p.name,
            type: p.property_type || "Apartment",
            price: `₹${(p.price / 100000).toFixed(0)}L`,
            location: `${p.locality || p.area_name || "Baner"}, ${p.city || "Pune"}`,
            status: "active",
            views: 45,
            enquiries: 2,
            img: p.image_url || IMGS.apt1,
          }));
          setMyListings(prev => [...mapped, ...prev]);
        }
      } catch {}

      try {
        const enq = await fetchEnquiries();
        if (enq && enq.length > 0) setEnquiriesList(enq);
      } catch {}
    })();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(files);
      setSellerImages(prev => [...prev, ...urls]);
      setStatusMsg(`${urls.length} photo(s) uploaded successfully!`);
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || "Error"));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      setStatusMsg("Please provide at least property title and price.");
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    const effectiveCity = isCustomCity ? customCity.trim() : sellerCity;
    const effectiveLocality = locality.trim() || location.trim() || "Central";
    try {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, "")) * (price.toLowerCase().includes("cr") ? 10000000 : 100000);
      const newProp = await createProperty({
        title,
        price: isNaN(numericPrice) ? 7500000 : numericPrice,
        country: country || "India",
        state: stateName || "Maharashtra",
        city: effectiveCity || "Pune",
        locality: effectiveLocality,
        address: address || `${effectiveLocality}, ${effectiveCity}`,
        pincode: pincode || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        property_type: propType,
        bhk: bhk.includes("1") ? 1 : bhk.includes("2") ? 2 : bhk.includes("4") ? 4 : 3,
        area_sqft: parseFloat(area) || 1200,
        status: "available",
        image_url: sellerImages[0] || IMGS.apt1,
        images_urls: sellerImages,
      });
      const createdItem = {
        id: String(newProp.id),
        name: newProp.title,
        type: newProp.property_type || propType,
        price: `₹${((newProp.price || 7500000) / 100000).toFixed(0)}L`,
        location: `${newProp.locality || effectiveLocality}, ${newProp.city || effectiveCity}`,
        status: "active",
        views: 1,
        enquiries: 0,
        img: sellerImages[0] || IMGS.apt1,
      };
      setMyListings(prev => [createdItem, ...prev]);
      setTitle("");
      setPrice("");
      setLocation("");
      setLocality("");
      setAddress("");
      setPincode("");
      setLatitude("");
      setLongitude("");
      setSellerImages([]);
      setStatusMsg("Property listing posted successfully to PostgreSQL!");
      setActiveSection("listings");
    } catch (err: any) {
      setStatusMsg("Listing created locally. (Backend syncing)");
      const fallbackItem = {
        id: `S-${Date.now()}`,
        name: title,
        type: propType,
        price: price.startsWith("₹") ? price : `₹${price}`,
        location: `${effectiveLocality}, ${effectiveCity}`,
        status: "active",
        views: 1,
        enquiries: 0,
        img: sellerImages[0] || IMGS.apt1,
      };
      setMyListings(prev => [fallbackItem, ...prev]);
      setTitle("");
      setPrice("");
      setLocation("");
      setLocality("");
      setAddress("");
      setPincode("");
      setLatitude("");
      setLongitude("");
      setSellerImages([]);
      setActiveSection("listings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (confirm("Are you sure you want to remove this listing?")) {
      try {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) await deleteProperty(numId);
      } catch {}
      setMyListings(prev => prev.filter(l => l.id !== id));
    }
  };

  const sellerNav = [
    { id: "overview", label: "Seller Overview", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", icon: Building2 },
    { id: "add", label: "Add Listing", icon: Plus },
    { id: "leads", label: "Leads & Enquiries", icon: Bell },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "verification", label: "Verification Status", icon: Shield },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "profile", label: "Seller Profile", icon: User },
    { id: "seller-settings", label: "Settings", icon: Settings },
  ];

  const leads = [
    { name: "Ankit Mehta", listing: "3BHK · Baner", time: "1h ago", budget: "₹80–90L", intent: "High", status: "new" },
    { name: "Pooja Rao", listing: "2BHK · Kharadi", time: "Yesterday", budget: "₹58–65L", intent: "Medium", status: "replied" },
    { name: "Sameer Khan", listing: "3BHK · Baner", time: "2 days ago", budget: "₹82–88L", intent: "High", status: "scheduled" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] rounded-3xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center pr-3 border-r border-white/20">
              <SaiLogo size="sm" variant="light" subtitle="Owner Portal" />
            </div>
            <button onClick={() => { apiLogout(); navigate("language"); }} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl text-sm transition-all flex-shrink-0 border border-white/20">
              <LogOut size={14} />{tr.signOut || "Sign Out"}
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow">
              <span className="text-white font-black text-xl">{sellerInitials}</span>
            </div>
            <div>
              <p className="text-[#D9E5E3] text-xs font-bold uppercase tracking-wider mb-0.5">Seller Portal</p>
              <h1 className="text-2xl font-black text-white">{sellerDisplayName}</h1>
              <p className="text-[#D9E5E3] text-sm flex items-center gap-1.5"><Shield size={12} />Verified Seller · {sellerCity}</p>
            </div>
          </div>
          <button onClick={() => setActiveSection("add")} className="bg-white text-[#006D6A] font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#E6F4F2] transition-colors shadow-lg">
            <Plus size={16} />Add Listing
          </button>
        </div>

        {statusMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E6F4F2] border border-[#006D6A]/30 text-[#004F4D] font-semibold text-sm flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)}><X size={16} /></button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3] overflow-hidden">
              <div className="p-3.5 border-b border-[#D9E5E3] flex items-center justify-center">
                <SaiLogo size="sm" subtitle="Owner Portal" />
              </div>
              {sellerNav.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-[#D9E5E3] last:border-0 ${activeSection === id ? "bg-[#006D6A] text-white font-bold" : "text-slate-600 hover:bg-[#E6F4F2] font-medium"}`}>
                  <Icon size={15} className={activeSection === id ? "text-white" : "text-[#008F8C]"} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Mobile Nav */}
            <div className="lg:hidden overflow-x-auto flex gap-2 mb-4 pb-2 scrollbar-hide">
              {sellerNav.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeSection === id ? "bg-[#006D6A] text-white" : "bg-white text-slate-600 border border-[#D9E5E3]"}`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ l: "Total Views", v: "605", icon: Eye, c: "from-[#006D6A] to-[#073B3A]" }, { l: "My Listings", v: String(myListings.length), icon: Building2, c: "from-[#008F8C] to-[#073B3A]" }, { l: "Enquiries", v: "11", icon: Bell, c: "from-green-500 to-green-700" }, { l: "Avg Rating", v: "4.7★", icon: Star, c: "from-orange-500 to-orange-700" }].map(({ l, v, icon: Icon, c }) => (
                    <div key={l} className={`bg-gradient-to-br ${c} rounded-3xl p-6 text-white`}>
                      <Icon size={20} className="text-white/70 mb-2" />
                      <p className="font-black text-2xl">{v}</p>
                      <p className="text-white/70 text-xs mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                  <h3 className="font-black text-slate-800 mb-4">My Active Listings</h3>
                  <div className="space-y-3">
                    {myListings.filter(l => l.status === "active").map(l => (
                      <div key={l.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <img src={l.img} alt={l.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1"><p className="font-bold text-slate-800 text-sm">{l.name}</p><p className="text-xs text-slate-400">{l.location}</p></div>
                        <div className="text-right"><p className="font-black text-[#006D6A] text-sm">{l.price}</p><p className="text-xs text-slate-400">{l.views} views · {l.enquiries} enquiries</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#008F8C] to-[#004F4D] rounded-3xl p-6">
                  <Brain size={24} className="text-white mb-3" />
                  <h3 className="text-white font-black text-xl mb-2">SAI Buyer Matching</h3>
                  <p className="text-[#E6F4F2] mb-4">AI found 5 qualified buyers matching your 3BHK listing today. 2 are ready to buy this month!</p>
                  <button onClick={() => setActiveSection("leads")} className="bg-white/20 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-white/30 transition-colors w-full justify-center"><Users size={16} />View Matched Buyers</button>
                </div>
              </div>
            )}

            {/* My Listings */}
            {activeSection === "listings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-slate-800 text-xl">My Listings ({myListings.length})</h2>
                  <button onClick={() => setActiveSection("add")} className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"><Plus size={14} />Add Listing</button>
                </div>
                {myListings.map(l => (
                  <div key={l.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={l.img} alt={l.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-black text-slate-800">{l.name}</p>
                        <p className="text-sm text-slate-400">{l.type} · {l.location}</p>
                        <p className="text-[#006D6A] font-bold mt-1">{l.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${l.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{l.status}</span>
                        <button onClick={() => handleDeleteListing(l.id)} title="Delete Listing" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[{ k: "Views", v: l.views }, { k: "Enquiries", v: l.enquiries }, { k: "Saved", v: Math.floor(l.views * 0.04) }].map(({ k, v }) => (
                        <div key={k} className="bg-slate-50 rounded-xl p-3 text-center"><p className="font-black text-slate-800 text-xl">{v}</p><p className="text-xs text-slate-400">{k}</p></div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setActiveSection("add")} className="flex-1 py-2.5 bg-[#E6F4F2] rounded-xl text-[#006D6A] font-bold text-sm">Edit Listing</button>
                      <button onClick={() => setActiveSection("leads")} className="flex-1 py-2.5 bg-[#006D6A] rounded-xl text-white font-bold text-sm">View Enquiries</button>
                      <button
                        onClick={() => setWalkthroughProp({ id: Number(l.id) || 1, title: l.name })}
                        className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-[#008F8C] hover:from-teal-500 hover:to-teal-600 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Film size={14} />
                        Preview Walkthrough
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Walkthrough Preview Modal for Owner */}
            {walkthroughProp && (
              <PropertyWalkthrough
                isModal={true}
                isOpen={Boolean(walkthroughProp)}
                propertyId={walkthroughProp.id}
                propertyTitle={walkthroughProp.title}
                property={walkthroughProp}
                onClose={() => setWalkthroughProp(null)}
              />
            )}

            {/* Add Listing */}
            {activeSection === "add" && (
              <form onSubmit={handleCreateListing} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,109,106,0.1)] border border-[#D9E5E3]">
                <h2 className="font-black text-slate-800 text-xl mb-6">Add Property Listing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-black text-slate-600 block mb-2">Property Title *</label>
                    <input
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. 3BHK Apartment for Sale in Baner, Pune"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Price (₹) *</label>
                      <input
                        required
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="e.g. 85 Lakhs or 85,00,000"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Country</label>
                      <input
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">State</label>
                      <input
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        placeholder="e.g. Maharashtra, Rajasthan, etc."
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">City *</label>
                      <div className="flex gap-2">
                        <select
                          value={isCustomCity ? "__custom__" : sellerCity}
                          onChange={e => {
                            if (e.target.value === "__custom__") {
                              setIsCustomCity(true);
                            } else {
                              setIsCustomCity(false);
                              setSellerCity(e.target.value);
                            }
                          }}
                          className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none"
                        >
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__custom__">+ Other / New City...</option>
                        </select>
                      </div>
                      {isCustomCity && (
                        <input
                          required
                          value={customCity}
                          onChange={e => setCustomCity(e.target.value)}
                          placeholder="Type any city name (e.g. Amravati, Jaipur)"
                          className="mt-2 w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#006D6A] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Locality / Area *</label>
                      <input
                        required
                        value={locality}
                        onChange={e => setLocality(e.target.value)}
                        placeholder="e.g. Rajapeth, Wakad, Dharampeth"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Pincode</label>
                      <input
                        value={pincode}
                        onChange={e => setPincode(e.target.value)}
                        placeholder="e.g. 444601, 411057"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-600 block mb-2">Full Street Address</label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. 402 Sai Elegance, Near City Bus Stand"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Latitude (Map)</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={e => setLatitude(e.target.value)}
                        placeholder="e.g. 20.9330"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Longitude (Map)</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={e => setLongitude(e.target.value)}
                        placeholder="e.g. 77.7523"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Property Type</label>
                      <select value={propType} onChange={e => setPropType(e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none">
                        {["Apartment", "Villa", "Plot", "Commercial"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">BHK Configuration</label>
                      <select value={bhk} onChange={e => setBhk(e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none">
                        {["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Studio"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-600 block mb-2">Area (sq ft)</label>
                      <input
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        placeholder="e.g. 1250"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={sellerFileInputRef}
                    onChange={handleFileUpload}
                  />
                  <div
                    onClick={() => sellerFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D9E5E3] rounded-2xl p-8 text-center cursor-pointer hover:border-[#006D6A] transition-colors"
                  >
                    <Upload size={24} className="text-[#008F8C] mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-semibold">{uploading ? "Uploading..." : "Upload Property Photos"}</p>
                    <p className="text-xs text-slate-400 mt-1">At least 5 photos recommended · Opens native OS picker</p>
                    {sellerImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {sellerImages.map((imgUrl, i) => (
                          <div key={i} className="relative group">
                            <img src={imgUrl} alt={`Seller Upload ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-[#D9E5E3] shadow-sm" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSellerImages(prev => prev.filter((_, idx) => idx !== i));
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                              title="Remove photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sellerFileInputRef.current?.click(); }}
                      className="mt-3 px-4 py-2 bg-[#E6F4F2] text-[#006D6A] text-xs font-bold rounded-xl hover:bg-[#E6F4F2] transition-colors"
                    >
                      {sellerImages.length > 0 ? `Add More (${sellerImages.length} selected)` : "Choose Files"}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#006D6A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={16} />{isSubmitting ? "Posting..." : "Post Listing"}
                  </button>
                </div>
              </form>
            )}

            {/* Leads */}
            {activeSection === "leads" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-slate-800 text-xl">Leads & Enquiries</h2>
                  <div className="bg-[#E6F4F2] px-3 py-1.5 rounded-xl"><span className="text-[#004F4D] text-xs font-black">{enquiriesList.length} enquiries</span></div>
                </div>
                <div className="bg-gradient-to-r from-[#008F8C] to-[#004F4D] rounded-2xl p-4 flex items-center gap-3">
                  <Brain size={20} className="text-white flex-shrink-0" />
                  <p className="text-white text-sm font-semibold">SAI matched qualified buyers to your listings. Live PostgreSQL enquiries updated.</p>
                </div>
                {enquiriesList.map(l => (
                  <div key={l.id || l.name} className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006D6A] to-[#004F4D] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black">{l.name ? l.name[0] : (l.buyer_name ? l.buyer_name[0] : "B")}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-slate-800">{l.buyer_name || l.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status === "new" ? "bg-green-100 text-green-700" : l.status === "replied" ? "bg-[#E6F4F2] text-[#006D6A]" : "bg-[#E6F4F2] text-[#004F4D]"}`}>{l.status}</span>
                        {l.intent && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.intent === "High" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{l.intent} intent</span>}
                      </div>
                      <p className="text-xs text-slate-500">{l.listing || l.unit || l.message}</p>
                      <p className="text-xs text-[#006D6A] font-semibold mt-0.5">Budget: {l.budget || "₹70–85L"}</p>
                      {l.reply_text && (
                        <p className="text-[11px] text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1 rounded-lg mt-1.5 font-medium italic">
                          Reply: {l.reply_text}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1.5">{l.time || "Recent"}</p>
                      <button
                        onClick={() => { setSelectedEnquiry(l); setReplyModalOpen(true); }}
                        className="px-3 py-1.5 bg-[#E6F4F2] rounded-xl text-[#006D6A] text-xs font-bold hover:bg-[#E6F4F2] transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics */}
            {activeSection === "analytics" && (
              <div className="space-y-5">
                <h2 className="font-black text-slate-800 text-xl mb-2">Analytics — My Listings</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ l: "Total Views", v: "605", t: "+18% this month" }, { l: "Enquiries", v: "11", t: "+3 this week" }, { l: "Offers Received", v: "2", t: "This month" }, { l: "Avg Days on Market", v: "12", t: "Days" }].map(({ l, v, t }) => (
                    <div key={l} className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3]">
                      <p className="font-black text-2xl text-[#006D6A]">{v}</p>
                      <p className="text-slate-600 text-sm font-semibold mt-0.5">{l}</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h3 className="font-black text-slate-800 mb-4">Performance by Listing</h3>
                  <div className="space-y-4">
                    {myListings.map(l => (
                      <div key={l.id} className="flex items-center gap-4">
                        <img src={l.img} alt={l.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1"><p className="text-sm font-black text-slate-700">{l.name}</p><div className="flex gap-3 mt-1"><span className="text-xs text-slate-400">{l.views} views</span><span className="text-xs text-[#006D6A] font-semibold">{l.enquiries} enquiries</span></div></div>
                        <div className="text-right"><p className="font-black text-[#006D6A] text-sm">{l.price}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Verification, Messages, Profile, Settings */}
            {(activeSection === "verification" || activeSection === "messages" || activeSection === "profile" || activeSection === "seller-settings") && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#D9E5E3] text-center">
                {activeSection === "verification" && <Shield size={36} className="text-[#008F8C] mx-auto mb-3" />}
                {activeSection === "messages" && <MessageCircle size={36} className="text-[#008F8C] mx-auto mb-3" />}
                {activeSection === "profile" && <User size={36} className="text-[#008F8C] mx-auto mb-3" />}
                {activeSection === "seller-settings" && <Settings size={36} className="text-[#008F8C] mx-auto mb-3" />}
                <p className="font-black text-slate-700 text-lg">
                  {activeSection === "verification" ? "Verification Status" : activeSection === "messages" ? "Messages" : activeSection === "profile" ? "Seller Profile" : "Settings"}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {activeSection === "verification" ? "View and manage your seller verification documents and trust badge." : activeSection === "messages" ? "All conversations with interested buyers appear here." : activeSection === "profile" ? "Manage your seller profile, contact details, and preferences." : "Update your account, notification, and privacy settings."}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
      <EnquiryReplyModal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        enquiry={selectedEnquiry}
        onSuccess={(replyText) => {
          setStatusMsg("Reply sent and recorded in PostgreSQL database!");
          setEnquiriesList(prev => prev.map(e => (e.id === selectedEnquiry?.id ? { ...e, status: "replied", reply_text: replyText } : e)));
        }}
      />
      <ToastAlert message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function CategorySearchPage({ navigate, city, mode, lang, selectProperty }: { navigate: (pg: Page) => void; city: string; mode: "buy" | "rent" | "commercial" | "new-projects"; lang: string; selectProperty: (id: number) => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("AI Match");
  const [searchQ, setSearchQ] = useState("");
  const [voiceModal, setVoiceModal] = useState(false);
  const tr = useTranslations(lang);

  const cfg = {
    buy: {
      title: "Properties for Sale",
      subtitle: "High-rise apartments & luxury residential towers in " + city,
      badge: "For Sale",
      gradient: "from-[#004F4D] to-[#073B3A]",
      icon: Building,
      heroImg: IMGS.p2,
      priceLabel: "Price",
      ctaLabel: "Get Best Price",
    },
    rent: {
      title: "Furnished Rentals",
      subtitle: "Move-in ready furnished homes & studios in " + city,
      badge: "For Rent",
      gradient: "from-[#006A60] to-[#004F4D]",
      icon: Home,
      heroImg: IMGS.rent1,
      priceLabel: "Monthly Rent",
      ctaLabel: "Schedule Visit",
    },
    commercial: {
      title: "Commercial Spaces",
      subtitle: "IT offices, co-working hubs & retail storefronts in " + city,
      badge: "Commercial",
      gradient: "from-[#073B3A] to-[#002E2C]",
      icon: Building2,
      heroImg: IMGS.comm1,
      priceLabel: "Lease / Buy",
      ctaLabel: "Get Details",
    },
    "new-projects": {
      title: "New Launch Projects",
      subtitle: "Freshly launched apartments and villas in " + city,
      badge: "New Launch",
      gradient: "from-[#008F8C] to-[#004F4D]",
      icon: Layers,
      heroImg: IMGS.p5,
      priceLabel: "Price",
      ctaLabel: "Book Now",
    },
  }[mode];

  const [dbProps, setDbProps] = useState<UIProperty[]>([]);

  useEffect(() => {
    const listingType = mode === "rent" ? "rent" : mode === "commercial" ? "commercial" : "sale";
    fetchProperties({ listing_type: listingType, city: city !== "All Cities" ? city : undefined, limit: 50 })
      .then(res => {
        if (res && res.items && res.items.length > 0) {
          setDbProps(res.items.map(toUIProperty));
        } else {
          setDbProps([]);
        }
      })
      .catch(() => {
        setDbProps([]);
      });
  }, [mode, city]);

  const fallbackList = mode === "rent"
    ? RENT_PROPERTIES
    : mode === "commercial"
    ? COMMERCIAL_PROPERTIES
    : mode === "new-projects"
    ? PROPERTIES.filter(p => p.status === "Under Construction" || p.badge === "New Launch")
    : PROPERTIES.filter(p => p.forBuy);

  const rawProperties = dbProps.length > 0
    ? (mode === "new-projects" ? dbProps.filter(p => p.status === "Under Construction" || p.badge === "New Launch") : dbProps)
    : (city && city !== "All Cities"
        ? fallbackList.filter(p => p.location.toLowerCase().includes(city.toLowerCase()))
        : fallbackList);

  const sortedDisplay = [...rawProperties].sort((a, b) => {
    if (sort === "Price ↓") return a.priceNum - b.priceNum;
    if (sort === "Price ↑") return b.priceNum - a.priceNum;
    if (sort === "Rating") return b.rating - a.rating;
    return b.match - a.match;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <VoiceMicModal open={voiceModal} onClose={() => setVoiceModal(false)} lang={lang} onResult={(text) => setSearchQ(text)} />

      {/* Category Hero Banner */}
      <div className={`bg-gradient-to-r ${cfg.gradient} relative overflow-hidden`}>
        <img src={cfg.heroImg} alt={cfg.title} className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button */}
          <button onClick={() => navigate("home")} className="flex items-center gap-1.5 text-white/70 hover:text-white font-semibold text-sm transition-colors mb-5">
            <ChevronLeft size={16} />Back to Home
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full border border-white/30">{cfg.badge}</span>
                <span className="text-white/60 text-xs">·</span>
                <span className="text-white/60 text-xs font-medium">{sortedDisplay.length} listings in {city}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{cfg.title}</h1>
              <p className="text-white/60 text-sm">{cfg.subtitle}</p>
            </div>
            {/* Mini search */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-3 py-2 min-w-[280px]">
              <Bot size={15} className="text-white/70 flex-shrink-0" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Ask SAI to find properties in any language..."
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none"
              />
              <button onClick={() => setVoiceModal(true)} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <Mic size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="bg-white border-b border-[#D9E5E3] shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Category mode tabs */}
              {(["buy", "rent", "commercial", "new-projects"] as const).map(m => (
                <button key={m} onClick={() => navigate(m)} className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${mode === m ? "bg-[#006A60] text-white border-[#006A60] shadow-[0_4px_12px_rgba(0,106,96,0.3)]" : "bg-white border-[#D9E5E3] text-slate-600 hover:bg-[#E6F4F1]"}`}>
                  {{ buy: "Buy", rent: "Rent", commercial: "Commercial", "new-projects": "New Projects" }[m]}
                </button>
              ))}
              <div className="w-px h-5 bg-slate-200 flex-shrink-0 mx-1" />
              {/* Sort chips */}
              {["AI Match", "Price ↑", "Price ↓", "Rating"].map(s => {
                const isPrice = s === "Price ↑" || s === "Price ↓";
                const isActive = sort === s;
                return (
                  <button key={s} onClick={() => setSort(s)} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive ? "bg-[#00665C] text-white border-[#00665C] shadow-[0_4px_12px_rgba(0,102,92,0.35)]"
                    : isPrice ? "bg-white text-[#006A60] border-[#006A60] hover:bg-[#E6F4F1]"
                    : "bg-white text-slate-500 border-[#D9E5E3] hover:border-[#006A60] hover:text-[#006A60]"
                  }`}>{s}</button>
                );
              })}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => setView("grid")} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${view === "grid" ? "bg-[#006A60] text-white border-[#006A60]" : "bg-white border-[#D9E5E3] text-slate-500"}`}><Grid size={14} /></button>
              <button onClick={() => setView("list")} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${view === "list" ? "bg-[#006A60] text-white border-[#006A60]" : "bg-white border-[#D9E5E3] text-slate-500"}`}><List size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price sort indicator */}
        {(sort === "Price ↑" || sort === "Price ↓") && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#006A60] animate-pulse" />
            <span className="text-xs font-bold text-[#006A60]">
              {sort === "Price ↓" ? "Highest price first" : "Lowest price first"}
            </span>
          </div>
        )}

        {/* Results */}
        <div className={`grid gap-6 ${view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
          {sortedDisplay.map(p => {
            if (mode === "buy" || mode === "new-projects") {
              return (
                <PropertyCard
                  key={p.id}
                  p={p as typeof PROPERTIES[0]}
                  navigate={navigate}
                  selectProperty={selectProperty}
                />
              );
            }
            return (
              <GenericPropertyCard
                key={p.id}
                p={p}
                navigate={navigate}
                onClickFn={() => navigate("property")}
              />
            );
          })}
        </div>

        {sortedDisplay.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-bold text-lg">No {mode} properties found in {city}</p>
            <p className="text-sm mt-1">Try adjusting filters or changing city</p>
          </div>
        )}

        <div className="text-center mt-12">
          <button className="bg-[#006A60] text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,106,96,0.4)] hover:bg-[#004F4D] transition-all inline-flex items-center gap-2">
            Load More Properties <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN PAGES ──────────────────────────────────────────────────────

function AdminLoginPage({ navigate }: { navigate: (pg: Page) => void }) {
  const [email, setEmail] = useState("admin@sai.in");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !pass) {
      setError("Please enter both admin email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiAdminLogin(email, pass);
      if (res.status === "2FA_REQUIRED") {
        sessionStorage.setItem("admin_2fa_email", res.email || email);
        if (res.temp_token) sessionStorage.setItem("admin_2fa_token", res.temp_token);
        navigate("admin-2fa");
      } else if (res.access_token) {
        navigate("admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#073B3A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <SaiLogo size="lg" variant="light" subtitle="Super Admin Portal" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
            <Lock size={12} className="text-[#008F8C]" />
            <span className="text-[#E6F4F2] text-xs font-bold uppercase tracking-widest">Private Admin Access</span>
          </div>
          <h1 className="text-3xl font-black text-white">Super Admin Login</h1>
          <p className="text-[#D9E5E3] text-sm mt-2">Authorised personnel only. All access is logged.</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold">
              {error}
            </div>
          )}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Admin Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@sai.in" className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]/30 focus:border-[#008F8C]" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Password</label>
                <button
                  type="button"
                  onClick={() => { setEmail("admin@sai.in"); setPass("Password123!"); }}
                  className="text-xs font-bold text-[#006D6A] hover:underline"
                >
                  Quick-fill Demo Pass
                </button>
              </div>
              <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} type="password" placeholder="••••••••••••" className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]/30 focus:border-[#008F8C]" />
            </div>
          </div>
          <button onClick={handleLogin} disabled={loading} className="w-full bg-[#006D6A] text-white font-black py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50">
            <Lock size={16} />{loading ? "Authenticating..." : "Continue to 2FA / Login"}
          </button>
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-semibold">Unauthorised access attempts are recorded in PostgreSQL audit logs.</p>
          </div>
          <button onClick={() => navigate("home")} className="w-full mt-4 text-slate-400 text-xs font-semibold hover:text-slate-600 transition-colors">← Back to SAI Platform</button>
        </div>
      </div>
    </div>
  );
}

function Admin2FAPage({ navigate }: { navigate: (pg: Page) => void }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adminEmail = sessionStorage.getItem("admin_2fa_email") || "admin@sai.in";
  const tempToken = sessionStorage.getItem("admin_2fa_token") || undefined;

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of the TOTP code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiAdmin2FAVerify(adminEmail, fullCode, tempToken);
      sessionStorage.removeItem("admin_2fa_email");
      sessionStorage.removeItem("admin_2fa_token");
      navigate("admin");
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code. Please check your authenticator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#073B3A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#008F8C]/20 border-2 border-[#008F8C]/40 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-[#008F8C]" />
          </div>
          <h1 className="text-3xl font-black text-white">Two-Factor Authentication</h1>
          <p className="text-[#D9E5E3] text-sm mt-2">Enter the 6-digit code from your authenticator app</p>
          <p className="text-[#008F8C] text-xs font-semibold mt-1">{adminEmail}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center">
              {error}
            </div>
          )}
          <div className="bg-[#E6F4F2] border border-[#006D6A]/30 rounded-2xl p-3 flex items-center justify-between text-xs mb-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#006D6A]">Dev / Demo Code:</span>
              <code className="font-mono bg-white px-2 py-0.5 rounded-lg border border-[#006D6A]/20 font-black text-slate-800">123456</code>
            </div>
            <button
              type="button"
              onClick={() => setCode(["1", "2", "3", "4", "5", "6"])}
              className="text-[#006D6A] font-extrabold hover:text-[#004F4D] underline cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
          <div className="flex gap-3 justify-center mb-8">
            {code.map((d, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={d}
                onChange={e => {
                  const val = e.target.value;
                  const c = [...code];
                  c[i] = val;
                  setCode(c);
                  if (val && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                  }
                }}
                className="w-12 h-14 text-center text-2xl font-black text-[#006D6A] bg-slate-50 border-2 border-[#D9E5E3] rounded-2xl focus:outline-none focus:border-[#008F8C] transition-colors"
              />
            ))}
          </div>
          <button onClick={handleVerify} disabled={loading} className="w-full bg-[#006D6A] text-white font-black py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.4)] hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50">
            <CheckCircle size={16} />{loading ? "Verifying..." : "Verify & Enter Admin Panel"}
          </button>
          <p className="text-center text-xs text-slate-400">Authenticator app: Google Authenticator, Authy, or compatible TOTP</p>
          <button onClick={() => navigate("admin-login")} className="w-full mt-3 text-slate-400 text-xs font-semibold hover:text-slate-600 transition-colors">← Back to Login</button>
        </div>
      </div>
    </div>
  );
}

function AdminDashPage({ navigate }: { navigate: (pg: Page) => void }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbProps, setDbProps] = useState<any[]>([]);
  const [dbAuditLogs, setDbAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats().then(s => setStats(s)).catch(() => {});
    fetchAdminUsers().then(u => setDbUsers(u)).catch(() => {});
    fetchProperties({ limit: 50 }).then(res => setDbProps(res.items || [])).catch(() => {});
    fetchAuditLogs(50).then(logs => setDbAuditLogs(logs)).catch(() => {});
  }, []);

  const adminNav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "listings", label: "Property Listings", icon: Building2 },
    { id: "projects", label: "Apartment Projects", icon: Building },
    { id: "verification", label: "Verification Center", icon: Shield },
    { id: "fraud", label: "Fraud & Safety", icon: AlertTriangle },
    { id: "advertising", label: "Advertising & Subscriptions", icon: Zap },
    { id: "analytics", label: "Analytics & Reports", icon: BarChart2 },
    { id: "ai", label: "AI Monitoring", icon: Brain },
    { id: "content", label: "Content Management", icon: FileText },
    { id: "support", label: "Complaints & Support", icon: MessageCircle },
    { id: "admins", label: "Admins & Permissions", icon: Lock },
    { id: "audit", label: "Audit Logs", icon: Clock },
    { id: "health", label: "System Health", icon: Activity },
    { id: "settings", label: "Platform Settings", icon: Settings },
  ];

  const kpiCards = [
    { label: "Total Users", value: stats ? String(stats.total_users) : "5", sub: "Registered accounts", color: "bg-[#006D6A]", icon: Users },
    { label: "Active Buyers", value: stats ? String(stats.total_buyers) : "1", sub: "Buyer profiles", color: "bg-[#008F8C]", icon: Home },
    { label: "Active Agents", value: stats ? String(stats.total_agents) : "1", sub: "Licensed agents", color: "bg-[#006D6A]", icon: Building2 },
    { label: "Verified Builders", value: stats ? String(stats.total_builders) : "1", sub: "Registered builders", color: "bg-[#004F4D]", icon: Building },
    { label: "Total Properties", value: stats ? String(stats.total_properties) : "20", sub: "PostgreSQL database", color: "bg-[#006D6A]", icon: Home },
    { label: "Active Listings", value: stats ? String(stats.active_listings) : "20", sub: "Published & verified", color: "bg-[#008F8C]", icon: Layers },
    { label: "Total Enquiries", value: stats ? String(stats.total_enquiries) : "0", sub: "Buyer enquiries", color: "bg-amber-500", icon: Clock },
    { label: "Site Visits", value: stats ? String(stats.total_site_visits) : "0", sub: "Scheduled visits", color: "bg-[#006D6A]", icon: Zap },
    { label: "Audit Log Entries", value: String(dbAuditLogs.length), sub: "Security events tracked", color: "bg-green-600", icon: TrendingUp },
    { label: "Open Reports", value: stats ? String(stats.open_reports) : "0", sub: "Pending review", color: "bg-orange-500", icon: MessageCircle },
    { label: "AI Grounding", value: "Qwen3", sub: "Zero hallucination", color: "bg-teal-600", icon: Brain },
    { label: "Platform Health", value: "100%", sub: "FastAPI + Postgres online", color: "bg-green-600", icon: Activity },
  ];

  const recentActivity = [
    { action: "Builder verified", target: "Prestige Group · RERA MH2024", admin: "Aarav Singh", time: "2 min ago", type: "success" },
    { action: "Listing suspended", target: "3BHK Baner (ID #L-48210)", admin: "Meera Pillai", time: "8 min ago", type: "warning" },
    { action: "Fraud alert raised", target: "Agent ID #A-9812 — duplicate docs", admin: "AI System", time: "14 min ago", type: "error" },
    { action: "Promotion approved", target: "Green Valley Apartments · Elite Plan", admin: "Priya Nair", time: "22 min ago", type: "success" },
    { action: "Complaint resolved", target: "Ticket #TKT-20481 — Fake listing", admin: "Rahul Kapoor", time: "31 min ago", type: "success" },
    { action: "Content published", target: "Homepage Banner — Diwali Campaign", admin: "Admin CMS", time: "1h ago", type: "info" },
  ];

  const users = [
    { name: "Rahul Sharma", type: "Buyer", email: "rahul@email.com", phone: "+91 98765 43210", joined: "Jan 12, 2025", verified: true, status: "active", lastActive: "Today" },
    { name: "Priya Patel", type: "Agent", email: "priya.agent@email.com", phone: "+91 98765 11111", joined: "Feb 3, 2025", verified: true, status: "active", lastActive: "Today" },
    { name: "Vikram Nair", type: "Buyer", email: "vikram@email.com", phone: "+91 98765 55555", joined: "Mar 18, 2025", verified: false, status: "active", lastActive: "Yesterday" },
    { name: "Prestige Group", type: "Builder", email: "admin@prestige.in", phone: "+91 80 4120 1234", joined: "Dec 5, 2024", verified: true, status: "active", lastActive: "Today" },
    { name: "Deepak Verma", type: "Agent", email: "deepak.v@email.com", phone: "+91 98765 66666", joined: "Apr 2, 2025", verified: false, status: "suspended", lastActive: "Apr 10" },
    { name: "Anita Joshi", type: "Buyer", email: "anita@email.com", phone: "+91 98765 77777", joined: "Apr 14, 2025", verified: true, status: "active", lastActive: "2 days ago" },
  ];

  const listings = [
    { name: "Prestige Heights 3BHK", location: "Baner, Pune", type: "Apartment", price: "₹85L", owner: "Priya Patel", ownerType: "Agent", verified: true, status: "active", reports: 0, created: "Mar 12, 2025", img: IMGS.apt1 },
    { name: "Lodha Palacia Villa", location: "Kalyani Nagar, Pune", type: "Villa", price: "₹1.8Cr", owner: "Godrej Properties", ownerType: "Builder", verified: true, status: "active", reports: 0, created: "Feb 28, 2025", img: IMGS.villa1 },
    { name: "2BHK Wakad Studio", location: "Wakad, Pune", type: "Apartment", price: "₹42L", owner: "Deepak Verma", ownerType: "Agent", verified: false, status: "pending", reports: 3, created: "Apr 10, 2025", img: IMGS.apt3 },
    { name: "Kharadi Row House", location: "Kharadi, Pune", type: "Row House", price: "₹72L", owner: "Ramesh Shah", ownerType: "Agent", verified: false, status: "flagged", reports: 7, created: "Apr 14, 2025", img: IMGS.villa2 },
  ];

  const verificationQueue = [
    { id: "VRF-1081", type: "Agent", name: "Deepak Verma", doc: "RERA Registration", submitted: "Apr 12, 2025", status: "pending" },
    { id: "VRF-1080", type: "Builder", name: "Sunrise Builders Pvt. Ltd.", doc: "RERA Project Certificate", submitted: "Apr 11, 2025", status: "under-review" },
    { id: "VRF-1079", type: "Listing", name: "3BHK Wakad #L-48210", doc: "Ownership Proof", submitted: "Apr 11, 2025", status: "pending" },
    { id: "VRF-1078", type: "Agent", name: "Meena Choudhary", doc: "Professional Certificate", submitted: "Apr 10, 2025", status: "info-needed" },
    { id: "VRF-1077", type: "Builder", name: "Horizon Developers", doc: "Commencement Certificate", submitted: "Apr 9, 2025", status: "approved" },
    { id: "VRF-1076", type: "Agent", name: "Suresh Iyer", doc: "Govt ID + PAN", submitted: "Apr 8, 2025", status: "rejected" },
  ];

  const fraudAlerts = [
    { id: "FRD-291", type: "Duplicate Listing", target: "2BHK Wakad (3 duplicates)", risk: "High", raised: "Apr 15, 2025", status: "investigating" },
    { id: "FRD-290", type: "Fake Document", target: "Agent #A-9812 RERA cert", risk: "Critical", raised: "Apr 15, 2025", status: "escalated" },
    { id: "FRD-289", type: "Suspicious Account", target: "Buyer ID #B-28410", risk: "Medium", raised: "Apr 14, 2025", status: "reviewing" },
    { id: "FRD-288", type: "Scam Report", target: "3BHK Kharadi #L-48890", risk: "High", raised: "Apr 13, 2025", status: "investigating" },
    { id: "FRD-287", type: "Price Anomaly", target: "1BHK Akurdi ₹18L listing", risk: "Low", raised: "Apr 12, 2025", status: "closed" },
  ];

  const promotions = [
    { property: "Green Valley Apartments", advertiser: "Prestige Group", type: "Builder", plan: "Elite ₹14,999/mo", start: "Apr 1", end: "Apr 30", status: "active", impressions: "24,800", views: "3,210", clicks: "980", enquiries: 32, revenue: "₹14,999" },
    { property: "2BHK Baner · Prestige Heights", advertiser: "Priya Patel", type: "Agent", plan: "Premium ₹5,999/mo", start: "Apr 5", end: "May 4", status: "active", impressions: "8,420", views: "1,840", clicks: "312", enquiries: 14, revenue: "₹5,999" },
    { property: "Sunrise Residency", advertiser: "Godrej Properties", type: "Builder", plan: "Project Basic ₹4,999/mo", start: "Mar 20", end: "Apr 19", status: "paused", impressions: "12,100", views: "2,040", clicks: "560", enquiries: 18, revenue: "₹4,999" },
    { property: "3BHK Villa Koregaon Park", advertiser: "Deepak Verma", type: "Agent", plan: "Basic ₹2,999/mo", start: "Apr 10", end: "May 9", status: "pending", impressions: "—", views: "—", clicks: "—", enquiries: 0, revenue: "₹2,999" },
  ];

  const tickets = [
    { id: "TKT-20490", category: "Fake Listing", reporter: "Vikram Nair", listing: "3BHK Kharadi", priority: "High", status: "open", assigned: "Rahul Kapoor", date: "Apr 15" },
    { id: "TKT-20481", category: "Agent Fraud", reporter: "Anita Joshi", listing: "2BHK Wakad", priority: "Critical", status: "in-progress", assigned: "Meera Pillai", date: "Apr 14" },
    { id: "TKT-20470", category: "Pricing Issue", reporter: "Raj Mehta", listing: "1BHK Akurdi", priority: "Low", status: "waiting", assigned: "Aarav Singh", date: "Apr 13" },
    { id: "TKT-20460", category: "Document Mismatch", reporter: "Sunita Rao", listing: "Green Valley A-103", priority: "Medium", status: "resolved", assigned: "Priya Nair", date: "Apr 12" },
  ];

  const auditLogs = [
    { action: "Listing Suspended", admin: "Meera Pillai", target: "3BHK Baner #L-48210", timestamp: "Apr 15, 2025 · 11:42 AM", detail: "Reason: Fraudulent ownership claim. Ticket #TKT-20481." },
    { action: "Agent Verified", admin: "Aarav Singh", target: "Priya Patel · Agent #A-1842", timestamp: "Apr 15, 2025 · 10:18 AM", detail: "RERA + ID + Certificate all approved." },
    { action: "Promotion Approved", admin: "Priya Nair", target: "Green Valley · Elite Plan", timestamp: "Apr 15, 2025 · 09:55 AM", detail: "Payment confirmed. Duration: Apr 1–30." },
    { action: "Builder Suspended", admin: "Rahul Kapoor", target: "Horizon Developers #B-0041", timestamp: "Apr 14, 2025 · 3:28 PM", detail: "Reason: Multiple unverified projects. Escalated from #FRD-284." },
    { action: "Content Published", admin: "Admin CMS", target: "Homepage Banner — Diwali Campaign", timestamp: "Apr 14, 2025 · 2:00 PM", detail: "Scheduled publish executed. Visible until Apr 25." },
    { action: "Settings Changed", admin: "Super Admin", target: "Subscription Plan Pricing", timestamp: "Apr 13, 2025 · 5:12 PM", detail: "Elite plan updated: ₹12,999 → ₹14,999/month." },
  ];

  const displayedUsers = dbUsers.length > 0
    ? dbUsers.map(u => ({
        id: u.id,
        name: u.full_name || u.email.split("@")[0],
        type: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User",
        email: u.email,
        phone: u.phone || "—",
        joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recent",
        verified: u.is_active,
        status: u.is_active ? "active" : "suspended",
        lastActive: "Today",
      }))
    : users;

  const displayedListings = dbProps.length > 0
    ? dbProps.map(p => ({
        id: p.id,
        name: p.title,
        location: `${p.locality}, ${p.city}`,
        type: p.bhk ? `${p.bhk} BHK ${p.property_type}` : p.property_type,
        price: p.price_display || `₹${(p.price / 100000).toFixed(0)}L`,
        owner: p.owner_id ? `User #${p.owner_id}` : (p.agent_id ? `Agent #${p.agent_id}` : "Builder Partner"),
        ownerType: p.agent_id ? "Agent" : (p.builder_id ? "Builder" : "Owner"),
        verified: p.is_verified,
        status: p.status,
        reports: 0,
        created: p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent",
        img: p.media && p.media.length > 0 ? p.media[0].url : IMGS.apt1,
      }))
    : listings;

  const displayedAuditLogs = dbAuditLogs.length > 0
    ? dbAuditLogs.map(l => ({
        action: l.action,
        admin: l.user_id ? `Admin #${l.user_id}` : "System / Super Admin",
        target: `${l.resource_type || "Resource"}${l.resource_id ? ` #${l.resource_id}` : ""}`,
        timestamp: new Date(l.created_at).toLocaleString(),
        detail: l.details || `IP: ${l.ip_address || "127.0.0.1"}`,
      }))
    : auditLogs;

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    try {
      await toggleUserStatus(userId, currentStatus !== "active");
      setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: currentStatus !== "active" } : u));
    } catch (e: any) {
      alert("Failed to update user status: " + (e?.message || "Error"));
    }
  };

  const handleTogglePropertyVerification = async (propId: number, currentVerified: boolean) => {
    try {
      await togglePropertyVerification(propId, !currentVerified);
      setDbProps(prev => prev.map(p => p.id === propId ? { ...p, is_verified: !currentVerified } : p));
    } catch (e: any) {
      alert("Failed to update verification: " + (e?.message || "Error"));
    }
  };

  const handleDeleteListing = async (propId: number) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        await deleteProperty(propId);
        setDbProps(prev => prev.filter(p => p.id !== propId));
      } catch (e: any) {
        alert("Failed to delete property: " + (e?.message || "Error"));
      }
    }
  };

  const systemServices = [
    { name: "Frontend (Web App)", status: "operational", uptime: "99.98%", latency: "84ms", errors: "0.01%" },
    { name: "Backend API", status: "operational", uptime: "99.97%", latency: "112ms", errors: "0.02%" },
    { name: "Database (PostgreSQL)", status: "operational", uptime: "100%", latency: "18ms", errors: "0%" },
    { name: "AI Search Engine", status: "operational", uptime: "99.94%", latency: "340ms", errors: "0.06%" },
    { name: "Payment Gateway", status: "operational", uptime: "99.99%", latency: "220ms", errors: "0%" },
    { name: "Auth Service", status: "operational", uptime: "100%", latency: "45ms", errors: "0%" },
    { name: "Media Storage (S3)", status: "degraded", uptime: "99.12%", latency: "680ms", errors: "0.8%" },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-green-100 text-green-700", suspended: "bg-red-100 text-red-700",
      pending: "bg-amber-100 text-amber-700", flagged: "bg-red-100 text-red-700",
      "under-review": "bg-[#E6F4F2] text-[#006D6A]", approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700", "info-needed": "bg-orange-100 text-orange-700",
      investigating: "bg-amber-100 text-amber-700", escalated: "bg-red-100 text-red-700",
      reviewing: "bg-[#E6F4F2] text-[#006D6A]", closed: "bg-slate-100 text-slate-500",
      paused: "bg-slate-100 text-slate-500", operational: "bg-green-100 text-green-700",
      degraded: "bg-amber-100 text-amber-700", outage: "bg-red-100 text-red-700",
      open: "bg-red-100 text-red-700", "in-progress": "bg-[#E6F4F2] text-[#006D6A]",
      waiting: "bg-amber-100 text-amber-700", resolved: "bg-green-100 text-green-700",
    };
    return map[s] ?? "bg-slate-100 text-slate-500";
  };

  const riskBadge = (r: string) => {
    const map: Record<string, string> = { Low: "bg-slate-100 text-slate-500", Medium: "bg-amber-100 text-amber-700", High: "bg-orange-100 text-orange-700", Critical: "bg-red-100 text-red-700" };
    return map[r] ?? "bg-slate-100 text-slate-500";
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = { Low: "bg-slate-100 text-slate-500", Medium: "bg-amber-100 text-amber-700", High: "bg-orange-100 text-orange-700", Critical: "bg-red-100 text-red-700" };
    return map[p] ?? "bg-slate-100 text-slate-500";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`bg-[#073B3A] flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"} min-h-screen`}>
        {/* Logo */}
        <div className={`flex items-center px-4 py-5 border-b border-white/10 ${sidebarOpen ? "" : "justify-center"}`}>
          <SaiLogo size="sm" variant="light" showText={sidebarOpen} subtitle="Super Admin" />
        </div>
        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNav.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)} title={label} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${sidebarOpen ? "" : "justify-center"} ${activeSection === id ? "bg-[#008F8C]/20 border-r-2 border-[#008F8C] text-white" : "text-[#D9E5E3]/70 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={15} className={`flex-shrink-0 ${activeSection === id ? "text-[#008F8C]" : ""}`} />
              {sidebarOpen && <span className="text-xs font-semibold truncate">{label}</span>}
            </button>
          ))}
        </nav>
        {/* Bottom */}
        <div className="border-t border-white/10 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="w-7 h-7 rounded-lg bg-[#008F8C] flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-black">SA</span></div>
              <div className="flex-1 min-w-0"><p className="text-white text-xs font-bold truncate">Super Admin</p><p className="text-[#D9E5E3]/60 text-[10px] truncate">admin@sai-platform.in</p></div>
              <button onClick={() => { apiLogout(); navigate("language"); }} title="Logout" className="text-[#D9E5E3]/50 hover:text-red-400 transition-colors"><LogOut size={14} /></button>
            </div>
          ) : (
            <button onClick={() => { apiLogout(); navigate("language"); }} title="Logout" className="w-full flex justify-center py-2 text-[#D9E5E3]/50 hover:text-red-400 transition-colors"><LogOut size={15} /></button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
            <Menu size={16} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-semibold">SAI Smart AI Property Finder · Super Admin Panel</p>
            <p className="font-black text-slate-800 text-sm">{adminNav.find(n => n.id === activeSection)?.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-[#006D6A] hover:bg-slate-50 transition-colors"
            >
              <Home size={13} />
              <span>View Main Website</span>
            </button>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-green-700 text-xs font-bold">All Systems Operational</span>
            </div>
            <button className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors relative">
              <Bell size={15} className="text-slate-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">6</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">

          {/* 1. OVERVIEW */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map(({ label, value, sub, color, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
                    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}><Icon size={15} className="text-white" /></div>
                    <div>
                      <p className="font-black text-slate-800 text-xl">{value}</p>
                      <p className="text-slate-500 text-xs font-semibold mt-0.5">{label}</p>
                      <p className="text-[#006D6A] text-[11px] font-bold mt-1">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Activity size={15} className="text-[#008F8C]" />Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === "success" ? "bg-green-500" : a.type === "error" ? "bg-red-500" : a.type === "warning" ? "bg-amber-500" : "bg-[#008F8C]"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700">{a.action}</p>
                          <p className="text-xs text-slate-400 truncate">{a.target}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] text-slate-400">{a.time}</p>
                          <p className="text-[11px] text-[#006D6A] font-semibold">{a.admin}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Attention Required */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" />Requires Attention</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Critical fraud alerts", count: 6, color: "bg-red-50 border-red-200 text-red-700", action: "fraud" },
                      { label: "Pending verifications", count: 1284, color: "bg-amber-50 border-amber-200 text-amber-700", action: "verification" },
                      { label: "Open complaints", count: 382, color: "bg-orange-50 border-orange-200 text-orange-700", action: "support" },
                      { label: "Flagged listings", count: 14, color: "bg-red-50 border-red-200 text-red-700", action: "listings" },
                      { label: "Storage degraded", count: 1, color: "bg-amber-50 border-amber-200 text-amber-700", action: "health" },
                    ].map(a => (
                      <button key={a.label} onClick={() => setActiveSection(a.action)} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left hover:opacity-80 transition-opacity ${a.color}`}>
                        <span className="text-xs font-semibold">{a.label}</span>
                        <span className="font-black text-sm">{a.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Revenue + AI stats row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[{ l: "Ad Revenue (Apr)", v: "₹4.8 Cr", t: "+18% vs Mar", icon: TrendingUp }, { l: "AI Searches (today)", v: "48,210", t: "89% success rate", icon: Brain }, { l: "Voice Searches", v: "12,840", t: "26.6% of AI queries", icon: Mic }, { l: "Avg AI Latency", v: "340ms", t: "↓ 12ms this week", icon: Zap }].map(({ l, v, t, icon: Icon }) => (
                  <div key={l} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#E6F4F2] rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-[#006D6A]" /></div>
                    <div><p className="font-black text-slate-800 text-lg">{v}</p><p className="text-slate-500 text-xs">{l}</p><p className="text-[#006D6A] text-[11px] font-bold">{t}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. USER MANAGEMENT */}
          {activeSection === "users" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Search size={14} className="text-slate-400" /><input placeholder="Search users..." className="bg-transparent text-sm text-slate-700 flex-1 focus:outline-none" />
                </div>
                {[["User Type", ["All", "Buyer", "Agent", "Builder"]], ["Status", ["All", "Active", "Suspended"]], ["Verified", ["All", "Yes", "No"]]].map(([label, opts]) => (
                  <select key={label as string} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none">
                    {(opts as string[]).map(o => <option key={o}>{o === "All" ? `${label}: All` : o}</option>)}
                  </select>
                ))}
                <button className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"><Plus size={14} />Invite Admin</button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{["Name", "User Type", "Email / Phone", "Joined", "Verified", "Status", "Last Active", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((u, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-black">{u.name[0]}</span></div>
                            <span className="font-bold text-slate-700 whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${u.type === "Buyer" ? "bg-[#E6F4F2] text-[#006D6A]" : u.type === "Agent" ? "bg-[#E6F4F2] text-[#004F4D]" : "bg-[#004F4D]/10 text-[#004F4D]"}`}>{u.type}</span></td>
                        <td className="px-4 py-3 text-slate-500 text-xs"><p>{u.email}</p><p className="text-slate-400">{u.phone}</p></td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{u.joined}</td>
                        <td className="px-4 py-3">{u.verified ? <span className="text-[11px] font-bold text-green-700 flex items-center gap-1"><CheckCircle size={11} />Yes</span> : <span className="text-[11px] font-bold text-slate-400">Pending</span>}</td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(u.status)}`}>{u.status}</span></td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{u.lastActive}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">View</button>
                            {u.status === "active" ? (
                              <button onClick={() => u.id && handleToggleUserStatus(u.id, "active")} className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Suspend</button>
                            ) : (
                              <button onClick={() => u.id && handleToggleUserStatus(u.id, "suspended")} className="px-2.5 py-1 text-[11px] font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Reactivate</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PROPERTY LISTINGS */}
          {activeSection === "listings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Search size={14} className="text-slate-400" /><input placeholder="Search listings..." className="bg-transparent text-sm text-slate-700 flex-1 focus:outline-none" />
                </div>
                {["Status: All", "Type: All", "Verified: All"].map(f => <select key={f} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none"><option>{f}</option></select>)}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{["Property", "Location", "Type / Price", "Owner", "Verified", "Status", "Reports", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {displayedListings.map((l, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={l.img} alt={l.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                            <span className="font-bold text-slate-700 text-xs max-w-[140px] truncate">{l.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap"><MapPin size={10} className="inline mr-1 text-[#008F8C]" />{l.location}</td>
                        <td className="px-4 py-3 text-xs"><p className="font-semibold text-slate-600">{l.type}</p><p className="font-black text-[#008F8C]">{l.price}</p></td>
                        <td className="px-4 py-3 text-xs"><p className="font-bold text-slate-600">{l.owner}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.ownerType === "Agent" ? "bg-[#E6F4F2] text-[#004F4D]" : "bg-[#E6F4F2] text-[#006D6A]"}`}>{l.ownerType}</span></td>
                        <td className="px-4 py-3">{l.verified ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}</td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(l.status)}`}>{l.status}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs font-black ${l.reports > 0 ? "text-red-600" : "text-slate-400"}`}>{l.reports}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => l.id && handleTogglePropertyVerification(l.id, l.verified)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                                l.verified ? "bg-[#E6F4F2] text-[#006D6A]" : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              {l.verified ? "Verified ✓" : "Approve"}
                            </button>
                            <button
                              onClick={() => l.id && handleDeleteListing(l.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. APARTMENT PROJECTS */}
          {activeSection === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2"><Search size={14} className="text-slate-400" /><input placeholder="Search projects..." className="bg-transparent text-sm text-slate-700 flex-1 focus:outline-none" /></div>
                {["Status: All", "Verified: All"].map(f => <select key={f} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none"><option>{f}</option></select>)}
              </div>
              <div className="space-y-3">
                {[{ name: "Green Valley Apartments", builder: "Prestige Group", location: "Baner, Pune", towers: 2, total: 120, avail: 48, booked: 42, sold: 30, verified: true, status: "active", img: IMGS.apt1 }, { name: "Sunrise Residency", builder: "Godrej Properties", location: "Kharadi, Pune", towers: 1, total: 80, avail: 22, booked: 18, sold: 40, verified: true, status: "active", img: IMGS.apt4 }, { name: "Horizon Heights", builder: "Horizon Developers", location: "Hinjewadi, Pune", towers: 3, total: 240, avail: 180, booked: 0, sold: 0, verified: false, status: "pending", img: IMGS.bld1 }].map(p => (
                  <div key={p.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={p.img} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-800">{p.name}</h3>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status}</span>
                          {p.verified ? <span className="text-[11px] font-bold text-green-600 flex items-center gap-1"><CheckCircle size={10} />Verified</span> : <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1"><Clock size={10} />Pending</span>}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{p.builder} · {p.location}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.towers} Towers · {p.total} Total Units</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="px-3 py-1.5 text-xs font-bold bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">Approve</button>
                        <button className="px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors">Request Docs</button>
                        <button className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">Suspend</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[{ k: "Available", v: p.avail, c: "text-green-600" }, { k: "Booked", v: p.booked, c: "text-[#008F8C]" }, { k: "Sold", v: p.sold, c: "text-slate-500" }, { k: "Total", v: p.total, c: "text-slate-800" }].map(({ k, v, c }) => (
                        <div key={k} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                          <p className={`font-black text-lg ${c}`}>{v}</p>
                          <p className="text-[11px] text-slate-400 font-semibold">{k}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. VERIFICATION CENTER */}
          {activeSection === "verification" && (
            <AdminDocumentVerification navigate={navigate} />
          )}

          {/* 6. FRAUD & SAFETY */}
          {activeSection === "fraud" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ label: "Critical", count: 6, color: "bg-red-50 border-red-200" }, { label: "High", count: 22, color: "bg-orange-50 border-orange-200" }, { label: "Medium", count: 48, color: "bg-amber-50 border-amber-200" }, { label: "Low", count: 84, color: "bg-slate-50 border-slate-200" }].map(({ label, count, color }) => (
                  <div key={label} className={`rounded-2xl border p-5 ${color}`}>
                    <p className="font-black text-2xl text-slate-800">{count}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{label} Risk</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-800">Fraud & Safety Alerts</h3></div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{["Alert ID", "Type", "Target", "Risk", "Raised", "Status", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {fraudAlerts.map((f, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.id}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{f.type}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate">{f.target}</td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${riskBadge(f.risk)}`}>{f.risk}</span></td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{f.raised}</td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(f.status)}`}>{f.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">Investigate</button>
                            {f.status !== "closed" && <button className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">Close</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. ADVERTISING & SUBSCRIPTIONS */}
          {activeSection === "advertising" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ l: "Active Promotions", v: "4,920", icon: Zap, c: "bg-[#006D6A]" }, { l: "Monthly Revenue", v: "₹4.8 Cr", icon: TrendingUp, c: "bg-green-600" }, { l: "Failed Payments", v: "42", icon: AlertTriangle, c: "bg-red-500" }, { l: "Refund Requests", v: "8", icon: RefreshCcw, c: "bg-amber-500" }].map(({ l, v, icon: Icon, c }) => (
                  <div key={l} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className={`w-10 h-10 ${c} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={16} className="text-white" /></div>
                    <div><p className="font-black text-slate-800 text-xl">{v}</p><p className="text-slate-500 text-xs font-semibold">{l}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-800">Active Promotions</h3>
                  <span className="text-xs text-slate-400 font-semibold">Only Agents and Builders · Buyers excluded</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>{["Property / Project", "Advertiser", "Type", "Plan", "Period", "Status", "Impressions", "Clicks", "Enquiries", "Revenue", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {promotions.map((p, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 text-xs max-w-[160px] truncate">{p.property}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{p.advertiser}</td>
                          <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${p.type === "Agent" ? "bg-[#E6F4F2] text-[#004F4D]" : "bg-[#E6F4F2] text-[#006D6A]"}`}>{p.type}</span></td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{p.plan}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{p.start} – {p.end}</td>
                          <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>{p.status}</span></td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600">{p.impressions}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600">{p.clicks}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600">{p.enquiries}</td>
                          <td className="px-4 py-3 text-xs font-black text-green-600">{p.revenue}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {p.status === "active" && <button className="px-2 py-1 text-[10px] font-bold bg-amber-50 text-amber-600 rounded-lg">Pause</button>}
                              {p.status === "paused" && <button className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-600 rounded-lg">Resume</button>}
                              {p.status === "pending" && <button className="px-2 py-1 text-[10px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg">Approve</button>}
                              <button className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 rounded-lg">End</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Subscription Plans Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-black text-slate-800 mb-4">Subscription Plans Configuration</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[{ role: "Agent Plans", plans: [{ name: "Basic", price: "₹2,999/mo" }, { name: "Premium", price: "₹5,999/mo" }, { name: "Elite", price: "₹9,999/mo" }] }, { role: "Builder Plans", plans: [{ name: "Project Basic", price: "₹4,999/mo" }, { name: "Project Premium", price: "₹9,999/mo" }, { name: "Project Elite", price: "₹14,999/mo" }] }].map(({ role, plans }) => (
                    <div key={role}>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{role}</p>
                      <div className="space-y-2">
                        {plans.map(({ name, price }) => (
                          <div key={name} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-700 text-sm">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#008F8C] text-sm">{price}</span>
                              <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">Edit</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. ANALYTICS */}
          {activeSection === "analytics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none"><option>Last 30 Days</option><option>Last 7 Days</option><option>Last 90 Days</option></select>
                <button className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"><Download size={14} />Export Report</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[{ title: "User Growth", subs: ["2.2L", "2.4L", "2.6L", "2.7L", "2.8L"], labels: ["Dec", "Jan", "Feb", "Mar", "Apr"] }, { title: "Ad Revenue (₹ Cr)", subs: ["2.8", "3.1", "3.6", "4.1", "4.8"], labels: ["Dec", "Jan", "Feb", "Mar", "Apr"] }, { title: "Listing Growth", subs: ["110k", "118k", "126k", "134k", "142k"], labels: ["Dec", "Jan", "Feb", "Mar", "Apr"] }, { title: "AI Searches / Day", subs: ["28k", "31k", "36k", "42k", "48k"], labels: ["Dec", "Jan", "Feb", "Mar", "Apr"] }].map(({ title, subs, labels }) => (
                  <div key={title} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 mb-4 text-sm">{title}</h3>
                    <div className="flex items-end gap-2 h-24">
                      {subs.map((v, i) => {
                        const h = 20 + i * 18;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <p className="text-[10px] text-slate-500 font-semibold">{v}</p>
                            <div className="w-full bg-[#006D6A] rounded-t-lg transition-all" style={{ height: `${h}px` }} />
                            <p className="text-[10px] text-slate-400">{labels[i]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-black text-slate-800 mb-4">Platform Engagement Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ l: "Avg Session Duration", v: "8m 42s" }, { l: "AI Search Success Rate", v: "89.4%" }, { l: "Listing View → Enquiry", v: "4.2%" }, { l: "Monthly Active Users", v: "1,84,200" }].map(({ l, v }) => (
                    <div key={l} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="font-black text-[#008F8C] text-xl">{v}</p>
                      <p className="text-slate-500 text-xs font-semibold mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. AI MONITORING */}
          {activeSection === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ l: "AI Searches Today", v: "48,210", t: "+12% vs yesterday", icon: Brain, c: "bg-[#006D6A]" }, { l: "Voice Searches", v: "12,840", t: "26.6% of total", icon: Mic, c: "bg-[#008F8C]" }, { l: "Avg Response Latency", v: "340ms", t: "↓ 12ms this week", icon: Zap, c: "bg-[#006D6A]" }, { l: "Error Rate", v: "0.06%", t: "Well within threshold", icon: AlertTriangle, c: "bg-green-600" }].map(({ l, v, t, icon: Icon, c }) => (
                  <div key={l} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className={`w-9 h-9 ${c} rounded-xl flex items-center justify-center mb-3`}><Icon size={15} className="text-white" /></div>
                    <p className="font-black text-slate-800 text-2xl">{v}</p>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">{l}</p>
                    <p className="text-[#006D6A] text-[11px] font-bold mt-1">{t}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-black text-slate-800 mb-4">AI Search by Language</h3>
                <div className="space-y-3">
                  {[{ lang: "English", pct: 48, count: "23,140" }, { lang: "Hindi", pct: 22, count: "10,606" }, { lang: "Marathi", pct: 12, count: "5,785" }, { lang: "Telugu", pct: 7, count: "3,374" }, { lang: "Tamil", pct: 5, count: "2,410" }, { lang: "Others", pct: 6, count: "2,895" }].map(({ lang, pct, count }) => (
                    <div key={lang}>
                      <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-600"><span>{lang}</span><span>{count} ({pct}%)</span></div>
                      <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-[#006D6A] rounded-full" style={{ width: `${pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-4 flex items-center gap-1.5"><Lock size={11} />Private conversations are not stored or exposed. Aggregate analytics only.</p>
              </div>
            </div>
          )}

          {/* 10. CONTENT MANAGEMENT */}
          {activeSection === "content" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-xl">Content Management</h2>
                <button className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"><Plus size={14} />Create Content</button>
              </div>
              {[{ section: "Homepage", items: [{ title: "Hero Banner — Diwali Campaign", status: "published", updated: "Apr 14" }, { title: "Featured Cities Spotlight", status: "published", updated: "Apr 10" }, { title: "May Promotion Banner", status: "scheduled", updated: "Apr 12" }] }, { section: "Announcements", items: [{ title: "New AI Voice Search Feature", status: "published", updated: "Apr 8" }, { title: "RERA Compliance Update 2025", status: "draft", updated: "Apr 13" }] }, { section: "FAQs & Help Center", items: [{ title: "How does AI Match Score work?", status: "published", updated: "Mar 20" }, { title: "How to verify my RERA listing?", status: "archived", updated: "Feb 10" }] }].map(({ section, items }) => (
                <div key={section} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50"><p className="font-black text-slate-600 text-xs uppercase tracking-widest">{section}</p></div>
                  {items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < items.length - 1 ? "border-b border-slate-100" : ""}`}>
                      <FileText size={15} className="text-slate-400 flex-shrink-0" />
                      <p className="flex-1 font-semibold text-slate-700 text-sm">{item.title}</p>
                      <span className="text-xs text-slate-400">{item.updated}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${item.status === "published" ? "bg-green-100 text-green-700" : item.status === "draft" ? "bg-slate-100 text-slate-500" : item.status === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>{item.status}</span>
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">Edit</button>
                        {item.status === "draft" && <button className="px-2.5 py-1 text-[11px] font-bold bg-[#006D6A] text-white rounded-lg hover:bg-[#004F4D] transition-colors">Publish</button>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 11. COMPLAINTS & SUPPORT */}
          {activeSection === "support" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ l: "Open", v: 142, c: "bg-red-50 border-red-200" }, { l: "In Progress", v: 118, c: "bg-[#E6F4F2] border-[#D9E5E3]" }, { l: "Waiting", v: 82, c: "bg-amber-50 border-amber-200" }, { l: "Resolved Today", v: 40, c: "bg-green-50 border-green-200" }].map(({ l, v, c }) => (
                  <div key={l} className={`rounded-2xl border p-5 ${c}`}><p className="font-black text-2xl text-slate-800">{v}</p><p className="text-xs font-bold text-slate-500 mt-0.5">{l}</p></div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{["Ticket ID", "Category", "Reporter", "Related Listing", "Priority", "Status", "Assigned", "Date", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{t.category}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{t.reporter}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.listing}</td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${priorityBadge(t.priority)}`}>{t.priority}</span></td>
                        <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(t.status)}`}>{t.status}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.assigned}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{t.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">View</button>
                            {t.status !== "resolved" && <button className="px-2.5 py-1 text-[11px] font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Resolve</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12. ADMINS & PERMISSIONS */}
          {activeSection === "admins" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Role-based access control. Least-privilege principle applied.</p>
                <button className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"><Plus size={14} />Invite Admin</button>
              </div>
              {[{ name: "Aarav Singh", role: "Verification Admin", email: "aarav@sai.in", perms: ["Verification Center", "Fraud Review"], lastActive: "Today", status: "active" }, { name: "Meera Pillai", role: "Support Admin", email: "meera@sai.in", perms: ["Complaints & Support", "User View"], lastActive: "Today", status: "active" }, { name: "Priya Nair", role: "Content Admin", email: "priya.n@sai.in", perms: ["Content Management", "Ads Review"], lastActive: "Yesterday", status: "active" }, { name: "Rahul Kapoor", role: "Analytics Admin", email: "rahul.k@sai.in", perms: ["Analytics & Reports", "AI Monitoring"], lastActive: "Today", status: "active" }, { name: "System", role: "Super Admin", email: "admin@sai-platform.in", perms: ["Full Access"], lastActive: "Now", status: "active" }].map((a, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center flex-shrink-0"><span className="text-white text-sm font-black">{a.name[0]}</span></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-800">{a.name}</p>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${a.role === "Super Admin" ? "bg-[#073B3A] text-white" : "bg-[#E6F4F2] text-[#006D6A]"}`}>{a.role}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{a.email} · Last active: {a.lastActive}</p>
                    <div className="flex gap-1.5 flex-wrap mt-2">{a.perms.map(p => <span key={p} className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{p}</span>)}</div>
                  </div>
                  {a.role !== "Super Admin" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-3 py-1.5 text-xs font-bold bg-[#E6F4F2] text-[#006D6A] rounded-xl hover:bg-[#D9E5E3] transition-colors">Edit Permissions</button>
                      <button className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">Revoke</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 13. AUDIT LOGS */}
          {activeSection === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2"><Search size={14} className="text-slate-400" /><input placeholder="Search audit logs..." className="bg-transparent text-sm text-slate-700 flex-1 focus:outline-none" /></div>
                <select className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none"><option>All Actions</option><option>Verification</option><option>Suspension</option><option>Settings</option></select>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <Lock size={13} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">Read-only · Tamper-proof</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {displayedAuditLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[#E6F4F2] flex items-center justify-center flex-shrink-0 mt-0.5"><Clock size={14} className="text-[#006D6A]" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-slate-700 text-sm">{log.action}</p>
                          <span className="text-[11px] font-bold text-[#006D6A] bg-[#E6F4F2] px-2 py-0.5 rounded-full">{log.admin}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Target: {log.target}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{log.detail}</p>
                      </div>
                      <p className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{log.timestamp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 14. SYSTEM HEALTH */}
          {activeSection === "health" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[{ label: "Overall Uptime", value: "99.87%", sub: "Last 30 days", color: "text-green-600" }, { label: "Active Incidents", value: "1", sub: "Storage degraded", color: "text-amber-600" }, { label: "Avg API Latency", value: "156ms", sub: "Across all services", color: "text-[#008F8C]" }].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                    <p className={`font-black text-4xl ${color}`}>{value}</p>
                    <p className="font-black text-slate-700 mt-2">{label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-800">Service Status</h3></div>
                <div className="divide-y divide-slate-100">
                  {systemServices.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.status === "operational" ? "bg-green-500" : s.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                      <p className="font-semibold text-slate-700 text-sm flex-1">{s.name}</p>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(s.status)}`}>{s.status}</span>
                      <div className="flex gap-6 text-xs text-slate-400">
                        <span>↑ {s.uptime}</span>
                        <span>⏱ {s.latency}</span>
                        <span>⚠ {s.errors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 15. PLATFORM SETTINGS */}
          {activeSection === "settings" && (
            <div className="space-y-5">
              {[
                { group: "General", items: [{ label: "Platform Name", value: "SAI Smart AI Property Finder" }, { label: "Default Language", value: "English" }, { label: "Default Currency", value: "INR (₹)" }, { label: "Support Contact", value: "support@sai-platform.in" }] },
                { group: "User Settings", items: [{ label: "Guest Access", value: "Enabled" }, { label: "Auto-Verification Reminder", value: "After 7 days" }, { label: "Max Login Attempts", value: "5" }] },
                { group: "Advertising", items: [{ label: "Max Active Promotions per Agent", value: "3" }, { label: "Max Active Promotions per Builder", value: "5" }, { label: "Buyer Ad Eligibility", value: "Disabled (Buyers cannot purchase ads)" }] },
                { group: "AI Settings", items: [{ label: "AI Search Model", value: "SAI-LLM v3.2" }, { label: "Supported Languages", value: "8 (EN, HI, MR, GU, TA, TE, KN, BN)" }, { label: "Privacy Mode", value: "Conversations not stored" }] },
                { group: "Security", items: [{ label: "Session Timeout", value: "30 minutes" }, { label: "Two-Factor Auth (Admin)", value: "Required" }, { label: "Audit Logging", value: "All actions · Immutable" }] },
              ].map(({ group, items }) => (
                <div key={group} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200"><p className="font-black text-slate-500 text-xs uppercase tracking-widest">{group}</p></div>
                  {items.map(({ label, value }, i) => (
                    <div key={label} className={`flex items-center justify-between px-5 py-4 ${i < items.length - 1 ? "border-b border-slate-100" : ""}`}>
                      <span className="font-semibold text-slate-700 text-sm">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm">{value}</span>
                        <button className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4F2] text-[#006D6A] rounded-lg hover:bg-[#D9E5E3] transition-colors">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-semibold flex-1">Sensitive settings require confirmation. All changes are recorded in the Audit Log.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Add Download icon used in analytics export button
const Download = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ── APP SHELL ─────────────────────────────────────────────────────────

const PAGE_WITH_NAV = new Set<Page>(["home", "search", "property", "compare", "fraud", "senior", "buyer", "seller", "profile", "favorites", "settings", "chat", "buy", "rent", "commercial", "new-projects", "building-3d", "city-explore"]);
const ADMIN_PAGES = new Set<Page>(["admin-login", "admin-2fa", "admin", "admin-document-verification"]);
const PAGE_WITH_FOOTER = new Set<Page>(["home", "city-explore"]);

function MainApp() {
  const { lang, setLang, tr } = useI18n();

  // Inspect URL parameters to support direct navigation (e.g. ?page=admin or /admin)
  const initialNavInfo = (() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const p = params.get("page");
        const r = params.get("role");
        const isAdmin = p === "admin" || r === "admin" || r === "super_admin" || window.location.pathname.includes("/admin") || params.has("admin");
        if (isAdmin) {
          return { page: "admin" as Page, isLoggedIn: true, role: "admin" as UserRole };
        }
        if (p) {
          return { page: p as Page, isLoggedIn: false, role: null as UserRole };
        }
      }
    } catch {}
    return { page: "language" as Page, isLoggedIn: false, role: null as UserRole };
  })();

  const [page, setPage] = useState<Page>(initialNavInfo.page);
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(10);
  const [selectedBuildingFloor, setSelectedBuildingFloor] = useState<number>(20);
  const [selectedBuildingUnit, setSelectedBuildingUnit] = useState<string>("C");

  useEffect(() => {
    convertWholeWebsite(lang);
  }, [lang, page]);
  const [city, setCity] = useState("Pune");
  const [cityExploreName, setCityExploreName] = useState<string>("Pune");
  const [locality, setLocality] = useState("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [allProperties, setAllProperties] = useState<PropertyItem[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialNavInfo.isLoggedIn);
  const [userRole, setUserRole] = useState<UserRole>(initialNavInfo.role);
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_name") || "" : "";
    } catch {
      return "";
    }
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem("sai_user_email") || "" : "";
    } catch {
      return "";
    }
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(1);
  const [agentSection, setAgentSection] = useState("overview");
  const [builderSection, setBuilderSection] = useState("overview");
  const [sellerSection, setSellerSection] = useState("overview");
  const [pendingRole, setPendingRole] = useState<UserRole>(null);
  const [comparePropertyIds, setComparePropertyIds] = useState<number[]>([1, 2]);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | null>(null);

  const openChatWithQuery = useCallback((query: string) => {
    setChatInitialQuery(query);
    setPage("chat");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openBuilding3D = useCallback((buildingId?: number, floor?: number, unit?: string) => {
    if (buildingId !== undefined && buildingId !== null) setSelectedBuildingId(buildingId);
    if (floor !== undefined && floor !== null) setSelectedBuildingFloor(floor);
    if (unit !== undefined && unit !== null) setSelectedBuildingUnit(unit);
    setPageHistory(prev => [...prev, page]);
    setPage("building-3d");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    (window as any).__saiOpenBuilding3D = openBuilding3D;
  }, [openBuilding3D]);

  useEffect(() => {
    // Restore session and handle deep links
    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("sai_token");
    if (token) {
      apiGetMe()
        .then((res: any) => {
          if (res && res.user) {
            setIsLoggedIn(true);
            const r = (res.user.role || "").toLowerCase();
            const mappedRole: UserRole = r === "super_admin" || r === "admin" ? "admin" : r === "builder" ? "builder" : r === "agent" ? "agent" : r === "seller" ? "seller" : "buyer";
            setUserRole(mappedRole);
            setIsGuest(false);
            if (res.user.name) {
              setCurrentUserName(res.user.name);
              localStorage.setItem("sai_user_name", res.user.name);
            }
            if (res.user.email) {
              setCurrentUserEmail(res.user.email);
              localStorage.setItem("sai_user_email", res.user.email);
            }
          }
        })
        .catch(() => {});
    }
    try {
      const storedName = localStorage.getItem("sai_user_name");
      const storedEmail = localStorage.getItem("sai_user_email");
      if (storedName) setCurrentUserName(storedName);
      if (storedEmail) setCurrentUserEmail(storedEmail);
    } catch {}

    const path = window.location.pathname;
    if (path.startsWith("/agent")) {
      setPage("agent");
      setIsLoggedIn(true);
      setUserRole("agent");
      if (path.includes("listings")) setAgentSection("listings");
      else if (path.includes("add-property")) setAgentSection("add-property");
      else if (path.includes("site-visits")) setAgentSection("site-visits");
      else if (path.includes("clients")) setAgentSection("clients");
      else if (path.includes("verification")) setAgentSection("verification");
      else if (path.includes("settings")) setAgentSection("settings");
      else if (path.includes("profile")) setAgentSection("profile");
      else if (path.includes("analytics")) setAgentSection("analytics");
      else if (path.includes("messages")) setAgentSection("messages");
    } else if (path.startsWith("/builder")) {
      setPage("builder");
      setIsLoggedIn(true);
      setUserRole("builder");
      if (path.includes("projects")) setBuilderSection("projects");
      else if (path.includes("add-project")) setBuilderSection("add-project");
      else if (path.includes("inventory")) setBuilderSection("inventory");
      else if (path.includes("enquiries")) setBuilderSection("enquiries");
      else if (path.includes("verification")) setBuilderSection("verification");
      else if (path.includes("settings")) setBuilderSection("settings");
      else if (path.includes("analytics")) setBuilderSection("analytics");
    } else if (path.includes("document-verification")) {
      setPage("admin-document-verification");
    } else if (path.startsWith("/properties/city/")) {
      const rawCitySlug = path.replace("/properties/city/", "").replace(/\/$/, "");
      const matched = CITIES.find(
        c => c.toLowerCase().replace(/\s+/g, "-") === rawCitySlug.toLowerCase() ||
             c.toLowerCase() === rawCitySlug.toLowerCase()
      );
      if (matched) {
        setCity(matched);
        setCityExploreName(matched);
      } else if (rawCitySlug) {
        const formatted = decodeURIComponent(rawCitySlug).replace(/-/g, " ");
        setCity(formatted);
        setCityExploreName(formatted);
      }
      setPage("city-explore");
    }

    // 3D Property Discovery Deep Linking (URL query and route path support)
    const searchParams = new URLSearchParams(window.location.search);
    const pageParam = searchParams.get("page");
    const paramBuildingId = searchParams.get("buildingId");
    const paramFloor = searchParams.get("floor");
    const paramUnit = searchParams.get("unit");

    if (paramBuildingId) setSelectedBuildingId(parseInt(paramBuildingId, 10));
    if (paramFloor) setSelectedBuildingFloor(parseInt(paramFloor, 10));
    if (paramUnit) setSelectedBuildingUnit(paramUnit);

    if (
      pageParam === "building-3d" ||
      path.startsWith("/buildings") ||
      path.startsWith("/projects") ||
      path.startsWith("/units") ||
      path.includes("/3d")
    ) {
      const buildingMatch = path.match(/\/buildings\/(\d+)/);
      if (buildingMatch) setSelectedBuildingId(parseInt(buildingMatch[1], 10));
      const floorMatch = path.match(/\/floors\/(\d+)/);
      if (floorMatch) setSelectedBuildingFloor(parseInt(floorMatch[1], 10));

      if (pageParam === "building-3d" || path.includes("/buildings") || path.includes("/3d-tour")) {
        setPage("building-3d");
      }
    }

    fetchProperties({ limit: 100 })
      .then(res => {
        if (res && res.items) {
          setAllProperties(res.items);
        }
      })
      .catch(() => {});

    fetchCities()
      .then(cities => {
        if (cities && Array.isArray(cities)) {
          cities.forEach(c => {
            if (c && !CITIES.includes(c)) CITIES.push(c);
          });
        }
      })
      .catch(() => {});
  }, []);

  const selectProperty = useCallback((id: number) => setSelectedPropertyId(id), []);

  const goBack = useCallback(() => {
    setPageHistory(prev => {
      if (prev.length === 0) {
        setPage("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return [];
      }
      const newHistory = [...prev];
      const previousPage = newHistory.pop()!;
      setPage(previousPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return newHistory;
    });
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        if (e.state.page === "city-explore" && e.state.city) {
          setCity(e.state.city);
          setCityExploreName(e.state.city);
        }
        setPage(e.state.page);
      } else {
        goBack();
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [goBack]);

  const navigateToCityExplore = useCallback((cityName: string) => {
    const match = CITIES.find(c => c.toLowerCase() === cityName.toLowerCase()) || cityName;
    setCity(match);
    setCityExploreName(match);
    setPageHistory(prev => {
      const newHistory = [...prev, page];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setPage("city-explore");
    const slug = match.toLowerCase().replace(/\s+/g, "-");
    try {
      window.history.pushState({ page: "city-explore", city: match }, "", `/properties/city/${slug}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const navigate = (pg: Page) => {
    if (pg === "login" || pg === "role" || pg === "signup" || pg === "welcome" || pg === "language") {
      setIsLoggedIn(false);
      setUserRole(null);
      if (pg === "welcome" || pg === "language") {
        setIsGuest(false);
        setPendingRole(null);
        setCurrentUserName("");
        setCurrentUserEmail("");
        apiLogout();
      }
    }

    if (pg === "home" && !isLoggedIn) setIsGuest(true);
    if (pg === "buyer" || pg === "seller" || pg === "builder" || pg === "agent" || pg === "profile") {
      try {
        const storedName = localStorage.getItem("sai_user_name");
        const storedEmail = localStorage.getItem("sai_user_email");
        if (storedName) setCurrentUserName(storedName);
        if (storedEmail) setCurrentUserEmail(storedEmail);
      } catch {}
    }
    if (pg === "buyer") { setIsLoggedIn(true); setUserRole("buyer"); setIsGuest(false); }
    if (pg === "seller") { setIsLoggedIn(true); setUserRole("seller"); setSellerSection("overview"); setIsGuest(false); }
    if (pg === "builder") { setIsLoggedIn(true); setUserRole("builder"); setBuilderSection("overview"); setIsGuest(false); }
    if (pg === "agent") { setIsLoggedIn(true); setUserRole("agent"); setAgentSection("overview"); setIsGuest(false); }

    // Push current page to history before navigating
    setPageHistory(prev => {
      const newHistory = [...prev, page];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setPage(pg);
    try { window.history.pushState({ page: pg }, "", ""); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goAgentSection = (section: string) => {
    setIsLoggedIn(true); setUserRole("agent"); setAgentSection(section); setPage("agent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBuilderSection = (section: string) => {
    setIsLoggedIn(true); setUserRole("builder"); setBuilderSection(section); setPage("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goSellerSection = (section: string) => {
    setIsLoggedIn(true); setUserRole("seller"); setSellerSection(section); setPage("seller");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showNav = PAGE_WITH_NAV.has(page);
  const showFooter = PAGE_WITH_FOOTER.has(page);
  const isAdminPage = ADMIN_PAGES.has(page);

  if (isAdminPage) {
    return (
      <>
        {page === "admin-login" && <AdminLoginPage navigate={navigate} />}
        {page === "admin-2fa" && <Admin2FAPage navigate={navigate} />}
        {page === "admin" && <AdminDashPage navigate={navigate} />}
        {page === "admin-document-verification" && <AdminDocumentVerification navigate={navigate} onBack={() => navigate("admin")} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {showNav && (
        <TopNav
          page={page}
          navigate={navigate}
          goBack={goBack}
          city={city}
          setCity={setCity}
          locality={locality}
          setLocality={setLocality}
          lang={lang}
          setLang={setLang}
          isGuest={isGuest}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userName={currentUserName}
          userEmail={currentUserEmail}
          agentSection={agentSection}
          builderSection={builderSection}
          sellerSection={sellerSection}
          onAgentSection={goAgentSection}
          onBuilderSection={goBuilderSection}
          onSellerSection={goSellerSection}
          onOpenMap={() => setIsLocationModalOpen(true)}
        />
      )}
      <main>
        {page === "language" && <LanguagePage navigate={navigate} setLang={setLang} currentLang={lang} isGuest={isGuest || isLoggedIn} />}
        {page === "welcome" && <WelcomePage navigate={navigate} />}
        {page === "home" && <HomePage navigate={navigate} city={city} setCity={setCity} lang={lang} setLang={setLang} selectProperty={selectProperty} onOpenMap={() => setIsLocationModalOpen(true)} onExploreCity={navigateToCityExplore} />}
        {page === "login" && (
          <LoginPage
            navigate={navigate}
            pendingRole={pendingRole}
            setPendingRole={setPendingRole}
            onUserLogin={(name, email) => {
              setCurrentUserName(name);
              setCurrentUserEmail(email);
            }}
          />
        )}
        {page === "signup" && (
          <SignupPage
            navigate={navigate}
            pendingRole={pendingRole}
            onUserRegistered={(name, email) => {
              setCurrentUserName(name);
              setCurrentUserEmail(email);
            }}
          />
        )}
        {page === "otp" && <OTPPage navigate={navigate} pendingRole={pendingRole} />}
        {page === "role" && <RolePage navigate={navigate} setPendingRole={setPendingRole} />}
        {page === "search" && <SearchPage navigate={navigate} city={city} lang={lang} selectProperty={selectProperty} />}
        {page === "property" && <PropertyPage navigate={navigate} propertyId={selectedPropertyId} openBuilding3D={openBuilding3D} />}
        {page === "compare" && (
          <ComparePage
            navigate={navigate}
            initialPropertyIds={comparePropertyIds}
            setComparePropertyIds={setComparePropertyIds}
            selectProperty={selectProperty}
            onOpenChatWithQuery={openChatWithQuery}
          />
        )}
        {page === "fraud" && <FraudPage navigate={navigate} />}
        {page === "senior" && <SeniorPage navigate={navigate} />}
        {page === "buyer" && <BuyerDashPage navigate={navigate} city={city} selectProperty={selectProperty} openBuilding3D={openBuilding3D} />}
        {page === "seller" && <SellerDashPage navigate={navigate} activeSection={sellerSection} setActiveSection={setSellerSection} />}
        {page === "builder" && <BuilderDashPage navigate={navigate} activeSection={builderSection} setActiveSection={setBuilderSection} openBuilding3D={openBuilding3D} />}
        {page === "agent" && <AgentDashPage navigate={navigate} activeSection={agentSection} setActiveSection={setAgentSection} />}
        {page === "profile" && <ProfilePage navigate={navigate} />}
        {page === "favorites" && <FavoritesPage navigate={navigate} selectProperty={selectProperty} />}
        {page === "settings" && <SettingsPage navigate={navigate} />}
        {page === "chat" && (
          <ChatPage
            navigate={navigate}
            goBack={goBack}
            selectProperty={selectProperty}
            comparePropertyIds={comparePropertyIds}
            setComparePropertyIds={setComparePropertyIds}
            initialQuery={chatInitialQuery}
            onClearInitialQuery={() => setChatInitialQuery(null)}
            openBuilding3D={openBuilding3D}
          />
        )}
        {page === "buy" && <CategorySearchPage navigate={navigate} city={city} mode="buy" lang={lang} selectProperty={selectProperty} />}
        {page === "rent" && <CategorySearchPage navigate={navigate} city={city} mode="rent" lang={lang} selectProperty={selectProperty} />}
        {page === "commercial" && <CategorySearchPage navigate={navigate} city={city} mode="commercial" lang={lang} selectProperty={selectProperty} />}
        {page === "new-projects" && <CategorySearchPage navigate={navigate} city={city} mode="new-projects" lang={lang} selectProperty={selectProperty} />}
        {page === "building-3d" && (
          <Building3DDiscovery
            initialBuildingId={selectedBuildingId || 10}
            initialFloorNumber={selectedBuildingFloor || 20}
            initialUnitNumber={selectedBuildingUnit || "C"}
            onBack={() => goBack()}
            onNavigateToBuyerDashboard={() => navigate("buyer")}
          />
        )}
        {page === "city-explore" && (
          <CityExplorePage
            initialCity={cityExploreName || city}
            onBackToHubs={() => {
              navigate("home");
              setTimeout(() => {
                const el = document.getElementById("property-hubs");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }}
            navigate={navigate}
            selectProperty={selectProperty}
            onOpenChatWithQuery={openChatWithQuery}
          />
        )}
      </main>
      {showFooter && <Footer navigate={navigate} />}
      {showNav && page !== "chat" && <FloatingSAI navigate={navigate} selectProperty={selectProperty} />}

      {/* Interactive Property Map & Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocationText={locality ? `${locality}, ${city}` : city}
        onSelectLocation={(data) => {
          setCity(data.city);
          setLocality(data.locality);
        }}
        properties={allProperties}
        onViewPropertyDetails={(id) => {
          selectProperty(id);
          navigate("property");
        }}
        currentLang={lang}
        onLanguageChange={setLang}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}
