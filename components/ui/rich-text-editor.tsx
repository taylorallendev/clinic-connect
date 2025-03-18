"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
}: RichTextEditorProps) {
  const [htmlValue, setHtmlValue] = useState(value || "");
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && value !== htmlValue) {
      setHtmlValue(value);
    }
  }, [value]);

  // Simple command execution for basic formatting
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);

    // Get the updated HTML from the contentEditable div
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      setHtmlValue(newValue);
      onChange(newValue);
    }
  };

  // Handle paste to strip formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <Card className={cn("w-full border rounded-md", className)}>
      <div className="border-b p-2 bg-muted/20">
        <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
          <ToggleGroupItem
            value="bold"
            aria-label="Toggle bold"
            onClick={() => exec("bold")}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Toggle italic"
            onClick={() => exec("italic")}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Toggle underline"
            onClick={() => exec("underline")}
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="insertUnorderedList"
            aria-label="Insert bullet list"
            onClick={() => exec("insertUnorderedList")}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="insertOrderedList"
            aria-label="Insert numbered list"
            onClick={() => exec("insertOrderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="justifyLeft"
            aria-label="Align left"
            onClick={() => exec("justifyLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="justifyCenter"
            aria-label="Align center"
            onClick={() => exec("justifyCenter")}
          >
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="justifyRight"
            aria-label="Align right"
            onClick={() => exec("justifyRight")}
          >
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[300px] p-4 outline-none overflow-auto text-card-foreground text-left"
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: htmlValue }}
        onInput={(e) => {
          const newValue = (e.target as HTMLDivElement).innerHTML;
          setHtmlValue(newValue);
          onChange(newValue);
        }}
      />
    </Card>
  );
}
