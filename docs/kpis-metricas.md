# KPIs y Métricas de Rendimiento

## Métricas Principales de k6

### 1. Tiempos de Respuesta (Response Times)

#### http_req_duration
- **Descripción**: Tiempo total de la petición HTTP
- **Unidad**: Milisegundos (ms)
- **Métricas clave**:
  - `avg`: Tiempo promedio
  - `p(90)`: 90% de requests no superan este tiempo
  - `p(95)`: 95% de requests no superan este tiempo
  - `p(99)`: 99% de requests no superan este tiempo
  - `max`: Tiempo máximo registrado

#### Componentes del tiempo de respuesta:
- `http_req_connecting`: Tiempo de establecimiento de conexión TCP
- `http_req_tls_handshaking`: Tiempo de handshake TLS/SSL
- `http_req_sending`: Tiempo enviando datos al servidor
- `http_req_waiting`: Tiempo esperando respuesta del servidor
- `http_req_receiving`: Tiempo recibiendo datos del servidor

### 2. Throughput (Rendimiento)

#### http_reqs
- **Descripción**: Número total de peticiones HTTP realizadas
- **Unidad**: Requests totales y requests por segundo (RPS)
- **Objetivo**: Medir capacidad de procesamiento

#### Cálculo de TPS (Transacciones por Segundo)
```javascript
// En el script k6
import { Counter } from 'k6/metrics';
let transactions = new Counter('transactions');

// En la función principal
if (response.status === 200) {
  transactions.add(1);
}
```

### 3. Tasa de Error (Error Rate)

#### http_req_failed
- **Descripción**: Porcentaje de peticiones fallidas
- **Unidad**: Porcentaje (0.0 a 1.0)
- **Tipos de errores**:
  - HTTP 4xx (errores del cliente)
  - HTTP 5xx (errores del servidor)
  - Timeouts
  - Errores de conexión

### 4. Usuarios Virtuales (Virtual Users)

#### vus
- **Descripción**: Número de usuarios virtuales activos
- **Unidad**: Número entero
- **Variantes**:
  - `vus`: Usuarios activos actuales
  - `vus_max`: Máximo número de usuarios configurado

### 5. Iteraciones

#### iterations
- **Descripción**: Número total de iteraciones completadas
- **Unidad**: Número entero
- **Cálculo**: iterations / duration = iteraciones por segundo

## Thresholds (Criterios de Éxito)

### Configuración de Thresholds
```javascript
export let options = {
  thresholds: {
    // 95% de requests deben ser < 500ms
    http_req_duration: ['p(95)<500'],
    
    // Menos del 5% de errores
    http_req_failed: ['rate<0.05'],
    
    // Mínimo 10 requests por segundo
    http_reqs: ['rate>10'],
    
    // 99% de requests < 1 segundo
    'http_req_duration{status:200}': ['p(99)<1000'],
  },
};
```

### Interpretación de Thresholds
- ✅ **Verde**: Threshold cumplido
- ❌ **Rojo**: Threshold fallido
- ⚠️ **Amarillo**: Cerca del límite

## Métricas Personalizadas

### Ejemplo de métricas custom
```javascript
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Tasa de errores de negocio
let businessErrors = new Rate('business_errors');

// Tiempo de procesamiento específico
let processingTime = new Trend('processing_time');

// Contador de transacciones exitosas
let successfulTransactions = new Counter('successful_transactions');

// Medidor de carga actual
let currentLoad = new Gauge('current_load');
```

## Objetivos por Tipo de Prueba

### Prueba de Carga Normal
- **Response Time**: p(95) < 500ms
- **Error Rate**: < 1%
- **Throughput**: Según capacidad esperada
- **Usuarios**: Carga típica esperada

### Prueba de Estrés
- **Response Time**: p(95) < 2000ms (más permisivo)
- **Error Rate**: < 5%
- **Throughput**: Identificar punto de saturación
- **Usuarios**: 2-5x la carga normal

### Prueba de Picos
- **Response Time**: p(95) < 1000ms durante picos
- **Error Rate**: < 2%
- **Recovery Time**: < 30 segundos después del pico
- **Usuarios**: Incremento súbito

### Prueba de Estabilidad
- **Response Time**: Estable durante toda la prueba
- **Error Rate**: < 0.5%
- **Memory Leaks**: Sin degradación en el tiempo
- **Usuarios**: Carga constante por tiempo prolongado

## Análisis de Resultados

### Señales de Problemas
1. **Tiempos de respuesta crecientes**: Posible saturación
2. **Alta tasa de errores**: Problemas de estabilidad
3. **Throughput decreciente**: Cuellos de botella
4. **Timeouts frecuentes**: Problemas de red o servidor

### Métricas de Referencia (Benchmarks)
- **Excelente**: p(95) < 200ms, error rate < 0.1%
- **Bueno**: p(95) < 500ms, error rate < 1%
- **Aceptable**: p(95) < 1000ms, error rate < 5%
- **Problemático**: p(95) > 2000ms, error rate > 10%
