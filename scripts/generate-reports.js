import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Script para generar reportes en múltiples formatos
export let options = {
  scenarios: {
    // Escenario de reporte rápido
    quick_report: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'report_generation' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'https://httpbin.org';

export default function () {
  group('Report Generation Test', function () {
    // Test básico para generar datos
    let response = http.get(`${BASE_URL}/get`, {
      tags: { endpoint: 'get', operation: 'read' },
    });
    
    check(response, {
      'Status is 200': (r) => r.status === 200,
      'Response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    sleep(1);
    
    // Test POST para variedad de datos
    let postData = {
      timestamp: new Date().toISOString(),
      test_id: __VU,
      iteration: __ITER,
    };
    
    let postResponse = http.post(
      `${BASE_URL}/post`,
      JSON.stringify(postData),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'post', operation: 'write' },
      }
    );
    
    check(postResponse, {
      'POST Status is 200': (r) => r.status === 200,
      'POST Response time < 1500ms': (r) => r.timings.duration < 1500,
    });
    
    sleep(2);
  });
}

// Función para generar reportes personalizados
export function handleSummary(data) {
  return {
    // Reporte HTML detallado
    'reports/summary-report.html': htmlReport(data),
    
    // Reporte de texto para consola
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    
    // Reporte JSON para análisis posterior
    'results/summary-data.json': JSON.stringify(data, null, 2),
    
    // Reporte CSV para Excel
    'results/metrics.csv': generateCSVReport(data),
    
    // Reporte markdown para documentación
    'results/summary-report.md': generateMarkdownReport(data),
  };
}

// Función para generar reporte CSV
function generateCSVReport(data) {
  const metrics = data.metrics;
  let csv = 'Metric,Value,Unit,Type\n';
  
  // Métricas principales
  if (metrics.http_req_duration) {
    csv += `HTTP Request Duration (avg),${metrics.http_req_duration.values.avg},ms,Performance\n`;
    csv += `HTTP Request Duration (p95),${metrics.http_req_duration.values['p(95)']},ms,Performance\n`;
    csv += `HTTP Request Duration (max),${metrics.http_req_duration.values.max},ms,Performance\n`;
  }
  
  if (metrics.http_reqs) {
    csv += `HTTP Requests (total),${metrics.http_reqs.values.count},requests,Volume\n`;
    csv += `HTTP Requests (rate),${metrics.http_reqs.values.rate},req/s,Throughput\n`;
  }
  
  if (metrics.http_req_failed) {
    csv += `HTTP Request Failed Rate,${(metrics.http_req_failed.values.rate * 100).toFixed(2)},%,Quality\n`;
  }
  
  if (metrics.iterations) {
    csv += `Iterations (total),${metrics.iterations.values.count},iterations,Volume\n`;
    csv += `Iterations (rate),${metrics.iterations.values.rate},iter/s,Throughput\n`;
  }
  
  if (metrics.vus) {
    csv += `Virtual Users (avg),${metrics.vus.values.value},users,Load\n`;
  }
  
  if (metrics.vus_max) {
    csv += `Virtual Users (max),${metrics.vus_max.values.value},users,Load\n`;
  }
  
  return csv;
}

// Función para generar reporte Markdown
function generateMarkdownReport(data) {
  const metrics = data.metrics;
  const startTime = new Date(data.state.testRunDurationMs).toISOString();
  
  let md = `# Reporte de Prueba de Rendimiento\n\n`;
  md += `**Fecha de ejecución**: ${startTime}\n`;
  md += `**Duración total**: ${(data.state.testRunDurationMs / 1000).toFixed(2)} segundos\n\n`;
  
  md += `## Resumen Ejecutivo\n\n`;
  
  if (metrics.http_reqs) {
    md += `- **Total de requests**: ${metrics.http_reqs.values.count}\n`;
    md += `- **Throughput**: ${metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  }
  
  if (metrics.iterations) {
    md += `- **Iteraciones completadas**: ${metrics.iterations.values.count}\n`;
  }
  
  if (metrics.http_req_failed) {
    const errorRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    md += `- **Tasa de error**: ${errorRate}%\n`;
  }
  
  md += `\n## Métricas de Rendimiento\n\n`;
  
  if (metrics.http_req_duration) {
    md += `### Tiempos de Respuesta\n\n`;
    md += `| Métrica | Valor | Unidad |\n`;
    md += `|---------|-------|--------|\n`;
    md += `| Promedio | ${metrics.http_req_duration.values.avg.toFixed(2)} | ms |\n`;
    md += `| Mínimo | ${metrics.http_req_duration.values.min.toFixed(2)} | ms |\n`;
    md += `| Máximo | ${metrics.http_req_duration.values.max.toFixed(2)} | ms |\n`;
    md += `| p(90) | ${metrics.http_req_duration.values['p(90)'].toFixed(2)} | ms |\n`;
    md += `| p(95) | ${metrics.http_req_duration.values['p(95)'].toFixed(2)} | ms |\n`;
    md += `| p(99) | ${metrics.http_req_duration.values['p(99)'].toFixed(2)} | ms |\n\n`;
  }
  
  md += `### Checks y Validaciones\n\n`;
  if (data.root_group && data.root_group.checks) {
    for (const [checkName, checkData] of Object.entries(data.root_group.checks)) {
      const passRate = ((checkData.passes / (checkData.passes + checkData.fails)) * 100).toFixed(1);
      const status = passRate >= 95 ? '✅' : passRate >= 90 ? '⚠️' : '❌';
      md += `- ${status} **${checkName}**: ${passRate}% (${checkData.passes}/${checkData.passes + checkData.fails})\n`;
    }
  }
  
  md += `\n## Análisis\n\n`;
  md += `### Puntos Destacados\n`;
  
  if (metrics.http_req_failed && metrics.http_req_failed.values.rate < 0.01) {
    md += `- ✅ Excelente calidad: Tasa de error < 1%\n`;
  } else if (metrics.http_req_failed && metrics.http_req_failed.values.rate < 0.05) {
    md += `- ⚠️ Calidad aceptable: Tasa de error < 5%\n`;
  } else {
    md += `- ❌ Calidad preocupante: Tasa de error alta\n`;
  }
  
  if (metrics.http_req_duration && metrics.http_req_duration.values['p(95)'] < 1000) {
    md += `- ✅ Buen rendimiento: p(95) < 1 segundo\n`;
  } else {
    md += `- ⚠️ Rendimiento mejorable: p(95) > 1 segundo\n`;
  }
  
  md += `\n### Recomendaciones\n`;
  md += `1. Revisar endpoints con mayor latencia\n`;
  md += `2. Monitorear recursos del sistema durante picos\n`;
  md += `3. Considerar optimizaciones basadas en percentiles\n`;
  md += `4. Implementar alertas para métricas críticas\n\n`;
  
  md += `---\n`;
  md += `*Reporte generado automáticamente por k6*\n`;
  
  return md;
}
