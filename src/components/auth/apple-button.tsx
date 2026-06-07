import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AppleButton({ label = "Folytatás Apple-lel" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error("Sikertelen Apple bejelentkezés: " + result.error.message);
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error("Hiba történt az Apple bejelentkezés során.");
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={loading}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.46 2.23-1.207 3.004-.806.835-2.117 1.482-3.196 1.397-.137-1.114.43-2.27 1.17-3.014.83-.836 2.247-1.464 3.233-1.387zM20.5 17.21c-.554 1.277-.82 1.848-1.534 2.978-.997 1.576-2.402 3.54-4.144 3.555-1.547.014-1.945-.99-4.048-.978-2.103.013-2.541 1.01-4.09.996-1.741-.015-3.073-1.787-4.07-3.363C.024 16.07-.34 11.27 1.395 8.737 2.628 6.94 4.572 5.89 6.397 5.89c1.86 0 3.026 1.013 4.557 1.013 1.484 0 2.39-1.014 4.54-1.014 1.625 0 3.346.876 4.575 2.39-4.02 2.183-3.368 7.881.43 8.932z" />
      </svg>
      {loading ? "Átirányítás..." : label}
    </Button>
  );
}