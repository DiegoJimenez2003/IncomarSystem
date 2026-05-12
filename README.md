
# Sistema de Trazabilidad y Gestión Pesquera - Incomar

Sistema web desarrollado para la gestión, control y trazabilidad de productos del mar dentro de una planta pesquera.
El proyecto busca digitalizar procesos que actualmente se realizan de forma manual mediante Excel y documentos físicos, permitiendo mejorar el control operativo, almacenamiento e historial de productos.

---

# Tecnologías utilizadas

* React
* TypeScript
* Vite
* Tailwind CSS
* Supabase (backend y base de datos)
* Git & GitHub

---

# Funcionalidades principales

## Gestión de productos

* Registro de productos del mar
* Control de estados
* Clasificación PAC / NO PAC

---

## Gestión de lotes

* Creación y seguimiento de lotes
* Relación entre productos y guías
* Trazabilidad completa desde llegada hasta despacho

---

## Inventario y racks

* Control de almacenamiento
* Gestión de racks y cámaras
* Registro de movimientos de entrada y salida

---

## Control de calidad

* Estados de inspección
* Observaciones e incidencias
* Seguimiento de temperatura y validaciones

---

## Embarques y despachos

* Registro de envíos
* Despachos parciales
* Historial de transporte y destino

---

# Estructura del proyecto

```bash
src/
│
├── components/     # Componentes reutilizables
├── pages/          # Vistas principales
├── data/           # Mock data y estructuras temporales
├── assets/         # Recursos estáticos
├── styles/         # Estilos globales
├── app/            # Configuración principal
└── services/       # Futuras conexiones con Supabase
```

---

# Instalación del proyecto

## 1️ Clonar repositorio

```bash
git clone https://github.com/DiegoJimenez2003/IncomarSystem.git
```

---

## 2️ Entrar al proyecto

```bash
cd IncomarSystem
```

---

## 3️ Instalar dependencias

```bash
npm install
```

---

## 4️ Ejecutar entorno de desarrollo

```bash
npm run dev
```

---

## 5️ Abrir en navegador

```bash
http://localhost:5173
```

---

# 🔧 Requisitos

* Node.js 18+
* npm
* Visual Studio Code recomendado

---

# Estado actual del proyecto

Proyecto en desarrollo

Actualmente se trabaja en:

* Trazabilidad de productos
* Integración con Supabase
* CRUD completos
* Gestión de usuarios y roles
* Reportes operacionales

---

# Autor

Desarrollado por Diego Jiménez
Proyecto de práctica profesional enfocado en digitalización de procesos pesqueros y trazabilidad industrial.
