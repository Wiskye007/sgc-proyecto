"use client"

import React, {useEffect, useState} from "react"
import { Users } from "lucide-react";
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
import { authFetch } from "@/lib/auth"  

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

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api/convictos"
    : "http://localhost:5000/api/convictos";

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
    const [tipoConductaFilter, setTipoConductaFilter] = useState<string>("todos")
    const [estadoVisitaFilter, setEstadoVisitaFilter] = useState<string>("todos")

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [nivelFilter, setNivelFilter] = useState<string>("todos")
    const [searchMovimientos, setSearchMovimientos] = useState("")
    const [searchConducta, setSearchConducta] = useState("")
    const [searchVisitas, setSearchVisitas] = useState("")
    
    // --- ESTADO PARA EL BUSCADOR INTELIGENTE EN MODALES ---
    const [busquedaConvicto, setBusquedaConvicto] = useState("")

    // --------------------- DIALOGOS ---------------------
    const [openNuevoConvicto, setOpenNuevoConvicto] = useState(false)
    const [openNuevoMovimiento, setOpenNuevoMovimiento] = useState(false)
    const [openNuevaConducta, setOpenNuevaConducta] = useState(false)
    const [openNuevaVisita, setOpenNuevaVisita] = useState(false)  
    const [editingData, setEditingData] = useState<{ type: string; data: any } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null)

    // --------------------- LISTAS ---------------------
    const [convictosData, setConvictosData] = useState<Convicto[]>([])
    const [movimientosData, setMovimientosData] = useState<Movimiento[]>([])
    const [conductaData, setConductaData] = useState<Conducta[]>([])
    const [visitasData, setVisitasData] = useState<Visita[]>([])

    // --- LÓGICA DEL BUSCADOR INTELIGENTE ---
    const convictosFiltrados = convictosData.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(busquedaConvicto.toLowerCase())) ||
        (c.dni && c.dni.includes(busquedaConvicto)) ||
        (c.id && c.id.toString() === busquedaConvicto)
    );
    const getConvictoLabel = (c: Convicto) => `${c.nombre} (DNI: ${c.dni})`;

    // --------------------- FORMULARIOS ---------------------
    const [convictoForm, setConvictoForm] = useState({
        nombre: "", alias: "", dni: "", edad: "", delito: "",
        pabellon: "", celda: "", estado: "", nivel: "",
        contacto: "", observaciones: "", fechaingreso: ""
    })
    const [movimientoForm, setMovimientoForm] = useState({
        convictoId: "", origen: "", destino: "", motivo: "",
        fecha: "", hora: "", autorizadoPor: ""
    })
    const [conductaForm, setConductaForm] = useState({
        convictoId: "", tipo: "", descripcion: "", sancion: "", fecha: ""
    })
    const [visitaForm, setVisitaForm] = useState({
        convictoId: "", visitante: "", dniVisitante: "", parentesco: "",
        fecha: "", hora: "", estado: ""
    })

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
                authFetch(`${API_URL}`),
                authFetch(`${API_URL}/movimientos`),
                authFetch(`${API_URL}/conducta`),
                authFetch(`${API_URL}/visitas`)
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
    
    // --------------------- REGISTRAR CONVICTO ---------------------
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
        const errors = validarConvictoLocal()
        if (Object.keys(errors).length) {   
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
                fechaingreso: new Date().toISOString() 
            }
            const res = await authFetch(`${API_URL}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast({title: "Éxito", description: "Convicto registrado"})
                setOpenNuevoConvicto(false)
                setConvictoForm({
                    nombre: "", alias: "", dni: "", edad: "", delito: "", pabellon: "",
                    celda: "", estado: "", nivel: "", contacto: "", observaciones: "", fechaingreso: ""
                })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "Error al registrar convicto", variant: "destructive"})
            }
        } catch (err) {
            toast({title: "Error", description: "Error de conexión", variant: "destructive"})
        } finally {
            setIsSubmittingConvicto(false)
        }
    }

    // --------------------- EDITAR ---------------------
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
            const nombre = clean(d.nombre)
            const dni = clean(d.dni)
            const edadNum = Number(d.edad)
                
                if (!nombre) { toast({title: "Error", description: "Nombre requerido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!dni || dni.length < 6) { toast({title: "Error", description: "DNI inválido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (isDNIRepetido(dni, id)) { toast({title: "Error", description: "DNI duplicado", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!numeroValido(d.edad) || edadNum < 18 || edadNum > 120) { toast({title: "Error", description: "Edad inválida", variant: "destructive"}); setIsEditingSubmitting(false); return }

                const payload = {
                    nombre, alias: clean(d.alias), dni, edad: edadNum, delito: clean(d.delito),
                    pabellon: clean(d.pabellon), celda: clean(d.celda), estado: clean(d.estado),
                    nivelPeligrosidad: clean(d.nivel), contacto: clean(d.contacto), observaciones: clean(d.observaciones)
                }
                const res = await authFetch(`${API_URL}/${id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
                if (res.ok) { toast({title: "Actualizado", description: "Registro actualizado"}); setEditingData(null); await fetchDatos() } 
                else { const err = await res.json().catch(() => null); toast({title: "Error", description: err?.error || "No se pudo actualizar", variant: "destructive"}) }
            } 
            else if (t === "movimiento") {
                const id = d.id
                if (!d.fecha) { toast({title: "Error", description: "Fecha requerida", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!isHoraValida(d.hora)) { toast({title: "Error", description: "Hora inválida", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.convictoId) { toast({title: "Error", description: "Convicto requerido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (isFechaFutura(d.fecha)) { toast({title: "Error", description: "La fecha no puede ser futura", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (clean(d.origen) === clean(d.destino)) { toast({title: "Error", description: "Origen y destino no pueden ser iguales", variant: "destructive"}); setIsEditingSubmitting(false); return }

                const payload = {
                    fecha: d.fecha, hora: d.hora, convictoId: Number(d.convictoId),
                    origen: clean(d.origen), destino: clean(d.destino), motivo: clean(d.motivo), autorizadoPor: clean(d.autorizadoPor)
                }
                const res = await authFetch(`${API_URL}/movimientos/${id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
                if (res.ok) { toast({title: "Actualizado", description: "Traslado actualizado"}); setEditingData(null); await fetchDatos() } 
                else { const err = await res.json().catch(() => null); toast({title: "Error", description: err?.error || "Error al actualizar", variant: "destructive"}) }
            } 
            else if (t === "conducta") {
                const id = d.id
                if (!d.convictoId) { toast({title: "Error", description: "Convicto requerido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.tipo) { toast({title: "Error", description: "Tipo requerido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.descripcion || clean(d.descripcion).length < 10) { toast({title: "Error", description: "Descripción mínima 10 caracteres", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (d.fecha && isFechaFutura(d.fecha)) { toast({title: "Error", description: "Fecha no puede ser futura", variant: "destructive"}); setIsEditingSubmitting(false); return }

                const payload = {
                    convictoId: Number(d.convictoId), fecha: d.fecha, tipo: d.tipo,
                    descripcion: clean(d.descripcion), sancion: clean(d.sancion), registrado: clean(d.registrado)
                }
                const res = await authFetch(`${API_URL}/conducta/${id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
                if (res.ok) { toast({title: "Actualizado", description: "Conducta actualizada"}); setEditingData(null); await fetchDatos() } 
                else { const err = await res.json().catch(() => null); toast({title: "Error", description: err?.error || "Error al actualizar", variant: "destructive"}) }
            } 
            else if (t === "visita") {
                const id = d.id
                if (!d.convictoId) { toast({title: "Error", description: "Convicto requerido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.visitante || clean(d.visitante).length < 3) { toast({title: "Error", description: "Visitante inválido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.dniVisitante || clean(d.dniVisitante).length < 6) { toast({title: "Error", description: "DNI visitante inválido", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!isHoraValida(d.hora)) { toast({title: "Error", description: "Hora inválida", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (!d.fecha) { toast({title: "Error", description: "Fecha requerida", variant: "destructive"}); setIsEditingSubmitting(false); return }
                if (d.estado === "Programada" && isFechaPasada(d.fecha)) { toast({title: "Error", description: "No puede programar en el pasado", variant: "destructive"}); setIsEditingSubmitting(false); return }

                const payload = {
                    convictoId: Number(d.convictoId), fecha: d.fecha, hora: d.hora,
                    visitante: clean(d.visitante), dniVisitante: clean(d.dniVisitante),
                    parentesco: clean(d.parentesco), estado: d.estado, observaciones: ""
                }
                const res = await authFetch(`${API_URL}/visitas/${id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
                if (res.ok) { toast({title: "Actualizado", description: "Visita actualizada"}); setEditingData(null); await fetchDatos() } 
                else { const err = await res.json().catch(() => null); toast({title: "Error", description: err?.error || "Error al actualizar", variant: "destructive"}) }
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
        if (!movimientoForm.convictoId) { toast({title: "Error", description: "Seleccione un convicto", variant: "destructive"}); return }
        if (!movimientoForm.fecha) { toast({title: "Error", description: "Fecha requerida", variant: "destructive"}); return }
        if (isFechaFutura(movimientoForm.fecha)) { toast({title: "Error", description: "La fecha no puede ser futura", variant: "destructive"}); return }
        if (!isHoraValida(movimientoForm.hora)) { toast({title: "Error", description: "Hora inválida", variant: "destructive"}); return }
        if (clean(movimientoForm.origen) === clean(movimientoForm.destino)) { toast({title: "Error", description: "Origen y destino no pueden ser iguales", variant: "destructive"}); return }

        setIsSubmittingMovimiento(true)
        try {
            const payload = {
                fecha: movimientoForm.fecha, hora: movimientoForm.hora, convicto: Number(movimientoForm.convictoId),
                origen: clean(movimientoForm.origen), destino: clean(movimientoForm.destino),
                motivo: clean(movimientoForm.motivo), autorizadoPor: clean(movimientoForm.autorizadoPor) || "Sistema"
            }
            const res = await authFetch(`${API_URL}/movimientos`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
            if (res.ok) {
                toast({title: "Éxito", description: "Traslado registrado"})
                setOpenNuevoMovimiento(false)
                setBusquedaConvicto("")
                setMovimientoForm({ convictoId: "", origen: "", destino: "", motivo: "", fecha: "", hora: "", autorizadoPor: "" })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "Error al registrar traslado", variant: "destructive"})
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
        if (!conductaForm.convictoId) { toast({title: "Error", description: "Seleccione un convicto", variant: "destructive"}); return }
        if (!conductaForm.tipo) { toast({title: "Error", description: "Seleccione tipo", variant: "destructive"}); return }
        if (!conductaForm.descripcion || clean(conductaForm.descripcion).length < 10) { toast({title: "Error", description: "Descripción mínima 10 caracteres", variant: "destructive"}); return }
        if (conductaForm.fecha && isFechaFutura(conductaForm.fecha)) { toast({title: "Error", description: "Fecha no puede ser futura", variant: "destructive"}); return }

        setIsSubmittingConducta(true)
        try {
            const payload = {
                fecha: conductaForm.fecha || new Date().toISOString().split("T")[0],
                convictoId: Number(conductaForm.convictoId), tipo: conductaForm.tipo,
                descripcion: clean(conductaForm.descripcion), sancion: clean(conductaForm.sancion) || "Ninguna",
                registrado: "Usuario Actual"
            }
            const res = await authFetch(`${API_URL}/conducta`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
            if (res.ok) {
                toast({title: "Éxito", description: "Conducta registrada"})
                setOpenNuevaConducta(false)
                setBusquedaConvicto("")
                setConductaForm({convictoId: "", tipo: "", descripcion: "", sancion: "", fecha: ""})
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "Error al registrar", variant: "destructive"})
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
        if (!visitaForm.convictoId) { toast({title: "Error", description: "Seleccione convicto", variant: "destructive"}); return }
        if (!visitaForm.fecha) { toast({title: "Error", description: "Fecha requerida", variant: "destructive"}); return }
        if (isFechaPasada(visitaForm.fecha)) { toast({title: "Error", description: "No puede programar una visita en el pasado", variant: "destructive"}); return }
        if (!isHoraValida(visitaForm.hora)) { toast({title: "Error", description: "Hora inválida", variant: "destructive"}); return }
        if (!visitaForm.visitante || clean(visitaForm.visitante).length < 3) { toast({title: "Error", description: "Visitante inválido", variant: "destructive"}); return }
        if (!visitaForm.dniVisitante || clean(visitaForm.dniVisitante).length < 6) { toast({title: "Error", description: "DNI inválido", variant: "destructive"}); return }

        setIsSubmittingVisita(true)
        try {
            const payload = {
                fecha: visitaForm.fecha, hora: visitaForm.hora, convictoId: Number(visitaForm.convictoId),
                visitante: clean(visitaForm.visitante), dniVisitante: clean(visitaForm.dniVisitante),
                parentesco: clean(visitaForm.parentesco), estado: visitaForm.estado, observaciones: ""
            }
            const res = await authFetch(`${API_URL}/visitas`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) })
            if (res.ok) {
                toast({title: "Éxito", description: "Visita programada"})
                setOpenNuevaVisita(false)
                setBusquedaConvicto("")
                setVisitaForm({ convictoId: "", visitante: "", dniVisitante: "", parentesco: "", fecha: "", hora: "", estado: "" })
                await fetchDatos()
            } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "Error al registrar", variant: "destructive"})
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
                case "convicto": endpoint = `/${id}`; break
                case "movimiento": endpoint = `/movimientos/${id}`; break
                case "conducta": endpoint = `/conducta/${id}`; break
                case "visita": endpoint = `/visitas/${id}`; break
                default: return
            }

        try {
            const res = await authFetch(`${API_URL}${endpoint}`, {method: "DELETE"})
            if (res.ok) {
                toast({title: "Eliminado", description: "Registro eliminado"})
                await fetchDatos()
                } else {
                const err = await res.json().catch(() => null)
                toast({title: "Error", description: err?.error || "No se pudo eliminar", variant: "destructive"})
                }
        } catch (err) {
            toast({title: "Error", description: "Error al eliminar", variant: "destructive"})
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
        return (c.nombre.toLowerCase().includes(term) || clean(c.dni).includes(term) || (c.fechaingreso ?? "").includes(term) || String(c.id).includes(term)) &&
            (estadoFilter === "todos" || c.estado === estadoFilter) && (nivelFilter === "todos" || c.nivelPeligrosidad === nivelFilter)
    })

        const filteredMovimientos = movimientosData.filter(m => {
        const term = searchMovimientos.toLowerCase()
        return String(m.convictoId).includes(term) || (m.origen ?? "").toLowerCase().includes(term) || (m.fecha ?? "").includes(term) || (m.destino ?? "").toLowerCase().includes(term)
    })

    const filteredConducta = conductaData.filter(c => {
        const term = searchConducta.toLowerCase()
        const matchesSearch = String(c.convictoId).includes(term) || (c.fecha ?? "").includes(term) || (c.tipo ?? "").toLowerCase().includes(term) || (c.nombre ?? "").toLowerCase().includes(term)
        //Verifica si el filtro es "todos" o si coincide con el tipo
        const matchesTipo = tipoConductaFilter === "todos" || c.tipo === tipoConductaFilter
        return matchesSearch && matchesTipo
    })

    const filteredVisitas = visitasData.filter(v => {
        const term = searchVisitas.toLowerCase()
        const matchesSearch = String(v.convictoId).includes(term) || (v.fecha ?? "").includes(term) || (v.estado ?? "").toLowerCase().includes(term) || (v.nombre ?? "").toLowerCase().includes(term)
        const raizFiltro = estadoVisitaFilter === "todos" ? "" : estadoVisitaFilter.toLowerCase().slice(0, -1)
        //Verifica si el filtro es "todos" o si coincide ignorando mayúsculas/minúsculas
        const matchesEstado = estadoVisitaFilter === "todos" || (v.estado && v.estado.toLowerCase().includes(raizFiltro))
        return matchesSearch && matchesEstado
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
        if (tipo === "Falta leve") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    }
    const getEstadoVisitaColor = (estado?: string) => {
        const e = estado?.toLowerCase()
        if (e === "realizada" || e === "realizado") return "bg-green-500/10 text-green-400 border-green-500/20"
        if (e === "cancelado" || e === "cancelada") return "bg-red-500/10 text-red-400 border-red-500/20"
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }

    // --------------------- RENDER ---------------------
    return (
        <main className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 text-slate-200 font-sans">
            <div className="container mx-auto max-w-7xl relative z-10">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl mb-6">
                    <div className="flex items-center gap-4">
                        <Button 
                            aria-label="Botón de regreso al menú principal" 
                            className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                            onClick={() => (window.location.href = "/dashboard")}>
                            <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                        </Button>
                        <div className="flex items-center gap-4">
                            <Users className="h-14 w-14 text-blue-400 shrink-0" />
                            <div>
                                <h1 className="text-3xl font-black tracking-wide text-white">Panel de Convictos</h1>
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión integral de internos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="datos" className="w-full">
                    {/* --- NAVEGACIÓN DE TABS --- */}
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-6 bg-[#060a12]/80 border border-slate-800/80 rounded-xl p-1 gap-1">
                        <TabsTrigger value="datos" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Datos Generales</TabsTrigger>
                        <TabsTrigger value="movimientos" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Traslados</TabsTrigger>
                        <TabsTrigger value="conducta" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Conducta</TabsTrigger>
                        <TabsTrigger value="visitas" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Visitas</TabsTrigger>
                    </TabsList>

                    {/* ========== CONVICTOS-DATOS GENERALES ========== */}
                    <TabsContent value="datos" className="space-y-4">
                        <Card className="sgc-card border-0 mb-4">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800/50">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Directorio de internos</CardTitle>
                                <Badge variant="secondary" className={`text-[16px] px-3 py-1 mt-2 md:mt-0 ${convictosData.length > 800 ? "border-red-500 text-red-400 bg-red-500/10" : convictosData.length > 400 ? "border-yellow-500 text-yellow-400 bg-yellow-500/10" : "border-green-500 text-green-400 bg-green-500/10"}`}>
                                    Registros totales: {convictosData.length}
                                </Badge>
                            </CardHeader>
                            
                        {/*FILTROS*/}
                            <CardContent className="pt-0">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="relative md:w-1/3 h-10!">
                                        <Search className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"/>
                                        <Input aria-label="Búsqueda de registros" placeholder="Buscar por ID, Nombre o DNI..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="sgc-input pl-10!"/>
                                    </div>
                                    <div className="md:w-auto flex flex-col lg:flex-row gap-6 items-end w-full">
                                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                            <SelectTrigger className="sgc-input h-10! w-[180px]"><SelectValue placeholder="Estado"/></SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                                <SelectItem value="todos" className="focus:bg-blue-600 focus:text-white">Todos los estados</SelectItem>
                                                <SelectItem value="Procesado" className="focus:bg-blue-600 focus:text-white">Procesado</SelectItem>
                                                <SelectItem value="Condenado" className="focus:bg-blue-600 focus:text-white">Condenado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={nivelFilter} onValueChange={setNivelFilter}>
                                            <SelectTrigger className="sgc-input h-10! w-[250px]"><SelectValue placeholder="Peligrosidad"/></SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                                <SelectItem value="todos" className="focus:bg-blue-600 focus:text-white">Todos los niveles (Peligrosidad)</SelectItem>
                                                <SelectItem value="Baja" className="focus:bg-blue-600 focus:text-white">Baja</SelectItem>
                                                <SelectItem value="Media" className="focus:bg-blue-600 focus:text-white">Media</SelectItem>
                                                <SelectItem value="Alta" className="focus:bg-blue-600 focus:text-white">Alta</SelectItem>
                                                <SelectItem value="Máxima" className="focus:bg-blue-600 focus:text-white">Máxima</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <Button className="sgc-btn-primary h-10 px-4" onClick={() => setOpenNuevoConvicto(true)}><Plus className="h-4 w-4"/> Nuevo convicto</Button>
                                        <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(convictosData, "convictos")}><Download className="h-4 w-4"/> Exportar CSV</Button>
                                        <div className="basis-full sm:basis-auto">
                                            <Button className="sgc-btn-secondary h-10 px-4" onClick={handlePrint}><Printer className="h-4 w-4" />Imprimir</Button>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>

                        <Card className="sgc-card border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-[#0a0f1a]/80 border-b border-slate-800/50">
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableHead className="min-w-20 text-slate-300 font-bold text-center">IDConv</TableHead>
                                                <TableHead className="min-w-[260px] text-slate-300 font-bold">Nombre completo</TableHead>
                                                <TableHead className="min-w-[90px] text-slate-300 font-bold">Alias</TableHead>
                                                <TableHead className="min-w-[100px] text-slate-300 font-bold">DNI</TableHead>
                                                <TableHead className="min-w-20 text-center text-slate-300 font-bold">Edad</TableHead>
                                                <TableHead className="min-w-[150px] text-slate-300 font-bold">Delito</TableHead>
                                                <TableHead className="min-w-[90px] text-center text-slate-300 font-bold">Pabellón</TableHead>
                                                <TableHead className="min-w-20 text-center text-slate-300 font-bold">Celda</TableHead>
                                                <TableHead className="min-w-[110px] text-center text-slate-300 font-bold">Estado</TableHead>
                                                <TableHead className="min-w-[120px] text-center text-slate-300 font-bold">Peligrosidad</TableHead>
                                                <TableHead className="min-w-[170px] text-slate-300 font-bold">Fecha Registro</TableHead>
                                                <TableHead className="min-w-[100px] text-center text-slate-300 font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredConvictos.length === 0 ? (
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell colSpan={12} className="text-center py-12 text-slate-500">No se encontraron registros en el sistema.</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredConvictos.map(c => (
                                                    <TableRow key={c.id} className="border-slate-800/50 hover:bg-blue-500/10 transition-colors">
                                                        <TableCell className="font-mono text-blue-400 font-bold text-center">C{c.id}</TableCell>
                                                        <TableCell className="font-semibold text-slate-200">{c.nombre}</TableCell>
                                                        <TableCell className="text-slate-400 text-sm">{c.alias || "-"}</TableCell>
                                                        <TableCell className="font-mono text-slate-300">{c.dni}</TableCell>
                                                        <TableCell className="text-center text-slate-300">{c.edad}</TableCell>
                                                        <TableCell className="text-slate-300 truncate max-w-[150px]">{c.delito}</TableCell>
                                                        <TableCell className="text-center font-bold text-slate-200">{c.pabellon}</TableCell>
                                                        <TableCell className="text-center font-mono text-slate-300">{c.celda}</TableCell>
                                                        <TableCell className="text-center"><Badge className={getEstadoColor(c.estado)}>{c.estado}</Badge></TableCell>
                                                        <TableCell className="text-center"><Badge className={getNivelColor(c.nivelPeligrosidad)}>{c.nivelPeligrosidad}</Badge></TableCell>
                                                        <TableCell className="text-slate-400 text-sm">{c.fechaingreso}</TableCell>
                                                        <TableCell className="flex justify-center gap-2">
                                                            <Button 
                                                                size="icon" 
                                                                className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                                                                onClick={() => openEdit("convicto", c)} 
                                                                aria-label="Editar">
                                                                <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                                                            </Button>
                                                            <Button size="icon" className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white h-8 w-8 transition-colors" onClick={() => setDeleteConfirm({type: "convicto", id: c.id})} aria-label="Eliminar">
                                                                <Trash2 className="h-3.5 w-3.5"/>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========== MOVIMIENTOS ========== */}
                    <TabsContent value="movimientos" className="space-y-4">
                        <Card className="sgc-card border-0 mb-4">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Registro de traslados</CardTitle>
                                <div className="relative w-full md:w-80 mt-2 md:mt-0">
                                    <Search className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"/>
                                    <Input placeholder="Buscar traslado..." value={searchMovimientos} onChange={(e) => setSearchMovimientos(e.target.value)} className="sgc-input pl-10 h-10"/>
                                </div>
                            </CardHeader>
                            <div className="flex flex-wrap gap-3 ml-6 mb-0">
                                <Button className="sgc-btn-primary h-10 px-4" onClick={() => setOpenNuevoMovimiento(true)}><Plus className="h-4 w-4"/>Registrar traslado</Button>
                                <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(movimientosData, "movimientos")}><Download className="h-4 w-4"/>Exportar CSV</Button>
                                <div className="basis-full sm:basis-auto">
                                    <Button className="sgc-btn-secondary h-10 px-4" onClick={handlePrint}><Printer className="h-4 w-4" />Imprimir</Button>
                                </div>
                            </div>
                        </Card>
                        <Card className="sgc-card border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-[#0a0f1a]/80 border-b border-slate-800/50">
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableHead className="min-w-20 text-slate-300 font-bold text-center">IDMov</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Fecha</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Hora</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-50 text-slate-300 font-bold">Nombre</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Origen</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Destino</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Motivo</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMovimientos.length === 0 ? (
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">No hay traslados registrados.</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredMovimientos.map(m => (
                                                    <TableRow key={m.id} className="border-slate-800/50 hover:bg-blue-500/10 transition-colors">
                                                        <TableCell className="font-mono text-purple-400 font-bold text-center">M{m.id}</TableCell>
                                                        <TableCell className="text-slate-300 text-sm">{m.fecha}</TableCell>
                                                        <TableCell className="text-slate-300 text-sm text-center">{m.hora}</TableCell>
                                                        <TableCell className="text-center font-mono text-blue-400">C{m.convictoId}</TableCell>
                                                        <TableCell className="font-medium text-slate-200">{m.nombre}</TableCell>
                                                        <TableCell><Badge className="bg-red-500/10 text-red-400 border-red-500/20">{m.origen}</Badge></TableCell>
                                                        <TableCell><Badge className="bg-green-500/10 text-green-400 border-green-500/20">{m.destino}</Badge></TableCell>
                                                        <TableCell className="text-slate-400 text-sm truncate max-w-[150px]">{m.motivo}</TableCell>
                                                        <TableCell className="flex justify-center gap-2">
                                                            <Button 
                                                                size="icon" 
                                                                className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                                                                onClick={() => openEdit("movimiento", m)} 
                                                                aria-label="Editar">
                                                                <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                                                            </Button>
                                                            <Button size="icon" className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white h-8 w-8 transition-colors" onClick={() => setDeleteConfirm({type: "movimiento", id: m.id})}><Trash2 className="h-3.5 w-3.5"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========== CONDUCTA ========== */}
                    <TabsContent value="conducta" className="space-y-4">
                        <Card className="sgc-card border-0 mb-4">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Registro disciplinario</CardTitle>
                                <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
                                    <div className="relative w-full md:w-72">
                                        <Search className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"/>
                                        <Input placeholder="Buscar incidentes..." value={searchConducta} onChange={(e) => setSearchConducta(e.target.value)} className="sgc-input pl-10 h-10!"/>
                                    </div>
                                    {/*SELECT DE TIPO DE CONDUCTA */}
                                    <Select value={tipoConductaFilter} onValueChange={setTipoConductaFilter}>
                                        <SelectTrigger className="sgc-input h-10! w-full md:w-[180px]">
                                            <SelectValue placeholder="Tipo de falta"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="todos" className="focus:bg-blue-600 focus:text-white">Todos los tipos</SelectItem>
                                            <SelectItem value="Positiva" className="focus:bg-blue-600 focus:text-white">Positiva</SelectItem>
                                            <SelectItem value="Falta leve" className="focus:bg-blue-600 focus:text-white">Falta leve</SelectItem>
                                            <SelectItem value="Falta grave" className="focus:bg-blue-600 focus:text-white">Falta grave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <div className="flex flex-wrap gap-3 ml-6 mb-4">
                                <Button className="sgc-btn-primary h-10 px-4" onClick={() => setOpenNuevaConducta(true)}><Plus className="h-4 w-4"/>Registrar conducta</Button>
                                <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(conductaData, "conducta")}><Download className="h-4 w-4"/>Exportar CSV</Button>
                                <div className="basis-full sm:basis-auto">
                                    <Button className="sgc-btn-secondary h-10 px-4" onClick={handlePrint}><Printer className="h-4 w-4" />Imprimir</Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="sgc-card border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-[#0a0f1a]/80 border-b border-slate-800/50">
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableHead className="min-w-20 text-slate-300 font-bold text-center">IDCond</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Fecha</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-50 text-slate-300 font-bold">Nombre</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Tipo</TableHead>
                                                <TableHead className="min-w-60 text-slate-300 font-bold">Descripción</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Sanción</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredConducta.length === 0 ? (
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">No hay registros de conducta.</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredConducta.map(c => (
                                                    <TableRow key={c.id} className="border-slate-800/50 hover:bg-blue-500/10 transition-colors">
                                                        <TableCell className="font-mono text-orange-400 font-bold text-center">CO{c.id}</TableCell>
                                                        <TableCell className="text-slate-300 text-sm">{c.fecha}</TableCell>
                                                        <TableCell className="text-center font-mono text-blue-400">C{c.convictoId}</TableCell>
                                                        <TableCell className="font-medium text-slate-200">{c.nombre}</TableCell>
                                                        <TableCell className="text-center"><Badge className={getTipoConductaColor(c.tipo)}>{c.tipo}</Badge></TableCell>
                                                        <TableCell className="text-slate-300 text-sm truncate max-w-[250px]">{c.descripcion}</TableCell>
                                                        <TableCell className="text-slate-400 text-sm">{c.sancion}</TableCell>
                                                        <TableCell className="flex justify-center gap-2">
                                                            <Button 
                                                            size="icon" 
                                                            className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                                                            onClick={() => openEdit("conducta", c)} 
                                                            aria-label="Editar">
                                                            <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                                                            </Button>
                                                            <Button size="icon" className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white h-8 w-8 transition-colors" onClick={() => setDeleteConfirm({type: "conducta", id: c.id})}><Trash2 className="h-3.5 w-3.5"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========== VISITAS ========== */}
                    <TabsContent value="visitas" className="space-y-4">
                        <Card className="sgc-card border-0 mb-4">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Control de visitas</CardTitle>
                                <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
                                    <div className="relative w-full md:w-72">
                                        <Search className="sgc-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"/>
                                        <Input placeholder="Buscar visita..." value={searchVisitas} onChange={(e) => setSearchVisitas(e.target.value)} className="sgc-input pl-10 h-10!"/>
                                    </div>
                                    {/*SELECT DE ESTADO DE VISITA */}
                                    <Select value={estadoVisitaFilter} onValueChange={setEstadoVisitaFilter}>
                                        <SelectTrigger className="sgc-input h-10! w-full md:w-[180px]">
                                            <SelectValue placeholder="Estado"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="todos" className="focus:bg-blue-600 focus:text-white">Todos los estados</SelectItem>
                                            <SelectItem value="programada" className="focus:bg-blue-600 focus:text-white">Programado</SelectItem>
                                            <SelectItem value="realizada" className="focus:bg-blue-600 focus:text-white">Realizado</SelectItem>
                                            <SelectItem value="cancelada" className="focus:bg-blue-600 focus:text-white">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <div className="flex flex-wrap gap-3 mb-4 ml-6">
                                <Button className="sgc-btn-primary h-10 px-4" onClick={() => setOpenNuevaVisita(true)}><Plus className="h-4 w-4"/>Registrar visita</Button>
                                <Button className="sgc-btn-secondary h-10 px-4" onClick={() => exportToCSV(visitasData, "visitas")}><Download className="h-4 w-4"/>Exportar CSV</Button>
                                <div className="basis-full sm:basis-auto">
                                    <Button className="sgc-btn-secondary h-10 px-4" onClick={handlePrint}><Printer className="h-4 w-4" />Imprimir</Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="sgc-card border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-[#0a0f1a]/80 border-b border-slate-800/50">
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableHead className="min-w-20 text-slate-300 font-bold text-center">IDVisita</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Fecha</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Hora</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">IDConv</TableHead>
                                                <TableHead className="min-w-[200px] text-slate-300 font-bold">Interno</TableHead>
                                                <TableHead className="min-w-[150px] text-slate-300 font-bold">Visitante</TableHead>
                                                <TableHead className="text-slate-300 font-bold">DNI Visitante</TableHead>
                                                <TableHead className="text-slate-300 font-bold">Parentesco</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Estado</TableHead>
                                                <TableHead className="text-center text-slate-300 font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVisitas.length === 0 ? (
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">No hay visitas registradas.</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredVisitas.map(v => (
                                                    <TableRow key={v.id} className="border-slate-800/50 hover:bg-blue-500/10 transition-colors">
                                                        <TableCell className="font-mono text-cyan-400 font-bold text-center">V{v.id}</TableCell>
                                                        <TableCell className="text-slate-300 text-sm">{v.fecha}</TableCell>
                                                        <TableCell className="text-slate-300 text-sm">{v.hora}</TableCell>
                                                        <TableCell className="text-center font-mono text-blue-400">C{v.convictoId}</TableCell>
                                                        <TableCell className="font-medium text-slate-200">{v.nombre}</TableCell>
                                                        <TableCell className="text-slate-300">{v.visitante}</TableCell>
                                                        <TableCell className="font-mono text-slate-400">{v.dniVisitante}</TableCell>
                                                        <TableCell className="text-slate-400">{v.parentesco}</TableCell>
                                                        <TableCell className="text-center"><Badge className={getEstadoVisitaColor(v.estado)}>{v.estado}</Badge></TableCell>
                                                        <TableCell className="flex justify-center gap-2">
                                                                <Button 
                                                                size="icon" 
                                                                className="h-8 w-8 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                                                                onClick={() => openEdit("visita", v)} 
                                                                aria-label="Editar">
                                                                <Edit2 className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                                                            </Button>
                                                            <Button size="icon" className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white h-8 w-8 transition-colors" onClick={() => setDeleteConfirm({type: "visita", id: v.id})}><Trash2 className="h-3.5 w-3.5"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* =========================================================
                    VENTANAS EMERGENTES (MODALS) CON DISEÑO SGC
                ========================================================= */}

                {/* DIALOG: NUEVO CONVICTO */}
                <Dialog open={openNuevoConvicto} onOpenChange={(open) => {
                    setOpenNuevoConvicto(open);
                    if (!open) {
                        setConvictoForm({
                            nombre: "", alias: "", dni: "", edad: "", delito: "", pabellon: "",
                            celda: "", estado: "", nivel: "", contacto: "", observaciones: "", fechaingreso: ""
                        });
                    }
                }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Nuevo registro de convicto</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Ingrese los datos del interno (* obligatorio).</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGuardarNuevoConvicto} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Nombre completo *</Label><Input value={convictoForm.nombre} onChange={e => setConvictoForm({...convictoForm, nombre: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Alias</Label><Input value={convictoForm.alias} onChange={e => setConvictoForm({...convictoForm, alias: e.target.value})} className="sgc-input"/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">DNI *</Label><Input value={convictoForm.dni} onChange={e => setConvictoForm({...convictoForm, dni: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Edad *</Label><Input type="number" value={convictoForm.edad} onChange={e => setConvictoForm({...convictoForm, edad: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Delito *</Label><Input value={convictoForm.delito} onChange={e => setConvictoForm({...convictoForm, delito: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Pabellón *</Label>
                                    <Select value={convictoForm.pabellon} onValueChange={v => setConvictoForm({...convictoForm, pabellon: v})}>
                                        <SelectTrigger className="sgc-input"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="A" className="focus:bg-blue-600 focus:text-white">A</SelectItem>
                                            <SelectItem value="B" className="focus:bg-blue-600 focus:text-white">B</SelectItem>
                                            <SelectItem value="C" className="focus:bg-blue-600 focus:text-white">C</SelectItem>
                                            <SelectItem value="D" className="focus:bg-blue-600 focus:text-white">D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label className="sgc-label">Celda *</Label><Input value={convictoForm.celda} onChange={e => setConvictoForm({...convictoForm, celda: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Estado judicial *</Label>
                                    <Select value={convictoForm.estado} onValueChange={v => setConvictoForm({...convictoForm, estado: v})}>
                                        <SelectTrigger className="sgc-input"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Procesado" className="focus:bg-blue-600 focus:text-white">Procesado</SelectItem>
                                            <SelectItem value="Condenado" className="focus:bg-blue-600 focus:text-white">Condenado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Nivel de peligrosidad *</Label>
                                    <Select value={convictoForm.nivel} onValueChange={v => setConvictoForm({...convictoForm, nivel: v})}>
                                        <SelectTrigger className="sgc-input w-[180px] flex items-center justify-between px-3 text-sm text-slate-200"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Baja" className="focus:bg-blue-600 focus:text-white">Baja</SelectItem>
                                            <SelectItem value="Media" className="focus:bg-blue-600 focus:text-white">Media</SelectItem>
                                            <SelectItem value="Alta" className="focus:bg-blue-600 focus:text-white">Alta</SelectItem>
                                            <SelectItem value="Máxima" className="focus:bg-blue-600 focus:text-white">Máxima</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label className="sgc-label">Contacto (Opcional)</Label><Input value={convictoForm.contacto} onChange={e => setConvictoForm({...convictoForm, contacto: e.target.value})} className="sgc-input"/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Observaciones</Label><Textarea value={convictoForm.observaciones} onChange={e => setConvictoForm({...convictoForm, observaciones: e.target.value})} rows={3} className="sgc-input min-h-20"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => {
                                    setOpenNuevoConvicto(false);
                                    setConvictoForm({ nombre: "", alias: "", dni: "", edad: "", delito: "", pabellon: "", celda: "", estado: "", nivel: "", contacto: "", observaciones: "", fechaingreso: "" });
                                }}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isSubmittingConvicto}>{isSubmittingConvicto ? "Guardando..." : "Registrar Convicto"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: EDITAR CONVICTO */}
                <Dialog open={editingData?.type === "convicto"} onOpenChange={(open) => { if (!open) setEditingData(null); }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Editar datos del convicto</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Modifique la información y guarde los cambios.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Nombre</Label><Input value={clean(editingData?.data.nombre)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, nombre: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Alias</Label><Input value={clean(editingData?.data.alias)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, alias: e.target.value}})} className="sgc-input"/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">DNI</Label><Input value={clean(editingData?.data.dni)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, dni: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Edad</Label><Input type="number" value={String(editingData?.data.edad ?? "")} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, edad: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Delito</Label><Input value={clean(editingData?.data.delito)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, delito: e.target.value}})} className="sgc-input"/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Pabellón</Label>
                                    <Select value={editingData?.data.pabellon ?? ""} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, pabellon: v}})}>
                                        <SelectTrigger className="sgc-input"><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="A" className="focus:bg-blue-600 focus:text-white">A</SelectItem>
                                            <SelectItem value="B" className="focus:bg-blue-600 focus:text-white">B</SelectItem>
                                            <SelectItem value="C" className="focus:bg-blue-600 focus:text-white">C</SelectItem>
                                            <SelectItem value="D" className="focus:bg-blue-600 focus:text-white">D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label className="sgc-label">Celda</Label><Input value={clean(editingData?.data.celda)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, celda: e.target.value}})} className="sgc-input"/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Estado</Label>
                                    <Select value={editingData?.data.estado ?? ""} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, estado: v}})}>
                                        <SelectTrigger className="sgc-input"><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Procesado" className="focus:bg-blue-600 focus:text-white">Procesado</SelectItem>
                                            <SelectItem value="Condenado" className="focus:bg-blue-600 focus:text-white">Condenado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Nivel de peligrosidad</Label>
                                    <Select value={editingData?.data.nivel ?? editingData?.data.nivelPeligrosidad ?? ""} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, nivel: v, nivelPeligrosidad: v}})}>
                                        <SelectTrigger className="sgc-input"><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Baja" className="focus:bg-blue-600 focus:text-white">Baja</SelectItem>
                                            <SelectItem value="Media" className="focus:bg-blue-600 focus:text-white">Media</SelectItem>
                                            <SelectItem value="Alta" className="focus:bg-blue-600 focus:text-white">Alta</SelectItem>
                                            <SelectItem value="Máxima" className="focus:bg-blue-600 focus:text-white">Máxima</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label className="sgc-label">Contacto</Label><Input value={clean(editingData?.data.contacto)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, contacto: e.target.value}})} className="sgc-input"/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Observaciones</Label><Textarea value={clean(editingData?.data.observaciones)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, observaciones: e.target.value}})} rows={3} className="sgc-input min-h-20"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => setEditingData(null)} disabled={isEditingSubmitting}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: NUEVO MOVIMIENTO */}
                <Dialog open={openNuevoMovimiento} onOpenChange={(open) => {
                    setOpenNuevoMovimiento(open);
                    if(!open) {
                        setBusquedaConvicto("");
                        setMovimientoForm({ convictoId: "", origen: "", destino: "", motivo: "", fecha: "", hora: "", autorizadoPor: "" });
                    }
                }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Registrar traslado</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Declare el movimiento interno o externo del convicto.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistrarMovimiento(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Selección de Interno *</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setMovimientoForm({ ...movimientoForm, convictoId: "" });
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setMovimientoForm({ ...movimientoForm, convictoId: String(filtrados[0].id) });
                                            } else {
                                                setMovimientoForm({ ...movimientoForm, convictoId: "" });
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={movimientoForm.convictoId} onValueChange={v => setMovimientoForm({...movimientoForm, convictoId: v})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha *</Label><Input type="date" value={movimientoForm.fecha} onChange={e => setMovimientoForm({...movimientoForm, fecha: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Hora *</Label><Input type="time" value={movimientoForm.hora} onChange={e => setMovimientoForm({...movimientoForm, hora: e.target.value})} className="sgc-input" required/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Origen *</Label><Input value={movimientoForm.origen} onChange={e => setMovimientoForm({...movimientoForm, origen: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Destino *</Label><Input value={movimientoForm.destino} onChange={e => setMovimientoForm({...movimientoForm, destino: e.target.value})} className="sgc-input" required/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Motivo *</Label><Input value={movimientoForm.motivo} onChange={e => setMovimientoForm({...movimientoForm, motivo: e.target.value})} className="sgc-input" required/></div>
                            <div className="space-y-1.5"><Label className="sgc-label">Autorizado Por</Label><Input value={movimientoForm.autorizadoPor} onChange={e => setMovimientoForm({...movimientoForm, autorizadoPor: e.target.value})} placeholder="Ej. Director General" className="sgc-input"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => {
                                    setOpenNuevoMovimiento(false);
                                    setBusquedaConvicto("");
                                    setMovimientoForm({ convictoId: "", origen: "", destino: "", motivo: "", fecha: "", hora: "", autorizadoPor: "" });
                                }}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isSubmittingMovimiento}>{isSubmittingMovimiento ? "Guardando..." : "Registrar Traslado"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: EDITAR MOVIMIENTO */}
                <Dialog open={editingData?.type === "movimiento"} onOpenChange={(open) => { if(!open) { setEditingData(null); setBusquedaConvicto(""); } }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Editar registro de traslado</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Actualice la bitácora de movimiento.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Cambiar Interno Asignado</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: String(filtrados[0].id)}});
                                            } else {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={String(editingData?.data.convictoId ?? "")} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, convictoId: v}})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha *</Label><Input type="date" value={getFormattedDate(editingData?.data.fecha)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, fecha: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Hora *</Label><Input type="time" value={editingData?.data.hora ?? ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, hora: e.target.value}})} className="sgc-input" required/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Origen *</Label><Input value={editingData?.data.origen ?? ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, origen: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Destino *</Label><Input value={editingData?.data.destino ?? ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, destino: e.target.value}})} className="sgc-input" required/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Motivo *</Label><Input value={editingData?.data.motivo ?? ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, motivo: e.target.value}})} className="sgc-input" required/></div>
                            <div className="space-y-1.5"><Label className="sgc-label">Autorizado Por</Label><Input value={editingData?.data.autorizadoPor ?? ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, autorizadoPor: e.target.value}})} className="sgc-input"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => { setEditingData(null); setBusquedaConvicto(""); }} disabled={isEditingSubmitting}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: NUEVA CONDUCTA */}
                <Dialog open={openNuevaConducta} onOpenChange={(open) => {
                    setOpenNuevaConducta(open);
                    if(!open) {
                        setBusquedaConvicto("");
                        setConductaForm({convictoId: "", tipo: "", descripcion: "", sancion: "", fecha: ""});
                    }
                }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Registrar conducta</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Reporte incidencias o méritos del interno.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistrarConducta(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Selección de Interno *</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setConductaForm({ ...conductaForm, convictoId: "" });
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setConductaForm({ ...conductaForm, convictoId: String(filtrados[0].id) });
                                            } else {
                                                setConductaForm({ ...conductaForm, convictoId: "" });
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={conductaForm.convictoId} onValueChange={v => setConductaForm({...conductaForm, convictoId: v})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Tipo *</Label>
                                    <Select value={conductaForm.tipo} onValueChange={v => setConductaForm({...conductaForm, tipo: v})}>
                                        <SelectTrigger className="sgc-input"><SelectValue placeholder="Tipo de falta"/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Positiva" className="focus:bg-blue-600 focus:text-white">Positiva</SelectItem>
                                            <SelectItem value="Falta leve" className="focus:bg-blue-600 focus:text-white">Falta leve</SelectItem>
                                            <SelectItem value="Falta grave" className="focus:bg-blue-600 focus:text-white">Falta grave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha</Label><Input type="date" value={conductaForm.fecha} onChange={e => setConductaForm({...conductaForm, fecha: e.target.value})} className="sgc-input"/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Descripción *</Label><Textarea value={conductaForm.descripcion} onChange={e => setConductaForm({...conductaForm, descripcion: e.target.value})} rows={3} className="sgc-input min-h-20" required/></div>
                            <div className="space-y-1.5"><Label className="sgc-label">Sanción (Opcional)</Label><Input value={conductaForm.sancion} onChange={e => setConductaForm({...conductaForm, sancion: e.target.value})} className="sgc-input"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => {
                                    setOpenNuevaConducta(false);
                                    setBusquedaConvicto("");
                                    setConductaForm({convictoId: "", tipo: "", descripcion: "", sancion: "", fecha: ""});
                                }}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isSubmittingConducta}>{isSubmittingConducta ? "Guardando..." : "Registrar"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: EDITAR CONDUCTA */}
                <Dialog open={editingData?.type === "conducta"} onOpenChange={(open) => { if(!open) { setEditingData(null); setBusquedaConvicto(""); } }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Editar registro disciplinario</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Modifique los detalles del reporte.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Cambiar Interno Asignado</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: String(filtrados[0].id)}});
                                            } else {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={String(editingData?.data.convictoId ?? "")} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, convictoId: v}})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha *</Label><Input type="date" value={getFormattedDate(editingData?.data.fecha)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, fecha: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Tipo *</Label>
                                    <Select value={editingData?.data.tipo || ""} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, tipo: v}})}>
                                        <SelectTrigger className="sgc-input"><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="Positiva" className="focus:bg-blue-600 focus:text-white">Positiva</SelectItem>
                                            <SelectItem value="Falta leve" className="focus:bg-blue-600 focus:text-white">Falta leve</SelectItem>
                                            <SelectItem value="Falta grave" className="focus:bg-blue-600 focus:text-white">Falta grave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5"><Label className="sgc-label">Descripción *</Label><Textarea value={editingData?.data.descripcion || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, descripcion: e.target.value}})} className="sgc-input min-h-20" required/></div>
                            <div className="space-y-1.5"><Label className="sgc-label">Sanción</Label><Input value={editingData?.data.sancion || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, sancion: e.target.value}})} className="sgc-input"/></div>
                            <div className="space-y-1.5"><Label className="sgc-label">Registrado por</Label><Input value={editingData?.data.registrado || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, registrado: e.target.value}})} className="sgc-input"/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => { setEditingData(null); setBusquedaConvicto(""); }} disabled={isEditingSubmitting}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: NUEVA VISITA */}
                <Dialog open={openNuevaVisita} onOpenChange={(open) => {
                    setOpenNuevaVisita(open);
                    if(!open) {
                        setBusquedaConvicto("");
                        setVisitaForm({ convictoId: "", visitante: "", dniVisitante: "", parentesco: "", fecha: "", hora: "", estado: "" });
                    }
                }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Agendar visita</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Registre una cita nueva para el interno.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistrarVisita(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Selección de Interno *</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setVisitaForm({ ...visitaForm, convictoId: "" });
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setVisitaForm({ ...visitaForm, convictoId: String(filtrados[0].id) });
                                            } else {
                                                setVisitaForm({ ...visitaForm, convictoId: "" });
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={visitaForm.convictoId} onValueChange={v => setVisitaForm({...visitaForm, convictoId: v})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Visitante *</Label><Input value={visitaForm.visitante} onChange={e => setVisitaForm({...visitaForm, visitante: e.target.value})} className="sgc-input" required placeholder="Nombre completo"/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">DNI Visitante *</Label><Input value={visitaForm.dniVisitante} onChange={e => setVisitaForm({...visitaForm, dniVisitante: e.target.value})} className="sgc-input" required placeholder="Nro de documento"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha *</Label><Input type="date" value={visitaForm.fecha} onChange={e => setVisitaForm({...visitaForm, fecha: e.target.value})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Hora *</Label><Input type="time" value={visitaForm.hora} onChange={e => setVisitaForm({...visitaForm, hora: e.target.value})} className="sgc-input" required/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Parentesco *</Label><Input value={visitaForm.parentesco} onChange={e => setVisitaForm({...visitaForm, parentesco: e.target.value})} className="sgc-input" required placeholder="Ej: Madre, Abogado"/></div>
                                <div className="space-y-1.5">
                                    <Label className="sgc-label">Estado *</Label>
                                    <Select value={visitaForm.estado} onValueChange={v => setVisitaForm({...visitaForm, estado: v})}>
                                        <SelectTrigger className="sgc-input"><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                            <SelectItem value="programada" className="focus:bg-blue-600 focus:text-white">Programada</SelectItem>
                                            <SelectItem value="cancelada" className="focus:bg-blue-600 focus:text-white">Cancelada</SelectItem>
                                            <SelectItem value="realizada" className="focus:bg-blue-600 focus:text-white">Realizada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => {
                                    setOpenNuevaVisita(false);
                                    setBusquedaConvicto("");
                                    setVisitaForm({ convictoId: "", visitante: "", dniVisitante: "", parentesco: "", fecha: "", hora: "", estado: "" });
                                }}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isSubmittingVisita}>{isSubmittingVisita ? "Agendando..." : "Programar Visita"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DIALOG: EDITAR VISITA */}
                <Dialog open={editingData?.type === "visita"} onOpenChange={(open) => { if(!open) { setEditingData(null); setBusquedaConvicto(""); } }}>
                    <DialogContent className="sgc-card border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Editar registro de visitas</DialogTitle>
                            <DialogDescription className="text-slate-400 text-[15px]">Actualice el estatus o datos de la visita.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4 pt-2">
                            
                            <div className="space-y-2 p-3 rounded-lg border border-slate-800/80 bg-[#0a0f1a]/50">
                                <Label className="sgc-label text-blue-400 font-bold tracking-wider">Cambiar Interno Asignado</Label>
                                <Input
                                    placeholder="Buscar por DNI, Nombre o ID..."
                                    value={busquedaConvicto}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setBusquedaConvicto(valor);
                                        if (valor.trim() === "") {
                                            setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                        } else {
                                            const filtrados = convictosData.filter(c =>
                                                (c.nombre && c.nombre.toLowerCase().includes(valor.toLowerCase())) ||
                                                (c.dni && c.dni.includes(valor)) ||
                                                (c.id && c.id.toString() === valor)
                                            );
                                            if (filtrados.length > 0) {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: String(filtrados[0].id)}});
                                            } else {
                                                setEditingData({...editingData!, data: {...editingData!.data, convictoId: ""}});
                                            }
                                        }
                                    }}
                                    className="sgc-input h-10 border-slate-700 bg-[#060a12]"
                                />
                                <Select value={String(editingData?.data.convictoId ?? "")} onValueChange={v => setEditingData({...editingData!, data: {...editingData!.data, convictoId: v}})}>
                                    <SelectTrigger className="sgc-input h-11 w-full"><SelectValue placeholder="Seleccione un interno de la lista"/></SelectTrigger>
                                    <SelectContent className="bg-[#111827] border border-slate-800 text-slate-200 max-h-60">
                                        {convictosFiltrados.length > 0 ? (
                                            convictosFiltrados.map(c => (<SelectItem key={c.id} value={c.id.toString()} className="focus:bg-blue-600 focus:text-white">{getConvictoLabel(c)}</SelectItem>))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-400 text-center">Sin resultados para "{busquedaConvicto}"</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Visitante *</Label><Input value={editingData?.data.visitante || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, visitante: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">DNI Visitante *</Label><Input value={editingData?.data.dniVisitante || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, dniVisitante: e.target.value}})} className="sgc-input" required/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="sgc-label">Fecha *</Label><Input type="date" value={getFormattedDate(editingData?.data.fecha)} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, fecha: e.target.value}})} className="sgc-input" required/></div>
                                <div className="space-y-1.5"><Label className="sgc-label">Hora *</Label><Input type="time" value={editingData?.data.hora || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, hora: e.target.value}})} className="sgc-input" required/></div>
                            </div>
                            <div className="space-y-1.5"><Label className="sgc-label">Parentesco *</Label><Input value={editingData?.data.parentesco || ""} onChange={e => setEditingData({...editingData!, data: {...editingData!.data, parentesco: e.target.value}})} className="sgc-input" required/></div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="sgc-btn-secondary flex-1" onClick={() => { setEditingData(null); setBusquedaConvicto(""); }} disabled={isEditingSubmitting}>Cancelar</Button>
                                <Button type="submit" className="sgc-btn-primary flex-1" disabled={isEditingSubmitting}>{isEditingSubmitting ? "Guardando..." : "Actualizar"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ---------- ALERT: BORRADO DINÁMICO) ---------- */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                            {/* Mensaje dinámico */}
                            {deleteConfirm?.type === "convicto" ? (
                                <p className="text-muted-foreground text-[15px]">Al eliminar un convicto se eliminarán
                                    automáticamente todos sus datos incluidos en movimientos, conducta y visitas.</p>) : (
                                <p className="text-muted-foreground text-[15px]">El registro se eliminará permanentemente.</p>)}
                        </AlertDialogHeader>
                        <div className="flex gap-4 p-1 mt-4">
                            <Button className="flex-1 border-2 hover:bg-blue-400" variant="outline"
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