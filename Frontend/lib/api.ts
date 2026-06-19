import { authFetch } from "./auth"

const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const API_URL = isLocalhost 
? "http://localhost:5000" 
: "https://sgc-backend-vbze.onrender.com";

export interface LoginRequest {
    usuario: string
    contrasena: string
}

export interface LoginResponse {
    success: boolean
    error: string
    message: string
    usuario?: {
        id: number
        nombreCompleto: string
        dni: string
        cargo: string
        nivelAcceso: string
        usuarioNombre: string
    }
}

export interface RegistroUsuarioRequest {
    nombreCompleto: string
    dni: string
    cargo: string
    nivelAcceso: string
    usuario: string
    contrasena: string
}

export interface Convicto {
    id: number
    nombre: string
    dni: string
    fechaIngreso: string
    delito: string
    condena: string
    pabellon: string
    celda: string
    estado: string
    nivelPeligrosidad: string
}

export interface ConvictoRequest {
    nombre: string
    dni: string
    fechaIngreso: string
    delito: string
    condena: string
    pabellon: string
    celda: string
    estado: string
    nivelPeligrosidad: string
}

export interface Incidente {
    id: number
    tipo: string
    descripcion: string
    ubicacion: string
    gravedad: string
    convictoID?: number
    fecha: string
    reportadoPor: string
}

export interface IncidenteRequest {
    tipo: string
    descripcion: string
    ubicacion: string
    gravedad: string
    convictoID?: number
    reportadoPor: string
}

export interface RevisionMedica {
    id: number
    convictoID: number
    fecha: string
    diagnostico: string
    tratamiento: string
    prioridad: string
    medicoResponsable: string
    nombreConvicto?: string
}

export interface RevisionMedicaRequest {
    convictoID: number
    diagnostico: string
    tratamiento: string
    prioridad: string
    medicoResponsable: string
}

export interface Movimiento {
    id: number
    convictoID: number
    tipoMovimiento: string
    origen: string
    destino: string
    fecha: string
    motivo: string
    autorizadoPor: string
    nombreConvicto?: string
}

export interface MovimientoRequest {
    convictoID: number
    tipoMovimiento: string
    origen: string
    destino: string
    motivo: string
    autorizadoPor: string
}

// ==================== AUTH ====================

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await authFetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

export async function registrarUsuario(data: RegistroUsuarioRequest): Promise<{
    success: boolean;
    error: string;
    message: string
}> {
    const response = await authFetch(`${API_URL}/api/auth/registro`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

// ==================== CONVICTOS ====================

export async function obtenerConvictos(): Promise<Convicto[]> {
    const response = await authFetch(`${API_URL}/api/convictos`)
    if (!response.ok) throw new Error("Error al obtener convictos")
    return response.json()
}

export async function obtenerConvictoPorId(id: number): Promise<Convicto> {
    const response = await authFetch(`${API_URL}/api/convictos/${id}`)
    return response.json()
}

export async function crearConvicto(data: ConvictoRequest): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${API_URL}/api/convictos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

export async function actualizarConvicto(
    id: number,
    data: ConvictoRequest,
): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${API_URL}/api/convictos/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

// ==================== SEGURIDAD ====================

export async function obtenerIncidentes(): Promise<Incidente[]> {
    const response = await authFetch(`${API_URL}/api/seguridad/incidentes`)
    return response.json()
}

export async function crearIncidente(data: IncidenteRequest): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${API_URL}/api/seguridad/incidentes`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

export async function obtenerMovimientos(): Promise<Movimiento[]> {
    const response = await authFetch(`${API_URL}/api/seguridad/movimientos`)
    return response.json()
}

export async function crearMovimiento(data: MovimientoRequest): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${API_URL}/api/seguridad/movimientos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}

// ==================== MÉDICO ====================

export async function obtenerRevisionesMedicas(): Promise<RevisionMedica[]> {
    const response = await authFetch(`${API_URL}/api/medico/revisiones`)
    return response.json()
}

export async function crearRevisionMedica(data: RevisionMedicaRequest): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${API_URL}/api/medico/revisiones`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })
    return response.json()
}
