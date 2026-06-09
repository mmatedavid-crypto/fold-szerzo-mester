import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authErrorMessage } from "@/lib/user-facing-errors";

type Provider = "apple" | "google";

const APPLE_ICON = (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.46 2.23-1.207 3.004-.806.835-2.117 1.482-3.196 1.397-.137-1.114.43-2.27 1.17-3.014.83-.836 2.247-1.464 3.233-1.387zM20.5 17.21c-.554 1.277-.82 1.848-1.534 2.978-.997 1.576-2.402 3.54-4.144 3.555-1.547.014-1.945-.99-4.048-.978-2.103.013-2.541 1.01-4.09.996-1.741-.015-3.073-1.787-4.07-3.363C.024 16.07-.34 11.27 1.395 8.737 2.628 6.94 4.572 5.89 6.397 5.89c1.86 0 3.026 1.013 4.557 1.013 1.484 0 2.39-1.014 4.54-1.014 1.625 0 3.346.876 4.575 2.39-4.02 2.183-3.368 7.881.43 8.932z" />
  </svg>
);

const GOOGLE_ICON = (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.1-.2-1.6H12z"
    />
    <path
      fill="#34A853"
      d="M3.9 7.6l3.2 2.3C8 7.9 9.8 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.9 14.6 2.9 12 2.9 8.2 2.9 5 5.1 3.9 7.6z"
      opacity="0"
    />
  </svg>
);

const LABELS: Record<Provider, string> = {
  apple: "Folytatás Apple-lel",
  google: "Folytatás Google-lel",
};

export function OAuthButton({ provider, label }: { provider: Provider; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error(authErrorMessage(result.error));
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      window.location.href = "/dashboard";
    } catch {
      toast.error("Most nem sikerült az átirányításos belépés. Próbáld újra pár perc múlva.");
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={loading}>
      {provider === "apple" ? APPLE_ICON : GOOGLE_ICON}
      {loading ? "Átirányítás..." : (label ?? LABELS[provider])}
    </Button>
  );
}

// Backwards compatible alias
export function AppleButton({ label }: { label?: string }) {
  return <OAuthButton provider="apple" label={label} />;
}
