"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTemplates } from "@/app/actions";

export type Template = {
  id: number;
  name: string;
  type: "soap" | "summary" | "email" | "structured";
  content: string;
  schema?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Hook for working with structured output templates
 *
 * This hook provides functionality for loading and working with templates
 * for structured output generation.
 */
export function useStructuredTemplates(defaultType?: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );

  useEffect(() => {
    fetchTemplates();
  }, [defaultType]);

  async function fetchTemplates() {
    setLoading(true);
    const result = await getTemplates(defaultType);

    if (result.templates) {
      const formattedTemplates = result.templates.map((template: any) => ({
        ...template,
        createdAt: template.createdAt ? template.createdAt.toISOString() : "",
        updatedAt: template.updatedAt ? template.updatedAt.toISOString() : "",
        schema: template.schema
          ? JSON.parse(template.schema as string)
          : undefined,
      }));
      setTemplates(formattedTemplates as Template[]);
    } else if (result.error) {
      toast(result.error);
    }

    setLoading(false);
  }

  // Get a specific template by ID
  const getTemplateById = (id: number) => {
    return templates.find((template) => template.id === id);
  };

  return {
    templates,
    loading,
    selectedTemplateId,
    setSelectedTemplateId,
    getTemplateById,
    refreshTemplates: fetchTemplates,
  };
}
