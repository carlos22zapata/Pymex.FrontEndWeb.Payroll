# Documentación Técnica — Pymex.Payroll

## 1. Arquitectura General

**Backend:** .NET 10 (C#) — Web API
**Base de datos:** PostgreSQL (multi-tenant database-per-tenant)
**ORM:** Entity Framework Core 10
**Mapeo:** AutoMapper 13
**Autenticación:** JWT Bearer (manejado por Pymex.Auth)

### Patrón de Capas

```
HTTP Request → [Middleware] → [Controller] → [Service] → [Repository] → [DbContext] → PostgreSQL
                                                    ↕
                                               AutoMapper
                                              (Entity ↔ DTO)
```

Todas las interfaces y clases residen **dentro del mismo proyecto** (sin dependencia a Pymex.Shared).

---

## 2. Multi-Tenant

### Esquema de funcionamiento

1. **Middleware** (`Middleware/TenantMiddleware.cs`) intercepta cada request HTTP y lee el header `ConexName`.
2. El nombre se almacena en `ITenantConnectionProvider` (scoped por request).
3. En la resolución de `PayrollDbContext` (en `Program.cs`), se usa ese nombre para:
   - Buscar la empresa en `MasterDbContext.Enterprises` (según `Database == conexName`)
   - Si tiene `CustomConnectionString`, se usa directamente
   - Si no, se busca `configuration.GetConnectionString(conexName)` en `appsettings.json`
   - Fallback: primera connection string con prefijo `ConexSQLE`

### Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `Services/ITenantConnectionProvider.cs` | Interface scoped |
| `Services/TenantConnectionProvider.cs` | Almacena conexión por request |
| `Middleware/TenantMiddleware.cs` | Extrae header `ConexName` |
| `Data/Contexts/PayrollDbContextFactory.cs` | Factory para migraciones/seed |
| `Data/Contexts/PayrollDbContextDesignTimeFactory.cs` | Design-time para `dotnet-ef` |

---

## 3. PayrollDbContext

**Archivo:** `Data/Contexts/PayrollDbContext.cs`

### DbSets registrados

| DbSet | Entidad |
|-------|---------|
| `Departments` | `Department` |
| `Positions` | `Position` |
| `Employees` | `Employee` |
| `Contracts` | `Contract` |
| `ContractConcepts` | `ContractConcept` |
| `PayrollConcepts` | `PayrollConcept` |
| `PayrollVariables` | `PayrollVariable` |
| `EmployeeVariables` | `EmployeeVariable` |

### Schema y Convenciones

- **Schema por defecto:** `enterprise`
- **Configuraciones:** Se cargan automáticamente via `ApplyConfigurationsFromAssembly(typeof(DepartmentConfiguration).Assembly)`
- **Migraciones:** Tabla de historial en `enterprise.__EFMigrationsHistory`

### Auditoría (SaveChanges)

`ApplyAuditInfo()` se ejecuta en cada `SaveChanges` / `SaveChangesAsync`:
- **Added:** Setea `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt` desde el usuario JWT (o "System")
- **Modified:** Preserva `CreatedBy`/`CreatedAt` (IsModified = false), actualiza `UpdatedBy`/`UpdatedAt`

---

## 4. Modelo de Datos (Entidades)

### AuditableEntity (base abstracta)
```csharp
public abstract class AuditableEntity
{
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### Department
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| Name | string(100) | Único |
| ParentDepartmentId | int? | Auto-referencia jerárquica |

### Position
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| Name | string(100) | Único |

### Employee
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| EmployeeCode | string(50) | Único |
| Name | string(200) | |
| LastName | string(200) | |
| Email | string(255) | Indexado |
| Phone | string(100)? | |
| Address | string(500)? | |
| City | string(100)? | |
| State | string(100)? | |
| ZipCode | string(20)? | |
| HireDate | datetime | |
| TerminationDate | datetime? | Null = Activo |
| BaseSalary | decimal(18,2) | |
| DepartmentId | int | FK → Department |
| PositionId | int | FK → Position |
| ContractId | int | FK → Contract |
| IsActive | bool (computed) | `=> !TerminationDate.HasValue` |

### Contract
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| Name | string(100) | Único (ej: "Contrato Administrativo") |
| Description | string(500)? | |
| IsActive | bool | |

### PayrollVariable (Catálogo de Insumos)
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| Code | string(20) | Único (ej: "V_SUELDO_M") |
| Name | string(100) | (ej: "Sueldo Mensual") |
| DataType | enum(VariableDataType) | Numeric=1, Alphanumeric=2, Date=3 |
| Behavior | enum(PersistenceBehavior) | Fixed=1, Volatile=2, Calculated=3 |
| IsActive | bool | |

### PayrollConcept (Catálogo de Reglas/Fórmulas)
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| Code | string(20) | Único (ej: "C_QUINCENA") |
| Name | string(100) | (ej: "Sueldo Base Quincenal") |
| ConceptType | enum(ConceptType) | Earning=1, Deduction=2, Withholding=3, Other=4 |
| IsTaxable | bool | Afecta base de cálculos legales |
| Formula | string(1000) | Expresión con variables entre `[ ]` |
| IsActive | bool | |

### ContractConcept (Puente Contrato → Concepto)
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| ContractId | int | FK → Contract |
| PayrollConceptId | int | FK → PayrollConcept |
| IsActive | bool | |

### EmployeeVariable (Valores de variables por empleado)
| Campo | Tipo | Detalle |
|-------|------|---------|
| Id | int | PK, Identity |
| EmployeeId | int | FK → Employee |
| PayrollVariableId | int | FK → PayrollVariable |
| Value | string(500) | Valor, se castea según DataType |
| | | UK: (EmployeeId, PayrollVariableId) |

---

## 5. Configurations (Fluent API)

Cada entidad tiene su propio archivo de configuración en `Data/Configurations/` implementando `IEntityTypeConfiguration<T>`.

| Archivo | Entidad |
|---------|---------|
| `DepartmentConfiguration.cs` | Department |
| `PositionConfiguration.cs` | Position |
| `EmployeeConfiguration.cs` | Employee |
| `ContractConfiguration.cs` | Contract |
| `PayrollVariableConfiguration.cs` | PayrollVariable |
| `PayrollConceptConfiguration.cs` | PayrollConcept |
| `ContractConceptConfiguration.cs` | ContractConcept |
| `EmployeeVariableConfiguration.cs` | EmployeeVariable |

Convenciones usadas en todas:
- `builder.ToTable("Nombre", schema: "enterprise")`
- `builder.HasKey(e => e.Id).HasName("PK_Nombre")`
- `builder.Property(e => e.Id).UseIdentityByDefaultColumn()`
- `HasIndex` con nombres descriptivos (`UIDX_`, `IDX_`)
- `HasOne/WithMany` con `OnDelete(DeleteBehavior.Restrict)`
- Enums convertidos a int con `HasConversion<int>()`

---

## 6. Enumeradores (Enums)

Ubicación: `Data/Enums/`

### ConceptType
```csharp
Earning = 1,      // Asignación (suma al neto)
Deduction = 2,    // Deducción (resta al neto)
Withholding = 3,  // Retención (resta al neto, origen legal)
Other = 4         // Aporte patronal (no afecta neto)
```

### PersistenceBehavior
```csharp
Fixed = 1,      // Valor persiste tras cierre de nómina
Volatile = 2,   // Se resetea a 0 tras cierre
Calculated = 3  // Calculado por el sistema, no editable
```

### VariableDataType
```csharp
Numeric = 1,
Alphanumeric = 2,
Date = 3
```

---

## 7. Motor de Cálculo de Nómina

**Archivo:** `Repositories/PayrollCalculationRepository.cs`
**Servicio:** `Services/PayrollCalculationService.cs`

### Flujo de cálculo por empleado

1. Obtener el `ContractId` del empleado
2. Recuperar los `PayrollConcept` activos asociados via `ContractConcept`
3. Para cada concepto:
   - Extraer variables de la fórmula con regex `\[(.*?)\]`
   - Reemplazar cada variable por su valor desde `EmployeeVariable`
   - Evaluar la expresión matemática con `DataTable.Compute()`
4. Clasificar cada resultado según su `ConceptType`:
   - `Earning` → suma a `TotalEarnings`
   - `Deduction` / `Withholding` → suma a `TotalDeductions`
5. Calcular `NetPay = TotalEarnings - TotalDeductions`

### Cierre de Nómina

- Resetea a `"0"` todas las `EmployeeVariable` cuyo `PayrollVariable.Behavior == Volatile`
- Las variables `Fixed` permanecen intactas

---

## 8. Mappers (AutoMapper)

**Archivo:** `Mappers/MappersProfile.cs`

| Mapping | Detalle |
|---------|---------|
| `Department ↔ DepartmentDto` | Bidireccional |
| `Position ↔ PositionDto` | Bidireccional |
| `Employee ↔ EmployeeDto` | Resuelve `DepartmentName`, `PositionName`, `ContractName` |
| `Contract ↔ ContractDto` | Bidireccional |
| `PayrollVariable ↔ PayrollVariableDto` | Resuelve `DataTypeName`, `BehaviorName` |
| `PayrollConcept ↔ PayrollConceptDto` | Resuelve `ConceptTypeName` |
| `ContractConcept ↔ ContractConceptDto` | Resuelve `ContractName`, `PayrollConceptName` |
| `EmployeeVariable ↔ EmployeeVariableDto` | Resuelve `EmployeeName`, `VariableCode`, `VariableName`, `DataType`, `Behavior` |

---

## 9. Result Pattern

**Archivo:** `Data/Results/Result.cs`

```csharp
public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Value { get; set; }
    public string? ErrorMessage { get; set; }
    public static Result<T> Success(T value) => ...;
    public static Result<T> Failure(string message) => ...;
}
```

Todas las operaciones de repositorios y servicios retornan `Result<T>` para manejo consistente de errores.

---

## 10. DTOs

| DTO | Archivo |
|-----|---------|
| `DepartmentDto` | `Data/Dtos/DepartmentDto.cs` |
| `PositionDto` | `Data/Dtos/PositionDto.cs` |
| `EmployeeDto` | `Data/Dtos/EmployeeDto.cs` |
| `ContractDto` | `Data/Dtos/ContractDto.cs` |
| `ContractConceptDto` | `Data/Dtos/ContractConceptDto.cs` |
| `PayrollConceptDto` | `Data/Dtos/PayrollConceptDto.cs` |
| `PayrollVariableDto` | `Data/Dtos/PayrollVariableDto.cs` |
| `EmployeeVariableDto` | `Data/Dtos/EmployeeVariableDto.cs` |
| `PayrollResultDto` / `ConceptResultDto` | `Data/Dtos/PayrollResultDto.cs` |

---

## 11. Estructura de Archivos

```
Pymex.Payroll/
├── Program.cs                          # Entry point + DI registrations
├── appsettings.json                    # Configuración base
├── appsettings.Development.json        # Configuración desarrollo
├── Controllers/
│   ├── DepartmentsController.cs
│   ├── PositionsController.cs
│   ├── EmployeesController.cs
│   ├── ContractsController.cs
│   ├── ContractConceptsController.cs
│   ├── PayrollConceptsController.cs
│   ├── PayrollVariablesController.cs
│   ├── EmployeeVariablesController.cs
│   └── PayrollCalculationController.cs
├── Data/
│   ├── Contexts/
│   │   ├── PayrollDbContext.cs
│   │   ├── PayrollDbContextFactory.cs
│   │   └── PayrollDbContextDesignTimeFactory.cs
│   ├── Configurations/
│   │   ├── DepartmentConfiguration.cs
│   │   ├── PositionConfiguration.cs
│   │   ├── EmployeeConfiguration.cs
│   │   ├── ContractConfiguration.cs
│   │   ├── PayrollVariableConfiguration.cs
│   │   ├── PayrollConceptConfiguration.cs
│   │   ├── ContractConceptConfiguration.cs
│   │   └── EmployeeVariableConfiguration.cs
│   ├── Dtos/
│   │   ├── DepartmentDto.cs
│   │   ├── PositionDto.cs
│   │   ├── EmployeeDto.cs
│   │   ├── ContractDto.cs
│   │   ├── ContractConceptDto.cs
│   │   ├── PayrollConceptDto.cs
│   │   ├── PayrollVariableDto.cs
│   │   ├── EmployeeVariableDto.cs
│   │   └── PayrollResultDto.cs
│   ├── Entities/
│   │   ├── AuditableEntity.cs
│   │   ├── Department.cs
│   │   ├── Position.cs
│   │   ├── Employee.cs
│   │   ├── Contract.cs
│   │   ├── ContractConcept.cs
│   │   ├── PayrollConcept.cs
│   │   ├── PayrollVariable.cs
│   │   └── EmployeeVariable.cs
│   ├── Enums/
│   │   ├── ConceptType.cs
│   │   ├── PersistenceBehavior.cs
│   │   ├── VariableDataType.cs
│   │   └── CalculationMethod.cs
│   └── Results/
│       └── Result.cs
├── Infrastructure/
│   └── DatabaseInitializer.cs
├── Mappers/
│   └── MappersProfile.cs
├── Middleware/
│   └── TenantMiddleware.cs
├── Repositories/
│   ├── Interfaces/
│   │   ├── IDepartmentRepository.cs
│   │   ├── IPositionRepository.cs
│   │   ├── IEmployeeRepository.cs
│   │   ├── IContractRepository.cs
│   │   ├── IContractConceptRepository.cs
│   │   ├── IPayrollConceptRepository.cs
│   │   ├── IPayrollVariableRepository.cs
│   │   ├── IEmployeeVariableRepository.cs
│   │   └── IPayrollCalculationRepository.cs
│   ├── DepartmentRepository.cs
│   ├── PositionRepository.cs
│   ├── EmployeeRepository.cs
│   ├── ContractRepository.cs
│   ├── ContractConceptRepository.cs
│   ├── PayrollConceptRepository.cs
│   ├── PayrollVariableRepository.cs
│   ├── EmployeeVariableRepository.cs
│   └── PayrollCalculationRepository.cs
└── Services/
    ├── Interfaces/
    │   ├── IDepartmentService.cs
    │   ├── IPositionService.cs
    │   ├── IEmployeeService.cs
    │   ├── IContractService.cs
    │   ├── IContractConceptService.cs
    │   ├── IPayrollConceptService.cs
    │   ├── IPayrollVariableService.cs
    │   ├── IEmployeeVariableService.cs
    │   └── IPayrollCalculationService.cs
    ├── ITenantConnectionProvider.cs
    ├── TenantConnectionProvider.cs
    ├── DepartmentService.cs
    ├── PositionService.cs
    ├── EmployeeService.cs
    ├── ContractService.cs
    ├── ContractConceptService.cs
    ├── PayrollConceptService.cs
    ├── PayrollVariableService.cs
    ├── EmployeeVariableService.cs
    └── PayrollCalculationService.cs
```

---

## 12. Dependencias (NuGet)

| Paquete | Versión |
|---------|---------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.5 |
| `Microsoft.EntityFrameworkCore` | 10.0.5 |
| `Microsoft.EntityFrameworkCore.Tools` | 10.0.7 |
| `Microsoft.EntityFrameworkCore.Design` | 10.0.5 |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.1 |
| `Npgsql` | 10.0.2 |
| `AutoMapper` | 13.0.1 |
| `Swashbuckle.AspNetCore` | 6.4.0 |

**Referencia a proyecto:** `Pymex.Auth` (para JWT y MasterDbContext)

---

## 13. Database Initializer

**Archivo:** `Infrastructure/DatabaseInitializer.cs`

Ejecutado al iniciar la aplicación:
1. Migra `MasterDbContext` (Pymex.Auth)
2. Itera todas las connection strings con prefijo `ConexSQLE` en appsettings
3. Para cada una, migra la base de datos tenant y ejecuta seed:
   - **Departments:** Recursos Humanos, Tecnología, Contabilidad
   - **Positions:** Gerente, Supervisor, Analista, Asistente
   - **PayrollVariables:** 21 variables predefinidas (V_SUELDO_M, V_DIAS_TRAB, V_HORAS_EXTRAS, etc.)
