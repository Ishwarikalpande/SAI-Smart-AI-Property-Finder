import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Building, Plus, Layers, Grid3X3, Zap, TrendingUp,
  MessageCircle, BarChart2, Shield, User, Settings, ChevronLeft, Search,
  CheckCircle, Clock, X, Phone, Mail, Edit3, Trash2, Send, ExternalLink,
  Upload, AlertCircle, FileText, Star, ArrowUpRight, DollarSign, Eye, RefreshCw,
  Play, Pause, Film
} from "lucide-react";
import { PropertyWalkthrough } from "./property/PropertyWalkthrough";
import { SaiLogo } from "./SaiLogo";
import {
  fetchBuilderProfile, updateBuilderProfile, fetchBuilderSettings, updateBuilderSettings,
  fetchBuilderProjects, createBuilderProject, deleteBuilderProject,
  addProjectTower, addProjectUnit, updateUnitStatus, fetchBuilderEnquiries,
  updateBuilderEnquiryStatus, fetchBuilderAnalytics, fetchBuilderPromotions,
  createBuilderPromotion, updateBuilderPromotion, deleteBuilderPromotion, fetchBuilderRevenue, uploadVerificationDocument,
  fetchMyVerificationDocuments, fetchConversations, fetchMessages, sendMessage,
  BuilderProfileData, BuilderProjectItem, BuilderTowerItem, BuilderUnitItem, BuilderEnquiryItem, BuilderAnalyticsData,
  BuilderPromotionItem, VerificationDocumentItem, ConversationItem, MessageItem,
  generateBuildingUnits
} from "../../api";

interface BuilderPortalProps {
  navigate: (pg: any) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  onOpenBuilding3D?: (buildingId?: number, floor?: number, unit?: string) => void;
}

export function BuilderPortal({ navigate, activeSection, setActiveSection, onOpenBuilding3D }: BuilderPortalProps) {
  // Normalize section IDs so deep links and alternative names work
  const currentSection = useMemo(() => {
    if (activeSection === "add-project") return "add";
    if (activeSection === "settings") return "builder-settings";
    if (activeSection === "verification") return "docs";
    if (activeSection === "promote") return "promotions";
    if (activeSection === "leads") return "enquiries";
    return activeSection || "overview";
  }, [activeSection]);

  const [profile, setProfile] = useState<BuilderProfileData | null>(null);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [projects, setProjects] = useState<BuilderProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [walkthroughProp, setWalkthroughProp] = useState<{ id: number; title: string } | null>(null);
  const [enquiries, setEnquiries] = useState<BuilderEnquiryItem[]>([]);
  const [analytics, setAnalytics] = useState<BuilderAnalyticsData | null>(null);
  const [promotions, setPromotions] = useState<BuilderPromotionItem[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocumentItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [newMsgText, setNewMsgText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Project Form State
  const [newProject, setNewProject] = useState({
    name: "",
    city: "Pune",
    locality: "Baner",
    address: "",
    description: "",
    construction_status: "Under Construction"
  });
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Add Tower Modal State (Part C2)
  const [selectedProjectIdForTower, setSelectedProjectIdForTower] = useState<number | null>(null);
  const [newTowerName, setNewTowerName] = useState("");
  const [isAddTowerModalOpen, setIsAddTowerModalOpen] = useState(false);
  const [addTowerForm, setAddTowerForm] = useState({
    project_id: 0,
    name: "Tower C",
    code: "C",
    floors_count: 10,
    units_per_floor: 4,
    description: "Modern high-rise residential tower with premium finishes",
    status: "Under Construction"
  });

  // Tower Details Modal (Part C4, C8)
  const [selectedTowerDetailModal, setSelectedTowerDetailModal] = useState<{ tower: BuilderTowerItem; project: BuilderProjectItem } | null>(null);

  // Inventory Filters State (Part C6, C7)
  const [selectedInventoryProjectId, setSelectedInventoryProjectId] = useState<number | null>(null);
  const [selectedInventoryTowerId, setSelectedInventoryTowerId] = useState<string>("all");

  // Edit Modals for Settings
  const [editCompanyNameModal, setEditCompanyNameModal] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState("");
  const [editReraModal, setEditReraModal] = useState(false);
  const [tempReraId, setTempReraId] = useState("");
  const [editSupportEmailModal, setEditSupportEmailModal] = useState(false);
  const [tempSupportEmail, setTempSupportEmail] = useState("");

  // Edit Profile Modal
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    company_name: "",
    developer_registration_no: "",
    rera_id: "",
    support_email: "",
    city: "",
    company_type: "",
    office_address: ""
  });

  // Promote Project Modal
  const [promoteModal, setPromoteModal] = useState(false);
  const [selectedProjectForPromo, setSelectedProjectForPromo] = useState<number | null>(null);
  const [promoPlanType, setPromoPlanType] = useState("Mega Launch");
  const [promoDuration, setPromoDuration] = useState(30);

  // Document Upload
  const [uploadDocType, setUploadDocType] = useState("company_registration");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  useEffect(() => {
    if (currentSection === "projects" || currentSection === "towers" || currentSection === "inventory" || currentSection === "overview") {
      loadProjects();
    }
    if (currentSection === "enquiries" || currentSection === "overview") {
      loadEnquiries();
    }
    if (currentSection === "analytics" || currentSection === "overview") {
      loadAnalytics();
    }
    if (currentSection === "promotions" || currentSection === "overview") {
      loadPromotions();
    }
    if (currentSection === "revenue" || currentSection === "overview") {
      loadRevenue();
    }
    if (currentSection === "docs") {
      loadDocs();
    }
    if (currentSection === "messages") {
      loadConversations();
    }
  }, [currentSection]);

  const loadProfile = async () => {
    try {
      const data = await fetchBuilderProfile();
      setProfile(data);
      setTempProfile({
        company_name: data.company_name || "",
        developer_registration_no: data.developer_registration_no || "",
        rera_id: data.rera_id || "",
        support_email: data.support_email || "",
        city: data.city || "",
        company_type: data.company_type || "",
        office_address: data.office_address || ""
      });
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const data = await fetchBuilderSettings();
      setSettingsData(data);
    } catch {}
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await fetchBuilderProjects();
      const safeData = Array.isArray(data) ? data : [];
      setProjects(safeData);
      if (safeData.length > 0 && !selectedInventoryProjectId) {
        setSelectedInventoryProjectId(safeData[0].id);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadEnquiries = async () => {
    try {
      const data = await fetchBuilderEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      setEnquiries([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchBuilderAnalytics();
      setAnalytics(data);
    } catch {}
  };

  const loadPromotions = async () => {
    try {
      const data = await fetchBuilderPromotions();
      setPromotions(Array.isArray(data) ? data : []);
    } catch {
      setPromotions([]);
    }
  };

  const loadRevenue = async () => {
    try {
      const data = await fetchBuilderRevenue();
      setRevenueData(data);
    } catch {}
  };

  const loadDocs = async () => {
    try {
      const docs = await fetchMyVerificationDocuments();
      setVerificationDocs(Array.isArray(docs) ? docs : []);
    } catch {
      setVerificationDocs([]);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !activeConvId) return;
    try {
      const msg = await sendMessage(activeConvId, newMsgText.trim());
      setChatMessages(prev => [...prev, msg]);
      setNewMsgText("");
      showToast("Message sent");
    } catch (err: any) {
      alert("Error sending message: " + err.message);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert("Project name is required");
      return;
    }
    setIsSubmittingProject(true);
    try {
      const res = await createBuilderProject(newProject);
      showToast("Project created successfully!");
      setProjects(prev => [res.project, ...prev]);
      setActiveSection("projects");
      setNewProject({
        name: "",
        city: profile?.city || "Pune",
        locality: "",
        address: "",
        description: "",
        construction_status: "Under Construction"
      });
    } catch (err: any) {
      alert("Failed to create project: " + err.message);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteBuilderProject(id);
      showToast("Project deleted");
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleAddTowerSubmit = async () => {
    if (!selectedProjectIdForTower || !newTowerName.trim()) return;
    try {
      await addProjectTower(selectedProjectIdForTower, {
        name: newTowerName.trim(),
        code: newTowerName.trim().slice(-1),
        floors_count: 10,
        units_per_floor: 4,
        total_units: 40,
        status: "Under Construction"
      });
      showToast("Tower added successfully!");
      setSelectedProjectIdForTower(null);
      setNewTowerName("");
      await loadProjects();
      await loadAnalytics();
    } catch (err: any) {
      alert("Failed to add tower: " + err.message);
    }
  };

  const handleCreateTowerFullSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pid = addTowerForm.project_id || ((projects && projects.length > 0) ? projects[0].id : 0);
    if (!pid) {
      alert("Please select a project for the tower.");
      return;
    }
    if (!addTowerForm.name.trim()) {
      alert("Please enter a Tower Name.");
      return;
    }

    try {
      const floors = Number(addTowerForm.floors_count) || 10;
      const unitsPerFloor = Number(addTowerForm.units_per_floor) || 4;
      await addProjectTower(pid, {
        name: addTowerForm.name.trim(),
        code: addTowerForm.code.trim() || addTowerForm.name.trim().slice(-1),
        floors_count: floors,
        units_per_floor: unitsPerFloor,
        total_units: floors * unitsPerFloor,
        description: addTowerForm.description,
        status: addTowerForm.status
      });
      showToast(`${addTowerForm.name} created successfully with ${floors * unitsPerFloor} units!`);
      setIsAddTowerModalOpen(false);
      setSelectedProjectIdForTower(null);
      await loadProjects();
      await loadAnalytics();
    } catch (err: any) {
      alert("Failed to add tower: " + err.message);
    }
  };

  const handleUpdateUnitStatus = async (unitId: number, status: string) => {
    try {
      await updateUnitStatus(unitId, status);
      showToast(`Unit marked as ${status.toUpperCase()}`);
      loadProjects();
      loadAnalytics();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleUpdateEnquiry = async (enquiryId: number, status: string) => {
    try {
      await updateBuilderEnquiryStatus(enquiryId, status);
      showToast(`Enquiry updated to ${status}`);
      loadEnquiries();
    } catch (err: any) {
      alert("Failed to update enquiry: " + err.message);
    }
  };

  const handleCreatePromo = async () => {
    try {
      await createBuilderPromotion({
        project_id: selectedProjectForPromo || undefined,
        plan_type: promoPlanType,
        duration_days: promoDuration
      });
      showToast(`Promotion launched with ${promoPlanType} plan!`);
      setPromoteModal(false);
      loadPromotions();
    } catch (err: any) {
      alert("Failed to launch promotion: " + err.message);
    }
  };

  const handleTogglePromoStatus = async (promoId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Paused" : "Active";
    try {
      await updateBuilderPromotion(promoId, { status: nextStatus });
      showToast(`Promotion status set to ${nextStatus}`);
      await loadPromotions();
    } catch (err: any) {
      alert("Failed to update promotion: " + err.message);
    }
  };

  const handleDeletePromo = async (promoId: number) => {
    if (!window.confirm("Are you sure you want to cancel and delete this promotion?")) return;
    try {
      await deleteBuilderPromotion(promoId);
      showToast("Promotion cancelled and removed");
      await loadPromotions();
    } catch (err: any) {
      alert("Failed to delete promotion: " + err.message);
    }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", uploadDocType);
      fd.append("account_type", "builder");
      await uploadVerificationDocument(fd);
      showToast("Verification document uploaded. AI analysis completed.");
      loadDocs();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBuilderProfile(tempProfile);
      showToast("Profile details updated!");
      setEditProfileModal(false);
      loadProfile();
    } catch (err: any) {
      alert("Failed to save profile: " + err.message);
    }
  };

  // Nav Items with icons matching Section 25
  const builderNav = [
    { id: "overview", label: "Builder Overview", icon: LayoutDashboard },
    { id: "projects", label: "My Apartment Projects", icon: Building },
    { id: "add", label: "Add Apartment Project", icon: Plus },
    { id: "towers", label: "Towers / Buildings", icon: Layers },
    { id: "inventory", label: "Availability & Inventory", icon: Grid3X3 },
    { id: "promotions", label: "Promote Projects", icon: Zap },
    { id: "revenue", label: "Revenue", icon: TrendingUp },
    { id: "enquiries", label: "Buyer Enquiries", icon: MessageCircle },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "docs", label: "Verification & Documents", icon: Shield },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "profile", label: "Builder Profile", icon: User },
    { id: "builder-settings", label: "Settings", icon: Settings },
  ];

  const builderInitials = useMemo(() => {
    const name = profile?.company_name || "PL";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006D6A] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle size={18} className="text-[#99D9D2] flex-shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BUILDER HEADER */}
        <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] rounded-3xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-[#005B58]">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center pr-3 border-r border-white/20">
              <SaiLogo size="sm" variant="light" subtitle="Builder Portal" />
            </div>
            <button
              onClick={() => navigate("role")}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm transition-all flex-shrink-0 border border-white/20 active:scale-95"
            >
              <ChevronLeft size={16} />Back
            </button>

            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow border border-white/20 text-white font-black text-xl">
              {builderInitials}
            </div>

            <div>
              <p className="text-[#D9E5E3] text-xs font-bold uppercase tracking-wider mb-0.5">Builder Portal</p>
              <h1 className="text-2xl font-black text-white">{profile?.company_name || "Prestige Landmarks"}</h1>
              <p className="text-[#D9E5E3] text-sm flex items-center gap-1.5 mt-0.5">
                <span>{profile?.company_type || "Real Estate Developer"} · {profile?.city || "Pune"}</span>
                <span className="ml-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">✓ Verified Developer</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveSection("add")}
            className="bg-white text-[#006D6A] font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#E6F4F2] transition-colors shadow-lg active:scale-95 text-sm"
          >
            <Plus size={16} />Add Apartment Project
          </button>
        </div>

        {/* BODY LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,109,106,0.08)] border border-[#D9E5E3] overflow-hidden sticky top-6">
              <div className="p-3.5 border-b border-[#D9E5E3] flex items-center justify-center">
                <SaiLogo size="sm" subtitle="Builder Portal" />
              </div>
              {builderNav.map(({ id, label, icon: Icon }) => (
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
            {builderNav.map(({ id, label, icon: Icon }) => (
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
            {/* 1. BUILDER OVERVIEW */}
            {currentSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Projects", val: analytics?.total_projects || projects?.length || 2, color: "from-[#006D6A] to-[#004F4D]" },
                    { label: "Total Units", val: analytics?.total_units || 120, color: "from-[#008F8C] to-[#006D6A]" },
                    { label: "Available Units", val: analytics?.available_units || 82, color: "from-emerald-600 to-teal-800" },
                    { label: "Total Sales", val: analytics?.total_revenue || "₹16.4 Cr", color: "from-indigo-600 to-purple-800" },
                  ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-5 text-white shadow-md`}>
                      <p className="font-black text-2xl">{stat.val}</p>
                      <p className="text-white/80 text-xs font-semibold mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Projects Summary */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-lg">Active Developments</h3>
                    <button onClick={() => setActiveSection("projects")} className="text-xs font-bold text-[#006D6A] hover:underline">
                      View All ({projects?.length || 0})
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(projects || []).map(pr => (
                      <div key={pr.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{pr.name}</p>
                          <p className="text-xs text-slate-500">{pr.locality}, {pr.city} · {pr.construction_status}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#006D6A]">{pr.towers?.length || 1} Towers</span>
                          <span className="text-slate-300 mx-1">·</span>
                          <span className="text-xs text-slate-600">{pr.total_units} Units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#008F8C] to-[#004F4D] rounded-3xl p-6 text-white flex flex-col justify-between">
                    <div>
                      <Zap size={24} className="mb-2 text-amber-300" />
                      <h4 className="font-black text-base">Promote Projects</h4>
                      <p className="text-xs text-white/80 mt-1">Boost project reach and get premier buyer placements across SAI search.</p>
                    </div>
                    <button
                      onClick={() => setActiveSection("promotions")}
                      className="mt-4 bg-white text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-xl self-start hover:bg-[#E6F4F2]"
                    >
                      Promote Now
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between">
                    <div>
                      <Shield size={24} className="mb-2 text-[#99D9D2]" />
                      <h4 className="font-black text-base">RERA & Verification</h4>
                      <p className="text-xs text-white/80 mt-1">Upload municipal approvals, layout documents, and MahaRERA registration.</p>
                    </div>
                    <button
                      onClick={() => setActiveSection("docs")}
                      className="mt-4 bg-[#E6F4F2] text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-xl self-start hover:bg-white"
                    >
                      View Documents
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MY APARTMENT PROJECTS */}
            {currentSection === "projects" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">My Apartment Projects</h2>
                    <p className="text-xs text-slate-500">Residential and commercial township complexes.</p>
                  </div>
                  <button
                    onClick={() => setActiveSection("add")}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D]"
                  >
                    <Plus size={14} />Add Apartment Project
                  </button>
                </div>

                <div className="space-y-4">
                  {projects.map(pr => (
                    <div key={pr.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-black text-slate-800 text-lg">{pr.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{pr.location} · {pr.construction_status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedProjectIdForTower(pr.id)}
                            className="bg-[#E6F4F2] text-[#006D6A] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                          >
                            <Plus size={12} />Add Tower
                          </button>
                          <button
                            onClick={() => handleDeleteProject(pr.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">TOWERS</span>
                          <p className="font-black text-slate-800 text-base">{pr.towers?.length || 1}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">TOTAL UNITS</span>
                          <p className="font-black text-slate-800 text-base">{pr.total_units}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">AVAILABLE</span>
                          <p className="font-black text-emerald-600 text-base">{pr.available_units}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">SOLD / BOOKED</span>
                          <p className="font-black text-[#006D6A] text-base">{pr.sold_units + pr.booked_units}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setActiveSection("inventory")}
                          className="py-2 px-4 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D]"
                        >
                          Manage Inventory
                        </button>
                        <button
                          onClick={() => setActiveSection("towers")}
                          className="py-2 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                        >
                          View Towers
                        </button>
                        <button
                          onClick={() => setWalkthroughProp({ id: Number(pr.id) || 1, title: pr.name })}
                          className="py-2 px-4 bg-gradient-to-r from-teal-600 to-[#008F8C] hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Film size={13} />
                          Preview Walkthrough
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Walkthrough Preview Modal for Builder */}
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

            {/* 3. ADD APARTMENT PROJECT FORM */}
            {currentSection === "add" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3]">
                <div className="mb-6 border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl">Add New Apartment Project</h2>
                    <p className="text-xs text-slate-500 mt-1">Register a new residential or mixed-use township development.</p>
                  </div>
                  <button onClick={() => setActiveSection("projects")} className="text-xs text-[#006D6A] font-bold hover:underline">
                    Back to Projects
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prestige Heights"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pune"
                        value={newProject.city}
                        onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Locality *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Baner"
                        value={newProject.locality}
                        onChange={(e) => setNewProject({ ...newProject, locality: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Survey No. 42, Near High Street, Baner"
                      value={newProject.address}
                      onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Construction Status</label>
                    <select
                      value={newProject.construction_status}
                      onChange={(e) => setNewProject({ ...newProject, construction_status: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                    >
                      <option value="Under Construction">Under Construction</option>
                      <option value="Ready to Move">Ready to Move</option>
                      <option value="New Launch">New Launch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Description</label>
                    <textarea
                      rows={3}
                      placeholder="Highlights, specifications, and club amenities..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingProject}
                    className="w-full bg-[#006D6A] text-white font-bold py-3.5 rounded-xl hover:bg-[#004F4D] transition-colors shadow-lg disabled:opacity-50 text-sm"
                  >
                    {isSubmittingProject ? "Creating Project..." : "Register Apartment Project"}
                  </button>
                </form>
              </div>
            )}

            {/* 4. TOWERS / BUILDINGS */}
            {currentSection === "towers" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg mb-1">Towers & Buildings</h2>
                    <p className="text-xs text-slate-500">Manage towers, floor capacities, and unit layout per building.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (projects && projects.length > 0) {
                        setAddTowerForm(prev => ({ ...prev, project_id: projects[0].id }));
                      }
                      setIsAddTowerModalOpen(true);
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Add Tower
                  </button>
                </div>

                {(!Array.isArray(projects) || projects.length === 0) ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                    <Building size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No towers added yet</p>
                    <p className="text-slate-400 text-xs mt-1">Create an apartment project and add residential towers to get started.</p>
                  </div>
                ) : (
                  projects.map(pr => {
                    const towersList = pr.towers || [];
                    return (
                      <div key={pr.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="font-bold text-slate-800 text-base">{pr.name} Towers</h3>
                            <p className="text-xs text-slate-400">{towersList.length} Towers registered in this project</p>
                          </div>
                          <button
                            onClick={() => {
                              setAddTowerForm(prev => ({ ...prev, project_id: pr.id }));
                              setIsAddTowerModalOpen(true);
                            }}
                            className="bg-[#E6F4F2] text-[#006D6A] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 hover:bg-[#d4ece8] transition-colors"
                          >
                            <Plus size={12} /> Add Tower
                          </button>
                        </div>

                        {towersList.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-semibold">No towers added to {pr.name} yet.</p>
                            <button
                              onClick={() => {
                                setAddTowerForm(prev => ({ ...prev, project_id: pr.id }));
                                setIsAddTowerModalOpen(true);
                              }}
                              className="mt-2 text-xs font-bold text-[#006D6A] hover:underline"
                            >
                              + Add Tower to this project
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {towersList.map(tw => {
                              const units = tw.units || [];
                              const totalUnits = units.length || tw.total_units || 40;
                              const availableCount = units.filter(u => u.status === 'available').length;
                              const reservedCount = units.filter(u => u.status === 'reserved').length;
                              const bookedCount = units.filter(u => u.status === 'booked').length;
                              const soldCount = units.filter(u => u.status === 'sold').length;

                              return (
                                <div key={tw.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-shadow flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#006D6A] text-white flex items-center justify-center font-black text-xs">
                                          {tw.name.slice(-1) || "T"}
                                        </div>
                                        <h4 className="font-black text-slate-800 text-base">{tw.name}</h4>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {tw.floors || 10} Floors
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{totalUnits} Total Units ({units.length > 0 ? units[0].type : "2 & 3 BHK"})</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-100 mb-3">
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block">AVAILABLE</span>
                                        <span className="font-black text-emerald-600">{availableCount} Units</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block">BOOKED / SOLD</span>
                                        <span className="font-black text-[#006D6A]">{bookedCount + soldCount} Units</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedTowerDetailModal({ tower: tw, project: pr })}
                                      className="flex-1 py-2 bg-white hover:bg-[#E6F4F2] text-[#006D6A] font-bold text-xs rounded-xl border border-[#006D6A]/30 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                      <Eye size={13} /> Details
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (onOpenBuilding3D) {
                                          onOpenBuilding3D(tw.id);
                                        } else {
                                          navigate("building-3d");
                                        }
                                      }}
                                      className="flex-1 py-2 bg-gradient-to-r from-teal-600 to-[#008F8C] hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                      <Building size={13} /> 3D Tower
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 5. AVAILABILITY & INVENTORY */}
            {currentSection === "inventory" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg mb-1">Availability & Inventory</h2>
                    <p className="text-xs text-slate-500">Real-time unit inventory status management by project and tower.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Project Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Project</label>
                      <select
                        value={selectedInventoryProjectId || (projects[0]?.id || "")}
                        onChange={(e) => {
                          setSelectedInventoryProjectId(Number(e.target.value));
                          setSelectedInventoryTowerId("all");
                        }}
                        className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#006D6A]"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tower Selector (Part C7) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Tower Filter</label>
                      <select
                        value={selectedInventoryTowerId}
                        onChange={(e) => setSelectedInventoryTowerId(e.target.value)}
                        className="text-xs font-bold bg-[#E6F4F2] text-[#006D6A] border border-[#99D9D2] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#006D6A]"
                      >
                        <option value="all">All Towers</option>
                        {(() => {
                          const curProj = (projects || []).find(p => p.id === (selectedInventoryProjectId || projects?.[0]?.id));
                          return (curProj?.towers || []).map(t => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>
                </div>

                {(() => {
                  const currentProject = (projects || []).find(p => p.id === (selectedInventoryProjectId || projects?.[0]?.id)) || projects?.[0];
                  if (!currentProject) {
                    return (
                      <div className="bg-white rounded-3xl p-10 text-center border border-[#D9E5E3]">
                        <p className="font-bold text-slate-700 text-sm">No projects found.</p>
                      </div>
                    );
                  }

                  // Filter towers and units strictly
                  const relevantTowers = selectedInventoryTowerId === "all"
                    ? (currentProject.towers || [])
                    : (currentProject.towers || []).filter(t => String(t.id) === selectedInventoryTowerId);

                  const allUnits = relevantTowers.flatMap(t => (t.units || []).map(u => ({ ...u, tower_name: t.name, tower_id: t.id })));

                  return (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-black text-slate-800 text-base">{currentProject.name} — Units Inventory</h3>
                          <p className="text-xs text-slate-400">
                            Showing {allUnits.length} units {selectedInventoryTowerId !== "all" ? `filtered by selected tower` : `across all towers`}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1.5 rounded-full">
                          {allUnits.filter(u => u.status === 'available').length} Available
                        </span>
                      </div>

                      {allUnits.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <p className="font-bold text-slate-600 text-sm">No units available.</p>
                          <p className="text-xs text-slate-400 mt-1">Add units to this tower to view them here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                                <th className="py-2.5 px-3">Unit #</th>
                                <th className="py-2.5 px-3">Tower</th>
                                <th className="py-2.5 px-3">BHK</th>
                                <th className="py-2.5 px-3">Area</th>
                                <th className="py-2.5 px-3">Price</th>
                                <th className="py-2.5 px-3">Parking</th>
                                <th className="py-2.5 px-3 text-right">Status Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {allUnits.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-3 font-bold text-slate-800">{u.unit_number}</td>
                                  <td className="py-3 px-3 font-semibold text-slate-600">{u.tower_name}</td>
                                  <td className="py-3 px-3">{u.type}</td>
                                  <td className="py-3 px-3 text-slate-500">{u.area}</td>
                                  <td className="py-3 px-3 font-bold text-slate-700">{u.price_display}</td>
                                  <td className="py-3 px-3 text-slate-400">{u.parking}</td>
                                  <td className="py-3 px-3 text-right">
                                    <select
                                      value={u.status}
                                      onChange={(e) => handleUpdateUnitStatus(u.id, e.target.value)}
                                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                                        u.status === "available" ? "bg-green-50 text-green-700 border-green-200" :
                                        u.status === "reserved" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                        u.status === "booked" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      <option value="available">AVAILABLE</option>
                                      <option value="reserved">RESERVED</option>
                                      <option value="booked">BOOKED</option>
                                      <option value="sold">SOLD</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 6. PROMOTE PROJECTS */}
            {currentSection === "promotions" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Promote Projects</h2>
                    <p className="text-xs text-slate-500">Launch marketing spotlights and verified banner promotions for apartment projects.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (projects.length > 0 && !selectedProjectForPromo) {
                        setSelectedProjectForPromo(projects[0].id);
                      }
                      setPromoteModal(true);
                    }}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#004F4D] transition-colors shadow-sm"
                  >
                    <Plus size={14} /> New Promotion
                  </button>
                </div>

                {/* Available Promotion Packages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Featured Project", cost: "₹9,999", dur: "15 Days", feat: ["Homepage Spotlight", "3,000+ Verified Buyers", "Lead Alerts"] },
                    { title: "Mega Launch", cost: "₹19,999", dur: "30 Days", feat: ["Search Priority #1", "Targeted Push Notifications", "WhatsApp Campaign"] },
                    { title: "Township Spotlight", cost: "₹34,999", dur: "60 Days", feat: ["Full City Banner Takeover", "AI Assistant Top Recommendation", "Dedicated Account Mgr"] },
                  ].map(plan => (
                    <div key={plan.title} className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1 rounded-full uppercase">Campaign Plan</span>
                        <h3 className="font-black text-slate-800 text-lg mt-2">{plan.title}</h3>
                        <p className="font-black text-2xl text-[#006D6A] mt-1">{plan.cost} <span className="text-xs text-slate-400 font-normal">/ {plan.dur}</span></p>
                        <ul className="mt-4 space-y-2 text-xs text-slate-600">
                          {plan.feat.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-[#008F8C]" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          setPromoPlanType(plan.title);
                          if (projects.length > 0 && !selectedProjectForPromo) {
                            setSelectedProjectForPromo(projects[0].id);
                          }
                          setPromoteModal(true);
                        }}
                        className="mt-6 w-full py-2.5 bg-[#006D6A] text-white text-xs font-bold rounded-xl hover:bg-[#004F4D] transition-colors"
                      >
                        Activate Plan
                      </button>
                    </div>
                  ))}
                </div>

                {/* Active Promotions List (Part B1, B2) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">Active Promotions & Campaigns</h3>
                      <p className="text-xs text-slate-400">Live campaign performance tracking for your projects</p>
                    </div>
                    <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1 rounded-full">
                      {(Array.isArray(promotions) ? promotions : []).length} Campaigns
                    </span>
                  </div>

                  {(!Array.isArray(promotions) || promotions.length === 0) ? (
                    <div className="text-center py-10">
                      <Zap size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">No promotions yet.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Launch a campaign above to boost visibility for your projects.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(promotions || []).map(pr => {
                        const proj = (projects || []).find(p => p.id === pr.project_id);
                        const imgSrc = pr.project_image || proj?.img || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80";
                        const isPaused = (pr.status || "").toLowerCase() === "paused";

                        return (
                          <div key={pr.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                              <div className="relative h-40 w-full overflow-hidden">
                                <img
                                  src={imgSrc}
                                  alt={pr.project_name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute top-3 left-3">
                                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                    isPaused ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                  }`}>
                                    {pr.status || "Active Promotion"}
                                  </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                  <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    {pr.plan_type}
                                  </span>
                                </div>
                                <div className="absolute bottom-3 left-3 text-white">
                                  <h4 className="font-black text-base drop-shadow-sm">{pr.project_name}</h4>
                                  <p className="text-xs text-white/80 drop-shadow-sm">{proj?.city ? `${proj.locality}, ${proj.city}` : "Pune"}</p>
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-100 mb-3">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Views</span>
                                    <span className="font-black text-slate-800 text-sm">{pr.impressions || 245}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Clicks</span>
                                    <span className="font-black text-slate-800 text-sm">{pr.clicks || 38}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Leads</span>
                                    <span className="font-black text-[#006D6A] text-sm">{pr.leads || pr.enquiries || 12}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>Budget / Duration:</span>
                                  <span className="font-bold text-slate-700">₹{(pr.cost || pr.budget || 19999).toLocaleString()} · {pr.duration_days} Days</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                  <span>Start Date:</span>
                                  <span className="font-medium text-slate-600">
                                    {pr.start_date ? new Date(pr.start_date).toLocaleDateString() : "Active"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex gap-2">
                              <button
                                onClick={() => handleTogglePromoStatus(pr.id, pr.status)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                                  isPaused
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                              >
                                {isPaused ? <Play size={12} /> : <Pause size={12} />}
                                {isPaused ? "Resume" : "Pause"}
                              </button>
                              <button
                                onClick={() => handleDeletePromo(pr.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. REVENUE */}
            {currentSection === "revenue" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-lg mb-1">Financial Revenue & Cash Flow</h2>
                  <p className="text-xs text-slate-500">Inventory sales realizations, milestone receivables, and projected booking values.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Realized Sales", val: revenueData?.total_revenue || "₹16.4 Cr", color: "from-[#006D6A] to-[#004F4D]" },
                    { label: "Booked Units Value", val: "₹5.8 Cr", color: "from-[#008F8C] to-[#006D6A]" },
                    { label: "Units Sold", val: revenueData?.sold_units || 14, color: "from-emerald-600 to-teal-800" },
                    { label: "Projected Inflow", val: revenueData?.projected_revenue || "₹28.5 Cr", color: "from-indigo-600 to-purple-800" },
                  ].map(c => (
                    <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-3xl p-5 text-white shadow-md`}>
                      <p className="font-black text-2xl">{c.val}</p>
                      <p className="text-white/80 text-xs font-semibold mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Milestone Collections Table */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h3 className="font-black text-slate-800 text-base mb-4">Construction Milestone Collections</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                          <th className="py-2.5 px-3">Milestone Stage</th>
                          <th className="py-2.5 px-3">Collection Amount</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { stage: "Foundation & Plinth", val: "₹4.2 Cr", st: "Received" },
                          { stage: "Structure & RCC Slabs", val: "₹6.8 Cr", st: "Received" },
                          { stage: "Brickwork & Internal Plaster", val: "₹3.4 Cr", st: "In Progress" },
                          { stage: "Finishing & Handover", val: "₹2.0 Cr", st: "Scheduled" },
                        ].map((m, i) => (
                          <tr key={i}>
                            <td className="py-3 px-3 font-bold text-slate-800">{m.stage}</td>
                            <td className="py-3 px-3 font-bold text-[#006D6A]">{m.val}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                m.st === "Received" ? "bg-green-100 text-green-700" :
                                m.st === "In Progress" ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>{m.st}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 8. BUYER ENQUIRIES (Part D) */}
            {currentSection === "enquiries" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg mb-1">Buyer Enquiries</h2>
                    <p className="text-xs text-slate-500">Incoming buyer queries linked to your projects, towers, and units.</p>
                  </div>
                  <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1.5 rounded-full">
                    {(Array.isArray(enquiries) ? enquiries : []).length} Enquiries
                  </span>
                </div>

                <div className="space-y-3">
                  {(!Array.isArray(enquiries) || enquiries.length === 0) ? (
                    <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-[#D9E5E3]">
                      <MessageCircle size={36} className="mx-auto mb-2 opacity-40 text-[#006D6A]" />
                      <p className="font-bold text-slate-700 text-sm">No buyer enquiries yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Enquiries submitted by prospective buyers will appear here in real time.</p>
                    </div>
                  ) : (
                    (enquiries || []).map(enq => (
                      <div key={enq.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#D9E5E3] hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                          <div>
                            <span className="font-black text-slate-800 text-sm">{enq.buyer_name}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              · <strong className="text-slate-700">{enq.project_name || "SAI Smart City Phase 1"}</strong>
                              {enq.unit ? ` (${enq.unit})` : ""}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{enq.date}</span>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                          "{enq.message}"
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            {enq.budget && (
                              <span className="text-[#006D6A] font-bold bg-[#E6F4F2] px-2.5 py-1 rounded-lg">
                                Budget: {enq.budget}
                              </span>
                            )}
                            {enq.buyer_phone && (
                              <a href={`tel:${enq.buyer_phone}`} className="text-slate-500 hover:text-[#006D6A] flex items-center gap-1 font-semibold">
                                <Phone size={12} /> {enq.buyer_phone}
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
                            <select
                              value={enq.status}
                              onChange={(e) => handleUpdateEnquiry(enq.id, e.target.value)}
                              className="font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs focus:outline-none cursor-pointer"
                            >
                              <option value="NEW">New</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="INTERESTED">Interested</option>
                              <option value="SITE_VISIT">Site Visit Scheduled</option>
                              <option value="NEGOTIATION">Negotiation</option>
                              <option value="CONVERTED">Converted</option>
                              <option value="CLOSED">Closed / Lost</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 9. ANALYTICS */}
            {currentSection === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-lg mb-1">Project Portfolio Analytics</h2>
                  <p className="text-xs text-slate-500">Live inventory absorption, booking velocity, and buyer demand trends.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Available Units", val: analytics?.available_units || 82, color: "text-emerald-600" },
                    { label: "Reserved Units", val: analytics?.reserved_units || 6, color: "text-amber-600" },
                    { label: "Booked Units", val: analytics?.booked_units || 8, color: "text-blue-600" },
                    { label: "Sold Units", val: analytics?.sold_units || 14, color: "text-[#006D6A]" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#D9E5E3] text-center">
                      <p className={`font-black text-2xl ${stat.color}`}>{stat.val}</p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Absorption Progress */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h3 className="font-black text-slate-800 text-base mb-2">Overall Inventory Absorption</h3>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                    <div style={{ width: `${Math.round(((analytics?.sold_units || 14) / (analytics?.total_units || 120)) * 100)}%` }} className="bg-[#006D6A]" title="Sold" />
                    <div style={{ width: `${Math.round(((analytics?.booked_units || 8) / (analytics?.total_units || 120)) * 100)}%` }} className="bg-blue-500" title="Booked" />
                    <div style={{ width: `${Math.round(((analytics?.reserved_units || 6) / (analytics?.total_units || 120)) * 100)}%` }} className="bg-amber-400" title="Reserved" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-3 font-semibold">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#006D6A]"></span> Sold</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Booked</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Reserved</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Available</span>
                  </div>
                </div>
              </div>
            )}

            {/* 10. VERIFICATION & DOCUMENTS */}
            {currentSection === "docs" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h2 className="font-black text-slate-800 text-lg mb-1">Verification & Documents</h2>
                  <p className="text-xs text-slate-500">Manage developer legal credentials, MahaRERA certificates, and township municipal approvals.</p>
                </div>

                {/* Upload Document Box */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <h3 className="font-black text-slate-800 text-base mb-4">Upload Verification Document</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full sm:w-64 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="company_registration">Company Registration / Incorporation</option>
                      <option value="rera_license">MahaRERA Developer License</option>
                      <option value="project_approval">Project Municipal Sanction</option>
                      <option value="land_document">7/12 Extract / Land Title Deed</option>
                    </select>

                    <input
                      type="file"
                      ref={docFileInputRef}
                      onChange={handleDocFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <button
                      onClick={() => docFileInputRef.current?.click()}
                      disabled={isUploadingDoc}
                      className="w-full sm:w-auto bg-[#006D6A] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#004F4D]"
                    >
                      <Upload size={14} />
                      {isUploadingDoc ? "Analyzing with AI..." : "Choose File & Upload"}
                    </button>
                  </div>
                </div>

                {/* Submitted Documents List (Part B3) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800 text-base">Submitted Documents</h3>
                    <span className="text-xs font-bold text-[#006D6A] bg-[#E6F4F2] px-3 py-1 rounded-full">
                      {(Array.isArray(verificationDocs) ? verificationDocs : []).length} Submitted
                    </span>
                  </div>

                  {(!Array.isArray(verificationDocs) || verificationDocs.length === 0) ? (
                    <div className="text-center py-8 text-slate-400">
                      <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">No verification documents submitted yet.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Upload your company incorporation or MahaRERA certificates to verify your builder profile.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(verificationDocs || []).map(doc => (
                        <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-sm capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                              {doc.project_name && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                  {doc.project_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.file_name} · Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recently"}</p>
                            {doc.rejection_reason && (
                              <p className="text-xs text-red-600 font-medium mt-1 bg-red-50 p-2 rounded-lg border border-red-100">
                                Admin Remarks: {doc.rejection_reason}
                              </p>
                            )}
                            {doc.resubmission_reason && (
                              <p className="text-xs text-amber-700 font-medium mt-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                Resubmission Required: {doc.resubmission_reason}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              (doc.status || "").toLowerCase() === "verified" ? "bg-green-100 text-green-700" :
                              (doc.status || "").toLowerCase() === "rejected" ? "bg-red-100 text-red-700" :
                              (doc.status || "").toLowerCase() === "resubmission_required" ? "bg-amber-100 text-amber-800" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {(doc.status || "UNDER REVIEW").toUpperCase()}
                            </span>
                            {((doc.status || "").toLowerCase() === "resubmission_required" || (doc.status || "").toLowerCase() === "rejected") && (
                              <button
                                onClick={() => docFileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E6F4F2] text-[#006D6A] hover:bg-[#d5ebe7] transition-colors"
                              >
                                Replace
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 11. MESSAGES (Part B4) */}
            {currentSection === "messages" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3] min-h-[500px] flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-slate-800 text-base">Enquiries Chat</h3>
                    <button
                      onClick={loadConversations}
                      className="text-slate-400 hover:text-[#006D6A] transition-colors"
                      title="Refresh conversations"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(!Array.isArray(conversations) || conversations.length === 0) ? (
                      <div className="p-8 text-center text-slate-400">
                        <MessageCircle size={32} className="mx-auto text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-600">No messages yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Conversations with buyers and site agents will appear here.</p>
                      </div>
                    ) : (
                      (conversations || []).map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setActiveConvId(c.id);
                            loadMessagesForConv(c.id);
                          }}
                          className={`p-3 rounded-xl cursor-pointer text-xs transition-colors ${
                            activeConvId === c.id ? "bg-[#006D6A] text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="font-bold truncate">{c.title || `Client #${c.id}`}</p>
                            <span className={`text-[10px] ${activeConvId === c.id ? "text-white/70" : "text-slate-400"}`}>
                              {c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate ${activeConvId === c.id ? "text-white/80" : "text-slate-400"}`}>
                            {(Array.isArray(c.messages) && c.messages.length > 0) ? c.messages[c.messages.length - 1]?.content : "Tap to chat"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-xl mb-2 font-bold text-xs text-slate-700 flex justify-between items-center">
                    <span>
                      {Array.isArray(conversations) && conversations.find(c => c.id === activeConvId)?.title
                        ? (conversations || []).find(c => c.id === activeConvId)?.title
                        : "Select conversation"}
                    </span>
                    {activeConvId && (
                      <button
                        onClick={() => loadMessagesForConv(activeConvId)}
                        className="text-xs text-[#006D6A] font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[350px] p-2 flex-1">
                    {chatMessages.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-12">Select a conversation to read or send messages.</p>
                    ) : (
                      (chatMessages || []).map(m => {
                        const isMe = m.sender_id === profile?.id;
                        return (
                          <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`p-3 rounded-2xl max-w-sm text-xs ${
                              isMe ? "bg-[#006D6A] text-white" : "bg-slate-100 text-slate-800"
                            }`}>
                              <p>{m.content}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">
                              {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type reply to buyer..."
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                    <button
                      type="submit"
                      disabled={!newMsgText.trim() || !activeConvId}
                      className="bg-[#006D6A] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#004F4D] transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 12. BUILDER PROFILE */}
            {currentSection === "profile" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#D9E5E3]">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl">Developer Profile</h2>
                    <p className="text-xs text-slate-500">Corporate registration, MahaRERA accreditation, and official developer credentials.</p>
                  </div>
                  <button
                    onClick={() => setEditProfileModal(true)}
                    className="bg-[#006D6A] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#004F4D]"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Company Name", val: profile?.company_name || "Prestige Landmarks" },
                    { label: "Company Type", val: profile?.company_type || "Real Estate Developer" },
                    { label: "RERA Registration ID", val: profile?.rera_id || "MAHARERA-B-991204" },
                    { label: "Developer License No", val: profile?.developer_registration_no || "DEV-REG-552" },
                    { label: "Registered City", val: profile?.city || "Pune" },
                    { label: "Support Email", val: profile?.support_email || profile?.email || "support@prestige.in" },
                    { label: "Registered Office Address", val: profile?.office_address || "Prestige Tower, Senapati Bapat Road, Pune" },
                    { label: "Overall Rating", val: `${profile?.rating || 4.8} ★ Verified Developer` },
                  ].map(f => (
                    <div key={f.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</span>
                      <p className="font-bold text-slate-800 text-sm mt-1">{f.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 13. BUILDER SETTINGS (RECREATING SCREENSHOT) */}
            {currentSection === "builder-settings" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D9E5E3]">
                <h2 className="font-black text-slate-800 text-xl mb-6">Settings</h2>

                {/* COMPANY SECTION matching screenshot */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">COMPANY</h3>
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Company Name</p>
                        <p className="text-xs text-slate-500">{settingsData?.company?.company_name || profile?.company_name || "Prestige Landmarks"}</p>
                      </div>
                      <button
                        onClick={() => {
                          setTempCompanyName(settingsData?.company?.company_name || profile?.company_name || "");
                          setEditCompanyNameModal(true);
                        }}
                        className="text-xs font-bold text-[#006D6A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E6F4F2]"
                      >
                        Edit
                      </button>
                    </div>

                    {/* RERA ID */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">RERA ID</p>
                        <p className="text-xs text-slate-500">{settingsData?.company?.rera_id || profile?.rera_id || "MAHARERA-B-991204"}</p>
                      </div>
                      <button
                        onClick={() => {
                          setTempReraId(settingsData?.company?.rera_id || profile?.rera_id || "");
                          setEditReraModal(true);
                        }}
                        className="text-xs font-bold text-[#006D6A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E6F4F2]"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Support Email */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Support Email</p>
                        <p className="text-xs text-slate-500">{settingsData?.company?.support_email || profile?.support_email || profile?.email || "support@prestige.in"}</p>
                      </div>
                      <button
                        onClick={() => {
                          setTempSupportEmail(settingsData?.company?.support_email || profile?.support_email || "");
                          setEditSupportEmailModal(true);
                        }}
                        className="text-xs font-bold text-[#006D6A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E6F4F2]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* NOTIFICATIONS SECTION matching screenshot */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">NOTIFICATIONS</h3>
                  <div className="space-y-4">
                    {[
                      { key: "new_buyer_enquiry", label: "New Buyer Enquiry", desc: "Instant alert on project inquiries" },
                      { key: "unit_booking_alert", label: "Unit Booking Alert", desc: "Notification when client requests unit hold" },
                      { key: "promotion_status", label: "Promotion Status", desc: "Sponsorship milestones & impressions" },
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
                              onChange={async (e) => {
                                try {
                                  await updateBuilderSettings({ notifications: { [notif.key]: e.target.checked } });
                                  showToast("Notification preference saved");
                                  loadSettings();
                                } catch {}
                              }}
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
                        <p className="font-bold text-slate-800 text-sm">Project Visibility</p>
                        <p className="text-xs text-slate-500">Show projects in public search feed</p>
                      </div>
                      <select className="text-xs font-semibold text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1.5 rounded-lg border border-[#99D9D2] focus:outline-none">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Contact Sharing</p>
                        <p className="text-xs text-slate-500">Display developer office number on project pages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006D6A]" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROMOTE MODAL */}
      {promoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Launch Campaign</h3>
            <p className="text-xs text-slate-500 mb-4">Select project and marketing package</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Project</label>
                <select
                  value={selectedProjectForPromo || ""}
                  onChange={(e) => setSelectedProjectForPromo(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Campaign Plan</label>
                <select
                  value={promoPlanType}
                  onChange={(e) => setPromoPlanType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Launch Spotlight">Launch Spotlight (₹9,999)</option>
                  <option value="Mega Launch">Mega Launch (₹19,999)</option>
                  <option value="Township Spotlight">Township Spotlight (₹34,999)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPromoteModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">Cancel</button>
              <button onClick={handleCreatePromo} className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">Activate Promotion</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-3">Edit Developer Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={tempProfile.company_name}
                  onChange={(e) => setTempProfile({ ...tempProfile, company_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RERA ID</label>
                  <input
                    type="text"
                    value={tempProfile.rera_id}
                    onChange={(e) => setTempProfile({ ...tempProfile, rera_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={tempProfile.city}
                    onChange={(e) => setTempProfile({ ...tempProfile, city: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Office Address</label>
                <input
                  type="text"
                  value={tempProfile.office_address}
                  onChange={(e) => setTempProfile({ ...tempProfile, office_address: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditProfileModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TOWER MODAL (Part C2) */}
      {(isAddTowerModalOpen || selectedProjectIdForTower) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-800 text-lg">Add New Tower / Building</h3>
                <p className="text-xs text-slate-500">Configure tower structure and auto-generate inventory units.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddTowerModalOpen(false);
                  setSelectedProjectIdForTower(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTowerFullSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Project *</label>
                <select
                  value={addTowerForm.project_id || selectedProjectIdForTower || (projects[0]?.id || 0)}
                  onChange={(e) => setAddTowerForm({ ...addTowerForm, project_id: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  required
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tower Name *</label>
                  <input
                    type="text"
                    required
                    value={addTowerForm.name}
                    onChange={(e) => setAddTowerForm({ ...addTowerForm, name: e.target.value, code: e.target.value.trim().slice(-1).toUpperCase() })}
                    placeholder="e.g. Tower C"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tower Code</label>
                  <input
                    type="text"
                    value={addTowerForm.code}
                    onChange={(e) => setAddTowerForm({ ...addTowerForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. C"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Floors *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={addTowerForm.floors_count}
                    onChange={(e) => setAddTowerForm({ ...addTowerForm, floors_count: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Units Per Floor *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={addTowerForm.units_per_floor}
                    onChange={(e) => setAddTowerForm({ ...addTowerForm, units_per_floor: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Units</label>
                  <input
                    type="text"
                    readOnly
                    value={`${(Number(addTowerForm.floors_count) || 10) * (Number(addTowerForm.units_per_floor) || 4)} Units`}
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-black text-[#006D6A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Construction Status</label>
                <select
                  value={addTowerForm.status}
                  onChange={(e) => setAddTowerForm({ ...addTowerForm, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white"
                >
                  <option value="Under Construction">Under Construction</option>
                  <option value="Ready to Move">Ready to Move</option>
                  <option value="New Launch">New Launch</option>
                  <option value="Planning Stage">Planning Stage</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={addTowerForm.description}
                  onChange={(e) => setAddTowerForm({ ...addTowerForm, description: e.target.value })}
                  placeholder="Highlights, tower specifications, premium corner views..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                />
              </div>

              <div className="bg-[#E6F4F2] p-3 rounded-xl border border-[#99D9D2] text-[11px] text-[#004F4D] flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>Submitting will automatically create the {(Number(addTowerForm.floors_count) || 10) * (Number(addTowerForm.units_per_floor) || 4)} residential units in PostgreSQL with numbering convention (e.g. C-101 to C-1004).</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTowerModalOpen(false);
                    setSelectedProjectIdForTower(null);
                  }}
                  className="px-4 py-2.5 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#006D6A] text-white rounded-xl text-xs font-bold hover:bg-[#004F4D] transition-colors shadow-md"
                >
                  Save Tower & Generate Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOWER DETAILS & LAYOUT VISUALIZATION MODAL (Part C4, C8) */}
      {selectedTowerDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#006D6A] text-white flex items-center justify-center font-black text-sm">
                      {selectedTowerDetailModal.tower.name.slice(-1) || "T"}
                    </span>
                    <h3 className="font-black text-slate-800 text-xl">{selectedTowerDetailModal.tower.name}</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedTowerDetailModal.project.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedTowerDetailModal.tower.floors} Floors · {(selectedTowerDetailModal.tower.units || []).length || 40} Total Units
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const tid = selectedTowerDetailModal.tower.id;
                      setSelectedTowerDetailModal(null);
                      if (onOpenBuilding3D) {
                        onOpenBuilding3D(tid);
                      } else {
                        navigate("building-3d");
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Film size={13} /> 3D Discovery
                  </button>
                  <button
                    onClick={() => setSelectedTowerDetailModal(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Real Database Unit Stats (Part C4) */}
              {(() => {
                const units = selectedTowerDetailModal.tower.units || [];
                const total = units.length || 40;
                const available = units.filter(u => u.status === 'available').length;
                const reserved = units.filter(u => u.status === 'reserved').length;
                const booked = units.filter(u => u.status === 'booked').length;
                const sold = units.filter(u => u.status === 'sold').length;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Units</span>
                      <span className="font-black text-slate-800 text-lg">{total}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">Available</span>
                      <span className="font-black text-emerald-700 text-lg">{available}</span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Reserved</span>
                      <span className="font-black text-amber-700 text-lg">{reserved}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">Booked</span>
                      <span className="font-black text-blue-700 text-lg">{booked}</span>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 text-center">
                      <span className="text-[10px] font-bold text-[#006D6A] uppercase block">Sold</span>
                      <span className="font-black text-[#006D6A] text-lg">{sold}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Floor-by-Floor Unit Grid (Part C5, C8) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Floor & Unit Layout</h4>
              {(() => {
                const units = selectedTowerDetailModal.tower.units || [];
                if (units.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold">No units generated for this tower.</p>
                    </div>
                  );
                }

                // Group units by floor
                const floorMap: Record<number, typeof units> = {};
                units.forEach(u => {
                  const floorNum = u.floor || 1;
                  if (!floorMap[floorNum]) floorMap[floorNum] = [];
                  floorMap[floorNum].push(u);
                });

                // Sort floors descending (top floor to ground)
                const sortedFloors = Object.keys(floorMap).map(Number).sort((a, b) => b - a);

                return sortedFloors.map(floorNum => (
                  <div key={floorNum} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-700">Floor {floorNum}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{floorMap[floorNum].length} Units</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {floorMap[floorNum].map(u => (
                        <div
                          key={u.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-[#006D6A] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-slate-800 text-xs">{u.unit_number}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-medium">{u.type}</span>
                              <button
                                onClick={() => {
                                  const tid = selectedTowerDetailModal.tower.id;
                                  setSelectedTowerDetailModal(null);
                                  if (onOpenBuilding3D) {
                                    onOpenBuilding3D(tid, floorNum, u.unit_number);
                                  } else {
                                    navigate("building-3d");
                                  }
                                }}
                                title="View in 3D"
                                className="text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 hover:bg-teal-100 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Film size={9} /> 3D
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                            <span>{u.area}</span>
                            <span className="font-bold text-slate-700">{u.price_display}</span>
                          </div>
                          <select
                            value={u.status}
                            onChange={(e) => {
                              handleUpdateUnitStatus(u.id, e.target.value);
                              // Optimistically update status in current modal
                              u.status = e.target.value as any;
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors ${
                              u.status === "available" ? "bg-green-50 text-green-700 border-green-200" :
                              u.status === "reserved" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              u.status === "booked" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <option value="available">AVAILABLE</option>
                            <option value="reserved">RESERVED</option>
                            <option value="booked">BOOKED</option>
                            <option value="sold">SOLD</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">Click any unit's status dropdown to update PostgreSQL inventory instantly.</span>
              <button
                onClick={() => setSelectedTowerDetailModal(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COMPANY NAME MODAL */}
      {editCompanyNameModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Edit Company Name</h3>
            <input
              type="text"
              value={tempCompanyName}
              onChange={(e) => setTempCompanyName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditCompanyNameModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateBuilderSettings({ company: { company_name: tempCompanyName } });
                    showToast("Company name updated!");
                    setEditCompanyNameModal(false);
                    loadSettings();
                    loadProfile();
                  } catch {}
                }}
                className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RERA ID MODAL */}
      {editReraModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Edit Developer RERA ID</h3>
            <input
              type="text"
              value={tempReraId}
              onChange={(e) => setTempReraId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditReraModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateBuilderSettings({ company: { rera_id: tempReraId } });
                    showToast("RERA ID updated!");
                    setEditReraModal(false);
                    loadSettings();
                    loadProfile();
                  } catch {}
                }}
                className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUPPORT EMAIL MODAL */}
      {editSupportEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 text-base mb-1">Edit Support Email</h3>
            <input
              type="email"
              value={tempSupportEmail}
              onChange={(e) => setTempSupportEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditSupportEmailModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateBuilderSettings({ company: { support_email: tempSupportEmail } });
                    showToast("Support email updated!");
                    setEditSupportEmailModal(false);
                    loadSettings();
                    loadProfile();
                  } catch {}
                }}
                className="px-5 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
