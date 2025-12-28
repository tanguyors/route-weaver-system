import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TripsPage from "./pages/dashboard/TripsPage";
import SchedulesPage from "./pages/dashboard/SchedulesPage";
import DiscountsPage from "./pages/dashboard/DiscountsPage";
import BookingsPage from "./pages/dashboard/BookingsPage";
import OfflineBookingPage from "./pages/dashboard/OfflineBookingPage";
import PaymentLinksPage from "./pages/dashboard/PaymentLinksPage";
import CheckinPage from "./pages/dashboard/CheckinPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import TransactionsPage from "./pages/dashboard/TransactionsPage";
import WidgetPage from "./pages/dashboard/WidgetPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartnersPage from "./pages/admin/AdminPartnersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Partner Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
            <Route path="/dashboard/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
            <Route path="/dashboard/discounts" element={<ProtectedRoute><DiscountsPage /></ProtectedRoute>} />
            <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/offline-booking" element={<ProtectedRoute><OfflineBookingPage /></ProtectedRoute>} />
            <Route path="/dashboard/payment-links" element={<ProtectedRoute><PaymentLinksPage /></ProtectedRoute>} />
            <Route path="/dashboard/checkin" element={<ProtectedRoute><CheckinPage /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/dashboard/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/dashboard/widget" element={<ProtectedRoute><WidgetPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><AdminPartnersPage /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/admin/commissions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminPartnersPage /></ProtectedRoute>} />
            <Route path="/admin/ports" element={<ProtectedRoute><AdminPartnersPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
