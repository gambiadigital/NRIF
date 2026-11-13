import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Hero } from "@/components/landing/Hero";
import { Ticker, WhyWeRun } from "@/components/landing/Story";
import { Events } from "@/components/landing/Events";
import { RaceDay } from "@/components/landing/RaceDay";
import { Abroad } from "@/components/landing/Abroad";
import { Challenge, Kit, Gallery, Faq, FinalCta } from "@/components/landing/More";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <SiteHeader overlay />
      <main>
        <Hero />
        <Ticker />
        <WhyWeRun />
        <Events />
        <RaceDay />
        <Abroad />
        <Challenge />
        <Kit />
        <Gallery />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
