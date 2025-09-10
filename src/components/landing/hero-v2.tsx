"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { RadiantButton } from "@/components/ui/radiant-button";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  RefreshCw,
  Wand2,
} from "lucide-react";

// Dynamically import the entire DiagnosisCards component to prevent hydration issues
const DynamicDiagnosisCards = dynamic(
  () => Promise.resolve(DiagnosisCardsInternal),
  {
    ssr: false,
  }
);

interface DiagnosisCardsProps {
  generationStage: number;
  completedSections: string[];
}

const DiagnosisCardsInternal = ({
  generationStage,
  completedSections,
}: DiagnosisCardsProps) => {
  const visibleCount = Math.min(6, Math.max(2, generationStage + 1));

  const diagnoses = [
    { title: "Partial CCL Tear", confidence: 0.87 },
    { title: "Osteoarthritis (mild)", confidence: 0.74 },
    { title: "Meniscal Injury", confidence: 0.62 },
    { title: "Soft Tissue Strain", confidence: 0.58 },
    { title: "Patellar Luxation", confidence: 0.41 },
    { title: "Hip Dysplasia", confidence: 0.33 },
  ];

  const positions = [
    { top: -60, left: -88, rotate: -3 },
    { top: -72, right: -84, rotate: 4 },
    { top: 24, left: -96, rotate: -1 },
    { top: 64, right: -92, rotate: 2 },
    { bottom: -64, left: -80, rotate: -2 },
    { bottom: -80, right: -76, rotate: 3 },
  ] as const;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      suppressHydrationWarning={true}
    >
      <AnimatePresence>
        {diagnoses.slice(0, visibleCount).map((dx, idx) => {
          const pos: any = positions[idx];
          const baseDelay = 0.15 * idx;
          const pulseScale = 1.01;

          return (
            <motion.div
              key={dx.title}
              className="absolute"
              style={pos}
              initial={{ opacity: 0, scale: 0.85, x: 0, y: 0 }}
              animate={{ opacity: 0.8, scale: pulseScale }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, delay: baseDelay, ease: "easeOut" }}
              suppressHydrationWarning={true}
            >
              <motion.div
                className="shadow-lg shadow-black/30"
                initial={{ y: 0 }}
                animate={{ y: [0, -2, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.1,
                }}
                suppressHydrationWarning={true}
              >
                <Card
                  className="w-56 bg-white/95 border-gray-200 text-gray-950 rotate-[var(--rot)] shadow-lg"
                  style={{
                    // @ts-ignore css var for rotate utility
                    "--rot": `${pos.rotate}deg`,
                  }}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-950 flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {dx.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Confidence</span>
                      <span className="text-emerald-600">
                        {Math.round(dx.confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#7dd3d8] to-[#31aba3]"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round(dx.confidence * 100)}%`,
                        }}
                        transition={{ duration: 0.8, delay: baseDelay + 0.2 }}
                        suppressHydrationWarning={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

// Wrapper component that uses dynamic import
const DiagnosisCards = (props: DiagnosisCardsProps) => {
  return <DynamicDiagnosisCards {...props} />;
};

interface SOAPSectionProps {
  section: string;
  title: string;
  badge: string;
  badgeColor: string;
  content: string;
  isGenerating: boolean;
  isCompleted: boolean;
  animationDirection: "left" | "top" | "right" | "bottom";
  sourceLabel: string;
}

function SOAPSection({
  section,
  title,
  badge,
  badgeColor,
  content,
  isGenerating,
  isCompleted,
  animationDirection,
  sourceLabel,
}: SOAPSectionProps) {
  function getAnimationProps() {
    const directions = {
      left: { x: -100, y: 0 },
      top: { x: 0, y: -50 },
      right: { x: 100, y: 0 },
      bottom: { x: 0, y: 50 },
    } as const;
    return directions[animationDirection];
  }

  if (!isGenerating && !isCompleted) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 opacity-50">
        <div className="flex items-center gap-2">
          <Badge
            className={`${badgeColor} h-6 w-6 flex items-center justify-center p-0 text-xs`}
          >
            {badge}
          </Badge>
          <span className="text-gray-500 text-sm">{title} - Waiting...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden bg-white/80 relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {isGenerating && (
        <motion.div
          className="absolute -top-6 left-0 text-xs text-teal-600/70 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          ← {sourceLabel}
        </motion.div>
      )}

      <div className="flex items-center justify-between bg-gray-50/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge
            className={`${badgeColor} h-5 w-5 flex items-center justify-center p-0 text-xs`}
          >
            {badge}
          </Badge>
          <span className="text-gray-950 text-sm font-medium">{title}</span>
        </div>
        {isGenerating && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-1 h-1 bg-teal-600 rounded-full animate-pulse" />
            <div
              className="w-1 h-1 bg-teal-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-1 h-1 bg-teal-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </motion.div>
        )}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>

      {(isGenerating || isCompleted) && (
        <motion.div
          className="p-3 text-gray-700 text-xs whitespace-pre-line"
          initial={{ opacity: 0, ...getAnimationProps() }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {isGenerating ? (
            <TypewriterText text={content} speed={30} />
          ) : (
            content
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function TypewriterText({
  text,
  speed = 50,
}: {
  text: string;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayedText}</span>;
}

const AnimatedDog = ({
  onAnimationComplete,
}: {
  onAnimationComplete: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onAnimationComplete(), 2000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <motion.div
      className="flex flex-col items-center relative z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -20, 0] }}
      exit={{ scale: 0.3, opacity: 0, y: -100, transition: { duration: 1 } }}
      transition={{
        scale: { duration: 1.2, delay: 0.3 },
        opacity: { duration: 1.2, delay: 0.3 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-teal-400/40 rounded-full scale-150" />
        {/* Dog SVG simplified from test landing */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 120 120"
          className="relative z-10 drop-shadow-2xl"
        >
          <ellipse
            cx="60"
            cy="80"
            rx="28"
            ry="22"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <ellipse
            cx="60"
            cy="45"
            rx="22"
            ry="18"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2"
          />
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
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          <ellipse
            cx="60"
            cy="52"
            rx="8"
            ry="6"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2"
          />
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
          <circle cx="55" cy="41" r="1" fill="#ffffff" />
          <circle cx="67" cy="41" r="1" fill="#ffffff" />
          <ellipse cx="60" cy="50" rx="3" ry="2" fill="#0f172a" />
          <motion.path
            d="M60 53 Q55 58 50 55"
            stroke="#0f172a"
            strokeWidth="2"
            fill="none"
            animate={{
              d: [
                "M60 53 Q55 58 50 55",
                "M60 53 Q55 60 48 57",
                "M60 53 Q55 58 50 55",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M60 53 Q65 58 70 55"
            stroke="#0f172a"
            strokeWidth="2"
            fill="none"
            animate={{
              d: [
                "M60 53 Q65 58 70 55",
                "M60 53 Q65 60 72 57",
                "M60 53 Q65 58 70 55",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="60"
            cy="58"
            rx="3"
            ry="6"
            fill="#ff69b4"
            animate={{ ry: [6, 8, 6], cy: [58, 60, 58] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

function AnimatedSOAPNotes({
  autoStart = false,
  onSOAPAppear,
}: {
  autoStart?: boolean;
  onSOAPAppear?: () => void;
}) {
  const [generationStage, setGenerationStage] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDataStreams, setShowDataStreams] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [showDiagnosisCards, setShowDiagnosisCards] = useState(false);

  const subjectiveContent =
    "Max, 5yo neutered male Golden Retriever, limping on right hind leg for 3 days after play at dog park. Worse in mornings and after exercise.";
  const objectiveContent =
    "T: 101.2°F, HR: 88bpm, RR: 22rpm\nMild discomfort on right stifle palpation\nPositive drawer sign\nWeight-bearing lameness on right hind";
  const assessmentContent =
    "1. Suspected partial CCL tear\n2. Possible mild osteoarthritis\n3. Otherwise healthy";
  const planContent =
    "1. Radiographs of right stifle\n2. Carprofen 75mg PO q12h x7d\n3. Rest for 2 weeks\n4. Recheck in 10-14 days";

  function startGeneration() {
    if (isGenerating) return;
    setIsGenerating(true);
    setCompletedSections([]);
    setGenerationStage(0);
    setShowDataStreams(false);
    setShowDiagnosisCards(true);

    setTimeout(() => setGenerationStage(1), 500);
    setTimeout(() => {
      setGenerationStage(2);
      setCompletedSections(["subjective"]);
    }, 1500);
    setTimeout(() => {
      setGenerationStage(3);
      setCompletedSections(["subjective", "objective"]);
    }, 2500);
    setTimeout(() => {
      setGenerationStage(4);
      setCompletedSections(["subjective", "objective", "assessment"]);
    }, 3500);

    const typeSpeedMs = 30;
    const planTypingMs = planContent.length * typeSpeedMs;
    const planStartMs = 3500;
    const bufferMs = 200;
    const hideAtMs = planStartMs + planTypingMs + bufferMs;

    setTimeout(() => {
      setCompletedSections(["subjective", "objective", "assessment", "plan"]);
      setIsGenerating(false);
      setShowDataStreams(false);
    }, hideAtMs);
    // Keep diagnosis cards visible after animation completes
  }

  useEffect(() => {
    if (autoStart && !hasAutoStarted) {
      setHasAutoStarted(true);
      setTimeout(() => {
        startGeneration();
        // Trigger navbar appearance when SOAP notes appear
        if (onSOAPAppear) {
          setTimeout(() => onSOAPAppear(), 500); // Show navbar 0.5s after SOAP starts
        }
      }, 1000);
    }
  }, [autoStart, hasAutoStarted, onSOAPAppear]);

  return (
    <div className="relative w-full max-w-md">
      {showDiagnosisCards && (
        <DiagnosisCards
          generationStage={generationStage}
          completedSections={completedSections}
        />
      )}

      {showDataStreams && (
        <>
          <motion.div
            className="absolute left-0 top-1/4 w-32 h-px bg-gradient-to-r from-blue-400/60 to-transparent z-20"
            initial={{ x: -128, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.div
            className="absolute top-0 left-1/3 h-32 w-px bg-gradient-to-b from-emerald-400/60 to-transparent z-20"
            initial={{ y: -128, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <motion.div
            className="absolute right-0 top-1/2 w-32 h-px bg-gradient-to-l from-teal-400/60 to-transparent z-20"
            initial={{ x: 128, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          <motion.div
            className="absolute bottom-0 right-1/3 h-32 w-px bg-gradient-to-t from-cyan-400/60 to-transparent z-20"
            initial={{ y: 128, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white/95 backdrop-blur-sm"
        suppressHydrationWarning={true}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <h3 className="font-medium text-gray-950">AI SOAP Generation</h3>
              <Badge className="bg-teal-600/10 text-teal-600 border border-teal-600/30 text-xs">
                Real-time
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-600 hover:bg-gray-100"
              onClick={startGeneration}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5 mr-1" />
              )}
              {isGenerating ? "Analyzing..." : "Generate"}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-[300px]">
          <SOAPSection
            section="subjective"
            title="Subjective"
            badge="S"
            badgeColor="bg-blue-600 text-blue-100"
            content={subjectiveContent}
            isGenerating={generationStage === 1}
            isCompleted={completedSections.includes("subjective")}
            animationDirection="left"
            sourceLabel="Patient History"
          />
          <SOAPSection
            section="objective"
            title="Objective"
            badge="O"
            badgeColor="bg-emerald-600 text-emerald-100"
            content={objectiveContent}
            isGenerating={generationStage === 2}
            isCompleted={completedSections.includes("objective")}
            animationDirection="top"
            sourceLabel="Vital Monitor"
          />
          <SOAPSection
            section="assessment"
            title="Assessment"
            badge="A"
            badgeColor="bg-teal-600 text-teal-100"
            content={assessmentContent}
            isGenerating={generationStage === 3}
            isCompleted={completedSections.includes("assessment")}
            animationDirection="right"
            sourceLabel="AI Diagnosis"
          />
          <SOAPSection
            section="plan"
            title="Plan"
            badge="P"
            badgeColor="bg-cyan-600 text-cyan-100"
            content={planContent}
            isGenerating={generationStage === 4}
            isCompleted={completedSections.includes("plan")}
            animationDirection="bottom"
            sourceLabel="Treatment DB"
          />
        </div>
      </motion.div>
    </div>
  );
}

function HeroContent({ onNavbarShow }: { onNavbarShow?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <>
      <motion.div
        className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        suppressHydrationWarning={true}
      >
        <div className="flex flex-col justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            suppressHydrationWarning={true}
          >
            <Badge className="mb-4 px-3 py-1 text-xs bg-teal-600/10 border border-teal-600/30 text-teal-600">
              AI-Powered Veterinary Platform
            </Badge>
            <h1 className="font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-tight mb-6">
              <motion.span
                className="block text-gray-950"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                suppressHydrationWarning={true}
              >
                Transform Your
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-[#7dd3d8] to-[#31aba3] bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                suppressHydrationWarning={true}
              >
                Veterinary Practice
              </motion.span>
              <motion.span
                className="block text-gray-950"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                suppressHydrationWarning={true}
              >
                With AI
              </motion.span>
            </h1>
            <motion.p
              className="text-lg text-gray-600 max-w-[500px] mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              suppressHydrationWarning={true}
            >
              OdisAI combines AI-powered appointment management, scribing, and
              note generation to save time and improve patient care.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              suppressHydrationWarning={true}
            >
              <RadiantButton href="/signup" variant="primary">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </RadiantButton>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            suppressHydrationWarning={true}
          >
            <AnimatedSOAPNotes autoStart={true} onSOAPAppear={onNavbarShow} />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export function LandingHeroV2({ onNavbarShow }: { onNavbarShow?: () => void }) {
  const [showHeroContent, setShowHeroContent] = useState(false);
  const [pageFullyLoaded, setPageFullyLoaded] = useState(false);

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#e6f7f5]/30 via-[#7dd3d8]/20 to-[#31aba3]/10" />
      
      <Container className="relative z-10">
        <AnimatePresence mode="wait">
          {!showHeroContent ? (
            <motion.div
              key="odis"
              className="flex items-center justify-center min-h-[80vh]"
              suppressHydrationWarning={true}
            >
              <AnimatedDog
                onAnimationComplete={() => {
                  setShowHeroContent(true);
                  setTimeout(() => setPageFullyLoaded(true), 1000);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hero-content"
              className="min-h-[80vh] flex items-center"
              suppressHydrationWarning={true}
            >
              <HeroContent onNavbarShow={onNavbarShow} />
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}
