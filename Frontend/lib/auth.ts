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

export const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); 

    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers || {});
    
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    try {
        const response = await fetch(input, { ...init, headers, signal: controller.signal });
        clearTimeout(id);
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "/";
        }
        return response;
    } catch (error) {
        clearTimeout(id);
        console.warn("Error en la petición:", error);
        return new Response(JSON.stringify({ error: "Network Error" }), { status: 503 });
    }
}