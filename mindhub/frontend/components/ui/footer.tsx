"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/radix-tooltip"
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Moon, 
  Send, 
  Sun, 
  Twitter,
  Heart,
  Shield,
  Stethoscope,
  Users
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface MindHubFooterProps {
  variant?: "full" | "minimal" | "hidden"
  className?: string
}

export function MindHubFooter({ variant = "full", className }: MindHubFooterProps) {
  const { effectiveTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (variant === "hidden") {
    return null
  }

  if (variant === "minimal") {
    return (
      <footer className={cn(
        "border-t bg-background/80 backdrop-blur-sm text-foreground transition-colors duration-300",
        className
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-semibold">MindHub</span>
              <span className="text-muted-foreground">© 2024</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Términos
              </Link>
              {mounted && (
                <div className="flex items-center space-x-2">
                  <Sun className="h-3 w-3" />
                  <Switch
                    checked={effectiveTheme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    className="scale-75"
                  />
                  <Moon className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={cn(
      "relative border-t bg-background text-foreground transition-colors duration-300",
      className
    )}>
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter & Branding */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">MindHub</h2>
            </div>
            <p className="mb-6 text-muted-foreground">
              Plataforma integral de gestión sanitaria para profesionales de la salud.
              Únete a nuestro newsletter para recibir actualizaciones.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="Ingresa tu email"
                className="pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 p-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Suscribirse</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Módulos
            </h3>
            <nav className="space-y-2 text-sm">
              <Link href="/hubs/expedix" className="block transition-colors hover:text-primary">
                Expedix - Gestión de Pacientes
              </Link>
              <Link href="/hubs/agenda" className="block transition-colors hover:text-primary">
                Agenda - Citas Médicas
              </Link>
              <Link href="/hubs/clinimetrix" className="block transition-colors hover:text-primary">
                ClinimetrixPro - Evaluaciones
              </Link>
              <Link href="/hubs/formx" className="block transition-colors hover:text-primary">
                FormX - Formularios
              </Link>
              <Link href="/hubs/finance" className="block transition-colors hover:text-primary">
                Finance - Facturación
              </Link>
            </nav>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Soporte
            </h3>
            <address className="space-y-2 text-sm not-italic">
              <p>Soporte Técnico 24/7</p>
              <p>México, Latinoamérica</p>
              <p>Teléfono: +52 (55) 1234-5678</p>
              <p>Email: soporte@mindhub.cloud</p>
              <Link href="/help" className="block transition-colors hover:text-primary">
                Centro de Ayuda
              </Link>
            </address>
          </div>

          {/* Social & Theme */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Síguenos
            </h3>
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full p-2">
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full p-2">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full p-2">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full p-2">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Conéctate en LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {mounted && (
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={effectiveTheme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode" className="sr-only">
                  Cambiar tema oscuro
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            © 2024 MindHub. Plataforma de Gestión Sanitaria. Todos los derechos reservados.
          </p>
          <nav className="flex gap-4 text-sm">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Política de Privacidad
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Términos de Servicio
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-primary">
              Configuración de Cookies
            </Link>
            <Link href="/gdpr" className="transition-colors hover:text-primary">
              GDPR
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { MindHubFooter as Footer }