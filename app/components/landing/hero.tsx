"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  FileText,
  PawPrint,
  Copy,
  Wand2,
  RefreshCw,
} from "lucide-react";

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
  const [expandedSections, setExpandedSections] = useState({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Complete SOAP data
  const completeSoapData = {
    subjective: {
      title: "Subjective",
      badge: "S",
      badgeColor: "bg-muted text-muted-foreground",
      content:
        "Max, 5yo neutered male Golden Retriever, limping on right hind leg for 3 days after play at dog park. Worse in mornings and after exercise.",
    },
    objective: {
      title: "Objective",
      badge: "O",
      badgeColor: "bg-success text-success-foreground",
      content:
        "T: 101.2°F, HR: 88bpm, RR: 22rpm\nMild discomfort on right stifle palpation\nPositive drawer sign\nWeight-bearing lameness on right hind",
    },
    assessment: {
      title: "Assessment",
      badge: "A",
      badgeColor: "bg-info text-info-foreground",
      content:
        "1. Suspected partial CCL tear\n2. Possible mild osteoarthritis\n3. Otherwise healthy",
    },
    plan: {
      title: "Plan",
      badge: "P",
      badgeColor: "bg-accent text-accent-foreground",
      content:
        "1. Radiographs of right stifle\n2. Carprofen 75mg PO q12h x7d\n3. Rest for 2 weeks\n4. Recheck in 10-14 days",
    },
  };

  // Initialize visibility
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Simulate copy functionality
  const handleCopy = (section: string) => {
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Simulate regeneration without animation
  const simulateGeneration = () => {
    if (isGenerating) return;

    setIsGenerating(true);

    // Simulate a brief loading state
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);

    // Ensure all sections are expanded
    setExpandedSections({
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    });
  };

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
                    OdisAI combines AI-powered appointment management,
                    scribing, and note generation to save time and improve
                    patient care.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Schedule a Demo
              </Button>
            </motion.div>
          </div>

          {/* Right column - SOAP Notes Demo */}
          <div className="relative">
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border bg-card"
                >
                  <div className="p-4 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">SOAP Notes</h3>
                        <Badge className="bg-green-700/50 text-green-100 border-0 text-xs">
                          AI Generated
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Max • Golden Retriever • 5y
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={simulateGeneration}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          {isGenerating ? "Generating..." : "Regenerate"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Subjective Section */}
                    <div className="border border-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                        onClick={() => {
                          setExpandedSections((prev) => ({
                            ...prev,
                            subjective: !prev.subjective,
                          }));
                        }}
                      >
                        <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                          <Badge
                            className={`${completeSoapData.subjective.badgeColor} mr-2 h-5 w-5 flex items-center justify-center p-0`}
                          >
                            {completeSoapData.subjective.badge}
                          </Badge>
                          {completeSoapData.subjective.title}
                        </h4>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy("subjective");
                            }}
                            className="h-6 text-xs text-muted-foreground"
                            disabled={isGenerating}
                          >
                            {copiedSection === "subjective" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>
                      {expandedSections.subjective && (
                        <div className="p-3 text-muted-foreground text-xs whitespace-pre-line min-h-[50px]">
                          {completeSoapData.subjective.content}
                        </div>
                      )}
                    </div>

                    {/* Objective Section */}
                    <div className="border border-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                        onClick={() => {
                          setExpandedSections((prev) => ({
                            ...prev,
                            objective: !prev.objective,
                          }));
                        }}
                      >
                        <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                          <Badge
                            className={`${completeSoapData.objective.badgeColor} mr-2 h-5 w-5 flex items-center justify-center p-0`}
                          >
                            {completeSoapData.objective.badge}
                          </Badge>
                          {completeSoapData.objective.title}
                        </h4>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy("objective");
                            }}
                            className="h-6 text-xs text-muted-foreground"
                            disabled={isGenerating}
                          >
                            {copiedSection === "objective" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>
                      {expandedSections.objective && (
                        <div className="p-3 text-muted-foreground text-xs whitespace-pre-line min-h-[50px]">
                          {completeSoapData.objective.content}
                        </div>
                      )}
                    </div>

                    {/* Assessment Section */}
                    <div className="border border-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                        onClick={() => {
                          setExpandedSections((prev) => ({
                            ...prev,
                            assessment: !prev.assessment,
                          }));
                        }}
                      >
                        <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                          <Badge
                            className={`${completeSoapData.assessment.badgeColor} mr-2 h-5 w-5 flex items-center justify-center p-0`}
                          >
                            {completeSoapData.assessment.badge}
                          </Badge>
                          {completeSoapData.assessment.title}
                        </h4>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy("assessment");
                            }}
                            className="h-6 text-xs text-muted-foreground"
                            disabled={isGenerating}
                          >
                            {copiedSection === "assessment" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>
                      {expandedSections.assessment && (
                        <div className="p-3 text-muted-foreground text-xs whitespace-pre-line min-h-[50px]">
                          {completeSoapData.assessment.content}
                        </div>
                      )}
                    </div>

                    {/* Plan Section */}
                    <div className="border border-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                        onClick={() => {
                          setExpandedSections((prev) => ({
                            ...prev,
                            plan: !prev.plan,
                          }));
                        }}
                      >
                        <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                          <Badge
                            className={`${completeSoapData.plan.badgeColor} mr-2 h-5 w-5 flex items-center justify-center p-0`}
                          >
                            {completeSoapData.plan.badge}
                          </Badge>
                          {completeSoapData.plan.title}
                        </h4>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy("plan");
                            }}
                            className="h-6 text-xs text-muted-foreground"
                            disabled={isGenerating}
                          >
                            {copiedSection === "plan" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>
                      {expandedSections.plan && (
                        <div className="p-3 text-muted-foreground text-xs whitespace-pre-line min-h-[50px]">
                          {completeSoapData.plan.content}
                        </div>
                      )}
                    </div>
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
              title="Pre-Appointment Summary"
              subtitle="Patient insights at a glance"
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

        {/* Support throughout lifecycle section - only visible on scroll */}
        <div className="relative mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative z-10"
          >
              <h3 className="text-xl md:text-2xl font-medium text-primary mb-6">
                Support throughout the full appointment lifecycle
              </h3>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="h-12 w-28 bg-muted/50 rounded-md flex items-center justify-center"
                    whileInView={{ y: [20, 0], opacity: [0, 1] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 * i }}
                  ></motion.div>
                ))}
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedHero;
