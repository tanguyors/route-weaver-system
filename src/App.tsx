import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleProtectedRoute from "@/components/ModuleProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ModuleSelector from "./pages/ModuleSelector";
import Dashboard from "./pages/Dashboard";
import TripsPage from "./pages/dashboard/TripsPage";
import SchedulesPage from "./pages/dashboard/SchedulesPage";
import DiscountsPage from "./pages/dashboard/DiscountsPage";
import AddonsPage from "./pages/dashboard/AddonsPage";
import BookingsPage from "./pages/dashboard/BookingsPage";
import OfflineBookingPage from "./pages/dashboard/OfflineBookingPage";
import PaymentLinksPage from "./pages/dashboard/PaymentLinksPage";
import CheckinPage from "./pages/dashboard/CheckinPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import TransactionsPage from "./pages/dashboard/TransactionsPage";
import WidgetPage from "./pages/dashboard/WidgetPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import BoatsPage from "./pages/dashboard/BoatsPage";
import PrivateBoatsPage from "./pages/dashboard/PrivateBoatsPage";
import ActivityDashboard from "./pages/activity-dashboard/ActivityDashboard";
import ActivityCategoriesPage from "./pages/activity-dashboard/ActivityCategoriesPage";
import ActivityProductsPage from "./pages/activity-dashboard/ActivityProductsPage";
import ActivityProductFormPage from "./pages/activity-dashboard/ActivityProductFormPage";
import ActivityAvailabilityPage from "./pages/activity-dashboard/ActivityAvailabilityPage";
import ActivityBookingsPage from "./pages/activity-dashboard/ActivityBookingsPage";
import ActivityBookingDetailPage from "./pages/activity-dashboard/ActivityBookingDetailPage";
import ActivityReportsPage from "./pages/activity-dashboard/ActivityReportsPage";
import ActivityPayoutsPage from "./pages/activity-dashboard/ActivityPayoutsPage";
import ActivityInvoicesPage from "./pages/activity-dashboard/ActivityInvoicesPage";
import ActivityBillingSettingsPage from "./pages/activity-dashboard/ActivityBillingSettingsPage";
import ActivityWidgetConfigPage from "./pages/activity-dashboard/ActivityWidgetConfigPage";
import ActivitySettingsPage from "./pages/activity-dashboard/ActivitySettingsPage";
import ActivityCheckinPage from "./pages/activity-dashboard/ActivityCheckinPage";
import AccommodationDashboard from "./pages/accommodation-dashboard/AccommodationDashboard";
import AccommodationListPage from "./pages/accommodation-dashboard/AccommodationListPage";
import AccommodationFormPage from "./pages/accommodation-dashboard/AccommodationFormPage";
import AccommodationCalendarPage from "./pages/accommodation-dashboard/AccommodationCalendarPage";
import AccommodationBookingsPage from "./pages/accommodation-dashboard/AccommodationBookingsPage";
import AccommodationIcalSyncPage from "./pages/accommodation-dashboard/AccommodationIcalSyncPage";
import AccommodationReportsPage from "./pages/accommodation-dashboard/AccommodationReportsPage";
import AccommodationTransactionsPage from "./pages/accommodation-dashboard/AccommodationTransactionsPage";
import AccommodationSettingsPage from "./pages/accommodation-dashboard/AccommodationSettingsPage";
import AccommodationDiscountsPage from "./pages/accommodation-dashboard/AccommodationDiscountsPage";
import AccommodationWidgetConfigPage from "./pages/accommodation-dashboard/AccommodationWidgetPage";
import AccommodationWidgetPublicPage from "./pages/accommodation-widget/AccommodationWidgetPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartnersPage from "./pages/admin/AdminPartnersPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminPortsPage from "./pages/admin/AdminPortsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminActivityPayoutsPage from "./pages/admin/AdminActivityPayoutsPage";
import AdminActivityInvoicesPage from "./pages/admin/AdminActivityInvoicesPage";
import AdminActivityCommissionsPage from "./pages/admin/AdminActivityCommissionsPage";
import AdminCommissionsPage from "./pages/admin/AdminCommissionsPage";
import AdminAccommodationBookingsPage from "./pages/admin/AdminAccommodationBookingsPage";
import AdminAccommodationCommissionsPage from "./pages/admin/AdminAccommodationCommissionsPage";
import AdminFacilitiesPage from "./pages/admin/AdminFacilitiesPage";
import NotFound from "./pages/NotFound";
import WidgetBooking from "./pages/WidgetBooking";
import WidgetBookingNew from "./pages/WidgetBookingNew";
import PaymentPage from "./pages/PaymentPage";
import ModifyTicket from "./pages/ModifyTicket";
import ActivityWidgetPage from "./pages/activity-widget/ActivityWidgetPage";
import ActivityCheckoutPage from "./pages/activity-widget/ActivityCheckoutPage";
import ActivityWidgetListPage from "./pages/activity-widget/ActivityWidgetListPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OnboardingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/book" element={<WidgetBooking />} />
            <Route path="/book-new" element={<WidgetBookingNew />} />
            <Route path="/booking" element={<WidgetBookingNew />} />
            <Route path="/modify-ticket" element={<ModifyTicket />} />
            <Route path="/pay/:token" element={<PaymentPage />} />
            
            {/* Accommodation Widget Route (Public) */}
            <Route path="/accommodation/:widgetKey" element={<AccommodationWidgetPublicPage />} />
            
            {/* Activity Widget Routes (Public) */}
            <Route path="/activity-widget" element={<ActivityWidgetListPage />} />
            <Route path="/widget/activity/:productId" element={<ActivityWidgetPage />} />
            <Route path="/activity/checkout/:bookingId" element={<ActivityCheckoutPage />} />
            
            {/* Module Selector */}
            <Route path="/select-module" element={<ProtectedRoute><ModuleSelector /></ProtectedRoute>} />
            
            {/* Boat Partner Dashboard Routes */}
            <Route path="/dashboard" element={<ModuleProtectedRoute requiredModule="boat"><Dashboard /></ModuleProtectedRoute>} />
            <Route path="/dashboard/boats" element={<ModuleProtectedRoute requiredModule="boat"><BoatsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/private-boats" element={<ModuleProtectedRoute requiredModule="boat"><PrivateBoatsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/trips" element={<ModuleProtectedRoute requiredModule="boat"><TripsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/schedules" element={<ModuleProtectedRoute requiredModule="boat"><SchedulesPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/discounts" element={<ModuleProtectedRoute requiredModule="boat"><DiscountsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/addons" element={<ModuleProtectedRoute requiredModule="boat"><AddonsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/bookings" element={<ModuleProtectedRoute requiredModule="boat"><BookingsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/offline-booking" element={<ModuleProtectedRoute requiredModule="boat"><OfflineBookingPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/payment-links" element={<ModuleProtectedRoute requiredModule="boat"><PaymentLinksPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/checkin" element={<ModuleProtectedRoute requiredModule="boat"><CheckinPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ModuleProtectedRoute requiredModule="boat"><ReportsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/transactions" element={<ModuleProtectedRoute requiredModule="boat"><TransactionsPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/widget" element={<ModuleProtectedRoute requiredModule="boat"><WidgetPage /></ModuleProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ModuleProtectedRoute requiredModule="boat"><SettingsPage /></ModuleProtectedRoute>} />
            
            {/* Activity Partner Dashboard Routes */}
            <Route path="/activity-dashboard" element={<ModuleProtectedRoute requiredModule="activity"><ActivityDashboard /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/categories" element={<ModuleProtectedRoute requiredModule="activity"><ActivityCategoriesPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/products" element={<ModuleProtectedRoute requiredModule="activity"><ActivityProductsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/products/new" element={<ModuleProtectedRoute requiredModule="activity"><ActivityProductFormPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/products/:id" element={<ModuleProtectedRoute requiredModule="activity"><ActivityProductFormPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/availability" element={<ModuleProtectedRoute requiredModule="activity"><ActivityAvailabilityPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/bookings" element={<ModuleProtectedRoute requiredModule="activity"><ActivityBookingsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/bookings/:id" element={<ModuleProtectedRoute requiredModule="activity"><ActivityBookingDetailPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/reports" element={<ModuleProtectedRoute requiredModule="activity"><ActivityReportsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/payouts" element={<ModuleProtectedRoute requiredModule="activity"><ActivityPayoutsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/invoices" element={<ModuleProtectedRoute requiredModule="activity"><ActivityInvoicesPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/settings/billing" element={<ModuleProtectedRoute requiredModule="activity"><ActivityBillingSettingsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/widget" element={<ModuleProtectedRoute requiredModule="activity"><ActivityWidgetConfigPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/settings" element={<ModuleProtectedRoute requiredModule="activity"><ActivitySettingsPage /></ModuleProtectedRoute>} />
            <Route path="/activity-dashboard/checkin" element={<ModuleProtectedRoute requiredModule="activity"><ActivityCheckinPage /></ModuleProtectedRoute>} />
            
            {/* Accommodation Partner Dashboard Routes */}
            <Route path="/accommodation-dashboard" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationDashboard /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/list" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationListPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/accommodations/new" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationFormPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/accommodations/:id" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationFormPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/calendar" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationCalendarPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/bookings" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationBookingsPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/discounts" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationDiscountsPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/ical-sync" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationIcalSyncPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/widget" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationWidgetConfigPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/reports" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationReportsPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/transactions" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationTransactionsPage /></ModuleProtectedRoute>} />
            <Route path="/accommodation-dashboard/settings" element={<ModuleProtectedRoute requiredModule="accommodation"><AccommodationSettingsPage /></ModuleProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><AdminPartnersPage /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/admin/commissions" element={<ProtectedRoute><AdminCommissionsPage /></ProtectedRoute>} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute><AdminWithdrawalsPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/ports" element={<ProtectedRoute><AdminPortsPage /></ProtectedRoute>} />
             <Route path="/admin/facilities" element={<ProtectedRoute><AdminFacilitiesPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/activity-payouts" element={<ProtectedRoute><AdminActivityPayoutsPage /></ProtectedRoute>} />
            <Route path="/admin/activity-invoices" element={<ProtectedRoute><AdminActivityInvoicesPage /></ProtectedRoute>} />
            <Route path="/admin/activity-commissions" element={<ProtectedRoute><AdminActivityCommissionsPage /></ProtectedRoute>} />
            <Route path="/admin/accommodation-bookings" element={<ProtectedRoute><AdminAccommodationBookingsPage /></ProtectedRoute>} />
            <Route path="/admin/accommodation-commissions" element={<ProtectedRoute><AdminAccommodationCommissionsPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OnboardingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
