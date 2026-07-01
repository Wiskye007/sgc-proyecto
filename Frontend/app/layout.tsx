import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import SessionManager from "@/components/SessionManager"; // Tu nuevo componente global

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "SGC - Sistema de Gestión Carcelaria",
    description: "Carceleta San Martín",
    generator: 'v0.app'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="es" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
            <head>
                {/* Script sincrónico para aplicar el tamaño de letra */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                const fuente = localStorage.getItem('sgc_fuente');
                                if (fuente === 'pequeno') document.documentElement.classList.add('text-sm');
                                else if (fuente === 'grande') document.documentElement.classList.add('text-lg');
                                else document.documentElement.classList.add('text-base');
                            } catch (e) {}
                        `,
                    }}
                />
            </head>
            <body className="antialiased">
                {/* El SessionManager envuelve la aplicación globalmente */}
                <SessionManager>
                    {children}
                </SessionManager>
                <Toaster />
            </body>
        </html>
    )
}
