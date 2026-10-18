import { Button } from "@/components/ui/button";
import { MonitoLogo } from "@/components/MonitoLogo";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="paper-card w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <MonitoLogo size={72} />
        </div>
        <h1 className="mt-4 font-display text-2xl text-primary">Monito gIA</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Andamiaje cognitivo para tu salón de clases.
        </p>
        <Button
          className="tactile mt-6 w-full rounded-2xl font-bold"
          size="lg"
          onClick={() => {
            window.location.href = getOAuthUrl();
          }}
        >
          Entrar con Kimi
        </Button>
      </div>
    </div>
  );
}
