"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [autorizado, setAutorizado] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("authToken")
        if (!token) {
            router.replace("/")
            return
        }
        setAutorizado(true)
    }, [router])

    if (!autorizado) return null

    return <>{children}</>
}
