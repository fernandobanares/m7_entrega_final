import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas personalizadas
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');

// Configuración de la prueba
export let options = {
  // Escenario básico: 10 usuarios por 2 minutos
  vus: 10,
  duration: '2m',
  
  // Thresholds (criterios de éxito)
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de requests < 500ms
    http_req_failed: ['rate<0.1'],    // Menos del 10% de errores
    errors: ['rate<0.1'],             // Menos del 10% de errores personalizados
  },
};

// URL base para las pruebas - CAMBIAR POR TU ENDPOINT
const BASE_URL = 'https://httpbin.org';

export default function () {
  // Test 1: GET request simple
  let response1 = http.get(`${BASE_URL}/get`);
  
  // Verificaciones
  check(response1, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  // Registrar tiempo de respuesta
  responseTime.add(response1.timings.duration);
  
  sleep(1); // Pausa de 1 segundo entre requests
  
  // Test 2: POST request con datos
  let payload = JSON.stringify({
    test: 'performance',
    timestamp: new Date().toISOString(),
    user: __VU, // ID del usuario virtual
  });
  
  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let response2 = http.post(`${BASE_URL}/post`, payload, params);
  
  // Verificaciones para POST
  check(response2, {
    'POST status is 200': (r) => r.status === 200,
    'POST response time < 1000ms': (r) => r.timings.duration < 1000,
    'POST contains test data': (r) => r.json().json.test === 'performance',
  }) || errorRate.add(1);
  
  responseTime.add(response2.timings.duration);
  
  sleep(2); // Pausa de 2 segundos antes del siguiente ciclo
}

// Función que se ejecuta al final de la prueba
export function teardown(data) {
  console.log('Prueba básica completada');
  console.log('Revisa los resultados en la consola y en results/');
}
