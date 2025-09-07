import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { CONFIG } from '../config/test-config.js';

// Métricas personalizadas para prueba de estrés
export let errorRate = new Rate('stress_errors');
export let responseTime = new Trend('stress_response_time');
export let activeConnections = new Gauge('active_connections');
export let successfulRequests = new Counter('successful_requests');

// Configuración de prueba de estrés
export let options = {
  scenarios: {
    // Escenario 1: Escalado gradual hasta el límite
    stress_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Subir gradualmente
        { duration: '5m', target: 50 },   // Aumentar carga
        { duration: '2m', target: 100 },  // Llegar al límite
        { duration: '5m', target: 100 },  // Mantener estrés
        { duration: '2m', target: 0 },    // Bajar gradualmente
      ],
      tags: { test_type: 'stress_ramp' },
    },
    
    // Escenario 2: Pico súbito de carga
    spike_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Carga base
        { duration: '30s', target: 200 }, // Pico extremo
        { duration: '1m', target: 200 },  // Mantener pico
        { duration: '30s', target: 10 },  // Volver a base
        { duration: '1m', target: 0 },    // Finalizar
      ],
      tags: { test_type: 'spike_stress' },
    },
  },
  
  // Thresholds más permisivos para pruebas de estrés
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.2'], // Hasta 20% de errores aceptable en estrés
    stress_errors: ['rate<0.3'],
    successful_requests: ['count>500'],
    'http_req_duration{test_type:stress_ramp}': ['p(95)<2500'],
    'http_req_duration{test_type:spike_stress}': ['p(95)<4000'],
  },
};

const BASE_URL = CONFIG.BASE_URL;

export default function () {
  // Registrar conexión activa
  activeConnections.add(1);
  
  group('Stress Test Operations', function () {
    // Test 1: Operación crítica bajo estrés
    let criticalResponse = http.get(`${BASE_URL}/get`, {
      tags: { 
        operation: 'critical',
        test_type: __ENV.K6_SCENARIO || 'stress_ramp'
      },
    });
    
    let criticalSuccess = check(criticalResponse, {
      'Critical operation status 200': (r) => r.status === 200,
      'Critical operation < 2s': (r) => r.timings.duration < 2000,
      'Critical operation has data': (r) => r.body.length > 0,
    });
    
    if (criticalSuccess) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
    
    responseTime.add(criticalResponse.timings.duration);
    
    // Pausa variable según la carga
    let currentVUs = __VU;
    let sleepTime = currentVUs > 50 ? 0.5 : 1; // Menos pausa con más usuarios
    sleep(sleepTime);
    
    // Test 2: Operación de escritura bajo estrés
    let stressData = JSON.stringify({
      stress_test: true,
      vu_id: __VU,
      iteration: __ITER,
      timestamp: new Date().toISOString(),
      load_level: currentVUs > 100 ? 'extreme' : currentVUs > 50 ? 'high' : 'medium',
    });
    
    let writeResponse = http.post(
      `${BASE_URL}/post`,
      stressData,
      {
        headers: CONFIG.HEADERS.json,
        tags: { 
          operation: 'write_stress',
          test_type: __ENV.K6_SCENARIO || 'stress_ramp'
        },
      }
    );
    
    let writeSuccess = check(writeResponse, {
      'Write operation status 200': (r) => r.status === 200,
      'Write operation < 3s': (r) => r.timings.duration < 3000,
      'Write operation echoes data': (r) => {
        try {
          return r.json().json.stress_test === true;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (writeSuccess) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
    
    responseTime.add(writeResponse.timings.duration);
    
    // Test 3: Operación de validación con diferentes códigos
    let statusCodes = [200, 201, 400, 404, 500];
    let randomStatus = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    
    let validationResponse = http.get(`${BASE_URL}/status/${randomStatus}`, {
      tags: { 
        operation: 'validation',
        expected_status: randomStatus,
        test_type: __ENV.K6_SCENARIO || 'stress_ramp'
      },
    });
    
    check(validationResponse, {
      'Validation returns expected status': (r) => r.status === randomStatus,
      'Validation response < 1.5s': (r) => r.timings.duration < 1500,
    });
    
    // Solo contar como exitoso si es 2xx
    if (randomStatus >= 200 && randomStatus < 300) {
      successfulRequests.add(1);
    }
    
    responseTime.add(validationResponse.timings.duration);
    
    // Pausa final variable
    sleep(Math.random() * 2); // Entre 0-2 segundos
  });
  
  // Desregistrar conexión
  activeConnections.add(-1);
}

// Configuración inicial
export function setup() {
  console.log('🔥 Iniciando prueba de ESTRÉS');
  console.log('⚠️  Esta prueba llevará el sistema al límite');
  console.log('📊 Escenarios: stress_ramp + spike_stress');
  
  // Verificar conectividad antes del estrés
  let healthCheck = http.get(`${BASE_URL}/get`);
  if (healthCheck.status !== 200) {
    throw new Error(`Sistema no disponible antes del estrés: ${healthCheck.status}`);
  }
  
  console.log('✅ Sistema listo para prueba de estrés');
  return { 
    startTime: new Date().toISOString(),
    baselineResponse: healthCheck.timings.duration 
  };
}

// Análisis post-estrés
export function teardown(data) {
  console.log('🏁 Prueba de estrés completada');
  console.log(`⏱️  Iniciada: ${data.startTime}`);
  console.log(`⏱️  Finalizada: ${new Date().toISOString()}`);
  console.log(`📈 Línea base: ${data.baselineResponse}ms`);
  
  // Test de recuperación
  console.log('🔍 Verificando recuperación del sistema...');
  let recoveryCheck = http.get(`${CONFIG.BASE_URL}/get`);
  
  if (recoveryCheck.status === 200) {
    console.log('✅ Sistema se recuperó correctamente');
    console.log(`📊 Tiempo de respuesta post-estrés: ${recoveryCheck.timings.duration}ms`);
  } else {
    console.log('❌ Sistema no se recuperó completamente');
    console.log(`❌ Status: ${recoveryCheck.status}`);
  }
}
