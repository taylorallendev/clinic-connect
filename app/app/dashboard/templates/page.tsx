"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Plus,
  Minus,
  MoveUp,
  MoveDown,
  FileJson,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
} from "../template-actions";

// Define the form schema
const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["soap", "summary", "email", "structured"]),
  content: z.string().min(1, "Content is required"),
  schema: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea"]),
        required: z.boolean().default(false),
        placeholder: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

type TemplateSection = {
  key: string;
  label: string;
  type: "text" | "textarea";
  required: boolean;
  placeholder?: string;
  description?: string;
};

type Template = {
  id: number;
  name: string;
  type: "soap" | "summary" | "email" | "structured";
  content: string;
  schema?: TemplateSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      type: "soap",
      content: "",
      schema: [],
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "schema",
  });

  const editForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      type: "soap",
      content: "",
      schema: [],
    },
  });

  const editSchema = useFieldArray({
    control: editForm.control,
    name: "schema",
  });

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter]);

  useEffect(() => {
    if (selectedTemplate && isEditDialogOpen) {
      editForm.reset({
        name: selectedTemplate.name,
        type: selectedTemplate.type,
        content: selectedTemplate.content,
        schema: selectedTemplate.schema || [],
      });
    }
  }, [selectedTemplate, editForm, isEditDialogOpen]);

  async function fetchTemplates() {
    setLoading(true);
    const result = await getTemplates(typeFilter);
    if (result.templates) {
      const formattedTemplates = result.templates.map((template: any) => {
        let parsedSchema = undefined;
        if (template.schema) {
          try {
            // Only attempt to parse if it's a non-empty string and looks like valid JSON
            const schemaStr = template.schema as string;
            if (
              schemaStr &&
              typeof schemaStr === "string" &&
              (schemaStr.startsWith("[") || schemaStr.startsWith("{"))
            ) {
              parsedSchema = JSON.parse(schemaStr);
            }
          } catch (error) {
            console.error(
              `Error parsing schema for template ${template.id}:`,
              error
            );
          }
        }

        return {
          ...template,
          createdAt: template.createdAt ? template.createdAt.toISOString() : "",
          updatedAt: template.updatedAt ? template.updatedAt.toISOString() : "",
          schema: parsedSchema,
        };
      });
      setTemplates(formattedTemplates as Template[]);
    } else if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  async function onCreateSubmit(values: TemplateFormValues) {
    console.log("Submitting template creation form with values:", values);
    try {
      const result = await createTemplate(values);
      console.log("Template creation result:", result);

      if (result.success) {
        toast({
          title: "Success",
          description: "Template created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchTemplates();
      } else if (result.error) {
        console.error(
          "Error creating template:",
          result.error,
          result.details || ""
        );
        toast({
          title: "Error",
          description: result.details
            ? `${result.error}: ${result.details}`
            : result.error,
          variant: "destructive",
        });
      } else {
        console.warn("No success or error in response:", result);
      }
    } catch (error) {
      console.error("Exception during template creation:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function onEditSubmit(values: TemplateFormValues) {
    if (!selectedTemplate) return;

    const result = await updateTemplate(selectedTemplate.id, values);
    if (result.success) {
      toast({ title: "Success", description: "Template updated successfully" });
      setIsEditDialogOpen(false);
      editForm.reset();
      fetchTemplates();
    } else if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  async function onDelete() {
    if (!selectedTemplate) return;

    const result = await deleteTemplate(selectedTemplate.id);
    if (result.success) {
      toast({ title: "Success", description: "Template deleted successfully" });
      setIsDeleteDialogOpen(false);
      fetchTemplates();
    } else if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  function openEditDialog(template: Template) {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(template: Template) {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a template for structured output generation.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Template name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="soap">SOAP Note</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="structured">
                            Structured Template
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Template content"
                          {...field}
                          rows={10}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Structured Template Schema Fields */}
                {form.watch("type") === "structured" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Schema Fields</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            key: "",
                            label: "",
                            type: "text",
                            required: false,
                            placeholder: "",
                            description: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>

                    {fields.length === 0 && (
                      <div className="text-center p-4 border border-dashed rounded-md">
                        <FileJson className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No schema fields added yet. Add fields to create a
                          structured template.
                        </p>
                      </div>
                    )}

                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-md space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Field {index + 1}</h4>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                index > 0 && move(index, index - 1)
                              }
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                index < fields.length - 1 &&
                                move(index, index + 1)
                              }
                              disabled={index === fields.length - 1}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`schema.${index}.key`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., subjective"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`schema.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Subjective"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`schema.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select field type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="text">
                                      Short Text
                                    </SelectItem>
                                    <SelectItem value="textarea">
                                      Long Text
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`schema.${index}.required`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-end space-x-3 rounded-md border p-3">
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      id={`required-${index}`}
                                    />
                                    <label
                                      htmlFor={`required-${index}`}
                                      className="text-sm font-medium leading-none"
                                    >
                                      Required Field
                                    </label>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`schema.${index}.placeholder`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Placeholder</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Enter subjective information..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`schema.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Patient history and subjective information"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit">Create Template</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          onValueChange={(value) =>
            setTypeFilter(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="soap">SOAP Notes</SelectItem>
            <SelectItem value="summary">Summaries</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="structured">Structured Templates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex justify-center py-8">
          <EmptyState
            title="No templates found"
            description={
              typeFilter
                ? "Try selecting a different template type or clear your filters."
                : "Create your first template to get started."
            }
            icons={[FileJson, PlusCircle, Edit]}
            action={
              !typeFilter
                ? {
                    label: "Create Template",
                    onClick: () => setIsCreateDialogOpen(true),
                  }
                : undefined
            }
            className="mx-auto"
          />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                        {template.type === "soap"
                          ? "SOAP Note"
                          : template.type === "summary"
                            ? "Summary"
                            : template.type === "email"
                              ? "Email"
                              : "Structured Template"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-hidden text-ellipsis">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {template.content.length > 200
                      ? `${template.content.substring(0, 200)}...`
                      : template.content}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="soap">SOAP Note</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="structured">
                          Structured Template
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Template content"
                        {...field}
                        rows={10}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Edit Structured Template Schema Fields */}
              {editForm.watch("type") === "structured" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Schema Fields</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        editSchema.append({
                          key: "",
                          label: "",
                          type: "text",
                          required: false,
                          placeholder: "",
                          description: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  {editSchema.fields.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <FileJson className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No schema fields added yet. Add fields to create a
                        structured template.
                      </p>
                    </div>
                  )}

                  {editSchema.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 border rounded-md space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        <div className="flex space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              index > 0 && editSchema.move(index, index - 1)
                            }
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              index < editSchema.fields.length - 1 &&
                              editSchema.move(index, index + 1)
                            }
                            disabled={index === editSchema.fields.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => editSchema.remove(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={editForm.control}
                          name={`schema.${index}.key`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., subjective"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name={`schema.${index}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Label</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Subjective"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={editForm.control}
                          name={`schema.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="text">
                                    Short Text
                                  </SelectItem>
                                  <SelectItem value="textarea">
                                    Long Text
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name={`schema.${index}.required`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-end space-x-3 rounded-md border p-3">
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id={`edit-required-${index}`}
                                  />
                                  <label
                                    htmlFor={`edit-required-${index}`}
                                    className="text-sm font-medium leading-none"
                                  >
                                    Required Field
                                  </label>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editForm.control}
                        name={`schema.${index}.placeholder`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placeholder</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Enter subjective information..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name={`schema.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Patient history and subjective information"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button type="submit">Update Template</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
