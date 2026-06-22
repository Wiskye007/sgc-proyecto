'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit3, Power, RotateCcw, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { authFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast"; // 1. IMPORTACIÓN DEL TOAST

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
}

interface PaginacionInfo {
  paginaActual: number;
  total: number;
  totalPaginas: number;
  porPagina: number;
}

export default function UsuariosPanel() {
  const router = useRouter();
  const { toast } = useToast(); // 2. INICIALIZACIÓN DEL TOAST
  const [usuario, setUsuario] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [sesionFilter, setSesionFilter] = useState(''); 
  const [page, setPage] = useState(1);
  const [paginacion, setPaginacion] = useState<PaginacionInfo | null>(null);

  // Modal
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '', correo: '', dni: '', cargo: '', nivelAcceso: '', estado: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return router.push('/');
    const userData = JSON.parse(storedUser);
    const rol = userData.nivelacceso || userData.Nivelacceso || userData.nivelAcceso || '';
    if (rol.toLowerCase() !== 'administrador' && rol.toLowerCase() !== 'admin') return router.push('/dashboard');
    setUsuario(userData);
  }, []);

  useEffect(() => {
    const enviarPing = async () => { try { await authFetch(`${API_URL}/usuarios/ping`, { method: 'POST' }); } catch (e) { } };
    enviarPing(); 
    const interval = setInterval(enviarPing, 2 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (usuario) fetchUsuarios();
  }, [page, searchTerm, nivelFilter, estadoFilter, sesionFilter, usuario]);

  const fetchUsuarios = async () => {
    try {
      // 3. EVITAMOS EL FALSO RELOAD: Solo cargamos si la tabla está vacía
      if (usuarios.length === 0) setLoading(true);

      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      if (nivelFilter && nivelFilter !== 'todos') params.append('nivel', nivelFilter);
      if (estadoFilter && estadoFilter !== 'todos') params.append('estado', estadoFilter);
      if (sesionFilter && sesionFilter !== 'todos') params.append('sesion', sesionFilter);

      const response = await authFetch(`${API_URL}/usuarios?${params.toString()}`);

      if (!response.ok) throw new Error('Error al cargar usuarios');

      const data = await response.json();
      setUsuarios(data.usuarios || []);
      setPaginacion(data.paginacion);
    } catch (err) {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

      // 4. USAMOS EL TOAST EN VEZ DEL ALERT
      toast({ title: "Acción exitosa", description: "Usuario actualizado correctamente" });
      setShowEditModal(false);
      setUsuarioSeleccionado(null);
      fetchUsuarios();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al actualizar', variant: "destructive" });
    }
  };

  const handleToggleEstado = async (usuarioId: number, estadoActual: string) => {
    try {
      const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
      const response = await authFetch(`${API_URL}/usuarios/${usuarioId}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Error al cambiar estado');

      toast({ title: "Estado modificado", description: `Usuario marcado como ${nuevoEstado.toUpperCase()}` });
      fetchUsuarios();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al cambiar estado', variant: "destructive" });
    }
  };

  const handleResetPassword = async (usuarioId: number) => {
    try {
      if (!confirm('¿Está seguro de reiniciar la contraseña a un valor por defecto?')) return;
      const response = await authFetch(`${API_URL}/usuarios/${usuarioId}/reset-password`, { method: 'POST' });
      if (!response.ok) throw new Error((await response.json()).error || 'Error al resetear contraseña');

      const data = await response.json();
      toast({ title: "Contraseña reseteada", description: `Nueva clave temporal: ${data.contrasenaTemp}` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al resetear', variant: "destructive" });
    }
  };

  if (!usuario) return <div className="min-h-screen sgc-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/></div>;
  
  return (
    <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
      <div className="container mx-auto max-w-7xl relative z-10 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
                <Button aria-label="Volver" className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-400" /> Gestión de Usuarios
                    </h1>
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Panel exclusivo de Administración</p>
                </div>
            </div>
            
            <Button onClick={fetchUsuarios} variant="outline" className="bg-[#0a0f1a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hidden md:flex">
                <RefreshCw className="w-4 h-4 mr-2" /> Actualizar monitoreo
            </Button>
        </div>

        {/* Filtros */}
        <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
          <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row gap-6 items-end w-full">
            
            <div className="w-full max-w-md">
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 mt-6">Búsqueda</label>
              <Input 
                placeholder="Nombre, correo o DNI " 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
                className="sgc-input bg-[#0a0f1a] border-slate-800 w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto lg:ml-auto"> 
              <div className="w-full sm:min-w-[180px]">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Acceso</label>
                <Select value={nivelFilter} onValueChange={(v) => { setNivelFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                    <SelectItem value="todos" className="focus:bg-blue-600">Todos</SelectItem>
                    <SelectItem value="Administrador" className="focus:bg-blue-600">Administrador</SelectItem>
                    <SelectItem value="Supervisor" className="focus:bg-blue-600">Supervisor</SelectItem>
                    <SelectItem value="Guardia de seguridad" className="focus:bg-blue-600">Guardia de seguridad</SelectItem>
                    <SelectItem value="Personal médico" className="focus:bg-blue-600">Personal médico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:min-w-[180px]">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Estado (cuenta)</label>
                <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                    <SelectItem value="todos" className="focus:bg-blue-600">Todos</SelectItem>
                    <SelectItem value="activo" className="focus:bg-blue-600 text-green-400">Activo</SelectItem>
                    <SelectItem value="inactivo" className="focus:bg-blue-600 text-red-400">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:min-w-[180px]">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Sesión Actual</label>
                <Select value={sesionFilter} onValueChange={(v) => { setSesionFilter(v); setPage(1); }}>
                  <SelectTrigger className="sgc-input bg-[#0a0f1a] border-slate-800"><SelectValue placeholder="Todos" /></SelectTrigger>
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
          <CardHeader className="border-b border-slate-800/60 pb-4">
            <CardTitle className="text-white text-lg">
              {paginacion ? `Registros en el sistema: ${paginacion.total}` : 'Usuarios'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No se encontraron usuarios</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0a0f1a]/80 border-b border-slate-800/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Usuario</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">DNI</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Correo</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Cargo</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Nivel</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Conexión</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {usuarios.map((usr) => {
                      const isCurrentUser = usuario?.id === usr.id;
                      
                      return (
                      <tr key={usr.id} className={`transition-colors ${isCurrentUser ? 'bg-blue-500/5' : 'hover:bg-blue-500/5'}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-bold">{usr.nombreCompleto}</span>
                            {/* --- INDICADOR DE "TÚ" --- */}
                            {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded-md bg-orange-600/20 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/30">
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
                          <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">{usr.nivelAcceso}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                usr.estado === 'activo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>{usr.estado}</span>
                              
                             {/* Indicador En Línea / Offline */}
                              {usr.enLinea ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> En línea
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-slate-600" /> Offline
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2 justify-center">
                            <Button size="icon" variant="outline" onClick={() => handleEditUsuario(usr)} className="h-8 w-8 bg-[#0a0f1a] border-slate-700 hover:bg-blue-600 hover:border-blue-500 text-slate-300 hover:text-white" title="Editar"><Edit3 className="w-4 h-4" /></Button>
                            
                            {/* --- BOTÓN DE DESACTIVAR (Bloqueado si eres tú mismo) --- */}
                            <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleToggleEstado(usr.id, usr.estado)} 
                                disabled={isCurrentUser}
                                className={`h-8 w-8 bg-[#0a0f1a] border-slate-700 ${isCurrentUser ? 'opacity-30 cursor-not-allowed' : usr.estado === 'activo' ? 'hover:bg-red-600 hover:border-red-500 text-slate-300 hover:text-white' : 'hover:bg-green-600 hover:border-green-500 text-slate-300 hover:text-white'}`} 
                                title={isCurrentUser ? "No puedes desactivar tu propia cuenta" : usr.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            >
                                <Power className="w-4 h-4" />
                            </Button>

                            <Button size="icon" variant="outline" onClick={() => handleResetPassword(usr.id)} className="h-8 w-8 bg-[#0a0f1a] border-slate-700 hover:bg-yellow-600 hover:border-yellow-500 text-slate-300 hover:text-white" title="Resetear contraseña"><RotateCcw className="w-4 h-4" /></Button>
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

        {/* Modal de Edición */}
        {showEditModal && usuarioSeleccionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="sgc-card border-slate-700 w-full max-w-md bg-[#0a0f1a] shadow-2xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-white text-xl">Editar Permisos</CardTitle>
                <CardDescription className="text-slate-400">Actualiza los datos y acceso del usuario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Nombre Completo</label>
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
                    <Select value={formData.cargo} onValueChange={(v) => setFormData(p => ({ ...p, cargo: v }))}>
                      <SelectTrigger className="sgc-input bg-[#060a12] border-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                        <SelectItem value="Administrador" className="focus:bg-blue-600">Administrador</SelectItem>
                        <SelectItem value="Supervisor" className="focus:bg-blue-600">Supervisor</SelectItem>
                        <SelectItem value="Guardia de seguridad" className="focus:bg-blue-600">Guardia de seguridad</SelectItem>
                        <SelectItem value="Personal médico" className="focus:bg-blue-600">Personal médico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Nivel</label>
                    <Select value={formData.nivelAcceso} onValueChange={(v) => setFormData(p => ({ ...p, nivelAcceso: v }))}>
                      <SelectTrigger className="sgc-input bg-[#060a12] border-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                        <SelectItem value="administrador" className="focus:bg-blue-600">Administrador</SelectItem>
                        <SelectItem value="guardia" className="focus:bg-blue-600">Guardia</SelectItem>
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
      </div>
    </div>
  );
}