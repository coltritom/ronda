import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Testimonials } from "@/components/landing/Testimonials";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";
import { CTAFinal } from "@/components/landing/CTAFinal";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-noche text-humo overflow-x-hidden">
      <Navbar />
      <Hero />
      <Testimonials />
      <Stats />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  );
}
