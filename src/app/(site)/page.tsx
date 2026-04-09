import { Metadata } from "next";
import Achievements from "@/components/home/achievements";
import Brand from "@/components/home/brand";
import CreativeMind from "@/components/home/creative-mind";
import CustomerStories from "@/components/home/customer-stories";
import Faq from "@/components/home/faq";
import HeroSection from "@/components/home/hero";
import Innovation from "@/components/home/innovation";
import OnlinePresence from "@/components/home/online-presence";
import Solutions from "@/components/home/solution";
import Subscription from "@/components/home/subscription";
import WebResult from "@/components/home/web-result";

export const metadata: Metadata = {
    title: "CMS",
};


export default function Home() {
  return (
    <main className="overflow-hidden">
      {/* ---------------------Hero section Starts----------------- */}
      <section id="home">
        <HeroSection />
      </section>
      {/* ---------------------Hero section Ends----------------- */}

      {/* ---------------------About section Starts----------------- */}
      <section id="about">
        <Brand />
        <WebResult />
      </section>
      {/* ---------------------About section Ends----------------- */}

      {/* ---------------------Features section Starts----------------- */}
      <section id="features">
        <Innovation />
      </section>
      {/* ---------------------Features section Ends----------------- */}

      {/* ---------------------Reviews section Starts----------------- */}
      <section id="reviews">
        <CustomerStories />
      </section>
      {/* ---------------------Reviews section Ends----------------- */}

      {/* ---------------------Subscription section Starts-----------------  */}
      {/* <Subscription /> */}
      {/* ---------------------Subscription section Ends-----------------  */}

      {/* ---------------------Faq section Starts----------------- */}
      <section id="faq">
        <Faq />
      </section>
      {/* ---------------------Faq section Ends----------------- */}

      {/* ---------------------Solutions section Starts-----------------  */}
      <Solutions />
      {/* ---------------------Solutions section Ends-----------------  */}
    </main>
  )
}
