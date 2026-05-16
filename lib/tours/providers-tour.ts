export const providersTour = {
  tour: 'providers-tour',
  steps: [
    {
      icon: null,
      title: 'Módulo de Proveedores',
      content:
        'Bienvenido al módulo de gestión de proveedores. Aquí administras todos los contactos de suministro de la imprenta — tintas, papel y más. Te guiaremos por los elementos principales.',
      viewportID: 'dashboard-viewport',
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: 'Buscar proveedores',
      content:
        'Escribe en este campo para filtrar proveedores por nombre, correo electrónico o persona de contacto. El resultado se actualiza en tiempo real.',
      selector: '#providers-search',
      viewportID: 'dashboard-viewport',
      side: 'bottom' as const,
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: 'Filtrar por tipo',
      content:
        'Usa estos botones para ver solo proveedores de Tintas, de Papel, los que suministran Ambos, o el catálogo completo con "Todos".',
      selector: '#providers-type-filter',
      viewportID: 'dashboard-viewport',
      side: 'bottom' as const,
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: 'Resultados por página',
      content:
        'Controla cuántos proveedores se muestran por página. Puedes ingresar cualquier número entre 1 y 100.',
      selector: '#providers-page-size',
      viewportID: 'dashboard-viewport',
      side: 'bottom' as const,
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: 'Agregar proveedor',
      content:
        'Los usuarios con permisos de administrador o compras pueden registrar nuevos proveedores desde aquí, incluyendo datos de contacto, tipo, dirección y ubicación en mapa.',
      selector: '#providers-new-btn',
      viewportID: 'dashboard-viewport',
      side: 'bottom' as const,
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: 'Lista de proveedores',
      content:
        'Cada tarjeta muestra el nombre, tipo, persona de contacto, correo y teléfono del proveedor. Haz clic en una tarjeta para ver todos los detalles o editarla.',
      selector: '#providers-grid',
      viewportID: 'dashboard-viewport',
      side: 'top' as const,
      showControls: true,
      showSkip: true,
    },
    {
      icon: null,
      title: '¡Tour completado!',
      content:
        'Ya conoces los elementos principales del módulo de Proveedores. Puedes reiniciar este tour en cualquier momento desde el botón de ayuda en la esquina inferior izquierda.',
      viewportID: 'dashboard-viewport',
      showControls: true,
      showSkip: false,
    },
  ],
}
