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
import { ThemeProvider } from "@/components/theme-provider";
import CookieConsent from "@/components/CookieConsent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminSettings />} />
              <Route path="/banner" element={<BannerEditor />} />
              <Route path="/banner/:id" element={<BannerEditor />} />
              <Route path="/article" element={<ArticleEditor />} />
              <Route path="/monography" element={<MonographyEditor />} />
              <Route path="/thesis" element={<ThesisEditor />} />
              <Route path="/intervention-project" element={<InterventionProjectEditor />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
            </Routes>
            <Toaster />
            <CookieConsent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;