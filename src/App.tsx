import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import BannerEditor from "./components/BannerEditor";
import TextEditor from "./components/TextEditor";
import LoadingScreen from "./components/LoadingScreen";
import { Suspense } from "react";
import Index from "./pages/Index";
import Header from "./components/Header";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aicademic-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div>
              <Header />
              <div className="pt-14">
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/editor" element={<TextEditor />} />
                    <Route path="/banner" element={<BannerEditor />} />
                    <Route path="/admin" element={<AdminSettings />} />
                  </Routes>
                </Suspense>
              </div>
              <Toaster />
            </div>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;