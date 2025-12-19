import React, { useState, useEffect } from "react";
import {
  Globe,
  Package,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Search,
  Menu,
  X,
  MapPin,
  CheckCircle,
  Truck,
  Lock,
  Mail,
  Key,
  ChevronRight,
  Shield,
  Clock,
  Calculator,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  Plane,
  User,
} from "lucide-react";
import Modal from "../components/UI/Modal";
import useAuth from "@/api/auth/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import useOrders from "@/api/orders/useOrders";

const Landing: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [trackId, setTrackId] = useState("");

  const { login: loginContext } = useAuthContext();
  const { login: apiLogin, register: apiRegister } = useAuth();
  const { getOrderByTrackingNumber } = useOrders();

  // Auth State
  const [loginMode, setLoginMode] = useState<"ADMIN" | "CLIENT" | null>(null);
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<"CREDENTIALS" | "OTP">(
    "CREDENTIALS"
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminOtp, setAdminOtp] = useState<string | null>(null);

  // Calculator State
  const [calcOrigin, setCalcOrigin] = useState("US");
  const [calcMode, setCalcMode] = useState<"AIR" | "SEA">("AIR");
  const [calcWeight, setCalcWeight] = useState(1);
  const [estCost, setEstCost] = useState(0);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Tracking State
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  useEffect(() => {
    const rates: Record<string, { AIR: number; SEA: number }> = {
      US: { AIR: 8.5, SEA: 3.5 },
      UK: { AIR: 7.5, SEA: 3.0 },
      CN: { AIR: 12.0, SEA: 5.0 },
      AE: { AIR: 6.0, SEA: 2.5 },
    };
    const rate = rates[calcOrigin][calcMode];
    setEstCost(rate * calcWeight);
  }, [calcOrigin, calcMode, calcWeight]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;

    setIsTracking(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const response = await getOrderByTrackingNumber(trackId.trim());
      const order = response.data;

      const ORDER_STATUS_FLOW = [
        "PENDING",
        "RECEIVED",
        "CONSOLIDATED",
        "DISPATCHED",
        "IN_TRANSIT",
        "ARRIVED",
        "READY_FOR_RELEASE",
        "RELEASED",
        "DELIVERED",
      ];

      const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

      // Sort history to be safe, newest first.
      const sortedHistory = [...order.status_history].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const timeline = ORDER_STATUS_FLOW.map((status, index) => {
        const historyEvent = sortedHistory.find((h) => h.status === status);
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;

        return {
          status: status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          date: historyEvent
            ? new Date(historyEvent.created_at).toLocaleString()
            : "Pending",
          loc: historyEvent ? historyEvent.location : "N/A",
          completed: isCompleted,
          current: isCurrent,
        };
      });

      const trackingData = {
        id: order.tracking_number,
        desc: `Shipment from ${order.origin_country}`,
        status: order.status.replace(/_/g, " "),
        origin: order.origin_country,
        destination: order.receiver_address,
        eta: order.arrived_at
          ? new Date(order.arrived_at).toLocaleDateString()
          : "Pending",
        carrier: "Shypt Logistics",
        timeline: timeline,
      };

      setTrackingResult(trackingData);
      setShowTrackingModal(true);
    } catch (err: any) {
      console.error("eorrored", err);
      setTrackingError(
        err.response?.data?.message || "Tracking number not found."
      );
    } finally {
      setIsTracking(false);
    }
  };

  const openLogin = (mode: "ADMIN" | "CLIENT") => {
    setLoginMode(mode);
    setAuthTab("LOGIN");
    setAuthStep("CREDENTIALS");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setOtp("");
    setError("");
    setAdminOtp(null);
    setIsMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    const event = new CustomEvent("app-navigate", { detail: path });
    window.dispatchEvent(event);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setAdminOtp(null);

    try {
      const response = await apiLogin({ email, password });
      const { data: user, authorization } = response;

      // Only apply OTP for ADMIN mode logins if the user is an admin
      if (loginMode === "ADMIN") {
        const isAdmin =
          user.user_type === "super_user" || user.user_type === "staff";
        if (isAdmin) {
          setAdminOtp(user.otp);
          setAuthStep("OTP");
        } else {
          // If a non-admin tries to log in via admin portal, show error or redirect
          setError("Access Denied: Only staff can use this portal.");
          setIsLoading(false);
          return;
        }
      } else {
        // loginMode === "CLIENT"
        // For client logins, always log in directly
        loginContext(user, authorization.token);
        handleNavigate("/client/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    try {
      await apiRegister({
        full_name: fullName,
        email,
        phone,
        password,
        password_confirmation: confirmPassword,
      });

      const loginResponse = await apiLogin({ email, password });
      const { data: user, authorization } = loginResponse;

      loginContext(user, authorization.token);
      handleNavigate("/client/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // TODO: Implement actual OTP verification when ready
    // For now, we just log the user in since we have the data already.
    // This part is commented out as per instructions.
    /*
    setTimeout(() => {
      if (otp === '123456') { // This would be a call to verifyOtp
        // Refetch user or use login response data
        // For now, we assume login was successful and we have user data
        // This is not secure and for demonstration only
        const user = {} // get user from somewhere
        const token = '' // get token from somewhere
        loginContext(user, token);
        handleNavigate('/admin/dashboard');
      } else {
        setError('Invalid OTP Code');
        setIsLoading(false);
      }
    }, 800);
    */

    // As per instruction, we are just displaying the OTP.
    // To complete the flow for demo, let's log the user in after they 'submit' the OTP
    // This requires fetching the user/token again or storing it from the previous step.
    // For simplicity, we'll just simulate a successful login here without real verification.

    // NOTE: This is a temporary solution for the demo as requested.
    // In a real scenario, you would verify the OTP with the backend.
    const reLoginAndRedirect = async () => {
      try {
        const response = await apiLogin({ email, password });
        const { data: user, authorization } = response;
        loginContext(user, authorization.token);
        handleNavigate("/admin/dashboard");
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred.");
        setIsLoading(false);
        setAuthStep("CREDENTIALS");
      }
    };
    reLoginAndRedirect();
  };

  const faqs = [
    {
      q: "How long does shipping take?",
      a: "Air freight typically takes 5-7 business days from the day the flight departs. Sea freight takes approximately 45-60 days.",
    },
    {
      q: "Do I pay customs duty separately?",
      a: "For most general goods, our rate is inclusive of customs clearing. However, specialized items (electronics, commercial machinery) may attract separate tax assessments.",
    },
    {
      q: "How is chargeable weight calculated?",
      a: "We charge based on the greater of Actual Weight or Volumetric Weight. Volumetric weight is (Length x Width x Height in cm) / 6000.",
    },
    {
      q: "What is 'Shop For Me'?",
      a: "If you don't have an international card, simply send us the link to the item you want. We will quote you in your local currency, buy it, and ship it to you.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 relative">
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                Shypt
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition"
              >
                How it Works
              </a>
              <a
                href="#rates"
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition"
              >
                Rates
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition"
              >
                FAQ
              </a>

              <div className="flex items-center space-x-3 ml-6 border-l border-slate-200 pl-6">
                <button
                  onClick={() => openLogin("ADMIN")}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center"
                >
                  <Lock size={14} className="mr-1" /> Staff Access
                </button>
                <button
                  onClick={() => openLogin("CLIENT")}
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                  Client Portal
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full z-50">
            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="block text-slate-600 font-medium"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="block text-slate-600 font-medium"
            >
              How it Works
            </a>
            <a
              href="#rates"
              onClick={() => setIsMenuOpen(false)}
              className="block text-slate-600 font-medium"
            >
              Rates
            </a>
            <a
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
              className="block text-slate-600 font-medium"
            >
              FAQ
            </a>
            <hr />
            <button
              onClick={() => openLogin("CLIENT")}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold"
            >
              Client Login
            </button>
            <button
              onClick={() => openLogin("ADMIN")}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold"
            >
              Staff Login
            </button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-slate-900 pt-16 pb-24 lg:pt-32 lg:pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Globe size={12} className="mr-2" /> Global Logistics OS
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                Global Freight,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-600">
                  Simplified.
                </span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The modern operating system for logistics. Ship from USA, UK,
                China, and UAE to Uganda with automated compliance, real-time
                tracking, and assisted shopping.
              </p>

              {/* Tracking Input */}
              <form
                onSubmit={handleTrack}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-full border border-white/10 flex max-w-md mx-auto lg:mx-0"
              >
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    placeholder="Enter Tracking Number (e.g. HWB-8821)"
                    className="w-full h-12 pl-12 pr-4 bg-transparent text-white placeholder-slate-400 focus:outline-none rounded-full"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking}
                  className="bg-primary-600 hover:bg-primary-500 text-white h-12 px-8 rounded-full font-bold transition disabled:opacity-70"
                >
                  {isTracking ? "Tracking..." : "Track"}
                </button>
              </form>
              {trackingError && (
                <p className="text-red-400 text-sm mt-2 text-center lg:text-left">
                  {trackingError}
                </p>
              )}
              <div className="mt-4 flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-500">
                <span className="flex items-center">
                  <CheckCircle size={14} className="mr-2 text-green-500" /> No
                  hidden fees
                </span>
                <span className="flex items-center">
                  <CheckCircle size={14} className="mr-2 text-green-500" /> 5-7
                  day Air Freight
                </span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary-600/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>

              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition duration-500">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-slate-400 text-xs uppercase">
                        Shipment Status
                      </p>
                      <h3 className="text-white text-xl font-bold">
                        In Transit
                      </h3>
                    </div>
                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                      ON TIME
                    </div>
                  </div>
                  <div className="h-32 w-full bg-slate-700/50 rounded-lg mb-6 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mb-1 mx-auto">
                          <MapPin size={16} className="text-slate-300" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Guangzhou
                        </span>
                      </div>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-slate-600 to-blue-500"></div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1 mx-auto shadow-lg shadow-blue-900/50">
                          <Truck size={20} className="text-white" />
                        </div>
                        <span className="text-[10px] text-white font-bold">
                          En Route
                        </span>
                      </div>
                      <div className="w-24 h-0.5 bg-slate-600"></div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mb-1 mx-auto">
                          <MapPin size={16} className="text-slate-300" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Kampala
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS STRIP --- */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-black text-slate-900">10k+</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                Packages Delivered
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">4</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                Global Hubs
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">5-7</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                Days Air Transit
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">99%</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                Success Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <div id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to ship smarter.
            </h2>
            <p className="text-slate-600 text-lg">
              We combine technology with logistics infrastructure to give you a
              seamless shipping experience from origin to destination.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Package className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Warehouse & Consolidation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Shop from multiple stores in the US, UK, or China. We receive,
                inspect, and consolidate your items into one shipment to save
                you up to 60% on shipping fees.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Shop For Me
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Don't have an international card? Paste a link, we send you a
                quote in local currency, and we buy it for you. We handle the
                procurement and delivery.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Compliance & Taxes
              </h3>
              <p className="text-slate-600 leading-relaxed">
                No more customs surprises. Our system estimates URA taxes
                beforehand. We handle the clearing process so your goods don't
                get stuck at the airport.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- SHOPPING PARTNERS --- */}
      <div className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            Shop from your favorite global stores
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Text Placeholders for Logos to avoid external image dependencies in this snippet, but styled like logos */}
            <span className="text-2xl font-bold text-slate-800 font-serif">
              amazon
            </span>
            <span className="text-2xl font-bold text-slate-800 font-sans tracking-tighter">
              eBay
            </span>
            <span className="text-2xl font-bold text-slate-800">SHEIN</span>
            <span className="text-2xl font-bold text-slate-800 font-sans">
              AliExpress
            </span>
            <span className="text-2xl font-bold text-slate-800">Apple</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">
              ASOS
            </span>
          </div>
          <div className="mt-8">
            <button
              onClick={() => openLogin("CLIENT")}
              className="text-primary-600 font-bold hover:underline"
            >
              Start Assisted Shopping &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* --- RATES CALCULATOR SECTION --- */}
      <div
        id="rates"
        className="py-24 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transparent Pricing.
                <br />
                <span className="text-primary-400">No hidden fees.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Know exactly what you'll pay before you ship. Our rates are
                competitive and inclusive of customs clearing for general goods.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary-900/50 p-3 rounded-lg mr-4 text-primary-400">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">4 Global Origins</h4>
                    <p className="text-sm text-slate-400">
                      Consolidated weekly from US, UK, China, and UAE.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary-900/50 p-3 rounded-lg mr-4 text-primary-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Customs Inclusive</h4>
                    <p className="text-sm text-slate-400">
                      We handle URA clearing. The price you see is what you pay.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculator Card */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-slate-900">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Calculator className="mr-2 text-primary-600" /> Quick Estimate
              </h3>

              <div className="space-y-5">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCalcMode("AIR")}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition ${
                      calcMode === "AIR"
                        ? "bg-white shadow text-primary-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Air Freight
                  </button>
                  <button
                    onClick={() => setCalcMode("SEA")}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition ${
                      calcMode === "SEA"
                        ? "bg-white shadow text-primary-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Sea Freight
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Origin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["US", "UK", "CN", "AE"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCalcOrigin(c)}
                        className={`py-2 border rounded-lg text-sm font-medium transition ${
                          calcOrigin === c
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {c === "US"
                          ? "USA"
                          : c === "UK"
                          ? "UK"
                          : c === "CN"
                          ? "China"
                          : "Dubai"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Weight (KG)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">1kg</span>
                      <div className="flex items-center border border-slate-300 rounded px-3 py-1 bg-white">
                        <input
                          type="number"
                          value={calcWeight}
                          onChange={(e) =>
                            setCalcWeight(parseInt(e.target.value) || 0)
                          }
                          className="w-12 text-center font-bold outline-none text-slate-900 bg-transparent"
                        />
                        <span className="text-xs text-slate-500 ml-1">kg</span>
                      </div>
                      <span className="text-xs text-slate-400">100kg+</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center mt-6">
                  <p className="text-sm text-slate-500 mb-1">Estimated Cost</p>
                  <p className="text-4xl font-black text-slate-900">
                    ${estCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    *Includes freight & basic clearing. Subject to volumetric
                    weight.
                  </p>
                </div>

                <button
                  onClick={() => openLogin("CLIENT")}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition shadow-lg shadow-primary-600/20"
                >
                  Get Exact Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PROHIBITED ITEMS WARNING --- */}
      <div className="bg-red-50 border-y border-red-100 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center text-red-800 text-sm font-medium">
          <AlertTriangle size={16} className="mr-2" />
          <span className="mr-2">PROHIBITED ITEMS:</span>
          <div className="flex gap-4 opacity-70">
            <span>Explosives</span> • <span>Illegal Drugs</span> •{" "}
            <span>Counterfeit Currency</span> •{" "}
            <span>Aerosols (Air Freight)</span> •{" "}
            <span>Lithium Batteries (Undeclared)</span>
          </div>
        </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                How Shypt Works
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Get your items delivered in 3 simple steps.
              </p>
            </div>

            <div className="space-y-12">
              <div className="flex">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-bold text-slate-900">
                    Sign up & Get an Address
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Create a free account to get your unique shipping address in
                    New York, London, Guangzhou, and Dubai.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-bold text-slate-900">
                    Shop Online
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Shop at Amazon, eBay, Shein, or Apple. Use your Shypt
                    address at checkout.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-bold text-slate-900">
                    We Ship & Deliver
                  </h4>
                  <p className="text-slate-600 mt-2">
                    We receive your package, notify you, handle customs, and
                    deliver to your doorstep in Kampala.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => openLogin("CLIENT")}
                className="mt-12 px-8 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition inline-flex items-center"
              >
                Get Started Free <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-800">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="text-slate-400" />
                  ) : (
                    <ChevronDown className="text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-slate-500 mb-4">Still have questions?</p>
            <button className="text-primary-600 font-bold hover:underline flex items-center justify-center">
              <HelpCircle size={18} className="mr-2" /> Visit Help Center
            </button>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Shypt
              </span>
              <p className="mt-4 text-sm text-slate-400 max-w-xs">
                The operating system for modern logistics. Connecting the world
                to Africa through seamless freight technology.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Air Freight
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Sea Freight
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Assisted Shopping
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Customs Clearing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@shypt.net"
                    className="hover:text-white transition"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
            <p>&copy; 2025 Shypt Logistics. All rights reserved.</p>
            <p>Kampala, Uganda • Plot 12, Industrial Area</p>
          </div>
        </div>
      </footer>

      {/* --- LOGIN MODAL --- */}
      {loginMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {loginMode === "ADMIN" ? "Staff Login" : "Client Portal"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Secure access to your dashboard.
                  </p>
                </div>
                <button
                  onClick={() => setLoginMode(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center border border-red-100">
                  <Shield className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              {/* AUTH TABS (Client Only) */}
              {loginMode === "CLIENT" && (
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                  <button
                    onClick={() => setAuthTab("LOGIN")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${
                      authTab === "LOGIN"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setAuthTab("REGISTER")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${
                      authTab === "REGISTER"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* STEP 1: CREDENTIALS (LOGIN) */}
              {authStep === "CREDENTIALS" && authTab === "LOGIN" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center items-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      "Verifying..."
                    ) : (
                      <>
                        {loginMode === "CLIENT" ? "Sign In" : "Next"}{" "}
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* REGISTRATION FLOW */}
              {authTab === "REGISTER" && (
                <form
                  onSubmit={handleRegisterSubmit}
                  className="space-y-4 animate-in slide-in-from-right-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">
                        +256
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-14 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="772 123 456"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="Create a password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center disabled:opacity-70 shadow-lg shadow-blue-100"
                  >
                    {isLoading ? "Creating Account..." : "Sign Up Free"}
                  </button>
                  <p className="text-xs text-center text-slate-400 mt-2">
                    By signing up, you agree to our Terms.
                  </p>
                </form>
              )}

              {/* STEP 2: OTP (ADMIN ONLY) */}
              {authStep === "OTP" && (
                <form
                  onSubmit={handleOtpSubmit}
                  className="space-y-6 text-center animate-in slide-in-from-right-8 duration-300"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Key size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Enter the 6-digit code. For now, your OTP is:{" "}
                      <strong className="text-blue-600 tracking-wider">
                        {adminOtp}
                      </strong>
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 border-b-2 border-slate-300 focus:border-blue-600 outline-none bg-transparent text-slate-900"
                    placeholder="••••••"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
                  >
                    {isLoading ? "Authenticating..." : "Verify & Access"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthStep("CREDENTIALS")}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Back to login
                  </button>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            {authStep === "CREDENTIALS" && (
              <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-100">
                Protected by Shypt Security. IP Logged.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TRACKING MODAL --- */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        title={`Track Shipment: ${trackingResult?.id || ""}`}
        size="lg"
      >
        {trackingResult && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="bg-slate-900 text-white p-6 rounded-lg flex flex-col md:flex-row justify-between items-center shadow-lg">
              <div>
                <h3 className="text-xl font-bold">{trackingResult.desc}</h3>
                <p className="text-sm text-slate-400 mt-1 flex items-center">
                  <MapPin size={14} className="mr-1" /> {trackingResult.origin}{" "}
                  &rarr; {trackingResult.destination}
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-center md:text-right">
                <span className="inline-block bg-green-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                  {trackingResult.status}
                </span>
                <p className="text-xs text-slate-400">
                  ETA: {trackingResult.eta}
                </p>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="relative pt-4 pb-8 px-4">
              {/* Timeline Bar Background */}
              <div className="absolute top-8 left-4 right-4 h-1 bg-slate-200 -z-10 hidden md:block"></div>

              <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                {/* Step 1: Origin */}
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center z-10 shadow-md">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Origin</p>
                    <p className="text-[10px] text-slate-500">Guangzhou</p>
                  </div>
                </div>

                {/* Step 2: Transit */}
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center z-10 shadow-md animate-pulse">
                    <Plane size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700">
                      In Transit
                    </p>
                    <p className="text-[10px] text-slate-500">Flight QR-882</p>
                  </div>
                </div>

                {/* Step 3: Destination */}
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center z-10">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Destination
                    </p>
                    <p className="text-[10px] text-slate-500">Entebbe</p>
                  </div>
                </div>

                {/* Step 4: Delivery */}
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center z-10">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Delivery</p>
                    <p className="text-[10px] text-slate-500">Kampala</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed History */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <Clock size={16} className="mr-2 text-slate-500" /> Shipment
                History
              </h4>
              <div className="space-y-0">
                {trackingResult.timeline.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4 pb-6 last:pb-0 relative">
                    {/* Vertical Line */}
                    {i !== trackingResult.timeline.length - 1 && (
                      <div className="absolute top-2 left-[7px] bottom-0 w-0.5 bg-slate-200"></div>
                    )}

                    {/* Dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 mt-1 ${
                        event.completed
                          ? "bg-green-500 border-green-500"
                          : event.current
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-slate-300"
                      }`}
                    ></div>

                    {/* Content */}
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          event.current ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {event.status}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {event.loc} • {event.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Landing;
