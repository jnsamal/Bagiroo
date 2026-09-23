import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from './components/layout/StorefrontLayout';
import RequireAuth from './components/auth/RequireAuth';
import AccountLayout from './components/account/AccountLayout';
import AdminLayout from './components/admin/AdminLayout';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ShopByCategory from './pages/ShopByCategory';
import CategoryArchive from './pages/CategoryArchive';
import NewArrivals from './pages/NewArrivals';
import BestSellers from './pages/BestSellers';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Gifting from './pages/Gifting';
import ShopByVideo from './pages/ShopByVideo';
import StoreLocator from './pages/StoreLocator';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountDashboard from './pages/AccountDashboard';
import AccountOrders from './pages/AccountOrders';
import AccountOrderDetail from './pages/AccountOrderDetail';
import AccountAddresses from './pages/AccountAddresses';
import AccountSecurity from './pages/AccountSecurity';
import AccountDetails from './pages/AccountDetails';
import AccountWishlist from './pages/AccountWishlist';
import AccountSupport from './pages/AccountSupport';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminProductImport from './pages/admin/AdminProductImport';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminReturns from './pages/admin/AdminReturns';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminWebsite from './pages/admin/AdminWebsite';
import AdminContent from './pages/admin/AdminContent';
import AdminSecurity from './pages/admin/AdminSecurity';
import ContentPage from './pages/ContentPage';
import Contact from './pages/Contact';

// Small helper so every /account/* leaf route doesn't repeat the same
// RequireAuth + AccountLayout wrapping.
function protectedAccountPage(element) {
  return (
    <RequireAuth>
      <AccountLayout>{element}</AccountLayout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Storefront: single shared layout (header/footer/announcement bar)
          via <Outlet/>, per the standard React Router layout-route pattern. */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/categories" element={<ShopByCategory />} />
        <Route path="/shop/category/:slug" element={<CategoryArchive />} />
        <Route path="/new-arrivals" element={<NewArrivals />} />
        <Route path="/best-sellers" element={<BestSellers />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:slug" element={<CollectionDetail />} />
        <Route path="/gifting" element={<Gifting />} />
        <Route path="/shop-by-video" element={<ShopByVideo />} />
        <Route path="/store-locator" element={<ContentPage title="Store Locator" contentKey="storeLocatorContent" />} />
        <Route path="/contact" element={<RequireAuth><Contact /></RequireAuth>} />
        <Route path="/refund-policy" element={<ContentPage title="Refund policy" contentKey="refundContent" />} />
        <Route path="/terms" element={<ContentPage title="Terms and conditions" contentKey="termsContent" />} />
        <Route path="/privacy" element={<ContentPage title="Privacy policy" contentKey="privacyContent" />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:slug" element={<ProductDetail />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/account" element={protectedAccountPage(<AccountDashboard />)} />
        <Route path="/account/orders" element={protectedAccountPage(<AccountOrders />)} />
        <Route path="/account/orders/:id" element={protectedAccountPage(<AccountOrderDetail />)} />
        <Route path="/account/addresses" element={protectedAccountPage(<AccountAddresses />)} />
        <Route path="/account/security" element={protectedAccountPage(<AccountSecurity />)} />
        <Route path="/account/details" element={protectedAccountPage(<AccountDetails />)} />
        <Route path="/account/wishlist" element={protectedAccountPage(<AccountWishlist />)} />
        <Route path="/account/support" element={protectedAccountPage(<AccountSupport />)} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin has its own layout/shell, deliberately outside the
          storefront header/footer/announcement bar. */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/import" element={<AdminProductImport />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="coupons" element={<AdminContent resource="coupons" />} />
        <Route path="testimonials" element={<AdminContent resource="testimonials" />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="website" element={<AdminWebsite />} />
        <Route path="content/:resource" element={<AdminContent />} />
        <Route path="security" element={<AdminSecurity />} />
      </Route>
    </Routes>
  );
}
