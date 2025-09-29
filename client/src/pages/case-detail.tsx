import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, useRoute } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCaseNoteSchema, updateReportStatusSchema } from "@shared/schema";
import { z } from "zod";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { PlusIcon, EyeIcon, MessageSquareIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const noteSchema = insertCaseNoteSchema.pick({ note: true });
type NoteForm = z.infer<typeof noteSchema>;

const statusUpdateSchema = updateReportStatusSchema;
type StatusForm = z.infer<typeof statusUpdateSchema>;

const statusColors = {
  new: "bg-orange-100 text-orange-800",
  investigating: "bg-yellow-100 text-yellow-800", 
  pending: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const categoryColors = {
  harassment: "bg-red-100 text-red-800",
  safety: "bg-blue-100 text-blue-800",
  ethics: "bg-purple-100 text-purple-800",
  fraud: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-800",
};

export default function CaseDetail() {
  const [, params] = useRoute("/admin/cases/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const id = params?.id;
  
  // Debug logging
  console.log("CaseDetail - ID from useRoute:", id);
  console.log("CaseDetail - params:", params);

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["/api/cases", id],
    queryFn: () => fetch(`/api/cases/${id}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!id, // Only run query when id exists
  });

  // Debug logging for case data
  console.log("CaseDetail - caseData:", caseData);
  console.log("CaseDetail - isLoading:", isLoading);
  console.log("CaseDetail - error:", error);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/cases/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Status Updated",
        description: "Case status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const res = await apiRequest("POST", `/api/cases/${id}/notes`, { note });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", id] });
      noteForm.reset();
      toast({
        title: "Note Added",
        description: "Your note has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const noteForm = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const handleAddNote = (data: NoteForm) => {
    addNoteMutation.mutate(data.note);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Case Not Found</h1>
            <p className="text-muted-foreground mb-4">The case you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/admin")} data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground p-0" 
                onClick={() => setLocation("/admin")}
                data-testid="breadcrumb-dashboard"
              >
                Dashboard
              </Button>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground mx-2" />
                <span className="text-sm text-foreground font-medium" data-testid="breadcrumb-case">
                  Case {caseData.trackingId}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading case details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">Failed to load case details</p>
              <Button onClick={() => setLocation("/admin")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && !caseData && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Case not found</p>
              <Button onClick={() => setLocation("/admin")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && caseData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="case-title">
                      Case {caseData.trackingId}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <Badge className={(categoryColors as any)[caseData.category]} data-testid="case-category">
                        {caseData.category ? caseData.category.charAt(0).toUpperCase() + caseData.category.slice(1) : 'Unknown'}
                      </Badge>
                      <Badge className={(statusColors as any)[caseData.status]} data-testid="case-status">
                        {caseData.status ? caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Reported</p>
                    <p className="text-sm font-medium text-foreground" data-testid="case-date">
                      {caseData.createdAt ? format(new Date(caseData.createdAt), "MMMM d, yyyy") : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incident Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Incident Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground" data-testid="case-description">
                  <p>{caseData.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Case Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                              <PlusIcon className="w-4 h-4 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-foreground">Case Created</span>
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {caseData.createdAt ? format(new Date(caseData.createdAt), "MMMM d, yyyy 'at' h:mm a") : 'Unknown'}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>Initial report submitted {caseData.anonymous ? "anonymously" : `by ${caseData.reporterName}`}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    {caseData.notes?.map((note: any, index: number) => (
                      <li key={note.id}>
                        <div className={index === caseData.notes.length - 1 ? "relative" : "relative pb-8"}>
                          {index !== caseData.notes.length - 1 && (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
                                <MessageSquareIcon className="w-4 h-4 text-secondary-foreground" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <span className="font-medium text-foreground">Note Added</span>
                                </div>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  {format(new Date(note.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p>{note.note}</p>
                                <p className="text-xs mt-1">by {note.addedBy.username}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Reporter</dt>
                    <dd className="text-sm text-foreground" data-testid="case-reporter">
                      {caseData.anonymous ? "Anonymous" : caseData.reporterName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                    <dd className="text-sm text-foreground">
                      {caseData.category ? caseData.category.charAt(0).toUpperCase() + caseData.category.slice(1) : 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Current Status</dt>
                    <dd className="text-sm text-foreground">
                      {caseData.status ? caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1) : 'Unknown'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select 
                    value={caseData.status || "new"} 
                    onValueChange={handleStatusUpdate}
                    data-testid="select-status-update"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add Note */}
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={noteForm.handleSubmit(handleAddNote)} className="space-y-4">
                  <Textarea
                    {...noteForm.register("note")}
                    placeholder="Add investigation notes, updates, or observations..."
                    rows={4}
                    data-testid="textarea-note"
                  />
                  {noteForm.formState.errors.note && (
                    <p className="text-sm text-destructive" data-testid="error-note">
                      {noteForm.formState.errors.note.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addNoteMutation.isPending}
                    data-testid="button-add-note"
                  >
                    {addNoteMutation.isPending ? "Adding Note..." : "Add Note"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
