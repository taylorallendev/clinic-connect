"use client";

import { Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTemplates,
  createTemplate,
  getEmailTemplates,
  Template,
  deleteTemplate,
} from "../../app/dashboard/template-actions";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["soap", "summary", "email", "structured"]),
  content: z.string().min(1, "Content is required"),
});

function CreateTemplateDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      type: "soap",
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof templateFormSchema>) {
    const result = await createTemplate(values);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template created successfully");
      form.reset();
      setOpen(false);
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-blue-950/90 backdrop-blur-xl border-blue-800/30">
        <DialogHeader>
          <DialogTitle className="text-blue-50">
            Create New Template
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-blue-900/30 border-blue-800/30 text-blue-50"
                      placeholder="Template name"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-blue-900/30 border-blue-800/30 text-blue-50">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="soap">SOAP Note</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-blue-900/30 border-blue-800/30 text-blue-50"
                      placeholder="Template content"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Create Template
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  trigger?: React.ReactNode;
}

export function TemplateSelector({ onSelect, trigger }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmailTemplates() {
      const result = await getEmailTemplates();
      setLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.templates) {
        setTemplates(result.templates);
      }
    }

    if (open) {
      loadEmailTemplates();
    }
  }, [open]);

  const handleSelect = (template: Template) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Select Template</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-blue-950/90 backdrop-blur-xl border-blue-800/30">
        <DialogHeader>
          <DialogTitle className="text-blue-50">
            Select Email Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-blue-200">Loading templates...</div>
          ) : error ? (
            <div className="text-red-400">Error: {error}</div>
          ) : templates.length === 0 ? (
            <div className="text-blue-200">No email templates found</div>
          ) : (
            templates.map((template) => (
              <Card
                key={template.id}
                className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 hover:bg-blue-900/30 transition-colors cursor-pointer"
                onClick={() => handleSelect(template)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-blue-50">
                    {template.name}
                  </CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30">
                    EMAIL
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-200 line-clamp-2">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);

  async function loadTemplates() {
    const result = await getTemplates();
    if ("error" in result) {
      setError(result.error || "An unknown error occurred");
    } else if (result.templates) {
      setTemplates(result.templates);
    }
    setLoading(false);
  }

  async function handleDeleteTemplate(id: number) {
    setIsDeleting(true);
    setDeleteTemplateId(id);

    const result = await deleteTemplate(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template deleted successfully");
      loadTemplates(); // Reload templates after deletion
    }

    setIsDeleting(false);
    setDeleteTemplateId(null);
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  if (loading) {
    return <div className="text-blue-200">Loading templates...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-50">Templates</h2>
        <CreateTemplateDialog onSuccess={loadTemplates} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 hover:bg-blue-900/30 transition-colors"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-blue-50">
                {template.name}
              </CardTitle>
              <Badge
                className={
                  template.type === "soap"
                    ? "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
                    : template.type === "email"
                      ? "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                      : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                }
              >
                {template.type.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-200 line-clamp-2 mb-4">
                {template.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-400">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-300 hover:text-blue-50 hover:bg-blue-800/30"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-300 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={isDeleting && deleteTemplateId === template.id}
                  >
                    {isDeleting && deleteTemplateId === template.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-dotted border-current opacity-70" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
