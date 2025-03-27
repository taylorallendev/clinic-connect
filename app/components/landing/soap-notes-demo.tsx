"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copy,
  CheckCircle,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

interface SoapSection {
  title: string;
  badge: string;
  badgeColor: string;
  content: string;
}

export function SoapNotesDemo() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(100);

  // Sample SOAP data for a veterinary case
  const soapSections: Record<string, SoapSection> = {
    subjective: {
      title: "Subjective",
      badge: "S",
      badgeColor: "bg-muted text-muted-foreground",
      content:
        "Owner reports that Max, a 5-year-old neutered male Golden Retriever, has been limping on his right hind leg for the past 3 days. The limping started after an intense play session at the dog park. Owner notes that Max seems more uncomfortable in the mornings and after exercise. No changes in appetite or behavior otherwise. Current on all vaccinations.",
    },
    objective: {
      title: "Objective",
      badge: "O",
      badgeColor: "bg-success text-success-foreground",
      content:
        "**Vital Signs:**\n- Temperature: 101.2°F\n- Heart Rate: 88 bpm\n- Respiratory Rate: 22 rpm\n- Weight: 32.5 kg\n\n**Physical Examination:**\n- Alert and responsive\n- Mild discomfort on palpation of right stifle joint\n- Slight joint effusion noted\n- Positive drawer sign on right knee\n- No crepitus detected\n- Gait: Weight-bearing lameness on right hind limb",
    },
    assessment: {
      title: "Assessment",
      badge: "A",
      badgeColor: "bg-info text-info-foreground",
      content:
        "1. Suspected partial cranial cruciate ligament tear in right stifle joint\n2. Mild osteoarthritis cannot be ruled out\n3. Otherwise healthy adult dog",
    },
    plan: {
      title: "Plan",
      badge: "P",
      badgeColor: "bg-accent text-accent-foreground",
      content:
        "1. Radiographs of right stifle joint to assess for joint changes and rule out other pathologies\n2. Prescribe Carprofen 75mg PO q12h with food for 7 days for pain and inflammation\n3. Strict rest for 2 weeks - leash walks only for elimination\n4. Referral to orthopedic specialist for surgical consultation if no improvement\n5. Recheck in 10-14 days\n6. Discuss weight management and joint supplements",
    },
  };

  // Simulate copy functionality (for demo purposes)
  const handleCopy = (section: string) => {
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  // Simulate AI generation
  const simulateGeneration = () => {
    setIsGenerating(true);
    setCompletionPercentage(0);

    // Expand all sections for the animation
    setExpandedSections({
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    });

    // Simulate progress
    const interval = setInterval(() => {
      setCompletionPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden max-w-3xl mx-auto">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-card-foreground flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-card-foreground" />
              SOAP Notes Example
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                const allExpanded = Object.values(expandedSections).every(
                  (v) => v
                );
                setExpandedSections({
                  subjective: !allExpanded,
                  objective: !allExpanded,
                  assessment: !allExpanded,
                  plan: !allExpanded,
                });
              }}
            >
              {Object.values(expandedSections).every((v) => v) ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-3">
            {Object.entries(soapSections).map(([key, section]) => (
              <div
                key={key}
                className="border border-muted/30 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                  onClick={() => toggleSection(key)}
                >
                  <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                    <Badge
                      className={`${section.badgeColor} mr-2 h-5 w-5 flex items-center justify-center p-0`}
                    >
                      {section.badge}
                    </Badge>
                    {section.title}
                  </h4>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(key);
                      }}
                      className="h-6 text-xs text-muted-foreground"
                    >
                      {copiedSection === key ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>
                {expandedSections[key as keyof typeof expandedSections] && (
                  <div className="p-3 text-muted-foreground text-sm whitespace-pre-line">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={simulateGeneration}
          disabled={isGenerating}
          className="mt-4"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating ({completionPercentage}%)
            </>
          ) : (
            "Regenerate SOAP Notes"
          )}
        </Button>
      </div>
    </div>
  );
}
