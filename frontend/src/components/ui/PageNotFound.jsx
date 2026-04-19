import { Link } from "react-router-dom";
import CompanyLogo from "@/components/ui/CompanyLogo";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <CompanyLogo size={48} className="mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
