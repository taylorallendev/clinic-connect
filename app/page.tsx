"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Clock, BarChart, Stethoscope, PawPrint } from "lucide-react";
import { LandingHeroV2 } from "@/src/components/landing/hero-v2";
import { SectionHeading } from "@/src/components/landing/section-heading";
import { AnimatedTestimonials } from "@/src/components/landing/animated-testimonials";
import { ReactNode, useState } from "react";
import { Container } from "@/src/components/ui/container";
import { Gradient, GradientBackground } from "@/src/components/ui/gradient";
import { BentoCard } from "@/src/components/ui/bento-card";
import { RadiantButton } from "@/src/components/ui/radiant-button";

// Data for testimonials
const testimonials = [
  {
    quote:
      "Odis is different from the other AI scribes I've tried— the diagnosis suggestions actually show up during the appointment, so most of the time I don't even need to touch the note afterward. That's been the biggest game changer for me. It feels more like a tool that works with me instead of something I have to manage.",
    name: "Dr. Deepti Pal",
    designation: "Veterinarian",
    src: "/images/testimonials/vet-1.jpg",
  },
  {
    quote:
      "What I've really loved is that I walk into the room already knowing what I need to. The pre-appointment summaries are short and to the point — behavior notes, allergies, that kind of thing. It saves me time and honestly helps me connect with clients.",
    name: "Dr. Tais Perpetuo",
    designation: "Veterinarian",
    src: "/images/testimonials/vet-2.jpg",
  },
  {
    quote:
      "One of the things clients notice right away is how fast they get follow-up instructions now. Before, they'd wait hours or we'd have to call them way later. Now it's all automated, and I think it makes us look way more organized and responsive.",
    name: "Jenn, Manager",
    designation: "Practice Manager",
    src: "/images/testimonials/vet-3.jpg",
  },
  {
    quote:
      "From my side of things — I'm at the front a lot — it's just taken so much off our plate. Discharge instructions used to be this whole process at the end of every appointment. Now it's basically automatic. Clients get a summary right away, and I can actually focus on helping the people in front of me.",
    name: "Kayla, Receptionist",
    designation: "Receptionist",
    src: "/images/testimonials/vet-4.jpg",
  },
];

function Features() {
  const features = [
    {
      icon: Clock,
      title: "Save Time",
      description:
        "Reduce documentation time with AI-powered note generation and pre-appointment summaries to streamline your workflow.",
    },
    {
      icon: BarChart,
      title: "Improve Clinical Decisions",
      description:
        "Get AI-powered differential diagnosis suggestions to support your clinical reasoning and improve patient outcomes.",
    },
    {
      icon: PawPrint,
      title: "Enhance Patient Care",
      description:
        "Focus more on your patients and less on paperwork, with comprehensive support throughout the appointment lifecycle.",
    },
  ];

  return (
    <section className="relative bg-gray-50 py-16 md:py-32 overflow-hidden">
      <GradientBackground />

      <Container className="relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-gray-950">
            Transform Your Practice's Workflow
          </h2>
          <p className="mt-4 text-gray-600">
            See how OdisAI can help you save time, reduce stress, and improve
            patient care.
          </p>
        </div>
        <div className="mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <BentoCard
                key={index}
                eyebrow={feature.title}
                title={feature.title}
                description={feature.description}
                graphic={
                  <div className="flex items-center justify-center h-full">
                    <div className="rounded-full bg-gray-100 p-6">
                      <Icon className="h-12 w-12 text-teal-600" aria-hidden />
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  const [showNavbar, setShowNavbar] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && (
        <header className="sticky top-0 z-50 w-full bg-black">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-teal-500" />
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Red Hat Display', sans-serif" }}
              >
                OdisAI
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#benefits"
                className="text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Features
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Testimonials
              </Link>
              <Link
                href="#contact"
                className="text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Contact
              </Link>

              {/* Divider */}
              <div className="h-4 w-px bg-zinc-700"></div>

              {/* Authentication Links */}
              <Link
                href="/sign-in"
                className="text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Login
              </Link>
              <Button
                size="sm"
                className="bg-teal-500 hover:bg-teal-400 text-white"
              >
                <Link
                  href="/sign-up"
                  className="text-white no-underline"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  Sign Up
                </Link>
              </Button>

              {/* User Profile (when authenticated) - Hidden for now */}
              {false && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                      JD
                    </div>
                  </div>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-zinc-300 hover:text-teal-400"
            >
              <span className="sr-only">Menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </header>
      )}

      <main className="flex-1">
        {/* New Animated Hero Section (from test landing) */}
        <LandingHeroV2 onNavbarShow={() => setShowNavbar(true)} />

        {/* Features Section */}
        {/* <section id="features" className="w-full">
          <FeatureSection />

          <div className="container px-4 md:px-6 py-12">
            <SectionHeading
              title="AI-Powered SOAP Notes"
              description="Automatically generate comprehensive SOAP notes from your appointments, saving hours of documentation time."
            />
            <div className="mt-12">
              <SoapNotesDemo />
            </div>
          </div>
        </section> */}

        {/* Features Section */}
        <section id="benefits">
          <Features />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <Container>
            <SectionHeading
              badge="Testimonials"
              badgeVariant="accent"
              title="Trusted by Veterinary Professionals"
              description="Hear what veterinarians and practice managers have to say about OdisAI."
            />

            <div className="mt-12">
              <AnimatedTestimonials
                testimonials={testimonials}
                autoplay={true}
              />
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <Gradient className="w-full py-12 md:py-24 lg:py-32">
          <Container>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-gray-950">
                  Ready to Transform Your Veterinary Practice?
                </h2>
                <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-gray-600">
                  Join veterinary clinics already using OdisAI to streamline
                  their workflow.
                </p>
              </div>
              <div className="pt-4">
                <RadiantButton href="/signup" variant="primary">
                  Get Started
                </RadiantButton>
              </div>
            </div>
          </Container>
        </Gradient>

        {/* Pricing Section - Temporarily removed
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <SectionHeading
              title="Simple, Transparent Pricing"
              description="Choose the plan that works best for your practice."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {pricingPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  title={plan.title}
                  description={plan.description}
                  price={plan.price}
                  features={plan.features}
                  buttonText={plan.buttonText}
                  buttonVariant={plan.buttonVariant}
                  popular={plan.popular}
                />
              ))}
            </div>
          </div>
        </section> */}

        {/* Contact Section */}
        <section
          id="contact"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-50"
        >
          <Container>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-gray-950">
                    Get in Touch
                  </h2>
                  <p className="text-gray-600">
                    Have questions about OdisAI? Our team is here to help.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-teal-600/10 p-2">
                      <PawPrint className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-950">Email</p>
                      <p className="text-sm text-gray-600">info@odisai.net</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-teal-600/10 p-2">
                      <PawPrint className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-950">Phone</p>
                      <p className="text-sm text-gray-600">+1 (800) 123-4567</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-950"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      style={{ fontFamily: "'Red Hat Display', sans-serif" }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="practice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-950"
                  >
                    Practice Name
                  </label>
                  <input
                    id="practice"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your practice name"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-950"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your message"
                  ></textarea>
                </div>
                <Button className="w-full">Send Message</Button>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="w-full border-t bg-white py-6 md:py-8">
        <Container className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            <span className="text-lg font-bold text-gray-950">OdisAI</span>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4 text-gray-600"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4 text-gray-600"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4 text-gray-600"
            >
              Cookie Policy
            </Link>
          </nav>
          <div className="text-xs text-gray-500">
            &copy; {currentYear} OdisAI. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
}
