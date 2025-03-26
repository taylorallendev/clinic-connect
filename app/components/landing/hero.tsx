"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, FileText, PawPrint } from "lucide-react";

// Extract animation variants for reuse
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

interface StatCircleProps {
  value: string;
  label: string;
  bgColor: string;
  textColor?: string;
  delay: number;
}

function StatCircle({
  value,
  label,
  bgColor,
  textColor = "",
  delay,
}: StatCircleProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay }}
      className={`flex flex-col items-center justify-center ${bgColor} rounded-full h-24 w-24 text-center`}
    >
      <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );
}

interface FloatingCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  position: string;
  delay: number;
  iconColor?: string;
  animationX?: number;
  animationY?: number;
}

function FloatingCard({
  icon: Icon,
  title,
  subtitle,
  position,
  delay,
  iconColor = "text-primary",
  animationX = 0,
  animationY = 0,
}: FloatingCardProps) {
  const animationVariant = {
    hidden: { opacity: 0, x: animationX, y: animationY },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay }}
      className={`absolute ${position} bg-card rounded-xl shadow-lg p-4 border z-20`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-10 w-10 ${iconColor}`} />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function EnhancedHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-muted pt-20 pb-32 md:pt-32 md:pb-40 lg:pt-40 lg:pb-48">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-accent/5 blur-3xl"></div>
      </div>

      <div className="container relative px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left column - Text content */}
          <div className="flex flex-col justify-center space-y-8">
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Badge className="mb-4 px-3 py-1 text-sm bg-primary hover:bg-primary/80">
                    AI-Powered Veterinary Platform
                  </Badge>
                  <h1 className="font-boldonese font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight text-foreground mb-6">
                    <span className="block">Transform Your</span>
                    <span className="block text-primary">
                      Veterinary Practice
                    </span>
                    <span className="block">With AI</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
                    ClinicConnect combines AI-powered appointment management,
                    scribing, and note generation to save time and improve
                    patient care.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isVisible && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button size="lg" className="px-8 py-6 text-base rounded-xl">
                    Start Free Trial
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-base rounded-xl"
                  >
                    Book a Demo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isVisible && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex flex-wrap gap-4 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Cancel anytime</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats circles */}
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex flex-wrap gap-4 mt-4"
                >
                  <StatCircle
                    value="85%"
                    label="Time Saved"
                    bgColor="bg-accent/10"
                    textColor="text-accent-foreground"
                    delay={0.9}
                  />
                  <StatCircle
                    value="500+"
                    label="Clinics"
                    bgColor="bg-primary/10"
                    textColor="text-primary"
                    delay={1.0}
                  />
                  <StatCircle
                    value="99%"
                    label="Accuracy"
                    bgColor="bg-muted"
                    delay={1.1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column - Image and floating cards */}
          <div className="relative">
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <Image
                      src="/placeholder.svg?height=600&width=800"
                      alt="Veterinarian with pet"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating cards */}
            <FloatingCard
              icon={PawPrint}
              title="Appointment completed"
              subtitle="Notes generated in 30 seconds"
              position="-bottom-6 -right-6"
              delay={0.8}
              animationX={20}
            />

            <FloatingCard
              icon={Calendar}
              title="Smart Scheduling"
              subtitle="30% more appointments"
              position="-top-6 -left-6"
              delay={1.0}
              iconColor="text-accent"
              animationX={-20}
            />

            <FloatingCard
              icon={FileText}
              title="AI Note Generation"
              subtitle="Save 2 hours daily"
              position="top-1/2 -translate-y-1/2 -left-12"
              delay={1.2}
              animationY={20}
            />
          </div>
        </div>

        {/* Trusted by section */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 1.4 }}
              className="mt-20 text-center"
            >
              <p className="text-sm text-muted-foreground mb-6">
                Trusted by leading veterinary practices
              </p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-24 bg-muted/50 rounded-md"
                  ></div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
