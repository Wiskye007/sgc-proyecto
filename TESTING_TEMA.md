# Guía de Testing - Sistema de Tema Claro/Oscuro

## Checklist de Verificación

### ✅ Funcionamiento Básico

- [ ] **Tema por defecto**: La app carga en modo **oscuro**
- [ ] **Botón toggle**: Visible en esquina superior derecha
- [ ] **Cambio de tema**: Al hacer clic en toggle, colores cambian instantáneamente
- [ ] **Persistencia**: Al recargar página, tema persiste
- [ ] **DevTools localStorage**: `tema-sgc` contiene `"claro"` u `"oscuro"`

### ✅ Componentes Principales

#### Panel de Configuración (`/dashboard/configuracion`)
- [ ] Header renderiza con colores correctos
- [ ] Tabs responden al cambio de tema
- [ ] Cards adaptan fondo/texto/bordes
- [ ] Inputs y selects cambian colores

#### Panel de Usuarios (`/dashboard/usuarios`)
- [ ] Tabla renderiza correctamente en ambos temas
- [ ] Headers de tabla con color apropiado
- [ ] Botones responden al tema
- [ ] Filtros con colores variables

#### Dashboard Principal (`/dashboard`)
- [ ] 4 módulos visibles en ambos temas
- [ ] Colores de iconos adaptan al tema
- [ ] Glows y shadows se ven bien

#### Panel de Convictos (`/dashboard/convictos`)
- [ ] Header renderiza correctamente
- [ ] Tabs tienen colores consistentes
- [ ] Tabla de datos se ve legible en claro y oscuro

#### Otros Paneles
- [ ] Médico (`/dashboard/medico`)
- [ ] Seguridad (`/dashboard/seguridad`)
- [ ] Reportes (`/dashboard/reportes`)
- [ ] Perfil (`/dashboard/perfil`)

### ✅ Funcionalidad de Tema

#### Tema Oscuro
- [ ] Fondo: Muy oscuro (casi negro)
- [ ] Texto: Blanco/claro
- [ ] Cards: Gris oscuro
- [ ] Bordes: Gris oscuro/sutil
- [ ] Botones primarios: Azul vibrante
- [ ] Legibilidad: Óptima (contraste alto)

#### Tema Claro
- [ ] Fondo: Blanco puro
- [ ] Texto: Negro/oscuro
- [ ] Cards: Blanco/gris muy claro
- [ ] Bordes: Gris claro
- [ ] Botones primarios: Azul saturado
- [ ] Legibilidad: Óptima (contraste alto)

### ✅ Responsividad

- [ ] **Desktop** (1920x1080): Tema aplica correctamente
- [ ] **Tablet** (768x1024): Tema aplica correctamente
- [ ] **Mobile** (375x667): Tema aplica correctamente
- [ ] Toggle accesible en todos los tamaños

### ✅ Performance

- [ ] Cambio de tema: **< 100ms** (sin lag)
- [ ] Carga inicial: **< 2s** (con tema restaurado)
- [ ] No hay FOUC (Flash of Unstyled Content)

---

## Pasos de Testing Manual

### Test 1: Funcionalidad Básica
```
1. Abrir http://localhost:3000
2. Loguear con credenciales válidas
3. Ir a dashboard
4. Hacer clic en botón de tema (Sol/Luna)
5. Verificar cambio instantáneo de colores
6. Recargar página (F5)
7. Verificar que el tema persista
```

### Test 2: localStorage
```
1. Abrir DevTools (F12)
2. Application → Local Storage → http://localhost:3000
3. Buscar clave "tema-sgc"
4. Cambiar tema y verificar que se actualice a "claro" o "oscuro"
5. Limpiar localStorage
6. Recargar página
7. Verificar que detecta preferencia del sistema
```

### Test 3: Todos los Paneles
```
Para cada panel:
  1. Navegar al panel
  2. Cambiar tema
  3. Verificar que todos los elementos adapten colores
  4. Verificar legibilidad en ambos temas
  5. Notar cualquier color que se vea inconsistente
```

### Test 4: Componentes Específicos

#### Inputs/Selects
```
1. Ir a panel de usuarios
2. Hacer clic en buscador
3. Verificar que fondo de input adapte
4. Verificar que placeholder sea legible
5. Cambiar tema
6. Repetir verificación
```

#### Botones
```
1. Ir a cualquier panel
2. Notar color de botones primarios
3. Cambiar tema
4. Verificar que botones sigan siendo destacados
5. Hover sobre botones
6. Verificar efecto hover en ambos temas
```

#### Tablas
```
1. Ir a panel de usuarios o convictos
2. Verificar que headers de tabla sean legibles
3. Verificar que filas altern bien en ambos temas
4. Cambiar tema
5. Repetir verificación
```

### Test 5: Transiciones
```
1. Ir a dashboard
2. Abrir DevTools → Performance
3. Hacer clic en toggle de tema
4. Tomar screenshot del timeline
5. Verificar que no haya "janks" (frames drops)
6. Transición debe ser suave (< 100ms)
```

---

## Casos de Uso Especiales

### Preferencia del Sistema
```
1. En SO (Windows/Mac/Linux): Cambiar preferencia a "Modo Claro"
2. Limpiar localStorage del navegador
3. Recargar http://localhost:3000
4. Verificar que auto-detecte y cargue en modo claro
5. Cambiar SO a "Modo Oscuro"
6. Recargar
7. Verificar auto-detección nuevamente
```

### Múltiples Pestañas
```
1. Abrir app en dos pestañas del mismo navegador
2. En pestaña 1: Cambiar a tema claro
3. En pestaña 2: Debería cambiar también (si usa mismo localStorage)
4. Si no: Ambas pueden tener tema independiente
```

---

## Defectos Conocidos / Por Reportar

Si encuentras alguno de estos, reporta:

1. **FOUC**: Flash de color incorrecto al cargar
2. **Inconsistencia**: Un elemento no cambia de color al togglear tema
3. **Legibilidad**: Texto con contraste bajo en algún tema
4. **Performance**: Toggle de tema causa lag/janks
5. **localStorage**: Tema no persiste después de recargar
6. **Responsive**: Diseño se rompe al cambiar tema en cierto breakpoint

---

## Evidencia de Testing

Para documentar la verificación, captura screenshots de:

1. ✅ Panel en tema oscuro
2. ✅ Panel en tema claro (después del toggle)
3. ✅ localStorage con `tema-sgc` actualizado
4. ✅ DevTools performance (sin janks)

---

## Criterios de Aceptación

**La implementación es correcta cuando:**

- ✅ Toggle funciona en todos los paneles
- ✅ Tema persiste después de recargar
- ✅ Todos los colores son variables (sin hardcoding)
- ✅ Legibilidad óptima en ambos temas
- ✅ Compilación sin errores
- ✅ No hay FOUC
- ✅ Transición suave (< 100ms)

---

## Contacto/Escalación

Si algún test falla:

1. Verificar que `next-themes` está instalado: `npm list next-themes`
2. Verificar que `SessionManager` envuelve todo en `layout.tsx`
3. Limpiar `.next/` y reinstalar: `npm install && npm run dev`
4. Revisar console (F12) por errores
5. Reportar detalles exactos de fallo

---

**Testing completado**: [Fecha]  
**Testeador**: [Nombre]  
**Resultado**: ✅ APROBADO / ❌ RECHAZADO
