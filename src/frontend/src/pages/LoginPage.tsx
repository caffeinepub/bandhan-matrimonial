import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-bandhan.dim_1200x400.jpg')",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

        <div className="relative flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
          {/* Logo mark */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center mb-6 shadow-rose">
            <span className="text-3xl">💍</span>
          </div>

          <h1 className="font-display text-5xl font-bold text-gradient-rose mb-2">
            Bandhan
          </h1>
          <p className="font-display text-lg text-foreground/60 italic mb-2">
            Matrimonial
          </p>
          <p className="font-body text-muted-foreground text-base max-w-xs mb-12 leading-relaxed">
            Where hearts meet and lifelong bonds begin. Find your perfect life
            partner.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-sm">
            {[
              { emoji: "🔍", label: "Browse Profiles" },
              { emoji: "💌", label: "Send Requests" },
              { emoji: "❤️", label: "Find Matches" },
            ].map((feat) => (
              <div
                key={feat.label}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
                  <span className="text-xl">{feat.emoji}</span>
                </div>
                <span className="text-xs font-body text-muted-foreground text-center leading-tight">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Login button */}
          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            size="lg"
            className="w-full max-w-sm h-14 text-base font-body font-semibold rounded-2xl shadow-rose"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>Sign in to Continue</>
            )}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground font-body">
            Secure login powered by Internet Identity
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 px-6">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
