import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart, Stethoscope, PawPrint } from "lucide-react";
import { FeatureSection } from "./components/landing/feature-section";
import { EnhancedHero } from "./components/landing/hero";
import { SectionHeading } from "./components/landing/section-heading";
import { SoapNotesDemo } from "./components/landing/soap-notes-demo";
import { AnimatedTestimonials } from "./components/landing/animated-testimonials";

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

// Benefits data
const benefits = [
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

export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="text-xl font-boldonese font-bold">OdisAI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#benefits"
              className="text-sm font-medium hover:text-primary"
            >
              Benefits
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium hover:text-primary"
            >
              Testimonials
            </Link>
            {/* Pricing link temporarily removed
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary"
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

        {/* Benefits Section */}
        <section
          id="benefits"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <SectionHeading
              title="Transform Your Practice Workflow"
              description="See how OdisAI can help you save time, reduce stress, and improve patient care."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <Icon className="h-12 w-12 text-primary" />
                      <h3 className="text-xl font-bold">{benefit.title}</h3>
                      <p className="text-muted-foreground">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-boldonese">
                  Ready to Transform Your Veterinary Practice?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join hundreds of veterinary clinics already using OdisAI to
                  streamline their workflow.
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
                    <div className="rounded-full bg-primary/10 p-2">
                      <PawPrint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        info@odisai.net
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <PawPrint className="h-5 w-5 text-primary" />
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
            <Stethoscope className="h-5 w-5 text-primary" />
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
