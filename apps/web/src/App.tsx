import { lazy, Suspense, useEffect } from "react";
import { isPrelaunch } from "./data/content";
import { navigate, useLocation } from "./router";
import Header from "./components/Header";
import Home from "./components/Home";
import About from "./components/About";
import Bookings from "./components/Bookings";
import Contact from "./components/Contact";
import Offers from "./components/Offers";
import Footer from "./components/Footer";
import StickyBookBar from "./components/StickyBookBar";

const BookingPage = lazy(() => import("./booking/BookingPage"));
const Privacy = lazy(() => import("./components/Privacy"));
const BuyPage = lazy(() => import("./booking/BuyPage"));
const AccountPage = lazy(() => import("./booking/AccountPage"));
const ManagePage = lazy(() => import("./booking/ManagePage"));

export default function App() {
  const { pathname } = useLocation();

  // Pre-launch: no booking flow. A /book link lands on the home page instead.
  const toBook = pathname.startsWith("/book");
  useEffect(() => {
    if (isPrelaunch && toBook) navigate("/", { replace: true });
  }, [toBook]);

  if (pathname === "/privacy") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Privacy />
        <Footer />
      </Suspense>
    );
  }

  if (pathname === "/account" && !isPrelaunch) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <AccountPage />
      </Suspense>
    );
  }

  if (pathname === "/manage" && !isPrelaunch) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <ManagePage />
      </Suspense>
    );
  }

  if (pathname === "/buy" && !isPrelaunch) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <BuyPage />
      </Suspense>
    );
  }

  if (toBook && !isPrelaunch) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <BookingPage />
      </Suspense>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Home />
        <About />
        <Bookings />
        <Offers />
        <Contact />
      </main>
      <Footer />
      {!isPrelaunch && <StickyBookBar />}
    </>
  );
}
