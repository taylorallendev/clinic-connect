"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  ClipboardCheck,
  User,
  Calendar,
  Clock,
  Eye,
  Stethoscope,
} from "lucide-react";

interface CaseData {
  id: string;
  type: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string | null;
  updated_at: string | null;
  patient: {
    id: string;
    name: string;
    owner_name: string;
  } | null;
  transcriptions: Array<{
    id: string;
    transcript: string | null;
    created_at: string;
  }>;
  soap_notes: Array<{
    id: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    created_at: string;
  }>;
  generations: Array<{
    id: string;
    prompt: string | null;
    content: string | null;
    created_at: string;
  }>;
}

interface CaseViewProps {
  caseData: CaseData;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "ongoing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "reviewed":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "emergency":
      return "bg-red-100 text-red-800 border-red-200";
    case "surgery":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "follow_up":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "checkup":
      return "bg-teal-100 text-teal-800 border-teal-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getVisibilityColor(visibility: string): string {
  switch (visibility.toLowerCase()) {
    case "public":
      return "bg-green-100 text-green-800 border-green-200";
    case "private":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function CaseView({ caseData }: CaseViewProps) {
  const {
    id,
    type,
    status,
    visibility,
    created_at,
    updated_at,
    patient,
    transcriptions,
    soap_notes,
    generations,
  } = caseData;

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-muted-foreground" />
                Case {id}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {status && (
                  <Badge variant="outline" className={getStatusColor(status)}>
                    {status}
                  </Badge>
                )}
                {type && (
                  <Badge variant="outline" className={getTypeColor(type)}>
                    {type.replace("_", " ")}
                  </Badge>
                )}
                {visibility && (
                  <Badge
                    variant="outline"
                    className={getVisibilityColor(visibility)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {visibility}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created{" "}
                  {formatDistanceToNow(new Date(created_at), {
                    addSuffix: true,
                  })}
                </div>
              )}
              {updated_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Updated{" "}
                  {formatDistanceToNow(new Date(updated_at), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Information
              </h3>
              {patient ? (
                <div className="space-y-1">
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Owner: {patient.owner_name}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No patient information available
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Case Statistics
              </h3>
              <div className="space-y-1 text-sm">
                <p>Transcriptions: {transcriptions.length}</p>
                <p>SOAP Notes: {soap_notes.length}</p>
                <p>AI Generations: {generations.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcriptions Section */}
      {transcriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcriptions ({transcriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {transcriptions.map((transcription, index) => (
                  <div
                    key={transcription.id}
                    className="border rounded-lg p-4 bg-muted/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary">Transcript {index + 1}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(transcription.created_at),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {transcription.transcript || "No transcript available"}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* SOAP Notes Section */}
      {soap_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              SOAP Notes ({soap_notes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {soap_notes.map((note, index) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 bg-muted/20"
                >
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary">SOAP Note {index + 1}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        <Badge className="mr-2">S</Badge>
                        Subjective
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {note.subjective || "No subjective data"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        <Badge className="mr-2">O</Badge>
                        Objective
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {note.objective || "No objective data"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        <Badge className="mr-2">A</Badge>
                        Assessment
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {note.assessment || "No assessment data"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        <Badge className="mr-2">P</Badge>
                        Plan
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {note.plan || "No plan data"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Generations Section */}
      {generations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Generations ({generations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {generations.map((generation, index) => (
                  <div
                    key={generation.id}
                    className="border rounded-lg p-4 bg-muted/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary">Generation {index + 1}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(generation.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {generation.prompt && (
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-1">Prompt:</h4>
                        <p className="text-sm bg-muted p-2 rounded">
                          {generation.prompt}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-sm mb-1">Content:</h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {generation.content || "No content available"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {transcriptions.length === 0 &&
        soap_notes.length === 0 &&
        generations.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Additional Data</h3>
                <p className="text-muted-foreground">
                  This case doesn't have any transcriptions, SOAP notes, or AI
                  generations yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
