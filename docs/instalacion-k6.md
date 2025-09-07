# Instalación de k6 en Windows

## Opción 1: Descarga Directa (Recomendada)

1. Ve a: https://github.com/grafana/k6/releases
2. Descarga la versión más reciente para Windows (k6-vX.X.X-windows-amd64.zip)
3. Extrae el archivo zip
4. Copia k6.exe a una carpeta en tu PATH (ej: C:\Windows\System32) o:
   - Crea una carpeta C:\k6
   - Copia k6.exe ahí
   - Añade C:\k6 a tu PATH en Variables de Entorno

## Opción 2: Usando Chocolatey

Si tienes Chocolatey instalado:
```bash
choco install k6
```

## Opción 3: Usando Scoop

Si tienes Scoop instalado:
```bash
scoop install k6
```

## Verificar Instalación

Después de instalar, abre una nueva terminal y ejecuta:
```bash
k6 version
```

Deberías ver algo como:
```
k6 v0.47.0 (2023-10-04T13:22:12+0000/v0.47.0-0-gd8c42dd9, go1.21.1, windows/amd64)
```

## Alternativa: Usar Docker

Si prefieres usar Docker:
```bash
docker run --rm -i grafana/k6:latest run - <script.js
```

## Siguiente Paso

Una vez instalado k6, regresa a VSCode y ejecuta:
```bash
k6 version
```

Para confirmar que funciona correctamente.
