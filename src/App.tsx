import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Profile from "@/pages/Profile";
import AdminSettings from "@/pages/AdminSettings";
import BannerEditor from "@/components/BannerEditor";
import ArticleEditor from "@/pages/ArticleEditor";
import MonographyEditor from "@/pages/MonographyEditor";
import ThesisEditor from "@/pages/ThesisEditor";
import InterventionProjectEditor from "@/pages/InterventionProjectEditor";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { AuthProvider } from "@/contexts/AuthContext";
import { ValidationProvider } from "@/contexts/ValidationContext";
import { ThemeProvider } from "@/components/theme-provider";
import CookieConsent from "@/components/CookieConsent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SharedBannerPage } from "@/pages/SharedBannerPage";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <ValidationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminSettings />} />
                <Route path="/banner" element={<BannerEditor />} />
                <Route path="/banner/:id" element={<BannerEditor />} />
                <Route path="/banner/shared/:token" element={<SharedBannerPage />} />
                <Route path="/article" element={<ArticleEditor />} />
                <Route path="/article/:id" element={<ArticleEditor />} />
                <Route path="/monography" element={<MonographyEditor />} />
                <Route path="/monography/:id" element={<MonographyEditor />} />
                <Route path="/thesis" element={<ThesisEditor />} />
                <Route path="/thesis/:id" element={<ThesisEditor />} />
                <Route path="/intervention-project" element={<InterventionProjectEditor />} />
                <Route path="/intervention-project/:id" element={<InterventionProjectEditor />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
              </Routes>
              <Toaster />
              <CookieConsent />
            </Router>
          </ValidationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;