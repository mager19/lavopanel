"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="bg-primary rounded-2xl p-3">
            <Droplets className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LavoPanel</h1>
          <p className="text-sm text-muted-foreground">Sistema de gestión</p>
        </div>

        <Card className="shadow-md border-border">
          <CardHeader className="pb-4">
            <p className="text-lg font-semibold text-foreground">Iniciar sesión</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive font-medium">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold rounded-2xl"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
