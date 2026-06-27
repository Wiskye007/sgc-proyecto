"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Activity, BarChart3, Lock } from "lucide-react"
import UserDropdown from "@/components/user-dropdown"
import ThemeToggle from "@/components/temadelsistema"
// Unificamos todos los módulos en una sola lista
const allModules = [
    {
        id: "convictos",
        title: "Panel de Convictos",
        description: "Registrar, editar y consultar información de internos",
        icon: Users,
        href: "/dashboard/convictos",
        color: "text-blue-400",
        glow: "group-hover:shadow-blue-500/30",
        requiresAdmin: false,
        fullWidth: false,
    },
    {
        id: "seguridad",
        title: "Panel de Seguridad",
        description: "Control de pabellones, accesos y movimientos",
        icon: Lock,
        href: "/dashboard/seguridad",
        color: "text-red-400",
        glow: "group-hover:shadow-red-500/30",
        requiresAdmin: false,
        fullWidth: false,
    },
    {
        id: "medico",
        title: "Panel Médico",
        description: "Revisiones médicas, diagnósticos y tratamientos",
        icon: Activity,
        href: "/dashboard/medico",
        color: "text-green-400",
        glow: "group-hover:shadow-green-500/30",
        requiresAdmin: false,
        fullWidth: false,
    },
    {
        id: "reportes",
        title: "Panel de Reportes",
        description: "Genera reportes de población y estadísticas",
        icon: BarChart3,
        href: "/dashboard/reportes",
        color: "text-purple-400",
        glow: "group-hover:shadow-purple-500/30",
        requiresAdmin: false,
        fullWidth: false,
    },
    {
        id: "usuarios",
        title: "Gestión de Usuarios",
        description: "Administra usuarios, permisos y control de acceso de todo el sistema SGC",
        icon: Users,
        href: "/dashboard/usuarios",
        color: "text-yellow-400",
        glow: "group-hover:shadow-yellow-500/30",
        requiresAdmin: true,
        fullWidth: true, // Para que ocupe las dos columnas
    },
]

export default function DashboardModules() {
    const router = useRouter()  
    // Solo necesitamos saber si es admin o no para bloquear la tarjeta visualmente
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser)
                const rol = userData.nivelacceso || userData.Nivelacceso || userData.nivelAcceso || ''  
                // Verificamos si tiene el rol de administrador
                if (rol.toLowerCase() === 'administrador' || rol.toLowerCase() === 'admin') {
                    setIsAdmin(true)
                }
            } catch (e) {
                console.error("Error al analizar los datos del usuario:", e)
            }
        }
    }, [])

    return (    
        <div className="sgc-bg min-h-screen w-full py-5 px-4 md:px-8 font-sans text-slate-200">
            <div className="container mx-auto max-w-6xl space-y-8 relative z-10">
                
                {/* --- TÍTULO DEL DASHBOARD --- */}
                <div className="w-full flex flex-row items-center justify-between bg-[#0a0f1a]/80 p-4 md:p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl gap-2 relative z-50">
                    
                    {/* LADO IZQUIERDO: Escudo y títulos */}
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <div className="hidden sm:flex h-10 w-10 md:h-12 md:w-12 rounded-xl border border-blue-500/20 bg-blue-500/10 items-center justify-center">
                            <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-3xl font-black text-white tracking-wide leading-none">PANEL PRINCIPAL</h1>
                            <p className="text-blue-400 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">SGC - Carceleta San Martín</p>
                        </div>
                    </div>

                    {/* LADO DERECHO: Componentes modulares (Ícono y perfil) */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <ThemeToggle />
                        <UserDropdown />
                    </div>
                </div>

                {/* --- MÓDULOS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allModules.map((module) => {   
                        const Icon = module.icon    
                        // Lógica para saber si el módulo debe bloquearse para este usuario
                        const isLocked = module.requiresAdmin && !isAdmin

                        return (
                            <Card
                                key={module.id}
                                className={`sgc-card border-0 transition-all duration-300 
                                    ${module.fullWidth ? 'md:col-span-2' : ''} 
                                    ${isLocked 
                                        ? 'opacity-60 cursor-not-allowed grayscale-30%' 
                                        : `group cursor-pointer hover:-translate-y-1 ${module.glow}`
                                    }`}
                                onClick={() => {
                                    if (!isLocked) router.push(module.href)
                                }}>
                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-5">
                                        <div className={`rounded-xl bg-[#060a12] p-4 border border-slate-800 shadow-inner transition-colors ${isLocked ? 'bg-slate-900/50' : 'group-hover:bg-slate-800/40'}`}>
                                            <Icon className={`h-8 w-8 ${isLocked ? 'text-slate-500' : module.color}`} />
                                        </div>
                                        <div className="flex-1 mt-1">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className={`text-2xl font-bold mb-1.5 tracking-wide ${isLocked ? 'text-slate-400' : 'text-white'}`}>
                                                    {module.title}
                                                </CardTitle>
                                                
                                                {/* Etiqueta roja de bloqueado si no es admin */}
                                                {isLocked && (
                                                    <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-red-500/20 bg-red-500/10 text-red-400">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                            <CardDescription className="text-slate-400 text-sm leading-relaxed">
                                                {module.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className={`w-full h-11 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-300
                                        ${isLocked 
                                            ? 'bg-slate-800/30 text-slate-500 border border-slate-800/50' 
                                            : 'bg-blue-500/5 text-blue-400 border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent'
                                        }`}>
                                        {isLocked ? (
                                            <>
                                                <Lock className="w-4 h-4 mr-1" />Requiere permisos de administrador
                                            </>
                                        ) : (
                                            'Acceder al módulo'
                                        )}
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