"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Settings, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api"

interface UserData {
    nombre?: string
    apellido?: string
    nombre_completo?: string
    nivelAcceso?: string
    email?: string
}

export default function UserDropdown() {
    const router = useRouter()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [userData, setUserData] = useState<UserData | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Cargar datos del usuario desde localStorage o API
        const currentUserStr = localStorage.getItem("currentUser")
        if (currentUserStr) {
            try {
                const currentUser = JSON.parse(currentUserStr)
                setUserData(currentUser)
            } catch (e) {
                console.error("Error obteniendo dato del usuario:", e)
            }
        }
    }, [])

    useEffect(() => {
        // Cerrar dropdown al hacer clic fuera
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleLogout = async () => {
        try {
            const response = await authFetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })

            const data = await response.json()

            if (response.ok) {
                toast({
                    title: "Sesión cerrada con éxito",
                    description: "Hasta luego",
                })

                localStorage.removeItem("currentUser")
                localStorage.removeItem("authToken")
                router.push("/")
            } else {
                toast({
                    title: "Error al cerrar sesión",
                    description: data.error || "No se pudo cerrar la sesión.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar al servidor.",
                variant: "destructive",
            })
        }
    }

    const getInitials = (nombre?: string, apellido?: string) => {
        if (!nombre) return "U"
        const firstInitial = nombre.charAt(0).toUpperCase()
        const secondInitial = apellido?.charAt(0).toUpperCase() || ""
        return (firstInitial + secondInitial).slice(0, 2)
    }

    const nombre = userData?.nombre_completo || `${userData?.nombre || ""} ${userData?.apellido || ""}`.trim() || "Usuario"
    const nivelAcceso = userData?.nivelAcceso || "Sin nivel de acceso"
    const initials = getInitials(userData?.nombre, userData?.apellido)

return (
        <div ref={dropdownRef} className="relative">
            {/* Botón que abre el dropdown */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] group"
            >
                {/* Avatar circular con iniciales */}
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
                    {initials}
                </div>

                {/* Nombre y cargo */}
                <div className="hidden sm:flex flex-col items-start">
                    <p className="text-sm font-semibold text-white leading-tight">{nombre}</p>
                    <p className="text-xs text-purple-300 leading-tight">{nivelAcceso}</p>
                </div>  
                <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="fixed right-0 top-16 w-56 bg-[#0f172a] border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-100 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Sección "Mi cuenta" */}
                    <div className="px-4 py-2.5 border-b border-slate-800/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Mi cuenta</p>
                    </div>

                    {/* Opciones del menú */}   
                    <nav className="px-2 py-1.5 space-y-0.5">
                        <button
                            onClick={() => {
                                router.push("/dashboard/perfil")
                                setIsOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span className="text-sm">Perfil</span>
                        </button>

                        <button
                            onClick={() => {
                                router.push("/dashboard/configuracion")
                                setIsOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Configuración</span>
                        </button>
                    </nav>

                    {/* Divisor */} 
                    <div className="h-px bg-slate-800/50 my-1"></div>

                    {/* Botón de logout */}
                    <div className="px-2 pb-2 pt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-500/30 border border-red-500/20 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-semibold">Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
