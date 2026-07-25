
import React, { useEffect, useRef, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import CartSidebar from './components/CartSidebar';
import FlyToCart from './components/FlyToCart';
import Home from './pages/Home';
const Products = React.lazy(() => import('./pages/Products'));
const MyAccount = React.lazy(() => import('./pages/MyAccount'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Login = React.lazy(() => import('./pages/Login'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));

const DynamicPage = React.lazy(() => import('./pages/DynamicPage'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
import PageSkeleton from './components/PageSkeleton';
import LoadingScreen from './components/LoadingScreen';
import { StoreProvider, useStore } from './context/StoreContext';

const AppContent: React.FC = () => {
  const { isAdmin, loading } = useStore();
  const { pathname } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Setup smooth scrolling with Lenis on mount
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth ease-out
      smoothWheel: true
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);



  return (
    <>
      {loading && pathname === '/' && <LoadingScreen />}
      <div className="min-h-screen flex flex-col font-sans">
        <FlyToCart />
        <Header />
        <CartSidebar />
      <main className="flex-grow min-h-[100vh]">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={
              <Suspense fallback={<PageSkeleton type="products" />}>
                <Products />
              </Suspense>
            } />
            <Route path="/product/:slug" element={
              <Suspense fallback={<PageSkeleton type="product-details" />}>
                <ProductDetails />
              </Suspense>
            } />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            <Route path="/admin" element={loading ? <LoadingScreen /> : (isAdmin ? <Admin /> : <Navigate to="/login" />)} />
            <Route path="/admin/:tab" element={loading ? <LoadingScreen /> : (isAdmin ? <Admin /> : <Navigate to="/login" />)} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/category/:categorySlug" element={
              <Suspense fallback={<PageSkeleton type="category" />}>
                <CategoryPage />
              </Suspense>
            } />
            <Route path="/:slug" element={<DynamicPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
        <FloatingContact />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </StoreProvider>
  );
};

export default App;
