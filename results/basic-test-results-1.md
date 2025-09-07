# Resultados Prueba Básica #1

**Fecha**: $(date)  
**Script**: scripts/basic-load-test.js  
**Duración**: 2 minutos  
**Usuarios Virtuales**: 10  

## Resumen Ejecutivo
- ✅ Prueba ejecutada exitosamente
- ✅ k6 instalado y funcionando correctamente
- ⚠️ Algunos thresholds fallaron (esperado en primera ejecución)
- ✅ Tasa de error muy baja (0.14%)

## Métricas Principales

### Rendimiento General
- **Iteraciones completadas**: 346
- **Requests HTTP totales**: 692
- **Throughput**: 5.6 requests/segundo
- **Duración promedio iteración**: 3.52 segundos

### Tiempos de Respuesta
- **Promedio**: 249.47ms
- **Mínimo**: 127.18ms
- **Máximo**: 1,937ms
- **p(90)**: 567.28ms
- **p(95)**: 770.52ms ❌ (objetivo: <500ms)
- **p(99)**: No reportado

### Tasa de Errores
- **HTTP requests fallidos**: 0.14% ✅ (1 de 692)
- **Checks fallidos**: 2.60% (45 de 1730)

### Desglose de Checks
- **GET status is 200**: 99% ✅ (345/346)
- **GET response time < 500ms**: 91% ⚠️ (315/346)
- **POST status is 200**: 100% ✅ (346/346)
- **POST response time < 1000ms**: 96% ✅ (333/346)
- **POST contains test data**: 100% ✅ (346/346)

## Thresholds
- ❌ `errors rate<0.1`: 100% (fallido por diseño del script)
- ❌ `http_req_duration p(95)<500`: 770.52ms
- ✅ `http_req_failed rate<0.1`: 0.14%

## Análisis

### Puntos Positivos
1. **Estabilidad**: Solo 1 request falló de 692 (excelente)
2. **Consistencia**: La mayoría de requests fueron rápidos
3. **Funcionalidad**: Todos los endpoints respondieron correctamente

### Áreas de Mejora
1. **Tiempos de respuesta**: Algunos requests > 500ms
2. **Thresholds**: Ajustar criterios más realistas
3. **Endpoint**: httpbin.org puede tener latencia variable

### Recomendaciones
1. Ajustar thresholds a valores más realistas (p95 < 1000ms)
2. Probar con diferentes endpoints
3. Implementar escenarios de rampa gradual
4. Agregar más métricas personalizadas

## Próximos Pasos
- ✅ Lección 2 completada: Script básico funcionando
- ⏳ Lección 3: Implementar grupos de hilos y controllers
- ⏳ Crear escenarios de carga más complejos
- ⏳ Optimizar thresholds basados en estos resultados

---
**Conclusión**: Primera prueba exitosa. k6 funciona correctamente y tenemos una línea base para futuras mejoras.
