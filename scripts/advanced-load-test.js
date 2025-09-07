import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG } from '../config/test-config.js';

// Métricas personalizadas
export let errorRate = new Rate('errors');
export let businessTransactions = new Counter('business_transactions');
export let apiResponseTime = new Trend('api_response_time');

// Configuración avanzada con múltiples escenarios
export let options = {
  scenarios: {
    // Escenario 1: Carga constante
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      tags: { scenario: 'constant' },
    },
    
    // Escenario 2: Rampa gradual
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // Subir gradualmente
        { duration: '1m', target: 15 },   // Mantener carga media
        { duration: '30s', target: 0 },   // Bajar gradualmente
      ],
      tags: { scenario: 'ramp' },
    },
    
    // Escenario 3: Pico de carga
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },   // Carga base
        { duration: '5s', target: 25 },   // Pico súbito
        { duration: '10s', target: 25 },  // Mantener pico
        { duration: '5s', target: 5 },    // Volver a base
        { duration: '10s', target: 0 },   // Finalizar
      ],
      tags: { scenario: 'spike' },
    },
  },
  
  // Thresholds más realistas basados en resultados anteriores
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    'http_req_duration{scenario:constant}': ['p(95)<800'],
    'http_req_duration{scenario:ramp}': ['p(95)<1200'],
    'http_req_duration{scenario:spike}': ['p(95)<1500'],
    business_transactions: ['count>100'],
  },
};

// Función principal de prueba
export default function () {
  // Grupo 1: Operaciones de lectura
  group('Read Operations', function () {
    // Test básico GET
    let getResponse = http.get(`${CONFIG.BASE_URL}${CONFIG.API_ENDPOINTS.get}`, {
      tags: { operation: 'read', endpoint: 'get' },
    });
    
    let getSuccess = check(getResponse, {
      'GET status is 200': (r) => r.status === 200,
      'GET response time < 800ms': (r) => r.timings.duration < 800,
      'GET has user-agent': (r) => r.json().headers['User-Agent'] !== undefined,
    });
    
    if (getSuccess) {
      businessTransactions.add(1);
    } else {
      errorRate.add(1);
    }
    
    apiResponseTime.add(getResponse.timings.duration);
    
    // Test con delay simulado
    let delayResponse = http.get(`${CONFIG.BASE_URL}${CONFIG.API_ENDPOINTS.delay}`, {
      tags: { operation: 'read', endpoint: 'delay' },
    });
    
    check(delayResponse, {
      'Delay endpoint responds': (r) => r.status === 200,
      'Delay response time > 2000ms': (r) => r.timings.duration > 2000,
    });
    
    sleep(CONFIG.SLEEP_TIMES.normal);
  });
  
  // Grupo 2: Operaciones de escritura
  group('Write Operations', function () {
    // Seleccionar datos de prueba aleatoriamente
    let randomUser = CONFIG.TEST_DATA.users[Math.floor(Math.random() * CONFIG.TEST_DATA.users.length)];
    let randomProduct = CONFIG.TEST_DATA.products[Math.floor(Math.random() * CONFIG.TEST_DATA.products.length)];
    
    // POST con datos estructurados
    let postPayload = JSON.stringify({
      user: randomUser,
      product: randomProduct,
      timestamp: new Date().toISOString(),
      scenario: __ENV.K6_SCENARIO || 'default',
      vu: __VU,
      iteration: __ITER,
    });
    
    let postResponse = http.post(
      `${CONFIG.BASE_URL}${CONFIG.API_ENDPOINTS.post}`,
      postPayload,
      {
        headers: CONFIG.HEADERS.json,
        tags: { operation: 'write', endpoint: 'post' },
      }
    );
    
    let postSuccess = check(postResponse, {
      'POST status is 200': (r) => r.status === 200,
      'POST response time < 1200ms': (r) => r.timings.duration < 1200,
      'POST echoes user data': (r) => {
        try {
          return r.json().json.user.id === randomUser.id;
        } catch (e) {
          return false;
        }
      },
      'POST echoes product data': (r) => {
        try {
          return r.json().json.product.name === randomProduct.name;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (postSuccess) {
      businessTransactions.add(1);
    } else {
      errorRate.add(1);
    }
    
    apiResponseTime.add(postResponse.timings.duration);
    
    sleep(CONFIG.SLEEP_TIMES.fast);
  });
  
  // Grupo 3: Operaciones de validación
  group('Validation Operations', function () {
    // Test de diferentes códigos de estado
    let statusCodes = [200, 201, 400, 404, 500];
    let randomStatus = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    
    let statusResponse = http.get(`${CONFIG.BASE_URL}/status/${randomStatus}`, {
      tags: { operation: 'validation', endpoint: 'status', expected_status: randomStatus },
    });
    
    check(statusResponse, {
      'Status endpoint returns expected code': (r) => r.status === randomStatus,
      'Status response time < 600ms': (r) => r.timings.duration < 600,
    });
    
    // Solo contar como transacción exitosa si es un código 2xx
    if (randomStatus >= 200 && randomStatus < 300) {
      businessTransactions.add(1);
    }
    
    sleep(CONFIG.SLEEP_TIMES.realistic());
  });
}

// Función de configuración inicial
export function setup() {
  console.log('🚀 Iniciando prueba avanzada de carga');
  console.log(`📊 Escenarios configurados: ${Object.keys(options.scenarios).length}`);
  console.log(`🎯 Thresholds definidos: ${Object.keys(options.thresholds).length}`);
  
  // Test de conectividad inicial
  let healthCheck = http.get(`${CONFIG.BASE_URL}${CONFIG.API_ENDPOINTS.get}`);
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: new Date().toISOString() };
}

// Función de limpieza final
export function teardown(data) {
  console.log('✅ Prueba avanzada completada');
  console.log(`⏱️ Iniciada: ${data.startTime}`);
  console.log(`⏱️ Finalizada: ${new Date().toISOString()}`);
  console.log('📈 Revisa los resultados detallados en la consola');
}
