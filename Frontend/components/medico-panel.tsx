"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {useRouter} from 'next/navigation'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
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
import {ArrowLeft, AlertCircle, Calendar, Pill, Plus, Edit2, Printer, Trash2, Download, Stethoscope, Search} from 'lucide-react'
import {useToast} from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth"  

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

    const [searchTerm, setSearchTerm] = useState("")
    const [prioridadFilter, setPrioridadFilter] = useState("todos")
    const [estadoDerivacionFilter, setEstadoDerivacionFilter] = useState("todos")

    const [revisionDialog, setRevisionDialog] = useState(false)
    const [tratamientoDialog, setTratamientoDialog] = useState(false)
    const [derivacionDialog, setDerivacionDialog] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingData, setEditingData] = useState<any>(null)

    // --- ESTADO PARA EL BUSCADOR DE PACIENTES ---
    const [busquedaPaciente, setBusquedaPaciente] = useState("")

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

    // --- LÓGICA DE FILTRADO DE PACIENTES ---
    const convictosFiltrados = convictos.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())) ||
        (c.dni && c.dni.includes(busquedaPaciente)) ||
        (c.id && c.id.toString() === busquedaPaciente)
    );

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
                authFetch(`${API_URL}/revisiones`),
                authFetch(`${API_URL}/tratamientos`),
                authFetch(`${API_URL}/derivaciones`),
                authFetch(`${API_URL}/historial`),
                authFetch(CONVICTOS_URL)
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
            default: return "bg-slate-500/10 text-foreground border-slate-500/20"
        }
    }

    const getEstadoColor = (estado: string) => {
        switch ((estado || "").toLowerCase()) {
            case "pendiente": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            case "realizada": return "bg-green-500/10 text-green-400 border-green-500/20"
            case "rechazada": return "bg-red-500/10 text-red-400 border-red-500/20"
            default: return "bg-slate-500/10 text-foreground border-slate-500/20"
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
        setBusquedaPaciente("") 
    }

    // ----------------- CRUD LÓGICA -----------------
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
            const res = await authFetch(`${API_URL}/revisiones`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Revisión registrada"})
                setRevisionDialog(false)
                setBusquedaPaciente("")
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
                medico: editingData.data.medico || "Usuario actual",
                proximaRevision: editingData.data.proximaRevision ? getFormattedDate(editingData.data.proximaRevision) : null
            }
            const res = await authFetch(`${API_URL}/revisiones/${id}`, {
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
            const res = await authFetch(`${API_URL}/tratamientos`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Tratamiento registrado"}); 
                setTratamientoDialog(false)
                setBusquedaPaciente("")
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
            const res = await authFetch(`${API_URL}/tratamientos/${id}`, {
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
            const res = await authFetch(`${API_URL}/derivaciones`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Derivación registrada"}); 
                setDerivacionDialog(false)
                setBusquedaPaciente("")
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
            const res = await authFetch(`${API_URL}/derivaciones/${id}`, {
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
            const res = await authFetch(`${API_URL}${path}`, {method: "DELETE"})
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
    
    // --- LÓGICAS DE FILTRADO ---
    const safeLower = (val: any) => (val || "").toString().toLowerCase()

    const filteredRevisiones = revisionesData.filter(r => {
        const matchSearch = safeLower(r.id).includes(searchTerm) || safeLower(r.nombre ?? convictoIdToName(r.convictoId)).includes(searchTerm) || safeLower(r.diagnostico).includes(searchTerm)
        const matchPrior = prioridadFilter === "todos" || safeLower(r.prioridad) === prioridadFilter
        return matchSearch && matchPrior
    })

    const filteredTratamientos = tratamientosDataState.filter(t => 
        safeLower(t.id).includes(searchTerm) || safeLower(t.nombre ?? convictoIdToName(t.convictoId)).includes(searchTerm) || safeLower(t.medicamento).includes(searchTerm)
    )

    const filteredDerivaciones = derivacionesDataState.filter(d => {
        const matchSearch = safeLower(d.id).includes(searchTerm) || safeLower(d.nombre ?? convictoIdToName(d.convictoId)).includes(searchTerm) || safeLower(d.especialidad).includes(searchTerm)
        const matchEstado = estadoDerivacionFilter === "todos" || safeLower(d.estado) === estadoDerivacionFilter
        return matchSearch && matchEstado
    })

    const filteredHistorial = historialDataState.filter(h => 
        safeLower(h.id).includes(searchTerm) || safeLower(h.nombre ?? convictoIdToName(h.convictoId)).includes(searchTerm) || safeLower(h.diagnostico).includes(searchTerm)
    )

    return (
        <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-foreground">
            <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/80 p-6 rounded-2xl border border-border/80 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-5">
                        <Button 
                            aria-label="Volver al menú principal" 
                            className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-primary hover:border-blue-500 transition-colors group" 
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="h-5 w-5 text-primary group-hover:text-foreground transition-colors" />
                        </Button>
                        <div className="flex items-center gap-4">
                            <Stethoscope className="h-14 w-14 text-green-500 shrink-0" />
                                <div>
                                    <h1 className="text-3xl font-black tracking-wide text-foreground">Panel Médico</h1>
                                    <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1">Gestión de revisiones y tratamientos</p>
                                </div>
                        </div>
                    </div>
                </div>

                {/* --- TARJETAS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden={loading ? "true" : "false"}>
                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-foreground uppercase">Revisiones pendientes</CardTitle>
                            <Calendar className="h-6 w-6 text-primary"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-primary">{revisionesData.length}</h2>
                            <p className="text-xs text-foreground mt-1 uppercase font-semibold tracking-wider">Esta semana</p>
                        </CardContent>
                    </Card>

                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-foreground uppercase">Casos urgentes</CardTitle>
                            <AlertCircle className="h-6 w-6 text-red-400"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-red-400">{revisionesData.filter(r => (r.prioridad || "").toLowerCase() === "urgente").length}</h2>
                            <p className="text-xs text-foreground mt-1 uppercase font-semibold tracking-wider">Atención inmediata</p>
                        </CardContent>
                    </Card>

                    <Card className="sgc-card border-0 hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold tracking-widest text-foreground uppercase">En tratamiento</CardTitle>
                            <Pill className="h-6 w-6 text-green-400"/>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-5xl font-black text-green-400">{tratamientosDataState.length}</h2>
                            <p className="text-xs text-foreground mt-1 uppercase font-semibold tracking-wider">Tratamientos activos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* --- PESTAÑAS CON TIP DE UX (onValueChange) --- */}
                <Tabs defaultValue="revisiones" className="w-full mt-2" onValueChange={() => { setSearchTerm(""); setPrioridadFilter("todos"); setEstadoDerivacionFilter("todos"); }}>    
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-6 bg-card/80 border border-border/80 rounded-xl p-1 gap-1">
                            <TabsTrigger value="revisiones" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-foreground data-[state=active]:bg-blue-600 data-[state=active]:text-foreground transition-all">Revisiones</TabsTrigger>
                            <TabsTrigger value="tratamientos" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-foreground data-[state=active]:bg-blue-600 data-[state=active]:text-foreground transition-all">Tratamientos</TabsTrigger>
                            <TabsTrigger value="derivaciones" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-foreground data-[state=active]:bg-blue-600 data-[state=active]:text-foreground transition-all">Derivaciones</TabsTrigger>
                            <TabsTrigger value="historial" className="rounded-lg py-2.5 text-sm font-semibold tracking-wide text-foreground data-[state=active]:bg-blue-600 data-[state=active]:text-foreground transition-all">Historial</TabsTrigger>
                        </TabsList>

                        {/* ======================= REVISIONES ======================= */}
                        <TabsContent value="revisiones" className="space-y-6">
                            <Card className="sgc-card border-0 mb-4">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/50">
                                    <CardTitle className="text-xl text-foreground font-bold tracking-wide">Directorio de Revisiones</CardTitle>
                                    <Badge variant="secondary" className={`text-[16px] px-3 py-1 mt-2 md:mt-0 ${filteredRevisiones.length > 50 ? "border-red-500 text-red-400 bg-red-500/10" : "border-green-500 text-green-400 bg-green-500/10"}`}>
                                        Registros totales: {filteredRevisiones.length}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="relative md:w-1/3 h-10!">
                                            <Search className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"/>
                                            <Input aria-label="Búsqueda" placeholder="Buscar por ID, Paciente o Diagnóstico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="sgc-input pl-10!"/>
                                        </div>
                                        <div className="md:w-auto flex flex-col lg:flex-row gap-4 items-end w-full">
                                            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                                                <SelectTrigger className="sgc-input h-10! w-full md:w-[200px]"><SelectValue placeholder="Prioridad"/></SelectTrigger>
                                                <SelectContent className="bg-[#0f172a] border-border text-foreground">
                                                    <SelectItem value="todos" className="focus:bg-blue-600 focus:text-foreground">Todas las prioridades</SelectItem>
                                                    <SelectItem value="urgente" className="focus:bg-blue-600 focus:text-foreground">Urgente</SelectItem>
                                                    <SelectItem value="alta" className="focus:bg-blue-600 focus:text-foreground">Alta</SelectItem>
                                                    <SelectItem value="media" className="focus:bg-blue-600 focus:text-foreground">Media</SelectItem>
                                                    <SelectItem value="baja" className="focus:bg-blue-600 focus:text-foreground">Baja</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        
                                        <Dialog open={revisionDialog} onOpenChange={(open) => { 
                                            setRevisionDialog(open); 
                                            if(!open) {
                                                setBusquedaPaciente("");
                                                setRevision({ convictoId: "", diagnostico: "", tratamiento: "", medico: "", prioridad: "", fecha: "", hora: "", proximaRevision: "" });
                                            } 
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button className="sgc-btn-primary h-10 px-5"><Plus className="h-4 w-4 mr-2"/> Nueva revisión</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sgc-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-bold text-foreground">Nueva revisión médica</DialogTitle>
                                                    <DialogDescription className="text-foreground text-[15px]">Registre una evaluación para un interno.</DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleNuevaRevision} className="space-y-4 pt-3">
                                                    
                                                    {/* FILTRO Y SELECTOR DE PACIENTE */}
                                                    <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-card/50">
                                                        <Label className="sgc-label text-primary font-bold tracking-wider">Selección de paciente *</Label>
                                                        <Input
                                                            placeholder="Buscar por DNI, Nombre o ID..."
                                                            value={busquedaPaciente}
                                                            onChange={(e) => {
                                                                const valor = e.target.value;
                                                                setBusquedaPaciente(valor);
                                                                if (valor.trim() === "") {
                                                                    setRevision({ ...revision, convictoId: "" });
                                                                } else {
                                                                    const filtrados = convictos.filter(c => 
                                                                        (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                                        (c.dni && c.dni.includes(valor)) ||
                                                                        (c.id && c.id.toString() === valor)
                                                                    );
                                                                    if (filtrados.length > 0) {
                                                                        setRevision({ ...revision, convictoId: String(filtrados[0].id) });
                                                                    } else {
                                                                        setRevision({ ...revision, convictoId: "" });
                                                                    }
                                                                }
                                                            }}
                                                            className="sgc-input h-10 border-slate-700 bg-card"
                                                        />
                                                        <Select value={revision.convictoId} onValueChange={(v) => setRevision({...revision, convictoId: v})}>
                                                            <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un paciente de la lista"/></SelectTrigger>
                                                            <SelectContent className="bg-[#111827] border border-border text-foreground max-h-60">
                                                                {convictosFiltrados.length > 0 ? (
                                                                    convictosFiltrados.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-foreground">{getConvictoLabel(c)}</SelectItem>))
                                                                ) : (
                                                                    <div className="p-2 text-sm text-foreground text-center">Sin resultados para "{busquedaPaciente}"</div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" className="sgc-input h-11" value={revision.fecha} onChange={e => setRevision({...revision, fecha: e.target.value})}/></div>
                                                        <div className="space-y-1.5"><Label className="sgc-label">Hora</Label><Input type="time" className="sgc-input h-11" value={revision.hora} onChange={e => setRevision({...revision, hora: e.target.value})}/></div>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5">
                                                        <Label className="sgc-label">Médico Tratante</Label>
                                                        <Input className="sgc-input h-11" placeholder="Ej. Dr. Juan Pérez (Dejar en blanco para usar tu usuario)" value={revision.medico} onChange={e => setRevision({...revision, medico: e.target.value})} />
                                                    </div>

                                                    <div className="space-y-1.5"><Label className="sgc-label">Diagnóstico *</Label><Input className="sgc-input h-11" value={revision.diagnostico} onChange={e => setRevision({...revision, diagnostico: e.target.value})} required/></div>
                                                    <div className="space-y-1.5"><Label className="sgc-label">Tratamiento</Label><Textarea className="sgc-input" value={revision.tratamiento} onChange={e => setRevision({...revision, tratamiento: e.target.value})} rows={3}/></div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="sgc-label">Prioridad</Label>
                                                            <Select value={revision.prioridad} onValueChange={v => setRevision({...revision, prioridad: v})}>
                                                                <SelectTrigger className="sgc-input h-11! w-full"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                                <SelectContent className="bg-[#111827] border border-border text-foreground">
                                                                    <SelectItem value="baja" className="focus:bg-blue-600 focus:text-foreground">Baja</SelectItem>
                                                                    <SelectItem value="media" className="focus:bg-blue-600 focus:text-foreground">Media</SelectItem>
                                                                    <SelectItem value="alta" className="focus:bg-blue-600 focus:text-foreground">Alta</SelectItem>
                                                                    <SelectItem value="urgente" className="focus:bg-blue-600 focus:text-foreground">Urgente</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1.5"><Label className="sgc-label">Próxima revisión</Label><Input type="date" className="sgc-input h-11" value={revision.proximaRevision} onChange={e => setRevision({...revision, proximaRevision: e.target.value})}/></div>
                                                    </div>
                                                    
                                                    <div className="flex gap-3 pt-2">
                                                        <Button type="button" onClick={() => {
                                                            setRevisionDialog(false); 
                                                            setBusquedaPaciente("");
                                                            setRevision({ convictoId: "", diagnostico: "", tratamiento: "", medico: "", prioridad: "", fecha: "", hora: "", proximaRevision: "" });
                                                        }} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                        <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(filteredRevisiones, "revisiones")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-border hover:bg-transparent">
                                            <TableHead className="font-bold text-primary">ID</TableHead>
                                            <TableHead className="text-foreground">Fecha</TableHead>
                                            <TableHead className="text-foreground">Hora</TableHead>
                                            <TableHead className="text-foreground">Prioridad</TableHead>
                                            <TableHead className="text-foreground min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-foreground min-w-[270px]">Diagnóstico</TableHead>
                                            <TableHead className="text-foreground min-w-[200px]">Tratamiento</TableHead>
                                            <TableHead className="text-foreground min-w-[200px]">Médico</TableHead>
                                            <TableHead className="text-center text-foreground">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRevisiones.map((rev) => (
                                            <TableRow key={rev.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-primary">R-{rev.id}</TableCell>
                                                <TableCell className="text-foreground">{rev.fecha}</TableCell>
                                                <TableCell className="text-foreground">{rev.hora}</TableCell>
                                                <TableCell><Badge variant="outline" className={getPrioridadColor(rev.prioridad)}>{(rev.prioridad || "").toString().toUpperCase()}</Badge></TableCell>   
                                                <TableCell className="font-medium text-foreground">{rev.nombre ?? convictoIdToName(rev.convictoId)}</TableCell>  
                                                <TableCell className="text-foreground">{rev.diagnostico}</TableCell>
                                                <TableCell className="text-foreground">{rev.tratamiento}</TableCell>
                                                <TableCell className="text-foreground font-medium">{rev.medico}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-primary hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("revision", rev.id, rev)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-primary group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "revision", id: rev.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ======================= TRATAMIENTOS ======================= */}
                        <TabsContent value="tratamientos" className="space-y-6">
                            <Card className="sgc-card border-0 mb-4">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/50">
                                    <CardTitle className="text-xl text-foreground font-bold tracking-wide">Directorio de Tratamientos</CardTitle>
                                    <Badge variant="secondary" className={`text-[16px] px-3 py-1 mt-2 md:mt-0 ${filteredTratamientos.length > 50 ? "border-red-500 text-red-400 bg-red-500/10" : "border-green-500 text-green-400 bg-green-500/10"}`}>
                                        Registros totales: {filteredTratamientos.length}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-start gap-4">
                                        <div className="relative md:w-1/3 h-10!">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground"/>
                                            <Input aria-label="Búsqueda" placeholder="Buscar por ID, Paciente o Medicamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="sgc-input pl-10!"/>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        
                                        <Dialog open={tratamientoDialog} onOpenChange={(open) => { 
                                            setTratamientoDialog(open); 
                                            if(!open) {
                                                setBusquedaPaciente("");
                                                setTratamiento({ convictoId: "", medicamento: "", dosis: "", frecuencia: "", duracion: "", medico: "", fechaInicio: "" });
                                            } 
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button className="sgc-btn-primary h-10 px-5"><Plus className="h-4 w-4 mr-2"/>Nuevo tratamiento</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sgc-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-bold text-foreground">Registrar tratamiento</DialogTitle>
                                                    <DialogDescription className="text-foreground text-[15px]">Asigne medicamentos y dosis a un interno.</DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleRegistrarTratamiento} className="space-y-4 pt-3">
                                                    
                                                    {/* FILTRO Y SELECTOR DE PACIENTE */}
                                                    <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-card/50">
                                                        <Label className="sgc-label text-primary font-bold tracking-wider">Selección de paciente *</Label>
                                                        <Input
                                                            placeholder="Buscar por DNI, Nombre o ID..."
                                                            value={busquedaPaciente}
                                                            onChange={(e) => {
                                                                const valor = e.target.value;
                                                                setBusquedaPaciente(valor);
                                                                if (valor.trim() === "") {
                                                                    setTratamiento({ ...tratamiento, convictoId: "" });
                                                                } else {
                                                                    const filtrados = convictos.filter(c => 
                                                                        (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                                        (c.dni && c.dni.includes(valor)) ||
                                                                        (c.id && c.id.toString() === valor)
                                                                    );
                                                                    if (filtrados.length > 0) {
                                                                        setTratamiento({ ...tratamiento, convictoId: String(filtrados[0].id) });
                                                                    } else {
                                                                        setTratamiento({ ...tratamiento, convictoId: "" });
                                                                    }
                                                                }
                                                            }}
                                                            className="sgc-input h-10 border-slate-700 bg-card"
                                                        />
                                                        <Select value={tratamiento.convictoId} onValueChange={(v) => setTratamiento({...tratamiento, convictoId: v})}>
                                                            <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un paciente de la lista"/></SelectTrigger>
                                                            <SelectContent className="bg-[#111827] border border-border text-foreground max-h-60">
                                                                {convictosFiltrados.length > 0 ? (
                                                                    convictosFiltrados.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-foreground">{getConvictoLabel(c)}</SelectItem>))
                                                                ) : (
                                                                    <div className="p-2 text-sm text-foreground text-center">Sin resultados para "{busquedaPaciente}"</div>
                                                                )}
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
                                                        <Button type="button" onClick={() => {
                                                            setTratamientoDialog(false); 
                                                            setBusquedaPaciente("");
                                                            setTratamiento({ convictoId: "", medicamento: "", dosis: "", frecuencia: "", duracion: "", medico: "", fechaInicio: "" });
                                                        }} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                        <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(filteredTratamientos, "tratamientos")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-border hover:bg-transparent">
                                            <TableHead className="font-bold text-primary min-w-[60px]">ID</TableHead>
                                            <TableHead className="text-foreground min-w-[250px]">Paciente</TableHead>
                                            <TableHead className="text-foreground min-w-[180px]">Medicamento</TableHead>
                                            <TableHead className="text-foreground min-w-[170px]">Dosis</TableHead>
                                            <TableHead className="text-foreground min-w-[180px]">Frecuencia</TableHead>
                                            <TableHead className="text-foreground min-w-[150px]">Duración</TableHead>
                                            <TableHead className="text-foreground min-w-[120px]">Inicio</TableHead>
                                            <TableHead className="text-center text-foreground">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTratamientos.map(tr => (
                                            <TableRow key={tr.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-primary">T-{tr.id}</TableCell>    
                                                <TableCell className="font-medium text-foreground">{tr.nombre ?? convictoIdToName(tr.convictoId)}</TableCell>    
                                                <TableCell className="text-foreground">{tr.medicamento}</TableCell>
                                                <TableCell className="text-foreground">{tr.dosis}</TableCell>
                                                <TableCell className="text-foreground">{tr.frecuencia}</TableCell>
                                                <TableCell className="text-foreground">{tr.duracion}</TableCell>
                                                <TableCell className="text-foreground">{tr.fechaInicio}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-primary hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("tratamiento", tr.id, tr)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-primary group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "tratamiento", id: tr.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ======================= DERIVACIONES ======================= */}
                        <TabsContent value="derivaciones" className="space-y-6">
                            <Card className="sgc-card border-0 mb-4">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/50">
                                    <CardTitle className="text-xl text-foreground font-bold tracking-wide">Directorio de Derivaciones</CardTitle>
                                    <Badge variant="secondary" className={`text-[16px] px-3 py-1 mt-2 md:mt-0 ${filteredDerivaciones.length > 50 ? "border-red-500 text-red-400 bg-red-500/10" : "border-green-500 text-green-400 bg-green-500/10"}`}>
                                        Registros totales: {filteredDerivaciones.length}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="relative md:w-1/3 h-10!">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground"/>
                                            <Input aria-label="Búsqueda" placeholder="Buscar por ID, Paciente o Especialidad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="sgc-input pl-10!"/>
                                        </div>
                                        <div className="md:w-auto flex flex-col lg:flex-row gap-4 items-end w-full">
                                            <Select value={estadoDerivacionFilter} onValueChange={setEstadoDerivacionFilter}>
                                                <SelectTrigger className="sgc-input h-10! w-full md:w-[200px]"><SelectValue placeholder="Estado"/></SelectTrigger>
                                                <SelectContent className="bg-[#0f172a] border-border text-foreground">
                                                    <SelectItem value="todos" className="focus:bg-blue-600 focus:text-foreground">Todos los estados</SelectItem>
                                                    <SelectItem value="pendiente" className="focus:bg-blue-600 focus:text-foreground">Pendiente</SelectItem>
                                                    <SelectItem value="realizada" className="focus:bg-blue-600 focus:text-foreground">Realizada</SelectItem>
                                                    <SelectItem value="rechazada" className="focus:bg-blue-600 focus:text-foreground">Rechazada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        
                                        <Dialog open={derivacionDialog} onOpenChange={(open) => { 
                                            setDerivacionDialog(open); 
                                            if(!open) {
                                                setBusquedaPaciente("");
                                                setDerivacion({convictoId: "", especialidad: "", motivo: "", urgencia: "", institucion: "", fecha: ""});
                                            } 
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button className="sgc-btn-primary h-10 px-5"><Plus className="h-4 w-4 mr-2"/> Nueva derivación</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sgc-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-bold text-foreground">Registrar derivación</DialogTitle>
                                                    <DialogDescription className="text-foreground text-[15px]">Derive a un paciente a un centro de salud externo.</DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleRegistrarDerivacion} className="space-y-4 pt-3">
                                                    
                                                    {/* FILTRO Y SELECTOR DE PACIENTE */}
                                                    <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-card/50">
                                                        <Label className="sgc-label text-primary font-bold tracking-wider">Selección de paciente *</Label>
                                                        <Input
                                                            placeholder="Buscar por DNI, Nombre o ID..."
                                                            value={busquedaPaciente}
                                                            onChange={(e) => {
                                                                const valor = e.target.value;
                                                                setBusquedaPaciente(valor);
                                                                if (valor.trim() === "") {
                                                                    setDerivacion({ ...derivacion, convictoId: "" });
                                                                } else {
                                                                    const filtrados = convictos.filter(c => 
                                                                        (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                                        (c.dni && c.dni.includes(valor)) ||
                                                                        (c.id && c.id.toString() === valor)
                                                                    );
                                                                    if (filtrados.length > 0) {
                                                                        setDerivacion({ ...derivacion, convictoId: String(filtrados[0].id) });
                                                                    } else {
                                                                        setDerivacion({ ...derivacion, convictoId: "" });
                                                                    }
                                                                }
                                                            }}
                                                            className="sgc-input h-10 border-slate-700 bg-card"
                                                        />
                                                        <Select value={derivacion.convictoId} onValueChange={(v) => setDerivacion({...derivacion, convictoId: v})}>
                                                            <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un paciente de la lista"/></SelectTrigger>
                                                            <SelectContent className="bg-[#111827] border border-border text-foreground max-h-60">
                                                                {convictosFiltrados.length > 0 ? (
                                                                    convictosFiltrados.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-foreground">{getConvictoLabel(c)}</SelectItem>))
                                                                ) : (
                                                                    <div className="p-2 text-sm text-foreground text-center">Sin resultados para "{busquedaPaciente}"</div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="sgc-label">Especialidad *</Label>
                                                        <Select value={derivacion.especialidad} onValueChange={v => setDerivacion({...derivacion, especialidad: v})}>
                                                            <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                            <SelectContent className="bg-[#111827] border border-border text-foreground">
                                                                <SelectItem value="Cardiología" className="focus:bg-blue-600 focus:text-foreground">Cardiología</SelectItem>
                                                                <SelectItem value="Traumatología" className="focus:bg-blue-600 focus:text-foreground">Traumatología</SelectItem>
                                                                <SelectItem value="Psiquiatría" className="focus:bg-blue-600 focus:text-foreground">Psiquiatría</SelectItem>
                                                                <SelectItem value="Odontología" className="focus:bg-blue-600 focus:text-foreground">Odontología</SelectItem>
                                                                <SelectItem value="Otra" className="focus:bg-blue-600 focus:text-foreground">Otra</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5"><Label className="sgc-label">Motivo *</Label><Textarea className="sgc-input" value={derivacion.motivo} onChange={e => setDerivacion({...derivacion, motivo: e.target.value})} rows={3} required/></div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="sgc-label">Urgencia</Label>
                                                            <Select value={derivacion.urgencia} onValueChange={v => setDerivacion({...derivacion, urgencia: v})}>
                                                                <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                                <SelectContent className="bg-[#111827] border border-border text-foreground">
                                                                    <SelectItem value="normal" className="focus:bg-blue-600 focus:text-foreground">Normal</SelectItem>
                                                                    <SelectItem value="preferente" className="focus:bg-blue-600 focus:text-foreground">Preferente</SelectItem>
                                                                    <SelectItem value="urgente" className="focus:bg-blue-600 focus:text-foreground">Urgente</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" className="sgc-input h-11" value={derivacion.fecha} onChange={e => setDerivacion({...derivacion, fecha: e.target.value})}/></div>
                                                    </div>
                                                    <div className="space-y-1.5"><Label className="sgc-label">Institución externa</Label><Input className="sgc-input h-11" value={derivacion.institucion} onChange={e => setDerivacion({...derivacion, institucion: e.target.value})}/></div>
                                                    <div className="flex gap-3 pt-2">
                                                        <Button type="button" onClick={() => {
                                                            setDerivacionDialog(false); 
                                                            setBusquedaPaciente("");
                                                            setDerivacion({convictoId: "", especialidad: "", motivo: "", urgencia: "", institucion: "", fecha: ""});
                                                        }} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                                        <Button type="submit" className="sgc-btn-primary flex-1 h-11">Registrar</Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(filteredDerivaciones, "derivaciones")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-border hover:bg-transparent">
                                            <TableHead className="font-bold text-primary">ID</TableHead>
                                            <TableHead className="text-foreground">Estado</TableHead>
                                            <TableHead className="text-foreground min-w-[200px]">Paciente</TableHead>
                                            <TableHead className="text-foreground">Especialidad</TableHead>
                                            <TableHead className="text-foreground min-w-[200px]">Motivo</TableHead>
                                            <TableHead className="text-foreground">Institución</TableHead>
                                            <TableHead className="text-center text-foreground">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDerivaciones.map(d => (
                                            <TableRow key={d.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-primary">D-{d.id}</TableCell>
                                                <TableCell><Badge variant="outline" className={getEstadoColor(d.estado)}>{(d.estado || "").toUpperCase()}</Badge></TableCell>
                                                <TableCell className="font-medium text-foreground">{d.nombre ?? convictoIdToName(d.convictoId)}</TableCell>
                                                <TableCell className="text-foreground">{d.especialidad}</TableCell>
                                                <TableCell className="text-foreground">{d.motivo}</TableCell>
                                                <TableCell className="text-foreground">{d.institucion}</TableCell>
                                                <TableCell className="flex justify-center gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-primary hover:border-blue-500 transition-colors group"
                                                        onClick={() => handleStartEdit("derivacion", d.id, d)}>
                                                        <Edit2 className="h-3.5 w-3.5 text-primary group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-500 transition-colors group"
                                                        onClick={() => setDeleteConfirm({ type: "derivacion", id: d.id })}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-foreground transition-colors"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* ======================= HISTORIAL ======================= */}
                        <TabsContent value="historial" className="space-y-6">
                            <Card className="sgc-card border-0 mb-4">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/50">
                                    <CardTitle className="text-xl text-foreground font-bold tracking-wide">Historial Médico Completo</CardTitle>
                                    <Badge variant="secondary" className={`text-[16px] px-3 py-1 mt-2 md:mt-0 border-green-500 text-green-400 bg-green-500/10`}>
                                        Registros totales: {filteredHistorial.length}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-start gap-4">
                                        <div className="relative md:w-1/3 h-10!">
                                            <Search className=" absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground"/>
                                            <Input aria-label="Búsqueda" placeholder="Buscar por ID, Paciente o Diagnóstico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="sgc-input pl-10!"/>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(filteredHistorial, "historial")}><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={handleImprimir}><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50 shadow-inner">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-500/10 border-b border-border hover:bg-transparent">
                                            <TableHead className="font-bold text-primary min-w-[60px]">ID</TableHead>
                                            <TableHead className="text-foreground min-w-[110px]">Fecha</TableHead>
                                            <TableHead className="text-foreground min-w-[250px]">Paciente</TableHead>
                                            <TableHead className="text-foreground min-w-[120px]">DNI</TableHead>
                                            <TableHead className="text-foreground min-w-[120px]">Tipo</TableHead>
                                            <TableHead className="text-foreground min-w-[230px]">Diagnóstico</TableHead>
                                            <TableHead className="text-foreground min-w-[250px]">Observaciones</TableHead>
                                            <TableHead className="text-foreground min-w-[180px]">Médico</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredHistorial.map(h => (
                                            <TableRow key={h.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="font-bold text-primary">H-{h.id}</TableCell>
                                                <TableCell className="text-foreground">{h.fecha}</TableCell>
                                                <TableCell className="font-medium text-foreground">{h.nombre ?? convictoIdToName(h.convictoId)}</TableCell>
                                                <TableCell className="text-foreground font-mono">{convictoIdToDni(h.convictoId)}</TableCell>
                                                <TableCell><Badge variant="outline" className="bg-slate-800 text-foreground border-slate-700">{h.tipo}</Badge></TableCell>
                                                <TableCell className="text-foreground">{h.diagnostico}</TableCell>
                                                <TableCell className="text-foreground max-w-[250px] truncate">{h.observaciones}</TableCell>
                                                <TableCell className="text-foreground font-medium">{h.medico}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                </Tabs>

                {/* --- DIALOG DE EDICIÓN GENÉRICO --- */}
                {editingId && editingData && (
                    <Dialog open={true} onOpenChange={(open) => { if (!open) { setEditingId(null); setEditingData(null); setBusquedaPaciente(""); } }}>
                        <DialogContent className="sgc-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-wider">
                                    Editar {editingData.type} {editingData.type.charAt(0).toUpperCase()}-{editingId}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-3">
                                
                                {/* FILTRO Y SELECTOR EN MODAL DE EDICIÓN */}
                                <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-card/50">
                                    <Label className="sgc-label text-primary font-bold tracking-wider">Cambiar paciente asignado</Label>
                                    <Input
                                        placeholder="Buscar por DNI, Nombre o ID..."
                                        value={busquedaPaciente}
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            setBusquedaPaciente(valor);
                                            if (valor.trim() === "") {
                                                setEditingData({...editingData, data: {...editingData.data, convictoId: ""}});
                                            } else {
                                                const filtrados = convictos.filter(c => 
                                                    (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                    (c.dni && c.dni.includes(valor)) ||
                                                    (c.id && c.id.toString() === valor)
                                                );
                                                if (filtrados.length > 0) {
                                                    setEditingData({...editingData, data: {...editingData.data, convictoId: String(filtrados[0].id)}});
                                                } else {
                                                    setEditingData({...editingData, data: {...editingData.data, convictoId: ""}});
                                                }
                                            }
                                        }}
                                        className="sgc-input h-10 border-slate-700 bg-card"/>
                                    <Select value={String(editingData.data.convictoId)} onValueChange={(v) => setEditingData({...editingData, data: {...editingData.data, convictoId: v}})}>
                                        <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccionar paciente"/></SelectTrigger>
                                        <SelectContent className="bg-[#111827] border border-border text-foreground">
                                            {convictosFiltrados.length > 0 ? (
                                                convictosFiltrados.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="focus:bg-blue-600 focus:text-foreground">{getConvictoLabel(c)}</SelectItem>))
                                            ) : (
                                                <div className="p-2 text-sm text-foreground text-center">Sin resultados para "{busquedaPaciente}"</div>
                                            )}
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
                                        
                                        <div className="space-y-1.5">
                                            <Label className="sgc-label">Médico Tratante</Label>
                                            <Input className="sgc-input h-11" placeholder="Ej. Dr. Juan Pérez" value={editingData.data.medico || ''} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, medico: e.target.value}})}/>
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
                                                    <SelectContent className="bg-[#111827] border border-border text-foreground">
                                                        <SelectItem value="pendiente" className="focus:bg-blue-600 focus:text-foreground">Pendiente</SelectItem>
                                                        <SelectItem value="realizada" className="focus:bg-blue-600 focus:text-foreground">Realizada</SelectItem>
                                                        <SelectItem value="rechazada" className="focus:bg-blue-600 focus:text-foreground">Rechazada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5"><Label className="sgc-label">Especialidad</Label><Input className="sgc-input h-11" value={editingData.data.especialidad} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, especialidad: e.target.value}})}/></div>
                                        </div>
                                        <div className="space-y-1.5"><Label className="sgc-label">Institución externa</Label><Input className="sgc-input h-11" value={editingData.data.institucion} onChange={(e) => setEditingData({...editingData, data: {...editingData.data, institucion: e.target.value}})}/></div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-border/80">
                                    <Button variant="outline" className="sgc-btn-secondary flex-1 h-11" onClick={() => { setEditingId(null); setEditingData(null); setBusquedaPaciente(""); }}>Cancelar</Button>
                                    <Button className="sgc-btn-primary flex-1 h-11" onClick={handleSaveEdit}>Guardar cambios</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* --- DIALOG DE ELIMINAR (ALERT) --- */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <AlertDialogContent className="sgc-card border-red-500/30 text-foreground shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-foreground flex items-center gap-2"><AlertCircle className="text-red-400 h-6 w-6"/> Eliminar registro</AlertDialogTitle>
                            <AlertDialogDescription className="text-foreground text-[14px]">Esta acción es irreversible ¿Está seguro de que desea eliminar este registro médico?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 mt-4">
                            <AlertDialogCancel className="sgc-btn-secondary flex-1 border-slate-700 m-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="flex-1 bg-red-600 text-foreground hover:bg-red-700 m-0 border-0 shadow-lg shadow-red-900/20" onClick={() => deleteConfirm && handleDelete(deleteConfirm.type, deleteConfirm.id)}>Eliminar permanentemente</AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </div>
    )
}