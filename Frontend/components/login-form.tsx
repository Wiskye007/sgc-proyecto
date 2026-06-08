"use client"
import type React from "react"
import {useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Shield} from "lucide-react"
import {useToast} from "@/hooks/use-toast"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

export default function LoginForm() {
    const router = useRouter()
    const {toast} = useToast()
    const [usuario, setUsuario] = useState("")
    const [contrasena, setContrasena] = useState("")
    const [emailRecuperacion, setEmailRecuperacion] = useState("")
    const [dialogRecuperarOpen, setDialogRecuperarOpen] = useState(false)

    // Estado de carga para deshabilitar botones
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingRecuperar, setIsLoadingRecuperar] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    usuario: usuario,
                    password: contrasena, // La API espera 'password'
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast({
                    title: "Inicio de sesión exitoso",
                    description: `Bienvenido, ${data.usuario.nombre}`,
                })
                router.push("/dashboard")

            } else {
                toast({
                    title: "Error de inicio de sesión",
                    description: `Usuario o contraseña incorrectos`,
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

// --- FUNCIÓN DE RECUPERACIÓN CONTRASEÑA ---
    const handleRecuperarContrasena = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation() // ← IMPORTANTE: Detener la propagación del evento

        // Validación básica del email
        if (!emailRecuperacion || !emailRecuperacion.includes('@')) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor ingrese un correo electrónico válido"
            })
            return
        }

        setIsLoadingRecuperar(true)

        try {
            console.log("Enviando solicitud de recuperación para:", emailRecuperacion)

            const respuesta = await fetch(`${API_URL}/auth/recuperar`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    correo: emailRecuperacion
                })
            })

            const data = await respuesta.json()
            console.log("Respuesta del servidor:", data)

            if (respuesta.ok && data.success) {
                toast({
                    title: "Correo enviado",
                    description: data.message || `Se ha enviado un enlace de recuperación a ${emailRecuperacion}`
                })
                setEmailRecuperacion("")
                setDialogRecuperarOpen(false)
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "No se pudo enviar el correo de recuperación"
                })
            }
        } catch (error) {
            console.error("Error en recuperación:", error)
            toast({
                variant: "destructive",
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor. Verifique que el servidor esté ejecutándose."
            })
        } finally {
            setIsLoadingRecuperar(false)
        }
    }

    // --- FUNCIÓN DE REGISTRO ---
    // Estados para el registro
    const [dialogRegistroOpen, setDialogRegistroOpen] = useState(false)
    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombreCompleto: "",
        dni: "",
        correo: "",
        cargo: "",
        usuario: "", // Se mapeará a 'nombreUsuario' en el backend
        contrasena: "",
        confirmarContrasena: "",
        nivelAcceso: "",
    })
    const handleRegistroUsuario = async (e: React.FormEvent) => {
        e.preventDefault()

        if (nuevoUsuario.contrasena !== nuevoUsuario.confirmarContrasena) {
            toast({
                title: "Error",
                description: "Las contraseñas no coinciden",
                variant: "destructive",
            })
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
        )

            setIsLoading(true)
        try {
            const datosParaAPI = {
                nombreCompleto: nuevoUsuario.nombreCompleto,
                dni: nuevoUsuario.dni,
                correo: nuevoUsuario.correo,
                cargo: nuevoUsuario.cargo,
                nivelAcceso: nuevoUsuario.nivelAcceso,
                usuario: nuevoUsuario.usuario,
                contrasena: nuevoUsuario.contrasena,
            }

            const response = await fetch(`${API_URL}/auth/registro`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
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
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar al servidor. Revisa que Flask esté corriendo.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md shadow-2xl border-border/50">
            <CardHeader className="space-y-4 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Shield className="h-12 w-12 text-primary"/>
                    </div>
                </div>
                <div>
                    <CardTitle className="text-3xl font-bold">SGC</CardTitle>
                    <CardDescription className="text-lg mt-2">Sistema de Gestión Carcelaria</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">Carceleta San Martín</p>
                </div>
            </CardHeader>
            <CardContent>
                {/* --- FORMULARIO DE LOGIN (PRINCIPAL) --- */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="usuario">Usuario</Label>
                        <Input
                            id="usuario"
                            type="text"
                            placeholder="Ingrese su usuario"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            className="bg-secondary border-border"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contrasena">Contraseña</Label>
                        <Input
                            id="contrasena"
                            type="password"
                            placeholder="Ingrese su contraseña"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                            className="bg-secondary border-border"
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className=" w-full gap-2 bg-blue-400/50 border-1 hover:bg-blue-400/70"
                            size="lg" disabled={isLoading}>
                        {isLoading ? "Ingresando..." : "Iniciar sesión"}
                    </Button>

                    <div className="flex flex-col gap-2 text-center">
                        {/* --- DIALOG DE RECUPERAR CONTRASEÑA --- */}
                        <Dialog open={dialogRecuperarOpen} onOpenChange={setDialogRecuperarOpen}>
                            <DialogTrigger asChild>
                                <button type="button" className="text-sm text-primary hover:underline"
                                        disabled={isLoading}>
                                    ¿Olvidó su contraseña?
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Recuperar contraseña</DialogTitle>
                                    <DialogDescription>Ingrese su correo electrónico para recibir instrucciones de
                                        recuperación</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleRecuperarContrasena} className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="email">Correo electrónico</Label><Input
                                        id="email" type="email" placeholder="correo@ejemplo.com"
                                        value={emailRecuperacion} onChange={(e) => setEmailRecuperacion(e.target.value)}
                                        required/>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline"
                                                onClick={() => setDialogRecuperarOpen(false)}
                                                className="flex-1">Cancelar</Button>
                                        <Button type="submit" className="flex-1"
                                                disabled={isLoadingRecuperar}> {isLoadingRecuperar ? "Enviando..." : "Enviar"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <button
                            type="button"
                            className="text-sm text-primary hover:underline"
                            disabled={isLoading}
                            onClick={() => setDialogRegistroOpen(true)}>Crear nuevo usuario
                        </button>
                    </div>
                </form>
                {/* --- FIN DEL FORMULARIO DE LOGIN --- */}
            </CardContent>
            <Dialog open={dialogRegistroOpen} onOpenChange={setDialogRegistroOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Registro de nuevo usuario</DialogTitle>
                        <DialogDescription>Complete los datos para crear un nuevo usuario del
                            sistema</DialogDescription>
                    </DialogHeader>

                    {/* --- FORMULARIO DE REGISTRO (INDEPENDIENTE) --- */}
                    <form onSubmit={handleRegistroUsuario} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombreCompleto">Nombre completo</Label>
                            <Input
                                id="nombreCompleto"
                                type="text"
                                placeholder="Nombre y apellido"
                                value={nuevoUsuario.nombreCompleto}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombreCompleto: e.target.value})}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
                                type="text"
                                placeholder="Número de DNI"
                                value={nuevoUsuario.dni}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, dni: e.target.value})}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="correo">Correo</Label>
                            <Input
                                id="correo"
                                type="text"
                                placeholder="correo@ejemplo.com"
                                value={nuevoUsuario.correo}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})}
                                required
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if ((e.key === 'q' || e.key === '2' || e.key === '@') && (e.ctrlKey || e.altKey)) {
                                        e.stopPropagation();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cargo">Cargo / Puesto</Label>
                            <Input
                                id="cargo"
                                type="text"
                                placeholder="Ej: Guardia, Médico, Administrador"
                                value={nuevoUsuario.cargo}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, cargo: e.target.value})}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nivelAcceso">Nivel de acceso</Label>
                            <Select
                                value={nuevoUsuario.nivelAcceso}
                                onValueChange={(value) => setNuevoUsuario({...nuevoUsuario, nivelAcceso: value})}
                                required
                                disabled={isLoading}
                            >
                                <SelectTrigger id="nivelAcceso">
                                    <SelectValue placeholder="Seleccione nivel de acceso"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="administrador">Administrador</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                    <SelectItem value="guardia">Guardia de seguridad</SelectItem>
                                    <SelectItem value="medico">Personal médico</SelectItem>
                                    <SelectItem value="administrativo">Administrativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nuevoUsuarioNombre">Nombre de usuario</Label>
                            <Input
                                id="nuevoUsuarioNombre"
                                type="text"
                                placeholder="Usuario para iniciar sesión"
                                value={nuevoUsuario.usuario}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, usuario: e.target.value})}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nuevaContrasena">Contraseña</Label>
                            <Input
                                id="nuevaContrasena"
                                type="password"
                                placeholder="Contraseña segura"
                                value={nuevoUsuario.contrasena}
                                onChange={(e) => setNuevoUsuario({...nuevoUsuario, contrasena: e.target.value})}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmarContrasena">Confirmar contraseña</Label>
                            <Input
                                id="confirmarContrasena"
                                type="password"
                                placeholder="Repita la contraseña"
                                value={nuevoUsuario.confirmarContrasena}
                                onChange={(e) => setNuevoUsuario({
                                    ...nuevoUsuario,
                                    confirmarContrasena: e.target.value
                                })}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogRegistroOpen(false)}
                                className="flex-1"
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? "Creando..." : "Crear usuario"}
                            </Button>
                        </div>
                    </form>
                    {/* --- FIN DEL FORMULARIO DE REGISTRO --- */}
                </DialogContent>
            </Dialog>
        </Card>
    )
}