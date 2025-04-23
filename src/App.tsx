import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import CustomizeFormPage from './pages/CustomizeFormPage';
import GeneratePromptPage from './pages/GeneratePromptPage';
import UploadDesignPage from './pages/UploadDesignPage';
import OrderPage from './pages/OrderPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import AccountPage from './pages/AccountPage';
import AdminLoginPage from './pages/admin/LoginPage';
import AdminDashboard from './pages/admin/DashboardPage';
import AdminOrders from './pages/admin/OrdersPage';
import AdminCustomers from './pages/admin/CustomersPage';
import AdminCustomerDetail from './pages/admin/CustomerDetailPage';

const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  },
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router {...router}>
          <Routes>
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="clients" element={<AdminCustomers />} />
              <Route path="clients/:customerId" element={<AdminCustomerDetail />} />
            </Route>
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Public routes */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col bg-gray-50">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/personnaliser" element={<CustomizeFormPage />} />
                      <Route path="/generer" element={<GeneratePromptPage />} />
                      <Route path="/deposer" element={<UploadDesignPage />} />
                      <Route path="/commander" element={<OrderPage />} />
                      <Route path="/panier" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/suivi-commande" element={<OrderTrackingPage />} />
                      <Route path="/success" element={<SuccessPage />} />
                      <Route path="/cancel" element={<CancelPage />} />
                      <Route path="/compte" element={<AccountPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;