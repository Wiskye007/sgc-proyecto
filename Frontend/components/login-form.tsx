"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Eye, EyeOff, User, Lock, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api"

export default function LoginForm() {
    const router = useRouter()
    const { toast } = useToast()
    const [usuario, setUsuario] = useState("")
    const [contrasena, setContrasena] = useState("")
    const [emailRecuperacion, setEmailRecuperacion] = useState("")
    const [dialogRecuperarOpen, setDialogRecuperarOpen] = useState(false)

    // íconos de visibilidad de contraseña
    const [showPass, setShowPass] = useState(false)
    const [showRegPass, setShowRegPass] = useState(false)
    const [showRegPass2, setShowRegPass2] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingRecuperar, setIsLoadingRecuperar] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, password: contrasena }),
            })
            const data = await response.json()
            
            if (response.ok) {
                if (data.token) localStorage.setItem("authToken", data.token)
                localStorage.setItem("currentUser", JSON.stringify(data.usuario))
                toast({ 
                    title: "Inicio de sesión exitoso", 
                    description: `Bienvenido, ${data.usuario.nombre}` 
                })
                router.push("/dashboard")
            } else {
                // AQUÍ CAPTURAMOS EL ERROR ESPECÍFICO DEL BACKEND
                toast({
                    title: response.status === 403 ? "Acceso denegado" : "Error de inicio de sesión",
                    description: data.error || "Usuario o contraseña incorrectos",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar al servidor.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

const handleRecuperarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!emailRecuperacion || !emailRecuperacion.includes("@")) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor ingrese un correo electrónico válido",
        })
        return
        }
    setIsLoadingRecuperar(true)
    try {
        const respuesta = await fetch(`${API_URL}/auth/recuperar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: emailRecuperacion }),
        })
        const data = await respuesta.json()
        if (respuesta.ok && data.success) {
            toast({
            title: "Correo enviado",
            description: data.message || `Se ha enviado un enlace de recuperación a ${emailRecuperacion}`,
            })
            setEmailRecuperacion("")
            setDialogRecuperarOpen(false)
        } else {
            toast({
            variant: "destructive",
            title: "Error",
            description: data.error || "No se pudo enviar el correo de recuperación",
            })
        }
        } catch {
        toast({
            variant: "destructive",
            title: "Error de conexión",
            description: "No se pudo conectar con el servidor.",
        })
        } finally {
        setIsLoadingRecuperar(false)
        }
    }

const [dialogRegistroOpen, setDialogRegistroOpen] = useState(false)
const [nuevoUsuario, setNuevoUsuario] = useState({
        nombreCompleto: "",
        dni: "",
        correo: "",
        cargo: "",
        usuario: "",
        contrasena: "",
        confirmarContrasena: "",
        nivelAcceso: "",
    })

const handleRegistroUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuevoUsuario.contrasena !== nuevoUsuario.confirmarContrasena) {
        toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" })
        return
        }
    if (
        !nuevoUsuario.nombreCompleto ||
        !nuevoUsuario.dni ||
        !nuevoUsuario.correo ||
        !nuevoUsuario.cargo ||
        !nuevoUsuario.usuario ||
        !nuevoUsuario.contrasena ||
        !nuevoUsuario.nivelAcceso
        ) {
        return
        }
        setIsLoading(true)
        try {
        const datosParaAPI = { ...nuevoUsuario }
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosParaAPI),
        })
        const data = await response.json()
        if (response.ok) {
            toast({
            title: "Usuario creado exitosamente",
            description: `El usuario ${nuevoUsuario.usuario} ha sido registrado.`,
            })
            setNuevoUsuario({
            nombreCompleto: "",
            dni: "",
            correo: "",
            cargo: "",
            usuario: "",
            contrasena: "",
            confirmarContrasena: "",
            nivelAcceso: "",
            })
            setDialogRegistroOpen(false)
        } else {
            toast({
            title: "Error al registrar",
            description: data.error || "No se pudo crear el usuario",
            variant: "destructive",
            })
        }
        } catch {
        toast({
            title: "Error de conexión",
            description: "No se pudo conectar al servidor.",
            variant: "destructive",
        })
        } finally {
        setIsLoading(false)
        }
    }

    return (
        <Card className="sgc-card w-full max-w-md rounded-2xl border-0">
        <CardHeader className="space-y-4 text-center pt-8">
            <div className="flex justify-center">
            <div
                className="rounded-full p-4"
                style={{
                background: "linear-gradient(135deg, oklch(0.55 0.20 245), oklch(0.45 0.22 235))",
                boxShadow: "0 8px 24px -6px oklch(0.55 0.20 240 / 0.6)",
                }}>
                <Shield className="h-10 w-10 text-white" />
            </div>
            </div>
            <div>
            <CardTitle className="text-4xl font-bold tracking-tight text-white">SGC</CardTitle>
            <CardDescription className="text-base mt-2 text-blue-200/80">
                Sistema de Gestión Carcelaria
            </CardDescription>
            <p className="text-sm text-blue-300/50 mt-1">Carceleta San Martín</p>
            </div>
        </CardHeader>

        <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="usuario" className="sgc-label">Usuario</Label>
                <div className="relative">
                <User className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                    id="usuario"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    disabled={isLoading}
                    className="sgc-input pl-10 h-11"/>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="contrasena" className="sgc-label">Contraseña</Label>
                <div className="relative">
                <Lock className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                    id="contrasena"
                    type={showPass ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                    disabled={isLoading}
                    className="sgc-input pl-10 pr-10 h-11"/>
                <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="sgc-input-icon absolute right-3 top-1/2 -translate-y-1/2 hover:text-blue-400 transition-colors"
                    tabIndex={-1}>
                    {showPass ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                </div>
            </div>

            <Button
                type="submit"
                className="sgc-btn-primary w-full h-11 rounded-lg"
                disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Iniciar sesión"}
            </Button>

            <div className="flex flex-col gap-2 text-center pt-2">
                <Dialog open={dialogRecuperarOpen} onOpenChange={setDialogRecuperarOpen}>
                <DialogTrigger asChild>
                    <button type="button" className="sgc-link text-sm" disabled={isLoading}>
                        ¿Olvidó su contraseña?
                    </button>
                </DialogTrigger>
                <DialogContent className="sgc-card border-0">
                    <DialogHeader>
                    <DialogTitle className="text-white">Recuperar contraseña</DialogTitle>
                    <DialogDescription className="text-blue-200/70">
                        Ingrese su correo electrónico para recibir instrucciones de recuperación
                    </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRecuperarContrasena} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="sgc-label">Correo electrónico</Label>
                        <div className="relative">
                        <Mail className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={emailRecuperacion}
                            onChange={(e) => setEmailRecuperacion(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            required
                            className="sgc-input pl-10 h-11"
                        />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                        type="button"
                        onClick={() => setDialogRecuperarOpen(false)}
                        className="sgc-btn-secondary flex-1 h-10">Cancelar</Button>
                        <Button type="submit" className="sgc-btn-primary flex-1 h-10" disabled={isLoadingRecuperar}>
                        {isLoadingRecuperar ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                    </form>
                </DialogContent>
                </Dialog>

                <button
                type="button"
                className="sgc-link text-sm"
                disabled={isLoading}
                onClick={() => setDialogRegistroOpen(true)}>Crear nuevo usuario
                </button>
            </div>
            </form>
        </CardContent>

        {/* ---------- DIALOG: Registro de nuevo usuario ---------- */}

        <Dialog open={dialogRegistroOpen} onOpenChange={setDialogRegistroOpen}>
            <DialogContent className="sgc-card border border-blue-500/40 rounded-2xl max-w-[760px]">
            <DialogHeader>
                <DialogTitle className="text-white">Registro de nuevo usuario</DialogTitle>
                <DialogDescription className="text-blue-200/70">Complete los datos para crear un nuevo usuario en el sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegistroUsuario} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="nombreCompleto" className="sgc-label">Nombre completo</Label>
                <Input
                    id="nombreCompleto"
                    type="text"
                    placeholder="Ingrese sus datos"
                    value={nuevoUsuario.nombreCompleto}
                    onChange={(e) =>
                    setNuevoUsuario({
                        ...nuevoUsuario,
                        nombreCompleto: e.target.value,})
                    }
                    required
                    disabled={isLoading}
                    className="sgc-input h-10"/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="dni" className="sgc-label">DNI</Label>
                <Input
                    id="dni"
                    type="text"
                    placeholder="DNI"
                    value={nuevoUsuario.dni}
                    onChange={(e) =>
                    setNuevoUsuario({
                        ...nuevoUsuario,
                        dni: e.target.value.toUpperCase(),})
                    }
                    required
                    disabled={isLoading}
                    maxLength={8}
                    minLength={8}
                    pattern="^[a-zA-Z0-9]{8}$"
                    title="El DNI debe tener exactamente 8 caracteres"
                    className="sgc-input h-10"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="correo" className="sgc-label">Correo</Label>
                <Input
                    id="correo"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={nuevoUsuario.correo}
                    onChange={(e) =>setNuevoUsuario({...nuevoUsuario, correo: e.target.value,})}
                    onKeyDown={(e) => e.stopPropagation()}
                    required
                    disabled={isLoading}
                    className="sgc-input h-10"/>
                </div>

                <div className="space-y-2">
                <Label htmlFor="cargo" className="sgc-label">Cargo</Label>

                <Input
                    id="cargo"
                    type="text"
                    placeholder="Ingrese su cargo"
                    value={nuevoUsuario.cargo}
                    onChange={(e) =>
                    setNuevoUsuario({
                        ...nuevoUsuario,
                        cargo: e.target.value,})
                    }
                    required
                    disabled={isLoading}
                    className="sgc-input h-10"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="nivelAcceso" className="sgc-label">Nivel de acceso</Label>
                <Select
                    value={nuevoUsuario.nivelAcceso}
                    onValueChange={(value) =>
                    setNuevoUsuario({
                        ...nuevoUsuario,
                        nivelAcceso: value,})
                    }
                    disabled={isLoading}>
                    <SelectTrigger
                    id="nivelAcceso"
                    className="sgc-input h-10! w-full">
                    <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="guardia">Guardia de seguridad</SelectItem>
                    <SelectItem value="medico">Personal médico</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="nuevoUsuarioNombre" className="sgc-label">Usuario</Label>
                <Input
                    id="nuevoUsuarioNombre"
                    type="text"
                    placeholder="Usuario de acceso"
                    value={nuevoUsuario.usuario}
                    onChange={(e) =>
                    setNuevoUsuario({
                        ...nuevoUsuario,
                        usuario: e.target.value,})
                    }
                    required
                    disabled={isLoading}
                    className="sgc-input h-10"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="nuevaContrasena" className="sgc-label">Contraseña</Label>
                <div className="relative">
                    <Input
                    id="nuevaContrasena"
                    type={showRegPass ? "text" : "password"}
                    placeholder="•••••••••"
                    value={nuevoUsuario.contrasena}
                    onChange={(e) =>
                        setNuevoUsuario({
                        ...nuevoUsuario,
                        contrasena: e.target.value,})
                    }
                    required
                    disabled={isLoading}
                    className="sgc-input pr-10 h-10"/>
                    <button
                    type="button"
                    onClick={() => setShowRegPass((v) => !v)}
                    className="sgc-input-icon absolute right-3 top-1/2 -translate-y-1/2">
                    {showRegPass ? (
                        <Eye className="h-4 w-4" />
                    ) : (
                        <EyeOff className="h-4 w-4" />
                    )}
                    </button>
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="confirmarContrasena" className="sgc-label">Confirmar contraseña</Label>
                <div className="relative">
                    <Input
                    id="confirmarContrasena"
                    type={showRegPass2 ? "text" : "password"}
                    placeholder="•••••••••"
                    value={nuevoUsuario.confirmarContrasena}
                    onChange={(e) =>
                        setNuevoUsuario({
                        ...nuevoUsuario,
                        confirmarContrasena: e.target.value,
                        })
                    }
                    required
                    disabled={isLoading}
                    className="sgc-input pr-10 h-10"/>

                    <button
                    type="button"
                    onClick={() => setShowRegPass2((v) => !v)}
                    className="sgc-input-icon absolute right-3 top-1/2 -translate-y-1/2">
                    {showRegPass2 ? (
                        <Eye className="h-4 w-4" />
                    ) : (
                        <EyeOff className="h-4 w-4" />
                    )}
                    </button>
                </div>
                </div>

            </div>

            {/* BOTONES */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <Button
                type="button"
                onClick={() => setDialogRegistroOpen(false)}
                className="sgc-btn-secondary h-11"
                disabled={isLoading}>Cancelar</Button>
                <Button
                type="submit"
                className="sgc-btn-primary h-11"
                disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear usuario"}
                </Button>
            </div>
            </form>
        </DialogContent>
        </Dialog>
    </Card>
    )
}
