"use client";

import { useState, useEffect } from "react";
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
  ArrowRight,
} from "lucide-react";
import AnimatedGradientBackground from "./animated-gradient-background";

// Extract animation variants for reuse
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Animated Dog Component for Odis
const AnimatedDog = () => {
  return (
    <motion.div
      className="flex flex-col items-center relative z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -15, 0],
      }}
      transition={{
        scale: { duration: 1.2, delay: 0.8 },
        opacity: { duration: 1.2, delay: 0.8 },
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }
      }}
    >
      {/* Dog SVG */}
      <div className="relative">
        {/* Glow effect behind dog */}
        <div className="absolute inset-0 blur-2xl bg-teal-400/30 rounded-full scale-150" />
        
        {/* Dog character */}
        <svg
          width="160"
          height="160"
          viewBox="0 0 120 120"
          className="relative z-10 drop-shadow-2xl"
        >
          {/* Dog body */}
          <ellipse cx="60" cy="80" rx="28" ry="22" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2"/>
          
          {/* Dog head - more oval for dog */}
          <ellipse cx="60" cy="45" rx="22" ry="18" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2"/>
          
          {/* Dog ears - floppy */}
          <motion.ellipse 
            cx="45" 
            cy="38" 
            rx="8" 
            ry="15" 
            fill="#d4a574" 
            stroke="#0f172a" 
            strokeWidth="2"
            animate={{ rx: [8, 9, 8], ry: [15, 16, 15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse 
            cx="75" 
            cy="38" 
            rx="8" 
            ry="15" 
            fill="#d4a574" 
            stroke="#0f172a" 
            strokeWidth="2"
            animate={{ rx: [8, 9, 8], ry: [15, 16, 15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          {/* Dog snout */}
          <ellipse cx="60" cy="52" rx="8" ry="6" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2"/>
          
          {/* Dog face */}
          {/* Eyes */}
          <motion.circle 
            cx="54" 
            cy="42" 
            r="4" 
            fill="#0f172a"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.circle 
            cx="66" 
            cy="42" 
            r="4" 
            fill="#0f172a"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          <circle cx="55" cy="41" r="1" fill="#ffffff"/>
          <circle cx="67" cy="41" r="1" fill="#ffffff"/>
          
          {/* Dog nose - bigger and more prominent */}
          <ellipse cx="60" cy="50" rx="3" ry="2" fill="#0f172a"/>
          
          {/* Dog mouth - happy panting */}
          <motion.path 
            d="M60 53 Q55 58 50 55" 
            stroke="#0f172a" 
            strokeWidth="2" 
            fill="none"
            animate={{ d: ["M60 53 Q55 58 50 55", "M60 53 Q55 60 48 57", "M60 53 Q55 58 50 55"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path 
            d="M60 53 Q65 58 70 55" 
            stroke="#0f172a" 
            strokeWidth="2" 
            fill="none"
            animate={{ d: ["M60 53 Q65 58 70 55", "M60 53 Q65 60 72 57", "M60 53 Q65 58 70 55"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Dog tongue - panting */}
          <motion.ellipse 
            cx="60" 
            cy="58" 
            rx="3" 
            ry="6" 
            fill="#ff69b4"
            animate={{ ry: [6, 8, 6], cy: [58, 60, 58] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Dog tail - wagging */}
          <motion.path 
            d="M85 80 Q95 70 100 75 Q95 80 90 85"
            stroke="#f1f5f9" 
            strokeWidth="10" 
            fill="none"
            strokeLinecap="round"
            animate={{ 
              d: [
                "M85 80 Q95 70 100 75 Q95 80 90 85",
                "M85 80 Q98 65 105 70 Q100 75 95 80",
                "M85 80 Q92 75 85 70 Q80 75 85 80",
                "M85 80 Q95 70 100 75 Q95 80 90 85"
              ]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.path 
            d="M85 80 Q95 70 100 75 Q95 80 90 85"
            stroke="#0f172a" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
            animate={{ 
              d: [
                "M85 80 Q95 70 100 75 Q95 80 90 85",
                "M85 80 Q98 65 105 70 Q100 75 95 80",
                "M85 80 Q92 75 85 70 Q80 75 85 80",
                "M85 80 Q95 70 100 75 Q95 80 90 85"
              ]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Dog paws */}
          <ellipse cx="48" cy="98" rx="5" ry="8" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1"/>
          <ellipse cx="72" cy="98" rx="5" ry="8" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1"/>
          
          {/* Dog spots */}
          <circle cx="50" cy="75" r="4" fill="#d4a574" opacity="0.7"/>
          <circle cx="70" cy="82" r="3" fill="#d4a574" opacity="0.7"/>
        </svg>
      </div>
      
      {/* Name label */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <div className="bg-teal-500/20 border border-teal-500/30 rounded-full px-4 py-2 backdrop-blur-sm">
          <span className="text-teal-100 text-sm font-bold">Meet Odis</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
  iconColor = "text-teal-500",
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
      transition={{ duration: 0.6, delay }}
      className={`absolute ${position} bg-zinc-800/80 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-zinc-700/50 z-20`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-8 w-8 ${iconColor}`} />
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroWithOdis() {
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
      badgeColor: "bg-zinc-600 text-zinc-100",
      content:
        "Max, 5yo neutered male Golden Retriever, limping on right hind leg for 3 days after play at dog park. Worse in mornings and after exercise.",
    },
    objective: {
      title: "Objective",
      badge: "O",
      badgeColor: "bg-teal-600 text-teal-100",
      content:
        "T: 101.2°F, HR: 88bpm, RR: 22rpm\nMild discomfort on right stifle palpation\nPositive drawer sign\nWeight-bearing lameness on right hind",
    },
    assessment: {
      title: "Assessment",
      badge: "A",
      badgeColor: "bg-sky-600 text-sky-100",
      content:
        "1. Suspected partial CCL tear\n2. Possible mild osteoarthritis\n3. Otherwise healthy",
    },
    plan: {
      title: "Plan",
      badge: "P",
      badgeColor: "bg-cyan-600 text-cyan-100",
      content:
        "1. Radiographs of right stifle\n2. Carprofen 75mg PO q12h x7d\n3. Rest for 2 weeks\n4. Recheck in 10-14 days",
    },
  };

  // Custom gradient colors - more black, less primary color
  const customGradientColors = [
    "#000000",     // Pure black
    "#0A0A0A",     // Very dark
    "#1A1A1A",     // Dark gray
    "#2A2A2A",     // Medium dark gray
    "#14B8A6",     // Teal-500 (minimal)
    "#0A0A0A",     // Back to very dark
    "#000000",     // Pure black
  ];

  const customGradientStops = [20, 35, 50, 65, 75, 85, 100];

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
    <div className="relative overflow-hidden min-h-screen pt-20 pb-8 md:pt-32 md:pb-10 lg:pt-40 lg:pb-12">
      {/* Animated Gradient Background */}
      <AnimatedGradientBackground
        startingGap={120}
        Breathing={true}
        gradientColors={customGradientColors}
        gradientStops={customGradientStops}
        animationSpeed={0.03}
        breathingRange={8}
        topOffset={20}
        containerClassName="z-0"
      />
      
      {/* Blur Overlay on top of gradient */}
      <div className="absolute inset-0 backdrop-blur-[2px] z-5" />

      <div className="container relative px-4 md:px-6 z-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center min-h-[80vh]">
          {/* Left column - Text content */}
          <div className="flex flex-col justify-center space-y-8">
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Badge className="mb-6 px-4 py-2 text-sm bg-teal-500/20 border border-teal-500/30 text-teal-100 hover:bg-teal-500/30">
                    AI-Powered Veterinary Platform
                  </Badge>
                  <h1 className="font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight mb-6">
                    <span className="block text-white">Transform Your</span>
                    <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      Veterinary Practice
                    </span>
                    <span className="block text-white">With AI</span>
                  </h1>
                  <p className="text-xl text-zinc-300 max-w-[600px] mb-8 leading-relaxed">
                    Meet Odis, your AI veterinary assistant. Experience the future of veterinary care with 
                    intelligent appointment management, automated scribing, and instant SOAP note generation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-white text-lg px-8 py-6">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="lg" className="border-teal-500/30 text-teal-100 hover:bg-teal-500/10 text-lg px-8 py-6">
                      Watch Demo
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column - Odis + SOAP Notes Demo */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Animated Dog Mascot - Odis */}
            <AnimatedDog />
            
            {/* SOAP Notes Demo - Smaller */}
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="relative z-10 rounded-xl overflow-hidden shadow-xl border border-zinc-700/50 bg-zinc-900/90 backdrop-blur-sm w-full max-w-md"
                >
                  <div className="p-3 border-b border-zinc-700/50 bg-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-400" />
                        <h3 className="font-medium text-white text-sm">SOAP Notes</h3>
                        <Badge className="bg-teal-500/20 text-teal-100 border border-teal-500/30 text-xs">
                          AI Generated
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-teal-100 hover:bg-teal-500/10"
                        onClick={simulateGeneration}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3 mr-1" />
                        )}
                        {isGenerating ? "Generating..." : "Regenerate"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {/* SOAP Sections - Compact */}
                    {Object.entries(completeSoapData).map(([key, data]) => (
                      <div key={key} className="border border-zinc-700/50 rounded-lg overflow-hidden bg-zinc-800/30">
                        <div
                          className="flex items-center justify-between bg-zinc-800/50 px-3 py-2 cursor-pointer"
                          onClick={() => {
                            setExpandedSections((prev) => ({
                              ...prev,
                              [key]: !prev[key as keyof typeof prev],
                            }));
                          }}
                        >
                          <h4 className="text-zinc-300 flex items-center text-sm font-medium">
                            <Badge
                              className={`${data.badgeColor} mr-2 h-4 w-4 flex items-center justify-center p-0 text-xs`}
                            >
                              {data.badge}
                            </Badge>
                            {data.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(key);
                            }}
                            className="h-5 text-xs text-zinc-400 hover:text-teal-100"
                            disabled={isGenerating}
                          >
                            {copiedSection === key ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {expandedSections[key as keyof typeof expandedSections] && (
                          <div className="p-3 text-zinc-300 text-xs whitespace-pre-line">
                            {data.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating cards around Odis */}
            <FloatingCard
              icon={PawPrint}
              title="Appointment completed"
              subtitle="Notes generated in 30 seconds"
              position="-bottom-4 -right-4"
              delay={1.8}
              animationX={20}
            />

            <FloatingCard
              icon={Calendar}
              title="Pre-Appointment Summary"
              subtitle="Patient insights ready"
              position="-top-4 -left-4"
              delay={2.0}
              iconColor="text-cyan-400"
              animationX={-20}
            />
          </div>
        </div>

        {/* Support throughout lifecycle section */}
        <div className="relative mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative z-10"
          >
            <h3 className="text-xl md:text-2xl font-medium text-teal-400 mb-6">
              Support throughout the full appointment lifecycle
            </h3>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HeroWithOdis;