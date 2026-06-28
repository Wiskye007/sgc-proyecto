'use client';
import { useEffect } from 'react';

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

export default function SessionManager({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const enviarPing = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) return; // Si no hay sesión, no se hace ping
            
            try {
                await fetch(`${API_URL}/usuarios/ping`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.warn("Ping silencioso fallido");
            }
        };

        enviarPing();
        const interval = setInterval(enviarPing, 15 * 1000);
        return () => clearInterval(interval);
    }, []);

    return <>{children}</>;
}