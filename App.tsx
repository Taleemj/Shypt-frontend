import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";

import Landing from "./pages/Landing";
import MainLayout from "./components/Layout/MainLayout";

// ADMIN IMPORTS
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifications from "./pages/admin/AdminNotifications";
import CargoDeclarations from "./pages/admin/CargoDeclarations";
import ClientOrders from "./pages/admin/ClientOrders";
import OrderDetails from "./pages/admin/OrderDetails";
import WarehouseOperations from "./pages/admin/WarehouseOperations";
import Inventory from "./pages/admin/Inventory";
import InventoryDetails from "./pages/admin/InventoryDetails";
import Freight from "./pages/admin/Freight";
import FreightDetails from "./pages/admin/FreightDetails";
import Delivery from "./pages/admin/Delivery";
import DeliveryDetails from "./pages/admin/DeliveryDetails";
import Compliance from "./pages/admin/Compliance";
import Invoices from "./pages/admin/Invoices";
import InvoiceDetails from "./pages/admin/InvoiceDetails";
import Expenses from "./pages/admin/Expenses";
import ExpenseDetails from "./pages/admin/ExpenseDetails";
import Payments from "./pages/admin/Payments";
import PaymentDetails from "./pages/admin/PaymentDetails";
import AssistedShopping from "./pages/admin/AssistedShopping";
import ShoppingDetails from "./pages/admin/ShoppingDetails";
import Suppliers from "./pages/admin/Suppliers";
import SupplierDetails from "./pages/admin/SupplierDetails";
import Users from "./pages/admin/Users";
import UserDetails from "./pages/admin/UserDetails";
import Ticketing from "./pages/admin/Ticketing";
import TicketDetails from "./pages/admin/TicketDetails";
import Reports from "./pages/admin/Reports";
import AdminClientOrderDetails from "./pages/admin/AdminClientOrderDetails";
import Settings from "./pages/admin/Settings";
import AdminDocumentCenter from "./pages/admin/AdminDocumentCenter";

// CLIENT IMPORTS
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProfile from "./pages/client/ClientProfile";
import MyShipments from "./pages/client/MyShipments";
import MyOrders from "./pages/client/MyOrders";
import DeliveryRequestDetails from "./pages/client/DeliveryRequestDetails";
import ClientShipmentDetails from "./pages/client/ClientShipmentDetails";
import ShoppingRequests from "./pages/client/ShoppingRequests";
import ClientShoppingDetails from "./pages/client/ShoppingDetails";
import ShippingCalculator from "./pages/client/ShippingCalculator";
import ClientInvoices from "./pages/client/ClientInvoices";
import ClientInvoiceDetails from "./pages/client/ClientInvoiceDetails";
import Tracking from "./pages/client/Tracking";
import ClientSupport from "./pages/client/ClientSupport";
import ClientTicketDetails from "./pages/client/TicketDetails";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientSettings from "./pages/client/ClientSettings";
import ShippingAddresses from "./pages/client/ShippingAddresses";
import DocumentCenter from "./pages/client/DocumentCenter";
import ClientDeliveries from "./pages/client/ClientDeliveries";
import ClientDeliveryDetails from "./pages/client/ClientDeliveryDetails";

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // This handles the custom navigation event for legacy components.
  // This should be removed once all navigation is migrated to Link or useNavigate
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      if (location.pathname !== event.detail) {
        navigate(event.detail);
      }
    };
    window.addEventListener("app-navigate", handleNavigate as EventListener);
    return () =>
      window.removeEventListener(
        "app-navigate",
        handleNavigate as EventListener,
      );
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="requests" element={<CargoDeclarations />} />
        <Route path="requests/:orderId" element={<OrderDetailsWrapper />} />
        <Route path="client-orders" element={<ClientOrders />} />
        <Route
          path="client-orders/:orderId"
          element={<AdminClientOrderDetailsWrapper />}
        />
        <Route path="warehouse" element={<WarehouseOperations />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/:id" element={<InventoryDetailsWrapper />} />
        <Route path="freight" element={<Freight />} />
        <Route path="freight/:freightId" element={<FreightDetailsWrapper />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="delivery/:id" element={<DeliveryDetailsWrapper />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:invoiceId" element={<InvoiceDetailsWrapper />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/:id" element={<ExpenseDetailsWrapper />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:paymentId" element={<PaymentDetailsWrapper />} />
        <Route path="shopping" element={<AssistedShopping />} />
        <Route
          path="shopping/:requestId"
          element={<ShoppingDetailsWrapper />}
        />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetailsWrapper />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:userId" element={<UserDetailsWrapper />} />
        <Route path="tickets" element={<Ticketing />} />
        <Route path="tickets/:id" element={<TicketDetailsWrapper />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="document-center" element={<AdminDocumentCenter />} />
      </Route>

      {/* Client Routes */}
      <Route path="/client" element={<ProtectedRoute role="CLIENT" />}>
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="shipments" element={<MyShipments />} />
        <Route
          path="shipments/:id"
          element={<ClientShipmentDetailsWrapper />}
        />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<ClientOrderDetailsWrapper />} />
        <Route path="shopping" element={<ShoppingRequests />} />
        <Route path="shopping/:id" element={<ClientShoppingDetailsWrapper />} />
        <Route path="calculator" element={<ShippingCalculator />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="invoices/:id" element={<ClientInvoiceDetailsWrapper />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="support" element={<ClientSupport />} />
        <Route path="support/:id" element={<ClientTicketDetailsWrapper />} />
        <Route path="notifications" element={<ClientNotifications />} />
        <Route path="settings" element={<ClientSettings />} />
        <Route path="shipping-addresses" element={<ShippingAddresses />} />
        <Route path="document-center" element={<DocumentCenter />} />
        <Route path="deliveries" element={<ClientDeliveries />} />
        <Route
          path="deliveries/:deliveryId"
          element={<ClientDeliveryDetailsWrapper />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const ProtectedRoute: React.FC<{ role: "ADMIN" | "CLIENT" }> = ({ role }) => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole =
    user?.user_type === "super_user" || user?.user_type === "staff"
      ? "ADMIN"
      : "CLIENT";

  if (userRole !== role) {
    return (
      <Navigate
        to={userRole === "ADMIN" ? "/admin/dashboard" : "/client/dashboard"}
        replace
      />
    );
  }

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <MainLayout
      // role={userRole}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      // onLogout={logout}
    >
      <Outlet />
    </MainLayout>
  );
};

// Wrapper components to pass react-router params to original components
const UserDetailsWrapper = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  return (
    <UserDetails
      userId={userId || ""}
      onBack={() => navigate("/admin/users")}
    />
  );
};
const OrderDetailsWrapper = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  return (
    <OrderDetails
      declarationId={orderId || ""}
      onBack={() => navigate("/admin/cargo-declarations")}
    />
  );
};
const FreightDetailsWrapper = () => {
  const { freightId } = useParams<{ freightId: string }>();
  const navigate = useNavigate();
  return (
    <FreightDetails
      // @ts-ignore
      freightId={freightId || ""}
      onBack={() => navigate("/admin/freight")}
    />
  );
};
const InvoiceDetailsWrapper = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  return (
    <InvoiceDetails
      invoiceId={invoiceId || ""}
      onBack={() => navigate("/admin/invoices")}
    />
  );
};
const PaymentDetailsWrapper = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  return (
    <PaymentDetails
      paymentId={paymentId || ""}
      onBack={() => navigate("/admin/payments")}
    />
  );
};
const ShoppingDetailsWrapper = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  return (
    <ShoppingDetails
      requestId={requestId || ""}
      onBack={() => navigate("/admin/shopping")}
    />
  );
};
const InventoryDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <InventoryDetails
      id={id || ""}
      onBack={() => navigate("/admin/inventory")}
    />
  );
};
const ExpenseDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <ExpenseDetails id={id || ""} onBack={() => navigate("/admin/expenses")} />
  );
};
const SupplierDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <SupplierDetails
      id={id || ""}
      onBack={() => navigate("/admin/suppliers")}
    />
  );
};
const DeliveryDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <DeliveryDetails
      deliveryId={id || ""}
      onBack={() => navigate("/admin/delivery")}
    />
  );
};
const TicketDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <TicketDetails id={id || ""} onBack={() => navigate("/admin/tickets")} />
  );
};
const AdminClientOrderDetailsWrapper = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  return (
    <AdminClientOrderDetails
      orderId={orderId || ""}
      onBack={() => navigate("/admin/client-orders")}
    />
  );
};

const ClientOrderDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <DeliveryRequestDetails
      id={id || ""}
      onBack={() => navigate("/client/orders")}
    />
  );
};

const ClientShipmentDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <ClientShipmentDetails
      orderId={id || ""}
      onBack={() => navigate("/client/shipments")}
    />
  );
};
const ClientShoppingDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <ClientShoppingDetails
      requestId={id || ""}
      onBack={() => navigate("/client/shopping")}
    />
  );
};
const ClientInvoiceDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <ClientInvoiceDetails
      id={id || ""}
      onBack={() => navigate("/client/invoices")}
    />
  );
};
const ClientTicketDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <ClientTicketDetails
      id={id || ""}
      onBack={() => navigate("/client/support")}
    />
  );
};

const ClientDeliveryDetailsWrapper = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  return (
    <ClientDeliveryDetails
      deliveryId={deliveryId || ""}
      onBack={() => navigate("/client/deliveries")}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
