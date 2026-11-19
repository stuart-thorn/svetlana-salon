import { lazy, Suspense } from "react";
import { useLocation } from "./router";
import Header from "./components/Header";
import Home from "./components/Home";
import About from "./components/About";
import Bookings from "./components/Bookings";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const BookingPage = lazy(() => import("./booking/BookingPage"));

export default function App() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/book")) {
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
        <Contact />
      </main>
      <Footer />
    </>
  );
}
