import {
  Calendar,
  FileText,
  Clock,
  Brain,
  MessageSquare,
  BarChart,
  Zap,
} from "lucide-react";
import { FeatureCard } from "./feature-card";
import { SectionHeading } from "./section-heading";

export function FeatureSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Scribing",
      description:
        "Our AI listens to your appointments and automatically generates comprehensive clinical notes, saving you hours of documentation time.",
      className: "h-full lg:col-span-2 aspect-square lg:aspect-auto",
    },
    {
      icon: Calendar,
      title: "Pre-Appointment Summary",
      description:
        "Delivers targeted patient summaries with behavioral patterns, health trends, and key insights to prepare veterinarians before entering the exam room.",
      className: "aspect-square",
    },
    {
      icon: MessageSquare,
      title: "Automated Phone Call Agent",
      description:
        "AI voice agent delivers discharge summaries to clients' voicemail after appointments in a natural, conversational tone, enhancing follow-up care.",
      className: "aspect-square",
    },
    {
      icon: FileText,
      title: "Comprehensive Documentation",
      description:
        "Generate detailed medical records, treatment plans, and discharge instructions with our AI, ensuring accuracy and completeness.",
      className: "h-full lg:col-span-2 aspect-square lg:aspect-auto",
    },
    {
      icon: Clock,
      title: "Time-Saving Automation",
      description:
        "Reduce administrative burden with automated workflows that handle routine tasks and paperwork.",
      className: "aspect-square",
    },
    {
      icon: BarChart,
      title: "Differential Diagnosis Suggestions",
      description:
        "Real-time AI-powered diagnostic suggestions that update during the exam itself, with differentials automatically added to your generated documentation.",
      className: "aspect-square",
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description:
        "Connect with your existing practice management software for a unified workflow without disruption.",
      className: "aspect-square",
    },
  ];

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <SectionHeading
            badge="AI-Powered Platform"
            title="Revolutionize Your Veterinary Practice"
            description="Managing a veterinary practice is already demanding. ClinicConnect's AI tools help you focus on what matters most - your patients."
            align="left"
            badgeVariant="primary"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 4).map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className={feature.className}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
            {features.slice(4).map((feature, index) => (
              <FeatureCard
                key={index + 4}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className={feature.className}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
