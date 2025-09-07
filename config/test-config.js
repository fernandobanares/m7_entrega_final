// Configuraciones centralizadas para las pruebas

export const CONFIG = {
  // URLs de prueba - MODIFICAR SEGÚN TU APLICACIÓN
  BASE_URL: 'https://httpbin.org',
  API_ENDPOINTS: {
    get: '/get',
    post: '/post',
    put: '/put',
    delete: '/delete',
    delay: '/delay/2',
    status: '/status/200',
  },
  
  // Configuraciones de usuarios virtuales
  LOAD_PROFILES: {
    light: {
      vus: 5,
      duration: '1m',
    },
    normal: {
      vus: 10,
      duration: '2m',
    },
    heavy: {
      vus: 50,
      duration: '5m',
    },
    stress: {
      vus: 100,
      duration: '10m',
    },
  },
  
  // Thresholds comunes
  THRESHOLDS: {
    basic: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.1'],
    },
    strict: {
      http_req_duration: ['p(95)<300', 'p(99)<1000'],
      http_req_failed: ['rate<0.05'],
      http_reqs: ['rate>10'], // Mínimo 10 requests por segundo
    },
    stress: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.2'],
    },
  },
  
  // Configuraciones de rampa (escalado gradual)
  RAMP_PROFILES: {
    gradual: {
      stages: [
        { duration: '1m', target: 10 },  // Subir a 10 usuarios en 1 min
        { duration: '3m', target: 10 },  // Mantener 10 usuarios por 3 min
        { duration: '1m', target: 0 },   // Bajar a 0 usuarios en 1 min
      ],
    },
    spike: {
      stages: [
        { duration: '30s', target: 10 }, // Subir gradualmente
        { duration: '10s', target: 100 }, // Pico súbito
        { duration: '30s', target: 100 }, // Mantener pico
        { duration: '10s', target: 10 },  // Bajar rápido
        { duration: '30s', target: 0 },   // Finalizar
      ],
    },
    endurance: {
      stages: [
        { duration: '2m', target: 20 },   // Subir gradualmente
        { duration: '20m', target: 20 },  // Mantener carga constante
        { duration: '2m', target: 0 },    // Finalizar gradualmente
      ],
    },
  },
  
  // Configuraciones de sleep/pausa
  SLEEP_TIMES: {
    fast: 0.5,    // 500ms entre requests
    normal: 1,    // 1 segundo
    slow: 2,      // 2 segundos
    realistic: () => Math.random() * 3 + 1, // Entre 1-4 segundos (más realista)
  },
  
  // Headers comunes
  HEADERS: {
    json: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    form: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    api: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-performance-test/1.0',
    },
  },
  
  // Datos de prueba
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
  },
};
