import React, { useState, useEffect } from "react";
import { AuthUser } from "./api/types/auth";
import Landing from "./pages/Landing";
import MainLayout from "./components/Layout/MainLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import WarehouseOperations from "./pages/admin/WarehouseOperations";
import Orders from "./pages/admin/Orders";
import OrderDetails from "./pages/admin/OrderDetails";
import Freight from "./pages/admin/Freight";
import FreightDetails from "./pages/admin/FreightDetails";
import Compliance from "./pages/admin/Compliance";
import Invoices from "./pages/admin/Invoices";
import InvoiceDetails from "./pages/admin/InvoiceDetails";
import Payments from "./pages/admin/Payments";
import PaymentDetails from "./pages/admin/PaymentDetails";
import AssistedShopping from "./pages/admin/AssistedShopping";
import ShoppingDetails from "./pages/admin/ShoppingDetails";
import Users from "./pages/admin/Users";
import UserDetails from "./pages/admin/UserDetails";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import ClientDashboard from "./pages/client/ClientDashboard";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";

// ADMIN IMPORTS
import Inventory from "./pages/admin/Inventory";
import InventoryDetails from "./pages/admin/InventoryDetails";
import Expenses from "./pages/admin/Expenses";
import ExpenseDetails from "./pages/admin/ExpenseDetails";
import Suppliers from "./pages/admin/Suppliers";
import SupplierDetails from "./pages/admin/SupplierDetails";
import Delivery from "./pages/admin/Delivery";
import DeliveryDetails from "./pages/admin/DeliveryDetails";
import Ticketing from "./pages/admin/Ticketing";
import TicketDetails from "./pages/admin/TicketDetails";

// CLIENT IMPORTS
import MyOrders from "./pages/client/MyOrders";
import ClientOrderDetails from "./pages/client/OrderDetails";
import ShoppingRequests from "./pages/client/ShoppingRequests";
import ClientShoppingDetails from "./pages/client/ShoppingDetails";
import ClientInvoices from "./pages/client/ClientInvoices";
import ClientInvoiceDetails from "./pages/client/ClientInvoiceDetails";
import Tracking from "./pages/client/Tracking";
import ClientSupport from "./pages/client/ClientSupport";
import ClientTicketDetails from "./pages/client/TicketDetails";
import ClientProfile from "./pages/client/ClientProfile";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientSettings from "./pages/client/ClientSettings";
import ShippingCalculator from "./pages/client/ShippingCalculator";

// Routing map with Dynamic ID support simulation
const ADMIN_ROUTES: Record<string, React.ReactNode> = {
  "/admin/dashboard": <AdminDashboard />,
  "/admin/profile": <AdminProfile />,
  "/admin/notifications": <AdminNotifications />,
  "/admin/orders": <Orders />,
  "/admin/warehouse": <WarehouseOperations />,
  "/admin/inventory": <Inventory />,
  "/admin/freight": <Freight />,
  "/admin/delivery": <Delivery />,
  "/admin/compliance": <Compliance />,
  "/admin/invoices": <Invoices />,
  "/admin/expenses": <Expenses />,
  "/admin/payments": <Payments />,
  "/admin/shopping": <AssistedShopping />,
  "/admin/suppliers": <Suppliers />,
  "/admin/users": <Users />,
  "/admin/tickets": <Ticketing />,
  "/admin/reports": <Reports />,
  "/admin/settings": <Settings />,
};

const CLIENT_ROUTES: Record<string, React.ReactNode> = {
  "/client/dashboard": <ClientDashboard />,
  "/client/profile": <ClientProfile />,
  "/client/orders": <MyOrders />,
  "/client/shopping": <ShoppingRequests />,
  "/client/calculator": <ShippingCalculator />,
  "/client/invoices": <ClientInvoices />,
  "/client/tracking": <Tracking />,
  "/client/support": <ClientSupport />,
  "/client/notifications": <ClientNotifications />,
  "/client/settings": <ClientSettings />,
};

function AppContent() {
  const { user, isAuthenticated, logout } = useAuthContext();
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setCurrentPath(event.detail);
      window.scrollTo(0, 0);
    };

    window.addEventListener("app-navigate", handleNavigate as EventListener);

    // Set initial path
    if (isAuthenticated && user) {
      const isAdmin =
        user.user_type === "super_user" || user.user_type === "staff";
      setCurrentPath(isAdmin ? "/admin/dashboard" : "/client/dashboard");
    }

    return () => {
      window.removeEventListener(
        "app-navigate",
        handleNavigate as EventListener
      );
    };
  }, [isAuthenticated, user]);

  const handleNavigate = (path: string) => {
    const event = new CustomEvent("app-navigate", { detail: path });
    window.dispatchEvent(event);
  };

  const renderContent = () => {
    const isAdmin =
      user?.user_type === "super_user" || user?.user_type === "staff";

    if (isAdmin) {
      // ADMIN DYNAMIC ROUTES
      if (currentPath.startsWith("/admin/users/")) {
        const userId = currentPath.split("/").pop();
        return (
          <UserDetails
            userId={userId || ""}
            onBack={() => handleNavigate("/admin/users")}
          />
        );
      }
      if (currentPath.startsWith("/admin/orders/")) {
        const orderId = currentPath.split("/").pop();
        return (
          <OrderDetails
            orderId={orderId || ""}
            onBack={() => handleNavigate("/admin/orders")}
          />
        );
      }
      if (currentPath.startsWith("/admin/invoices/")) {
        const invoiceId = currentPath.split("/").pop();
        return (
          <InvoiceDetails
            invoiceId={invoiceId || ""}
            onBack={() => handleNavigate("/admin/invoices")}
          />
        );
      }
      if (currentPath.startsWith("/admin/freight/")) {
        const freightId = currentPath.split("/").pop();
        return (
          <FreightDetails
            freightId={freightId || ""}
            onBack={() => handleNavigate("/admin/freight")}
          />
        );
      }
      if (currentPath.startsWith("/admin/payments/")) {
        const paymentId = currentPath.split("/").pop();
        return (
          <PaymentDetails
            paymentId={paymentId || ""}
            onBack={() => handleNavigate("/admin/payments")}
          />
        );
      }
      if (currentPath.startsWith("/admin/shopping/")) {
        const requestId = currentPath.split("/").pop();
        return (
          <ShoppingDetails
            requestId={requestId || ""}
            onBack={() => handleNavigate("/admin/shopping")}
          />
        );
      }
      if (currentPath.startsWith("/admin/inventory/")) {
        const id = currentPath.split("/").pop();
        return (
          <InventoryDetails
            id={id || ""}
            onBack={() => handleNavigate("/admin/inventory")}
          />
        );
      }
      if (currentPath.startsWith("/admin/expenses/")) {
        const id = currentPath.split("/").pop();
        return (
          <ExpenseDetails
            id={id || ""}
            onBack={() => handleNavigate("/admin/expenses")}
          />
        );
      }
      if (currentPath.startsWith("/admin/suppliers/")) {
        const id = currentPath.split("/").pop();
        return (
          <SupplierDetails
            id={id || ""}
            onBack={() => handleNavigate("/admin/suppliers")}
          />
        );
      }
      if (currentPath.startsWith("/admin/delivery/")) {
        const id = currentPath.split("/").pop();
        return (
          <DeliveryDetails
            id={id || ""}
            onBack={() => handleNavigate("/admin/delivery")}
          />
        );
      }
      if (currentPath.startsWith("/admin/tickets/")) {
        const id = currentPath.split("/").pop();
        return (
          <TicketDetails
            id={id || ""}
            onBack={() => handleNavigate("/admin/tickets")}
          />
        );
      }

      return ADMIN_ROUTES[currentPath] || <AdminDashboard />;
    } else {
      // CLIENT DYNAMIC ROUTES
      if (currentPath.startsWith("/client/orders/")) {
        const id = currentPath.split("/").pop();
        return (
          <ClientOrderDetails
            id={id || ""}
            onBack={() => handleNavigate("/client/orders")}
          />
        );
      }
      if (currentPath.startsWith("/client/shopping/")) {
        const id = currentPath.split("/").pop();
        return (
          <ClientShoppingDetails
            id={id || ""}
            onBack={() => handleNavigate("/client/shopping")}
          />
        );
      }
      if (currentPath.startsWith("/client/invoices/")) {
        const id = currentPath.split("/").pop();
        return (
          <ClientInvoiceDetails
            id={id || ""}
            onBack={() => handleNavigate("/client/invoices")}
          />
        );
      }
      if (currentPath.startsWith("/client/support/")) {
        const id = currentPath.split("/").pop();
        return (
          <ClientTicketDetails
            id={id || ""}
            onBack={() => handleNavigate("/client/support")}
          />
        );
      }

      return CLIENT_ROUTES[currentPath] || <ClientDashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Landing />;
  }

  const userRole =
    user?.user_type === "super_user" || user?.user_type === "staff"
      ? "ADMIN"
      : "CLIENT";

  return (
    <MainLayout
      role={userRole}
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onLogout={logout}
    >
      {renderContent()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
