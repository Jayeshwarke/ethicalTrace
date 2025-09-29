import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import CaseTable from "@/components/case-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Search } from "lucide-react";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    search: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/cases/stats"],
  });

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/cases", filters.status, filters.category, filters.search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.category && filters.category !== "all") params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      
      return fetch(`/api/cases?${params.toString()}`, {
        credentials: "include",
      }).then(res => res.json());
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="dashboard-title">
                Case Management Dashboard
              </h1>
              <p className="text-muted-foreground" data-testid="dashboard-description">
                Manage and track incident reports
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground" data-testid="welcome-message">
                Welcome, {user?.username}
              </span>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Open Cases</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-new">
                    {statsLoading ? "..." : (stats as any)?.new || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-investigating">
                    {statsLoading ? "..." : (stats as any)?.investigating || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-resolved">
                    {statsLoading ? "..." : (stats as any)?.resolved || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-this-month">
                    {statsLoading ? "..." : (stats as any)?.thisMonth || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="ethics">Ethics</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search cases..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <CaseTable cases={cases || []} isLoading={casesLoading} />
      </div>
    </div>
  );
}
