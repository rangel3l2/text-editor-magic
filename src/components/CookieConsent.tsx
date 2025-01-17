import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkCookieConsent = async () => {
      // First check localStorage for anonymous users
      const localConsent = localStorage.getItem("cookieConsent");
      if (localConsent) {
        setShowBanner(false);
        return;
      }

      // Then check database for logged in users
      if (user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('cookie_consent')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error checking cookie consent:", error);
          setShowBanner(true);
          return;
        }

        // Only show if user hasn't consented before
        setShowBanner(!data?.cookie_consent);
      } else {
        // Show for anonymous users who haven't consented
        setShowBanner(true);
      }
    };

    checkCookieConsent();
  }, [user]);

  const handleAccept = async () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowBanner(false);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            cookie_consent: true,
            cookie_consent_date: new Date().toISOString(),
          } satisfies Database['public']['Tables']['user_preferences']['Insert'])
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving cookie consent:", error);
      }
    }

    toast.success("Preferências de cookies salvas!");
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setShowBanner(false);
    toast.success("Preferências de cookies salvas! Apenas cookies essenciais serão utilizados.");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-sm z-50">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Política de Cookies e Privacidade</CardTitle>
          <CardDescription>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Utilizamos cookies para melhorar sua experiência em nosso site. Alguns cookies são essenciais
            para o funcionamento básico do site, enquanto outros nos ajudam a entender como você interage
            com nosso conteúdo.
          </p>
          <div className="text-sm space-y-2">
            <p><strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site.</p>
            <p><strong>Cookies Analíticos:</strong> Nos ajudam a melhorar nosso site através de estatísticas anônimas.</p>
            <p><strong>Cookies de Preferências:</strong> Lembram suas escolhas e personalizam sua experiência.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Para mais informações, consulte nossa{" "}
            <a href="/privacy" className="underline hover:text-primary">
              Política de Privacidade
            </a>
            .
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleReject}>
            Apenas Essenciais
          </Button>
          <Button onClick={handleAccept}>
            Aceitar Todos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;