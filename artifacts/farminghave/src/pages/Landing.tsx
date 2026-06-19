import React from "react";
import { useSignIn } from "@clerk/react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Landing({ onPlayGuest }: { onPlayGuest: () => void }) {
  const { signIn, isLoaded } = useSignIn();

  const loginWithX = async () => {
    if (!isLoaded) return;
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: `${basePath}/sign-in/sso-callback`,
      redirectUrlComplete: basePath || '/',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-card border-2 border-primary flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-in zoom-in duration-500">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-16 h-16" />
        </div>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/50 mb-2 tracking-wider text-center animate-in slide-in-from-bottom-4 duration-700">
          FarmingHave
        </h1>
        <p className="text-muted-foreground mb-12 text-center text-sm font-semibold tracking-widest uppercase animate-in slide-in-from-bottom-6 duration-700 delay-100">
          Grow. Harvest. Prosper.
        </p>

        <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <Button 
            onClick={loginWithX}
            className="w-full h-14 text-lg font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl"
            data-testid="button-login-x"
          >
            Sign in with X
          </Button>

          <Button 
            variant="outline"
            onClick={onPlayGuest}
            className="w-full h-14 text-lg font-bold border-2 border-primary text-primary hover:bg-primary/10 rounded-xl"
            data-testid="button-play-guest"
          >
            Play as Guest
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4 font-medium px-4">
            Sign in to save your progress &bull; Guest saves nothing
          </p>
        </div>
      </div>
    </div>
  );
}
