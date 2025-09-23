import Navbar from "@/components/navbar";
import ReportForm from "@/components/report-form";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="page-title">
            Submit an Incident Report
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="page-description">
            Your report helps us maintain a safe and ethical workplace. All reports are handled with complete confidentiality and investigated thoroughly.
          </p>
        </div>
        <ReportForm />
      </main>
    </div>
  );
}
