"use client"

import type React from "react"

import {useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Textarea} from "@/components/ui/textarea"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {ArrowLeft, AlertTriangle, CheckCircle, Clock} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import * as api from "@/lib/api"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

const pabellones = [
    {id: "A", nombre: "Pabellón A", capacidad: 50, ocupacion: 48, nivel: "Máxima"},
    {id: "B", nombre: "Pabellón B", capacidad: 60, ocupacion: 52, nivel: "Alta"},
    {id: "C", nombre: "Pabellón C", capacidad: 40, ocupacion: 38, nivel: "Máxima"},
    {id: "D", nombre: "Pabellón D", capacidad: 45, ocupacion: 30, nivel: "Media"},
]

const incidentes = [
    {id: 1, tipo: "Alerta", descripcion: "Capacidad crítica en Pabellón A", hora: "14:30", prioridad: "alta"},
    {
        id: 2,
        tipo: "Movimiento",
        descripcion: "Traslado de 3 internos al Pabellón B",
        hora: "13:15",
        prioridad: "normal",
    },
    {id: 3, tipo: "Incidente", descripcion: "Altercado menor en comedor", hora: "12:45", prioridad: "media"},
]

export default function SeguridadPanel() {
    const router = useRouter()
    const {toast} = useToast()
    const [loading, setLoading] = useState(false)

    const [movimientoDialog, setMovimientoDialog] = useState(false)
    const [incidenteDialog, setIncidenteDialog] = useState(false)
    const [accesoDialog, setAccesoDialog] = useState(false)
    const [visitaDialog, setVisitaDialog] = useState(false)

    const [movimiento, setMovimiento] = useState({
        recluso: "",
        origen: "",
        destino: "",
        motivo: "",
        escolta: "",
    })

    const [incidente, setIncidente] = useState({
        tipo: "",
        ubicacion: "",
        descripcion: "",
        gravedad: "",
        involucrados: "",
    })

    const [acceso, setAcceso] = useState({
        persona: "",
        dni: "",
        tipo: "",
        area: "",
        motivo: "",
    })

    const [visita, setVisita] = useState({
        visitante: "",
        dniVisitante: "",
        recluso: "",
        parentesco: "",
        fecha: "",
    })

    const getOcupacionColor = (ocupacion: number, capacidad: number) => {
        const porcentaje = (ocupacion / capacidad) * 100
        if (porcentaje >= 90) return "bg-red-500"
        if (porcentaje >= 75) return "bg-yellow-500"
        return "bg-green-500"
    }

    const getPrioridadIcon = (prioridad: string) => {
        switch (prioridad) {
            case "alta":
                return <AlertTriangle className="h-4 w-4 text-red-400"/>
            case "media":
                return <Clock className="h-4 w-4 text-yellow-400"/>
            default:
                return <CheckCircle className="h-4 w-4 text-green-400"/>
        }
    }

    const handleRegistrarMovimiento = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: "Movimiento registrado",
            description: `Traslado de ${movimiento.recluso} registrado correctamente`,
        })
        setMovimientoDialog(false)
        setMovimiento({recluso: "", origen: "", destino: "", motivo: "", escolta: ""})
    }

    const handleReportarIncidente = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            const incidenteRequest: api.IncidenteRequest = {
                tipo: incidente.tipo,
                descripcion: incidente.descripcion,
                ubicacion: incidente.ubicacion,
                gravedad: incidente.gravedad,
                reportadoPor: "Usuario actual", // TODO: Obtener del usuario logueado
            }

            const result = await api.crearIncidente(incidenteRequest)

            if (result.success) {
                toast({
                    title: "Incidente reportado",
                    description: "El incidente ha sido registrado en el sistema y guardado en la base de datos",
                })
                setIncidenteDialog(false)
                setIncidente({tipo: "", ubicacion: "", descripcion: "", gravedad: "", involucrados: ""})
            } else {
                toast({
                    title: "Error",
                    description: result.message || "No se pudo guardar el incidente",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("[v0] Error al guardar incidente:", error)
            toast({
                title: "Error",
                description: "Ocurrió un error al guardar el incidente",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRegistrarAcceso = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: "Acceso registrado",
            description: `Acceso de ${acceso.persona} registrado`,
        })
        setAccesoDialog(false)
        setAcceso({persona: "", dni: "", tipo: "", area: "", motivo: ""})
    }

    const handleRegistrarVisita = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: "Visita registrada",
            description: `Visita de ${visita.visitante} registrada correctamente`,
        })
        setVisitaDialog(false)
        setVisita({visitante: "", dniVisitante: "", recluso: "", parentesco: "", fecha: ""})
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="container mx-auto max-w-7xl">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Panel de Seguridad</h1>
                        <p className="text-muted-foreground">Control de pabellones y accesos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {pabellones.map((pabellon) => {
                        const porcentaje = Math.round((pabellon.ocupacion / pabellon.capacidad) * 100)
                        return (
                            <Card key={pabellon.id}>
                                <CardHeader>
                                    <CardTitle className="text-xl">{pabellon.nombre}</CardTitle>
                                    <CardDescription>Nivel: {pabellon.nivel}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Ocupación</span>
                                            <span className="font-bold">
                        {pabellon.ocupacion}/{pabellon.capacidad}
                      </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getOcupacionColor(pabellon.ocupacion, pabellon.capacidad)}`}
                                                style={{width: `${porcentaje}%`}}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <Badge variant={porcentaje >= 90 ? "destructive" : "secondary"}>{porcentaje}%
                                                ocupado</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alertas e Incidentes Recientes</CardTitle>
                            <CardDescription>Últimas 24 horas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {incidentes.map((incidente) => (
                                    <div
                                        key={incidente.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                                    >
                                        {getPrioridadIcon(incidente.prioridad)}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm">{incidente.tipo}</span>
                                                <span className="text-xs text-muted-foreground">{incidente.hora}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{incidente.descripcion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones Rápidas</CardTitle>
                            <CardDescription>Gestión de seguridad</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Diálogo Registrar Movimiento */}
                            <Dialog open={movimientoDialog} onOpenChange={setMovimientoDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start" variant="secondary">
                                        Registrar movimiento de recluso
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registrar Movimiento de Recluso</DialogTitle>
                                        <DialogDescription>Complete los datos del traslado</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="recluso">Recluso *</Label>
                                            <Input
                                                id="recluso"
                                                placeholder="Nombre o DNI"
                                                value={movimiento.recluso}
                                                onChange={(e) => setMovimiento({
                                                    ...movimiento,
                                                    recluso: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="origen-seg">Origen *</Label>
                                                <Input
                                                    id="origen-seg"
                                                    placeholder="Pabellón/Celda"
                                                    value={movimiento.origen}
                                                    onChange={(e) => setMovimiento({
                                                        ...movimiento,
                                                        origen: e.target.value
                                                    })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="destino-seg">Destino *</Label>
                                                <Input
                                                    id="destino-seg"
                                                    placeholder="Pabellón/Celda"
                                                    value={movimiento.destino}
                                                    onChange={(e) => setMovimiento({
                                                        ...movimiento,
                                                        destino: e.target.value
                                                    })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="motivo-seg">Motivo *</Label>
                                            <Textarea
                                                id="motivo-seg"
                                                value={movimiento.motivo}
                                                onChange={(e) => setMovimiento({...movimiento, motivo: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="escolta">Personal de escolta *</Label>
                                            <Input
                                                id="escolta"
                                                placeholder="Nombre del oficial"
                                                value={movimiento.escolta}
                                                onChange={(e) => setMovimiento({
                                                    ...movimiento,
                                                    escolta: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setMovimientoDialog(false)}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-1">
                                                Registrar
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Diálogo Reportar Incidente */}
                            <Dialog open={incidenteDialog} onOpenChange={setIncidenteDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start" variant="secondary">
                                        Reportar incidente
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reportar Incidente de Seguridad</DialogTitle>
                                        <DialogDescription>Registre los detalles del incidente</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleReportarIncidente} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tipo-inc">Tipo de incidente *</Label>
                                            <Select value={incidente.tipo}
                                                    onValueChange={(v) => setIncidente({...incidente, tipo: v})}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="altercado">Altercado</SelectItem>
                                                    <SelectItem value="fuga">Intento de fuga</SelectItem>
                                                    <SelectItem value="contrabando">Contrabando</SelectItem>
                                                    <SelectItem value="agresion">Agresión</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ubicacion-inc">Ubicación *</Label>
                                            <Input
                                                id="ubicacion-inc"
                                                placeholder="Pabellón, celda o área"
                                                value={incidente.ubicacion}
                                                onChange={(e) => setIncidente({
                                                    ...incidente,
                                                    ubicacion: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gravedad">Gravedad *</Label>
                                            <Select
                                                value={incidente.gravedad}
                                                onValueChange={(v) => setIncidente({...incidente, gravedad: v})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="baja">Baja</SelectItem>
                                                    <SelectItem value="media">Media</SelectItem>
                                                    <SelectItem value="alta">Alta</SelectItem>
                                                    <SelectItem value="critica">Crítica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="descripcion-inc">Descripción *</Label>
                                            <Textarea
                                                id="descripcion-inc"
                                                value={incidente.descripcion}
                                                onChange={(e) => setIncidente({
                                                    ...incidente,
                                                    descripcion: e.target.value
                                                })}
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="involucrados">Involucrados</Label>
                                            <Input
                                                id="involucrados"
                                                placeholder="Nombres o DNIs"
                                                value={incidente.involucrados}
                                                onChange={(e) => setIncidente({
                                                    ...incidente,
                                                    involucrados: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIncidenteDialog(false)}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-1">
                                                Reportar
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Diálogo Control de Accesos */}
                            <Dialog open={accesoDialog} onOpenChange={setAccesoDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start" variant="secondary">
                                        Control de accesos
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registrar Acceso</DialogTitle>
                                        <DialogDescription>Registre el ingreso de personal o
                                            visitantes</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarAcceso} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="persona-acc">Nombre *</Label>
                                                <Input
                                                    id="persona-acc"
                                                    value={acceso.persona}
                                                    onChange={(e) => setAcceso({...acceso, persona: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dni-acc">DNI *</Label>
                                                <Input
                                                    id="dni-acc"
                                                    value={acceso.dni}
                                                    onChange={(e) => setAcceso({...acceso, dni: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tipo-acc">Tipo de persona *</Label>
                                            <Select value={acceso.tipo}
                                                    onValueChange={(v) => setAcceso({...acceso, tipo: v})}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="personal">Personal</SelectItem>
                                                    <SelectItem value="visitante">Visitante</SelectItem>
                                                    <SelectItem value="proveedor">Proveedor</SelectItem>
                                                    <SelectItem value="autoridad">Autoridad</SelectItem>
                                                    <SelectItem value="abogado">Abogado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="area-acc">Área de acceso *</Label>
                                            <Input
                                                id="area-acc"
                                                placeholder="Pabellón o área"
                                                value={acceso.area}
                                                onChange={(e) => setAcceso({...acceso, area: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="motivo-acc">Motivo *</Label>
                                            <Textarea
                                                id="motivo-acc"
                                                value={acceso.motivo}
                                                onChange={(e) => setAcceso({...acceso, motivo: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline"
                                                    onClick={() => setAccesoDialog(false)} className="flex-1">
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-1">
                                                Registrar
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Diálogo Registro de Visitas */}
                            <Dialog open={visitaDialog} onOpenChange={setVisitaDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start" variant="secondary">
                                        Registro de visitas
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registrar Visita</DialogTitle>
                                        <DialogDescription>Complete los datos de la visita</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarVisita} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="visitante-seg">Visitante *</Label>
                                                <Input
                                                    id="visitante-seg"
                                                    value={visita.visitante}
                                                    onChange={(e) => setVisita({...visita, visitante: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dni-vis-seg">DNI *</Label>
                                                <Input
                                                    id="dni-vis-seg"
                                                    value={visita.dniVisitante}
                                                    onChange={(e) => setVisita({
                                                        ...visita,
                                                        dniVisitante: e.target.value
                                                    })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="recluso-vis">Recluso a visitar *</Label>
                                            <Input
                                                id="recluso-vis"
                                                placeholder="Nombre o DNI"
                                                value={visita.recluso}
                                                onChange={(e) => setVisita({...visita, recluso: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="parentesco-seg">Parentesco *</Label>
                                            <Select value={visita.parentesco}
                                                    onValueChange={(v) => setVisita({...visita, parentesco: v})}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="familiar">Familiar directo</SelectItem>
                                                    <SelectItem value="abogado">Abogado</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fecha-vis-seg">Fecha y hora *</Label>
                                            <Input
                                                id="fecha-vis-seg"
                                                type="datetime-local"
                                                value={visita.fecha}
                                                onChange={(e) => setVisita({...visita, fecha: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline"
                                                    onClick={() => setVisitaDialog(false)} className="flex-1">
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-1">
                                                Registrar
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
