'use client';
import { useEffect } from 'react';
import { ThemeProvider } from './theme-provider';

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

export default function SessionManager({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const enviarPing = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) return;
            
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

    // Restaurar tema desde localStorage al cargar
    useEffect(() => {
        const savedTheme = localStorage.getItem("tema");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        if (savedTheme === "claro") {
            document.documentElement.classList.remove("dark");
        } else if (savedTheme === "oscuro") {
            document.documentElement.classList.add("dark");
        } else if (prefersDark) {
            document.documentElement.classList.add("dark");
        }
    }, []);

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="tema-sgc">
            {children}
        </ThemeProvider>
    );
}
