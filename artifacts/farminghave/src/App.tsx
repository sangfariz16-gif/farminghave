import React, { useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Game from "@/pages/Game";
import Landing from "@/pages/Landing";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(48, 100%, 50%)",
    colorForeground: "hsl(131, 40%, 94%)",
    colorMutedForeground: "hsl(131, 20%, 70%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(131, 35%, 12%)",
    colorInput: "hsl(131, 23%, 24%)",
    colorInputForeground: "hsl(131, 40%, 94%)",
    colorNeutral: "hsl(131, 23%, 24%)",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f2d0f] rounded-2xl w-[440px] max-w-full overflow-hidden border-2 border-[#2e4d2e]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#ffd700] font-black tracking-wide",
    headerSubtitle: "text-[#b2ccb2] font-semibold",
    socialButtonsBlockButtonText: "text-[#e8f5e9] font-bold",
    formFieldLabel: "text-[#b2ccb2] font-bold",
    footerActionLink: "text-[#ffd700] font-bold hover:text-[#ffd700]/80",
    footerActionText: "text-[#8a998a] font-medium",
    dividerText: "text-[#8a998a] font-medium",
    identityPreviewEditButton: "text-[#ffd700] hover:text-[#ffd700]/80",
    formFieldSuccessText: "text-[#4caf50]",
    alertText: "text-white",
    logoBox: "flex justify-center",
    logoImage: "w-16 h-16",
    socialButtonsBlockButton: "border-[#2e4d2e] hover:bg-[#1b4d1b] rounded-xl border-2",
    formButtonPrimary: "bg-[#ffd700] text-[#0d1f0d] font-bold hover:bg-[#e6c200] rounded-xl border-none",
    formFieldInput: "bg-[#1b4d1b] border-[#2e4d2e] text-[#e8f5e9] rounded-xl",
    footerAction: "mt-4",
    dividerLine: "bg-[#2e4d2e]",
    alert: "bg-red-500/20 border border-red-500",
    otpCodeFieldInput: "bg-[#1b4d1b] border-[#2e4d2e] text-[#e8f5e9]",
    formFieldRow: "space-y-4",
    main: "space-y-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function MainRoute() {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn || isGuestMode) {
    return <Game isGuest={!isSignedIn && isGuestMode} />;
  }

  return <Landing onPlayGuest={() => setIsGuestMode(true)} />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your farm",
          },
        },
        signUp: {
          start: {
            title: "Create your farm",
            subtitle: "Start growing today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={MainRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="*">
              <div className="min-h-screen flex items-center justify-center bg-background text-primary text-xl font-bold">
                404 - Not Found
              </div>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
