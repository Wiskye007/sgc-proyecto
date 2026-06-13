"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {useRouter} from 'next/navigation'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Textarea} from "@/components/ui/textarea"   
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {ArrowLeft, AlertCircle, Calendar, Pill, Plus, Edit2, Printer, FileText, Trash2, Download, Stethoscope} from 'lucide-react'
import {useToast} from "@/hooks/use-toast"  

    const getFormattedDate = (dateString?: string): string => {
        if (!dateString) return new Date().toISOString().split("T")[0];
    const parts = dateString.split("/");
        if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    return new Date().toISOString().split("T")[0];
}

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `https://sgc-backend-vbze.onrender.com/api/medico` : "http://localhost:5000/api/medico";
const CONVICTOS_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `https://sgc-backend-vbze.onrender.com/api/convictos` : "http://localhost:5000/api/convictos";

export default function MedicoPanel() {
    const router = useRouter()
    const {toast} = useToast()

    const [revisionDialog, setRevisionDialog] = useState(false)
    const [tratamientoDialog, setTratamientoDialog] = useState(false)
    const [derivacionDialog, setDerivacionDialog] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingData, setEditingData] = useState<any>(null)

    const [revisionesData, setRevisionesData] = useState<any[]>([])
    const [tratamientosDataState, setTratamientosData] = useState<any[]>([])
    const [derivacionesDataState, setDerivacionesData] = useState<any[]>([])
    const [historialDataState, setHistorialData] = useState<any[]>([])
    const [convictos, setConvictos] = useState<any[]>([])

    const [loading, setLoading] = useState(false)
    const convictoIdToName = (convictoId: number | string): string => {
        const id = Number(convictoId);
        const convicto = convictos.find(c => c.id === id);
        return convicto ? convicto.nombre : 'Desconocido';
    };

    const convictoIdToDni = (convictoId: number | string): string => {
        const id = Number(convictoId);
        const convicto = convictos.find(c => c.id === id);
        return convicto ? convicto.dni : 'N/A';
    };

    const [revision, setRevision] = useState({
        fecha: "", 
        hora: "",
        prioridad: "",
        convictoId: "",
        diagnostico: "",
        tratamiento: "",
        medico: "",
        proximaRevision: "", 
    })

    const [tratamiento, setTratamiento] = useState({
        convictoId: "",
        medicamento: "",
        dosis: "",
        frecuencia: "",
        duracion: "",
        medico: "",
        fechaInicio: "",
    })

    const [derivacion, setDerivacion] = useState({
        convictoId: "",
        especialidad: "",
        motivo: "",
        urgencia: "",
        institucion: "",
        fecha: "",
    })

        const fetchAll = async () => {
        setLoading(true)
        try {
            const [rRev, rTra, rDer, rHis, rCon] = await Promise.all([
                fetch(`${API_URL}/revisiones`),
                fetch(`${API_URL}/tratamientos`),
                fetch(`${API_URL}/derivaciones`),
                fetch(`${API_URL}/historial`),
                fetch(CONVICTOS_URL)
            ])
            if (rRev.ok) setRevisionesData(await rRev.json())
            if (rTra.ok) setTratamientosData(await rTra.json())
            if (rDer.ok) setDerivacionesData(await rDer.json())
            if (rHis.ok) setHistorialData(await rHis.json())
            if (rCon.ok) setConvictos(await rCon.json())
        } catch (e: any) {
            console.error(e)
            toast({title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive"})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

        const getConvictoLabel = (c: any) => `${c.nombre} (${c.dni})`
        const getPrioridadColor = (prioridad: string) => {
        switch ((prioridad || "").toLowerCase()) {
            case "urgente": return "bg-red-500/10 text-red-400 border-red-500/20"
            case "alta": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
            case "media": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            case "baja": return "bg-green-500/10 text-green-400 border-green-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
        }
    const getEstadoColor = (estado: string) => {
        switch ((estado || "").toLowerCase()) {
            case "pendiente": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            case "realizada": return "bg-green-500/10 text-green-400 border-green-500/20"
            case "rechazada": return "bg-red-500/10 text-red-400 border-red-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
        }

    const handleStartEdit = (type: string, id: number, data: any) => {
        setEditingId(id)
        setEditingData({type, data: {...data}})
        }

        const handleSaveEdit = async () => {
            if (!editingId || !editingData) return
            switch (editingData.type) {
                case "revision": await handleUpdateRevision(editingId); break
                case "tratamiento": await handleUpdateTratamiento(editingId); break
                case "derivacion": await handleUpdateDerivacion(editingId); break
                default: toast({ title: "Error", description: "Tipo desconocido", variant: "destructive" })
            }
            setEditingId(null)
            setEditingData(null)
        }

    // ----------------- CRUD LÓGICA (Oculta para mantener limpieza visual en respuesta, es igual) -----------------
    const handleNuevaRevision = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!revision.convictoId || !revision.diagnostico) {
            toast({title: "Error", description: "Paciente y diagnóstico obligatorios", variant: "destructive"})
            return
        }
        try {
            const payload = {
                fecha: revision.fecha || new Date().toISOString().split("T")[0],
                hora: revision.hora || new Date().toTimeString().split(' ')[0].substring(0, 5),
                prioridad: revision.prioridad,
                convictoId: Number(revision.convictoId),
                diagnostico: revision.diagnostico,
                tratamiento: revision.tratamiento,
                medico: revision.medico || "Usuario actual",
                proximaRevision: revision.proximaRevision || null
            }
            const res = await fetch(`${API_URL}/revisiones`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Revisión registrada"})
                setRevisionDialog(false)
                setRevision({ convictoId: "", diagnostico: "", tratamiento: "", medico: "", prioridad: "", fecha: "", hora: "", proximaRevision: "" })
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({ title: "Error", description: err?.error || "Error al registrar", variant: "destructive" })
            }
            } catch (e) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
    }

    const handleUpdateRevision = async (id: number) => {
        if (!editingData) return
        try {
            const payload = {
                fecha: getFormattedDate(editingData.data.fecha),
                hora: editingData.data.hora,
                prioridad: editingData.data.prioridad,
                convictoId: Number(editingData.data.convictoId),
                diagnostico: editingData.data.diagnostico,
                tratamiento: editingData.data.tratamiento,
                medico: editingData.data.medico,
                proximaRevision: editingData.data.proximaRevision ? getFormattedDate(editingData.data.proximaRevision) : null
            }
            const res = await fetch(`${API_URL}/revisiones/${id}`, {
                method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Revisión actualizada"}); await fetchAll()
            } else {
                toast({title: "Error", description: "No se pudo actualizar", variant: "destructive"})
            }
        } catch (e) { toast({title: "Error", description: "Error de conexión", variant: "destructive"}) }
        }

        const handleRegistrarTratamiento = async (e?: React.FormEvent) => {
            e?.preventDefault()
            if (!tratamiento.convictoId || !tratamiento.medicamento) return toast({title: "Error", description: "Paciente y medicamento obligatorios", variant: "destructive"})
            try {
            const payload = {
                IDConv: Number(tratamiento.convictoId),
                Medicamento: tratamiento.medicamento,
                Dosis: tratamiento.dosis,
                Frecuencia: tratamiento.frecuencia,
                Duracion: tratamiento.duracion,
                Medico: tratamiento.medico || "Usuario actual",
                FechaInicio: tratamiento.fechaInicio || new Date().toISOString().split("T")[0]
            }
            const res = await fetch(`${API_URL}/tratamientos`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Tratamiento registrado"}); setTratamientoDialog(false)
                setTratamiento({ convictoId: "", medicamento: "", dosis: "", frecuencia: "", duracion: "", medico: "", fechaInicio: "" })
                await fetchAll()
            } else { toast({title: "Error", description: "Error al registrar", variant: "destructive"}) }
        } catch (e) { toast({title: "Error", variant: "destructive"}) }
    }

    const handleUpdateTratamiento = async (id: number) => {
        if (!editingData) return
        try {
            const payload = {
                IDConv: Number(editingData.data.convictoId),
                Medicamento: editingData.data.medicamento,
                Dosis: editingData.data.dosis,
                Frecuencia: editingData.data.frecuencia,
                Duracion: editingData.data.duracion,
                Medico: editingData.data.medico,
                FechaInicio: getFormattedDate(editingData.data.fechaInicio)
            }
            const res = await fetch(`${API_URL}/tratamientos/${id}`, {
                method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) { toast({title: "Tratamiento actualizado"}); await fetchAll() } 
            else { toast({title: "Error", description: "No se pudo actualizar", variant: "destructive"}) }
        } catch (e) { toast({title: "Error", variant: "destructive"}) }
        }

    const handleRegistrarDerivacion = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!derivacion.convictoId || !derivacion.especialidad || !derivacion.motivo) return toast({ title: "Error", description: "Faltan datos", variant: "destructive" })
        try {
            const payload = {
                Estado: "pendiente",
                IDConv: Number(derivacion.convictoId),
                Especialidad: derivacion.especialidad,
                Motivo: derivacion.motivo,
                Urgencia: derivacion.urgencia,
                Institucion: derivacion.institucion,
                Fecha: derivacion.fecha || new Date().toISOString().split("T")[0]
            }
            const res = await fetch(`${API_URL}/derivaciones`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Derivación registrada"}); setDerivacionDialog(false)
                setDerivacion({convictoId: "", especialidad: "", motivo: "", urgencia: "", institucion: "", fecha: ""})
                await fetchAll()
            } else { toast({ title: "Error", variant: "destructive" }) }
        } catch (e) { toast({title: "Error", variant: "destructive"}) }
    }

    const handleUpdateDerivacion = async (id: number) => {
        if (!editingData) return
        try {
            const payload = {
                Estado: editingData.data.estado,
                IDConv: Number(editingData.data.convictoId),
                Especialidad: editingData.data.especialidad,
                Motivo: editingData.data.motivo,
                Urgencia: editingData.data.urgencia,
                Institucion: editingData.data.institucion,
                Fecha: getFormattedDate(editingData.data.fecha)
            }
            const res = await fetch(`${API_URL}/derivaciones/${id}`, {
                method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) { toast({title: "Actualizada"}); await fetchAll() } 
            else { toast({title: "Error", variant: "destructive"}) }
        } catch (e) { toast({title: "Error", variant: "destructive"}) }
        }

    const handleDelete = async (type: string, id: number) => {
        try {
            let path = ""
            if (type === "revision") path = `/revisiones/${id}`
            if (type === "tratamiento") path = `/tratamientos/${id}`
            if (type === "derivacion") path = `/derivaciones/${id}`
            if (!path) return
            const res = await fetch(`${API_URL}${path}`, {method: "DELETE"})
            if (res.ok) {
                toast({title: "Eliminado"}); setDeleteConfirm(null); await fetchAll()
            } else { toast({title: "Error", variant: "destructive"}) }
        } catch (e) { toast({title: "Error", variant: "destructive"}) }
        }

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return toast({title: "Nada que exportar", variant: "destructive"});
        const headers = Object.keys(data[0]).join(",")
        const rows = data.map(obj => Object.values(obj).map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","))
        const csv = [headers, ...rows].join("\n")
        const blob = new Blob([csv], {type: "text/csv"})
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url)
        toast({title: "Descargado", description: `${filename}.csv`})
        }

    const handleImprimir = () => window.print()

// ----------------- RENDER VISUAL ESTILIZADO -----------------
    return (
        <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
            <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
                
                {/* --- HEADER DEL PANEL MÉDICO --- */}
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
                                <Stethoscope className="h-7 w-7 text-blue-400" /> Panel Médico
                            </h1>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Revisiones y Tratamientos</p>
                        </div>
                    </div>
                </div>

                {/* --- TARJETAS DE RESUMEN --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden={loading ? "true" : "false"}>
                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-slate-300 uppercase">Revisiones Pendientes</CardTitle>
                            <Calendar className="h-6 w-6 text-blue-400"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-blue-400">{revisionesData.length}</h2>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Esta semana</p>
                        </CardContent>
                    </Card>

                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-slate-300 uppercase">Casos Urgentes</CardTitle>
                            <AlertCircle className="h-6 w-6 text-red-400"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-red-400">{revisionesData.filter(r => (r.prioridad || "").toLowerCase() === "urgente").length}</h2>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Atención inmediata</p>
                        </CardContent>
                    </Card>

                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-slate-300 uppercase">En Tratamiento</CardTitle>
                            <Pill className="h-6 w-6 text-green-400"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-green-400">{tratamientosDataState.length}</h2>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Tratamientos activos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* --- CONTENEDOR PRINCIPAL DE PESTAÑAS --- */}
                <Card className="sgc-card border-0 p-2 md:p-6 shadow-2xl">
                    <Tabs defaultValue="revisiones" className="w-full mt-2">
                        
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-6 bg-[#060a12]/80 border border-slate-800/80 rounded-xl p-1 gap-1">
                            <TabsTrigger value="revisiones" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Revisiones</TabsTrigger>
                            <TabsTrigger value="tratamientos" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Tratamientos</TabsTrigger>
                            <TabsTrigger value="derivaciones" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Derivaciones</TabsTrigger>
                            <TabsTrigger value="historial" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Historial</TabsTrigger>
                        </TabsList>

                        {/* ========================================================================= */}
                        {/* TAB 1: REVISIONES */}
                        {/* ========================================================================= */}
                        <TabsContent value="revisiones" className="space-y-6">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <Dialog open={revisionDialog} onOpenChange={setRevisionDialog}>
                                    <DialogTrigger asChild>
                                        <Button className="sgc-btn-primary h-11 px-5"><Plus className="h-4 w-4 mr-2"/> Nueva Revisión</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold text-white">Nueva Revisión Médica</DialogTitle>
                                            <DialogDescription className="text-slate-400 text-xs">Registre una evaluación para un interno.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleNuevaRevision} className="space-y-4 pt-3">
                                            <div className="space-y-1.5">
                                                <Label className="sgc-label">Paciente *</Label>
                                                <Select value={revision.convictoId} onValueChange={(v) => setRevision({...revision, convictoId: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar paciente"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                                        {convictos.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" className="sgc-input h-11" value={revision.fecha} onChange={e => setRevision({...revision, fecha: e.target.value})}/></div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Hora</Label><Input type="time" className="sgc-input h-11" value={revision.hora} onChange={e => setRevision({...revision, hora: e.target.value})}/></div>
                                            </div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Diagnóstico *</Label><Input className="sgc-input h-11" value={revision.diagnostico} onChange={e => setRevision({...revision, diagnostico: e.target.value})} required/></div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Tratamiento</Label><Textarea className="sgc-input" value={revision.tratamiento} onChange={e => setRevision({...revision, tratamiento: e.target.value})} rows={3}/></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="sgc-label">Prioridad</Label>
                                                    <Select value={revision.prioridad} onValueChange={v => setRevision({...revision, prioridad: v})}>
                                                        <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                        <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                            <SelectItem value="baja" className="focus:bg-blue-600 focus:text-white">Baja</SelectItem>
                                                            <SelectItem value="media" className="focus:bg-blue-600 focus:text-white">Media</SelectItem>
                                                            <SelectItem value="alta" className="focus:bg-blue-600 focus:text-white">Alta</SelectItem>
                                                            <SelectItem value="urgente" className="focus:bg-blue-600 focus:text-white">Urgente</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Próxima revisión</Label><Input type="date" className="sgc-input h-11" value={revision.proximaRevision} onChange={e => setRevision({...revision, proximaRevision: e.target.value})}/></div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" onClick={() => setRevisionDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={() => exportToCSV(revisionesData, "revisiones")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#060a12]/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-bold text-blue-400">ID</TableHead>
                                            <TableHead className="text-slate-300">Fecha</TableHead>
                                            <TableHead className="text-slate-300">Hora</TableHead>
                                            <TableHead className="text-slate-300">Prioridad</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-slate-300">DNI</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Diagnóstico</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Tratamiento</TableHead>
                                            <TableHead className="text-center text-slate-300">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {revisionesData.map((rev) => (
                                            <TableRow key={rev.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-blue-400">R-{rev.id}</TableCell>
                                                <TableCell className="text-slate-300">{rev.fecha}</TableCell>
                                                <TableCell className="text-slate-300">{rev.hora}</TableCell>
                                                <TableCell><Badge variant="outline" className={getPrioridadColor(rev.prioridad)}>{(rev.prioridad || "").toString().toUpperCase()}</Badge></TableCell>
                                                <TableCell className="font-medium text-white">{rev.nombre ?? convictoIdToName(rev.convictoId)}</TableCell>
                                                <TableCell className="text-slate-400 font-mono">{convictoIdToDni(rev.convictoId)}</TableCell>
                                                <TableCell className="text-slate-300">{rev.diagnostico}</TableCell>
                                                <TableCell className="text-slate-300">{rev.tratamiento}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("revision", rev.id, rev)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "revision", id: rev.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ========================================================================= */}
                        {/* TAB 2: TRATAMIENTOS */}
                        {/* ========================================================================= */}
                        <TabsContent value="tratamientos" className="space-y-6">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <Dialog open={tratamientoDialog} onOpenChange={setTratamientoDialog}>
                                    <DialogTrigger asChild>
                                        <Button className="sgc-btn-primary h-11 px-5"><Plus className="h-4 w-4 mr-2"/> Nuevo Tratamiento</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold text-white">Registrar Tratamiento</DialogTitle>
                                            <DialogDescription className="text-slate-400 text-xs">Asigne medicamentos y dosis a un interno.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleRegistrarTratamiento} className="space-y-4 pt-3">
                                            <div className="space-y-1.5">
                                                <Label className="sgc-label">Paciente *</Label>
                                                <Select value={tratamiento.convictoId} onValueChange={(v) => setTratamiento({...tratamiento, convictoId: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar paciente"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                                        {convictos.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><Label className="sgc-label">Medicamento *</Label><Input className="sgc-input h-11" value={tratamiento.medicamento} onChange={(e) => setTratamiento({...tratamiento, medicamento: e.target.value})} required/></div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Dosis *</Label><Input className="sgc-input h-11" value={tratamiento.dosis} onChange={(e) => setTratamiento({...tratamiento, dosis: e.target.value})} required/></div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Frecuencia *</Label><Input className="sgc-input h-11" value={tratamiento.frecuencia} onChange={(e) => setTratamiento({...tratamiento, frecuencia: e.target.value})} required/></div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Duración *</Label><Input className="sgc-input h-11" value={tratamiento.duracion} onChange={(e) => setTratamiento({...tratamiento, duracion: e.target.value})} required/></div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Fecha inicio</Label><Input type="date" className="sgc-input h-11" value={tratamiento.fechaInicio} onChange={(e) => setTratamiento({...tratamiento, fechaInicio: e.target.value})}/></div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" onClick={() => setTratamientoDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={() => exportToCSV(tratamientosDataState, "tratamientos")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#060a12]/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-bold text-blue-400">ID</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-slate-300">DNI</TableHead>
                                            <TableHead className="text-slate-300">Medicamento</TableHead>
                                            <TableHead className="text-slate-300">Dosis</TableHead>
                                            <TableHead className="text-slate-300">Frecuencia</TableHead>
                                            <TableHead className="text-slate-300">Duración</TableHead>
                                            <TableHead className="text-center text-slate-300">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tratamientosDataState.map(tr => (
                                            <TableRow key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-blue-400">T-{tr.id}</TableCell>
                                                <TableCell className="font-medium text-white">{tr.nombre ?? convictoIdToName(tr.convictoId)}</TableCell>
                                                <TableCell className="text-slate-400 font-mono">{convictoIdToDni(tr.convictoId)}</TableCell>
                                                <TableCell className="text-slate-300">{tr.medicamento}</TableCell>
                                                <TableCell className="text-slate-300">{tr.dosis}</TableCell>
                                                <TableCell className="text-slate-300">{tr.frecuencia}</TableCell>
                                                <TableCell className="text-slate-300">{tr.duracion}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("tratamiento", tr.id, tr)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "tratamiento", id: tr.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ========================================================================= */}
                        {/* TAB 3: DERIVACIONES */}
                        {/* ========================================================================= */}
                        <TabsContent value="derivaciones" className="space-y-6">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <Dialog open={derivacionDialog} onOpenChange={setDerivacionDialog}>
                                    <DialogTrigger asChild>
                                        <Button className="sgc-btn-primary h-11 px-5"><Plus className="h-4 w-4 mr-2"/> Nueva Derivación</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold text-white">Registrar Derivación</DialogTitle>
                                            <DialogDescription className="text-slate-400 text-xs">Derive a un paciente a un centro de salud externo.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleRegistrarDerivacion} className="space-y-4 pt-3">
                                            <div className="space-y-1.5">
                                                <Label className="sgc-label">Paciente *</Label>
                                                <Select value={derivacion.convictoId} onValueChange={(v) => setDerivacion({...derivacion, convictoId: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar paciente"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                                        {convictos.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="sgc-label">Especialidad *</Label>
                                                <Select value={derivacion.especialidad} onValueChange={v => setDerivacion({...derivacion, especialidad: v})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="Cardiología" className="focus:bg-blue-600 focus:text-white">Cardiología</SelectItem>
                                                        <SelectItem value="Traumatología" className="focus:bg-blue-600 focus:text-white">Traumatología</SelectItem>
                                                        <SelectItem value="Psiquiatría" className="focus:bg-blue-600 focus:text-white">Psiquiatría</SelectItem>
                                                        <SelectItem value="Odontología" className="focus:bg-blue-600 focus:text-white">Odontología</SelectItem>
                                                        <SelectItem value="Otra" className="focus:bg-blue-600 focus:text-white">Otra</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Motivo *</Label><Textarea className="sgc-input" value={derivacion.motivo} onChange={e => setDerivacion({...derivacion, motivo: e.target.value})} rows={3} required/></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="sgc-label">Urgencia</Label>
                                                    <Select value={derivacion.urgencia} onValueChange={v => setDerivacion({...derivacion, urgencia: v})}>
                                                        <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                        <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                            <SelectItem value="normal" className="focus:bg-blue-600 focus:text-white">Normal</SelectItem>
                                                            <SelectItem value="preferente" className="focus:bg-blue-600 focus:text-white">Preferente</SelectItem>
                                                            <SelectItem value="urgente" className="focus:bg-blue-600 focus:text-white">Urgente</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" className="sgc-input h-11" value={derivacion.fecha} onChange={e => setDerivacion({...derivacion, fecha: e.target.value})}/></div>
                                            </div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Institución Externa</Label><Input className="sgc-input h-11" value={derivacion.institucion} onChange={e => setDerivacion({...derivacion, institucion: e.target.value})}/></div>
                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" onClick={() => setDerivacionDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={() => exportToCSV(derivacionesDataState, "derivaciones")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#060a12]/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-bold text-blue-400">ID</TableHead>
                                            <TableHead className="text-slate-300">Estado</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-slate-300">Especialidad</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Motivo</TableHead>
                                            <TableHead className="text-slate-300">Institución</TableHead>
                                            <TableHead className="text-center text-slate-300">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {derivacionesDataState.map(d => (
                                            <TableRow key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-blue-400">D-{d.id}</TableCell>
                                                <TableCell><Badge variant="outline" className={getEstadoColor(d.estado)}>{(d.estado || "").toUpperCase()}</Badge></TableCell>
                                                <TableCell className="font-medium text-white">{d.nombre ?? convictoIdToName(d.convictoId)}</TableCell>
                                                <TableCell className="text-slate-300">{d.especialidad}</TableCell>
                                                <TableCell className="text-slate-300">{d.motivo}</TableCell>
                                                <TableCell className="text-slate-300">{d.institucion}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("derivacion", d.id, d)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "derivacion", id: d.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-white transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ========================================================================= */}
                        {/* TAB 4: HISTORIAL */}
                        {/* ========================================================================= */}
                        <TabsContent value="historial" className="space-y-6">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={() => exportToCSV(historialDataState, "historial")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                <Button className="sgc-btn-secondary h-11 px-5" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#060a12]/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-bold text-blue-400">ID</TableHead>
                                            <TableHead className="text-slate-300">Fecha</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-slate-300">DNI</TableHead>
                                            <TableHead className="text-slate-300">Tipo</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Diagnóstico</TableHead>
                                            <TableHead className="text-slate-300 min-w-[200px]">Observaciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historialDataState.map(h => (
                                            <TableRow key={h.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-blue-400">H-{h.id}</TableCell>
                                                <TableCell className="text-slate-300">{h.fecha}</TableCell>
                                                <TableCell className="font-medium text-white">{h.nombre ?? convictoIdToName(h.convictoId)}</TableCell>
                                                <TableCell className="text-slate-400 font-mono">{convictoIdToDni(h.convictoId)}</TableCell>
                                                <TableCell><Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">{h.tipo}</Badge></TableCell>
                                                <TableCell className="text-slate-300">{h.diagnostico}</TableCell>
                                                <TableCell className="text-slate-400 max-w-[250px] truncate">{h.observaciones}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                    </Tabs>
                </Card>

                {/* --- DIALOG DE EDICIÓN GENÉRICO (Se recicla para los 3 tipos) --- */}
                {editingId && editingData && (
                    <Dialog open={true} onOpenChange={(open) => { if (!open) { setEditingId(null); setEditingData(null) } }}>
                        <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-white uppercase tracking-wider">
                                    Editar {editingData.type} {editingData.type.charAt(0).toUpperCase()}-{editingId}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-3">
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Paciente *</Label>
                                    <Select value={String(editingData.data.convictoId)} onValueChange={(v) => setEditingData({...editingData, data: {...editingData.data, convictoId: v}})}>
                                        <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar paciente"/></SelectTrigger>
                                        <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                            {convictos.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Campos específicos según tipo de edición */}
                                {editingData.type === "revision" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" className="sgc-input h-11" value={getFormattedDate(editingData.data.fecha)} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, fecha: e.target.value}})}/></div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Hora</Label><Input type="time" className="sgc-input h-11" value={editingData.data.hora} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, hora: e.target.value}})}/></div>
                                        </div>
                                        <div className="space-y-1.5"><Label className="sgc-label">Diagnóstico</Label><Input className="sgc-input h-11" value={editingData.data.diagnostico} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, diagnostico: e.target.value}})}/></div>
                                        <div className="space-y-1.5"><Label className="sgc-label">Tratamiento</Label><Textarea className="sgc-input" value={editingData.data.tratamiento} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, tratamiento: e.target.value}})} rows={3}/></div>
                                    </>
                                )}

                                {editingData.type === "tratamiento" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><Label className="sgc-label">Medicamento</Label><Input className="sgc-input h-11" value={editingData.data.medicamento} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, medicamento: e.target.value}})}/></div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Dosis</Label><Input className="sgc-input h-11" value={editingData.data.dosis} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, dosis: e.target.value}})}/></div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Frecuencia</Label><Input className="sgc-input h-11" value={editingData.data.frecuencia} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, frecuencia: e.target.value}})}/></div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Duración</Label><Input className="sgc-input h-11" value={editingData.data.duracion} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, duracion: e.target.value}})}/></div>
                                        </div>
                                    </>
                                )}

                                {editingData.type === "derivacion" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="sgc-label">Estado</Label>
                                                <Select value={editingData.data.estado} onValueChange={(v) => setEditingData({...editingData, data: {...editingData.data, estado: v}})}>
                                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Estado"/></SelectTrigger>
                                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                        <SelectItem value="pendiente" className="focus:bg-blue-600 focus:text-white">Pendiente</SelectItem>
                                                        <SelectItem value="realizada" className="focus:bg-blue-600 focus:text-white">Realizada</SelectItem>
                                                        <SelectItem value="rechazada" className="focus:bg-blue-600 focus:text-white">Rechazada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Especialidad</Label><Input className="sgc-input h-11" value={editingData.data.especialidad} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, especialidad: e.target.value}})}/></div>
                                        </div>
                                        <div className="space-y-1.5"><Label className="sgc-label">Institución Externa</Label><Input className="sgc-input h-11" value={editingData.data.institucion} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, institucion: e.target.value}})}/></div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                    <Button variant="outline" className="sgc-btn-secondary flex-1 h-11" onClick={() => { setEditingId(null); setEditingData(null) }}>Cancelar</Button>
                                    <Button className="sgc-btn-primary flex-1 h-11" onClick={handleSaveEdit}>Guardar Cambios</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* --- DIALOG DE ELIMINAR (ALERT) --- */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <AlertDialogContent className="sgc-card border-red-500/30 text-slate-100 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2"><AlertCircle className="text-red-400 h-6 w-6"/> Eliminar Registro</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">¿Está seguro de que desea eliminar este registro médico de la base de datos? Esta acción es irreversible y quedará en los logs de seguridad.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 mt-4">
                            <AlertDialogCancel className="sgc-btn-secondary flex-1 border-slate-700 m-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="flex-1 bg-red-600 text-white hover:bg-red-700 m-0 border-0 shadow-lg shadow-red-900/20" onClick={() => deleteConfirm && handleDelete(deleteConfirm.type, deleteConfirm.id)}>Eliminar Permanentemente</AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </div>
    )
}