'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Power, RotateCcw, Users, ArrowLeft, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { authFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast"; 

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

interface Usuario {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  dni: string;
  correo: string;
  cargo: string;
  nivelAcceso: string;
  estado: string;
  enLinea: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimaActividad: string;
}

interface PaginacionInfo {
  paginaActual: number;
  total: number;
  totalPaginas: number;
  porPagina: number;
}

export default function UsuariosPanel() {
  const router = useRouter();
  const { toast } = useToast(); 
  const [usuario, setUsuario] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // NUEVO: Identificador para saber cuál es la petición más reciente y evitar cruces
  const currentFetchIdRef = useRef<number>(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [sesionFilter, setSesionFilter] = useState(''); 
  const [page, setPage] = useState(1);
  const [paginacion, setPaginacion] = useState<PaginacionInfo | null>(null);

  // Modales
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);  
  const [formData, setFormData] = useState({
    nombreCompleto: '', correo: '', dni: '', cargo: '', nivelAcceso: '', estado: '',
  });

  // Estado unificado para las acciones de confirmación
  const [confirmacionAction, setConfirmacionAction] = useState<{
    type: 'reset' | 'estado' | 'delete' | null;
    usuario: Usuario | null;
  }>({ type: null, usuario: null });
  
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return router.push('/');
    const userData = JSON.parse(storedUser);
    const rol = userData.nivelacceso || userData.Nivelacceso || userData.nivelAcceso || '';
    if (rol.toLowerCase() !== 'administrador' && rol.toLowerCase() !== 'admin') return router.push('/dashboard');
    setUsuario(userData);
  }, [router]);

  // EFECTO DE CARGA Y AUTO-ACTUALIZACIÓN
  useEffect(() => {
      if (usuario?.id) {
        fetchUsuarios(false, false);
        const autoRefresh = setInterval(() => {
          fetchUsuarios(false, true); 
        }, 15 * 1000);
        
        return () => clearInterval(autoRefresh);
      }
    }, [page, searchTerm, nivelFilter, estadoFilter, sesionFilter, usuario?.id]);

  const fetchUsuarios = async (isManualClick = false, isSilent = false) => {
      currentFetchIdRef.current += 1;
      const fetchId = currentFetchIdRef.current;

      try {
        if (!isSilent) setLoading(true);
        if (isManualClick) setIsRefreshing(true);

        const params = new URLSearchParams({ page: page.toString(), limit: '10' });
        if (searchTerm) params.append('search', searchTerm);
        if (nivelFilter && nivelFilter !== 'todos') params.append('nivel', nivelFilter);
        if (estadoFilter && estadoFilter !== 'todos') params.append('estado', estadoFilter);
        if (sesionFilter && sesionFilter !== 'todos') params.append('sesion', sesionFilter);
        params.append('_t', Date.now().toString());

        const response = await authFetch(`${API_URL}/usuarios?${params.toString()}`);
        if (!response.ok) throw new Error('Error al cargar');

        const data = await response.json();

        if (currentFetchIdRef.current === fetchId) {
          setUsuarios(data.usuarios || []);
          if (data.paginacion) {
            setPaginacion(data.paginacion);
          }
        }
      } catch (err) {
        if (currentFetchIdRef.current === fetchId && !isSilent) {
          toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
        }
      } finally {
        if (currentFetchIdRef.current === fetchId) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };
  
  const handleManualRefresh = () => {
    fetchUsuarios(true, true);
  };

  const handleEditUsuario = (usr: Usuario) => {
    setUsuarioSeleccionado(usr);
    setFormData({ 
      nombreCompleto: usr.nombreCompleto, 
      correo: usr.correo, 
      dni: usr.dni, 
      cargo: usr.cargo, 
      nivelAcceso: usr.nivelAcceso, 
      estado: usr.estado 
    });
    setShowEditModal(true);
  };

  const handleSaveUsuario = async () => {
    try {
      if (!usuarioSeleccionado) return; 
      const response = await authFetch(`${API_URL}/usuarios/${usuarioSeleccionado.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      }); 
      if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar usuario');

      toast({ title: "Acción exitosa", description: "Usuario actualizado correctamente" });
      setShowEditModal(false);
      setUsuarioSeleccionado(null);
      fetchUsuarios(false, true); 
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al actualizar', variant: "destructive" });
    }
  };

  const handleToggleEstado = (usr: Usuario) => setConfirmacionAction({ type: 'estado', usuario: usr });
  const handleResetPassword = (usr: Usuario) => setConfirmacionAction({ type: 'reset', usuario: usr });
  const handleDeleteUsuario = (usr: Usuario) => setConfirmacionAction({ type: 'delete', usuario: usr });

  const ejecutarAccionConfirmada = async () => {
    if (!confirmacionAction.usuario) return;
    const { type, usuario } = confirmacionAction;

    try {
      if (type === 'reset') {
        const response = await authFetch(`${API_URL}/usuarios/${usuario.id}/reset-password`, { method: 'POST' });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al resetear contraseña');
        const data = await response.json();
        toast({ title: "Contraseña reseteada", description: `Nueva clave temporal: ${data.contrasenaTemp}` });
      } 
      else if (type === 'estado') {
        const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
        const response = await authFetch(`${API_URL}/usuarios/${usuario.id}/estado`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado }),
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al cambiar estado');
        toast({ title: "Estado modificado", description: `Usuario marcado como ${nuevoEstado.toUpperCase()}` });
      } 
      else if (type === 'delete') {
        const response = await authFetch(`${API_URL}/usuarios/${usuario.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al eliminar usuario');
        toast({ title: "Usuario eliminado", description: data.mensaje });
      }

      setConfirmacionAction({ type: null, usuario: null });
      fetchUsuarios(false, true); 
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error en la acción', variant: "destructive" });
    }
  };

  if (!usuario) return (
    <div className="min-h-screen sgc-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
    </div>);
  
  return (
    <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
      <div className="container mx-auto max-w-7xl relative z-10 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
                <Button aria-label="Volver" className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                </Button>
                <div className="flex items-center gap-4">
                  <Users className="h-13 w-13 text-yellow-400 shrink-0" />
                    <div>
                        <h1 className="text-3xl font-black tracking-wide text-white">Gestión de Usuarios</h1>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Panel exclusivo de Administración</p>
                    </div>
                </div>
            </div>  
        </div>

        {/* Filtros */}
        <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
          <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row gap-6 items-end w-full">  
            <div className="w-full max-w-md">
              <label className="block text-slate-400 text-[14px] font-bold uppercase tracking-widest mb-2">Búsqueda</label>
              <Input placeholder="Nombre, correo o DNI " value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="sgc-input bg-[#0a0f1a] border-slate-800 w-full"/>
            </div>  
            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto lg:ml-auto"> 
              <div className="w-full sm:min-w-180px">
                <label className="block text-slate-400 text-[14px] font-bold uppercase tracking-widest mb-2 mt-6">Acceso</label>
                <Select value={nivelFilter} onValueChange={(v) => { setNivelFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800 w-40">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                    <SelectItem value="todos" className="focus:bg-blue-600">Todos</SelectItem>
                    <SelectItem value="Administrador" className="focus:bg-blue-600">Administrador</SelectItem>
                    <SelectItem value="Supervisor" className="focus:bg-blue-600">Supervisor</SelectItem>
                    <SelectItem value="Guardia de seguridad" className="focus:bg-blue-600">Guardia de seguridad</SelectItem>
                    <SelectItem value="Personal médico" className="focus:bg-blue-600">Personal médico</SelectItem>
                  </SelectContent>
                </Select>
              </div>  
              <div className="w-full sm:min-w-180px">
                <label className="block text-slate-400 text-[14px] font-bold uppercase tracking-widest mb-2 mt-6">Estado (cuenta)</label>
                <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800 w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                    <SelectItem value="todos" className="focus:bg-blue-600">Todos</SelectItem>
                    <SelectItem value="activo" className="focus:bg-blue-600 text-green-400">Activo</SelectItem>
                    <SelectItem value="inactivo" className="focus:bg-blue-600 text-red-400">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>  
              <div className="w-full sm:min-w-180px">
                <label className="block text-slate-400 text-[14px] font-bold uppercase tracking-widest mb-2 mt-6">Conexión</label>
                <Select value={sesionFilter} onValueChange={(v) => { setSesionFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800 w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                    <SelectItem value="todos" className="focus:bg-blue-600">Todos</SelectItem>
                    <SelectItem value="online" className="focus:bg-blue-600 text-emerald-400">En línea</SelectItem>
                    <SelectItem value="offline" className="focus:bg-blue-600 text-slate-400">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80 overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800/50 gap-4">
            <CardTitle className="text-xl text-white font-bold tracking-wide">Usuarios registrados</CardTitle>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <Button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline" 
                className="text-[16px] bg-[#0a0f1a] border-blue-700 text-slate-200 hover:text-white hover:bg-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                {isRefreshing ? 'Actualizando...' : 'Actualizar registros'}
              </Button>
              {paginacion && (
                <Badge 
                  variant="secondary" 
                  className={`text-[16px] px-3 py-1 ${
                    paginacion.total > 800 
                      ? "border-red-500 text-red-400 bg-red-500/10" 
                      : paginacion.total > 400 
                        ? "border-yellow-500 text-yellow-400 bg-yellow-500/10" 
                        : "border-green-500 text-green-400 bg-green-500/10"}`}>
                  Cantidad de usuarios: {paginacion.total}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No se encontraron usuarios</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#040408] border-b border-slate-800/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px] min-w-35!">Usuario</th>
                      <th className="text center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px] min-w-25">DNI</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px]">Correo</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px]">Cargo</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px]">Nivel</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[13.7px] min-w-30">Estado de cuenta</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px] min-w-40">Fecha creación</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px] min-w-40">Última actualización<noscript></noscript></th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px] min-w-40">Última conexión</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-[14px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                      {usuarios
                      .filter(usr => {
                          if (!sesionFilter || sesionFilter === 'todos') return true;
                          if (usuario?.id === usr.id) return true; 
                          return sesionFilter === 'online' ? usr.enLinea : !usr.enLinea;
                        })
                        .sort((a, b) => {
                          if (a.id === usuario?.id) return -1;
                          if (b.id === usuario?.id) return 1;
                          return 0;
                        })
                        .map((usr) => {
                          const isCurrentUser = usuario?.id === usr.id;
                      return (
                      <tr key={usr.id} className={`transition-colors ${isCurrentUser ? 'bg-blue-500/7' : 'hover:bg-blue-500/7'}`}>
                        <td className="py-4 px-6 h-16!">
                          <div className="flex items-center gap-2"> 
                            <span className="text-slate-200 font-bold">{usr.nombreCompleto}</span>
                              {isCurrentUser && (
                                <span className="px-1 py-0.5 rounded-md bg-orange-600/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">
                                    Tú
                                </span>
                            )}
                          </div>
                          <div className="text-slate-500 font-mono text-xs mt-1">Usuario: {usr.nombreUsuario}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono">{usr.dni || 'Sin DNI'}</td>
                        <td className="py-4 px-6 text-slate-400">{usr.correo}</td>
                        <td className="py-4 px-6 text-center text-slate-300">{usr.cargo}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-block whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">{usr.nivelAcceso}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                usr.estado === 'activo' ? 'bg-green-500/10 text-center text-[12px] text-green-500 border-green-500/20' : 'bg-red-500/10 text-center text-[12px] text-red-500 border-red-500/20'
                              }`}>{usr.estado}</span> 
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-slate-400 font-mono text-[14px]">{usr.fechaCreacion || 'Sin registros'}</td>
                        <td className="py-4 px-6 text-center text-slate-400 font-mono text-[14px]">{usr.fechaActualizacion || 'Sin registros'}</td>
                        <td className="py-4 px-6 text-center">
                            {usr.enLinea ? (
                                <div className="flex items-center justify-center gap-1.5 text-[15px] text-emerald-400 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> 
                                    En línea
                                </div>
                            ) : usr.ultimaActividad && usr.ultimaActividad !== 'Sin actividad' ? (
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-slate-300 font-mono text-[14px]">{usr.ultimaActividad}</span>
                                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Offline
                                    </div>
                                </div>
                            ) : (
                                <span className="italic text-slate-600 text-[14px]">Nunca ha ingresado</span>
                            )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2 justify-center">
                            <Button size="icon" variant="outline" onClick={() => handleEditUsuario(usr)} className="h-8 w-8 bg-blue-500/10! border-slate-700 hover:bg-blue-600! hover:border-blue-500! text-slate-200 hover:text-white!" title="Editar"><Edit3 className="w-4 h-4" /></Button>
                            
                            <Button size="icon" variant="outline" onClick={() => handleToggleEstado(usr)} disabled={isCurrentUser} className={`h-8 w-8 bg-[#0a0f1a] border-slate-700 ${isCurrentUser ? 'opacity-30 cursor-not-allowed' : usr.estado === 'activo' ? 'hover:bg-red-600! hover:border-red-500! text-slate-300 hover:text-white!' : 'hover:bg-green-600! hover:border-green-500! text-slate-300 hover:text-white!'}`} title={isCurrentUser ? "No puedes desactivar tu propia cuenta" : usr.estado === 'activo' ? 'Desactivar' : 'Activar'}><Power className="w-4 h-4" /></Button>
                            
                            <Button size="icon" variant="outline" onClick={() => handleResetPassword(usr)} className="h-8 w-8 bg-yellow-500/20! border-slate-700 hover:bg-yellow-500! hover:border-yellow-500! text-slate-400 hover:text-white" title="Resetear contraseña"><RotateCcw className="w-4 h-4" /></Button>

                            <Button size="icon" variant="outline" onClick={() => handleDeleteUsuario(usr)} disabled={isCurrentUser} className={`h-8 w-8 bg-red-500/10! border-slate-700 ${isCurrentUser ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-600! hover:border-red-500! text-slate-400 hover:text-white!'}`} title={isCurrentUser ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario permanentemente"}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* Paginación */}
          {paginacion && paginacion.totalPaginas > 1 && (
            <div className="border-t border-slate-800/60 p-4 bg-[#0a0f1a]/50 flex items-center justify-between">
              <div className="text-slate-500 text-sm font-mono">Mostrando página {page} de {paginacion.totalPaginas}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-[#0a0f1a] border-slate-700 text-slate-300 hover:bg-slate-800">Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(paginacion.totalPaginas, p + 1))} disabled={page === paginacion.totalPaginas} className="bg-[#0a0f1a] border-slate-700 text-slate-300 hover:bg-slate-800">Siguiente</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Modal de edición */}
        {showEditModal && usuarioSeleccionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="sgc-card border-slate-700 w-full max-w-md bg-[#0a0f1a] shadow-2xl">
              <CardHeader className="border-b border-slate-800 pb-4!">
                <CardTitle className="text-white text-xl">Editar permisos</CardTitle>
                <CardDescription className="text-slate-400">Actualiza los datos y acceso del usuario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Nombre completo</label>
                  <Input name="nombreCompleto" value={formData.nombreCompleto} onChange={(e) => setFormData(p => ({...p, nombreCompleto: e.target.value}))} className="sgc-input bg-[#060a12] border-slate-800" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Correo</label>
                    <Input name="correo" type="email" value={formData.correo} onChange={(e) => setFormData(p => ({...p, correo: e.target.value}))} className="sgc-input bg-[#060a12] border-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">DNI</label>
                    <Input name="dni" value={formData.dni || ''} onChange={(e) => setFormData(p => ({...p, dni: e.target.value}))} className="sgc-input bg-[#060a12] border-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Cargo</label>
                    <Input 
                      name="cargo" 
                      value={formData.cargo || ''} 
                      onChange={(e) => setFormData(p => ({...p, cargo: e.target.value}))} 
                      placeholder="Ej. Oficial de Seguridad"
                      className="sgc-input bg-[#060a12] border-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Nivel de Acceso</label>
                    <Select value={formData.nivelAcceso} onValueChange={(v) => setFormData(p => ({ ...p, nivelAcceso: v }))}> 
                      <SelectTrigger className="sgc-input bg-[#060a12] border-slate-800 w-full text-left">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                        <SelectItem value="Administrador" className="focus:bg-blue-600">Administrador</SelectItem>
                        <SelectItem value="Supervisor" className="focus:bg-blue-600">Supervisor</SelectItem>
                        <SelectItem value="Guardia de seguridad" className="focus:bg-blue-600">Guardia de seguridad</SelectItem>
                        <SelectItem value="Personal médico" className="focus:bg-blue-600">Personal médico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>  
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800/50 mt-2">
                  <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button>
                  <Button onClick={handleSaveUsuario} className="flex-1 sgc-btn-primary">Guardar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de confirmación (Eliminar, Resetear, Estado) */}
        {confirmacionAction.type && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-0">
            <Card className={`sgc-card w-full max-w-md shadow-2xl ${confirmacionAction.type === 'delete' ? 'border-red-900/50' : 'border-slate-700'}`}>
              <CardHeader className="border-b border-slate-800">
                <CardTitle className={`text-xl flex items-center gap-2 ${confirmacionAction.type === 'delete' ? 'text-red-400' : 'text-yellow-400'}`}>
                  <AlertTriangle className="w-6 h-6" /> Confirmar acción
                </CardTitle>
                <CardDescription className="text-slate-400 text-[15px]">
                  {confirmacionAction.type === 'delete' && "Esta acción no se puede deshacer"}
                  {confirmacionAction.type === 'reset' && "Se generará una nueva contraseña temporal"}
                  {confirmacionAction.type === 'estado' && "El acceso del usuario al sistema será modificado"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                <p className="text-slate-300 text-[16px]">
                  {confirmacionAction.type === 'delete' && <>¿Estás seguro de que deseas eliminar permanentemente al usuario <strong className="text-white">{confirmacionAction.usuario?.nombreCompleto}</strong>?</>}
                  {confirmacionAction.type === 'reset' && <>¿Estás seguro de que deseas reiniciar la contraseña de <strong className="text-white">{confirmacionAction.usuario?.nombreCompleto}</strong>?</>}
                  {confirmacionAction.type === 'estado' && <>¿Estás seguro de que deseas cambiar el estado de la cuenta de <strong className="text-white">{confirmacionAction.usuario?.nombreCompleto}</strong> a <strong className={confirmacionAction.usuario?.estado === 'activo' ? 'text-red-400' : 'text-green-400'}>{confirmacionAction.usuario?.estado === 'activo' ? 'INACTIVO' : 'ACTIVO'}</strong>?</>}
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-800/50 mt-2">
                  <Button onClick={() => setConfirmacionAction({ type: null, usuario: null })} variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">
                    Cancelar
                  </Button>
                  <Button onClick={ejecutarAccionConfirmada} className={`flex-1 border-0 text-white ${confirmacionAction.type === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'sgc-btn-primary'}`}>
                    {confirmacionAction.type === 'delete' ? 'Sí, eliminar' : 'Sí, confirmar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}