"use client";

import { Edit2, Trash2, Plus, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTemplates,
  createTemplate,
  getEmailTemplates,
  Template,
  deleteTemplate,
  updateTemplate,
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
        <Button className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border border-[#E2E8F0] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1A202C]">
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
                  <FormLabel className="text-[#718096]">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white border-[#E2E8F0] text-[#1A202C]"
                      placeholder="Template name"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#718096]">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#E2E8F0] text-[#1A202C]">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-[#E2E8F0]">
                      <SelectItem value="soap">SOAP Note</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#718096]">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white border-[#E2E8F0] text-[#1A202C]"
                      placeholder="Template content"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
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
      <DialogContent className="sm:max-w-[425px] bg-white border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="text-[#1A202C]">
            Select Email Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-[#718096]">Loading templates...</div>
          ) : error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : templates.length === 0 ? (
            <div className="text-[#718096]">No email templates found</div>
          ) : (
            templates.map((template) => (
              <Card
                key={template.id}
                className="bg-white border-[#E2E8F0] shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleSelect(template)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-[#1A202C]">
                    {template.name}
                  </CardTitle>
                  <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20">
                    EMAIL
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#718096] line-clamp-2">
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

function EditTemplateDialog({ 
  template, 
  onSuccess, 
  open, 
  setOpen 
}: { 
  template: Template; 
  onSuccess: () => void; 
  open: boolean; 
  setOpen: (open: boolean) => void; 
}) {
  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template.name,
      type: template.type as any,
      content: template.content,
    },
  });

  async function onSubmit(values: z.infer<typeof templateFormSchema>) {
    const result = await updateTemplate(template.id, values);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template updated successfully");
      form.reset();
      setOpen(false);
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="text-[#1A202C]">
            Edit Template
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#718096]">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white border-[#E2E8F0] text-[#1A202C]"
                      placeholder="Template name"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#718096]">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#E2E8F0] text-[#1A202C]">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-[#E2E8F0]">
                      <SelectItem value="soap">SOAP Note</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#718096]">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white border-[#E2E8F0] text-[#1A202C]"
                      placeholder="Template content"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
            >
              Update Template
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function loadTemplates() {
    const result = await getTemplates();
    if ("error" in result) {
      setError(result.error || "An unknown error occurred");
    } else if (result.templates) {
      setTemplates(result.templates);
      setFilteredTemplates(result.templates);
    }
    setLoading(false);
  }
  
  // Filter templates when search term or type filter changes
  useEffect(() => {
    let filtered = templates;
    
    // Apply type filter first
    if (typeFilter !== "all") {
      filtered = filtered.filter(template => template.type === typeFilter);
    }
    
    // Then apply search term filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTemplates(filtered);
  }, [searchTerm, typeFilter, templates]);

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
    return <div className="text-[#718096]">Loading templates...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1A202C]">Templates</h2>
        <CreateTemplateDialog onSuccess={loadTemplates} />
      </div>
      
      {/* Search and filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-[#E2E8F0] text-[#1A202C] pl-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#718096]" />
        </div>
        
        <Select
          value={typeFilter || "all"}
          onValueChange={(value) => {
            setTypeFilter(value);
            // Filter will be applied through useEffect
          }}
        >
          <SelectTrigger className="border-[#E2E8F0] text-[#1A202C] w-[160px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E2E8F0]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="soap">SOAP Notes</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="structured">Structured</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="bg-white border-[#E2E8F0] rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-[#1A202C]">
                {template.name}
              </CardTitle>
              <Badge
                className={
                  template.type === "soap"
                    ? "bg-[#2A9D8F]/10 text-[#2A9D8F] hover:bg-[#2A9D8F]/20"
                    : template.type === "email"
                      ? "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20"
                      : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                }
              >
                {template.type.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#718096] line-clamp-2 mb-4">
                {template.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#A0AEC0]">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#718096] hover:text-[#1A202C] hover:bg-gray-100"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#718096] hover:text-red-600 hover:bg-red-50"
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
      
      {/* Edit template dialog */}
      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={isEditDialogOpen}
          setOpen={setIsEditDialogOpen}
          onSuccess={() => {
            loadTemplates();
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}