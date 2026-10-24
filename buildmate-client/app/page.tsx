import About from "./Components/LandingPage/About";
import Hero from "./Components/LandingPage/Hero";
import Navbar from "./Components/LandingPage/Navbar";
import Features from "./Components/LandingPage/Features";
import HowItWorks from "./Components/LandingPage/Works";
import MobileAppBanner from "./Components/LandingPage/MobileAppBanner";
import Team from "./Components/LandingPage/Team";
import Footer from "./Components/LandingPage/Footers";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <MobileAppBanner />
      <Team />
      <Footer />
    </main>
  );
}
