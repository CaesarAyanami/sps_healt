# Manual de Usuario - SPS Health

Bienvenido al sistema automatizado de gestión de historiales clínicos y PDFs de **SPS Health**.

## Ingreso al Sistema (Login)
Para ingresar al portal, debes entrar con las credenciales creadas para tu área.
- **Ruta:** `http://tudominio.com/login` (o localhost)
- **Credenciales:** Tu `Correo Electrónico` y `Contraseña`.

*(Si olvidas tu clave, acude al enlace "¿Olvidaste tu contraseña?" debajo del botón de iniciar sesión).*

---

## 1. El Tablero Inicial (Dashboard)
Al entrar se te presentará un Dashboard interactivo que varía según tu **Rol**. 
Si eres un **Viewer (Visualizador)**, solo verás tarjetas con estadísticas métricas para consultas rápidas. Si eres **Administrador** o **Digitador**, además de estadísticas globales, presenciarás una cartelera con el total de pacientes documentados en el mes y acciones rápidas.

---

## 2. Gestión de Pacientes (`/manage-patients`)

*(Área restringida a Administradores y Digitadores)*

Esta es la sección principal de alimentación de base de datos.
- Podrás ver una tabla indexada paginada de **todos** los pacientes en el sistema con su cuenta nativa de Archivos PDF subidos.

### 2.1 Crear un Nuevo Registro
1. Arriba a la derecha aparecerá un botón azul "Nuevo Paciente".
2. Completa los requisitos estrictos primordiales: **Caso**, **CI (Cédula/DNI)**, **Nombres**, y la **Fecha de Operación**.
3. ***Campos Opcionales:*** Si deseas registrar edad, sexo o teléfonos en ese mismo momento, presiona `Mostrar Más Campos Opcionales` (la flecha azul desplegable).
4. Adicionalmente, tendrás un **Recuadro de Arrastre de Archivos (Drag & Drop)**. Arrastra allí uno o más reportes `.pdf` de tu computadora al área efervescente. Las carpetas internas se crearán automáticamente.
5. Click a **Guardar Datos y Subir**.

### 2.2 Editar un Registro o Añadir más PDFs
Si hiciste el paso 2.1 en un mes, y al mes siguiente tu paciente tiene 2 laboratorios más, te diriges a la tabla de Gestión y buscas a tu paciente.
1. Al final de la fila de tu paciente toca el botón estilo `Lápiz` (Editar).
2. Se desplegará el sistema de Formulario Extenso permitiéndote rellenar datos faltantes.
3. Lo mejor: en la base inferior hay un nuevo recuadro punteado. Adjunta ahí los **NUEVOS MÚLTIPLES PDF**. El motor sabrá inteligentemente seguir la cuenta numérica que ya tenías y sumarlos a su historial clínico.

---

## 3. Visor de Casos Clínicos (`/patients`)

*(Disponible para Administradores, Digitadores y Visores/Doctores).*

Diseñada especialmente para buscar consultas rápidas de doctores. Consiste en una cuadrícula con tarjetas visuales.

### Buscador Inteligente
Posee una barra superior capaz de entender tu semántica. Puedes introducir nombres, el número de cédula (CI) de tu paciente, O inclusó un **Año/Día**. Por ejemplo, si introduces "2024", la plataforma te listará todas las personas cuya `Fecha de Operación` coincidió en 2024.

### Pre-Visualizador Detallado
Toca con tu mouse/dedo la "flechita" al lado derecho de un paciente y abrirás permanentemente sus detalles médicos:
- Un panel inmersivo se postrará frente a la pantalla con el visor local incrustado directo allí de los PDFs del paciente.
- Si subiste más de 1 documento para el señor por ejemplo, tendrás botones inferiores `<<` y `>>` para rotar interactivamente las lecturas.

---

## 4. Gestión de Usuarios
*(Solo para Administradores)*

Aquí podrás invitar a tu propio personal.
Aparecen opciones para crear un `Administrador` nuevo (control total), `Digitador` (solo pueden leer historias médicas, crear nuevos casos e incluir pdfs) o `Viewers` (usualmente reservado para médicos observadores que NO pueden borrar ni subir archivos nuevos, ni ver la sección de usuarios).

Solo necesitas ingresar su nombre, un correo válido simulado o corporativo, establecer qué nivel de persmiso y listo. 

---

## 5. Prevención Inactiva de Sesión 
SPS Health se pre-configura con un control exigente de tokens por si una estación (computador) queda olvidada sin cerrar con clave activa en el hospital.
- **Límite de tiempo inactivo:** 10 Minutos.
- **Modal Inteligente:** A los 9 Minutos de uso, un pequeño pop-up preguntará: "¿Deseas extender el uso?". Si el médico toca el botón en verde reanuda transparentemente sus tareas; de no responder a tiempo por ausencia en el sitio, SPS Health deslogueará al individuo resguardándole la privacidad mediante la revocación del componente `cookie`. Así se asegura la encriptación de datos médicos de los Casos.
