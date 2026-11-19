import Header from "./components/Header";
import Home from "./components/Home";
import About from "./components/About";
import Bookings from "./components/Bookings";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
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
