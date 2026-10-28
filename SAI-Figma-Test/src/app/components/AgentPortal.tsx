import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Building2, Plus, Zap, Bell, Calendar, Users, BarChart2,
  Shield, MessageCircle, User, Star, Settings, ChevronLeft, Search, Filter,
  Phone, Mail, Check, X, Clock, MapPin, Eye, Heart, MessageSquare, AlertCircle,
  ExternalLink, Upload, RefreshCw, CheckCircle, AlertTriangle, ArrowUpDown, ChevronDown,
  FileText, Film
} from "lucide-react";
import { PropertyWalkthrough } from "./property/PropertyWalkthrough";
import { SaiLogo } from "./SaiLogo";
import {
  fetchAgentProfile, updateAgentProfile, fetchAgentSettings, updateAgentSettings,
  fetchAgentListings, createAgentListing, updateAgentListing, deleteAgentListing,
  toggleAgentListingStatus, fetchAgentEnquiries, updateAgentEnquiryStatus,
  fetchAgentSiteVisits, scheduleAgentSiteVisit, updateAgentSiteVisit, cancelAgentSiteVisit,
  fetchAgentClients, updateAgentClientStatus, fetchAgentClientDetails, fetchAgentAnalytics, fetchAgentPromotions,
  createAgentPromotion, AgentProfileData, AgentListingItem, AgentEnquiryItem,
  AgentSiteVisitItem, AgentClientItem, AgentClientDetail, AgentAnalyticsData,
  uploadVerificationDocument, fetchMyVerificationDocuments, VerificationDocumentItem,
  fetchConversations, fetchMessages, sendMessage, ConversationItem, MessageItem,
  uploadFiles
} from "../../api";

interface AgentPortalProps {
  navigate: (pg: any) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export function AgentPortal({ navigate, activeSection, setActiveSection }: AgentPortalProps) {
  const currentSection = useMemo(() => {
    if (activeSection === "add-property") return "add";
    if (activeSection === "site-visits") return "visits";
    if (activeSection === "settings") return "agent-settings";
    if (activeSection === "promote") return "promotions";
    if (activeSection === "enquiries") return "leads";
    return activeSection || "overview";
  }, [activeSection]);
  // ── STATE ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<AgentProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [walkthroughProp, setWalkthroughProp] = useState<{ id: number; title: string } | null>(null);

  // Listings State
  const [listings, setListings] = useState<AgentListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState<string>("all");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all");
  const [listingSortBy, setListingSortBy] = useState<string>("newest");
  const [editingListing, setEditingListing] = useState<AgentListingItem | null>(null);
  const [viewEnquiriesProp, setViewEnquiriesProp] = useState<AgentListingItem | null>(null);
  const [promoteProp, setPromoteProp] = useState<AgentListingItem | null>(null);

  // Add Property State
  const [newProp, setNewProp] = useState({
    title: "",
    property_type: "apartment",
    listing_type: "buy",
    bhk: 2,
    price: "",
    area_sqft: "",
    furnishing: "semi-furnished",
    locality: "",
    city: "",
    state: "Maharashtra",
    address: "",
    pincode: "",
    latitude: 18.5596,
    longitude: 73.7799,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floor: 4,
    total_floors: 14,
    amenities: ["Lift", "Parking", "Security", "Gym", "Power Backup"],
    description: "",
    images: [] as string[]
  });
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);
  const [propertyErrors, setPropertyErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enquiries State
  const [enquiries, setEnquiries] = useState<AgentEnquiryItem[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Site Visits State
  const [siteVisits, setSiteVisits] = useState<AgentSiteVisitItem[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [rescheduleModalVisit, setRescheduleModalVisit] = useState<AgentSiteVisitItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState(false);
  const [newVisitData, setNewVisitData] = useState({
    property_id: 0,
    date: "",
    time: "",
    notes: ""
  });

  // Clients State
  const [clients, setClients] = useState<AgentClientItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<AgentClientDetail | null>(null);

  // Messages State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [newMsgText, setNewMsgText] = useState("");

  // Analytics State
  const [analytics, setAnalytics] = useState<AgentAnalyticsData | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState("30d");

  // Verification State
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("pan");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [settingsData, setSettingsData] = useState<any>(null);
  const [editEmailModal, setEditEmailModal] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [editPhoneModal, setEditPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  // ── DATA FETCHING ─────────────────────────────────────────────────────

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  useEffect(() => {
    if (currentSection === "listings" || currentSection === "overview") {
      loadListings();
    }
    if (currentSection === "leads" || currentSection === "overview") {
      loadEnquiries();
    }
    if (currentSection === "visits" || currentSection === "overview") {
      loadSiteVisits();
    }
    if (currentSection === "clients") {
      loadClients();
    }
    if (currentSection === "analytics" || currentSection === "overview") {
      loadAnalytics(analyticsRange);
    }
    if (currentSection === "verification") {
      loadVerificationDocs();
    }
    if (currentSection === "messages") {
      loadConversations();
    }
  }, [currentSection]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProfile = async () => {
    try {
      const data = await fetchAgentProfile();
      setProfile(data);
    } catch {
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await fetchAgentSettings();
      setSettingsData(data);
    } catch {}
  };

  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetchAgentListings({
        search: listingSearch,
        status: listingStatusFilter !== "all" ? listingStatusFilter : undefined,
        property_type: listingTypeFilter !== "all" ? listingTypeFilter : undefined,
        sort_by: listingSortBy
      });
      setListings(res.items || []);
    } catch (err: any) {
      showToast("Could not load listings: " + err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const data = await fetchAgentEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      setEnquiries([]);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const loadSiteVisits = async () => {
    setLoadingVisits(true);
    try {
      const data = await fetchAgentSiteVisits();
      setSiteVisits(Array.isArray(data) ? data : []);
    } catch {
      setSiteVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const data = await fetchAgentClients();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientStatusChange = async (clientId: number, newStatus: string) => {
    try {
      await updateAgentClientStatus(clientId, newStatus);
      showToast(`Client lead status updated to ${newStatus}`);
      await loadClients();
      await loadAnalytics(analyticsRange);
    } catch (err: any) {
      alert("Failed to update client status: " + err.message);
    }
  };

  const loadAnalytics = async (range: string) => {
    try {
      const data = await fetchAgentAnalytics(range);
      setAnalytics(data);
    } catch {}
  };

  const loadVerificationDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await fetchMyVerificationDocuments();
      setVerificationDocs(Array.isArray(docs) ? docs : []);
    } catch {
      setVerificationDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await fetchConversations();
      const safeConvs = Array.isArray(convs) ? convs : [];
      setConversations(safeConvs);
      if (safeConvs.length > 0 && !activeConvId) {
        setActiveConvId(safeConvs[0].id);
        loadMessagesForConv(safeConvs[0].id);
      }
    } catch {
      setConversations([]);
    }
  };

  const loadMessagesForConv = async (convId: number) => {
    try {
      const msgs = await fetchMessages(convId);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setChatMessages([]);
    }
  };

  // ── ACTIONS: LISTINGS ─────────────────────────────────────────────────

  const handleToggleListingStatus = async (item: AgentListingItem) => {
    const nextStatus = item.is_active ? "inactive" : "available";
    try {
      await toggleAgentListingStatus(item.id, nextStatus);
      showToast(`Listing "${item.title}" marked as ${nextStatus === "available" ? "Active" : "Inactive"}`);
      loadListings();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;
    try {
      await deleteAgentListing(id);
      showToast("Listing deleted successfully!");
      loadListings();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  // ── ACTIONS: ADD PROPERTY ─────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const urls = await uploadFiles(files);
      setNewProp(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      showToast(`${urls.length} photo(s) uploaded successfully!`);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
  };

  const validatePropertyForm = () => {
    const errs: Record<string, string> = {};
    if (!newProp.title.trim()) errs.title = "Property title is required";
    if (!newProp.price || parseFloat(String(newProp.price)) <= 0) errs.price = "Valid price in INR is required";
    if (!newProp.area_sqft || parseFloat(String(newProp.area_sqft)) <= 0) errs.area_sqft = "Valid area in sq.ft is required";
    if (!newProp.city.trim()) errs.city = "City is required";
    if (!newProp.locality.trim()) errs.locality = "Locality is required";
    setPropertyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreatePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePropertyForm()) return;

    setIsSubmittingProperty(true);
    try {
      const numericPrice = parseFloat(String(newProp.price).replace(/[^0-9.]/g, ""));
      const numericArea = parseFloat(String(newProp.area_sqft).replace(/[^0-9.]/g, ""));

      await createAgentListing({
        title: newProp.title,
        property_type: newProp.property_type,
        listing_type: newProp.listing_type,
        bhk: Number(newProp.bhk),
        price: numericPrice,
        price_display: numericPrice >= 10000000 ? `₹${(numericPrice/10000000).toFixed(2)}Cr` : `₹${(numericPrice/100000).toFixed(1)}L`,
        area_sqft: numericArea,
        furnishing: newProp.furnishing,
        locality: newProp.locality,
        city: newProp.city,
        state: newProp.state,
        address: newProp.address || `${newProp.locality}, ${newProp.city}`,
        pincode: newProp.pincode,
        latitude: newProp.latitude,
        longitude: newProp.longitude,
        amenities: newProp.amenities,
        description: newProp.description,
        media_urls: newProp.images.length > 0 ? newProp.images : ["https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800"],
        status: "available"
      });

      showToast(`Property "${newProp.title}" listed successfully!`);
      // Reset form
      setNewProp({
        title: "",
        property_type: "apartment",
        listing_type: "buy",
        bhk: 2,
        price: "",
        area_sqft: "",
        furnishing: "semi-furnished",
        locality: "Baner",
        city: "Pune",
        state: "Maharashtra",
        address: "",
        pincode: "411045",
        latitude: 18.5596,
        longitude: 73.7799,
        bedrooms: 2,
        bathrooms: 2,
        balconies: 1,
        floor: 4,
        total_floors: 14,
        amenities: ["Lift", "Parking", "Security", "Gym", "Power Backup"],
        description: "",
        images: []
      });
      setActiveSection("listings");
    } catch (err: any) {
      alert("Failed to create property listing: " + (err.message || "Error"));
    } finally {
      setIsSubmittingProperty(false);
    }
  };

  // ── ACTIONS: EDIT LISTING ─────────────────────────────────────────────

  const handleSaveListingEdit = async () => {
    if (!editingListing) return;
    try {
      await updateAgentListing(editingListing.id, {
        title: editingListing.title,
        price: editingListing.price,
        bhk: editingListing.bhk,
        property_type: editingListing.property_type.toLowerCase(),
        description: editingListing.description,
        status: editingListing.status,
        amenities: editingListing.amenities
      });
      showToast(`Listing #${editingListing.id} updated successfully!`);
      setEditingListing(null);
      loadListings();
    } catch (err: any) {
      alert("Failed to update listing: " + err.message);
    }
  };

  // ── ACTIONS: SITE VISITS ──────────────────────────────────────────────

  const handleMarkVisitDone = async (visitId: number) => {
    try {
      await updateAgentSiteVisit(visitId, { status: "COMPLETED" });
      showToast("Site visit marked as Completed!");
      loadSiteVisits();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModalVisit || !rescheduleDate || !rescheduleTime) {
      alert("Please select both date and time");
      return;
    }
    try {
      await updateAgentSiteVisit(rescheduleModalVisit.id, {
        date: rescheduleDate,
        time: rescheduleTime,
        notes: rescheduleNotes,
        status: "RESCHEDULED"
      });
      showToast("Site visit rescheduled successfully!");
      setRescheduleModalVisit(null);
      loadSiteVisits();
    } catch (err: any) {
      alert("Failed to reschedule: " + err.message);
    }
  };

  const handleScheduleNewVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitData.property_id || !newVisitData.date || !newVisitData.time) {
      alert("Please fill in property, date, and time");
      return;
    }
    try {
      await scheduleAgentSiteVisit(newVisitData);
      showToast("New site visit appointment scheduled!");
      setIsScheduleVisitModalOpen(false);
      loadSiteVisits();
    } catch (err: any) {
      alert("Failed to schedule: " + err.message);
    }
  };

  // ── ACTIONS: ENQUIRIES ────────────────────────────────────────────────

  const handleEnquiryStatusChange = async (enquiryId: number, newStatus: string) => {
    try {
      await updateAgentEnquiryStatus(enquiryId, newStatus);
      showToast(`Enquiry marked as ${newStatus}`);
      loadEnquiries();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  // ── ACTIONS: VERIFICATION UPLOAD ──────────────────────────────────────

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("document_type", uploadDocType);
    formData.append("account_type", "agent");

    try {
      await uploadVerificationDocument(formData);
      showToast("Document submitted! AI analysis and extraction completed.");
      loadVerificationDocs();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // ── ACTIONS: CHAT ─────────────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMsgText.trim()) return;

    try {
      const msg = await sendMessage(activeConvId, newMsgText.trim());
      setChatMessages(prev => [...prev, msg]);
      setNewMsgText("");
    } catch (err: any) {
      alert("Failed to send message: " + err.message);
    }
  };

  // ── ACTIONS: SETTINGS ─────────────────────────────────────────────────

  const handleSaveEmail = async () => {
    if (!tempEmail || !tempEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    try {
      await updateAgentSettings({ account: { email: tempEmail } });
      showToast("Account email updated successfully!");
      setEditEmailModal(false);
      loadSettings();
      loadProfile();
    } catch (err: any) {
      alert("Failed to update email: " + err.message);
    }
  };

  const handleSavePhone = async () => {
    if (!tempPhone.trim()) {
      alert("Please enter phone number");
      return;
    }
    try {
      await updateAgentSettings({ account: { phone: tempPhone } });
      showToast("Account phone updated successfully!");
      setEditPhoneModal(false);
      loadSettings();
      loadProfile();
    } catch (err: any) {
      alert("Failed to update phone: " + err.message);
    }
  };

  const handleToggleNotification = async (key: string, val: boolean) => {
    try {
      await updateAgentSettings({ notifications: { [key]: val } });
      showToast("Notification preference saved");
      loadSettings();
    } catch (err: any) {
      alert("Error saving setting: " + err.message);
    }
  };

  const handleTogglePrivacy = async (key: string, val: any) => {
    try {
      await updateAgentSettings({ privacy: { [key]: val } });
      showToast("Privacy setting saved");
      loadSettings();
    } catch (err: any) {
      alert("Error saving setting: " + err.message);
    }
  };

  // ── NAV ITEMS ─────────────────────────────────────────────────────────

  const agentNav = [
    { id: "overview", label: "Agent Overview", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", icon: Building2 },
    { id: "add", label: "Add Property", icon: Plus },
    { id: "promotions", label: "Promote Listings", icon: Zap },
    { id: "leads", label: "Leads & Enquiries", icon: Bell },
    { id: "visits", label: "Site Visits", icon: Calendar },
    { id: "clients", label: "Clients", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "verification", label: "Verification Status", icon: Shield },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "profile", label: "Agent Profile", icon: User },
    { id: "subscription", label: "Subscription", icon: Star },
    { id: "agent-settings", label: "Settings", icon: Settings },
  ];

  const agentInitials = useMemo(() => {
    if (!profile || !profile.name) return "PP";
    const parts = profile.name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006D6A] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle size={18} className="text-[#99D9D2] flex-shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* AGENT PORTAL HEADER */}
        <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] rounded-3xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-[#005B58]">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center pr-3 border-r border-white/20">
              <SaiLogo size="sm" variant="light" subtitle="Agent Partner" />
            </div>
            <button
              onClick={() => navigate("role")}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm transition-all flex-shrink-0 border border-white/20 active:scale-95"
            >
              <ChevronLeft size={16} />Back
            </button>

            {profile?.profile_image ? (
              <img src={profile.profile_image} alt={profile.name} className="w-14 h-14 rounded-2xl object-cover shadow border border-white/20" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow border border-white/20">
                <span className="text-white font-black text-xl">{agentInitials}</span>
              </div>
            )}

            <div>
              <p className="text-[#D9E5E3] text-xs font-bold uppercase tracking-wider mb-0.5">Agent Portal</p>
              <h1 className="text-2xl font-black text-white">{profile?.name || "Priya Patel"}</h1>
              <p className="text-[#D9E5E3] text-sm flex items-center gap-1.5 mt-0.5">
                <Star size={13} className="text-amber-300 fill-amber-300" />
                <span>Premium Agent · {profile?.rating || 4.9} Rating · {profile?.city || "Pune"}</span>
                {profile?.verification_status === "VERIFIED" && (
                  <span className="ml-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">✓ Verified</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveSection("add")}
            className="bg-white text-[#006D6A] font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#E6F4F2] transition-colors shadow-lg active:scale-95 text-sm"
          >
            <Plus size={16} />Add Property
          </button>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,109,106,0.08)] border border-[#D9E5E3] overflow-hidden sticky top-6">
              <div className="p-3.5 border-b border-[#D9E5E3] flex items-center justify-center">
                <SaiLogo size="sm" subtitle="Agent Partner" />
              </div>
              {agentNav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors border-b border-slate-100 last:border-0 ${
                    currentSection === id
                      ? "bg-[#006D6A] text-white font-bold"
                      : "text-slate-600 hover:bg-[#E6F4F2] font-medium"
                  }`}
                >
                  <Icon size={16} className={currentSection === id ? "text-white" : "text-[#008F8C]"} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* MOBILE NAVIGATION TABS */}
          <div className="lg:hidden overflow-x-auto flex gap-2 pb-2 scrollbar-hide">
            {agentNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                  currentSection === id
                    ? "bg-[#006D6A] text-white shadow-md"
                    : "bg-white text-slate-600 border border-[#D9E5E3]"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* CONTENT SECTION CONTAINER */}
          <div className="flex-1 min-w-0">
            {/* 1. AGENT OVERVIEW */}
            {currentSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "My Listings", val: analytics?.total_listings || listings?.length || 3, icon: Building2, color: "from-[#006D6A] to-[#004F4D]" },
                    { label: "Active Listings", val: analytics?.active_listings || 2, icon: CheckCircle, color: "from-[#008F8C] to-[#006D6A]" },
                    { label: "Total Views", val: analytics?.total_views || 655, icon: Eye, color: "from-blue-600 to-indigo-700" },
                    { label: "Total Enquiries", val: analytics?.total_enquiries || enquiries?.length || 7, icon: MessageSquare, color: "from-emerald-600 to-teal-800" },
                  ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-5 text-white shadow-md`}>
                      <stat.icon size={20} className="text-white/80 mb-2" />
                      <p className="font-black text-3xl">{stat.val}</p>
                      <p className="text-white/80 text-xs font-semibold mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Today's Schedule */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-lg">Upcoming Site Visits</h3>
                    <button onClick={() => setActiveSection("visits")} className="text-xs font-bold text-[#006D6A] hover:underline">
                      View All ({siteVisits?.length || 0})
                    </button>
                  </div>
                  {(!siteVisits || siteVisits.length === 0) ? (
                    <div className="text-center py-8 text-slate-400">
                      <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No upcoming site visits scheduled.</p>
                      <button onClick={() => setIsScheduleVisitModalOpen(true)} className="mt-3 text-xs bg-[#E6F4F2] text-[#006D6A] font-bold px-3 py-1.5 rounded-lg">
                        + Schedule Visit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {siteVisits.slice(0, 3).map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#006D6A] text-white flex items-center justify-center font-bold text-sm">
                              {v.client_name ? v.client_name[0] : "C"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{v.client_name}</p>
                              <p className="text-xs text-slate-500">{v.property_title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-[#006D6A]">{v.date_display} · {v.time_display}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{v.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#008F8C] to-[#004F4D] rounded-3xl p-6 text-white">
                    <Zap size={24} className="mb-2 text-amber-300" />
                    <h4 className="font-black text-xl mb-1">Promote Your Listings</h4>
                    <p className="text-xs text-[#E6F4F2] mb-4">Feature your property listings at the top of SAI search results and on the home feed.</p>
                    <button onClick={() => setActiveSection("promotions")} className="bg-white text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#E6F4F2] transition-colors">
                      View Plans
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-[#D9E5E3] shadow-sm">
                    <Shield size={24} className="mb-2 text-[#006D6A]" />
                    <h4 className="font-black text-slate-800 text-xl mb-1">Document Verification</h4>
                    <p className="text-xs text-slate-500 mb-4">Submit RERA and Identity credentials to receive the official Verified Agent badge.</p>
                    <button onClick={() => setActiveSection("verification")} className="bg-[#E6F4F2] text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#D9E5E3] transition-colors">
                      Manage Verification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AGENT - MY LISTINGS */}
            {currentSection === "listings" && (
              <div className="space-y-5">
                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search my listings by title, locality..."
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadListings()}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={listingStatusFilter}
                      onChange={(e) => { setListingStatusFilter(e.target.value); setTimeout(loadListings, 10); }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      value={listingSortBy}
                      onChange={(e) => { setListingSortBy(e.target.value); setTimeout(loadListings, 10); }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="views">Most Views</option>
                      <option value="enquiries">Most Enquiries</option>
                    </select>

                    <button
                      onClick={() => setActiveSection("add")}
                      className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors"
                    >
                      <Plus size={14} />Add Property
                    </button>
                  </div>
                </div>

                {/* Listings Grid / Cards */}
                {loadingListings ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse h-48" />
                    ))}
                  </div>
                ) : (!listings || listings.length === 0) ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#D9E5E3]">
                    <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700 text-base">No listings yet</h3>
                    <p className="text-slate-400 text-xs mt-1 mb-4">Add your first property to start receiving verified buyer leads.</p>
                    <button onClick={() => setActiveSection("add")} className="bg-[#006D6A] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#004F4D]">
                      + Add Your First Property
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map(l => (
                      <div key={l.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,109,106,0.06)] border border-[#D9E5E3] transition-all hover:border-[#008F8C]">
                        {/* Top Card Info matching screenshot */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                          <img
                            src={l.img || "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800"}
                            alt={l.title}
                            className="w-24 h-24 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0 border border-slate-100 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-800 text-base truncate">{l.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {l.property_type} · {l.locality}, {l.city}
                            </p>
                            <p className="text-[#006D6A] font-black text-lg mt-1">{l.price_display}</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-2">
                            <button
                              onClick={() => handleToggleListingStatus(l)}
                              className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-colors ${
                                l.is_active
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {l.is_active ? "Active" : "Inactive"}
                            </button>
                            <span className="text-[10px] text-slate-400 font-medium">#{l.id}</span>
                          </div>
                        </div>

                        {/* Middle Stat Metrics matching screenshot */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                            <p className="font-black text-slate-800 text-xl">{l.views}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Views</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                            <p className="font-black text-slate-800 text-xl">{l.enquiries}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Enquiries</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                            <p className="font-black text-slate-800 text-xl">{l.saved}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Saved</p>
                          </div>
                        </div>

                        {/* Action Buttons matching screenshot */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <button
                            onClick={() => setEditingListing(l)}
                            className="flex-1 py-2.5 bg-[#E6F4F2] rounded-xl text-[#006D6A] font-bold text-sm hover:bg-[#d4ece8] transition-colors"
                          >
                            Edit Listing
                          </button>
                          <button
                            onClick={() => {
                              setViewEnquiriesProp(l);
                              setActiveSection("leads");
                            }}
                            className="flex-1 py-2.5 bg-[#006D6A] rounded-xl text-white font-bold text-sm hover:bg-[#004F4D] transition-colors"
                          >
                            View Enquiries
                          </button>
                          <button
                            onClick={() => setWalkthroughProp({ id: Number(l.id) || 1, title: l.title })}
                            className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-[#008F8C] hover:from-teal-500 hover:to-teal-600 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Film size={14} />
                            Preview Walkthrough
                          </button>
                          <button
                            onClick={() => setPromoteProp(l)}
                            className="flex-1 py-2.5 bg-amber-50 rounded-xl text-amber-600 font-bold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 border border-amber-200"
                          >
                            <Zap size={14} className="fill-amber-500 text-amber-500" />Promote
                          </button>
                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs"
                            title="Delete Listing"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Walkthrough Preview Modal for Agent */}
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
              </div>
            )}

            {/* 3. AGENT - ADD PROPERTY FORM */}
            {currentSection === "add" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3]">
                <div className="mb-6 border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl">Add New Property Listing</h2>
                    <p className="text-xs text-slate-500 mt-1">Fill in the complete details to publish to the SAI property portal.</p>
                  </div>
                  <button onClick={() => setActiveSection("listings")} className="text-xs text-[#006D6A] font-bold hover:underline">
                    Cancel & Back
                  </button>
                </div>

                <form onSubmit={handleCreatePropertySubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">1. Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Property Title *</label>
                        <input
                          type="text"
                          value={newProp.title}
                          onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                          placeholder="e.g. 2BHK in Baner · Prestige Heights"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                        />
                        {propertyErrors.title && <p className="text-red-500 text-[11px] mt-1">{propertyErrors.title}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Property Type</label>
                        <select
                          value={newProp.property_type}
                          onChange={(e) => setNewProp({ ...newProp, property_type: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        >
                          <option value="apartment">Apartment</option>
                          <option value="villa">Villa / Independent House</option>
                          <option value="plot">Plot / Land</option>
                          <option value="office">Commercial Office</option>
                          <option value="studio">Studio</option>
                          <option value="penthouse">Penthouse</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Listing Type</label>
                        <select
                          value={newProp.listing_type}
                          onChange={(e) => setNewProp({ ...newProp, listing_type: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        >
                          <option value="buy">For Sale (Buy)</option>
                          <option value="rent">For Rent</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">BHK</label>
                        <select
                          value={newProp.bhk}
                          onChange={(e) => setNewProp({ ...newProp, bhk: parseInt(e.target.value, 10) })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        >
                          <option value={1}>1 BHK</option>
                          <option value={2}>2 BHK</option>
                          <option value={3}>3 BHK</option>
                          <option value={4}>4 BHK</option>
                          <option value={5}>5+ BHK</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹ INR) *</label>
                        <input
                          type="number"
                          value={newProp.price}
                          onChange={(e) => setNewProp({ ...newProp, price: e.target.value })}
                          placeholder="e.g. 8500000"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                        />
                        {propertyErrors.price && <p className="text-red-500 text-[11px] mt-1">{propertyErrors.price}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Super Built-up Area (sq.ft) *</label>
                        <input
                          type="number"
                          value={newProp.area_sqft}
                          onChange={(e) => setNewProp({ ...newProp, area_sqft: e.target.value })}
                          placeholder="e.g. 1050"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                        />
                        {propertyErrors.area_sqft && <p className="text-red-500 text-[11px] mt-1">{propertyErrors.area_sqft}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Furnishing</label>
                        <select
                          value={newProp.furnishing}
                          onChange={(e) => setNewProp({ ...newProp, furnishing: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        >
                          <option value="unfurnished">Unfurnished</option>
                          <option value="semi-furnished">Semi-Furnished</option>
                          <option value="furnished">Fully Furnished</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">2. Location Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
                        <input
                          type="text"
                          value={newProp.city}
                          onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        />
                        {propertyErrors.city && <p className="text-red-500 text-[11px] mt-1">{propertyErrors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Locality *</label>
                        <input
                          type="text"
                          value={newProp.locality}
                          onChange={(e) => setNewProp({ ...newProp, locality: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        />
                        {propertyErrors.locality && <p className="text-red-500 text-[11px] mt-1">{propertyErrors.locality}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
                        <input
                          type="text"
                          value={newProp.pincode}
                          onChange={(e) => setNewProp({ ...newProp, pincode: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                        <input
                          type="text"
                          value={newProp.state}
                          onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={newProp.address}
                          onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                          placeholder="e.g. Near Westend Mall, Baner High Street"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">3. Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {[
                        "Lift", "Parking", "Security", "Gym", "Swimming Pool",
                        "Garden", "Clubhouse", "Power Backup", "CCTV", "Water Supply"
                      ].map(am => {
                        const isChecked = newProp.amenities.includes(am);
                        return (
                          <label key={am} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                            isChecked ? "bg-[#E6F4F2] border-[#008F8C] text-[#006D6A] font-bold" : "border-slate-200 text-slate-600"
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setNewProp({ ...newProp, amenities: [...newProp.amenities, am] });
                                else setNewProp({ ...newProp, amenities: newProp.amenities.filter(x => x !== am) });
                              }}
                              className="accent-[#006D6A]"
                            />
                            <span>{am}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Media Uploads */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">4. Property Photos & Media</h3>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#99D9D2] bg-[#F4FAF9] rounded-2xl p-6 text-center cursor-pointer hover:bg-[#E6F4F2] transition-colors"
                    >
                      <Upload size={24} className="mx-auto text-[#006D6A] mb-2" />
                      <p className="font-bold text-slate-800 text-sm">Click to choose photos or drag and drop</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB per file</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    {newProp.images.length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                        {newProp.images.map((imgUrl, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                            <img src={imgUrl} alt="uploaded" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewProp(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">5. Description</h3>
                    <textarea
                      rows={4}
                      value={newProp.description}
                      onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                      placeholder="Highlight architectural aspects, neighborhood perks, proximity to schools, hospitals, and metro..."
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection("listings")}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProperty}
                      className="px-7 py-2.5 bg-[#006D6A] text-white rounded-xl font-bold text-sm hover:bg-[#004F4D] transition-all shadow-md disabled:opacity-50"
                    >
                      {isSubmittingProperty ? "Publishing..." : "Publish Listing"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. AGENT - SITE VISITS */}
            {currentSection === "visits" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Site Visit Schedule</h2>
                    <p className="text-xs text-slate-500">Manage real appointments with interested clients.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (listings && listings.length > 0) {
                        setNewVisitData(prev => ({ ...prev, property_id: listings[0].id }));
                      }
                      setIsScheduleVisitModalOpen(true);
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D]"
                  >
                    <Plus size={14} />Schedule Visit
                  </button>
                </div>

                {loadingVisits ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-200" />
                    ))}
                  </div>
                ) : (!Array.isArray(siteVisits) || siteVisits.length === 0) ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                    <Calendar size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No site visits scheduled</p>
                    <p className="text-slate-400 text-xs mt-1">Book client appointments to conduct on-premise property tours.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(siteVisits) ? siteVisits : []).map(v => (
                      <div key={v.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#E6F4F2] text-[#006D6A] flex items-center justify-center font-black text-base flex-shrink-0">
                            {v.client_name ? v.client_name[0] : "C"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-800 text-sm">{v.client_name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                v.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                v.status === "RESCHEDULED" ? "bg-amber-100 text-amber-700" :
                                "bg-[#E6F4F2] text-[#006D6A]"
                              }`}>
                                {v.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">{v.property_title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{v.date_display} · {v.time_display} · {v.visit_type}</p>
                            {v.notes && <p className="text-[11px] text-slate-500 italic mt-1">Note: {v.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <a
                            href={`tel:${v.client_phone}`}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Phone size={13} className="text-[#006D6A]" />Call Client
                          </a>

                          {v.status !== "COMPLETED" && (
                            <>
                              <button
                                onClick={() => {
                                  setRescheduleModalVisit(v);
                                  setRescheduleDate(v.scheduled_at ? v.scheduled_at.split("T")[0] : "");
                                  setRescheduleTime("11:00");
                                  setRescheduleNotes(v.notes);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-[#E6F4F2] hover:bg-[#d5ebe7] text-[#006D6A] font-bold text-xs transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleMarkVisitDone(v.id)}
                                className="px-3.5 py-2 rounded-xl bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs transition-colors flex items-center gap-1"
                              >
                                <Check size={13} />Mark Done
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. AGENT - CLIENTS */}
            {currentSection === "clients" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">My Clients</h2>
                    <p className="text-xs text-slate-500">Live directory of active buyers, requirements, and scheduled tours.</p>
                  </div>
                  <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1.5 rounded-full">
                    {(clients || []).length} Active Clients
                  </span>
                </div>

                {loadingClients ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="bg-white rounded-2xl h-36 animate-pulse border border-slate-200" />
                    ))}
                  </div>
                ) : (!clients || clients.length === 0) ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                    <Users size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No clients yet</p>
                    <p className="text-slate-400 text-xs mt-1">Clients will appear here automatically as buyers enquiry on your listings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(clients) ? clients : []).map(c => (
                      <div key={c.id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#006D6A] text-white flex items-center justify-center font-bold text-sm">
                                {c.name ? c.name[0] : "C"}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800 text-sm">{c.name}</h4>
                                <div className="flex items-center gap-2 text-xs">
                                  <a href={`tel:${c.phone}`} className="text-[#006D6A] font-semibold hover:underline flex items-center gap-1">
                                    <Phone size={11} /> {c.phone}
                                  </a>
                                  {c.email && (
                                    <span className="text-slate-400 truncate max-w-[140px]">· {c.email}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Since {c.client_since}</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Interested in:</span>
                              <span className="font-bold text-slate-700 truncate max-w-[180px]">{c.interested_property}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Location:</span>
                              <span className="font-medium text-slate-600">{c.preferred_city || "Pune"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Requirement:</span>
                              <span className="font-semibold text-slate-700">{c.preferred_bhk ? `${c.preferred_bhk} BHK` : "Residential"} · {c.budget || "₹60L - ₹1.2 Cr"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Site Visit Status:</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.site_visit_status === "Completed" ? "bg-green-100 text-green-700" :
                                c.site_visit_status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {c.site_visit_status || "None"}
                              </span>
                            </div>

                            {/* Lead Status Dropdown (Part A1) */}
                            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                              <span className="text-slate-400 font-semibold text-[11px]">Lead Status:</span>
                              <select
                                value={c.current_status}
                                onChange={(e) => handleClientStatusChange(c.id, e.target.value)}
                                className="text-xs font-bold bg-[#E6F4F2] text-[#006D6A] border border-[#99D9D2] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Interested">Interested</option>
                                <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Converted">Converted</option>
                                <option value="Closed/Lost">Closed / Lost</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={async () => {
                              try {
                                const details = await fetchAgentClientDetails(c.id);
                                setSelectedClientDetail(details);
                              } catch {
                                alert("Could not fetch client profile");
                              }
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setActiveSection("messages");
                            }}
                            className="flex-1 py-2 bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <MessageCircle size={13} /> Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. AGENT - LEADS & ENQUIRIES */}
            {currentSection === "leads" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Leads & Enquiries</h2>
                    <p className="text-xs text-slate-500">Real enquiries received from prospective buyers.</p>
                  </div>
                  <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1.5 rounded-full">
                    {(enquiries || []).length} Enquiries
                  </span>
                </div>

                {loadingEnquiries ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-200" />
                    ))}
                  </div>
                ) : (!Array.isArray(enquiries) || enquiries.length === 0) ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                    <Bell size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No enquiries yet</p>
                    <p className="text-slate-400 text-xs mt-1">Enquiries from your listings will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(enquiries) ? enquiries : []).map(enq => (
                      <div key={enq.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#D9E5E3]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm">{enq.buyer_name}</span>
                            <span className="text-xs text-slate-400">· {enq.property_title}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{enq.created_at_display}</span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                          "{enq.message}"
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <a href={`tel:${enq.buyer_phone}`} className="text-xs text-[#006D6A] font-bold hover:underline flex items-center gap-1">
                              <Phone size={12} />{enq.buyer_phone}
                            </a>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-500">{enq.buyer_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">Status:</span>
                            <select
                              value={enq.status}
                              onChange={(e) => handleEnquiryStatusChange(enq.id, e.target.value)}
                              className="text-xs font-bold bg-[#E6F4F2] text-[#006D6A] px-2.5 py-1 rounded-lg border border-[#99D9D2] focus:outline-none"
                            >
                              <option value="NEW">New</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="INTERESTED">Interested</option>
                              <option value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</option>
                              <option value="NEGOTIATION">Negotiation</option>
                              <option value="CLOSED">Closed</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. AGENT - SETTINGS (RECREATING SCREENSHOT) */}
            {currentSection === "agent-settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-xl mb-6">Settings</h2>

                  {/* ACCOUNT SECTION matching screenshot */}
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ACCOUNT</h3>
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Email</p>
                          <p className="text-xs text-slate-500">{settingsData?.account?.email || profile?.email || "agent@sai.in"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setTempEmail(settingsData?.account?.email || profile?.email || "");
                            setEditEmailModal(true);
                          }}
                          className="text-xs font-bold text-[#006D6A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E6F4F2]"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Phone</p>
                          <p className="text-xs text-slate-500">{settingsData?.account?.phone || profile?.phone || "+91 98765 43210"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setTempPhone((settingsData?.account?.phone || profile?.phone || "").replace(/\D/g, "").slice(-10));
                            setEditPhoneModal(true);
                          }}
                          className="text-xs font-bold text-[#006D6A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E6F4F2]"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Language */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Language</p>
                          <p className="text-xs text-slate-500">English (US)</p>
                        </div>
                        <select className="text-xs font-semibold text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1.5 rounded-lg border border-[#99D9D2] focus:outline-none">
                          <option>English (US)</option>
                          <option>Hindi (हिंदी)</option>
                          <option>Marathi (मराठी)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* NOTIFICATIONS SECTION matching screenshot */}
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">NOTIFICATIONS</h3>
                    <div className="space-y-4">
                      {[
                        { key: "lead_alerts", label: "New Lead Alerts", desc: "Instant notification when a buyer matches your property" },
                        { key: "enquiry_alerts", label: "Enquiry Notifications", desc: "SMS and email alerts on direct buyer messages" },
                        { key: "promotion_alerts", label: "Promotion Alerts", desc: "Performance updates and budget milestones" },
                      ].map(notif => {
                        const isChecked = settingsData?.notifications?.[notif.key] ?? true;
                        return (
                          <div key={notif.key} className="flex items-center justify-between py-3 border-b border-slate-100">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{notif.label}</p>
                              <p className="text-xs text-slate-500">{notif.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleNotification(notif.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006D6A]" />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PRIVACY SECTION matching screenshot */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">PRIVACY</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Profile Visibility</p>
                          <p className="text-xs text-slate-500">Allow buyers to find and view your verified agent portfolio</p>
                        </div>
                        <select
                          value={settingsData?.privacy?.profile_visibility || "public"}
                          onChange={(e) => handleTogglePrivacy("profile_visibility", e.target.value)}
                          className="text-xs font-semibold text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1.5 rounded-lg border border-[#99D9D2] focus:outline-none"
                        >
                          <option value="public">Public</option>
                          <option value="unlisted">Unlisted</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Contact Sharing</p>
                          <p className="text-xs text-slate-500">Display direct phone number on active property listings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsData?.privacy?.contact_sharing ?? true}
                            onChange={(e) => handleTogglePrivacy("contact_sharing", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006D6A]" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AGENT - PROFILE */}
            {currentSection === "profile" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3]">
                <h2 className="font-black text-slate-800 text-xl mb-6">Agent Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile?.name || ""}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Agency Name</label>
                    <input
                      type="text"
                      value={profile?.agency_name || ""}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, agency_name: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">RERA Registration ID</label>
                    <input
                      type="text"
                      value={profile?.rera_id || ""}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, rera_id: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={profile?.experience_years || 5}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, experience_years: parseInt(e.target.value, 10) }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Operating City</label>
                    <input
                      type="text"
                      value={profile?.city || "Pune"}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, city: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profile?.phone || ""}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Professional Bio</label>
                    <textarea
                      rows={3}
                      value={profile?.bio || ""}
                      onChange={(e) => setProfile(prev => prev ? ({ ...prev, bio: e.target.value }) : null)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      if (!profile) return;
                      try {
                        await updateAgentProfile(profile);
                        showToast("Profile details updated successfully!");
                      } catch (err: any) {
                        alert("Error updating profile: " + err.message);
                      }
                    }}
                    className="bg-[#006D6A] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#004F4D]"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </div>
            )}

            {/* 9. AGENT - VERIFICATION STATUS */}
            {currentSection === "verification" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-xl mb-1">Agent Verification Status</h2>
                  <p className="text-xs text-slate-500 mb-6">
                    AI-assisted verification system for KYC, identity, and professional real estate licensing credentials.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#E6F4F2] border border-[#99D9D2] rounded-2xl p-4">
                      <p className="text-xs text-[#006D6A] font-bold">Identity Verification</p>
                      <p className="font-black text-slate-800 text-base mt-1 flex items-center gap-1.5">
                        <CheckCircle size={16} className="text-green-600" />Verified
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs text-amber-700 font-bold">RERA Registration</p>
                      <p className="font-black text-slate-800 text-base mt-1 flex items-center gap-1.5">
                        <Clock size={16} className="text-amber-500" />Under Review
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs text-slate-500 font-bold">Overall Status</p>
                      <p className="font-black text-slate-800 text-base mt-1 flex items-center gap-1.5">
                        <Shield size={16} className="text-[#006D6A]" />Partially Verified
                      </p>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="border border-slate-200 rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Upload Credential Document</h3>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="pan">PAN Card (KYC)</option>
                        <option value="aadhaar">Aadhaar (KYC)</option>
                        <option value="agency_license">Agency Real Estate License</option>
                        <option value="rera">MahaRERA Registration Certificate</option>
                      </select>

                      <button
                        onClick={() => docFileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                        className="w-full sm:w-auto px-5 py-2 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Upload size={14} />{isUploadingDoc ? "Analyzing Document..." : "Choose File & Upload"}
                      </button>
                      <input
                        type="file"
                        ref={docFileInputRef}
                        accept=".pdf,image/*"
                        onChange={handleDocFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Uploaded Documents List (Part A4) */}
                  <h3 className="font-bold text-slate-800 text-sm mb-3">Submitted Documents</h3>
                  {loadingDocs ? (
                    <div className="space-y-3">
                      {[1, 2].map(n => <div key={n} className="bg-slate-50 h-20 rounded-xl animate-pulse" />)}
                    </div>
                  ) : (!Array.isArray(verificationDocs) || verificationDocs.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      <FileText size={32} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-bold text-slate-600">No verification documents submitted yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Upload your PAN, Aadhaar or MahaRERA certificate to verify your agent profile.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(verificationDocs) ? verificationDocs : []).map(doc => (
                        <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{doc.file_name}</p>
                              <p className="text-xs text-slate-500 capitalize">{doc.document_type.replace(/_/g, " ")} · Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recently"}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                              doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                              doc.status === "RESUBMISSION_REQUIRED" ? "bg-amber-100 text-amber-700" :
                              "bg-[#E6F4F2] text-[#006D6A]"
                            }`}>
                              {doc.status}
                            </span>
                          </div>

                          {doc.extracted_data && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(doc.extracted_data).slice(0, 3).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-[10px] text-slate-400 uppercase">{k.replace("_", " ")}: </span>
                                  <span className="font-semibold text-slate-700">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {doc.rejection_reason && (
                            <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded-lg border border-red-100">
                              Admin Remarks: {doc.rejection_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. AGENT - MESSAGES (Part A5) */}
            {currentSection === "messages" && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#D9E5E3] overflow-hidden flex flex-col md:flex-row h-[600px]">
                {/* Conversations List */}
                <div className="w-full md:w-72 border-r border-slate-100 flex flex-col">
                  <div className="p-4 border-b border-slate-100 font-black text-slate-800 text-base flex justify-between items-center">
                    <span>Client Conversations</span>
                    <button
                      onClick={loadConversations}
                      className="text-slate-400 hover:text-[#006D6A] transition-colors"
                      title="Refresh conversations"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {(!Array.isArray(conversations) || conversations.length === 0) ? (
                      <div className="p-8 text-center text-slate-400">
                        <MessageCircle size={32} className="mx-auto text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-600">No messages yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Direct messages with buyers will appear here.</p>
                      </div>
                    ) : (
                      (Array.isArray(conversations) ? conversations : []).map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveConvId(c.id);
                            loadMessagesForConv(c.id);
                          }}
                          className={`w-full p-4 text-left transition-colors flex items-center gap-3 ${
                            activeConvId === c.id ? "bg-[#E6F4F2]" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#006D6A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {c.title ? c.title.replace("Chat between", "").trim()[0] : "C"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{c.title || "Conversation"}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {(Array.isArray(c.messages) && c.messages.length > 0) ? c.messages[c.messages.length - 1]?.content : "Tap to chat"}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Chat Window */}
                <div className="flex-1 flex flex-col justify-between bg-slate-50/50">
                  <div className="p-4 border-b border-slate-100 bg-white font-bold text-sm text-slate-800">
                    {(conversations || []).find(c => c.id === activeConvId)?.title || "Select conversation"}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(chatMessages || []).map(m => {
                      const isMe = m.sender_id === profile?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isMe ? "bg-[#006D6A] text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                          }`}>
                            <p className="leading-relaxed">{m.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-teal-200" : "text-slate-400"}`}>
                              {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message to client..."
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                    <button
                      type="submit"
                      disabled={!newMsgText.trim()}
                      className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#004F4D] disabled:opacity-40"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 11. AGENT - PROMOTIONS */}
            {currentSection === "promotions" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-xl mb-1">Promote My Listings</h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Boost listing placement on the SAI homepage feed and top of location search results.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { name: "Basic", price: "₹2,999", duration: "30 Days", features: ["Search result boost", "Sponsored badge", "Basic CTR analytics"] },
                      { name: "Premium", price: "₹5,999", duration: "30 Days", features: ["Top 3 search placement", "Home feed highlight", "SMS lead alerts", "Priority indexing"] },
                      { name: "Elite", price: "₹9,999", duration: "30 Days", features: ["Guaranteed #1 placement", "AI Smart Recommendation", "Dedicated marketing blast", "Full CTR breakdown"] },
                    ].map(plan => (
                      <div key={plan.name} className="border-2 border-[#99D9D2] bg-white rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1 rounded-full">
                            {plan.name} Plan
                          </span>
                          <p className="font-black text-slate-800 text-2xl mt-2">{plan.price}</p>
                          <p className="text-xs text-slate-400 mb-3">{plan.duration}</p>
                          <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                            {plan.features.map(f => (
                              <li key={f} className="flex items-center gap-1.5">
                                <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={async () => {
                            if (!listings || listings.length === 0) {
                              alert("Please add a listing first to promote");
                              return;
                            }
                            try {
                              await createAgentPromotion({
                                property_id: listings[0].id,
                                plan_type: plan.name,
                                duration_days: 30
                              });
                              showToast(`Promotion for ${plan.name} plan activated!`);
                            } catch (err: any) {
                              alert("Promotion failed: " + err.message);
                            }
                          }}
                          className="w-full py-2 bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Select {plan.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 12. AGENT - ANALYTICS */}
            {currentSection === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-black text-slate-800 text-xl">Performance Analytics</h2>
                      <p className="text-xs text-slate-500">Calculated strictly from real database visitor and enquiry records.</p>
                    </div>
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {["7d", "30d", "90d"].map(r => (
                        <button
                          key={r}
                          onClick={() => { setAnalyticsRange(r); loadAnalytics(r); }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            analyticsRange === r ? "bg-white text-[#006D6A] shadow-sm" : "text-slate-500"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold">Total Listings</p>
                      <p className="font-black text-slate-800 text-2xl mt-1">{analytics?.total_listings || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold">Total Views</p>
                      <p className="font-black text-slate-800 text-2xl mt-1">{analytics?.total_views || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold">Buyer Enquiries</p>
                      <p className="font-black text-slate-800 text-2xl mt-1">{analytics?.total_enquiries || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold">Tour Conversion</p>
                      <p className="font-black text-[#006D6A] text-2xl mt-1">{analytics?.conversion_rate || "0%"}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm mb-3">Property Performance Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Property</th>
                          <th className="py-2.5 px-3">Locality</th>
                          <th className="py-2.5 px-3 text-center">Views</th>
                          <th className="py-2.5 px-3 text-center">Enquiries</th>
                          <th className="py-2.5 px-3 text-center">Saved</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics?.property_performance?.map(p => (
                          <tr key={p.id}>
                            <td className="py-3 px-3 font-bold text-slate-800">{p.title}</td>
                            <td className="py-3 px-3 text-slate-500">{p.locality}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">{p.views}</td>
                            <td className="py-3 px-3 text-center font-bold text-[#006D6A]">{p.enquiries}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">{p.saves}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 13. AGENT - SUBSCRIPTION */}
            {currentSection === "subscription" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3]">
                <h2 className="font-black text-slate-800 text-xl mb-1">Agent Subscription</h2>
                <p className="text-xs text-slate-500 mb-6">Current subscription tier and member benefits.</p>

                <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] text-white p-6 rounded-2xl flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-3 py-1 rounded-full">Active Plan</span>
                    <h3 className="font-black text-2xl mt-2">SAI Pro Agent</h3>
                    <p className="text-xs text-[#E6F4F2] mt-1">Unlimited listings · Verified badge · Direct phone sharing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-teal-200">Renews on</p>
                    <p className="font-bold text-sm">Dec 31, 2026</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* EDIT LISTING MODAL */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">Edit Listing #{editingListing.id}</h3>
              <button onClick={() => setEditingListing(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={editingListing.title}
                  onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingListing.price}
                    onChange={(e) => setEditingListing({ ...editingListing, price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={editingListing.status}
                    onChange={(e) => setEditingListing({ ...editingListing, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="available">Available (Active)</option>
                    <option value="inactive">Inactive</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingListing.description || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingListing(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveListingEdit}
                className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold hover:bg-[#004F4D]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE SITE VISIT MODAL */}
      {rescheduleModalVisit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Reschedule Site Visit</h3>
            <p className="text-xs text-slate-500 mb-4">Client: {rescheduleModalVisit.client_name}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRescheduleModalVisit(null)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleRescheduleSubmit} className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE VISIT MODAL */}
      {isScheduleVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Schedule New Site Visit</h3>
            <p className="text-xs text-slate-500 mb-4">Book a walkthrough appointment for a property.</p>

            <form onSubmit={handleScheduleNewVisitSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Property</label>
                <select
                  value={newVisitData.property_id}
                  onChange={(e) => setNewVisitData({ ...newVisitData, property_id: parseInt(e.target.value, 10) })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={newVisitData.date}
                    onChange={(e) => setNewVisitData({ ...newVisitData, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                  <input
                    type="time"
                    value={newVisitData.time}
                    onChange={(e) => setNewVisitData({ ...newVisitData, time: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newVisitData.notes}
                  onChange={(e) => setNewVisitData({ ...newVisitData, notes: e.target.value })}
                  placeholder="e.g. Client requested parking walkthrough"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setIsScheduleVisitModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT DETAILS MODAL */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-lg">{selectedClientDetail.name}</h3>
                <p className="text-xs text-slate-500">Client profile & requirements</p>
              </div>
              <button onClick={() => setSelectedClientDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-2">Property Requirements</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">Target City:</span> <span className="font-bold">{selectedClientDetail.requirements?.city}</span></div>
                  <div><span className="text-slate-400">Locality:</span> <span className="font-bold">{selectedClientDetail.requirements?.locality}</span></div>
                  <div><span className="text-slate-400">Budget:</span> <span className="font-bold text-[#006D6A]">{selectedClientDetail.requirements?.budget}</span></div>
                  <div><span className="text-slate-400">BHK:</span> <span className="font-bold">{selectedClientDetail.requirements?.bhk}</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Interaction History</h4>
                <div className="space-y-2">
                  {selectedClientDetail.interaction_history?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </div>
                      <p className="text-slate-600">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelectedClientDetail(null)} className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EMAIL MODAL */}
      {editEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Edit Account Email</h3>
            <p className="text-xs text-slate-500 mb-4">Enter your new validated email address.</p>
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditEmailModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleSaveEmail} className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">
                Save Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PHONE MODAL */}
      {editPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Edit Account Phone</h3>
            <p className="text-xs text-slate-500 mb-4">Enter your updated contact phone number.</p>
            <div className="relative flex items-center mb-4">
              <span className="absolute left-3 text-xs font-bold text-slate-500 select-none pointer-events-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="w-full border border-slate-200 rounded-xl pl-11 pr-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditPhoneModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleSavePhone} className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">
                Save Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
