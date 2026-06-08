"use client"

import type React from "react"
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
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {ArrowLeft, FileText, Download, BarChart, Save, Trash2, FileDown, Printer, Plus, Eye} from 'lucide-react'
import {useToast} from "@/hooks/use-toast"
import {Separator} from "@/components/ui/separator"
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
            const response = await fetch(`/api/reportes/historial`)
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
        setFormData({
            ...formData,
            tipoReporte: typeId,
        })
        setOpenNewDialog(true)
    }

    const updateFormField = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: value,
        })
    }

    const handleGuardarReporte = async () => {
        try {
            if (!formData.tipoReporte || !formData.asunto) {
                toast({title: "Error", description: "Complete los campos obligatorios", variant: "destructive"})
                return
            }

            setLoading(true)
            const response = await fetch(`${API_URL}/api/reportes/guardar`, {
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
                const data = await response.json()
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
            console.error("[v0] Error guardando reporte:", error)
            toast({title: "Error", description: "No se pudo guardar el reporte", variant: "destructive"})
        } finally {
            setLoading(false)
        }
    }

    const handleEliminarReporte = async () => {
        if (!selectedReport?.id) return

        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/reportes/${selectedReport.id}`, {
                method: "DELETE",
            })

            if (response.ok) {
                toast({title: "Éxito", description: "Reporte eliminado correctamente", variant: "destructive"})
                loadSavedReports()
                setOpenViewDialog(false)
                setSelectedReport(null)
            }
        } catch (error) {
            console.error("[v0] Error eliminando reporte:", error)
            toast({title: "Error", description: "No se pudo eliminar el reporte", variant: "destructive"})
        } finally {
            setLoading(false)
        }
    }

    const handleExportarReporte = async (formato: string) => {
        if (!selectedReport?.id) return

        try {
            const response = await fetch(`${API_URL}/api/reportes/${selectedReport.id}/exportar/${formato}`)
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
            console.error("[v0] Error exportando:", error)
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
        <div className="min-h-screen bg-background p-6">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Panel de Reportes</h1>
                        <p className="text-muted-foreground">Estadísticas y gráficos de la institución</p>
                    </div>
                </div>

                {/* Sección Generar Nuevo Reporte */}
                <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Plus className="h-5 w-5"/>
                            Generar Nuevo Reporte
                        </CardTitle>
                        <CardDescription>Selecciona el tipo de reporte que deseas crear</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tiposReporte.map((tipo) => (
                                <Card
                                    key={tipo.id}
                                    className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
                                    onClick={() => handleSelectReportType(tipo.id)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <FileText className="h-5 w-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{tipo.nombre}</CardTitle>
                                                <CardDescription
                                                    className="text-xs">{tipo.descripcion}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button size="sm" className="w-full gap-2">
                                            <Plus className="h-4 w-4"/>
                                            Crear
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Dialog para crear/editar reporte */}
                <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedReportType
                                    ? tiposReporte.find((t) => t.id === selectedReportType)?.nombre
                                    : "Nuevo Reporte"}
                            </DialogTitle>
                            <DialogDescription>Complete todos los campos del reporte</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Información General</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha del reporte</Label>
                                        <Input
                                            type="date"
                                            value={formData.fecha}
                                            onChange={(e) => updateFormField("fecha", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Período</Label>
                                        <Select value={formData.periodo}
                                                onValueChange={(v) => updateFormField("periodo", v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="actual">Actual</SelectItem>
                                                <SelectItem value="mes">Este mes</SelectItem>
                                                <SelectItem value="trimestre">Este trimestre</SelectItem>
                                                <SelectItem value="anio">Este año</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Asunto del informe *</Label>
                                    <Input
                                        placeholder="Ej: Informe mensual de población carcelaria"
                                        value={formData.asunto}
                                        onChange={(e) => updateFormField("asunto", e.target.value)}
                                    />
                                </div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Personal a Cargo</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre completo</Label>
                                        <Input
                                            placeholder="Nombre del responsable"
                                            value={formData.personalCargo}
                                            onChange={(e) => updateFormField("personalCargo", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cargo</Label>
                                        <Input
                                            placeholder="Ej: Director, Subdirector"
                                            value={formData.cargoPersonal}
                                            onChange={(e) => updateFormField("cargoPersonal", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Observaciones</h3>
                                <Textarea
                                    placeholder="Ingrese observaciones relevantes..."
                                    rows={4}
                                    value={formData.observaciones}
                                    onChange={(e) => updateFormField("observaciones", e.target.value)}
                                />
                            </div>

                            <Separator/>

                            <div className="space-y-2">
                                <Label>Formato de exportación</Label>
                                <Select value={formData.formato} onValueChange={(v) => updateFormField("formato", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar formato"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="excel">Excel</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4">
                                <Button onClick={handleGuardarReporte} disabled={loading} className="gap-2">
                                    <Save className="h-4 w-4"/>
                                    Guardar
                                </Button>
                                <Button variant="outline" onClick={() => setOpenNewDialog(false)} className="gap-2">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Sección de Estadísticas */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Estadísticas Generales</CardTitle>
                        <CardDescription>Resumen de la población carcelaria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Gráfico de Barras - Población por Pabellón */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Población por Pabellón</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={datoPoblacionPabellones}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                        <XAxis dataKey="nombre" stroke="#9ca3af"/>
                                        <YAxis stroke="#9ca3af"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                        <Legend/>
                                        <Bar dataKey="internos" fill="#3b82f6" name="Internos" radius={[8, 8, 0, 0]}/>
                                        <Bar dataKey="capacidad" fill="#10b981" name="Capacidad" radius={[8, 8, 0, 0]}/>
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico de Línea - Tendencia de Población */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Tendencia de Población</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={datoPoblacionTendencia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                        <XAxis dataKey="mes" stroke="#9ca3af"/>
                                        <YAxis stroke="#9ca3af"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                        <Legend/>
                                        <Line
                                            type="monotone"
                                            dataKey="internos"
                                            stroke="#a855f7"
                                            name="Internos"
                                            strokeWidth={2}
                                            dot={{fill: "#a855f7", r: 5}}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico Circular - Incidentes */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Incidentes por Tipo</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={datoIncidentes}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="cantidad"
                                        >
                                            {datoIncidentes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill}/>
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico de Anillo - Estado de Salud */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Estado de Salud de
                                    Internos</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={datoSalud}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="valor"
                                        >
                                            {datoSalud.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill}/>
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                        <Legend/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico de Barras - Movimientos por Semana */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Traslados por Semana</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={datoMovimientos}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                        <XAxis dataKey="semana" stroke="#9ca3af"/>
                                        <YAxis stroke="#9ca3af"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                        <Bar dataKey="traslados" fill="#f97316" radius={[8, 8, 0, 0]}/>
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gráfico de Línea - Reincidencia */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Análisis de Reincidencia</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={datoReincidencia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                        <XAxis dataKey="rango" stroke="#9ca3af"/>
                                        <YAxis stroke="#9ca3af"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                                color: "#f3f4f6",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="reincidentes"
                                            stroke="#ec4899"
                                            strokeWidth={3}
                                            dot={{fill: "#ec4899", r: 5}}
                                            activeDot={{r: 7}}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sección de Reportes Guardados */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5"/>
                            Reportes Guardados
                        </CardTitle>
                        <CardDescription>Historial de reportes generados anteriormente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Cargando reportes...</div>
                        ) : savedReports.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay reportes guardados. Crea uno nuevo para comenzar.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {savedReports.map((report) => (
                                    <Card key={report.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base line-clamp-2">{report.asunto}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {report.fecha} • {report.tipoReporte}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 gap-1"
                                                    onClick={() => {
                                                        setSelectedReport(report)
                                                        setOpenViewDialog(true)
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3"/>
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                    onClick={() => handleExportarReporte(report.formato)}
                                                >
                                                    <Download className="h-3 w-3"/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog para ver reporte guardado */}
                <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedReport?.asunto}</DialogTitle>
                            <DialogDescription>Fecha: {selectedReport?.fecha}</DialogDescription>
                        </DialogHeader>

                        {selectedReport && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tipo de Reporte</Label>
                                        <p className="font-medium">{selectedReport.tipoReporte}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Formato</Label>
                                        <p className="font-medium">{selectedReport.formato.toUpperCase()}</p>
                                    </div>
                                </div>

                                <Separator/>

                                <div>
                                    <Label className="text-xs text-muted-foreground">Observaciones</Label>
                                    <p className="text-sm mt-2">{selectedReport.datos.observaciones || "Sin observaciones"}</p>
                                </div>

                                <Separator/>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => handleExportarReporte("pdf")}
                                        className="gap-2"
                                        variant="default"
                                    >
                                        <FileDown className="h-4 w-4"/>
                                        Exportar PDF
                                    </Button>
                                    <Button
                                        onClick={() => handleExportarReporte("excel")}
                                        className="gap-2"
                                        variant="outline"
                                    >
                                        <Download className="h-4 w-4"/>
                                        Exportar Excel
                                    </Button>
                                    <Button
                                        onClick={handleImprimirReporte}
                                        className="gap-2"
                                        variant="outline"
                                    >
                                        <Printer className="h-4 w-4"/>
                                        Imprimir
                                    </Button>
                                    <Button
                                        onClick={handleEliminarReporte}
                                        className="gap-2"
                                        variant="destructive"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                        Eliminar
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
