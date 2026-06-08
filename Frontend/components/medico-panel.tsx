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
// Se añade Select para replicar la interfaz de usuario del segundo código
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
import {ArrowLeft, AlertCircle, Calendar, Pill, Plus, Edit2, Printer, FileText, Trash2, Download} from 'lucide-react'
import {useToast} from "@/hooks/use-toast"

// Función auxiliar para obtener la fecha en formato YYYY-MM-DD
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

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `https://sgc-backend-vbze.onrender.com/api/medico` : "https://sgc-backend-vbze.onrender.com/api/medico";
const CONVICTOS_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `https://sgc-backend-vbze.onrender.com/api/convictos` : "https://sgc-backend-vbze.onrender.com/api/convictos";

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
        fecha: "", // YYYY-MM-DD
        hora: "",
        prioridad: "",
        convictoId: "",
        diagnostico: "",
        tratamiento: "",
        medico: "",
        proximaRevision: "", // YYYY-MM-DD
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

// ----------------- UTIL (fetch) -----------------
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

    // ----------------- Helpers UI (sin cambios) -----------------
    const getConvictoLabel = (c: any) => `${c.nombre} (${c.dni})`
    const getPrioridadColor = (prioridad: string) => {
        switch ((prioridad || "").toLowerCase()) {
            case "urgente":
                return "bg-red-500/10 text-red-400 border-red-500/20"
            case "alta":
                return "bg-orange-500/10 text-orange-400 border-orange-500/20"
            case "media":
                return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            case "baja":
                return "bg-green-500/10 text-green-400 border-green-500/20"
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20"
        }
    }
    const getEstadoColor = (estado: string) => {
        switch ((estado || "").toLowerCase()) {
            case "pendiente":
                return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            case "realizada":
                return "bg-green-500/10 text-green-400 border-green-500/20"
            case "rechazada":
                return "bg-red-500/10 text-red-400 border-red-500/20"
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20"
        }
    }

    // Función para iniciar la edición - igual que en el segundo código
    const handleStartEdit = (type: string, id: number, data: any) => {
        setEditingId(id)
        setEditingData({type, data: {...data}})
    }

    // Función genérica para guardar la edición - para simular el botón "Guardar" del otro código.
    const handleSaveEdit = async () => {
        if (!editingId || !editingData) return

        switch (editingData.type) {
            case "revision":
                await handleUpdateRevision(editingId)
                break
            case "tratamiento":
                await handleUpdateTratamiento(editingId)
                break
            case "derivacion":
                await handleUpdateDerivacion(editingId)
                break
            default:
                toast({
                    title: "Error",
                    description: "Tipo de registro desconocido para guardar",
                    variant: "destructive"
                })
        }

        // Cierra el diálogo después de intentar la actualización
        setEditingId(null)
        setEditingData(null)
    }

    // ----------------- CRUD: Revisiones -----------------
    const handleNuevaRevision = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!revision.convictoId || !revision.diagnostico) {
            toast({title: "Error", description: "Paciente y diagnóstico son obligatorios", variant: "destructive"})
            return
        }
        try {
            const payload = {
                fecha: revision.fecha || new Date().toISOString().split("T")[0],
                hora: revision.hora || new Date().toTimeString().split(' ')[0].substring(0, 5), // HH:MM
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
                setRevision({
                    convictoId: "",
                    diagnostico: "",
                    tratamiento: "",
                    medico: "",
                    prioridad: "",
                    fecha: "",
                    hora: "",
                    proximaRevision: ""
                })
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "No se pudo registrar revisión",
                    variant: "destructive"
                })
            }
        } catch (e) {
            console.error(e);
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
                toast({title: "Revisión actualizada"})
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "No se pudo actualizar", variant: "destructive"})
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
    }

// ----------------- CRUD: Tratamientos -----------------
    const handleRegistrarTratamiento = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!tratamiento.convictoId || !tratamiento.medicamento) {
            toast({title: "Error", description: "Paciente y medicamento son obligatorios", variant: "destructive"})
            return
        }
        try {
            const payload = {
                IDConv: Number(tratamiento.convictoId),
                Medicamento: tratamiento.medicamento,
                Dosis: tratamiento.dosis,
                Frecuencia: tratamiento.frecuencia,
                Duracion: tratamiento.duracion,
                Medico: tratamiento.medico || "Usuario actual",
                FechaInicio: tratamiento.fechaInicio || new Date().toISOString().split("T")[0] // Asegura formato YYYY-MM-DD
            }
            const res = await fetch(`${API_URL}/tratamientos`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Tratamiento registrado"})
                setTratamientoDialog(false)
                setTratamiento({
                    convictoId: "",
                    medicamento: "",
                    dosis: "",
                    frecuencia: "",
                    duracion: "",
                    medico: "",
                    fechaInicio: ""
                })
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "No se pudo registrar tratamiento",
                    variant: "destructive"
                })
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
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
                FechaInicio: getFormattedDate(editingData.data.fechaInicio) // Asegura formato YYYY-MM-DD
            }
            const res = await fetch(`${API_URL}/tratamientos/${id}`, {
                method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Tratamiento actualizado"})
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "No se pudo actualizar", variant: "destructive"})
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
    }

// ----------------- CRUD: Derivaciones -----------------
    const handleRegistrarDerivacion = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!derivacion.convictoId || !derivacion.especialidad || !derivacion.motivo) {
            toast({
                title: "Error",
                description: "Paciente, especialidad y motivo son obligatorios",
                variant: "destructive"
            })
            return
        }
        try {
            const payload = {
                Estado: "pendiente",
                IDConv: Number(derivacion.convictoId),
                Especialidad: derivacion.especialidad,
                Motivo: derivacion.motivo,
                Urgencia: derivacion.urgencia,
                Institucion: derivacion.institucion,
                Fecha: derivacion.fecha || new Date().toISOString().split("T")[0] // Asegura formato YYYY-MM-DD
            }
            const res = await fetch(`${API_URL}/derivaciones`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Derivación registrada"})
                setDerivacionDialog(false)
                setDerivacion({convictoId: "", especialidad: "", motivo: "", urgencia: "", institucion: "", fecha: ""})
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "No se pudo registrar derivación",
                    variant: "destructive"
                })
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
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
                Fecha: getFormattedDate(editingData.data.fecha) // Asegura formato YYYY-MM-DD
            }
            const res = await fetch(`${API_URL}/derivaciones/${id}`, {
                method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Derivación actualizada"})
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "No se pudo actualizar", variant: "destructive"})
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
    }

// ----------------- ELIMINAR ----------------
    const handleDelete = async (type: string, id: number) => {
        try {
            let path = ""
            if (type === "revision") path = `/revisiones/${id}`
            if (type === "tratamiento") path = `/tratamientos/${id}`
            if (type === "derivacion") path = `/derivaciones/${id}`
            if (!path) return
            const res = await fetch(`${API_URL}${path}`, {method: "DELETE"})
            if (res.ok) {
                toast({title: "Eliminado"})
                setDeleteConfirm(null)
                await fetchAll()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "No se pudo eliminar", variant: "destructive"})
            }
        } catch (e) {
            console.error(e);
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        }
    }

    // ----------------- Exportar -----------------
    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            toast({title: "Nada que exportar", description: "No hay registros", variant: "destructive"});
            return
        }
        const headers = Object.keys(data[0]).join(",")
        const rows = data.map(obj => Object.values(obj).map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","))
        const csv = [headers, ...rows].join("\n")
        const blob = new Blob([csv], {type: "text/csv"})
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast({title: "Archivo descargado", description: `${filename}.csv`})
    }

    const handleImprimir = () => {
        window.print()
    }


// ----------------- RENDER -----------------
    return (
        <main className="min-h-screen bg-background p-6">
            <div className="container mx-auto max-w-7xl">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}
                            aria-label="Regresar al dashboard">
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold" id="panel-medico-title">Panel Médico</h1>
                        <p className="text-muted-foreground">Revisiones y tratamientos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" aria-hidden={loading ? "true" : "false"}>
                    <Card role="region" aria-labelledby="card-revisiones-title">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle id="card-revisiones-title" className="text-lg font-semibold tracking-wide">
                                REVISIONES PENDIENTES
                            </CardTitle>
                            <Calendar className="h-10 w-10 text-blue-400"/>
                        </CardHeader>

                        <CardContent className="flex flex-col items-start">
                            <h2 className="text-6xl font-bold text-blue-400 leading-tight" aria-live="polite">
                                {revisionesData.length}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Esta semana
                            </p>
                        </CardContent>
                    </Card>
                    <Card role="region" aria-labelledby="card-urgentes-title">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle id="card-urgentes-title" className="text-lg font-semibold tracking-wide">
                                CASOS URGENTES
                            </CardTitle>
                            <AlertCircle className="h-10 w-10 text-red-400"/>
                        </CardHeader>

                        <CardContent className="flex flex-col items-start">
                            <div className="text-6xl font-bold text-red-400 leading-tight">
                                {revisionesData.filter(r => (r.prioridad || "").toLowerCase() === "urgente").length}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Requieren atención inmediata</p>
                        </CardContent>
                    </Card>


                    <Card role="region" aria-labelledby="card-tratamientos-title">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle id="card-tratamientos-title" className="text-lg font-semibold tracking-wide">
                                EN TRATAMIENTO
                            </CardTitle>
                            <Pill className="h-10 w-10 text-green-400"/>
                        </CardHeader>

                        <CardContent className="flex flex-col items-start">
                            <div className="text-6xl font-bold leading-tight text-green-400">
                                {tratamientosDataState.length}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Tratamientos activos</p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl py-0">Gestión Médica</CardTitle>
                        <CardDescription>Administre revisiones, tratamientos, derivaciones e historial</CardDescription>
                    </CardHeader>
                    <CardContent>

                        <Tabs defaultValue="revisiones" className="w-full mt-2" role="tablist"
                              aria-label="Secciones del panel médico">

                            <TabsList className="grid grid-cols-4 w-full mb-6 bg-muted/30 rounded-md p-1" role="tablist"
                                      aria-controls="medico-tabs">
                                <TabsTrigger value="revisiones"
                                             className="rounded-md flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20"
                                             role="tab" aria-selected={true}
                                             aria-controls="tab-revisiones">Revisiones</TabsTrigger>
                                <TabsTrigger value="tratamientos"
                                             className="rounded-md flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20"
                                             role="tab" aria-controls="tab-tratamientos">Tratamientos</TabsTrigger>
                                <TabsTrigger value="derivaciones"
                                             className="rounded-md flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20"
                                             role="tab" aria-controls="tab-derivaciones">Derivaciones</TabsTrigger>
                                <TabsTrigger value="historial"
                                             className="rounded-md flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20"
                                             role="tab" aria-controls="tab-historial">Historial</TabsTrigger>
                            </TabsList>

                            {/* =============================== */}
                            {/* ✔ TAB 1 - REVISIONES MÉDICAS   */}
                            {/* =============================== */}
                            <TabsContent value="revisiones" className="space-y-6" id="tab-revisiones" role="tabpanel"
                                         aria-labelledby="revisiones-tab">

                                <div className="flex flex-wrap gap-2">
                                    <Dialog open={revisionDialog} onOpenChange={setRevisionDialog}>
                                        <DialogTrigger asChild>
                                            <Button aria-haspopup="dialog" aria-controls="dialog-nueva-revision">
                                                <Plus className="h-4 w-4 mr-2"/> Nueva Revisión
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent id="dialog-nueva-revision" role="dialog"
                                                       aria-labelledby="dialog-nueva-revision-title" aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle id="dialog-nueva-revision-title">Nueva Revisión
                                                    Médica</DialogTitle>
                                                <DialogDescription>Registre una nueva revisión
                                                    médica</DialogDescription>
                                            </DialogHeader>

                                            <form onSubmit={handleNuevaRevision} className="space-y-4"
                                                  aria-labelledby="dialog-nueva-revision-title">

                                                <div className="space-y-2">
                                                    <Label htmlFor="paciente-rev">Paciente *</Label>
                                                    <Select
                                                        value={revision.convictoId}
                                                        onValueChange={(v) =>
                                                            setRevision({...revision, convictoId: v})}>
                                                        <SelectTrigger
                                                            id="paciente-rev"
                                                            className="w-full">
                                                            <div className="flex items-center gap-2">
                                                                <SelectValue placeholder="Seleccionar paciente"/>
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="fecha-rev">Fecha</Label>
                                                        <Input id="fecha-rev" type="date" value={revision.fecha}
                                                               onChange={e => setRevision({
                                                                   ...revision,
                                                                   fecha: e.target.value
                                                               })}/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="hora-rev">Hora</Label>
                                                        <Input id="hora-rev" type="time" value={revision.hora}
                                                               onChange={e => setRevision({
                                                                   ...revision,
                                                                   hora: e.target.value
                                                               })}/>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="diagnostico-rev">Diagnóstico *</Label>
                                                    <Input id="diagnostico-rev" value={revision.diagnostico}
                                                           onChange={e => setRevision({
                                                               ...revision,
                                                               diagnostico: e.target.value
                                                           })} aria-required="true"/>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="tratamiento-rev">Tratamiento</Label>
                                                    <Textarea id="tratamiento-rev" value={revision.tratamiento}
                                                              onChange={e => setRevision({
                                                                  ...revision,
                                                                  tratamiento: e.target.value
                                                              })} rows={3}/>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="prioridad-rev">Prioridad</Label>
                                                        <Select value={revision.prioridad}
                                                                onValueChange={v => setRevision({
                                                                    ...revision,
                                                                    prioridad: v
                                                                })}>
                                                            <SelectTrigger id="prioridad-rev">
                                                                <SelectValue placeholder="Seleccionar"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="baja">Baja</SelectItem>
                                                                <SelectItem value="media">Media</SelectItem>
                                                                <SelectItem value="alta">Alta</SelectItem>
                                                                <SelectItem value="urgente">Urgente</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="proxima-rev">Próxima revisión</Label>
                                                        <Input id="proxima-rev" type="date"
                                                               value={revision.proximaRevision}
                                                               onChange={e => setRevision({
                                                                   ...revision,
                                                                   proximaRevision: e.target.value
                                                               })}/>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline"
                                                            onClick={() => setRevisionDialog(false)}
                                                            className="flex-1">Cancelar</Button>
                                                    <Button type="submit" className="flex-1">Registrar</Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    <Button variant="outline" onClick={() => exportToCSV(revisionesData, "revisiones")}
                                            aria-label="Exportar revisiones a CSV">
                                        <Download className="h-4 w-4 mr-2"/> Exportar CSV
                                    </Button>

                                    <Button variant="outline" onClick={handleImprimir} aria-label="Imprimir revisiones">
                                        <Printer className="h-4 w-4 mr-2"/> Imprimir
                                    </Button>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-border/30 shadow-md"
                                     role="region" aria-labelledby="tabla-revisiones-title">
                                    <Table role="table" aria-describedby="tabla-revisiones-desc">
                                        <caption id="tabla-revisiones-desc" className="sr-only">Lista de revisiones
                                            médicas
                                        </caption>
                                        <TableHeader>
                                            <TableRow role="row" className="bg-muted/20">
                                                <TableHead scope="col"
                                                           className="font-bold bg-primary/10">IDRevisión</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[100px] text-left">Fecha</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[70px] text-left">Hora</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[100px] text-left">Prioridad</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[230px] text-left">Nombre</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[100px] text-left">DNI</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[250px] text-left">Diagnóstico</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[200px] text-left">Tratamiento</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[180px] text-left">Médico</TableHead>
                                                <TableHead scope="col" className="min-w-[150px] text-center">Próxima
                                                    Revisión</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[100px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {revisionesData.map((rev) => (
                                                <TableRow key={rev.id} role="row">
                                                    <TableCell role="cell"
                                                               className="font-bold bg-primary/10">R-{rev.id}</TableCell>
                                                    <TableCell role="cell">{rev.fecha}</TableCell>
                                                    <TableCell role="cell">{rev.hora}</TableCell>
                                                    <TableCell role="cell">
                                                        <Badge variant="outline"
                                                               className={getPrioridadColor(rev.prioridad)}>
                                                            {(rev.prioridad || "").toString().toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell role="cell"
                                                               className="font-medium">{rev.nombre ?? convictoIdToName(rev.convictoId)}</TableCell>
                                                    <TableCell role="cell">{convictoIdToDni(rev.convictoId)}</TableCell>
                                                    <TableCell role="cell">{rev.diagnostico}</TableCell>
                                                    <TableCell role="cell">{rev.tratamiento}</TableCell>
                                                    <TableCell role="cell">{rev.medico}</TableCell>
                                                    <TableCell role="cell"
                                                               className="text-center">{rev.proximaRevision}</TableCell>
                                                    <TableCell role="cell" className="flex gap-2 text-center">
                                                        <Button size="sm" variant="outline"
                                                                aria-label={`Editar revisión ${rev.id}`}
                                                                onClick={() => handleStartEdit("revision", rev.id, {
                                                                    convictoId: rev.convictoId,
                                                                    prioridad: rev.prioridad,
                                                                    fecha: rev.fecha,
                                                                    hora: rev.hora,
                                                                    diagnostico: rev.diagnostico,
                                                                    tratamiento: rev.tratamiento,
                                                                    medico: rev.medico,
                                                                    proximaRevision: rev.proximaRevision,
                                                                })}
                                                        >
                                                            <Edit2 className="h-3 w-3"/>
                                                        </Button>
                                                        <Button size="sm" variant="destructive"
                                                                aria-label={`Eliminar revisión ${rev.id}`}
                                                                onClick={() => setDeleteConfirm({
                                                                    type: "revision",
                                                                    id: rev.id
                                                                })}>
                                                            <Trash2 className="h-3 w-3"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {editingId && editingData && editingData.type === "revision" && (
                                    <Dialog open={true} onOpenChange={(open) => {
                                        if (!open) {
                                            setEditingId(null);
                                            setEditingData(null)
                                        }
                                    }}>
                                        <DialogContent role="dialog" aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle>Editar Revisión R-{editingId}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">

                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-convicto">Paciente</Label>
                                                    <Select
                                                        value={String(editingData.data.convictoId)}
                                                        onValueChange={(v) =>
                                                            setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, convictoId: v}
                                                            })}>
                                                        <SelectTrigger id="edit-convicto"
                                                                       className="block w-full rounded-md border p-2 flex items-center gap-2">
                                                            <SelectValue placeholder="Seleccionar paciente"/>
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Fecha</Label>
                                                        <Input type="date"
                                                               value={getFormattedDate(editingData.data.fecha)}
                                                               onChange={(e) => setEditingData({
                                                                   ...editingData,
                                                                   data: {...editingData.data, fecha: e.target.value}
                                                               })}/>
                                                    </div>
                                                    <div>
                                                        <Label>Hora</Label>
                                                        <Input type="time" value={editingData.data.hora}
                                                               onChange={(e) => setEditingData({
                                                                   ...editingData,
                                                                   data: {...editingData.data, hora: e.target.value}
                                                               })}/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Diagnóstico</Label>
                                                    <Input value={editingData.data.diagnostico}
                                                           onChange={(e) => setEditingData({
                                                               ...editingData,
                                                               data: {...editingData.data, diagnostico: e.target.value}
                                                           })}/>
                                                </div>
                                                <div>
                                                    <Label>Tratamiento</Label>
                                                    <Textarea value={editingData.data.tratamiento}
                                                              onChange={(e) => setEditingData({
                                                                  ...editingData,
                                                                  data: {
                                                                      ...editingData.data,
                                                                      tratamiento: e.target.value
                                                                  }
                                                              })} rows={3}/>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Prioridad</Label>
                                                        <Select value={editingData.data.prioridad}
                                                                onValueChange={(v) => setEditingData({
                                                                    ...editingData,
                                                                    data: {...editingData.data, prioridad: v}
                                                                })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="baja">Baja</SelectItem>
                                                                <SelectItem value="media">Media</SelectItem>
                                                                <SelectItem value="alta">Alta</SelectItem>
                                                                <SelectItem value="urgente">Urgente</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Próxima revisión</Label>
                                                        <Input type="date"
                                                               value={getFormattedDate(editingData.data.proximaRevision)}
                                                               onChange={(e) => setEditingData({
                                                                   ...editingData,
                                                                   data: {
                                                                       ...editingData.data,
                                                                       proximaRevision: e.target.value
                                                                   }
                                                               })}/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Médico</Label>
                                                    <Input value={editingData.data.medico}
                                                           onChange={(e) => setEditingData({
                                                               ...editingData,
                                                               data: {...editingData.data, medico: e.target.value}
                                                           })}/>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => {
                                                        setEditingId(null);
                                                        setEditingData(null)
                                                    }}>Cancelar</Button>
                                                    <Button className="flex-1" onClick={handleSaveEdit}>Guardar</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </TabsContent>


                            {/* =============================== */}
                            {/* ✔ TAB 2 - TRATAMIENTOS         */}
                            {/* =============================== */}
                            <TabsContent value="tratamientos" className="space-y-6" id="tab-tratamientos"
                                         role="tabpanel">

                                <div className="flex flex-wrap gap-2">

                                    <Dialog open={tratamientoDialog} onOpenChange={setTratamientoDialog}>
                                        <DialogTrigger asChild>
                                            <Button aria-haspopup="dialog" aria-controls="dialog-nuevo-tratamiento">
                                                <Plus className="h-4 w-4 mr-2"/> Nuevo Tratamiento
                                            </Button>
                                        </DialogTrigger>
                                        {/* El formulario del diálogo se mantiene desde el segundo código */}
                                        <DialogContent id="dialog-nuevo-tratamiento" role="dialog"
                                                       aria-labelledby="dialog-nuevo-tratamiento-title"
                                                       aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle id="dialog-nuevo-tratamiento-title">Registrar
                                                    Tratamiento</DialogTitle>
                                                <DialogDescription>Registre un nuevo tratamiento
                                                    médico</DialogDescription>
                                            </DialogHeader>

                                            <form onSubmit={handleRegistrarTratamiento} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="paciente-trat">Paciente *</Label>
                                                    <Select
                                                        value={revision.convictoId}
                                                        onValueChange={(v) =>
                                                            setRevision({...revision, convictoId: v})}>
                                                        <SelectTrigger
                                                            id="paciente-trat"
                                                            className="w-full">
                                                            <div className="flex items-center gap-2">
                                                                <SelectValue placeholder="Seleccionar paciente"/>
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="medicamento">Medicamento *</Label>
                                                        <Input id="medicamento" value={tratamiento.medicamento}
                                                               onChange={(e) => setTratamiento({
                                                                   ...tratamiento,
                                                                   medicamento: e.target.value
                                                               })} required/>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="dosis">Dosis *</Label>
                                                        <Input id="dosis" value={tratamiento.dosis}
                                                               onChange={(e) => setTratamiento({
                                                                   ...tratamiento,
                                                                   dosis: e.target.value
                                                               })} required/>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="frecuencia">Frecuencia *</Label>
                                                        <Input id="frecuencia" value={tratamiento.frecuencia}
                                                               onChange={(e) => setTratamiento({
                                                                   ...tratamiento,
                                                                   frecuencia: e.target.value
                                                               })} required/>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="duracion">Duración *</Label>
                                                        <Input id="duracion" value={tratamiento.duracion}
                                                               onChange={(e) => setTratamiento({
                                                                   ...tratamiento,
                                                                   duracion: e.target.value
                                                               })} required/>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="fechaInicio">Fecha inicio</Label>
                                                    <Input id="fechaInicio" type="date" value={tratamiento.fechaInicio}
                                                           onChange={(e) => setTratamiento({
                                                               ...tratamiento,
                                                               fechaInicio: e.target.value
                                                           })}/>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1"
                                                            onClick={() => setTratamientoDialog(false)}>Cancelar</Button>
                                                    <Button type="submit" className="flex-1">Registrar</Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline"
                                            onClick={() => exportToCSV(tratamientosDataState, "tratamientos")}>
                                        <Download className="h-4 w-4 mr-2"/> Exportar CSV </Button>
                                    <Button variant="outline" onClick={handleImprimir}> <Printer
                                        className="h-4 w-4 mr-2"/> Imprimir </Button>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-border/30 shadow-md"
                                     role="region" aria-labelledby="tabla-tratamientos-title">
                                    <Table role="table">
                                        <TableHeader>
                                            <TableRow className="bg-muted/20">
                                                <TableHead className="font-bold bg-primary/10"
                                                           scope="col">IDTratamiento</TableHead>
                                                <TableHead scope="col">Nombre</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[130px] text-center">DNI</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[200px] text-left">Medicamento</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[180px] text-left">Dosis</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[180px] text-left">Frecuencia</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[150px] text-left">Duración</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[180px] text-left">Médico</TableHead>
                                                <TableHead scope="col" className="min-w-[120px] text-left">Fecha
                                                    Inicio</TableHead>
                                                <TableHead scope="col"
                                                           className="min-w-[100px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {tratamientosDataState.map(tr => (
                                                <TableRow key={tr.id}>
                                                    <TableCell className="font-bold bg-primary/10">T-{tr.id}</TableCell>
                                                    <TableCell
                                                        className="font-medium">{tr.nombre ?? convictoIdToName(tr.convictoId)}</TableCell>
                                                    <TableCell
                                                        className="text-center">{convictoIdToDni(tr.convictoId)}</TableCell>
                                                    <TableCell>{tr.medicamento}</TableCell>
                                                    <TableCell>{tr.dosis}</TableCell>
                                                    <TableCell>{tr.frecuencia}</TableCell>
                                                    <TableCell>{tr.duracion}</TableCell>
                                                    <TableCell>{tr.medico}</TableCell>
                                                    <TableCell>{tr.fechaInicio}</TableCell>
                                                    <TableCell className="flex gap-2">
                                                        <Button size="sm" variant="outline"
                                                                aria-label={`Editar tratamiento ${tr.id}`}
                                                                onClick={() => handleStartEdit("tratamiento", tr.id, {
                                                                    convictoId: tr.convictoId,
                                                                    medicamento: tr.medicamento,
                                                                    dosis: tr.dosis,
                                                                    frecuencia: tr.frecuencia,
                                                                    duracion: tr.duracion,
                                                                    medico: tr.medico,
                                                                    fechaInicio: tr.fechaInicio
                                                                })}>
                                                            <Edit2 className="h-3 w-3"/>
                                                        </Button>
                                                        <Button size="sm" variant="destructive"
                                                                aria-label={`Eliminar tratamiento ${tr.id}`}
                                                                onClick={() => setDeleteConfirm({
                                                                    type: "tratamiento",
                                                                    id: tr.id
                                                                })}>
                                                            <Trash2 className="h-3 w-3"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {editingId && editingData && editingData.type === "tratamiento" && (
                                    <Dialog open={true} onOpenChange={(open) => {
                                        if (!open) {
                                            setEditingId(null);
                                            setEditingData(null)
                                        }
                                    }}>
                                        <DialogContent role="dialog" aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle>Editar Tratamiento T-{editingId}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">

                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-tratamiento">Paciente</Label>

                                                    <Select
                                                        value={String(editingData.data.convictoId)}
                                                        onValueChange={(v) =>
                                                            setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, convictoId: v}
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger id="edit-tratamiento"
                                                                    className="block w-full rounded-md border p-2 flex items-center gap-2">
                                                            <SelectValue placeholder="Seleccionar paciente"/>
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label>Medicamento</Label>
                                                    <Input value={editingData.data.medicamento}
                                                        onChange={(e) => setEditingData({
                                                            ...editingData,
                                                            data: {...editingData.data, medicamento: e.target.value}
                                                        })}/>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Dosis</Label>
                                                        <Input value={editingData.data.dosis}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, dosis: e.target.value}
                                                            })}/>
                                                    </div>
                                                    <div>
                                                        <Label>Frecuencia</Label>
                                                        <Input value={editingData.data.frecuencia}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {
                                                                    ...editingData.data,
                                                                    frecuencia: e.target.value
                                                                }
                                                            })}/>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Duración</Label>
                                                        <Input value={editingData.data.duracion}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, duracion: e.target.value}
                                                            })}/>
                                                    </div>
                                                    <div>
                                                        <Label>Fecha Inicio</Label>
                                                        <Input type="date"
                                                            value={getFormattedDate(editingData.data.fechaInicio)}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {
                                                                    ...editingData.data,
                                                                    fechaInicio: e.target.value
                                                                }
                                                            })}/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Médico</Label>
                                                    <Input value={editingData.data.medico}
                                                        onChange={(e) => setEditingData({
                                                            ...editingData,
                                                            data: {...editingData.data, medico: e.target.value}
                                                        })}/>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => {
                                                        setEditingId(null);
                                                        setEditingData(null)
                                                    }}>Cancelar</Button>
                                                    <Button className="flex-1" onClick={handleSaveEdit}>Guardar</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </TabsContent>

                            {/* =============================== */}
                            {/* ✔ TAB 3 - DERIVACIONES         */}
                            {/* =============================== */}
                            <TabsContent value="derivaciones" className="space-y-6" id="tab-derivaciones"
                                        role="tabpanel">

                                <div className="flex flex-wrap gap-2">

                                    <Dialog open={derivacionDialog} onOpenChange={setDerivacionDialog}>
                                        <DialogTrigger asChild>
                                            <Button aria-haspopup="dialog" aria-controls="dialog-nueva-derivacion">
                                                <Plus className="h-4 w-4 mr-2"/> Nueva Derivación
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent id="dialog-nueva-derivacion" role="dialog"
                                                    aria-labelledby="dialog-nueva-derivacion-title"
                                                    aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle id="dialog-nueva-derivacion-title">Registrar
                                                    Derivación</DialogTitle>
                                                <DialogDescription>Derive a un paciente a un
                                                    especialista</DialogDescription>
                                            </DialogHeader>

                                            <form onSubmit={handleRegistrarDerivacion} className="space-y-4">

                                                <div className="space-y-2">
                                                    <Label htmlFor="paciente-der">Paciente *</Label>
                                                    <Select
                                                        value={revision.convictoId}
                                                        onValueChange={(v) =>
                                                            setRevision({...revision, convictoId: v})}>
                                                        <SelectTrigger
                                                            id="paciente-der"
                                                            className="w-full">
                                                            <div className="flex items-center gap-2">
                                                                <SelectValue placeholder="Seleccionar paciente"/>
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="especialidad">Especialidad *</Label>
                                                    <Select value={derivacion.especialidad}
                                                            onValueChange={v => setDerivacion({
                                                                ...derivacion,
                                                                especialidad: v
                                                            })}>
                                                        <SelectTrigger id="especialidad">
                                                            <SelectValue placeholder="Seleccionar"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Cardiología">Cardiología</SelectItem>
                                                            <SelectItem value="Traumatología">Traumatología</SelectItem>
                                                            <SelectItem value="Psiquiatría">Psiquiatría</SelectItem>
                                                            <SelectItem value="Odontología">Odontología</SelectItem>
                                                            <SelectItem value="Otra">Otra</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="motivo-der">Motivo *</Label>
                                                    <Textarea id="motivo-der" value={derivacion.motivo}
                                                            onChange={e => setDerivacion({
                                                                ...derivacion,
                                                                motivo: e.target.value
                                                            })} rows={3} required/>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="urgencia-der">Urgencia</Label>
                                                        <Select value={derivacion.urgencia}
                                                                onValueChange={v => setDerivacion({
                                                                    ...derivacion,
                                                                    urgencia: v
                                                                })}>
                                                            <SelectTrigger id="urgencia-der">
                                                                <SelectValue placeholder="Seleccionar"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="normal">Normal</SelectItem>
                                                                <SelectItem value="preferente">Preferente</SelectItem>
                                                                <SelectItem value="urgente">Urgente</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="fecha-der">Fecha</Label>
                                                        <Input id="fecha-der" type="date" value={derivacion.fecha}
                                                            onChange={e => setDerivacion({
                                                                ...derivacion,
                                                                fecha: e.target.value
                                                            })}/>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="institucion">Institución</Label>
                                                    <Input id="institucion" value={derivacion.institucion}
                                                        onChange={e => setDerivacion({
                                                            ...derivacion,
                                                            institucion: e.target.value
                                                        })}/>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1"
                                                            onClick={() => setDerivacionDialog(false)}>Cancelar</Button>
                                                    <Button type="submit" className="flex-1">Registrar</Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline"
                                            onClick={() => exportToCSV(derivacionesDataState, "derivaciones")}>
                                        <Download className="h-4 w-4 mr-2"/> Exportar CSV </Button>
                                    <Button variant="outline" onClick={handleImprimir}> <Printer
                                        className="h-4 w-4 mr-2"/> Imprimir </Button>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-border/30 shadow-md"
                                    role="region" aria-labelledby="tabla-derivaciones-title">
                                    <Table role="table">
                                        <TableHeader>
                                            <TableRow className="bg-muted/20">
                                                <TableHead scope="col"
                                                        className="font-bold bg-primary/10">IDDerivación</TableHead>
                                                <TableHead scope="col">Estado</TableHead>
                                                <TableHead scope="col">Nombre</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[130px] text-center">DNI</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[160px] text-left">Especialidad</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[200px] text-left">Motivo</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-left">Urgencia</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[180px] text-left">Institución</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[120px] text-left">Fecha</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[80px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {derivacionesDataState.map(d => (
                                                <TableRow key={d.id}>
                                                    <TableCell className="font-bold bg-primary/10">D-{d.id}</TableCell>
                                                    <TableCell><Badge variant="outline"
                                                                    className={getEstadoColor(d.estado)}>{(d.estado || "").toUpperCase()}</Badge></TableCell>
                                                    <TableCell
                                                        className="font-medium">{d.nombre ?? convictoIdToName(d.convictoId)}</TableCell>
                                                    <TableCell
                                                        className="text-center">{convictoIdToDni(d.convictoId)}</TableCell>
                                                    <TableCell>{d.especialidad}</TableCell>
                                                    <TableCell>{d.motivo}</TableCell>
                                                    <TableCell><Badge variant="outline"
                                                                    className={getPrioridadColor(d.urgencia)}>{(d.urgencia || "").toUpperCase()}</Badge></TableCell>
                                                    <TableCell>{d.institucion}</TableCell>
                                                    <TableCell>{d.fecha}</TableCell>
                                                    <TableCell className="flex gap-2">
                                                        <Button size="sm" variant="outline"
                                                                aria-label={`Editar derivación ${d.id}`}
                                                                onClick={() => handleStartEdit("derivacion", d.id, {
                                                                    convictoId: d.convictoId,
                                                                    especialidad: d.especialidad,
                                                                    motivo: d.motivo,
                                                                    urgencia: d.urgencia,
                                                                    institucion: d.institucion,
                                                                    fecha: d.fecha,
                                                                    estado: d.estado
                                                                })}>
                                                            <Edit2 className="h-3 w-3"/>
                                                        </Button>
                                                        <Button size="sm" variant="destructive"
                                                                aria-label={`Eliminar derivación ${d.id}`}
                                                                onClick={() => setDeleteConfirm({
                                                                    type: "derivacion",
                                                                    id: d.id
                                                                })}>
                                                            <Trash2 className="h-3 w-3"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {editingId && editingData && editingData.type === "derivacion" && (
                                    <Dialog open={true} onOpenChange={(open) => {
                                        if (!open) {
                                            setEditingId(null);
                                            setEditingData(null)
                                        }
                                    }}>
                                        <DialogContent role="dialog" aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle>Editar Derivación D-{editingId}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-derivación">Paciente</Label>

                                                    <Select
                                                        value={String(editingData.data.convictoId)}
                                                        onValueChange={(v) =>
                                                            setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, convictoId: v}
                                                            })}>
                                                        <SelectTrigger id="edit-derivacion"
                                                                    className="block w-full rounded-md border p-2 flex items-center gap-2">
                                                            <SelectValue placeholder="Seleccionar paciente"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Estado</Label>
                                                        <Select value={editingData.data.estado}
                                                                onValueChange={(v) => setEditingData({
                                                                    ...editingData,
                                                                    data: {...editingData.data, estado: v}
                                                                })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Estado"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                                                <SelectItem value="atendido">Realizada</SelectItem>
                                                                <SelectItem value="cancelado">Rechazada</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Especialidad</Label>
                                                        <Input value={editingData.data.especialidad}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {
                                                                    ...editingData.data,
                                                                    especialidad: e.target.value
                                                                }
                                                            })}/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Motivo</Label>
                                                    <Textarea value={editingData.data.motivo}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, motivo: e.target.value}
                                                            })} rows={3}/>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Urgencia</Label>
                                                        <Select value={editingData.data.urgencia}
                                                                onValueChange={(v) => setEditingData({
                                                                    ...editingData,
                                                                    data: {...editingData.data, urgencia: v}
                                                                })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="normal">Normal</SelectItem>
                                                                <SelectItem value="preferente">Preferente</SelectItem>
                                                                <SelectItem value="urgente">Urgente</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Fecha</Label>
                                                        <Input type="date"
                                                            value={getFormattedDate(editingData.data.fecha)}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, fecha: e.target.value}
                                                            })}/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Institución</Label>
                                                    <Input value={editingData.data.institucion}
                                                        onChange={(e) => setEditingData({
                                                            ...editingData,
                                                            data: {...editingData.data, institucion: e.target.value}
                                                        })}/>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => {
                                                        setEditingId(null);
                                                        setEditingData(null)
                                                    }}>Cancelar</Button>
                                                    <Button className="flex-1" onClick={handleSaveEdit}>Guardar</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </TabsContent>

                            {/* =============================== */}
                            {/* ✔ TAB 4 - HISTORIAL MÉDICO     */}
                            {/* =============================== */}
                            <TabsContent value="historial" className="space-y-6" id="tab-historial" role="tabpanel">

                                <div className="flex flex-wrap gap-2">
                                    <Button><FileText className="h-4 w-4 mr-2"/> Ver Detalle</Button>
                                    <Button variant="outline"
                                            onClick={() => exportToCSV(historialDataState, "historial")}><Download
                                        className="h-4 w-4 mr-2"/> Exportar CSV</Button>
                                    <Button variant="outline" onClick={handleImprimir}><Printer
                                        className="h-4 w-4 mr-2"/> Imprimir</Button>
                                </div>
                                <div className="overflow-x-auto rounded-lg border border-border/30 shadow-md"
                                    role="region" aria-labelledby="tabla-historial-title">
                                    <Table role="table">
                                        <TableHeader>
                                            <TableRow className="bg-muted/20">
                                                <TableHead scope="col"
                                                        className="font-bold bg-primary/10">IDHistorial</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-left">Fecha</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[220px] text-left">Nombre</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[130px] text-center">DNI</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-left">Tipo</TableHead>
                                                <TableHead scope="col">Diagnóstico</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[180px] text-left">Médico</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[220px] text-left">Observaciones</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {historialDataState.map(h => (
                                                <TableRow key={h.id}>
                                                    <TableCell className="font-bold bg-primary/10">H-{h.id}</TableCell>
                                                    <TableCell>{h.fecha}</TableCell>
                                                    <TableCell
                                                        className="font-medium">{h.nombre ?? convictoIdToName(h.convictoId)}</TableCell>
                                                    <TableCell
                                                        className="text-center">{convictoIdToDni(h.convictoId)}</TableCell>
                                                    <TableCell><Badge variant="outline">{h.tipo}</Badge></TableCell>
                                                    <TableCell>{h.diagnostico}</TableCell>
                                                    <TableCell>{h.medico}</TableCell>
                                                    <TableCell
                                                        className="max-w-xs truncate text-muted-foreground">{h.observaciones}</TableCell>
                                                    <TableCell className="flex gap-2">
                                                        <Button size="sm" variant="outline"
                                                                aria-label={`Editar historial ${h.id}`}
                                                                onClick={() => handleStartEdit("historial", h.id, {
                                                                    convictoId: h.convictoId,
                                                                    fecha: h.fecha,
                                                                    tipo: h.tipo,
                                                                    diagnostico: h.diagnostico,
                                                                    medico: h.medico,
                                                                    observaciones: h.observaciones
                                                                })}>
                                                            <Edit2 className="h-3 w-3"/>
                                                        </Button>
                                                        <Button size="sm" variant="destructive"
                                                                aria-label={`Eliminar historial ${h.id}`}
                                                                onClick={() => setDeleteConfirm({
                                                                    type: "historial",
                                                                    id: h.id
                                                                })}>
                                                            <Trash2 className="h-3 w-3"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {editingId && editingData && editingData.type === "historial" && (
                                    <Dialog open={true} onOpenChange={(open) => {
                                        if (!open) {
                                            setEditingId(null);
                                            setEditingData(null)
                                        }
                                    }}>
                                        <DialogContent role="dialog" aria-modal="true">
                                            <DialogHeader>
                                                <DialogTitle>Editar Historial H-{editingId}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">

                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-historial">Paciente</Label>

                                                    <Select
                                                        value={String(editingData.data.convictoId)}
                                                        onValueChange={(v) =>
                                                            setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, convictoId: v}
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger id="edit-historial"
                                                                    className="block w-full rounded-md border p-2 flex items-center gap-2">
                                                            <SelectValue placeholder="Seleccionar paciente"/>
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            {convictos.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {getConvictoLabel(c)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Fecha</Label>
                                                        <Input type="date"
                                                            value={getFormattedDate(editingData.data.fecha)}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {...editingData.data, fecha: e.target.value}
                                                            })}/>
                                                    </div>
                                                    <div>
                                                        <Label>Tipo</Label>
                                                        <Select value={editingData.data.tipo}
                                                                onValueChange={(v) => setEditingData({
                                                                    ...editingData,
                                                                    data: {...editingData.data, tipo: v}
                                                                })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="consulta">Consulta</SelectItem>
                                                                <SelectItem
                                                                    value="procedimiento">Procedimiento</SelectItem>
                                                                <SelectItem value="analisis">Análisis</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Diagnóstico</Label>
                                                    <Input value={editingData.data.diagnostico}
                                                        onChange={(e) => setEditingData({
                                                            ...editingData,
                                                            data: {...editingData.data, diagnostico: e.target.value}
                                                        })}/>
                                                </div>
                                                <div>
                                                    <Label>Médico</Label>
                                                    <Input value={editingData.data.medico}
                                                        onChange={(e) => setEditingData({
                                                            ...editingData,
                                                            data: {...editingData.data, medico: e.target.value}
                                                        })}/>
                                                </div>
                                                <div>
                                                    <Label>Observaciones</Label>
                                                    <Textarea value={editingData.data.observaciones}
                                                            onChange={(e) => setEditingData({
                                                                ...editingData,
                                                                data: {
                                                                    ...editingData.data,
                                                                    observaciones: e.target.value
                                                                }
                                                            })} rows={3}/>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => {
                                                        setEditingId(null);
                                                        setEditingData(null)
                                                    }}>Cancelar</Button>
                                                    <Button className="flex-1" onClick={handleSaveEdit}>Guardar</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <AlertDialogContent role="alertdialog" aria-labelledby="delete-title"
                                        aria-describedby="delete-desc">
                        <AlertDialogHeader>
                            <AlertDialogTitle id="delete-title">Eliminar Registro</AlertDialogTitle>
                            <AlertDialogDescription id="delete-desc">¿Está seguro de que desea eliminar este registro?
                                Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2">
                            <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm.type, deleteConfirm.id)}
                            >
                                Eliminar
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </main>
    )
}