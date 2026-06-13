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
import {ArrowLeft, AlertTriangle, CheckCircle, Clock, Shield, MoveRight, AlertOctagon, KeyRound, Users} from "lucide-react"
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
        if (porcentaje >= 90) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
        if (porcentaje >= 75) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
        return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
    }

    const getBadgeStyle = (ocupacion: number, capacidad: number) => {
        const porcentaje = (ocupacion / capacidad) * 100
        if (porcentaje >= 90) return "bg-red-500/20 text-red-400 border-red-500/30"
        if (porcentaje >= 75) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        return "bg-green-500/20 text-green-400 border-green-500/30"
    }

    const getPrioridadIcon = (prioridad: string) => {
        switch (prioridad) {
            case "alta":
                return <AlertTriangle className="h-5 w-5 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]"/>
            case "media":
                return <Clock className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"/>
            default:
                return <CheckCircle className="h-5 w-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]"/>
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
                reportadoPor: "Usuario actual",
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
        <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
            <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
                
                {/* --- HEADER DEL PANEL DE SEGURIDAD --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-5">
                        <Button 
                            aria-label="Volver al menú principal" 
                            className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-wide text-white flex items-center gap-3">
                                <Shield className="h-7 w-7 text-blue-400" /> Panel de Seguridad
                            </h1>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Control Táctico de Pabellones y Accesos</p>
                        </div>
                    </div>
                </div>

                {/* --- GRID DE PABELLONES --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    {pabellones.map((pabellon) => {
                        const porcentaje = Math.round((pabellon.ocupacion / pabellon.capacidad) * 100)
                        return (
                            <Card key={pabellon.id} className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                                <CardHeader className="pb-3 border-b border-slate-800/50">
                                    <CardTitle className="text-xl text-white">{pabellon.nombre}</CardTitle>
                                    <CardDescription className="text-slate-400 font-mono text-xs uppercase tracking-wider">Nivel: {pabellon.nivel}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">Ocupación</span>
                                            <span className="font-bold text-white text-lg">
                                                {pabellon.ocupacion} <span className="text-slate-500 text-sm">/ {pabellon.capacidad}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#060a12] rounded-full h-2.5 border border-slate-800/80 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${getOcupacionColor(pabellon.ocupacion, pabellon.capacidad)}`}
                                                style={{width: `${porcentaje}%`}}
                                            />
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={getBadgeStyle(pabellon.ocupacion, pabellon.capacidad)}>
                                                {porcentaje}% ocupado
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* --- ALERTAS E INCIDENTES --- */}
                    <Card className="sgc-card border-0 shadow-2xl">
                        <CardHeader className="border-b border-slate-800/60 pb-4">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-400"/> Alertas e Incidentes Recientes
                            </CardTitle>
                            <CardDescription className="text-slate-400">Registro de las últimas 24 horas</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {incidentes.map((incidente) => (
                                    <div
                                        key={incidente.id}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-[#060a12]/60 border border-slate-800/80 shadow-inner hover:border-slate-700 transition-colors"
                                    >
                                        <div className="mt-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                            {getPrioridadIcon(incidente.prioridad)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-sm text-slate-200 uppercase tracking-wide">{incidente.tipo}</span>
                                                <span className="text-xs font-mono text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{incidente.hora}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 leading-snug">{incidente.descripcion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* --- ACCIONES RÁPIDAS --- */}
                    <Card className="sgc-card border-0 shadow-2xl flex flex-col">
                        <CardHeader className="border-b border-slate-800/60 pb-4">
                            <CardTitle className="text-xl text-white">Terminal de Acciones Rápidas</CardTitle>
                            <CardDescription className="text-slate-400">Gestión táctica de seguridad</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 flex flex-col justify-center gap-4">
                            
                            {/* Dialog: Movimiento */}
                            <Dialog open={movimientoDialog} onOpenChange={setMovimientoDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start h-14 bg-[#060a12]/80 border border-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-slate-300 group shadow-inner text-base">
                                        <MoveRight className="mr-3 h-5 w-5 text-blue-400 group-hover:text-white transition-colors" /> Registrar movimiento de recluso
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-xl">
                                    <DialogHeader className="border-b border-slate-800/80 pb-4">
                                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2"><MoveRight className="text-blue-400 h-5 w-5"/> Registrar Movimiento</DialogTitle>
                                        <DialogDescription className="text-slate-400 text-xs">Complete los datos del traslado del interno.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarMovimiento} className="space-y-4 pt-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="recluso" className="sgc-label">Recluso *</Label>
                                            <Input id="recluso" className="sgc-input h-11" placeholder="Nombre o DNI" value={movimiento.recluso} onChange={(e) => setMovimiento({...movimiento, recluso: e.target.value})} required/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="origen-seg" className="sgc-label">Origen *</Label>
                                                <Input id="origen-seg" className="sgc-input h-11" placeholder="Pabellón/Celda" value={movimiento.origen} onChange={(e) => setMovimiento({...movimiento, origen: e.target.value})} required/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="destino-seg" className="sgc-label">Destino *</Label>
                                                <Input id="destino-seg" className="sgc-input h-11" placeholder="Pabellón/Celda" value={movimiento.destino} onChange={(e) => setMovimiento({...movimiento, destino: e.target.value})} required/>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="motivo-seg" className="sgc-label">Motivo *</Label>
                                            <Textarea id="motivo-seg" className="sgc-input" rows={3} value={movimiento.motivo} onChange={(e) => setMovimiento({...movimiento, motivo: e.target.value})} required/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="escolta" className="sgc-label">Personal de escolta *</Label>
                                            <Input id="escolta" className="sgc-input h-11" placeholder="Nombre del oficial" value={movimiento.escolta} onChange={(e) => setMovimiento({...movimiento, escolta: e.target.value})} required/>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                            <Button type="button" onClick={() => setMovimientoDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                            <Button type="submit" className="sgc-btn-primary flex-1 h-11">Autorizar Traslado</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Dialog: Incidente */}
                            <Dialog open={incidenteDialog} onOpenChange={setIncidenteDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start h-14 bg-[#060a12]/80 border border-slate-800 hover:bg-red-600 hover:border-red-500 hover:text-white transition-all text-slate-300 group shadow-inner text-base">
                                        <AlertOctagon className="mr-3 h-5 w-5 text-red-400 group-hover:text-white transition-colors" /> Reportar incidente
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sgc-card border-red-900/50 text-slate-100 sm:max-w-xl">
                                    <DialogHeader className="border-b border-slate-800/80 pb-4">
                                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2"><AlertOctagon className="text-red-400 h-5 w-5"/> Reportar Incidente de Seguridad</DialogTitle>
                                        <DialogDescription className="text-slate-400 text-xs">Registre los detalles para notificar a la guardia.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleReportarIncidente} className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="tipo-inc" className="sgc-label">Tipo de incidente *</Label>
                                                <Select value={incidente.tipo} onValueChange={(v) => setIncidente({...incidente, tipo: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="altercado" className="focus:bg-blue-600 focus:text-white">Altercado</SelectItem>
                                                        <SelectItem value="fuga" className="focus:bg-blue-600 focus:text-white">Intento de fuga</SelectItem>
                                                        <SelectItem value="contrabando" className="focus:bg-blue-600 focus:text-white">Contrabando</SelectItem>
                                                        <SelectItem value="agresion" className="focus:bg-blue-600 focus:text-white">Agresión</SelectItem>
                                                        <SelectItem value="otro" className="focus:bg-blue-600 focus:text-white">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="gravedad" className="sgc-label">Gravedad *</Label>
                                                <Select value={incidente.gravedad} onValueChange={(v) => setIncidente({...incidente, gravedad: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="baja" className="focus:bg-blue-600 focus:text-white">Baja</SelectItem>
                                                        <SelectItem value="media" className="focus:bg-blue-600 focus:text-white">Media</SelectItem>
                                                        <SelectItem value="alta" className="focus:bg-blue-600 focus:text-white">Alta</SelectItem>
                                                        <SelectItem value="critica" className="focus:bg-blue-600 focus:text-white">Crítica</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="ubicacion-inc" className="sgc-label">Ubicación exacta *</Label>
                                            <Input id="ubicacion-inc" className="sgc-input h-11" placeholder="Pabellón, celda o área" value={incidente.ubicacion} onChange={(e) => setIncidente({...incidente, ubicacion: e.target.value})} required/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="descripcion-inc" className="sgc-label">Descripción de los hechos *</Label>
                                            <Textarea id="descripcion-inc" className="sgc-input" value={incidente.descripcion} onChange={(e) => setIncidente({...incidente, descripcion: e.target.value})} rows={4} required/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="involucrados" className="sgc-label">Internos Involucrados</Label>
                                            <Input id="involucrados" className="sgc-input h-11" placeholder="Nombres o DNIs separados por comas" value={incidente.involucrados} onChange={(e) => setIncidente({...incidente, involucrados: e.target.value})}/>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                            <Button type="button" onClick={() => setIncidenteDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-11 shadow-lg shadow-red-900/40 border-0">Emitir Alerta</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Dialog: Accesos */}
                            <Dialog open={accesoDialog} onOpenChange={setAccesoDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start h-14 bg-[#060a12]/80 border border-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-slate-300 group shadow-inner text-base">
                                        <KeyRound className="mr-3 h-5 w-5 text-blue-400 group-hover:text-white transition-colors" /> Control de accesos
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-xl">
                                    <DialogHeader className="border-b border-slate-800/80 pb-4">
                                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2"><KeyRound className="text-blue-400 h-5 w-5"/> Registrar Acceso a Instalaciones</DialogTitle>
                                        <DialogDescription className="text-slate-400 text-xs">Registre el ingreso de personal autorizado o externos.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarAcceso} className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="persona-acc" className="sgc-label">Nombre Completo *</Label>
                                                <Input id="persona-acc" className="sgc-input h-11" value={acceso.persona} onChange={(e) => setAcceso({...acceso, persona: e.target.value})} required/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="dni-acc" className="sgc-label">DNI / ID *</Label>
                                                <Input id="dni-acc" className="sgc-input h-11 font-mono" value={acceso.dni} onChange={(e) => setAcceso({...acceso, dni: e.target.value})} required/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="tipo-acc" className="sgc-label">Clasificación *</Label>
                                                <Select value={acceso.tipo} onValueChange={(v) => setAcceso({...acceso, tipo: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="personal" className="focus:bg-blue-600 focus:text-white">Personal Interno</SelectItem>
                                                        <SelectItem value="visitante" className="focus:bg-blue-600 focus:text-white">Visitante</SelectItem>
                                                        <SelectItem value="proveedor" className="focus:bg-blue-600 focus:text-white">Proveedor</SelectItem>
                                                        <SelectItem value="autoridad" className="focus:bg-blue-600 focus:text-white">Autoridad / Perito</SelectItem>
                                                        <SelectItem value="abogado" className="focus:bg-blue-600 focus:text-white">Defensa Legal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="area-acc" className="sgc-label">Área de Destino *</Label>
                                                <Input id="area-acc" className="sgc-input h-11" placeholder="Pabellón u oficina" value={acceso.area} onChange={(e) => setAcceso({...acceso, area: e.target.value})} required/>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="motivo-acc" className="sgc-label">Motivo de Ingreso *</Label>
                                            <Textarea id="motivo-acc" className="sgc-input" rows={2} value={acceso.motivo} onChange={(e) => setAcceso({...acceso, motivo: e.target.value})} required/>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                            <Button type="button" onClick={() => setAccesoDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                            <Button type="submit" className="sgc-btn-primary flex-1 h-11">Autorizar Acceso</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Dialog: Visitas */}
                            <Dialog open={visitaDialog} onOpenChange={setVisitaDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full justify-start h-14 bg-[#060a12]/80 border border-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-slate-300 group shadow-inner text-base">
                                        <Users className="mr-3 h-5 w-5 text-blue-400 group-hover:text-white transition-colors" /> Registro de visitas
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-xl">
                                    <DialogHeader className="border-b border-slate-800/80 pb-4">
                                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2"><Users className="text-blue-400 h-5 w-5"/> Programar Visita a Interno</DialogTitle>
                                        <DialogDescription className="text-slate-400 text-xs">Verifique la relación y registre la fecha de encuentro.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleRegistrarVisita} className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="visitante-seg" className="sgc-label">Nombre del Visitante *</Label>
                                                <Input id="visitante-seg" className="sgc-input h-11" value={visita.visitante} onChange={(e) => setVisita({...visita, visitante: e.target.value})} required/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="dni-vis-seg" className="sgc-label">DNI del Visitante *</Label>
                                                <Input id="dni-vis-seg" className="sgc-input h-11 font-mono" value={visita.dniVisitante} onChange={(e) => setVisita({...visita, dniVisitante: e.target.value})} required/>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="recluso-vis" className="sgc-label">Interno a Visitar *</Label>
                                            <Input id="recluso-vis" className="sgc-input h-11" placeholder="Nombre o ID del recluso" value={visita.recluso} onChange={(e) => setVisita({...visita, recluso: e.target.value})} required/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="parentesco-seg" className="sgc-label">Parentesco/Relación *</Label>
                                                <Select value={visita.parentesco} onValueChange={(v) => setVisita({...visita, parentesco: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="familiar" className="focus:bg-blue-600 focus:text-white">Familiar directo</SelectItem>
                                                        <SelectItem value="conyuge" className="focus:bg-blue-600 focus:text-white">Cónyuge</SelectItem>
                                                        <SelectItem value="abogado" className="focus:bg-blue-600 focus:text-white">Defensa Legal</SelectItem>
                                                        <SelectItem value="otro" className="focus:bg-blue-600 focus:text-white">Otro vínculo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="fecha-vis-seg" className="sgc-label">Fecha y hora de visita *</Label>
                                                <Input id="fecha-vis-seg" type="datetime-local" className="sgc-input h-11" value={visita.fecha} onChange={(e) => setVisita({...visita, fecha: e.target.value})} required/>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                            <Button type="button" onClick={() => setVisitaDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                            <Button type="submit" className="sgc-btn-primary flex-1 h-11">Programar Visita</Button>
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