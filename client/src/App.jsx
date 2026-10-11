import { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import StorefrontLayout from './components/layout/StorefrontLayout';
import RequireAuth from './components/auth/RequireAuth';
import AdminRoute from './components/auth/AdminRoute';

const AccountLayout = lazy(() => import('./components/account/AccountLayout'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ShopByCategory = lazy(() => import('./pages/ShopByCategory'));
const CategoryArchive = lazy(() => import('./pages/CategoryArchive'));
const NewArrivals = lazy(() => import('./pages/NewArrivals'));
const BestSellers = lazy(() => import('./pages/BestSellers'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const Gifting = lazy(() => import('./pages/Gifting'));
const ShopByVideo = lazy(() => import('./pages/ShopByVideo'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AccountDashboard = lazy(() => import('./pages/AccountDashboard'));
const AccountOrders = lazy(() => import('./pages/AccountOrders'));
const AccountOrderDetail = lazy(() => import('./pages/AccountOrderDetail'));
const AccountAddresses = lazy(() => import('./pages/AccountAddresses'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));
const AccountDetails = lazy(() => import('./pages/AccountDetails'));
const AccountWishlist = lazy(() => import('./pages/AccountWishlist'));
const AccountSupport = lazy(() => import('./pages/AccountSupport'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminProductImport = lazy(() => import('./pages/admin/AdminProductImport'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminWebsite = lazy(() => import('./pages/admin/AdminWebsite'));
const AdminContent = lazy(() => import('./pages/admin/AdminContent'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const Contact = lazy(() => import('./pages/Contact'));

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
    <Suspense fallback={<div role="status" className="flex min-h-[45vh] items-center justify-center text-sm text-muted">Loading page…</div>}>
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
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/import" element={<AdminProductImport />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:id" element={<AdminCustomerDetail />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="coupons" element={<AdminContent resource="coupons" />} />
        <Route path="testimonials" element={<AdminContent resource="testimonials" />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="website" element={<AdminWebsite />} />
        <Route path="content/:resource" element={<AdminContent />} />
        <Route path="security" element={<Navigate to="/admin/settings" replace />} />
      </Route>
      </Routes>
    </Suspense>
  );
}
