import UsuariosPanel from '@/components/usuarios-panel';

export const metadata = {
  title: 'Gestión de Usuarios - SGC',
  description: 'Administra los usuarios del sistema',
};

export default function UsuariosPage() {
  return (
    <div className="sgc-bg p-5 min-h-screen">
      <UsuariosPanel />
    </div>
  );
}
