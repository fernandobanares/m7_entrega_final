import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG } from '../config/test-config.js';

// Métricas para prueba de resistencia/estabilidad
export let stabilityErrors = new Rate('stability_errors');
export let memoryLeakIndicator = new Trend('response_time_trend');
export let longRunTransactions = new Counter('long_run_transactions');

// Configuración de prueba de resistencia (30 minutos)
export let options = {
  scenarios: {
    // Escenario de estabilidad prolongada
    endurance_test: {
      executor: 'constant-vus',
      vus: 20, // Carga constante moderada
      duration: '10m', // Reducido para demo (normalmente 30m+)
      tags: { test_type: 'endurance' },
    },
  },
  
  // Thresholds enfocados en estabilidad
  thresholds: {
    http_req_duration: [
      'p(95)<1000', // Debe mantenerse estable
      'p(99)<2000',
    ],
    http_req_failed: ['rate<0.05'], // Muy baja tasa de error
    stability_errors: ['rate<0.02'],
    long_run_transactions: ['count>1000'], // Mínimo de transacciones
    
    // Verificar que no hay degradación en el tiempo
    'http_req_duration{phase:early}': ['p(95)<1000'],
    'http_req_duration{phase:middle}': ['p(95)<1200'], // Permitir ligera degradación
    'http_req_duration{phase:late}': ['p(95)<1500'],   // Pero no mucha
  },
};

const BASE_URL = CONFIG.BASE_URL;

export default function () {
  // Determinar fase de la prueba basada en tiempo transcurrido
  let testPhase = getTestPhase();
  
  group('Endurance Test Operations', function () {
    // Test 1: Operación repetitiva para detectar memory leaks
    let repetitiveResponse = http.get(`${BASE_URL}/get?iteration=${__ITER}`, {
      tags: { 
        operation: 'repetitive',
        phase: testPhase,
        test_type: 'endurance'
      },
    });
    
    let repetitiveSuccess = check(repetitiveResponse, {
      'Repetitive operation status 200': (r) => r.status === 200,
      'Repetitive operation stable time': (r) => r.timings.duration < 1000,
      'Repetitive operation has consistent data': (r) => r.body.length > 100,
    });
    
    if (repetitiveSuccess) {
      longRunTransactions.add(1);
    } else {
      stabilityErrors.add(1);
    }
    
    // Registrar tiempo para análisis de tendencia
    memoryLeakIndicator.add(repetitiveResponse.timings.duration);
    
    sleep(1);
    
    // Test 2: Operación de escritura con datos acumulativos
    let accumulativeData = JSON.stringify({
      endurance_test: true,
      vu_id: __VU,
      iteration: __ITER,
      phase: testPhase,
      timestamp: new Date().toISOString(),
      accumulated_data: generateAccumulativeData(__ITER),
    });
    
    let writeResponse = http.post(
      `${BASE_URL}/post`,
      accumulativeData,
      {
        headers: CONFIG.HEADERS.json,
        tags: { 
          operation: 'accumulative_write',
          phase: testPhase,
          test_type: 'endurance'
        },
      }
    );
    
    let writeSuccess = check(writeResponse, {
      'Accumulative write status 200': (r) => r.status === 200,
      'Accumulative write stable time': (r) => r.timings.duration < 1500,
      'Accumulative write preserves data': (r) => {
        try {
          let responseData = r.json();
          return responseData.json.iteration === __ITER;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (writeSuccess) {
      longRunTransactions.add(1);
    } else {
      stabilityErrors.add(1);
    }
    
    memoryLeakIndicator.add(writeResponse.timings.duration);
    
    sleep(2);
    
    // Test 3: Operación de limpieza/mantenimiento cada 50 iteraciones
    if (__ITER % 50 === 0) {
      let maintenanceResponse = http.get(`${BASE_URL}/delay/1`, {
        tags: { 
          operation: 'maintenance',
          phase: testPhase,
          test_type: 'endurance'
        },
      });
      
      check(maintenanceResponse, {
        'Maintenance operation completes': (r) => r.status === 200,
        'Maintenance operation within time': (r) => r.timings.duration < 2000,
      });
      
      console.log(`🔧 Mantenimiento ejecutado en iteración ${__ITER} (Fase: ${testPhase})`);
    }
    
    // Pausa variable para simular uso real
    sleep(Math.random() * 3 + 1); // Entre 1-4 segundos
  });
}

// Función para determinar la fase de la prueba
function getTestPhase() {
  let elapsed = new Date() - new Date(__ENV.K6_START_TIME || Date.now());
  let minutes = elapsed / (1000 * 60);
  
  if (minutes < 3) return 'early';
  if (minutes < 7) return 'middle';
  return 'late';
}

// Función para generar datos acumulativos (simula memory leak)
function generateAccumulativeData(iteration) {
  let data = [];
  // Generar más datos conforme avanza la prueba
  let dataSize = Math.min(iteration, 100);
  
  for (let i = 0; i < dataSize; i++) {
    data.push({
      id: i,
      value: `data_${iteration}_${i}`,
      timestamp: new Date().toISOString(),
    });
  }
  
  return data;
}

// Configuración inicial
export function setup() {
  console.log('⏳ Iniciando prueba de RESISTENCIA/ESTABILIDAD');
  console.log('🎯 Objetivo: Detectar degradación y memory leaks');
  console.log('⏱️  Duración: 10 minutos (demo) - Normalmente 30+ minutos');
  console.log('👥 Usuarios: 20 constantes');
  
  // Establecer tiempo de inicio para cálculos de fase
  __ENV.K6_START_TIME = Date.now();
  
  // Verificar estado inicial del sistema
  let baselineCheck = http.get(`${BASE_URL}/get`);
  if (baselineCheck.status !== 200) {
    throw new Error(`Sistema no disponible: ${baselineCheck.status}`);
  }
  
  console.log('✅ Sistema estable, iniciando prueba de resistencia');
  return { 
    startTime: new Date().toISOString(),
    baselineResponseTime: baselineCheck.timings.duration,
    startMemory: process.memoryUsage ? process.memoryUsage() : null
  };
}

// Análisis de estabilidad
export function teardown(data) {
  console.log('🏁 Prueba de resistencia completada');
  console.log(`⏱️  Duración total: ${new Date() - new Date(data.startTime)} ms`);
  console.log(`📊 Línea base inicial: ${data.baselineResponseTime}ms`);
  
  // Verificar estado final del sistema
  let finalCheck = http.get(`${CONFIG.BASE_URL}/get`);
  let finalResponseTime = finalCheck.timings.duration;
  
  console.log(`📊 Tiempo de respuesta final: ${finalResponseTime}ms`);
  
  // Análisis de degradación
  let degradation = ((finalResponseTime - data.baselineResponseTime) / data.baselineResponseTime) * 100;
  
  if (degradation > 50) {
    console.log(`❌ DEGRADACIÓN SIGNIFICATIVA: +${degradation.toFixed(2)}%`);
  } else if (degradation > 20) {
    console.log(`⚠️  Degradación moderada: +${degradation.toFixed(2)}%`);
  } else {
    console.log(`✅ Sistema estable: ${degradation > 0 ? '+' : ''}${degradation.toFixed(2)}%`);
  }
  
  console.log('📈 Revisa las métricas de tendencia para detectar memory leaks');
}
