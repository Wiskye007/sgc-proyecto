"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Shield, Activity, BarChart3, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

const modules = [
    {
        id: "convictos",
        title: "Panel de Convictos",
        description: "Registrar, editar y consultar información de internos",
        icon: Users,
        href: "/dashboard/convictos",
        color: "text-blue-400",
        glow: "group-hover:shadow-blue-500/30",
    },
    {
        id: "seguridad",
        title: "Panel de Seguridad",
        description: "Control de pabellones, accesos y movimientos",
        icon: Shield,
        href: "/dashboard/seguridad",
        color: "text-red-400",
        glow: "group-hover:shadow-red-500/30",
    },
    {
        id: "medico",
        title: "Panel Médico",
        description: "Revisiones médicas, diagnósticos y tratamientos",
        icon: Activity,
        href: "/dashboard/medico",
        color: "text-green-400",
        glow: "group-hover:shadow-green-500/30",
    },
    {
        id: "reportes",
        title: "Panel de Reportes",
        description: "Genera reportes de población y estadísticas",
        icon: BarChart3,
        href: "/dashboard/reportes",
        color: "text-purple-400",
        glow: "group-hover:shadow-purple-500/30",
    },
]

export default function DashboardModules() {
    const router = useRouter()
    const { toast } = useToast()

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Sesión cerrada con éxito",
                        description: `Hasta luego`,
                });

                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("authToken");
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
        /* Envolvemos todo en sgc-bg para heredar las partículas y el fondo oscuro radial */
        <div className="sgc-bg min-h-screen w-full py-10 px-4 md:px-8 font-sans text-slate-200">
            <div className="container mx-auto max-w-6xl space-y-8 relative z-10">
                
                {/* --- HEADER DEL DASHBOARD --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                            <Shield className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-wide text-white">Panel Principal</h1>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">SGC - Carceleta San Martín</p>
                        </div>
                    </div>
                    
                    {/* Botón Destructivo Estilizado (Logout) */}
                    <Button 
                        aria-label="Cerrar sesión" 
                        onClick={handleLogout}
                        className="gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] h-11 px-6 rounded-lg font-semibold"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </Button>
                </div>

                {/* --- GRID DE MÓDULOS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module) => {
                        const Icon = module.icon
                        return (
                            <Card
                                key={module.id}
                                /* sgc-card aplica el acristalado, bordes y sombras del globals.css */
                                className={`sgc-card group cursor-pointer border-0 hover:-translate-y-1 transition-all duration-300 ${module.glow}`}
                                onClick={() => router.push(module.href)}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-5">
                                        {/* Contenedor del ícono que brilla al pasar el mouse */}
                                        <div className="rounded-xl bg-[#060a12] p-4 border border-slate-800 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                                            <Icon className={`h-8 w-8 ${module.color}`} />
                                        </div>
                                        <div className="flex-1 mt-1">
                                            <CardTitle className="text-2xl font-bold text-white mb-1.5 tracking-wide">{module.title}</CardTitle>
                                            <CardDescription className="text-slate-400 text-sm leading-relaxed">{module.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Falso botón que se anima con la tarjeta completa */}
                                    <div className="w-full h-11 rounded-lg flex items-center justify-center gap-2 bg-blue-500/5 text-blue-400 font-semibold border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                                        Acceder al módulo
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

            </div>
        </div>
    )
    }