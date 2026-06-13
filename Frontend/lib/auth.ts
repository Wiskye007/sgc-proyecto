// Manejo de sesión en el cliente: token de sesión + usuario actual.

export function getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
}

export function clearSession() {
    if (typeof window === "undefined") return
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
}

// Cabeceras con el token de sesión (si existe).
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = getAuthToken()
    return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra }
}

// Wrapper de fetch que adjunta el token y, si la sesión expiró (401 con token
// presente), la limpia y redirige al login.
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const token = getAuthToken()
    const headers = new Headers(init.headers || {})
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }
    if (token) headers.set("Authorization", `Bearer ${token}`)

    const response = await fetch(input, { ...init, headers })

    if (response.status === 401 && token) {
        clearSession()
        if (typeof window !== "undefined") window.location.href = "/"
    }
    return response
}
