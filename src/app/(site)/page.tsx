'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Server, Clock1, Users2, ShieldCheck } from 'lucide-react';

import Button from '@mui/material/Button';

import { useGsapFadeUp, useGsapFloatY, useGsapStaggerChildrenOnScroll } from 'src/hooks/use-gsap';

import Footer from '../../components/footer/Footer';
import StatCards from '../../components/landing-page/StatCards';
import FeatureCards from '../../components/landing-page/FeatureCards';
import { AnimatedText } from '@/components/AnimatedText';
import { useScrollContainer } from '@/contexts/ScrollContainerContext';

// ----------------------------------------------------------------------

export default function LandingPage() {
  const heroTextRef = useRef<HTMLDivElement | null>(null);
  const statsGridRef = useRef<HTMLDivElement | null>(null);
  const featuresGridRef = useRef<HTMLDivElement | null>(null);
  const bottomSectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollContainer } = useScrollContainer();

  // Animations using reusable hooks
  useGsapStaggerChildrenOnScroll(statsGridRef, { fromY: 30, scroller: scrollContainer || undefined });
  useGsapStaggerChildrenOnScroll(featuresGridRef, { fromY: 24, scroller: scrollContainer || undefined });
  useGsapFadeUp(bottomSectionRef);

  return (
    <>
      <div className="p-16 min-h-screen">
        <section className="max-w-3xl mx-auto ">
          <div className="relative w-[680px] h-[420px] mx-auto">
            <Image
              src="/assets/images/landing-page/hero-img.png"
              fill
              alt="Landing Page Image"
              className="object-cover rounded-2xl"
            />
          </div>
          <AnimatedText
            animation="words-slide-up"
            as="h1"
            className="text-center text-grey-900 text-2xl font-normal max-w-md mx-auto mt-12 mb-12"
          >
            We streamline club operations and management
          </AnimatedText>
          <div ref={heroTextRef}>
            <AnimatedText
              animation="words-rotate-in"
              as="h1"
              className="header-1"
            >
              Run your clubs smarter
            </AnimatedText>
            <AnimatedText
              animation="words-slide-from-right"
              as="p"
              className="paragraph-1 mt-2"
            >
              Streamline communication, track attendance, and oversee all clubs in one place — saving time while boosting member engagement.
            </AnimatedText>
          </div>
          <div ref={statsGridRef} className="grid grid-cols-2 gap-4 gap-y-4 pt-8 mx-auto">
            <StatCards
              hasImage={false}
              imageUrl=""
              bigText="3x"
              subText="Faster Member Onboarding"
              imageClass=""
              useAnimation={true}
            />
            <StatCards
              hasImage
              imageUrl="/assets/images/landing-page/trending-up.svg"
              subText="Efficiency Boost"
              bigText=""
              imageClass=""
            />
            <StatCards
              hasImage
              imageUrl="/assets/images/landing-page/centralized.svg"
              subText="Centralize Your Clubs"
              bigText=""
              imageClass="mr-4"
            />
            <StatCards
              hasImage={false}
              imageUrl=""
              subText="Faster Attendance Recording"
              bigText="90%"
              imageClass=""
              useAnimation={true}
            />
          </div>
          <div className="pt-16">
            <AnimatedText
              animation="words-rotate-in"
              as="h1"
              className="header-1"
            >
              Smart Club Management
            </AnimatedText>
            <AnimatedText
              animation="words-slide-up"
              as="p"
              className="paragraph-1 mt-2"
            >
              Get real-time insights on members, attendance, and events — all from one intuitive dashboard.
            </AnimatedText>
            <div ref={featuresGridRef} className="grid grid-cols-4 gap-2 pt-8">
              <FeatureCards
                text="Secure Data Management"
                lucideIcon={<ShieldCheck className="h-10 w-10 text-white" />}
              />
              <FeatureCards
                text="Reliable System Performance"
                lucideIcon={<Server className="h-10 w-10 text-white" />}
              />
              <FeatureCards
                text="Automated Workflow Processes"
                lucideIcon={<Clock1 className="h-10 w-10 text-white" />}
              />
              <FeatureCards
                text="Enhanced Team Communication"
                lucideIcon={<Users2 className="h-10 w-10 text-white" />}
              />
            </div>
            <div className="pt-32">
              <div ref={bottomSectionRef} className="relative w-[680px] h-[420px] mx-auto">
                <Image
                  src="/assets/images/landing-page/aerial-view.webp"
                  fill
                  alt="Landing Page Image"
                  className="object-cover rounded-2xl"
                />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <AnimatedText
                    animation="words-slide-up"
                    as="p"
                    className="text-2xl text-white font-medium max-w-md mb-4"
                  >
                    Take full control of your clubs on the go — track attendance, manage events, and
                    coordinate members directly from our website
                  </AnimatedText>
                  <Button
                    variant="contained"
                    className="!bg-mui-grey-900 !text-mui-grey-100 "
                    disableElevation
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}


