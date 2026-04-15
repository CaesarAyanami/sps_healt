# Documentación de Arquitectura y Base de Datos - SPS Health

A continuación se presentan los diagramas lógicos que definen la estructura de datos y el comportamiento central (Gestión de Pacientes) del sistema clínico.

Los diagramas están desarrollados bajo el estándar gráfico [Mermaid](https://mermaid.js.org/).

## 1. Diagrama de Entidad Relación (ER)

El siguiente modelo visualiza las entidades principales en PostgreSQL y cómo se anidan o interactúan.

```mermaid
erDiagram
    User ||--o{ Patient : "crea/registra"
    User ||--o{ AuditLog : "genera"
    Patient ||--o{ Document : "posee (historial)"

    User {
        String id PK
        String email "unique"
        String nombre
        String rol "admin, digitizer, viewer"
        String passwordHash
        DateTime createdAt
        DateTime updatedAt
    }

    Patient {
        String id PK
        String caso "unique (N° Historial)"
        String primerNombre
        String primerApellido
        String segundoNombre
        String segundoApellido
        String dni "CI"
        String sexo
        Int edad
        DateTime fechaNacimiento
        String telefono1
        String telefonoAlternativo
        String direccion
        DateTime fechaOperacion "Obligatorio"
        String descripcion
        String creadoPorId FK "User -> ID"
        DateTime createdAt
        DateTime updatedAt
    }

    Document {
        String id PK
        String patientId FK "Patient -> ID (OnDelete Cascade)"
        String nombreOriginal "Ej: lab_resultados.pdf"
        String nombreSistema "Ej: 1_lab_resultados.pdf"
        String ruta "uploads/caso_nombre_dni/1_lab_resultados.pdf"
        Int orden "1, 2, 3..."
        DateTime createdAt
    }

    AuditLog {
        String id PK
        String userId FK "User -> ID"
        String accion "Tipo de Acción"
        String detalles "Datos manipulados"
        DateTime fecha
    }

    RecoveryToken {
        String id PK
        String email
        String token "Hash temporal de recuperación"
        DateTime expiresAt
        DateTime createdAt
    }
```

---

## 2. Diagrama de Secuencia

Este diagrama especifica el flujo técnico e interactivo que sucede bajo el capó cuando un Funcionario decide **Añadir un Nuevo Paciente con documentos y archivos físicos**.

```mermaid
sequenceDiagram
    autonumber
    actor Digitador as Digitador / Admin
    participant Cliente as Navegador (Frontend)
    participant Servidor as Next.js API (/api/patients)
    participant FS as Sistema de Archivos Local
    participant DB as Base de Datos (PostgreSQL)

    Digitador->>Cliente: Rellena formulario paciente + Sube 2 PDFs
    Digitador->>Cliente: Click en "Guardar Datos"
    
    Cliente->>Servidor: POST request + multipart/form-data
    
    Servidor->>DB: Revisa si el `caso` (N° Historial) existe (`findUnique`)
    alt El paciente/caso ya existe
        DB-->>Servidor: Retorna que Existe
        Servidor-->>Cliente: Responde 400 (Error: El número de caso ya existe)
        Cliente-->>Digitador: Muestra Alerta Toast de Error Visual
    else El paciente es nuevo
        DB-->>Servidor: Null
        
        Servidor->>FS: Intenta localizar carpeta public/uploads/[NombreCarpeta_Segura]
        alt No existe carpeta del paciente
            Servidor->>FS: Crea el directorio físico contenedor
        end
        
        Servidor->>DB: prisma.patient.create(datos basicos + estadísticas)
        DB-->>Servidor: Retorna pacienteId creado
        
        loop Para cada archivo adjuntado en formData
            Servidor->>FS: Guardar archivo modificado: orden_nombreOriginal.pdf
            Servidor->>DB: Prepara inserción { patientId, nombreOriginal, ruta, orden }
        end
        
        Servidor->>DB: prisma.document.createMany(Array de Documentos)
        Servidor->>DB: prisma.auditLog.create(Acción: crear_paciente)
        
        Servidor-->>Cliente: Retorna Success 201
        Cliente-->>Digitador: Resetea Formulario + Toast Exitoso "Paciente Registrado"
    end
```
