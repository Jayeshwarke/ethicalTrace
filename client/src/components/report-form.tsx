import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Upload, CheckCircle, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reportFormSchema = insertReportSchema.extend({
  file: z.any().optional(),
});

type ReportForm = z.infer<typeof reportFormSchema>;

export default function ReportForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      anonymous: false,
      reporterName: "",
      reporterEmail: "",
      category: "harassment" as const,
      description: "",
    },
  });

  const isAnonymous = form.watch("anonymous");

  const handleSubmit = async (data: ReportForm) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", data.category);
      formData.append("description", data.description);
      formData.append("anonymous", data.anonymous?.toString() || "false");
      
      if (!data.anonymous) {
        if (data.reporterName) formData.append("reporterName", data.reporterName);
        if (data.reporterEmail) formData.append("reporterEmail", data.reporterEmail);
      }

      if (data.file && data.file[0]) {
        formData.append("file", data.file[0]);
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      const result = await response.json();
      setTrackingId(result.trackingId);
      setIsSubmitted(true);
      
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      form.setValue("file", e.dataTransfer.files);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2" data-testid="success-title">
              Report Submitted Successfully
            </h2>
            <p className="text-muted-foreground mb-4" data-testid="success-description">
              Your report has been received and assigned tracking ID:
            </p>
            <div className="bg-muted rounded-md p-3 mb-4">
              <span className="font-mono text-lg font-semibold text-foreground" data-testid="tracking-id">
                {trackingId}
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="success-note">
              Please save this tracking ID for your records. You can use it to check the status of your report.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Confidentiality Notice:</strong> You can submit this report anonymously. 
            If you choose to provide your contact information, it will only be used if we need 
            clarification and will be kept strictly confidential.
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={form.watch("anonymous")}
              onCheckedChange={(checked) => form.setValue("anonymous", !!checked)}
              data-testid="checkbox-anonymous"
            />
            <Label htmlFor="anonymous" className="text-sm font-medium">
              Submit this report anonymously
            </Label>
          </div>

          {/* Contact Information */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${isAnonymous ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="reporterName">Your Name</Label>
              <Input
                id="reporterName"
                {...form.register("reporterName")}
                placeholder="John Doe"
                disabled={isAnonymous}
                data-testid="input-reporter-name"
              />
              {form.formState.errors.reporterName && (
                <p className="text-sm text-destructive" data-testid="error-reporter-name">
                  {form.formState.errors.reporterName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporterEmail">Email Address</Label>
              <Input
                id="reporterEmail"
                type="email"
                {...form.register("reporterEmail")}
                placeholder="john@example.com"
                disabled={isAnonymous}
                data-testid="input-reporter-email"
              />
              {form.formState.errors.reporterEmail && (
                <p className="text-sm text-destructive" data-testid="error-reporter-email">
                  {form.formState.errors.reporterEmail.message}
                </p>
              )}
            </div>
          </div>

          {/* Incident Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Incident Category</Label>
            <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value as any)}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harassment">Harassment or Discrimination</SelectItem>
                <SelectItem value="safety">Safety Violation</SelectItem>
                <SelectItem value="ethics">Ethics Violation</SelectItem>
                <SelectItem value="fraud">Fraud or Financial Misconduct</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive" data-testid="error-category">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Incident Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={6}
              placeholder="Please provide a detailed description of the incident, including when and where it occurred, who was involved, and any other relevant information."
              data-testid="textarea-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive" data-testid="error-description">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Supporting Documentation (Optional)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${dragActive || form.watch("file")?.[0] ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              data-testid="file-upload-area"
            >
              <CloudUpload className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
              <p className="text-sm text-muted-foreground mb-2">
                {form.watch("file")?.[0] ? form.watch("file")[0].name : "Drag and drop files here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
              <input
                id="file-input"
                type="file"
                {...form.register("file")}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="input-file"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3"
              data-testid="button-submit-report"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
