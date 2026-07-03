# API de Nómina — Guía para Frontend (React)

## Base URL

```
http://localhost:7600/api/
```

## Autenticación

Todas las rutas requieren token JWT enviado como:

```
Authorization: Bearer <token>
```

El header `ConexName` debe enviarse en cada request para identificar la base de datos del tenant:

```
ConexName: NombreDeLaEmpresa
```

## Respuesta Estándar

Todas las respuestas siguen el formato `Result<T>`:

```json
{
  "isSuccess": true,
  "value": { ... },
  "errorMessage": null
}
```

En caso de error:
```json
{
  "isSuccess": false,
  "value": null,
  "errorMessage": "Descripción del error"
}
```

---

## 1. Departamentos

### `GET /api/Departments/GetById?id={id}`
Obtiene un departamento por ID.

**Response:**
```json
{
  "isSuccess": true,
  "value": { "id": 1, "name": "Recursos Humanos", "parentDepartmentId": null }
}
```

### `GET /api/Departments/GetList?name={name}`
Lista departamentos. Opcionalmente filtra por nombre.

### `POST /api/Departments/Insert`
Crea un departamento.
```json
{ "name": "Nómina", "parentDepartmentId": null }
```

### `PUT /api/Departments/Update`
Actualiza un departamento.
```json
{ "id": 1, "name": "Recursos Humanos", "parentDepartmentId": null }
```

### `DELETE /api/Departments/Delete?id={id}`
Elimina un departamento.

---

## 2. Cargos

### `GET /api/Positions/GetById?id={id}`
### `GET /api/Positions/GetList?name={name}`
### `POST /api/Positions/Insert`
```json
{ "name": "Gerente" }
```
### `PUT /api/Positions/Update`
```json
{ "id": 1, "name": "Gerente General" }
```
### `DELETE /api/Positions/Delete?id={id}`

---

## 3. Empleados

### `GET /api/Employees/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": {
    "id": 1,
    "employeeCode": "EMP001",
    "name": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phone": "04121234567",
    "address": "Calle 1",
    "city": "Caracas",
    "state": "Distrito Capital",
    "zipCode": "1010",
    "hireDate": "2024-01-15T00:00:00",
    "terminationDate": null,
    "baseSalary": 3000.00,
    "departmentId": 1,
    "departmentName": "Recursos Humanos",
    "positionId": 1,
    "positionName": "Gerente",
    "contractId": 1,
    "contractName": "Contrato Administrativo",
    "isActive": true
  }
}
```

### `GET /api/Employees/GetList?page=1&pageSize=20&name={name}`
Lista paginada. Filtra por código, nombre o apellido.

### `GET /api/Employees/GetByDepartmentId?departmentId={id}`
Lista empleados de un departamento.

### `GET /api/Employees/GetByCode?code={code}`
Obtiene por código de empleado.

### `POST /api/Employees/Insert`
```json
{
  "employeeCode": "EMP002",
  "name": "María",
  "lastName": "González",
  "email": "maria@email.com",
  "phone": "04141234567",
  "hireDate": "2024-03-01T00:00:00",
  "baseSalary": 2500.00,
  "departmentId": 2,
  "positionId": 3,
  "contractId": 1
}
```

### `PUT /api/Employees/Update`
### `DELETE /api/Employees/Delete?id={id}`

---

## 4. Contratos (Plantillas)

### `GET /api/Contracts/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": { "id": 1, "name": "Contrato Administrativo", "description": "...", "isActive": true }
}
```

### `GET /api/Contracts/GetList?name={name}`
### `POST /api/Contracts/Insert`
```json
{ "name": "Contrato Obrero", "description": "Para personal sindicalizado" }
```
### `PUT /api/Contracts/Update`
### `DELETE /api/Contracts/Delete?id={id}`

---

## 5. Variables de Nómina (Insumos)

### `GET /api/PayrollVariables/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": {
    "id": 1,
    "code": "V_SUELDO_M",
    "name": "Sueldo Mensual",
    "dataType": 1,
    "dataTypeName": "Numeric",
    "behavior": 1,
    "behaviorName": "Fixed",
    "isActive": true
  }
}
```

### `GET /api/PayrollVariables/GetList?name={name}`
Lista completa de variables disponibles para la paleta del constructor de conceptos.

### `POST /api/PayrollVariables/Insert`
```json
{
  "code": "V_BONO_NOCT",
  "name": "Bono Nocturno",
  "dataType": 1,
  "behavior": 2
}
```

| behavior | Significado |
|----------|-------------|
| 1 (Fixed) | Valor fijo, persiste tras cierre de nómina |
| 2 (Volatile) | Valor temporal, se resetea a 0 al cerrar nómina |
| 3 (Calculated) | Calculado por el sistema, NO editable en UI |

### `PUT /api/PayrollVariables/Update`
### `DELETE /api/PayrollVariables/Delete?id={id}`

---

## 6. Conceptos de Nómina (Reglas/Fórmulas)

### `GET /api/PayrollConcepts/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": {
    "id": 1,
    "code": "C_QUINCENA",
    "name": "Sueldo Base Quincenal",
    "conceptType": 1,
    "conceptTypeName": "Earning",
    "isTaxable": true,
    "formula": "([V_SUELDO_M] / 30) * [V_DIAS_TRAB]",
    "isActive": true
  }
}
```

### `GET /api/PayrollConcepts/GetList?name={name}`

### `POST /api/PayrollConcepts/Insert`
```json
{
  "code": "C_SSO",
  "name": "Retención Seguro Social",
  "conceptType": 3,
  "isTaxable": false,
  "formula": "([V_SUELDO_NORMAL] * 12 / 52) * 0.04 * [V_LUNES_MES]"
}
```

| conceptType | Significado | Impacto en neto |
|-------------|-------------|-----------------|
| 1 (Earning) | Asignación | Suma |
| 2 (Deduction) | Deducción interna | Resta |
| 3 (Withholding) | Retención legal | Resta |
| 4 (Other) | Aporte patronal | No afecta neto |

### `PUT /api/PayrollConcepts/Update`
### `DELETE /api/PayrollConcepts/Delete?id={id}`

### Constructor Visual de Fórmulas (UI Drag & Drop)

La UI debe representar visualmente la construcción de la fórmula. El backend espera el `code` de las variables entre corchetes:

```
Ejemplo visual: [V_SUELDO_M] ÷ 30 × [V_DIAS_TRAB]
Payload:        "([V_SUELDO_M] / 30) * [V_DIAS_TRAB]"
```

**Paleta de variables disponibles:** `GET /api/PayrollVariables/GetList`

---

## 7. Asociar Conceptos a Contratos

### `GET /api/ContractConcepts/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": {
    "id": 1,
    "contractId": 1,
    "contractName": "Contrato Administrativo",
    "payrollConceptId": 1,
    "payrollConceptName": "Sueldo Base Quincenal",
    "isActive": true
  }
}
```

### `GET /api/ContractConcepts/GetByContractId?contractId={id}`
Obtiene todos los conceptos asociados a un contrato.

### `POST /api/ContractConcepts/Insert`
```json
{
  "contractId": 1,
  "payrollConceptId": 2,
  "isActive": true
}
```

### `DELETE /api/ContractConcepts/Delete?id={id}`

---

## 8. Variables por Empleado (Valores de Insumo)

### `GET /api/EmployeeVariables/GetById?id={id}`
```json
{
  "isSuccess": true,
  "value": {
    "id": 1,
    "employeeId": 1,
    "employeeName": "Juan Pérez",
    "payrollVariableId": 5,
    "variableCode": "V_DIAS_TRAB",
    "variableName": "Días Trabajados",
    "dataType": 1,
    "behavior": 2,
    "value": "15"
  }
}
```

### `GET /api/EmployeeVariables/GetByEmployeeId?employeeId={id}`
Lista todas las variables de un empleado.

**UI recomendada:** Data Grid con filtros por:
- **Pestaña "Fijos"** → behavior = 1 (Fixed)
- **Pestaña "No Fijos"** → behavior = 2 (Volatile)
- **Pestaña "Calculados"** → behavior = 3 (read-only, no editable)

**Validación de input:** El tipo de campo debe cambiar según `dataType`:
- `dataType = 1 (Numeric)` → `type="number"`
- `dataType = 2 (Alphanumeric)` → `type="text"`
- `dataType = 3 (Date)` → `type="date"`

### `POST /api/EmployeeVariables/Upsert`
Crea o actualiza el valor de una variable para un empleado.
```json
{
  "employeeId": 1,
  "payrollVariableId": 5,
  "value": "22"
}
```

### `DELETE /api/EmployeeVariables/Delete?id={id}`

---

## 9. Cálculo de Nómina

### `GET /api/PayrollCalculation/CalculateEmployeePayroll?employeeId={id}`
Calcula la nómina de un empleado individual.

```json
{
  "isSuccess": true,
  "value": [
    {
      "employeeId": 1,
      "employeeName": "Juan Pérez",
      "concepts": [
        {
          "payrollConceptId": 1,
          "conceptCode": "C_QUINCENA",
          "conceptName": "Sueldo Base Quincenal",
          "conceptType": 1,
          "amount": 1500.00,
          "formula": "([V_SUELDO_M] / 30) * [V_DIAS_TRAB]"
        },
        {
          "payrollConceptId": 2,
          "conceptCode": "C_SSO",
          "conceptName": "Retención SSO",
          "conceptType": 3,
          "amount": 48.00,
          "formula": "([V_SUELDO_NORMAL] * 12 / 52) * 0.04 * [V_LUNES_MES]"
        }
      ],
      "totalEarnings": 1500.00,
      "totalDeductions": 48.00,
      "netPay": 1452.00
    }
  ]
}
```

### `GET /api/PayrollCalculation/CalculateAllPayroll`
Calcula nómina de todos los empleados activos.

### `POST /api/PayrollCalculation/ClosePayroll`
Cierra el periodo de nómina actual (resetea variables volátiles a 0).

```json
{
  "isSuccess": true,
  "value": true,
  "errorMessage": null
}
```

---

## 10. Resumen de Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/Departments/GetById` | Departamento por ID |
| GET | `/api/Departments/GetList` | Lista departamentos |
| POST | `/api/Departments/Insert` | Crear departamento |
| PUT | `/api/Departments/Update` | Actualizar departamento |
| DELETE | `/api/Departments/Delete` | Eliminar departamento |
| GET | `/api/Positions/GetById` | Cargo por ID |
| GET | `/api/Positions/GetList` | Lista cargos |
| POST | `/api/Positions/Insert` | Crear cargo |
| PUT | `/api/Positions/Update` | Actualizar cargo |
| DELETE | `/api/Positions/Delete` | Eliminar cargo |
| GET | `/api/Employees/GetById` | Empleado por ID |
| GET | `/api/Employees/GetList` | Lista paginada empleados |
| GET | `/api/Employees/GetByDepartmentId` | Empleados por depto |
| GET | `/api/Employees/GetByCode` | Empleado por código |
| POST | `/api/Employees/Insert` | Crear empleado |
| PUT | `/api/Employees/Update` | Actualizar empleado |
| DELETE | `/api/Employees/Delete` | Eliminar empleado |
| GET | `/api/Contracts/GetById` | Contrato por ID |
| GET | `/api/Contracts/GetList` | Lista contratos |
| POST | `/api/Contracts/Insert` | Crear contrato |
| PUT | `/api/Contracts/Update` | Actualizar contrato |
| DELETE | `/api/Contracts/Delete` | Eliminar contrato |
| GET | `/api/PayrollVariables/GetById` | Variable por ID |
| GET | `/api/PayrollVariables/GetList` | Lista variables (paleta) |
| POST | `/api/PayrollVariables/Insert` | Crear variable |
| PUT | `/api/PayrollVariables/Update` | Actualizar variable |
| DELETE | `/api/PayrollVariables/Delete` | Eliminar variable |
| GET | `/api/PayrollConcepts/GetById` | Concepto por ID |
| GET | `/api/PayrollConcepts/GetList` | Lista conceptos |
| POST | `/api/PayrollConcepts/Insert` | Crear concepto (con fórmula) |
| PUT | `/api/PayrollConcepts/Update` | Actualizar concepto |
| DELETE | `/api/PayrollConcepts/Delete` | Eliminar concepto |
| GET | `/api/ContractConcepts/GetById` | Asociación por ID |
| GET | `/api/ContractConcepts/GetByContractId` | Conceptos de un contrato |
| POST | `/api/ContractConcepts/Insert` | Asociar concepto a contrato |
| PUT | `/api/ContractConcepts/Update` | Actualizar asociación |
| DELETE | `/api/ContractConcepts/Delete` | Eliminar asociación |
| GET | `/api/EmployeeVariables/GetById` | Variable-empleado por ID |
| GET | `/api/EmployeeVariables/GetByEmployeeId` | Variables de un empleado |
| POST | `/api/EmployeeVariables/Upsert` | Crear/actualizar valor variable |
| DELETE | `/api/EmployeeVariables/Delete` | Eliminar variable-empleado |
| GET | `/api/PayrollCalculation/CalculateEmployeePayroll` | Calcular nómina 1 empleado |
| GET | `/api/PayrollCalculation/CalculateAllPayroll` | Calcular nómina todos |
| POST | `/api/PayrollCalculation/ClosePayroll` | Cerrar periodo nómina |

---

## 11. Seed Data (Datos Iniciales)

Al iniciar la app, se crean automáticamente:

**Departamentos:** Recursos Humanos, Tecnología, Contabilidad
**Cargos:** Gerente, Supervisor, Analista, Asistente
**Variables de Nómina (21 predefinidas):**

| Code | Nombre | DataType | Behavior |
|------|--------|----------|----------|
| V_SUELDO_M | Sueldo Mensual | Numeric | Fixed |
| V_SUELDO_NORMAL | Sueldo Normal | Numeric | Fixed |
| V_SUELDO_INTEGRAL | Sueldo Integral | Numeric | Calculated |
| V_DIAS_TRAB | Días Trabajados | Numeric | Volatile |
| V_HORAS_EXTRAS | Horas Extras Diurnas | Numeric | Volatile |
| V_HORAS_NOCT | Horas Nocturnas | Numeric | Volatile |
| V_HORAS_FEST | Horas Festivas | Numeric | Volatile |
| V_BONO_PROD | Bono de Producción | Numeric | Volatile |
| V_BONO_ASIST | Bono de Asistencia | Numeric | Volatile |
| V_BONO_RESP | Bono de Responsabilidad | Numeric | Fixed |
| V_AUSENCIAS | Ausencias / Inasistencias | Numeric | Volatile |
| V_DIAS_VAC | Días de Vacaciones | Numeric | Volatile |
| V_ANTIGUEDAD | Años de Antigüedad | Numeric | Calculated |
| V_ISLR | Porcentaje ISLR (%) | Numeric | Fixed |
| V_SEGURO_SOCIAL | Seguro Social | Numeric | Volatile |
| V_FONDO_AHORRO | Ahorro Habitacional (FAOV) | Numeric | Fixed |
| V_BANCO | Banco Depósito | Alphanumeric | Fixed |
| V_CUENTA_BANCARIA | Cuenta Bancaria | Alphanumeric | Fixed |
| V_TIPO_CONTRATO | Tipo de Contrato | Alphanumeric | Fixed |
| V_FECHA_INGRESO | Fecha de Ingreso | Date | Fixed |
| V_FECHA_EGRESO | Fecha de Egreso | Date | Volatile |
