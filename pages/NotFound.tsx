import { Button } from "@/components/ui/button";
import { MonitoLogo } from "@/components/MonitoLogo";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="paper-card w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <MonitoLogo size={64} />
        </div>
        <h1 className="mt-4 font-display text-3xl text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">
          Esta página se escondió. Ni el andamiaje la encuentra.
        </p>
        <Button asChild className="tactile mt-6 w-full rounded-2xl font-bold">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
