import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import BannerEditor from "./components/BannerEditor";
import TextEditor from "./components/TextEditor";
import LoadingScreen from "./components/LoadingScreen";
import { Suspense } from "react";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aicademic-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<TextEditor />} />
                <Route path="/banner" element={<BannerEditor />} />
              </Routes>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;