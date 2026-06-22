import ConfiguracionPanel from '@/components/configuracion-panel';

export const metadata = {
  title: 'Configuración - SGC',
  description: 'Configura tus preferencias del sistema',
};

export default function ConfiguracionPage() {
  return (
    <div className="sgc-bg p-5 min-h-screen">
      <ConfiguracionPanel />
    </div>
  );
}
