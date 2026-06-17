//const API_URL = "https://sgc-backend-vbze.onrender.com";    
const API_URL = "http://localhost:5000";

function getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
}

// Función auxiliar para hacer peticiones
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`
    const token = getToken()

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })

    if (response.status === 401 && token) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("currentUser")
        if (typeof window !== "undefined") window.location.href = "/"
        throw new Error("Sesión expirada")
    }

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Error en la petición")
    }

    return response.json()
}

// ============= AUTENTICACIÓN =============

export async function login(usuario: string, contrasena: string) {
    return fetchAPI("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({usuario, contrasena}),
    })
}

export async function registrarUsuario(data: {
    nombreCompleto: string
    dni: string
    cargo: string
    nivelAcceso: string
    usuario: string
    contrasena: string
}) {
    return fetchAPI("/api/auth/registro", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ============= CONVICTOS =============

export async function getConvictos() {
    return fetchAPI("/api/convictos")
}

export async function getConvicto(id: number) {
    return fetchAPI(`/api/convictos/${id}`)
}

export async function crearConvicto(data: any) {
    return fetchAPI("/api/convictos", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function actualizarConvicto(id: number, data: any) {
    return fetchAPI(`/api/convictos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function eliminarConvicto(id: number) {
    return fetchAPI(`/api/convictos/${id}`, {
        method: "DELETE",
    })
}

// ============= MOVIMIENTOS =============

export async function getMovimientos() {
    return fetchAPI("/api/convictos/movimientos")
}

export async function crearMovimiento(data: any) {
    return fetchAPI("/api/convictos/movimientos", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ============= CONDUCTA =============

export async function getConductas() {
    return fetchAPI("/api/convictos/conducta")
}

export async function crearConducta(data: any) {
    return fetchAPI("/api/convictos/conducta", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ============= VISITAS =============

export async function getVisitas() {
    return fetchAPI("/api/convictos/visitas")
}

export async function crearVisita(data: any) {
    return fetchAPI("/api/convictos/visitas", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ============= SEGURIDAD =============

export async function getIncidentes() {
    return fetchAPI("/api/seguridad/incidentes")
}

export async function crearIncidente(data: any) {
    return fetchAPI("/api/seguridad/incidentes", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function actualizarIncidente(id: number, data: any) {
    return fetchAPI(`/api/seguridad/incidentes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

// ============= MÉDICO =============

export async function getRevisionesMedicas() {
    return fetchAPI("/api/medico/revisiones")
}

export async function crearRevisionMedica(data: any) {
    return fetchAPI("/api/medico/revisiones", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function getTratamientos() {
    return fetchAPI("/api/medico/tratamientos")
}

export async function crearTratamiento(data: any) {
    return fetchAPI("/api/medico/tratamientos", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function getDerivaciones() {
    return fetchAPI("/api/medico/derivaciones")
}

export async function crearDerivacion(data: any) {
    return fetchAPI("/api/medico/derivaciones", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ============= REPORTES =============

export async function getReportes() {
    return fetchAPI("/api/reportes")
}

export async function getReporte(id: number) {
    return fetchAPI(`/api/reportes/${id}`)
}

export async function crearReporte(data: any) {
    return fetchAPI("/api/reportes", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function actualizarReporte(id: number, data: any) {
    return fetchAPI(`/api/reportes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function eliminarReporte(id: number) {
    return fetchAPI(`/api/reportes/${id}`, {
        method: "DELETE",
    })
}   