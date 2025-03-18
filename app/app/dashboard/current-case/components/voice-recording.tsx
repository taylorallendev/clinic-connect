"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceRecordingProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  transcriptText: string;
  formatTime: (seconds: number) => string;
  onToggleRecording: () => void;
}

export function VoiceRecording({
  isRecording,
  isProcessing,
  recordingTime,
  transcriptText,
  formatTime,
  onToggleRecording,
}: VoiceRecordingProps) {
  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="border-b border-[#E2E8F0] bg-[#F8F9FA]">
        <CardTitle className="flex items-center text-[#1A202C]">
          <div className="w-4 h-4 rounded-full mr-2 bg-red-500 animate-pulse"></div>
          Voice Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center">
          {/* Recording Status */}
          <div className="text-center mb-4">
            {isRecording ? (
              <div className="text-[#1A202C] font-semibold">
                Recording in progress... {formatTime(recordingTime)}
              </div>
            ) : isProcessing ? (
              <div className="text-[#1A202C] font-semibold">
                Processing recording...
              </div>
            ) : (
              <div className="text-[#718096]">
                Click the microphone to start recording
              </div>
            )}
          </div>

          {/* Transcript Display */}
          <div
            className={`w-full h-32 mb-6 p-4 rounded-lg overflow-auto bg-[#F8F9FA] border border-[#E2E8F0] ${
              isRecording ? "animate-pulse" : ""
            }`}
          >
            <p className={`text-sm whitespace-pre-line ${isRecording ? "text-[#2A9D8F]" : "text-[#1A202C]"}`}>
              {transcriptText || "Transcript will appear here..."}
            </p>
          </div>

          {/* Record Button */}
          <Button
            onClick={onToggleRecording}
            disabled={isProcessing}
            className={`h-16 w-16 rounded-full ${
              isRecording
                ? "bg-[#E76F51] hover:bg-[#E76F51]/90"
                : "bg-[#2A9D8F] hover:bg-[#2A9D8F]/90"
            } text-white`}
          >
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}