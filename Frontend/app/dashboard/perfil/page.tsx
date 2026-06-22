import PerfilPanel from '@/components/perfil-panel';

export const metadata = {
  title: 'Mi Perfil - SGC',
  description: 'Administra tu perfil de usuario',
};

export default function PerfilPage() {
  return (
    <div className="sgc-bg p-5 min-h-screen">
      <PerfilPanel />
    </div>
  );
}
