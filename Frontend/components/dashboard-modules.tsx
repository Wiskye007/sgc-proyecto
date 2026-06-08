"use client"

import {useRouter} from "next/navigation"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Users, Shield, Activity, BarChart3, LogOut} from "lucide-react"
import {useToast} from "@/hooks/use-toast" // Asegúrate de que tienes esta función de toast

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `http://${window.location.hostname}:5000/api`
    : "http://localhost:5000/api";

const modules = [
    {
        id: "convictos",
        title: "Panel de Convictos",
        description: "Registrar, editar y consultar información de internos",
        icon: Users,
        href: "/dashboard/convictos",
        color: "text-blue-400",
    },
    {
        id: "seguridad",
        title: "Panel de Seguridad",
        description: "Control de pabellones, accesos y movimientos",
        icon: Shield,
        href: "/dashboard/seguridad",
        color: "text-red-400",
    },
    {
        id: "medico",
        title: "Panel Médico",
        description: "Revisiones médicas, diagnósticos y tratamientos",
        icon: Activity,
        href: "/dashboard/medico",
        color: "text-green-400",
    },
    {
        id: "reportes",
        title: "Panel de Reportes",
        description: "Genera reportes de población y estadísticas",
        icon: BarChart3,
        href: "/dashboard/reportes",
        color: "text-purple-400",
    },
]

export default function DashboardModules() {
    const router = useRouter()
    const {toast} = useToast() // Usamos el hook de toast para mostrar el mensaje

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Sesión cerrada con éxito",
                    description: `Hasta luego`,
                    variant: "default",
                });

                // Limpiar los datos de la sesión
                localStorage.removeItem("currentUser");
                localStorage.removeItem("authToken");

                // Redirigir al usuario al login
                router.push("/");
            } else {
                toast({
                    title: "Error al cerrar sesión",
                    description: data.error || "No se pudo cerrar la sesión.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar al servidor.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Panel Principal</h1>
                    <p className="text-muted-foreground">Sistema de Gestión Carcelaria - Carceleta San Martín</p>
                </div>
                {/* Aquí agregamos el botón de cerrar sesión */}
                <Button aria-label="Cerrar sesión" onClick={handleLogout}
                        className="gap-2 border-1 border-red-400 bg-red-400/0 text-red-400 hover:bg-red-400/20"><LogOut
                    className="h-4 w-4"/>Cerrar sesión</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module) => {
                    const Icon = module.icon
                    return (
                        <Card
                            key={module.id}
                            className="hover:border-primary/50 transition-all cursor-pointer group"
                            onClick={() => router.push(module.href)}
                        >
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div
                                        className="rounded-lg bg-secondary p-3 group-hover:bg-primary/10 transition-colors">
                                        <Icon className={`h-8 w-8 ${module.color}`}/>
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
                                        <CardDescription className="text-base">{module.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full gap-2 bg-blue-300/10 hover:bg-blue-500/10"
                                        variant="secondary">
                                    Acceder al módulo
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

