import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Eye, Edit } from "lucide-react";

interface CaseTableProps {
  cases: any[];
  isLoading: boolean;
}

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

export default function CaseTable({ cases, isLoading }: CaseTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4" data-testid="no-cases-message">
              No cases found matching your criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="table-title">Recent Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem) => (
                <TableRow key={caseItem.id} className="hover:bg-muted/50" data-testid={`case-row-${caseItem.id}`}>
                  <TableCell className="font-medium" data-testid={`case-id-${caseItem.id}`}>
                    {caseItem.trackingId}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={(categoryColors as any)[caseItem.category]} 
                      data-testid={`case-category-${caseItem.id}`}
                    >
                      {caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`case-reporter-${caseItem.id}`}>
                    {caseItem.anonymous ? "Anonymous" : caseItem.reporterName || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={(statusColors as any)[caseItem.status]} 
                      data-testid={`case-status-${caseItem.id}`}
                    >
                      {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`case-date-${caseItem.id}`}>
                    {format(new Date(caseItem.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/admin/cases/${caseItem.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-${caseItem.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground" data-testid="results-count">
            Showing {cases.length} case{cases.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
