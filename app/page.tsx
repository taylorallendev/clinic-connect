import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Clock,
  BarChart,
  Stethoscope,
  PawPrint,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import { FeatureSection } from "./components/landing/feature-section";
import { EnhancedHero } from "./components/landing/hero";
import { SectionHeading } from "./components/landing/section-heading";
import { SoapNotesDemo } from "./components/landing/soap-notes-demo";
import { AnimatedTestimonials } from "./components/landing/animated-testimonials";
import { ReactNode } from "react";

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

// Data for pricing plans
const pricingPlans = [
  {
    title: "Starter",
    description: "Perfect for small practices",
    price: 99,
    features: [
      "Up to 3 veterinarians",
      "AI appointment scheduling",
      "Basic note generation",
      "Email support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
  },
  {
    title: "Professional",
    description: "Ideal for growing practices",
    price: 199,
    features: [
      "Up to 10 veterinarians",
      "Advanced AI scheduling",
      "Full note generation",
      "Priority support",
      "Integration with major PMS",
    ],
    buttonText: "Get Started",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    title: "Enterprise",
    description: "For multi-location practices",
    price: "Custom",
    features: [
      "Unlimited veterinarians",
      "Custom AI solutions",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom integrations",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
  },
];

// Features component
const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div
    aria-hidden
    className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
      {children}
    </div>
  </div>
);

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
    <section className="relative bg-zinc-900 py-16 md:py-32 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-left gradient */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl opacity-30"></div>

        {/* Bottom-right gradient */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl opacity-30"></div>

        {/* Center accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-300/5 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="@container mx-auto max-w-5xl px-6 relative z-10">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-teal-400">
            Transform Your Practice's Workflow
          </h2>
          <p className="mt-4 text-zinc-400">
            See how OdisAI can help you save time, reduce stress, and improve
            patient care.
          </p>
        </div>
        <div className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 *:text-center md:mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group shadow-lg bg-zinc-800 border border-zinc-700 relative overflow-hidden"
              >
                {/* Individual card gradient accent */}
                <div className="absolute -inset-1 bg-gradient-to-b from-teal-500/5 via-transparent to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <CardHeader className="pb-3 relative">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-zinc-700/50 p-4">
                      <Icon className="h-6 w-6 text-teal-400" aria-hidden />
                    </div>
                  </div>
                  <h3 className="mt-6 font-medium text-zinc-100">
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-500" />
            <span className="text-xl font-boldonese font-bold">OdisAI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#benefits"
              className="text-sm font-medium hover:text-teal-500"
            >
              Benefits
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium hover:text-teal-500"
            >
              Testimonials
            </Link>
            {/* Pricing link temporarily removed
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-teal-500"
            >
              Pricing
            </Link>
            */}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Enhanced Hero Section */}
        <EnhancedHero />

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
          <div className="container px-4 md:px-6">
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
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-teal-500 text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-boldonese">
                  Ready to Transform Your Veterinary Practice?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join veterinary clinics already using OdisAI to streamline
                  their workflow.
                </p>
              </div>
            </div>
          </div>
        </section>

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
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-boldonese">
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground">
                    Have questions about OdisAI? Our team is here to help.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-teal-500/10 p-2">
                      <PawPrint className="h-5 w-5 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        info@odisai.net
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-teal-500/10 p-2">
                      <PawPrint className="h-5 w-5 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        +1 (800) 123-4567
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-background py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-500" />
            <span className="text-lg font-boldonese font-bold">OdisAI</span>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Cookie Policy
            </Link>
          </nav>
          <div className="text-xs text-muted-foreground">
            &copy; {currentYear} OdisAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
