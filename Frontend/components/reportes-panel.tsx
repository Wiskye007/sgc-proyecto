"use client"    
import {useState, useEffect} from "react"
import {useRouter} from 'next/navigation'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,} 
    from "@/components/ui/dialog"
import {Separator} from "@/components/ui/separator"
import {Badge} from "@/components/ui/badge" // <--- Agregado aquí
import {ArrowLeft, FileText, Download, BarChart, Save, Trash2, FileDown, Printer, Plus, Eye, Users, Activity, AlertCircle, Pill} from 'lucide-react' // <--- Actualizado aquí
import {useToast} from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth"
import {
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
} from "recharts"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api/reportes"
    : "http://localhost:5000/api/reportes";

const tiposReporte = [
    {id: "poblacion", nombre: "Reporte de Población", descripcion: "Estadísticas de internos por pabellón"},
    {id: "reincidencia", nombre: "Reporte de Reincidencia", descripcion: "Análisis de casos de reincidencia"},
    {id: "salud", nombre: "Reporte de Salud", descripcion: "Estado de salud general de internos"},
    {id: "movimientos", nombre: "Reporte de Movimientos", descripcion: "Traslados y movimientos registrados"},
    {id: "incidentes", nombre: "Reporte de Incidentes", descripcion: "Incidentes de seguridad registrados"},
    {id: "capacidad", nombre: "Reporte de Capacidad", descripcion: "Análisis de ocupación por pabellón"},
]

// --- DATOS SIMULADOS ---
const datoPoblacionPabellones = [
    {nombre: "Pab. A", internos: 42, capacidad: 50},
    {nombre: "Pab. B", internos: 38, capacidad: 45},
    {nombre: "Pab. C", internos: 35, capacidad: 40},
    {nombre: "Pab. D", internos: 33, capacidad: 45},
    ]
const datoPoblacionTendencia = [
    {mes: "Ago", internos: 145},
    {mes: "Sep", internos: 152},
    {mes: "Oct", internos: 158},
    {mes: "Nov", internos: 148},
    ]
const datoIncidentes = [
    {tipo: "Peleas", cantidad: 12, fill: "#ef4444"},
    {tipo: "Agresiones", cantidad: 8, fill: "#f97316"},
    {tipo: "Contrabando", cantidad: 6, fill: "#eab308"},
    {tipo: "Otros", cantidad: 4, fill: "#6366f1"},
    ]
const datoSalud = [
    {categoria: "Sanos", valor: 115, fill: "#22c55e"},
    {categoria: "En tratamiento", valor: 42, fill: "#3b82f6"},
    {categoria: "Derivados", valor: 11, fill: "#f59e0b"},
    ]
const datoMovimientos = [
    {semana: "Sem 1", traslados: 15},
    {semana: "Sem 2", traslados: 18},
    {semana: "Sem 3", traslados: 12},
    {semana: "Sem 4", traslados: 21},
    ]
const datoReincidencia = [
    {rango: "1-5 años", reincidentes: 18},
    {rango: "6-10 años", reincidentes: 25},
    {rango: "11-15 años", reincidentes: 14},
    {rango: "16+ años", reincidentes: 9},
]

interface ReportForm {
    id?: string
    tipoReporte: string
    fecha: string
    asunto: string
    periodo: string
    personalCargo: string
    cargoPersonal: string
    observaciones: string
    formato: string
        [key: string]: string | undefined
}

interface SavedReport {
    id: string
    tipoReporte: string
    asunto: string
    fecha: string
    formato: string
    datos: ReportForm
}

export default function ReportesPanel() {
    const router = useRouter()
    const {toast} = useToast()

    const [selectedReportType, setSelectedReportType] = useState<string | null>(null)
    const [openNewDialog, setOpenNewDialog] = useState(false)
    const [openViewDialog, setOpenViewDialog] = useState(false)
    const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null)
    const [savedReports, setSavedReports] = useState<SavedReport[]>([])
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState<ReportForm>({
        tipoReporte: "",
        fecha: new Date().toISOString().split("T")[0],
        asunto: "",
        periodo: "",
        personalCargo: "",
        cargoPersonal: "",
        observaciones: "",
        formato: "pdf",
    })

    useEffect(() => {
        loadSavedReports()
    }, [])

    const loadSavedReports = async () => {
        try {
            setLoading(true)
            const response = await authFetch(`${API_URL}/historial`)
            if (response.ok) {
                const data = await response.json()
                setSavedReports(data.data || [])
            }
        } catch (error) {
            console.error("[v0] Error cargando reportes:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectReportType = (typeId: string) => {
        setSelectedReportType(typeId)
        setFormData({ ...formData, tipoReporte: typeId })
        setOpenNewDialog(true)
    }

    const updateFormField = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleGuardarReporte = async () => {
        try {
            if (!formData.tipoReporte || !formData.asunto) {
                toast({title: "Error", description: "Complete los campos obligatorios", variant: "destructive"})
                return
            }

            setLoading(true)
            const response = await authFetch(`${API_URL}/guardar`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    tipoReporte: formData.tipoReporte,
                    asunto: formData.asunto,
                    fecha: formData.fecha,
                    personalCargo: formData.personalCargo,
                    cargoPersonal: formData.cargoPersonal,
                    observaciones: formData.observaciones,
                    datos: formData,
                }),
            })

            if (response.ok) {
            toast({title: "Éxito", description: "Reporte guardado correctamente"})
                loadSavedReports()
                setOpenNewDialog(false)
                setFormData({
                    tipoReporte: "",
                    fecha: new Date().toISOString().split("T")[0],
                    asunto: "",
                    periodo: "",
                    personalCargo: "",
                    cargoPersonal: "",
                    observaciones: "",
                    formato: "pdf",
                })
            } else {
                throw new Error("Error al guardar")
            }
            } catch (error) {
            toast({title: "Error", description: "No se pudo guardar el reporte", variant: "destructive"})
        } finally {
            setLoading(false)
        }
    }

    const handleEliminarReporte = async () => {
            if (!selectedReport?.id) return
        try {
            setLoading(true)
            const response = await authFetch(`${API_URL}/${selectedReport.id}`, { method: "DELETE" })
            if (response.ok) {
                toast({title: "Eliminado", description: "Reporte eliminado correctamente"})
                loadSavedReports()
                setOpenViewDialog(false)
                setSelectedReport(null)
            }
            } catch (error) {
            toast({title: "Error", description: "No se pudo eliminar el reporte", variant: "destructive"})
        } finally {
            setLoading(false)
        }
    }

    const handleExportarReporte = async (formato: string) => {
        if (!selectedReport?.id) return
            try {
            const response = await authFetch(`${API_URL}/${selectedReport.id}/exportar/${formato}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `reporte_${selectedReport.asunto}_${Date.now()}.${formato}`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast({title: "Éxito", description: `Reporte exportado en ${formato.toUpperCase()}`})
            }
        } catch (error) {
        toast({title: "Error", description: "No se pudo exportar el reporte", variant: "destructive"})
        }
    }

    const handleImprimirReporte = () => {
        if (!selectedReport) return
        const printContent = JSON.stringify(selectedReport.datos, null, 2)
        const printWindow = window.open("", "", "width=800,height=600")
        if (printWindow) {
            printWindow.document.write(`<pre>${printContent}</pre>`)
            printWindow.document.close()
            printWindow.print()
        }
    }

    return (
        <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
            <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
                
                {/* --- HEADER DEL PANEL DE REPORTES --- */}
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
                                <BarChart className="h-7 w-7 text-blue-400" /> Panel de Reportes
                            </h1>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Estadísticas y Analíticas del Sistema</p>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN: ESTADÍSTICAS GENERALES (GRÁFICOS) --- */}
                <Card className="sgc-card border-0 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 pb-4">
                        <CardTitle className="text-xl text-white">Visualización de datos en tiempo real</CardTitle>
                        <CardDescription className="text-slate-400">Resumen consolidado de la población y estado de la carceleta</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Gráfico 1 - Población por Pabellón */}
                            <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-400"/> Ocupación por Pabellón
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RechartsBarChart data={datoPoblacionPabellones}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                                        <XAxis dataKey="nombre" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <Tooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }}/>
                                        <Legend wrapperStyle={{paddingTop: "20px"}}/>
                                        <Bar dataKey="internos" fill="#3b82f6" name="Internos" radius={[4, 4, 0, 0]}/>
                                        <Bar dataKey="capacidad" fill="#10b981" name="Capacidad" radius={[4, 4, 0, 0]}/>
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico 2 - Tendencia de Población */}
                            <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-purple-400"/> Tendencia de Población
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={datoPoblacionTendencia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                                        <XAxis dataKey="mes" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }}/>
                                        <Legend wrapperStyle={{paddingTop: "20px"}}/>
                                        <Line type="monotone" dataKey="internos" stroke="#a855f7" name="Total Internos" strokeWidth={3} dot={{fill: "#a855f7", r: 4, strokeWidth: 2}} activeDot={{r: 6}}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico 3 - Incidentes */}
                            <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-400"/> Distribución de Incidentes
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={datoIncidentes} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`} outerRadius={90} fill="#8884d8" dataKey="cantidad" stroke="#060a12" strokeWidth={2}>
                                            {datoIncidentes.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill}/> ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico 4 - Salud */}
                            <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-green-400"/> Estado de Salud Global
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={datoSalud} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="valor" stroke="none">
                                            {datoSalud.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill}/> ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }}/>
                                        <Legend wrapperStyle={{paddingTop: "20px"}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            </div>
                    </CardContent>
                </Card>

                {/* --- SECCIÓN: GENERAR NUEVO REPORTE --- */}
                <Card className="sgc-card border-0 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                            <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30">
                                <Plus className="h-5 w-5 text-blue-400"/>
                            </div>
                            Generar Nuevo Reporte
                        </CardTitle>
                        <CardDescription className="text-slate-400">Selecciona el módulo de datos que deseas procesar</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {tiposReporte.map((tipo) => (
                                <Card
                                    key={tipo.id}
                                    className="bg-[#060a12]/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-800/40 cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                    onClick={() => handleSelectReportType(tipo.id)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-xl bg-[#0a0f1a] p-3 border border-slate-800 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors shadow-inner">
                                                <FileText className="h-6 w-6 text-blue-400"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-base text-slate-200 group-hover:text-white transition-colors">{tipo.nombre}</CardTitle>
                                                <CardDescription className="text-xs text-slate-500 mt-1">{tipo.descripcion}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="w-full h-9 rounded-lg flex items-center justify-center gap-2 bg-slate-800/50 text-slate-400 font-semibold border border-slate-700/50 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 text-sm">
                                            <Plus className="h-4 w-4"/> Configurar Reporte
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* --- SECCIÓN: REPORTES GUARDADOS --- */}
                <Card className="sgc-card border-0 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700">
                                <Save className="h-5 w-5 text-slate-300"/>
                            </div>
                            Registro de Reportes Emitidos
                        </CardTitle>
                        <CardDescription className="text-slate-400">Documentos generados y almacenados en la base de datos</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400 animate-pulse">Consultando base de datos...</div>
                        ) : savedReports.length === 0 ? (
                            <div className="text-center py-12 bg-[#060a12]/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
                                No se encontraron documentos. Genere un nuevo reporte para visualizarlo aquí.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {savedReports.map((report) => (
                                    <Card key={report.id} className="bg-[#0a0f1a] border border-slate-800 shadow-lg hover:border-slate-600 transition-all">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base text-slate-200 line-clamp-2 leading-snug">{report.asunto}</CardTitle>
                                            <CardDescription className="text-xs text-blue-400/80 font-medium mt-1">
                                                {report.fecha} <span className="text-slate-600 mx-1">|</span> {report.tipoReporte.toUpperCase()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border-0 h-9"
                                                    onClick={() => { setSelectedReport(report); setOpenViewDialog(true); }}>
                                                    <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-400"/> Ver
                                                </Button>
                                                <Button size="sm" className="flex-1 sgc-btn-secondary h-9 border-slate-700"
                                                    onClick={() => handleExportarReporte(report.formato)}>
                                                    <Download className="h-3.5 w-3.5 mr-1.5"/> Bajar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ========================================================================= */}
                {/* DIALOG: GENERAR NUEVO REPORTE (FORMULARIO) */}
                {/* ========================================================================= */}
                <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="border-b border-slate-800/80 pb-4">
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-400"/>
                                {selectedReportType ? tiposReporte.find((t) => t.id === selectedReportType)?.nombre : "Nuevo Reporte"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs mt-1">Complete los parámetros requeridos para la extracción de datos.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 pt-2">
                            <div className="space-y-4">
                                <h3 className="font-bold tracking-widest text-slate-500 uppercase text-xs">I. Parámetros del Documento</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="sgc-label">Fecha de Emisión</Label>
                                        <Input type="date" className="sgc-input h-11" value={formData.fecha} onChange={(e) => updateFormField("fecha", e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="sgc-label">Período de Análisis</Label>
                                        <Select value={formData.periodo} onValueChange={(v) => updateFormField("periodo", v)}>
                                            <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                            <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                                <SelectItem value="actual" className="focus:bg-blue-600 focus:text-white">Estado Actual</SelectItem>
                                                <SelectItem value="mes" className="focus:bg-blue-600 focus:text-white">Este mes</SelectItem>
                                                <SelectItem value="trimestre" className="focus:bg-blue-600 focus:text-white">Este trimestre</SelectItem>
                                                <SelectItem value="anio" className="focus:bg-blue-600 focus:text-white">Este año</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Asunto / Título del Informe *</Label>
                                    <Input className="sgc-input h-11" placeholder="Ej: Informe de incidencias Pabellón A" value={formData.asunto} onChange={(e) => updateFormField("asunto", e.target.value)} />
                                </div>
                            </div>

                            <Separator className="bg-slate-800/80"/>

                            <div className="space-y-4">
                                <h3 className="font-bold tracking-widest text-slate-500 uppercase text-xs">II. Firmas y Responsables</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="sgc-label">Nombre del Responsable</Label>
                                        <Input className="sgc-input h-11" placeholder="Ej: Cmdt. Juan Pérez" value={formData.personalCargo} onChange={(e) => updateFormField("personalCargo", e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="sgc-label">Cargo Administrativo</Label>
                                        <Input className="sgc-input h-11" placeholder="Ej: Jefe de Seguridad" value={formData.cargoPersonal} onChange={(e) => updateFormField("cargoPersonal", e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-800/80"/>

                            <div className="space-y-4">
                                <h3 className="font-bold tracking-widest text-slate-500 uppercase text-xs">III. Notas Adicionales</h3>
                                <Textarea className="sgc-input" placeholder="Anotaciones que se incluirán al pie del reporte..." rows={3} value={formData.observaciones} onChange={(e) => updateFormField("observaciones", e.target.value)} />
                            </div>

                            <Separator className="bg-slate-800/80"/>

                            <div className="space-y-1.5">
                                <Label className="sgc-label">Formato de Exportación Predeterminado</Label>
                                <Select value={formData.formato} onValueChange={(v) => updateFormField("formato", v)}>
                                    <SelectTrigger className="sgc-input h-11"><SelectValue placeholder="Formato"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200">
                                        <SelectItem value="pdf" className="focus:bg-blue-600 focus:text-white">Documento PDF (.pdf)</SelectItem>
                                        <SelectItem value="excel" className="focus:bg-blue-600 focus:text-white">Hoja de Cálculo (.xlsx)</SelectItem>
                                        <SelectItem value="csv" className="focus:bg-blue-600 focus:text-white">Valores por Comas (.csv)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                                <Button variant="outline" onClick={() => setOpenNewDialog(false)} className="sgc-btn-secondary flex-1 h-11">Cancelar</Button>
                                <Button onClick={handleGuardarReporte} disabled={loading} className="sgc-btn-primary flex-1 h-11">
                                    <Save className="h-4 w-4 mr-2"/> Generar y Guardar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* DIALOG: VISTA PREVIA DEL REPORTE */}
                {/* ========================================================================= */}
                <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="border-b border-slate-800/80 pb-4">
                            <DialogTitle className="text-xl font-bold text-white pr-6 leading-tight">{selectedReport?.asunto}</DialogTitle>
                            <DialogDescription className="text-blue-400 font-mono text-xs mt-1">EMITIDO: {selectedReport?.fecha}</DialogDescription>
                        </DialogHeader>

                        {selectedReport && (
                            <div className="space-y-6 pt-2">
                                <div className="grid grid-cols-2 gap-4 bg-[#060a12]/50 p-4 rounded-xl border border-slate-800">
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Tipo de Reporte</Label>
                                        <p className="text-sm font-medium text-slate-200">{selectedReport.tipoReporte.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Formato Base</Label>
                                        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">{selectedReport.formato.toUpperCase()}</Badge>
                                    </div>
                                    </div>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Observaciones Adjuntas</Label>
                                    <div className="bg-[#0a0f1a] p-4 rounded-lg border border-slate-800/80 text-sm text-slate-300 min-w-20">
                                        {selectedReport.datos.observaciones || <span className="text-slate-600 italic">No se registraron observaciones.</span>}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                                    <Button onClick={() => handleExportarReporte("pdf")} className="sgc-btn-primary flex-1 h-11"><FileDown className="h-4 w-4 mr-2"/> PDF</Button>
                                    <Button onClick={() => handleExportarReporte("excel")} className="sgc-btn-secondary flex-1 h-11 border-slate-700"><Download className="h-4 w-4 mr-2"/> Excel</Button>
                                    <Button onClick={handleImprimirReporte} className="sgc-btn-secondary flex-1 h-11 border-slate-700"><Printer className="h-4 w-4 mr-2"/> Imprimir</Button>
                                    <Button onClick={handleEliminarReporte} className="bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition-colors h-11 px-4 rounded-md">
                                    <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        )
    }