# Plan de Pruebas de Rendimiento y Escalabilidad

## Información General del Proyecto

**Proyecto**: Evaluación de Rendimiento y Escalabilidad  
**Módulo**: 7 - Pruebas de rendimiento  
**Herramienta**: k6 (Grafana k6 v1.2.3)  
**Entorno**: VSCode + Windows + Scoop  
**Fecha de creación**: 2025-09-07  

## Objetivos del Plan de Pruebas

### Objetivo Principal
Evaluar el comportamiento del sistema bajo diferentes cargas de trabajo y condiciones de uso, identificando tiempos de respuesta, throughput y potenciales cuellos de botella.

### Objetivos Específicos
1. **Establecer línea base** de rendimiento del sistema
2. **Identificar límites** de capacidad y puntos de saturación
3. **Evaluar escalabilidad** bajo diferentes patrones de carga
4. **Detectar cuellos de botella** y áreas de optimización
5. **Validar estabilidad** durante períodos prolongados
6. **Generar métricas** para toma de decisiones

## Alcance de las Pruebas

### Incluye
- ✅ Pruebas de carga normal (10-50 usuarios)
- ✅ Pruebas de estrés (100+ usuarios)
- ✅ Pruebas de picos súbitos
- ✅ Pruebas de estabilidad prolongada
- ✅ Múltiples endpoints y operaciones
- ✅ Diferentes patrones de uso

### Excluye
- ❌ Pruebas de seguridad
- ❌ Pruebas funcionales detalladas
- ❌ Pruebas de interfaz de usuario
- ❌ Pruebas de bases de datos específicas

## Arquitectura de Pruebas

### Herramienta Seleccionada: k6
**Justificación**:
- Scripts en JavaScript (accesible)
- Excelente integración con VSCode
- Métricas detalladas y reportes profesionales
- Soporte nativo para múltiples escenarios
- Ligero y eficiente

### Estructura del Proyecto
```
/
├── scripts/           # Scripts de prueba k6
│   ├── basic-load-test.js
│   └── advanced-load-test.js
├── results/          # Resultados de ejecuciones
├── docs/            # Documentación
├── config/          # Configuraciones centralizadas
└── reports/         # Informes generados
```

## Escenarios de Prueba Definidos

### 1. Prueba Básica (basic-load-test.js)
**Configuración**:
- **Usuarios**: 10 VUs constantes
- **Duración**: 2 minutos
- **Operaciones**: GET y POST básicos
- **Objetivo**: Validar funcionamiento y establecer línea base

**Resultados Obtenidos**:
- ✅ 346 iteraciones completadas
- ✅ 692 requests HTTP (5.6 req/s)
- ✅ 97.39% checks exitosos
- ⚠️ p(95): 770ms (objetivo: <500ms)

### 2. Prueba Avanzada Multi-Escenario (advanced-load-test.js)
**Configuración**:
- **Escenario 1**: Constant Load (10 VUs, 2min)
- **Escenario 2**: Ramp Up (0→5→15→0 VUs)
- **Escenario 3**: Spike Test (0→5→25→5→0 VUs)
- **Grupos**: Read, Write, Validation Operations

**Resultados Obtenidos**:
- ✅ 374 iteraciones completadas
- ✅ 1,497 requests HTTP (11.6 req/s)
- ✅ 98.90% checks exitosos
- ✅ 884 transacciones de negocio
- ⚠️ p(95): 2.58s (algunos thresholds fallaron)

## Métricas y KPIs Monitoreados

### Tiempos de Respuesta
- **http_req_duration**: Tiempo total de request
- **Percentiles**: p(90), p(95), p(99)
- **Promedio, mínimo, máximo**
- **Por endpoint y operación**

### Throughput
- **http_reqs**: Requests por segundo
- **business_transactions**: Transacciones exitosas
- **iterations**: Iteraciones completadas

### Calidad y Errores
- **http_req_failed**: Tasa de errores HTTP
- **checks**: Validaciones exitosas/fallidas
- **errors**: Errores de negocio personalizados

### Carga y Concurrencia
- **vus**: Usuarios virtuales activos
- **vus_max**: Máximo usuarios configurados
- **iteration_duration**: Tiempo por iteración

## Thresholds y Criterios de Éxito

### Thresholds Básicos
```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.1'],
  errors: ['rate<0.1'],
}
```

### Thresholds Avanzados
```javascript
thresholds: {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.05'],
  'http_req_duration{scenario:constant}': ['p(95)<800'],
  'http_req_duration{scenario:spike}': ['p(95)<1500'],
  business_transactions: ['count>100'],
}
```

### Criterios de Éxito por Tipo de Prueba
- **Carga Normal**: p(95) < 500ms, error rate < 1%
- **Estrés**: p(95) < 2000ms, error rate < 5%
- **Picos**: Recuperación < 30s, sin degradación permanente
- **Estabilidad**: Sin memory leaks, rendimiento constante

## Configuración del Entorno

### Endpoint de Prueba
- **URL Base**: https://httpbin.org
- **Endpoints utilizados**:
  - `/get` - Operaciones de lectura
  - `/post` - Operaciones de escritura
  - `/delay/2` - Simulación de latencia
  - `/status/{code}` - Validación de códigos

### Datos de Prueba
```javascript
TEST_DATA: {
  users: [
    { id: 1, name: 'Usuario Test 1', email: 'test1@example.com' },
    { id: 2, name: 'Usuario Test 2', email: 'test2@example.com' },
    { id: 3, name: 'Usuario Test 3', email: 'test3@example.com' },
  ],
  products: [
    { id: 1, name: 'Producto A', price: 100 },
    { id: 2, name: 'Producto B', price: 200 },
    { id: 3, name: 'Producto C', price: 300 },
  ],
}
```

## Resultados y Análisis

### Línea Base Establecida
- **Throughput normal**: 5-12 requests/segundo
- **Tiempo de respuesta típico**: 200-800ms
- **Capacidad máxima probada**: 25 usuarios concurrentes
- **Tasa de error aceptable**: <1% para operaciones normales

### Cuellos de Botella Identificados
1. **Latencia de red**: httpbin.org introduce variabilidad
2. **Endpoints de delay**: Intencionalmente lentos (>2s)
3. **Picos de carga**: Algunos requests >1s durante picos

### Recomendaciones
1. **Usar endpoint local** para pruebas controladas
2. **Implementar monitoreo** de recursos del sistema
3. **Ajustar thresholds** basados en resultados reales
4. **Agregar pruebas** de estabilidad de 30+ minutos

## Próximas Fases

### Lección 5: Ejecución Robusta
- [ ] Implementar más escenarios de carga
- [ ] Pruebas de estabilidad prolongada
- [ ] Exportar resultados en múltiples formatos
- [ ] Automatización de ejecución

### Lección 6: Análisis Final
- [ ] Generar gráficos y visualizaciones
- [ ] Identificar patrones y tendencias
- [ ] Elaborar informe ejecutivo
- [ ] Proponer optimizaciones específicas

---

**Documento preparado por**: Equipo QA  
**Revisión**: v1.0  
**Próxima actualización**: Post Lección 5
