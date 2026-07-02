'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, Lock, User, Mail, Briefcase, ArrowLeft } from 'lucide-react';
import { authFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://sgc-backend-vbze.onrender.com/api"
    : "http://localhost:5000/api";

interface Perfil {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  dni: string;
  correo: string;
  cargo: string;
  nivelAcceso: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado: string;
}

export default function PerfilPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  // Estados para edición de perfil
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correo: '',
    cargo: '',
  });

  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    contrasenaConfirmacion: '',
  });

  const [showPasswordFields, setShowPasswordFields] = useState({
    actual: false,
    nueva: false,
    confirmacion: false,
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      // Evitamos el falso reload si ya hay un perfil cargado
      if (!perfil) setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await authFetch(`${API_URL}/usuarios/perfil`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      if (data.perfil) {
        setPerfil(data.perfil);
        setFormData({
          nombreCompleto: data.perfil.nombreCompleto || '',
          correo: data.perfil.correo || '',
          cargo: data.perfil.cargo || '',
        });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al cargar el perfil', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePerfil = async () => {
    try {
      if (!formData.nombreCompleto.trim()) {
        toast({ title: "Atención", description: 'El nombre completo es requerido', variant: "destructive" });
        return;
      }

      const response = await authFetch(`${API_URL}/usuarios/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar perfil');
      }

      toast({ title: "Guardado", description: 'Perfil actualizado correctamente' });
      setEditando(false);
      
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentUserStr) {
          const userObj = JSON.parse(currentUserStr);
          userObj.nombre_completo = formData.nombreCompleto;
          userObj.cargo = formData.cargo;
          localStorage.setItem("currentUser", JSON.stringify(userObj));
          window.dispatchEvent(new Event("storage")); 
      }

      setTimeout(() => fetchPerfil(), 500);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al actualizar perfil', variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.contrasenaActual || !passwordForm.contrasenaNueva || !passwordForm.contrasenaConfirmacion) {
        toast({ title: "Atención", description: 'Todos los campos de contraseña son requeridos', variant: "destructive" });
        return;
      }

      if (passwordForm.contrasenaNueva !== passwordForm.contrasenaConfirmacion) {
        toast({ title: "Atención", description: 'Las contraseñas no coinciden', variant: "destructive" });
        return;
      }

      if (passwordForm.contrasenaNueva.length < 6) {
        toast({ title: "Atención", description: 'La contraseña debe tener al menos 6 caracteres', variant: "destructive" });
        return;
      }

      const response = await authFetch(`${API_URL}/usuarios/cambiar-contrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar contraseña');
      }

      toast({ title: "Éxito", description: 'Contraseña cambiada correctamente' });
      setPasswordForm({ contrasenaActual: '', contrasenaNueva: '', contrasenaConfirmacion: '' });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Error al cambiar contraseña', variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="sgc-bg min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"/>
            <p className="text-slate-400 font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="sgc-bg min-h-screen p-8 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl max-w-md">
          <p className="text-red-400 text-center text-sm">No se pudo cargar el perfil del usuario. Intente iniciar sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sgc-bg min-h-screen w-full py-8 px-4 md:px-8 font-sans text-slate-200">
      <div className="container mx-auto max-w-4xl relative z-10 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0f1a]/80 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
                <Button 
                    aria-label="Volver" 
                    className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 transition-colors group" 
                    onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide">Mi Perfil</h1>
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Administración de cuenta y seguridad</p>
                </div>
            </div>
        </div>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="mb-6 flex w-full bg-[#0a0f1a]/60 border border-slate-800/50 p-1.5 rounded-xl h-auto">
            <TabsTrigger value="info" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Información Personal</TabsTrigger>
            <TabsTrigger value="seguridad" className="flex-1 py-2.5 text-center rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all font-semibold tracking-wide">Seguridad</TabsTrigger>
          </TabsList>

          {/* TAB: INFORMACIÓN PERSONAL */}
          <TabsContent value="info" className="space-y-6">
            {/* Información de Cuenta */}
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Datos registrados
                </CardTitle>
                <CardDescription className="text-slate-400">Información interna inmutable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-2">Usuario</label>
                    <div className="bg-[#0a0f1a] px-4 py-3 rounded-lg border border-slate-800 text-slate-300 font-mono text-sm">
                      {perfil.nombreUsuario}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-2">DNI</label>
                    <div className="bg-[#0a0f1a] px-4 py-3 rounded-lg border border-slate-800 text-slate-300 font-mono text-sm">
                      {perfil.dni || 'No registrado'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-2">Nivel de Acceso</label>
                    <div className="bg-blue-500/10 px-4 py-3 rounded-lg border border-blue-500/20 text-blue-400 font-bold text-sm uppercase tracking-wide">
                      {perfil.nivelAcceso}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-2">Estado</label>
                    <div className={`px-4 py-3 rounded-lg border text-sm font-bold uppercase tracking-wide ${
                      perfil.estado === 'activo' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {perfil.estado}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Editable */}
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" /> Información editable
                </CardTitle>
                <CardDescription className="text-slate-400">{editando ? 'Modifique los campos y guarde los cambios' : 'Datos que puedes actualizar'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Nombre completo *</label>
                  <Input
                    disabled={!editando}
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleInputChange}
                    className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2 text-slate-500" /> Correo electrónico
                  </label>
                  <Input
                    disabled={!editando}
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleInputChange}
                    className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Cargo institucional</label>
                  <Input
                    disabled={!editando}
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                    className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/50 mt-4">
                  {!editando ? (
                    <Button onClick={() => setEditando(true)} className="sgc-btn-primary flex-1 h-11">
                      <Save className="w-4 h-4 mr-2" /> Editar información
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => {
                          setEditando(false);
                          setFormData({ nombreCompleto: perfil.nombreCompleto, correo: perfil.correo, cargo: perfil.cargo });
                        }} 
                        variant="outline" className="sgc-btn-secondary flex-1 h-11 border-slate-700">
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdatePerfil} className="sgc-btn-primary flex-1 h-11">
                        <Save className="w-4 h-4 mr-2" /> Guardar cambios
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auditoría */}
            <div className="flex justify-between items-center text-xs text-slate-500 px-4 font-mono">
              <p>CREACIÓN DE LA CUENTA: {perfil.fechaCreacion ? perfil.fechaCreacion.split('T')[0] : 'N/A'}</p>
              <p>ÚLTIMA MODIFICACIÓN: {perfil.fechaActualizacion ? perfil.fechaActualizacion.split('T')[0] : 'N/A'}</p>
            </div>
          </TabsContent>

          {/* TAB: SEGURIDAD */}
          <TabsContent value="seguridad" className="space-y-6">
            <Card className="sgc-card border-0 bg-[#060a12]/60 shadow-xl border-slate-800/80">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" /> Cambio de contraseña
                </CardTitle>
                <CardDescription className="text-slate-400">Su contraseña debe tener mínimo 6 caracteres</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Contraseña actual *</label>
                  <div className="relative">
                    <Input
                      type={showPasswordFields.actual ? 'text' : 'password'}
                      name="contrasenaActual"
                      placeholder="•••••••••"
                      value={passwordForm.contrasenaActual}
                      onChange={handlePasswordChange}
                      className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 pr-10 focus:border-blue-500"
                    />
                    <button type="button" onClick={() => setShowPasswordFields(prev => ({ ...prev, actual: !prev.actual }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPasswordFields.actual ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Nueva contraseña *</label>
                    <div className="relative">
                        <Input
                        type={showPasswordFields.nueva ? 'text' : 'password'}
                        name="contrasenaNueva"
                        placeholder="•••••••••"
                        value={passwordForm.contrasenaNueva}
                        onChange={handlePasswordChange}
                        className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 pr-10 focus:border-blue-500"
                        />
                        <button type="button" onClick={() => setShowPasswordFields(prev => ({ ...prev, nueva: !prev.nueva }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPasswordFields.nueva ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                    </div>

                    <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Confirmar contraseña *</label>
                    <div className="relative">
                        <Input
                        type={showPasswordFields.confirmacion ? 'text' : 'password'}
                        name="contrasenaConfirmacion"
                        placeholder="•••••••••"
                        value={passwordForm.contrasenaConfirmacion}
                        onChange={handlePasswordChange}
                        className="sgc-input h-11 bg-[#0a0f1a] border-slate-800 pr-10 focus:border-blue-500"
                        />
                        <button type="button" onClick={() => setShowPasswordFields(prev => ({ ...prev, confirmacion: !prev.confirmacion }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPasswordFields.confirmacion ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50 mt-4">
                    <Button onClick={handleChangePassword} className="sgc-btn-primary w-full md:w-auto md:px-8 h-11 float-right">
                    <Lock className="w-4 h-4 mr-2" /> Actualizar contraseña
                    </Button>
                    <div className="clear-both"></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}