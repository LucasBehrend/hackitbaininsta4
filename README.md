# CoMarket

**CoMarket** es una plataforma de compras comunitarias mayoristas para barrios privados. Permite que los vecinos de un mismo barrio unifiquen su demanda de productos de almacén, higiene y limpieza para acceder a precios de distribuidor mayorista con entrega directa en el lote.

Desarrollado para **HackItBA 2026** por el Equipo ininsta.

---

## Problema que resuelve

Los supermercados mayoristas (como Maxi Consumo) exigen volúmenes mínimos de compra por producto para acceder a un mejor precio. Un vecino solo no llega a esos mínimos, pero un barrio privado sí. CoMarket agrega la demanda del barrio de forma digital, sin que los vecinos tengan que coordinarse entre sí, gestiona la compra y entrega en un solo envío.

---

## Funcionalidades principales

### Para usuarios

- **Registro e inicio de sesión** con email/contraseña o Google (Firebase Auth).
- **Selección de barrio y lote** al registrarse; modificable desde el perfil.
- **Catálogo de productos mayoristas** con categorías: Alimentos, Bebidas, Higiene, Limpieza.
- **Packs predefinidos**: combinaciones de productos básicos que se agregan al carrito de una sola vez.
- **Carrito inteligente**: detecta automáticamente productos no esenciales con baja demanda en el barrio y consulta al usuario su preferencia (comprar a precio minorista o no incluir si no se alcanza el mínimo).
- **Historial de pedidos** con estado (Pendiente, Confirmado, Entregado, Cancelado) y detalle por producto.
- **Perfil editable**: cambio de barrio y lote desde `/perfil`.

### Para administradores

- **Panel de administración** en `/admin` (acceso solo con `admin: 1` en Firestore)
- Vista agrupada por barrio con productos combinados de todos los pedidos
- Detalle por usuario (nombre + lote + monto)
- Botón para marcar todos los pedidos de un barrio como **Entregado** en un click

---

## Lógica de negocio clave

### Productos esenciales vs no esenciales

Cada producto en el catálogo tiene un campo `Esencial` (0 o 1):

- **Esencial = 1**: se agrega al carrito normalmente sin restricciones.
- **Esencial = 0**: si la demanda acumulada del barrio para ese producto es **menor a 6 unidades**, el carrito muestra una advertencia y pide al usuario que elija:
  - **Comprarlo a precio minorista** si no se llega al mínimo mayorista
  - **No incluirlo** si no se llega al mínimo (el producto entra igual al pedido pero queda condicionado)

Esta preferencia (`preferenciaDemandaBaja`) se guarda en Firestore junto con el pedido y se muestra en el historial.

### Packs

Los packs están definidos en `src/data/packs.json`. Cada pack contiene una lista de nombres de productos que coinciden exactamente con los de `productos1.json`. Al agregar un pack al carrito, cada producto del pack se agrega individualmente (si ya estaba en el carrito, suma cantidad).

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2.4 | UI |
| TypeScript | 5.9.3 | Tipado estático |
| Vite | 8.0.1 | Bundler y dev server |
| Tailwind CSS | 4.2.2 | Estilos |
| Firebase Auth | 12.x | Autenticación |
| Firebase Firestore | 12.x | Base de datos |
| React Router DOM | 7.13.2 | Rutas SPA |
| Zustand | 5.0.12 | Estado global (auth + carrito) |
| Lucide React | 1.7.x | Íconos |
| Nunito (Google Fonts) | — | Tipografía |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── Navbar.tsx          # Barra de navegación con carrito, perfil y logout modal
│   ├── ProductCard.tsx     # Card individual de producto
│   └── PackCard.tsx        # Card de pack (agrega múltiples productos al carrito)
├── data/
│   ├── productos1.json     # Catálogo de productos (nombre, precio, precioMino, categoría, esencial)
│   └── packs.json          # Definición de packs (nombre, descripción, lista de productos)
├── lib/
│   └── firebase.ts         # Configuración de Firebase (auth, db, googleProvider)
├── pages/
│   ├── Landing.tsx         # Página principal con hero, cómo funciona y beneficios
│   ├── Auth.tsx            # Login y registro (email/Google + paso de barrio/lote)
│   ├── Products.tsx        # Catálogo con filtro por categoría y búsqueda
│   ├── Cart.tsx            # Carrito con lógica de decisión para productos no esenciales
│   ├── CheckoutResult.tsx  # Página post-checkout
│   ├── Orders.tsx          # Historial de pedidos del usuario
│   ├── Profile.tsx         # Edición de barrio y lote del usuario
│   └── AdminOrders.tsx     # Panel admin agrupado por barrio
├── store/
│   ├── useAuthStore.ts     # Estado global de autenticación (user, loading, setUser, logout)
│   └── useCartStore.ts     # Estado global del carrito (items, addItem, removeItem, etc.)
├── App.tsx                 # Router principal + listener de Firebase Auth + footer global
└── index.css               # Estilos globales + import de Tailwind
```

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Variables de entorno

Crear un archivo `.env` en la raíz con las credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
En nuestro caso podrá utilizar la pagina sin problemas ya que las apikeys las pusimos en el .env de vercel
---

## Deploy

El proyecto está configurado para Vercel. El archivo `vercel.json` incluye el rewrite necesario para que las rutas SPA funcionen correctamente al hacer F5:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Para Firebase Hosting, `firebase.json` tiene la misma configuración equivalente.

---

## Roles de usuario

| Rol | Campo en Firestore | Acceso |
|---|---|---|
| Usuario normal | `admin: 0` | `/productos`, `/cart`, `/orders`, `/perfil` |
| Administrador | `admin: 1` | `/admin` (redirige automáticamente al login) |

Para crear un administrador, setear manualmente `admin: 1` en el documento del usuario en Firestore.

---

## Equipo

**Equipo ininsta** — HackItBA 2026
