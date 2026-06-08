"use client"

import React, {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Badge} from "@/components/ui/badge"
import {Textarea} from "@/components/ui/textarea"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {ArrowLeft, Search, Plus, Edit2, Printer, Trash2, Download} from 'lucide-react'
import {useToast} from "@/hooks/use-toast"


// --------------------- TIPOS ---------------------
interface Convicto {
    id: number
    nombre: string
    alias?: string
    dni: string
    edad: number
    delito?: string
    pabellon?: string
    celda?: string
    estado?: string
    nivelPeligrosidad?: string
    contacto?: string
    observaciones?: string
    fechaingreso?: string
}

interface Movimiento {
    id: number
    fecha: string
    hora: string
    convictoId: number
    nombre: string
    origen: string
    destino: string
    motivo?: string
    autorizadoPor?: string
}

interface Conducta {
    id: number
    fecha?: string
    convictoId: number
    nombre: string
    tipo: string
    descripcion: string
    sancion?: string
    registrado?: string
}

interface Visita {
    id: number
    fecha: string
    hora: string
    convictoId: number
    nombre: string
    visitante: string
    dniVisitante: string
    parentesco?: string
    estado?: string
    observaciones?: string
}

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `http://${window.location.hostname}:5000/api/convictos` : "http://localhost:5000/api/convictos";

const getFormattedDate = (dateString?: string): string => {
    if (!dateString) return "";
    const parts = dateString.split("/");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    return dateString || "";
}

const ConvictosPanel: React.FC = () => {
    const {toast} = useToast()

    // --------------------- FILTROS ---------------------
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [nivelFilter, setNivelFilter] = useState<string>("todos")
    const [searchMovimientos, setSearchMovimientos] = useState("")
    const [searchConducta, setSearchConducta] = useState("")
    const [searchVisitas, setSearchVisitas] = useState("")

    // --------------------- DIALOGOS ---------------------
    const [openNuevoConvicto, setOpenNuevoConvicto] = useState(false)
    const [openNuevoMovimiento, setOpenNuevoMovimiento] = useState(false)
    const [openNuevaConducta, setOpenNuevaConducta] = useState(false)
    const [openNuevaVisita, setOpenNuevaVisita] = useState(false)

    // editingData: { type: "convicto" | "movimiento" | "conducta" | "visita", data: any }
    const [editingData, setEditingData] = useState<{ type: string; data: any } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null)

    // --------------------- LISTAS ---------------------
    const [convictosData, setConvictosData] = useState<Convicto[]>([])
    const [movimientosData, setMovimientosData] = useState<Movimiento[]>([])
    const [conductaData, setConductaData] = useState<Conducta[]>([])
    const [visitasData, setVisitasData] = useState<Visita[]>([])

    // --------------------- FORMULARIOS (crear) ---------------------
    const [convictoForm, setConvictoForm] = useState({
        nombre: "", alias: "", dni: "", edad: "", delito: "",
        pabellon: "", celda: "", estado: "", nivel: "",
        contacto: "", observaciones: "", fechaingreso: ""
    })
    const [movimientoForm, setMovimientoForm] = useState({
        convictoId: "",
        origen: "",
        destino: "",
        motivo: "",
        fecha: "",
        hora: "",
        autorizadoPor: ""
    })
    const [conductaForm, setConductaForm] = useState({
        convictoId: "",
        tipo: "",
        descripcion: "",
        sancion: "",
        fecha: ""
    })
    const [visitaForm, setVisitaForm] = useState({
        convictoId: "",
        visitante: "",
        dniVisitante: "",
        parentesco: "",
        fecha: "",
        hora: "",
        estado: ""
    })

    // --------------------- ERRORES LOCALES / SUBMIT ---------------------
    const [convictoErrors, setConvictoErrors] = useState<Record<string, string>>({})
    const [isSubmittingConvicto, setIsSubmittingConvicto] = useState(false)
    const [isSubmittingMovimiento, setIsSubmittingMovimiento] = useState(false)
    const [isSubmittingConducta, setIsSubmittingConducta] = useState(false)
    const [isSubmittingVisita, setIsSubmittingVisita] = useState(false)
    const [isEditingSubmitting, setIsEditingSubmitting] = useState(false)

    // --------------------- UTILS / VALIDACIONES ---------------------
    const clean = (s: any) => (s ?? "").toString().trim()

    const isHoraValida = (hora: string) => {
        if (!hora) return false
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora)
    }

    const isFechaFutura = (fecha: string) => {
        if (!fecha) return false
        const hoy = new Date().setHours(0, 0, 0, 0)
        const f = new Date(fecha).setHours(0, 0, 0, 0)
        return f > hoy
    }

    const isFechaPasada = (fecha: string) => {
        if (!fecha) return false
        const hoy = new Date().setHours(0, 0, 0, 0)
        const f = new Date(fecha).setHours(0, 0, 0, 0)
        return f < hoy
    }

    const isDNIRepetido = (dni: string, ignoreId?: number) => {
        const d = clean(dni)
        if (!d) return false
        return convictosData.some(c => clean(c.dni) === d && c.id !== ignoreId)
    }

    const numeroValido = (v: any) => {
        const n = Number(v)
        return !Number.isNaN(n)
    }

    // --------------------- CARGA INICIAL ---------------------
    useEffect(() => {
        fetchDatos()
    }, [])

    const fetchDatos = async () => {
        try {
            const [rConv, rMov, rCond, rVis] = await Promise.all([
                fetch(`${API_URL}`),
                fetch(`${API_URL}/movimientos`),
                fetch(`${API_URL}/conducta`),
                fetch(`${API_URL}/visitas`)
            ])
            if (rConv.ok) setConvictosData(await rConv.json())
            if (rMov.ok) setMovimientosData(await rMov.json())
            if (rCond.ok) setConductaData(await rCond.json())
            if (rVis.ok) setVisitasData(await rVis.json())
        } catch (err) {
            console.error(err)
            toast({title: "Error", description: "No se pudieron cargar todos los datos.", variant: "destructive"})
        }
    }

    // --------------------- CREAR CONVICTO ---------------------
    const validarConvictoLocal = () => {
        const errors: Record<string, string> = {}
        const nombre = clean(convictoForm.nombre)
        const dni = clean(convictoForm.dni)
        const edadNum = Number(convictoForm.edad)

        if (!nombre) errors.nombre = "Nombre requerido"
        if (!dni || dni.length < 6) errors.dni = "DNI inválido"
        if (isDNIRepetido(dni)) errors.dni = "DNI ya registrado"
        if (!numeroValido(convictoForm.edad) || edadNum < 18 || edadNum > 120) errors.edad = "Edad entre 18 y 120"
        return errors
    }

    const handleGuardarNuevoConvicto = async (e?: React.FormEvent) => {
        e?.preventDefault()
        setConvictoErrors({})
        const errors = validarConvictoLocal()
        if (Object.keys(errors).length) {
            setConvictoErrors(errors)
            toast({title: "Error", description: "Corrija los campos requeridos.", variant: "destructive"})
            return
        }

        setIsSubmittingConvicto(true)
        try {
            const payload = {
                nombre: clean(convictoForm.nombre),
                alias: clean(convictoForm.alias),
                dni: clean(convictoForm.dni),
                edad: Number(convictoForm.edad),
                delito: clean(convictoForm.delito),
                pabellon: clean(convictoForm.pabellon),
                celda: clean(convictoForm.celda),
                estado: clean(convictoForm.estado),
                nivelPeligrosidad: clean(convictoForm.nivel),
                contacto: clean(convictoForm.contacto),
                observaciones: clean(convictoForm.observaciones),
                fechaingreso: clean(convictoForm.fechaingreso)
            }
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Éxito", description: "Convicto registrado"})
                setOpenNuevoConvicto(false)
                setConvictoForm({
                    nombre: "",
                    alias: "",
                    dni: "",
                    edad: "",
                    delito: "",
                    pabellon: "",
                    celda: "",
                    estado: "",
                    nivel: "",
                    contacto: "",
                    observaciones: "",
                    fechaingreso: ""
                })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "Error al registrar convicto",
                    variant: "destructive"
                })
            }
        } catch (err) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsSubmittingConvicto(false)
        }
    }
    // --------------------- EDITAR (convicto/movimiento/conducta/visita) ---------------------
    const openEdit = (type: string, data: any) => {
        const normalized = {...data}
        if (normalized.convictoId !== undefined && normalized.convictoId !== null) normalized.convictoId = String(normalized.convictoId)
        if (normalized.id !== undefined) normalized.id = normalized.id
        setEditingData({type, data: normalized})
    }

    const handleSaveEdit = async () => {
        if (!editingData) return
        setIsEditingSubmitting(true)
        try {
            const t = editingData.type
            const d = editingData.data

            if (t === "convicto") {
                const id = d.id
                // validaciones
                const nombre = clean(d.nombre)
                const dni = clean(d.dni)
                const edadNum = Number(d.edad)
                if (!nombre) {
                    toast({title: "Error", description: "Nombre requerido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!dni || dni.length < 6) {
                    toast({title: "Error", description: "DNI inválido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (isDNIRepetido(dni, id)) {
                    toast({title: "Error", description: "DNI duplicado", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!numeroValido(d.edad) || edadNum < 18 || edadNum > 120) {
                    toast({title: "Error", description: "Edad inválida", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }

                const payload = {
                    nombre,
                    alias: clean(d.alias),
                    dni,
                    edad: edadNum,
                    delito: clean(d.delito),
                    pabellon: clean(d.pabellon),
                    celda: clean(d.celda),
                    estado: clean(d.estado),
                    nivelPeligrosidad: clean(d.nivel),
                    contacto: clean(d.contacto),
                    observaciones: clean(d.observaciones)
                }
                const res = await fetch(`${API_URL}/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    toast({title: "Actualizado", description: "Registro de convicto actualizado"})
                    setEditingData(null)
                    await fetchDatos()
                } else {
                    const err = await res.json().catch(() => null)
                    toast({title: "Error", description: err?.error || "No se pudo actualizar", variant: "destructive"})
                }
            } else if (t === "movimiento") {
                // PUT /movimientos/:id
                const id = d.id
                if (!d.fecha) {
                    toast({title: "Error", description: "Fecha requerida", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!isHoraValida(d.hora)) {
                    toast({title: "Error", description: "Hora inválida", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.convictoId) {
                    toast({title: "Error", description: "Convicto requerido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (isFechaFutura(d.fecha)) {
                    toast({title: "Error", description: "La fecha no puede ser futura", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (clean(d.origen) === clean(d.destino)) {
                    toast({
                        title: "Error",
                        description: "Origen y destino no pueden ser iguales",
                        variant: "destructive"
                    });
                    setIsEditingSubmitting(false);
                    return
                }

                const payload = {
                    fecha: d.fecha,
                    hora: d.hora,
                    convictoId: Number(d.convictoId),
                    origen: clean(d.origen),
                    destino: clean(d.destino),
                    motivo: clean(d.motivo),
                    autorizadoPor: clean(d.autorizadoPor)
                }
                const res = await fetch(`${API_URL}/movimientos/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    toast({title: "Actualizado", description: "Registro de traslado actualizado"})
                    setEditingData(null)
                    await fetchDatos()
                } else {
                    const err = await res.json().catch(() => null)
                    toast({
                        title: "Error",
                        description: err?.error || "No se pudo actualizar el traslado",
                        variant: "destructive"
                    })
                }
            } else if (t === "conducta") {
                // PUT /conducta/:id
                const id = d.id
                if (!d.convictoId) {
                    toast({title: "Error", description: "Convicto requerido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.tipo) {
                    toast({title: "Error", description: "Tipo requerido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.descripcion || clean(d.descripcion).length < 10) {
                    toast({title: "Error", description: "Descripción mínima 10 caracteres", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (d.fecha && isFechaFutura(d.fecha)) {
                    toast({title: "Error", description: "Fecha no puede ser futura", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }

                const payload = {
                    convictoId: Number(d.convictoId),
                    fecha: d.fecha,
                    tipo: d.tipo,
                    descripcion: clean(d.descripcion),
                    sancion: clean(d.sancion),
                    registrado: clean(d.registrado)
                }
                const res = await fetch(`${API_URL}/conducta/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    toast({title: "Actualizado", description: "Registro de conducta actualizada"})
                    setEditingData(null)
                    await fetchDatos()
                } else {
                    const err = await res.json().catch(() => null)
                    toast({
                        title: "Error",
                        description: err?.error || "No se pudo actualizar conducta",
                        variant: "destructive"
                    })
                }
            } else if (t === "visita") {
                // PUT /visitas/:id
                const id = d.id
                if (!d.convictoId) {
                    toast({title: "Error", description: "Convicto requerido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.visitante || clean(d.visitante).length < 3) {
                    toast({title: "Error", description: "Visitante inválido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.dniVisitante || clean(d.dniVisitante).length < 6) {
                    toast({title: "Error", description: "DNI visitante inválido", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!isHoraValida(d.hora)) {
                    toast({title: "Error", description: "Hora inválida", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (!d.fecha) {
                    toast({title: "Error", description: "Fecha requerida", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }
                if (d.estado === "Programada" && isFechaPasada(d.fecha)) {
                    toast({title: "Error", description: "No puede programar en el pasado", variant: "destructive"});
                    setIsEditingSubmitting(false);
                    return
                }

                const payload = {
                    convictoId: Number(d.convictoId),
                    fecha: d.fecha,
                    hora: d.hora,
                    visitante: clean(d.visitante),
                    dniVisitante: clean(d.dniVisitante),
                    parentesco: clean(d.parentesco),
                    estado: clean(d.estado),
                    observaciones: clean(d.observaciones)
                }
                const res = await fetch(`${API_URL}/visitas/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    toast({title: "Actualizado", description: "Registro de visitas actualizada"})
                    setEditingData(null)
                    await fetchDatos()
                } else {
                    const err = await res.json().catch(() => null)
                    toast({
                        title: "Error",
                        description: err?.error || "No se pudo actualizar visita",
                        variant: "destructive"
                    })
                }
            }
        } catch (err) {
            console.error(err)
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsEditingSubmitting(false)
        }
    }

    // --------------------- CREAR MOVIMIENTO ---------------------
    const handleRegistrarMovimiento = async (e?: React.FormEvent) => {
        e?.preventDefault()
        // validaciones
        if (!movimientoForm.convictoId) {
            toast({title: "Error", description: "Seleccione un convicto", variant: "destructive"});
            return
        }
        if (!movimientoForm.fecha) {
            toast({title: "Error", description: "Fecha requerida", variant: "destructive"});
            return
        }
        if (isFechaFutura(movimientoForm.fecha)) {
            toast({title: "Error", description: "La fecha no puede ser futura", variant: "destructive"});
            return
        }
        if (!isHoraValida(movimientoForm.hora)) {
            toast({title: "Error", description: "Hora inválida", variant: "destructive"});
            return
        }
        if (clean(movimientoForm.origen) === clean(movimientoForm.destino)) {
            toast({title: "Error", description: "Origen y destino no pueden ser iguales", variant: "destructive"});
            return
        }

        setIsSubmittingMovimiento(true)
        try {
            const payload = {
                fecha: movimientoForm.fecha,
                hora: movimientoForm.hora,
                convicto: Number(movimientoForm.convictoId), // backend espera 'convicto' en POST
                origen: clean(movimientoForm.origen),
                destino: clean(movimientoForm.destino),
                motivo: clean(movimientoForm.motivo),
                autorizadoPor: clean(movimientoForm.autorizadoPor) || "Sistema"
            }
            const res = await fetch(`${API_URL}/movimientos`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Éxito", description: "Traslado registrado"})
                setOpenNuevoMovimiento(false)
                setMovimientoForm({
                    convictoId: "",
                    origen: "",
                    destino: "",
                    motivo: "",
                    fecha: "",
                    hora: "",
                    autorizadoPor: ""
                })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "Error al registrar traslado",
                    variant: "destructive"
                })
            }
        } catch (err) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsSubmittingMovimiento(false)
        }
    }

    // --------------------- CREAR CONDUCTA ---------------------
    const handleRegistrarConducta = async (e?: React.FormEvent) => {
        e?.preventDefault()
        // validaciones
        if (!conductaForm.convictoId) {
            toast({title: "Error", description: "Seleccione un convicto", variant: "destructive"});
            return
        }
        if (!conductaForm.tipo) {
            toast({title: "Error", description: "Seleccione tipo", variant: "destructive"});
            return
        }
        if (!conductaForm.descripcion || clean(conductaForm.descripcion).length < 10) {
            toast({title: "Error", description: "Descripción mínima 10 caracteres", variant: "destructive"});
            return
        }
        if (conductaForm.fecha && isFechaFutura(conductaForm.fecha)) {
            toast({title: "Error", description: "Fecha no puede ser futura", variant: "destructive"});
            return
        }

        setIsSubmittingConducta(true)
        try {
            const payload = {
                fecha: conductaForm.fecha || new Date().toISOString().split("T")[0],
                convictoId: Number(conductaForm.convictoId),
                tipo: conductaForm.tipo,
                descripcion: clean(conductaForm.descripcion),
                sancion: clean(conductaForm.sancion) || "Ninguna",
                registrado: "Usuario Actual"
            }
            const res = await fetch(`${API_URL}/conducta`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Éxito", description: "Conducta registrada"})
                setOpenNuevaConducta(false)
                setConductaForm({convictoId: "", tipo: "", descripcion: "", sancion: "", fecha: ""})
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "Error al registrar conducta",
                    variant: "destructive"
                })
            }
        } catch (err) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsSubmittingConducta(false)
        }
    }

    // --------------------- CREAR VISITA ---------------------
    const handleRegistrarVisita = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!visitaForm.convictoId) {
            toast({title: "Error", description: "Seleccione convicto", variant: "destructive"});
            return
        }
        if (!visitaForm.fecha) {
            toast({title: "Error", description: "Fecha requerida", variant: "destructive"});
            return
        }
        if (isFechaPasada(visitaForm.fecha)) {
            toast({title: "Error", description: "No puede programar una visita en el pasado", variant: "destructive"});
            return
        }
        if (!isHoraValida(visitaForm.hora)) {
            toast({title: "Error", description: "Hora inválida", variant: "destructive"});
            return
        }
        if (!visitaForm.visitante || clean(visitaForm.visitante).length < 3) {
            toast({title: "Error", description: "Visitante inválido", variant: "destructive"});
            return
        }
        if (!visitaForm.dniVisitante || clean(visitaForm.dniVisitante).length < 6) {
            toast({title: "Error", description: "DNI inválido", variant: "destructive"});
            return
        }

        setIsSubmittingVisita(true)
        try {
            const payload = {
                fecha: visitaForm.fecha,
                hora: visitaForm.hora,
                convictoId: Number(visitaForm.convictoId),
                visitante: clean(visitaForm.visitante),
                dniVisitante: clean(visitaForm.dniVisitante),
                parentesco: clean(visitaForm.parentesco),
                estado: visitaForm.estado,
                observaciones: ""
            }
            const res = await fetch(`${API_URL}/visitas`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Éxito", description: "Visita programada"})
                setOpenNuevaVisita(false)
                setVisitaForm({
                    convictoId: "",
                    visitante: "",
                    dniVisitante: "",
                    parentesco: "",
                    fecha: "",
                    hora: "",
                    estado: ""
                })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "Error al registrar visita", variant: "destructive"})
            }
        } catch (err) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsSubmittingVisita(false)
        }
    }

    // --------------------- ELIMINAR ---------------------
    const handleDelete = async (type: string, id: number) => {
        let endpoint = ""

        switch (type) {
            case "convicto":
                endpoint = `/${id}`;
                break
            case "movimiento":
                endpoint = `/movimientos/${id}`;
                break
            case "conducta":
                endpoint = `/conducta/${id}`;
                break
            case "visita":
                endpoint = `/visitas/${id}`;
                break
            default:
                return
        }

        try {
            const res = await fetch(`${API_URL}${endpoint}`,
                {method: "DELETE"})

            if (res.ok) {
                toast({
                    title: "Eliminado",
                    description: "Registro eliminado"
                })
                await fetchDatos()

            } else {
                const err = await res.json().catch(() => null)
                toast({
                    title: "Error",
                    description: err?.error || "No se pudo eliminar",
                    variant: "destructive"
                })
            }

        } catch (err) {
            toast({
                title: "Error",
                description: "Error al eliminar",
                variant: "destructive"
            })

        } finally {
            setDeleteConfirm(null)
        }
    }

    // --------------------- UTILIDADES UI ---------------------
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
    }

    const handlePrint = () => window.print()

    // --------------------- FILTRADOS - BÚSQUEDA ---------------------

    const filteredConvictos = convictosData.filter(c => {
        const term = searchTerm.toLowerCase()
        return (
                c.nombre.toLowerCase().includes(term) ||
                clean(c.dni).includes(term) ||
                (c.fechaingreso ?? "").includes(term) ||
                String(c.id).includes(term)) &&
            (estadoFilter === "todos" || c.estado === estadoFilter) &&
            (nivelFilter === "todos" || c.nivelPeligrosidad === nivelFilter)
    })

    const filteredMovimientos = movimientosData.filter(m => {
        const term = searchMovimientos.toLowerCase()
        return String(m.convictoId).includes(term) ||
            (m.origen ?? "").toLowerCase().includes(term) ||
            (m.fecha ?? "").includes(term) ||
            (m.destino ?? "").toLowerCase().includes(term)
    })

    const filteredConducta = conductaData.filter(c => {
        const term = searchConducta.toLowerCase()
        return (
            String(c.convictoId).includes(term) ||
            (c.fecha ?? "").includes(term) ||
            (c.tipo ?? "").toLowerCase().includes(term)
        )
    })

    const filteredVisitas = visitasData.filter(v => {
        const term = searchVisitas.toLowerCase()
        return (
            String(v.convictoId).includes(term) ||
            (v.fecha ?? "").includes(term) ||
            (v.estado ?? "").toLowerCase().includes(term)
        )
    })

    // --------------------- AYUDAS VISUALES ---------------------
    const getNivelColor = (nivel?: string) => {
        if (!nivel) return "bg-green-500/10 text-green-400 border-green-500/20"
        if (nivel === "Máxima") return "bg-red-500/10 text-red-400 border-red-500/20"
        if (nivel === "Alta") return "bg-orange-500/10 text-orange-400 border-orange-500/20"
        if (nivel === "Media") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        return "bg-green-500/10 text-green-400 border-green-500/20"
    }
    const getEstadoColor = (estado?: string) => (estado === "Condenado" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20")
    const getTipoConductaColor = (tipo?: string) => {
        if (tipo === "Positiva") return "bg-green-500/10 text-green-400 border-green-500/20"
        if (tipo === "Falta grave") return "bg-red-500/10 text-red-400 border-red-500/20"
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    }
    const getEstadoVisitaColor = (estado?: string) => {
        const e = estado?.toLowerCase()

        if (e === "realizada" || e === "realizado") {
            return "bg-green-500/10 text-green-400 border-green-500/20"
        }

        if (e === "cancelado" || e === "cancelada") {
            return "bg-red-500/10 text-red-400 border-red-500/20"
        }

        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }

    // --------------------- RENDER ---------------------
    return (
        <main className="min-h-screen bg-background p-6">
            <div className="container mx-auto max-w-7xl">
                {/* header */}
                <div className="flex items-center gap-4 mb-4">
                    <Button aria-label="Botón de regreso al menú principal" variant="outline" size="icon"
                            onClick={() => (window.location.href = "/dashboard")}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Panel de Convictos</h1>
                        <p className="text-muted-foreground">Gestión integral de internos</p>
                    </div>
                </div>

                <Tabs defaultValue="datos" className="w-full">
                    <TabsList className="mb-3 flex w-full">
                        <TabsTrigger value="datos"
                                    className="flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20">Datos
                            Generales</TabsTrigger>
                        <TabsTrigger value="movimientos"
                                    className="flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20">Traslados</TabsTrigger>
                        <TabsTrigger value="conducta"
                                    className="flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20">Conducta</TabsTrigger>
                        <TabsTrigger value="visitas"
                                    className="flex-1 text-center hover:bg-blue-500/20 data-[state=active]:bg-blue-500/20">Visitas</TabsTrigger>
                    </TabsList>

                    {/* ========== CONVICTOS-DATOS GENERALES ========== */}
                    <TabsContent value="datos" className="space-y-4">
                        <section aria-label="Datos generales de convictos" role="region"></section>
                        <Card>
                            <CardHeader className="flex items-center justify-between">
                                <CardTitle className="text-xl py-1">Registro de convictos</CardTitle>
                                <Badge
                                    variant="secondary"
                                    className={
                                        `text-sm px-2 py-1 h-auto
                                        ${convictosData.length > 800 ? "border-red-500 text-red-500 bg-red-500/20" :
                                            convictosData.length > 400 ? "border-yellow-500 text-yellow-500 bg-yellow-500/20"
                                                : "border-green-500 text-green-500 bg-green-500/20"}`}>Registros
                                    totales: {convictosData.length}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="relative md:w-1/3">
                                        <Search className="absolute left-3 top-2 h-5 w-5 text-muted-foreground"/>
                                        <Input aria-label="Búsqueda de registros"
                                            placeholder="Buscar por ID, Nombre, DNI o Fecha de ingreso"
                                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                            className="pl-10"/>
                                    </div>
                                    <div className="flex gap-4 md:w-auto">
                                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                            <SelectTrigger><SelectValue placeholder="Estado"/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todos">Filtro de estados</SelectItem>
                                                <SelectItem value="Procesado">Procesado</SelectItem>
                                                <SelectItem value="Condenado">Condenado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={nivelFilter} onValueChange={setNivelFilter}>
                                            <SelectTrigger><SelectValue placeholder="Peligrosidad"/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todos">Filtro de peligrosidad</SelectItem>
                                                <SelectItem value="Baja">Baja</SelectItem>
                                                <SelectItem value="Media">Media</SelectItem>
                                                <SelectItem value="Alta">Alta</SelectItem>
                                                <SelectItem value="Máxima">Máxima</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setOpenNuevoConvicto(true)}><Plus className="mr-2 h-4 w-4"/> Nuevo
                                Convicto</Button>
                            <Button variant="outline" onClick={() => exportToCSV(convictosData, "convictos")}><Download
                                className="mr-2 h-4 w-4"/> Exportar CSV</Button>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Imprimir</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead
                                                    className="min-w-[70px] text-left bg-purple-600/10 text-white-700 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-[260px] text-left">Nombre
                                                    completo</TableHead>
                                                <TableHead className="min-w-[90px] text-left">Alias</TableHead>
                                                <TableHead className="min-w-[70px] text-left">DNI</TableHead>
                                                <TableHead className="min-w-[80px] text-center">Edad</TableHead>
                                                <TableHead className="min-w-[130px] text-left">Delito</TableHead>
                                                <TableHead className="min-w-[90px] text-center">Pabellón</TableHead>
                                                <TableHead className="min-w-[80px] text-center">Celda</TableHead>
                                                <TableHead className="min-w-[110px] text-center">Estado</TableHead>
                                                <TableHead
                                                    className="min-w-[120px] text-center">Peligrosidad</TableHead>
                                                <TableHead className="min-w-[250px] text-left">Contacto</TableHead>
                                                <TableHead className="min-w-[210px] text-left">Observaciones</TableHead>
                                                <TableHead className="min-w-[170px] text-left">FechaRegistro</TableHead>
                                                <TableHead className="min-w-[80px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredConvictos.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={13}
                                                            className="text-center py-8 text-muted-foreground">No se
                                                        encontraron registros.</TableCell>
                                                </TableRow>) : (filteredConvictos.map(c => (
                                                    <TableRow key={c.id}>
                                                        <TableCell
                                                            className="bg-primary/10 font-bold text-primary bg-purple-600/10 text-white-700 font-bold">{c.id}</TableCell>
                                                        <TableCell className="font-medium">{c.nombre}</TableCell>
                                                        <TableCell
                                                            className="text-muted-foreground text-sm">{c.alias}</TableCell>
                                                        <TableCell>{c.dni}</TableCell>
                                                        <TableCell className="text-center">{c.edad}</TableCell>
                                                        <TableCell>{c.delito}</TableCell>
                                                        <TableCell className="text-center">{c.pabellon}</TableCell>
                                                        <TableCell className="text-center">{c.celda}</TableCell>
                                                        <TableCell className="text-center"><Badge variant="outline"
                                                                    className={getEstadoColor(c.estado)}>{c.estado}</Badge></TableCell>
                                                        <TableCell className="text-center"><Badge variant="outline"
                                                                    className={getNivelColor(c.nivelPeligrosidad)}>{c.nivelPeligrosidad}</Badge></TableCell>
                                                        <TableCell className="text-xs">{c.contacto}</TableCell>
                                                        <TableCell
                                                            className="text-s max-w-[100px] truncate text-muted-foreground">{c.observaciones}</TableCell>
                                                        <TableCell className="text-left">{c.fechaingreso}</TableCell>
                                                        <TableCell className="flex gap-2">
                                                            <Button size="sm" variant="outline"
                                                                    onClick={() => openEdit("convicto", c)}
                                                                    aria-label="Editar registro de convicto"><Edit2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                            <Button size="sm" variant="destructive"
                                                                    onClick={() => setDeleteConfirm({
                                                                        type: "convicto",
                                                                        id: c.id
                                                                    })}
                                                                    aria-label="Eliminar registro de convicto"><Trash2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        {/* ---------- DIALOG: NUEVO CONVICTO ---------- */}
                        <Dialog open={openNuevoConvicto} onOpenChange={setOpenNuevoConvicto}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Nuevo registro de convicto</DialogTitle>
                                    <DialogDescription>Ingrese los datos de un nuevo interno, los ampos con (*) son
                                        obligatorios</DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleGuardarNuevoConvicto} className="space-y-4 p-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nombre completo *</Label>
                                            <Input value={convictoForm.nombre} onChange={e => setConvictoForm({
                                                ...convictoForm,
                                                nombre: e.target.value
                                            })} required/>
                                            {convictoErrors.nombre &&
                                                <p className="text-destructive text-sm">{convictoErrors.nombre}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Alias</Label>
                                            <Input value={convictoForm.alias} onChange={e => setConvictoForm({
                                                ...convictoForm,
                                                alias: e.target.value
                                            })}/>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>DNI *</Label>
                                            <Input value={convictoForm.dni} onChange={e => setConvictoForm({
                                                ...convictoForm,
                                                dni: e.target.value
                                            })} required/>
                                            {convictoErrors.dni &&
                                                <p className="text-destructive text-sm">{convictoErrors.dni}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Edad *</Label>
                                            <Input type="number" value={convictoForm.edad}
                                                onChange={e => setConvictoForm({
                                                    ...convictoForm,
                                                    edad: e.target.value
                                                })} required/>
                                            {convictoErrors.edad &&
                                                <p className="text-destructive text-sm">{convictoErrors.edad}</p>}
                                        </div>

                                        <div className="space-y-2"><Label>Delito *</Label><Input
                                            value={convictoForm.delito}
                                            onChange={e => setConvictoForm({...convictoForm, delito: e.target.value})}
                                            required/></div>
                                        <div className="space-y-2">
                                            <Label>Pabellón *</Label>
                                            <Select value={convictoForm.pabellon} onValueChange={v => setConvictoForm({
                                                ...convictoForm,
                                                pabellon: v
                                            })}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                <SelectContent><SelectItem value="A">A</SelectItem><SelectItem
                                                    value="B">B</SelectItem><SelectItem
                                                    value="C">C</SelectItem><SelectItem
                                                    value="D">D</SelectItem></SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2"><Label>Celda *</Label><Input
                                            value={convictoForm.celda}
                                            onChange={e => setConvictoForm({...convictoForm, celda: e.target.value})}
                                            required/></div>
                                        <div className="space-y-2">
                                            <Label>Estado judicial *</Label>
                                            <Select value={convictoForm.estado}
                                                    onValueChange={v => setConvictoForm({...convictoForm, estado: v})}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                <SelectContent><SelectItem
                                                    value="Procesado">Procesado</SelectItem><SelectItem
                                                    value="Condenado">Condenado</SelectItem></SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Nivel de peligrosidad *</Label>
                                            <Select value={convictoForm.nivel}
                                                    onValueChange={v => setConvictoForm({...convictoForm, nivel: v})}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                <SelectContent><SelectItem value="Baja">Baja</SelectItem><SelectItem
                                                    value="Media">Media</SelectItem><SelectItem
                                                    value="Alta">Alta</SelectItem><SelectItem
                                                    value="Máxima">Máxima</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contacto</Label>
                                            <Input value={convictoForm.contacto} onChange={e => setConvictoForm({
                                                ...convictoForm,
                                                contacto: e.target.value
                                            })}/>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Observaciones</Label>
                                        <Textarea value={convictoForm.observaciones} onChange={e => setConvictoForm({
                                            ...convictoForm,
                                            observaciones: e.target.value
                                        })} rows={3}/>
                                    </div>

                                    <Button type="submit" className="w-full"
                                            disabled={isSubmittingConvicto}>{isSubmittingConvicto ? "Guardando..." : "Registrar"}</Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* ---------- DIALOG: EDITAR (todo en editingData con type 'convicto') ---------- */}
                        <Dialog open={editingData?.type === "convicto"} onOpenChange={() => setEditingData(null)}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Editar registros de convicto</DialogTitle>
                                    <DialogDescription>Modifique la información del convicto y guarde los
                                        cambios.</DialogDescription>
                                </DialogHeader>
                                <form className="space-y-4 p-2" onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveEdit();
                                }}>
                                    {/* campos prellenados desde editingData.data */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Nombre</Label><Input
                                            value={clean(editingData?.data.nombre)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, nombre: e.target.value}
                                        })} required/></div>
                                        <div className="space-y-2"><Label>Alias</Label><Input
                                            value={clean(editingData?.data.alias)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, alias: e.target.value}
                                        })}/></div>
                                        <div className="space-y-2"><Label>DNI</Label><Input
                                            value={clean(editingData?.data.dni)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, dni: e.target.value}
                                        })} required/></div>
                                        <div className="space-y-2"><Label>Edad</Label><Input type="number"
                                            value={String(editingData?.data.edad ?? "")}
                                                onChange={e => setEditingData({...editingData!,data: {
                                                    ...editingData!.data,edad: e.target.value}
                                                    })} required/></div>
                                        <div className="space-y-2"><Label>Delito</Label><Input
                                            value={clean(editingData?.data.delito)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, delito: e.target.value}
                                        })}/></div>
                                        <div className="space-y-2"><Label>Pabellón</Label>
                                            <Select value={editingData?.data.pabellon ?? ""}
                                                    onValueChange={v => setEditingData({
                                                        ...editingData!,
                                                        data: {...editingData!.data, pabellon: v}
                                                    })}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="A">A</SelectItem><SelectItem
                                                    value="B">B</SelectItem><SelectItem
                                                    value="C">C</SelectItem><SelectItem
                                                    value="D">D</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Celda</Label><Input
                                            value={clean(editingData?.data.celda)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, celda: e.target.value}
                                        })}/></div>
                                        <div className="space-y-2"><Label>Estado</Label>
                                            <Select value={editingData?.data.estado ?? ""}
                                                    onValueChange={v => setEditingData({
                                                        ...editingData!,
                                                        data: {...editingData!.data, estado: v}
                                                    })}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem
                                                    value="Procesado">Procesado</SelectItem><SelectItem
                                                    value="Condenado">Condenado</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Nivel</Label>
                                            <Select
                                                value={editingData?.data.nivel ?? editingData?.data.nivelPeligrosidad ?? ""}
                                                onValueChange={v => setEditingData({
                                                    ...editingData!,
                                                    data: {...editingData!.data, nivel: v, nivelPeligrosidad: v}
                                                })}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Baja">Baja</SelectItem><SelectItem
                                                    value="Media">Media</SelectItem><SelectItem
                                                    value="Alta">Alta</SelectItem><SelectItem
                                                    value="Máxima">Máxima</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Contacto</Label><Input
                                            value={clean(editingData?.data.contacto)} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, contacto: e.target.value}
                                        })}/></div>
                                    </div>
                                    <div className="space-y-2"><Label>Observaciones</Label><Textarea
                                        value={clean(editingData?.data.observaciones)} onChange={e => setEditingData({
                                        ...editingData!,
                                        data: {...editingData!.data, observaciones: e.target.value}
                                    })} rows={3}/></div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setEditingData(null)}
                                                disabled={isEditingSubmitting}>Cancelar</Button>
                                        <Button className="flex-1" onClick={handleSaveEdit}
                                                disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    {/* ========== MOVIMIENTOS ========== */}
                    <TabsContent value="movimientos" className="space-y-6">
                        <section aria-label="Registro de traslados" role="region"></section>
                        <Card className="pb-0">
                            <CardHeader className="flex flex-row items-center justify-between py-1 border-b gap-4">
                                <CardTitle className="text-lg whitespace-nowrap">Registro de traslados</CardTitle>
                                <div className="relative w-70 md:ml-auto">
                                    <Search className="absolute left-3 top-2 h-5 w-5 text-muted-foreground"/>
                                    <Input aria-label="Búsqueda de registros" placeholder="Buscar por IDConv o Fecha"
                                        value={searchMovimientos}
                                        onChange={(e) => setSearchMovimientos(e.target.value)} className="pl-10"/>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={
                                        `text-sm px-2 py-1 h-auto
                                            ${movimientosData.length > 800 ? "border-red-500 text-red-500 bg-red-500/20" :
                                            movimientosData.length > 400 ? "border-yellow-500 text-yellow-500 bg-yellow-500/20"
                                                : "border-green-500 text-green-500 bg-green-500/20"}`}>Registros
                                    totales: {movimientosData.length}
                                </Badge>
                            </CardHeader>
                        </Card>
                        <div className="flex items-center gap-3 mt-4">
                            <Button onClick={() => setOpenNuevoMovimiento(true)}><Plus className="mr-2 h-4 w-4"/>Registrar
                                Traslado</Button>
                            <Button variant="outline"
                                    onClick={() => exportToCSV(movimientosData, "movimientos")}><Download
                                className="mr-2 h-4 w-4"/>Exportar CSV</Button>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir</Button>
                        </div>
                        <Card>
                            <CardContent className="py-0 px-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead
                                                    className="text-left bg-primary/10 font-bold">IDMov</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead className="text-center">Hora</TableHead>
                                                <TableHead
                                                    className="text-center bg-purple-600/10 text-white-700 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-[260px] text-left">Nombre
                                                    completo</TableHead>
                                                <TableHead>Origen</TableHead>
                                                <TableHead>Destino</TableHead>
                                                <TableHead>Motivo</TableHead>
                                                <TableHead>AutorizadoPor</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMovimientos.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9}
                                                            className="text-center py-8 text-muted-foreground">No se
                                                        encontraron registros.</TableCell>
                                                </TableRow>) : (filteredMovimientos.map(m => (<TableRow key={m.id}>
                                                        <TableCell
                                                            className="bg-primary/10 font-bold text-primary">{m.id}</TableCell>
                                                        <TableCell className="text-sm">{m.fecha}</TableCell>
                                                        <TableCell className="text-sm text-center">{m.hora}</TableCell>
                                                        <TableCell
                                                            className="text-center bg-purple-600/10 text-white-700 font-bold">{m.convictoId}</TableCell>
                                                        <TableCell className="font-medium">{m.nombre}</TableCell>
                                                        <TableCell className="text-sm"><Badge variant="outline"
                                                                className={m.origen ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}>{m.origen}</Badge></TableCell>
                                                        <TableCell className="text-sm"><Badge variant="outline"
                                                                className={m.destino ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}>{m.destino}</Badge></TableCell>
                                                        <TableCell className="text-sm">{m.motivo}</TableCell>
                                                        <TableCell
                                                            className="text-sm text-muted-foreground">{m.autorizadoPor}</TableCell>
                                                        <TableCell className="flex gap-2">
                                                            <Button size="sm" variant="outline"
                                                                    onClick={() => openEdit("movimiento", m)}
                                                                    aria-label="Editar registro de traslado"><Edit2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                            <Button size="sm" variant="destructive"
                                                                    onClick={() => setDeleteConfirm({
                                                                        type: "movimiento",
                                                                        id: m.id
                                                                    })}
                                                                    aria-label="Eliminar registro de traslado"><Trash2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Nuevo Movimiento */}
                        <Dialog open={openNuevoMovimiento} onOpenChange={setOpenNuevoMovimiento}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nuevo registro de traslado</DialogTitle>
                                    <DialogDescription>Registre un nuevo traslado o movimiento de
                                        convicto.</DialogDescription>
                                </DialogHeader>

                                <form className="space-y-4 p-2" onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRegistrarMovimiento();
                                }}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Fecha</Label><Input type="date"
                                            value={movimientoForm.fecha}
                                                onChange={e => setMovimientoForm({
                                                    ...movimientoForm,
                                                        fecha: e.target.value
                                                })} required/></div>
                                        <div className="space-y-2"><Label>Hora</Label><Input type="time"
                                            value={movimientoForm.hora}
                                                onChange={e => setMovimientoForm({
                                                    ...movimientoForm,
                                                        hora: e.target.value
                                                })} required/></div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Convicto</Label>
                                        <Select value={movimientoForm.convictoId}
                                                onValueChange={v => setMovimientoForm({
                                                    ...movimientoForm,
                                                    convictoId: v
                                                })}>
                                            <SelectTrigger><SelectValue
                                                placeholder="Seleccionar convicto"/></SelectTrigger>
                                            <SelectContent>{convictosData.map(c => (<SelectItem key={c.id}
                                                                                                value={c.id.toString()}>{c.nombre} (ID: {c.id})</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Origen</Label><Input
                                            value={movimientoForm.origen} onChange={e => setMovimientoForm({
                                            ...movimientoForm,
                                            origen: e.target.value
                                        })} required/></div>
                                        <div className="space-y-2"><Label>Destino</Label><Input
                                            value={movimientoForm.destino} onChange={e => setMovimientoForm({
                                            ...movimientoForm,
                                            destino: e.target.value
                                        })} required/></div>
                                    </div>

                                    <div className="space-y-2"><Label>Motivo</Label><Input value={movimientoForm.motivo}
                                        onChange={e => setMovimientoForm({
                                            ...movimientoForm,
                                                motivo: e.target.value
                                            })} required/></div>
                                    <div className="space-y-2"><Label>Autorizado Por</Label><Input
                                        value={movimientoForm.autorizadoPor} onChange={e => setMovimientoForm({
                                        ...movimientoForm,
                                        autorizadoPor: e.target.value
                                    })} placeholder="Sistema"/></div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setOpenNuevoMovimiento(false)}>Cancelar</Button>
                                        <Button type="submit" className="flex-1"
                                                disabled={isSubmittingMovimiento}>{isSubmittingMovimiento ? "Guardando..." : "Registrar"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Editar Movimiento (editingData.type==="movimiento") */}
                        <Dialog open={editingData?.type === "movimiento"} onOpenChange={() => setEditingData(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar registros de traslado</DialogTitle>
                                    <DialogDescription>Actualice datos del movimiento y guarde.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 p-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Fecha</Label><Input type="date"
                                            value={getFormattedDate(editingData?.data.fecha)}
                                            onChange={e => setEditingData({
                                                ...editingData!,data: {...editingData!.data, fecha: e.target.value}
                                            })}/></div>
                                        <div className="space-y-2"><Label>Hora</Label><Input type="time"
                                            value={editingData?.data.hora ?? ""}
                                                onChange={e => setEditingData({
                                                    ...editingData!,
                                                        data: { ...editingData!.data,hora: e.target.value}
                                                })}/></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Convicto</Label>
                                        <Select value={String(editingData?.data.convictoId ?? "")}
                                                onValueChange={v => setEditingData({
                                                    ...editingData!,
                                                    data: {...editingData!.data, convictoId: v}
                                                })}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{convictosData.map(c => (<SelectItem key={c.id}
                                                value={c.id.toString()}>{c.nombre}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Origen</Label><Input
                                            value={editingData?.data.origen ?? ""} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, origen: e.target.value}
                                        })}/></div>
                                        <div className="space-y-2"><Label>Destino</Label><Input
                                            value={editingData?.data.destino ?? ""} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, destino: e.target.value}
                                        })}/></div>
                                    </div>

                                    <div className="space-y-2"><Label>Motivo</Label><Input
                                        value={editingData?.data.motivo ?? ""} onChange={e => setEditingData({
                                        ...editingData!,
                                        data: {...editingData!.data, motivo: e.target.value}
                                    })}/></div>
                                    <div className="space-y-2"><Label>Autorizado Por</Label><Input
                                        value={editingData?.data.autorizadoPor ?? ""} onChange={e => setEditingData({
                                        ...editingData!,
                                        data: {...editingData!.data, autorizadoPor: e.target.value}
                                    })}/></div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setEditingData(null)}
                                                disabled={isEditingSubmitting}>Cancelar</Button>
                                        <Button className="flex-1" onClick={handleSaveEdit}
                                                disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                    </TabsContent>

                    {/* ========== CONDUCTA ========== */}
                    <TabsContent value="conducta" className="space-y-6">
                        <section aria-label="Registro de conducta" role="region"></section>
                        <Card className="pb-0">
                            <CardHeader className="flex flex-row items-center justify-between py-1 border-b gap-4">
                                <CardTitle className="text-lg whitespace-nowrap">Registro de traslados</CardTitle>
                                <div className="relative w-70 md:ml-auto">
                                    <Search className="absolute left-3 top-2 h-5 w-5 text-muted-foreground"/>
                                    <Input aria-label="Búsqueda de registros" placeholder="Buscar por IDConv o Fecha"
                                        value={searchConducta} onChange={(e) => setSearchConducta(e.target.value)}
                                        className="pl-10"/>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={
                                        `text-sm px-2 py-1 h-auto
                                        ${conductaData.length > 800 ? "border-red-500 text-red-500 bg-red-500/20" :
                                            conductaData.length > 400 ? "border-yellow-500 text-yellow-500 bg-yellow-500/20"
                                                : "border-green-500 text-green-500 bg-green-500/20"}`}>Registros
                                    totales: {conductaData.length}
                                </Badge>
                            </CardHeader>
                        </Card>
                        <div className="flex items-center gap-3 mt-4">
                            <Button onClick={() => setOpenNuevaConducta(true)}><Plus className="mr-2 h-4 w-4"/>Registrar
                                Conducta</Button>
                            <Button variant="outline" onClick={() => exportToCSV(movimientosData, "conducta")}><Download
                                className="mr-2 h-4 w-4"/>Exportar CSV</Button>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead
                                                    className="min-w-[50px] bg-primary/10 font-bold">IDCond</TableHead>
                                                <TableHead className="min-w-[100px] text-left">Fecha</TableHead>
                                                <TableHead
                                                    className="min-w-[60px] text-center bg-purple-600/20 text-white-700 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-[260px] text-left">Nombre
                                                    completo</TableHead>
                                                <TableHead className="min-w-[100px] text-center">Tipo</TableHead>
                                                <TableHead className="min-w-[300px] text-left">Descripción</TableHead>
                                                <TableHead className="min-w-[250px] text-left">Sanción</TableHead>
                                                <TableHead className="min-w-[120px] text-left">Registrado
                                                    por</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[100px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredConducta.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={13}
                                                            className="text-center py-8 text-muted-foreground">No se
                                                        encontraron registros.</TableCell>
                                                </TableRow>) : (filteredConducta.map(c => (
                                                    <TableRow key={c.id}>
                                                        <TableCell
                                                            className="bg-primary/10 font-bold text-primary">{c.id}</TableCell>
                                                        <TableCell>{c.fecha}</TableCell>
                                                        <TableCell
                                                            className="min-w-[70px] text-center bg-purple-600/10 text-white-700 font-bold">{c.convictoId}</TableCell>
                                                        <TableCell className="font-medium">{c.nombre}</TableCell>
                                                        <TableCell className="text-center"><Badge variant="outline"
                                                                    className={getTipoConductaColor(c.tipo)}>{c.tipo}</Badge></TableCell>
                                                        <TableCell
                                                            className="truncate max-w-[200px]">{c.descripcion}</TableCell>
                                                        <TableCell>{c.sancion}</TableCell>
                                                        <TableCell
                                                            className="text-s text-muted-foreground">{c.registrado}</TableCell>
                                                        <TableCell className="flex gap-2">
                                                            <Button size="sm" variant="outline"
                                                                    onClick={() => openEdit("conducta", c)}
                                                                    aria-label="Editar registro de conducta"><Edit2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                            <Button size="sm" variant="destructive"
                                                                    onClick={() => setDeleteConfirm({
                                                                        type: "conducta",
                                                                        id: c.id
                                                                    })}
                                                                    aria-label="Eliminar registro de conducta"><Trash2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Nuevo Conducta */}
                        <Dialog open={openNuevaConducta} onOpenChange={setOpenNuevaConducta}>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Nuevo registro de conducta</DialogTitle></DialogHeader>
                                <DialogDescription>Registre incidentes de conducta o reconocimientos</DialogDescription>
                                <form className="space-y-4 p-2" onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRegistrarConducta();
                                }}>
                                    <div className="space-y-2">
                                        <Label>Convicto (ID)</Label>
                                        <Select value={conductaForm.convictoId}
                                                onValueChange={v => setConductaForm({...conductaForm, convictoId: v})}>
                                            <SelectTrigger><SelectValue
                                                placeholder="Seleccionar convicto"/></SelectTrigger>
                                            <SelectContent>
                                                {convictosData.map(c => (
                                                    <SelectItem key={c.id}
                                                                value={c.id.toString()}>{c.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <Select value={conductaForm.tipo}
                                                    onValueChange={v => setConductaForm({...conductaForm, tipo: v})}>
                                                <SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger>
                                                <SelectContent><SelectItem
                                                    value="Positiva">Positiva</SelectItem><SelectItem
                                                    value="Falta leve">Falta leve</SelectItem><SelectItem
                                                    value="Falta grave">Falta grave</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Fecha</Label><Input type="date"
                                            value={conductaForm.fecha}
                                                onChange={e => setConductaForm({...conductaForm, fecha: e.target.value})}/></div>
                                    </div>
                                    <div className="space-y-2"><Label>Descripción</Label><Textarea
                                        value={conductaForm.descripcion}
                                        onChange={e => setConductaForm({...conductaForm, descripcion: e.target.value})}
                                        required/></div>
                                    <div className="space-y-2"><Label>Sanción (Opcional)</Label><Input
                                        value={conductaForm.sancion}
                                        onChange={e => setConductaForm({...conductaForm, sancion: e.target.value})}/>
                                    </div>
                                    <div className="space-y-2"><Label>Registrado por</Label><Input
                                        value={editingData?.data.registrado} onChange={e => setConductaForm({
                                        ...editingData!.data,
                                        registrado: e.target.value
                                    })} placeholder="Usuario a cargo"/></div>
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setOpenNuevaConducta(false)}>Cancelar</Button>
                                        <Button className="flex-1"
                                                disabled={isSubmittingConducta}>{isSubmittingConducta ? "Guardando..." : "Registrar"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Editar Conducta */}
                        <Dialog open={editingData?.type === "conducta"} onOpenChange={() => setEditingData(null)}>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Editar registro de conducta</DialogTitle></DialogHeader>
                                <DialogDescription>Actualice datos del registro de conductas y
                                    guarde</DialogDescription>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Fecha</Label><Input type="date"
                                            value={getFormattedDate(editingData?.data.fecha)}
                                            onChange={e => setEditingData({...editingData!,data: {...editingData!.data,
                                                fecha: e.target.value}
                                            })}/></div>
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <Select value={editingData?.data.tipo || ""}
                                                    onValueChange={v => setEditingData({
                                                        ...editingData!,
                                                        data: {...editingData!.data, tipo: v}
                                                    })}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                                <SelectContent><SelectItem
                                                    value="Positiva">Positiva</SelectItem><SelectItem
                                                    value="Buena conducta">Buena conducta</SelectItem><SelectItem
                                                    value="Falta leve">Falta leve</SelectItem><SelectItem
                                                    value="Falta grave">Falta grave</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Convicto (ID)</Label>
                                        <Select value={String(editingData?.data.convictoId ?? "")}
                                                onValueChange={v => setEditingData({
                                                    ...editingData!,
                                                    data: {...editingData!.data, convictoId: v}
                                                })}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{convictosData.map(c => (<SelectItem key={c.id}
                                                                                                value={c.id.toString()}>{c.nombre}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descripción</Label>
                                        <Textarea value={editingData?.data.descripcion || ""}
                                                onChange={e => setEditingData({
                                                    ...editingData!,
                                                    data: {...editingData!.data, descripcion: e.target.value}
                                                })}/></div>

                                    <div className="space-y-2">
                                        <Label>Sanción</Label>
                                        <Input value={editingData?.data.sancion || ""} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, sancion: e.target.value}
                                        })}/></div>
                                    <div className="space-y-2">
                                        <Label>Registrado por</Label>
                                        <Input value={editingData?.data.registrado || ""}
                                            onChange={e => setEditingData({
                                                ...editingData!,
                                                data: {...editingData!.data, registrado: e.target.value}
                                            })}/>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setEditingData(null)}
                                                disabled={isEditingSubmitting}>Cancelar</Button>
                                        <Button className="flex-1" onClick={handleSaveEdit}
                                                disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                    </TabsContent>

                    {/* ========== VISITAS ========== */}
                    <TabsContent value="visitas" className="space-y-6">
                        <section aria-label="Registro de visitas" role="region"></section>
                        <Card className="pb-0">
                            <CardHeader className="flex flex-row items-center justify-between py-1 border-b gap-4">
                                <CardTitle className="text-lg whitespace-nowrap">Registro de traslados</CardTitle>
                                <div className="relative w-70 md:ml-auto">
                                    <Search className="absolute left-3 top-2 h-5 w-5 text-muted-foreground"/>
                                    <Input aria-label="Búsqueda de registros"
                                        placeholder="Buscar por IDConv, Fecha o Estado" value={searchVisitas}
                                        onChange={(e) => setSearchVisitas(e.target.value)} className="pl-10"/>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={
                                        `text-sm px-2 py-1 h-auto
                                        ${visitasData.length > 800 ? "border-red-500 text-red-500 bg-red-500/20" :
                                            visitasData.length > 400 ? "border-yellow-500 text-yellow-500 bg-yellow-500/20"
                                                : "border-green-500 text-green-500 bg-green-500/20"}`}>Registros
                                    totales: {visitasData.length}
                                </Badge>
                            </CardHeader>
                        </Card>
                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setOpenNuevaVisita(true)}><Plus className="mr-2 h-4 w-4"/> Registrar
                                Visita</Button>
                            <Button variant="outline" onClick={() => exportToCSV(visitasData, "visitas")}><Download
                                className="mr-2 h-4 w-4"/> Exportar CSV</Button>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Imprimir</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead
                                                    className="min-w-[10px] text-left bg-primary/20 font-bold">IDVisita</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Hora</TableHead>
                                                <TableHead
                                                    className="min-w-[10px] text-center bg-purple-600/10 text-white-700 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-[100px] text-left">Nombre
                                                    completo</TableHead>
                                                <TableHead>Visitante</TableHead>
                                                <TableHead>DNI Visitante</TableHead>
                                                <TableHead>Parentesco</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead scope="col"
                                                        className="min-w-[50px] text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVisitas.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={13}
                                                            className="text-center py-8 text-muted-foreground">No se
                                                        encontraron registros.</TableCell>
                                                </TableRow>) : (filteredVisitas.map(v => (
                                                    <TableRow key={v.id}>
                                                        <TableCell
                                                            className="font-bold text-primary bg-primary/20 font-bold">{v.id}</TableCell>
                                                        <TableCell>{v.fecha}</TableCell>
                                                        <TableCell>{v.hora}</TableCell>
                                                        <TableCell
                                                            className="font-medium text-center bg-purple-600/10 text-white-700 font-bold">{v.convictoId}</TableCell>
                                                        <TableCell className="font-medium">{v.nombre}</TableCell>
                                                        <TableCell>{v.visitante}</TableCell>
                                                        <TableCell>{v.dniVisitante}</TableCell>
                                                        <TableCell>{v.parentesco}</TableCell>
                                                        <TableCell><Badge variant="outline"
                                                                    className={getEstadoVisitaColor(v.estado)}>{v.estado}</Badge></TableCell>
                                                        <TableCell className="flex gap-2">
                                                            <Button size="sm" variant="outline"
                                                                    onClick={() => openEdit("visita", v)}
                                                                    aria-label="Editar registro de visita"><Edit2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                            <Button size="sm" variant="destructive"
                                                                    onClick={() => setDeleteConfirm({
                                                                        type: "visita",
                                                                        id: v.id
                                                                    })} aria-label="Eliminar registro de visita"><Trash2
                                                                aria-hidden="true" className="h-3 w-3"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Nueva Visita */}
                        <Dialog open={openNuevaVisita} onOpenChange={setOpenNuevaVisita}>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Nuevo registro de visitas</DialogTitle></DialogHeader>
                                <DialogDescription>Registre una visita programada o realizada</DialogDescription>
                                <form className="space-y-2 p-2" onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRegistrarVisita();
                                }}>
                                    <div className="space-y-2">
                                        <Label>Convicto</Label>
                                        <Select value={visitaForm.convictoId}
                                                onValueChange={v => setVisitaForm({...visitaForm, convictoId: v})}>
                                            <SelectTrigger><SelectValue
                                                placeholder="Seleccionar convicto"/></SelectTrigger>
                                            <SelectContent>{convictosData.map(c => (<SelectItem key={c.id}
                                                                                                value={c.id.toString()}>{c.nombre} (ID: {c.id})</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Visitante</Label><Input
                                            value={visitaForm.visitante}
                                            onChange={e => setVisitaForm({...visitaForm, visitante: e.target.value})}
                                            required placeholder="Nombre completo"/></div>
                                        <div className="space-y-2"><Label>DNI</Label><Input
                                            value={visitaForm.dniVisitante}
                                            onChange={e => setVisitaForm({...visitaForm, dniVisitante: e.target.value})}
                                            required placeholder="DNI visitante"/></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Fecha</Label><Input type="date"
                                            value={visitaForm.fecha}
                                                onChange={e => setVisitaForm({...visitaForm,fecha: e.target.value})} required/></div>
                                        <div className="space-y-2"><Label>Hora</Label><Input type="time"
                                            value={visitaForm.hora}
                                                onChange={e => setVisitaForm({...visitaForm,hora: e.target.value})} required
                                                    placeholder="00:00"/></div>
                                    </div>
                                    <div className="space-y-2"><Label>Parentesco</Label><Input
                                        placeholder="Relación con el convicto" value={visitaForm.parentesco}
                                        onChange={e => setVisitaForm({...visitaForm, parentesco: e.target.value})}
                                        required/></div>
                                    <div className="space-y-2">
                                        <Label>Estado *</Label>
                                        <Select value={visitaForm.estado}
                                                onValueChange={v => setVisitaForm({...visitaForm, estado: v})}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                            <SelectContent><SelectItem value="programado">Programado</SelectItem>
                                                <SelectItem value="cancelado">Cancelado</SelectItem>
                                                <SelectItem value="realizado">Realizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1"
                                                onClick={() => setOpenNuevaVisita(false)}>Cancelar</Button>
                                        <Button className="flex-1"
                                                disabled={isSubmittingVisita}>{isSubmittingVisita ? "Guardando..." : "Registrar"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Editar Visita */}
                        <Dialog open={editingData?.type === "visita"} onOpenChange={() => setEditingData(null)}>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Editar registro de visitas</DialogTitle></DialogHeader>
                                <DialogDescription>Actualice datos de las visitas y guarde</DialogDescription>
                                <div className="space-y-2">
                                    <Label>Convicto</Label>
                                    <Select value={String(editingData?.data.convictoId ?? "")}
                                            onValueChange={v => setEditingData({
                                                ...editingData!,
                                                data: {...editingData!.data, convictoId: v}
                                            })}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{convictosData.map(c => (<SelectItem key={c.id}
                                                                                            value={c.id.toString()}>{c.nombre}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Visitante</Label>
                                        <Input value={editingData?.data.visitante || ""} onChange={e => setEditingData({
                                            ...editingData!,
                                            data: {...editingData!.data, visitante: e.target.value}
                                        })}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>DNI</Label>
                                        <Input value={editingData?.data.dniVisitante || ""}
                                            onChange={e => setEditingData({
                                                ...editingData!,
                                                data: {...editingData!.data, dniVisitante: e.target.value}
                                            })}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha</Label>
                                        <Input type="date" value={getFormattedDate(editingData?.data.fecha)}
                                            onChange={e => setEditingData({
                                                ...editingData!,
                                                data: {...editingData!.data, fecha: e.target.value}
                                            })}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora</Label>
                                        <Input type="time" value={editingData?.data.hora || ""}
                                            onChange={e => setEditingData({
                                                ...editingData!,
                                                data: {...editingData!.data, hora: e.target.value}
                                            })}/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Parentesco</Label>
                                    <Input value={editingData?.data.parentesco || ""} onChange={e => setEditingData({
                                        ...editingData!,
                                        data: {...editingData!.data, parentesco: e.target.value}
                                    })}/>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" className="flex-1"
                                            onClick={() => setEditingData(null)}>Cancelar</Button>
                                    <Button className="flex-1" onClick={handleSaveEdit}
                                            disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                </Tabs>

                {/* ---------- ALERT: BORRADO DINÁMICO) ---------- */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                            {/* Mensaje dinámico */}
                            {deleteConfirm?.type === "convicto" ? (
                                <p className="text-muted-foreground">Al eliminar un convicto se eliminarán
                                    automáticamente todos sus datos
                                    incluidos en movimientos, conducta y visitas.</p>) : (
                                <p className="text-muted-foreground">El registro se eliminará permanentemente.</p>)}
                        </AlertDialogHeader>
                        <div className="flex gap-4 p-1 mt-4">
                            <Button className="flex-1 border-2 hover:bg-blue-400/100" variant="outline"
                                    onClick={() => setDeleteConfirm(null)}
                                    aria-label="Cancelar acción">Cancelar</Button>
                            <Button className="flex-1 bg-red-600/50 hover:bg-red-600/70" variant="destructive"
                                    onClick={() => deleteConfirm && handleDelete(deleteConfirm.type, deleteConfirm.id)}
                                    aria-label="Eliminar registro">Eliminar</Button>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </main>
    )
}

export default ConvictosPanel
