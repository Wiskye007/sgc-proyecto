'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Lock, Shield, Server, Download, ArrowLeft, Save, X, Type, LayoutGrid, MonitorPlay, Timer, Activity } from 'lucide-react';
import { authFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

interface Configuracion {
  idUsuario: number;  
  notificacionesEmail: boolean;
  notificacionesSistema: boolean;
  privacidadPerfil: string;
  autenticacionDosFactores: boolean;
  cierreInactividad: string;
  densidadTablas: string;
  pantallaInicio: string;
  tamanoFuente: string;
  esAdmin?: boolean;
  versionSistema?: string;
  maintenanceMode?: boolean;
}

interface HistorialConexion {
  fecha: string;
  ip: string;
  dispositivo: string;
}

export default function ConfiguracionPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [historial, setHistorial] = useState<HistorialConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambios, setCambios] = useState<Partial<Configuracion>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.push('/');
      return;
    }
    fetchDatos();
  }, []);

const fetchDatos = async () => {
    try { 
      if (!configuracion) setLoading(true); 
      // 1. Obtener Configuración
      const resConfig = await authFetch(`${API_URL}/usuarios/configuracion`);
      if (resConfig.ok) {
        const data = await resConfig.json();
        setConfiguracion(data.configuracion); 
      } 

      // 2. Obtener Historial
      const resHist = await authFetch(`${API_URL}/usuarios/historial-conexiones`);
      if (resHist.ok) {
        const dataHist = await resHist.json();
        setHistorial(dataHist.historial || []);
      }
    } catch (err) {
      toast({ title: "Error", description: 'No se pudo cargar la información de seguridad', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof Configuracion, value: any) => {
    setCambios(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      const response = await authFetch(`${API_URL}/usuarios/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configuracion,
          ...cambios
        }),
      }); 

      if (!response.ok) throw new Error('Error al guardar configuración');  
      toast({ title: "Acción exitosa", description: "Configuración guardada correctamente" });
      if (cambios.densidadTablas) {
          localStorage.setItem('sgc_densidad', cambios.densidadTablas);
      }
      if (cambios.tamanoFuente) {
          localStorage.setItem('sgc_fuente', cambios.tamanoFuente);
          
          document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
          if (cambios.tamanoFuente === 'pequeno') document.documentElement.classList.add('text-sm');
          if (cambios.tamanoFuente === 'mediano') document.documentElement.classList.add('text-base');
          if (cambios.tamanoFuente === 'grande') document.documentElement.classList.add('text-lg');
      }

      setCambios({});
      fetchDatos();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al guardar', variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };  

  const hasChanges = Object.keys(cambios).length > 0;

  if (loading) {
    return (
      <div className="sgc-bg min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"/>
            <p className="text-slate-400 font-medium">Cargando preferencias...</p>
        </div>
      </div>
    );
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ title: "Nada que exportar", description: "No hay registros disponibles", variant: "destructive" });
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({ title: "Descargado", description: `${filename}.csv` });
  };

  // Lógica de herramientas del sistema
  const ejecutarHerramienta = async (herramienta: 'estado' | 'exportar' | 'reporte') => {
    try {
      if (herramienta === 'estado') {
        const res = await authFetch(`${API_URL}/usuarios/sistema/estado`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ 
          title: "Estado del Servidor", 
          description: `SO: ${data.sistema_operativo} | BD: ${data.base_datos} (${data.latencia_bd_ms}ms) | Hora local: ${data.hora_servidor}` 
        });
      } 
      else if (herramienta === 'exportar') {
        toast({ title: "Procesando", description: "Empaquetando base de datos..." });
        const res = await authFetch(`${API_URL}/usuarios/sistema/exportar`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        // Crear y descargar archivo JSON
        const blob = new Blob([JSON.stringify(data.backup_data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_sgc_${data.timestamp}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Éxito", description: "Base de datos exportada y descargada." });
      } 
      else if (herramienta === 'reporte') {
        const res = await authFetch(`${API_URL}/usuarios/sistema/reporte`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        // Crear un resumen en texto plano descargable
        const contenido = `REPORTE DE SISTEMA SGC\nFecha: ${data.reporte.fecha_generacion}\n--------------------------\nTotal Usuarios: ${data.reporte.total_usuarios_registrados}\nUsuarios Activos: ${data.reporte.usuarios_activos}\nConexiones Históricas: ${data.reporte.total_conexiones_historicas}\n`;
        const blob = new Blob([contenido], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_sgc_${data.reporte.fecha_generacion.replace(/[: ]/g, '_')}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Reporte generado", description: "El reporte se ha descargado a tu equipo." });
      }
    } catch (err: any) {
      toast({ title: "Error del sistema", description: err.message || "Fallo en la herramienta", variant: "destructive" });
    }
  };

  if (!configuracion) return null;

  return (
    <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
      <div className="container mx-auto max-w-4xl relative z-10 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
                <Button aria-label="Volver" className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide">Configuración</h1>
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Personaliza tu experiencia en el sistema</p>
                </div>
            </div>
        </div>

        <Tabs defaultValue="visualizacion" className="w-full">
          <TabsList className="mb-6 flex w-full bg-[#0a0f1a]/60 border border-slate-800/50 p-1.5 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="visualizacion" className="flex-1 min-w-30 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-semibold tracking-wide">Visualización</TabsTrigger>
            <TabsTrigger value="seguridad" className="flex-1 min-w-30 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-semibold tracking-wide">Seguridad</TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex-1 min-w-30 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-semibold tracking-wide">Notificaciones</TabsTrigger>
            {configuracion.esAdmin && <TabsTrigger value="sistema" className="flex-1 min-w-30 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-semibold tracking-wide">Sistema</TabsTrigger>}
          </TabsList>

          {/* TAB: VISUALIZACIÓN Y ACCESIBILIDAD */}
          <TabsContent value="visualizacion" className="space-y-4">
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-blue-400" /> Accesibilidad y tablas
                </CardTitle>
                <CardDescription className="text-slate-400 text-[15px]">Ajusta cómo se muestran los datos en pantalla</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">

                {/* Accesibilidad y Tablas */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <label className=" text-slate-300 text-[14px] font-medium mb-4 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-blue-300"/> Densidad de las tablas</label>
                        <Select value={cambios.densidadTablas || configuracion.densidadTablas} onValueChange={(v) => handleConfigChange('densidadTablas', v)}>
                            <SelectTrigger className="sgc-input h-10! w-full bg-[#0a0f1a] border-slate-800 focus:border-blue-500"><SelectValue/></SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                <SelectItem value="comodo" className="focus:bg-blue-600">Cómodo (Con más espacio)</SelectItem>
                                <SelectItem value="normal" className="focus:bg-blue-600">Normal</SelectItem>
                                <SelectItem value="compacto" className="focus:bg-blue-600">Compacto (Ver más registros)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-slate-300 text-[14px] font-medium mb-4 flex items-center gap-2"><Type className="w-4 h-4 text-grey-400"/> Tamaño de Fuente</label>
                        <Select value={cambios.tamanoFuente || configuracion.tamanoFuente} onValueChange={(v) => handleConfigChange('tamanoFuente', v)}>
                            <SelectTrigger className="sgc-input h-10! w-full bg-[#0a0f1a] border-slate-800 focus:border-blue-500"><SelectValue/></SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                                <SelectItem value="pequeno" className="focus:bg-blue-600 text-sm">Pequeño</SelectItem>
                                <SelectItem value="mediano" className="focus:bg-blue-600 text-base">Mediano (Recomendado)</SelectItem>
                                <SelectItem value="grande" className="focus:bg-blue-600 text-lg">Grande</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  <div className="pt-0">
                      <label className="text-slate-300 text-[14px] font-medium mb-4 flex items-center gap-2">
                          <MonitorPlay className="w-4 h-4 text-orange-400"/> Pantalla de inicio predeterminada
                      </label>
                        <Select value={cambios.pantallaInicio || configuracion.pantallaInicio} onValueChange={(v) => handleConfigChange('pantallaInicio', v)}>
                          <SelectTrigger className="sgc-input h-10! w-full bg-[#0a0f1a] border-slate-800 focus:border-blue-500">
                              <SelectValue/>
                          </SelectTrigger>
                          <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                              <SelectItem value="dashboard" className="focus:bg-blue-600">Panel Principal</SelectItem>
                              <SelectItem value="convictos" className="focus:bg-blue-600">Panel de Convictos</SelectItem>
                              <SelectItem value="seguridad" className="focus:bg-blue-600">Panel de Seguridad</SelectItem>
                              <SelectItem value="medico" className="focus:bg-blue-600">Panel Médico</SelectItem>
                              <SelectItem value="reportes" className="focus:bg-blue-600">Panel de Reportes</SelectItem>
                              {/* Para admins */}
                              {configuracion.esAdmin && (
                                  <SelectItem value="usuarios" className="focus:bg-blue-600 text-yellow-400 font-medium">
                                      Gestión de Usuarios (Admin)
                                  </SelectItem>
                              )}
                          </SelectContent>
                      </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: SEGURIDAD DE SESIÓN (CRÍTICO) */}
          <TabsContent value="seguridad" className="space-y-6">
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" /> Seguridad de la sesión
                </CardTitle>
                <CardDescription className="text-slate-400">Proteja el acceso en terminales compartidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                
                <div>
                    <label className=" text-slate-300 text-[15px] font-medium mb-2 flex items-center gap-2"><Timer className="w-4 h-4 text-purple-400 "/> Cierre automático por inactividad</label>
                    <p className="text-[14px] text-slate-500 mb-4">La sesión expirará si el sistema detecta que no hay movimiento del ratón o teclado en el tiempo especificado.</p>
                    <Select value={cambios.cierreInactividad || configuracion.cierreInactividad} onValueChange={(v) => handleConfigChange('cierreInactividad', v)}>
                        <SelectTrigger className="sgc-input h-11! w-70 bg-[#0a0f1a] border-slate-800 focus:border-blue-500"><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                            <SelectItem value="5" className="focus:bg-blue-600">Cerrar en 5 minutos</SelectItem>
                            <SelectItem value="15" className="focus:bg-blue-600">Cerrar en 15 minutos (Recomendado)</SelectItem>
                            <SelectItem value="30" className="focus:bg-blue-600">Cerrar en 30 minutos</SelectItem>
                            <SelectItem value="nunca" className="focus:bg-blue-600 text-red-400">Nunca (Peligroso)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-6 border-t border-slate-800/50">
                    <label className=" text-slate-300 text-[15px] font-medium mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-green-400"/> Historial de conexiones recientes</label>
                    <div className="rounded-xl border border-slate-800/80 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-[#0a0f1a]">
                                <TableRow className="border-slate-800/50 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Fecha y hora</TableHead>
                                    <TableHead className="text-slate-400">Dirección IP</TableHead>
                                    <TableHead className="text-slate-400">Dispositivo/Navegador</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historial.length === 0 ? (
                                    <TableRow className="border-slate-800/50 hover:bg-transparent">
                                        <TableCell colSpan={3} className="text-center text-slate-500 py-6">No hay registros de conexión.</TableCell>
                                    </TableRow>
                                ) : (
                                    historial.map((log, index) => (
                                        <TableRow key={index} className="border-slate-800/50 hover:bg-blue-500/5">
                                            <TableCell className="font-mono text-xs text-slate-300">{log.fecha}</TableCell>
                                            <TableCell className="font-mono text-xs text-blue-400">{log.ip}</TableCell>
                                            <TableCell className="text-xs text-slate-400">{log.dispositivo}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        {/* TAB: NOTIFICACIONES */}
        <TabsContent value="notificaciones" className="space-y-6">
          <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
            <CardHeader>
              <CardTitle className="sgc-text-primary text-lg flex items-center gap-2">
                <Bell className="w-5 h-5  text-yellow-400" />Preferencias de notificaciones
              </CardTitle>
              <CardDescription className="text-slate-400 text-[14px]">Controla cómo deseas recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border sgc-border rounded-lg">
                <div>
                  <p className="sgc-text-primary font-medium">Notificaciones por correo</p>
                  <p className="sgc-text-secondary text-sm text-slate-400" >Recibe actualizaciones importantes por email</p>
                </div>
                <Switch
                  checked={cambios.notificacionesEmail !== undefined ? cambios.notificacionesEmail : configuracion.notificacionesEmail}
                  onCheckedChange={(checked) => handleConfigChange('notificacionesEmail', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border sgc-border rounded-lg">
                <div>
                  <p className="sgc-text-primary font-medium">Notificaciones del sistema</p>
                  <p className="sgc-text-secondary text-sm  text-slate-400">Recibe notificaciones emergentes en el sistema</p>
                </div>
                <Switch
                  checked={cambios.notificacionesSistema !== undefined ? cambios.notificacionesSistema : configuracion.notificacionesSistema}
                  onCheckedChange={(checked) => handleConfigChange('notificacionesSistema', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
            <CardHeader>
              <CardTitle className="sgc-text-primary text-lg flex items-center gap-2">
                <Lock className="w-5 h-5  text-red-400" />Seguridad de la cuenta
              </CardTitle>
              <CardDescription className="text-slate-400 text-[14px]">Opciones de seguridad avanzada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border sgc-border rounded-lg opacity-60 cursor-not-allowed">
                <div>
                  <p className="sgc-text-primary font-medium">Autenticación de dos factores</p>
                  <p className="sgc-text-secondary text-sm  text-slate-400">Próximamente disponible</p>
                </div>
                <Switch disabled checked={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* TAB: SISTEMA (SOLO ADMIN) */}
        {configuracion.esAdmin && (
          <TabsContent value="sistema" className="space-y-6">
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader>
                <CardTitle className="sgc-text-primary text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Configuración del sistema
                </CardTitle>
                <CardDescription className="text-slate-400 text[14px]">Opciones de configuración del sistema (solo visible para administradores)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-black-50 dark:bg-yellow-950 border border-blue-400 dark:border-yellow-800 rounded-lg">
                  <p className="sgc-text-primary font-medium text-sm">Información del sistema</p>
                  <div className="mt-3 space-y-2 text-sm sgc-text-secondary">
                    <p><strong>Versión:</strong> {configuracion.versionSistema}</p>
                    <p><strong>Modo Mantenimiento:</strong> {configuracion.maintenanceMode ? 'Activo' : 'Inactivo'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="sgc-text-primary font-semibold text-sm">Herramientas de sistema</h4>
                  
                  <div className="flex flex-col gap-2">
                      <Button onClick={() => ejecutarHerramienta('estado')} className="sgc-btn-secondary w-full justify-start">
                          <Server className="w-4 h-4 mr-2" /> Verificar estado del servidor
                      </Button>
                      <Button onClick={() => ejecutarHerramienta('exportar')} className="sgc-btn-secondary w-full justify-start">
                          <Download className="w-4 h-4 mr-2" /> Exportar base de datos
                      </Button>
                      <Button onClick={() => ejecutarHerramienta('reporte')} className="sgc-btn-secondary w-full justify-start">
                          <Activity className="w-4 h-4 mr-2" /> Generar reporte de sistema
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

        </Tabs>

        {/* --- BOTONES FLOTANTES DE GUARDADO --- */}
        {hasChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#0a0f1a]/95 p-3 rounded-2xl border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 animate-in slide-in-from-bottom-5">
              <Button onClick={() => { setCambios({}); }} variant="outline" className="h-11 px-6 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <X className="w-4 h-4 mr-2" /> Descartar
              </Button>
              <Button onClick={handleSaveConfig} disabled={saving} className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/20">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Aplicando...' : 'Guardar cambios'}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}