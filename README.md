# NexoCorp

ERP y POS en la nube para comercios locales (farmacias, restaurantes, ferreterías, peluquerías y más de 20 sectores). Construido con **Next.js 14 · TypeScript · Tailwind CSS · Zustand · Recharts · Radix UI · @react-pdf/renderer**, listo para conectarse a **Supabase (PostgreSQL)**.

> 📘 Para la guía completa (arquitectura, cómo conectar Supabase real, cómo extender cada módulo) revisa **Manual del Desarrollador** incluido junto a este proyecto. Para aprender a usar la aplicación día a día, revisa el **Manual del Usuario**.

## Requisitos

- Node.js 18.18 o superior
- npm 9+

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3001). La aplicación funciona de inmediato con **datos simulados** (ver `src/lib/mock-data.ts`) — no necesitas configurar nada más para explorarla.

- **Landing page:** `/`
- **Registro / onboarding:** `/registro`
- **Modo Mostrador (móvil):** `/app/mobile`
- **Dashboard (escritorio, solo dueño):** `/app/dashboard`
- **Catálogo público:** `/catalogo/[slug]`

Dentro de la app, en **Configuración**, puedes alternar entre la vista de **Dueño** y **Cajero** para ver cómo cambia la interfaz según el rol.

## Scripts

| Comando           | Qué hace                                   |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo                      |
| `npm run build`    | Build de producción                         |
| `npm start`        | Sirve el build de producción                |
| `npm run lint`     | ESLint                                      |

## Conectar Supabase real

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta `supabase/schema.sql` en el SQL Editor del proyecto (crea las tablas y las políticas de Row Level Security).
3. Copia `.env.example` a `.env.local` y completa tus credenciales.
4. Sigue la sección "Conectar Supabase" del Manual del Desarrollador para reemplazar el store simulado por consultas reales.

## Estructura del proyecto

```
src/
  app/                  Rutas (Next.js App Router)
    app/                Todo lo que va detrás del AppShell (dashboard, mobile, etc.) — URLs bajo /app/…
    catalogo/[slug]/    Catálogo público
    registro/           Onboarding
  components/
    ui/                 Primitivas de interfaz (botón, card, dialog, etc. — patrón shadcn/ui)
    landing/            Secciones de la landing page
    dashboard/          Widgets del dashboard de escritorio
    shared/             Componentes usados en varias partes (logo, gauge DIAN, recibo…)
  lib/                  Tipos, configuración, utilidades, datos simulados, PDF
  store/                Estado global (Zustand): sesión/rol y "base de datos" simulada
supabase/
  schema.sql            Esquema completo + políticas RLS
```

## Notas honestas sobre el alcance de esta demo

Este proyecto es un **prototipo funcional completo con datos simulados**, pensado para explorarse y demostrarse de inmediato, y con una arquitectura ya preparada para producción:

- ✅ Funciona 100% con datos de ejemplo — no depende de ningún servicio externo.
- ✅ Todas las pantallas descritas en la especificación están implementadas: venta rápida, escáner de compras (simulado), alertas de inventario, guardián de incompatibilidades, Radar Fiscal DIAN, fiados, dashboard financiero, catálogo público, roles owner/cashier y modo offline básico.
- ⚠️ El "escáner de factura con IA" es una simulación con datos fijos, tal como pedía la especificación original — conectar un modelo de visión real (OCR/IA) es un paso posterior.
- ⚠️ La autenticación es simulada (un interruptor de rol en Configuración). Para producción, reemplázala por Supabase Auth + la tabla `profiles` del esquema SQL.
- ⚠️ El envío por WhatsApp usa enlaces `wa.me` con texto prellenado (igual que pedía la especificación) — no adjunta el PDF automáticamente, porque eso requiere la API de WhatsApp Business de Meta.
- ⚠️ `npm audit` reporta alertas conocidas contra Next.js 14.x (fijado intencionalmente para estabilidad — ver Manual del Desarrollador, sección 2). Revísalas y considera actualizar antes de desplegar a producción con datos reales de clientes.

Todo esto se explica con más detalle, paso a paso, en el Manual del Desarrollador.
