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
import {Badge} from "@/components/ui/badge"
import {ArrowLeft, FileText, Download, BarChart, Save, Trash2, FileDown, Printer, Plus, Eye, Users, Activity, AlertCircle, Pill} from 'lucide-react'
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
    BarChart as RechartsBarChart,
    Bar,
} from "recharts"

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

const tiposReporte = [
    {id: "poblacion", nombre: "Reporte de Población", descripcion: "Estadísticas de internos por pabellón"},
    {id: "reincidencia", nombre: "Reporte de Reincidencia", descripcion: "Análisis de casos de reincidencia"},
    {id: "salud", nombre: "Reporte de Salud", descripcion: "Estado de salud general de internos"},
    {id: "movimientos", nombre: "Reporte de Movimientos", descripcion: "Traslados y movimientos registrados"},
    {id: "incidentes", nombre: "Reporte de Incidentes", descripcion: "Incidentes de seguridad registrados"},
    {id: "capacidad", nombre: "Reporte de Capacidad", descripcion: "Análisis de ocupación por pabellón"},
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

    // --- ESTADO PARA GRÁFICOS CON DATOS REALES ---
    const [datoPoblacionPabellones, setDatoPoblacionPabellones] = useState<any[]>([])
    const [datoIncidentes, setDatoIncidentes] = useState<any[]>([])
    const [datoPrioridades, setDatoPrioridades] = useState<any[]>([])
    const [chartsLoading, setChartsLoading] = useState(false)

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
        loadChartsData()
    }, [])

    const loadChartsData = async () => {
        try {
            setChartsLoading(true)
            
            // --- CARGAR POBLACIÓN POR PABELLÓN ---
            try {
                const poblacionRes = await authFetch(`${API_URL}/reportes/poblacion`)
                if (poblacionRes.ok) {
                    const data = await poblacionRes.json()
                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        const capacidades: {[key: string]: number} = {
                            A: 50, B: 45, C: 40, D: 45
                        }
                        const poblacionFormato = data.data.map((item: any) => {
                            const pab = item.pabellon || item.Pabellon || item.nombre || "Desconocido"
                            return {
                                nombre: `Pab. ${pab}`,
                                internos: parseInt(item.cantidad) || item.count || 0,
                                capacidad: capacidades[pab] || 50
                            }
                        })
                        setDatoPoblacionPabellones(poblacionFormato)
                    }
                }
            } catch (e) {
                console.error("Error cargando población:", e)
            }

            // --- CARGAR INCIDENTES POR TIPO ---
            try {
                const incidentesRes = await authFetch(`${API_URL}/reportes/incidentes-estadisticas`)
                if (incidentesRes.ok) {
                    const data = await incidentesRes.json()
                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    // 1. Definimos los colores exactos para cada tipo de falta
                    const mapaColores: { [key: string]: string } = {
                        "Falta grave": "#ef4444", // Rojo
                        "Falta leve": "#eab308",  // Amarillo
                        "Positiva": "#10b981",     // Verde
                    }

                    // 2. Colores secundarios por si la API devuelve otros tipos de incidentes
                    const coloresComodines = ["#6366f1", "#ec4899", "#8b5cf6", "#f97316"]

                    const incidentesFormato = data.data.map((item: any, idx: number) => {
                    const tipo = item.tipo_incidente || item.TipoIncidente || item.nombre || "Otro"
    
                    // 3. Buscamos si el tipo tiene un color asignado, si no, usa un comodín
                    const fill = mapaColores[tipo] || coloresComodines[idx % coloresComodines.length]
                        return {
                            tipo: tipo,
                            cantidad: parseInt(item.cantidad) || item.count || 0,
                            fill: fill
                        }
                        })
                        setDatoIncidentes(incidentesFormato)
                        }
                    }
                } catch (e) {
                console.error("Error cargando incidentes:", e)
            }
            
            // --- CARGAR PRIORIDADES DE REVISIONES MÉDICAS ---
            try {
                const prioridadesRes = await authFetch(`${API_URL}/medico/prioridades-estadisticas`)
                if (prioridadesRes.ok) {
                    const data = await prioridadesRes.json()
                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        const coloresPrioridad: {[key: string]: string} = {
                            "Urgente": "#ef4444",
                            "Alta": "#f97316",
                            "Media": "#eab308",
                            "Baja": "#22c55e"
                        }
                        
                        const prioridadesFormato = data.data.map((item: any) => {
                            const prioridad = item.prioridad || item.Prioridad || "Desconocida"
                            return {
                                prioridad: prioridad,
                                valor: parseInt(item.cantidad) || item.count || 0,
                                fill: coloresPrioridad[prioridad] || "#64748b"
                            }
                        })
                        
                        setDatoPrioridades(prioridadesFormato)
                    }
                }
            } catch (e) {
                console.error("Error cargando prioridades:", e)
            }
        } catch (error) {
            console.error("Error general cargando gráficos:", error)
        } finally {
            setChartsLoading(false)
        }
    }

    const loadSavedReports = async () => {
        try {
            setLoading(true)
            // Los reportes guardados se cargan desde una API de historial
            // Por ahora, inicializamos un array vacío
            // En el futuro, conectar con: GET /api/reportes/historial
            setSavedReports([])
        } catch (error) {
            console.error("Error cargando reportes guardados:", error)
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
                        <div className="flex items-center gap-4">
                            <BarChart className="h-14 w-14 text-purple-400 shrink-0" />
                            <div>
                                <h1 className="text-3xl font-black tracking-wide text-white">Panel de Reportes</h1>
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Estadísticas y Analíticas del Sistema</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN: ESTADÍSTICAS GENERALES (GRÁFICOS) --- */}
                <Card className="sgc-card border-0 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 pb-4">
                        <CardTitle className="text-xl text-white">Visualización de datos en tiempo real</CardTitle>
                        <CardDescription className="text-slate-400 text-[15px]">Resumen consolidado de la población y estado de la carceleta</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {chartsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <div className="inline-block">
                                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
                                    </div>
                                    <p className="text-slate-400">Cargando gráficos...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Gráfico 1 - Población por Pabellón */}
                                <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-400"/> Ocupación por Pabellón
                                    </h3>
                                    {datoPoblacionPabellones.length > 0 ? (
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
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                                            <p className="text-sm">Sin datos disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {/* Gráfico 2 - Tendencia de Población */}
                                <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-purple-400"/> Indicador de Capacidad
                                    </h3>
                                    {datoPoblacionPabellones.length > 0 ? (
                                        <div className="space-y-6 px-2 h-[280px] flex flex-col justify-center">
                                            {datoPoblacionPabellones.map((pab, idx) => {
                                                const porcentaje = Math.round((pab.internos / pab.capacidad) * 100)
                                                const colorBar = porcentaje >= 90 ? "bg-red-500" : porcentaje >= 75 ? "bg-yellow-500" : "bg-green-500"
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                                                            <span className="text-sm font-medium text-slate-300">{pab.nombre}</span>
                                                            <span className="font-bold text-white">{porcentaje}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${colorBar}`} style={{width: `${porcentaje}%`}}/>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                                            <p className="text-sm">Sin datos disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {/* Gráfico 3 - Incidentes */}
                                <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-400"/> Distribución de Incidentes
                                    </h3>
                                    {datoIncidentes.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie 
                                                    data={datoIncidentes} 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    labelLine={false} 
                                                    nameKey="tipo" 
                                                    dataKey="cantidad"
                                                    label={({ name }: { name?: string }) => `${name || 'Desconocido'}`} 
                                                    outerRadius={90} 
                                                    fill="#8884d8" 
                                                    stroke="#060a12" 
                                                    strokeWidth={2}
                                                >
                                                    {datoIncidentes.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill}/> ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }} 
                                                    formatter={(value) => [`${value} casos`, 'Cantidad']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                                            <p className="text-sm">Sin datos disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {/* Gráfico 4 - Prioridades de Revisiones Médicas */}
                                <div className="bg-[#060a12]/50 rounded-xl p-5 border border-slate-800/80 shadow-inner">
                                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                                        <Pill className="h-4 w-4 text-purple-400"/> Prioridades de Revisiones Médicas
                                    </h3>
                                    {datoPrioridades.length > 0 ? (
                                        <div className="flex flex-col items-center">
                                            <ResponsiveContainer width="100%" height={220}>
                                                <PieChart>
                                                    <Pie 
                                                        data={datoPrioridades} 
                                                        cx="50%" 
                                                        cy="50%" 
                                                        innerRadius={50} 
                                                        outerRadius={80} 
                                                        dataKey="valor" 
                                                        nameKey="prioridad"
                                                        stroke="#060a12" 
                                                        strokeWidth={2}
                                                        label={({ percent }: { percent?: number }) => {
                                                            return `${((percent || 0) * 100).toFixed(1)}%`;}}
                                                        labelLine={false}>{datoPrioridades.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill}/> ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }} formatter={(value) => [`${value} revisiones`, 'Total']}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="mt-4 flex flex-wrap gap-4 justify-center">
                                                {datoPrioridades.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.fill}}/>
                                                        <span className="text-sm text-slate-400">{item.prioridad}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                                            <p className="text-sm">Sin datos disponibles</p>
                                        </div>
                                    )}
                                </div>
                                </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- SECCIÓN: GENERAR NUEVO REPORTE --- */}
                <Card className="sgc-card border-0 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                            <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30">
                                <Plus className="h-5 w-5 text-blue-400"/>
                            </div>Generar Nuevo Reporte
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-[15px]">Selecciona el módulo de datos que deseas procesar</CardDescription>
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
                        <CardDescription className="text-slate-400 text-[15px]">Documentos generados y almacenados en la base de datos</CardDescription>
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
