# Proyecto: Evaluación de Rendimiento y Escalabilidad

## Descripción del Proyecto
Este proyecto implementa pruebas de rendimiento y escalabilidad utilizando k6 para evaluar el comportamiento de sistemas bajo diferentes cargas de trabajo.

## Objetivos
- Evaluar tiempos de respuesta, throughput y cuellos de botella
- Simular diferentes escenarios de carga
- Generar informes detallados con métricas clave
- Proponer mejoras basadas en resultados

## Herramienta Seleccionada: k6
**¿Por qué k6?**
- Scripts en JavaScript (familiar y accesible)
- Excelente integración con VSCode
- Reportes detallados y visualizaciones
- Ligero y eficiente
- Soporte nativo para métricas avanzadas

## Estructura del Proyecto
```
/
├── scripts/           # Scripts de prueba k6
├── results/          # Resultados de ejecuciones
├── docs/            # Documentación
├── config/          # Configuraciones
└── reports/         # Informes generados
```

## KPIs Principales a Evaluar

### 1. Tiempos de Respuesta
- **Tiempo promedio**: Tiempo medio de respuesta
- **Percentiles**: p90, p95, p99 (tiempos que el 90%, 95%, 99% de requests no superan)
- **Tiempo mínimo/máximo**: Rangos de respuesta

### 2. Throughput
- **Requests por segundo (RPS)**: Cantidad de peticiones procesadas por segundo
- **Transacciones por segundo (TPS)**: Transacciones completadas exitosamente

### 3. Tasa de Error
- **Error rate**: Porcentaje de requests fallidos
- **Tipos de errores**: HTTP 4xx, 5xx, timeouts, conexiones fallidas

### 4. Uso de Recursos
- **Conexiones concurrentes**: Número de usuarios/hilos simultáneos
- **Tiempo de establecimiento de conexión**: Latencia de red

## Escenarios de Prueba Planificados

### Escenario 1: Prueba de Carga Normal
- **Usuarios**: 10-50 usuarios concurrentes
- **Duración**: 5 minutos
- **Objetivo**: Establecer línea base de rendimiento

### Escenario 2: Prueba de Estrés
- **Usuarios**: 100-200 usuarios concurrentes
- **Duración**: 10 minutos
- **Objetivo**: Identificar punto de quiebre

### Escenario 3: Prueba de Picos
- **Usuarios**: Incremento súbito de 10 a 100 usuarios
- **Duración**: 3 minutos
- **Objetivo**: Evaluar respuesta a picos de tráfico

### Escenario 4: Prueba de Estabilidad
- **Usuarios**: 30 usuarios constantes
- **Duración**: 30 minutos
- **Objetivo**: Detectar memory leaks o degradación

## Métricas Mínimas a Cumplir
- ✅ Escenarios de prueba: mínimo 2 (planificados 4)
- ✅ Pruebas ejecutadas: mínimo 6 (planificadas 12+)
- ✅ Cobertura de escenarios: 80% flujos críticos
- ✅ Repeticiones: mínimo 3 rondas por escenario

## Instalación y Configuración

### Prerrequisitos
- Node.js (para scripts auxiliares)
- k6 instalado
- VSCode con extensiones recomendadas

### Instalación de k6
```bash
# Windows (usando Chocolatey)
choco install k6

# O descargar desde https://k6.io/docs/getting-started/installation/
```

### Ejecución de Pruebas
```bash
# Ejecutar script básico
k6 run scripts/basic-load-test.js

# Ejecutar con configuración específica
k6 run --vus 50 --duration 5m scripts/stress-test.js

# Generar reporte HTML
k6 run --out html=results/report.html scripts/load-test.js
```

## Próximos Pasos
1. ✅ Configurar entorno y estructura
2. ⏳ Crear scripts básicos de prueba
3. ⏳ Implementar escenarios avanzados
4. ⏳ Ejecutar pruebas y recolectar métricas
5. ⏳ Analizar resultados y generar informes
6. ⏳ Documentar conclusiones y recomendaciones

---
**Autor**: Fernando Bañares  
**Fecha**: $(date)  
**Herramienta**: k6 v0.x  
**Proyecto**: Módulo 7 - Evaluación de Rendimiento y Escalabilidad
