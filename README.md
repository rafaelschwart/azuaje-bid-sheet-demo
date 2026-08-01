# Caso 004 · Juan Azuaje · Hoja de Puja V0

Prototipo funcional para un comprador de vehículos siniestrados en Copart que repara y revende.
Estado: **V0 demostrable, sin cliente firmado.** Nada de esto se le ha mostrado a Juan todavía.

Demo publicada (privada): https://claude.ai/code/artifact/d0a1519f-fff2-4c1d-bf77-db1dafa9adb0

---

## Cómo se abre

`hoja-de-puja.html` es **un solo archivo, sin dependencias, sin build**. Doble clic y corre.
Los datos se guardan en `localStorage` del navegador — no hay servidor ni base de datos.

Para servirlo local si hace falta: `python3 -m http.server 8000`

---

## Qué hace, en el orden en que se usa

| Pestaña | Qué resuelve |
|---|---|
| **Lista** | Carga 800 lotes y los baja a shortlist por etapas, mostrando qué mató cada regla |
| **Filtros** | Reglas personalizables con conteo en vivo y perfiles guardables |
| **Puja** | Techo de puja con los fees de Copart **resueltos**, no estimados |
| **Piezas** | Checklist de piezas por tipo de daño + memoria de precios + grúa por distancia real |
| **Libro** | Proyectado contra real por unidad |
| **Tus números** | Sesgo de estimación y fórmula recalibrada |

---

## LO IMPORTANTE: qué es real y qué está inventado

Esto no se puede confundir al enseñarlo. Separado sin ambigüedad:

### Real y verificado

- **El esquema de 61 columnas de Copart.** Medido sobre 5,000 lotes reales (13–17 jul 2026).
  Muestra en `data/muestra-copart-2026-07-17.csv`.
- **Los 45 yards con sus códigos postales, geocodificados.** `data/yards-copart-geocoded.json`.
  La grúa calcula distancia real entre ellos.
- **Las tasas de población de campos** (ver Hallazgos abajo).
- **NHTSA vPIC**: probado en vivo. 41 campos por VIN, batch de 50, 5 VINs en 0.70s.
  Gratis, sin llave, sin tope. Aún no integrado en el HTML porque el CSP de la página publicada
  bloquea llamadas externas — entra al montarlo sobre servidor.
- **El solver del techo de puja.** Verificado exacto contra fuerza bruta.

### Inventado

- **Los 800 lotes de la demo.** Generados por código con semilla fija. Ninguno existe.
  Las *distribuciones* sí están calibradas contra los datos reales; los *lotes* no.
- **Las 6 unidades del Libro** y sus factores de calibración derivados.
- **Las plantillas de piezas.** Copart NO publica qué piezas necesita un carro — su vocabulario
  de daño son 22 palabras. Las plantillas son conocimiento de oficio escrito por nosotros.
- **Los precios base de piezas** y los factores de severidad.
- **La tabla de fees de Copart.** Ver abajo.

---

## Hallazgos medidos (5,000 lotes, 13–17 jul 2026)

**El yard 838 "RENTAL VEHICLE SALE" es la venta de Juan.** Corre lunes (83) y miércoles (39),
ningún otro día — coincide exactamente con lo que él describió. Concentra el 90.4% de los lotes
con `rentals=true`. Perfil: título limpio 74.6% · FRONT END 51.6% · millaje mediana 41,428 ·
año mediana 2025 · marcas Nissan 28, Kia 23, Toyota 15.

**Tasas de población:**

| Campo | Poblado | Nota |
|---|---|---|
| `damageDescription` | 100% | Solo 22 valores distintos en todo el universo |
| `saleTitleType` | 100% | **83 códigos distintos, 258 combinaciones estado+código** |
| `estRetailValue` | — | **Redactado como `[PREMIUM]` en la muestra gratuita** |
| `repairCost` | 69.7% | Número en dólares, sin desglose. Mediana $10,944 |
| `mileage` | 87.6% | El 12.4% viene en 0 = ausente, no cero millas |
| `secondaryDamage` | 48.3% | |
| `autoGrade` | 4.6% | Cualquier score que lo pese imputa en el 95% |
| `FRAME DAMAGE` | 0.1% | 6 de 5,000. Por eso el daño estructural es su mayor riesgo |

**Formatos que rompen el código ingenuo:**
`rentals` (plural, no `rental`) · `runsDrives` = "Run & Drive Verified"/"Vehicle Starts"/"DEFAULT" ·
`hasKeys` = YES/NO/EXM · daños en MAYÚSCULAS · `locationZip` a veces trae ZIP+4 con espacio.

**Los fees de Copart no están disponibles públicamente.** Sus páginas oficiales devuelven shells
vacíos (JS detrás de Imperva) y las calculadoras de terceros se contradicen entre sí. La tabla en
la app es editable a propósito: **se reemplaza con una factura real de Juan y queda calibrada.**

---

## Decisiones de arquitectura que no se negocian

1. **Nunca automatizar una sesión logueada** en Copart, Manheim, Carfax ni eBay.
2. **Nunca pujar automáticamente.** Es lo único que le puede costar la cuenta de Copart.
3. **Nunca descargar ni rehospedar fotos.** Guardar la URL, renderizar desde origen.
4. **Carfax se queda manual**, bajo su login, solo sobre el shortlist. No se deriva nada de él.
5. **eBay por enlaces, no por ingesta.** El botón arma la búsqueda; el precio se ve en eBay.
6. **La lista de venta la aporta él**, exportada con su membresía. Cero agregador, cero contrato.

---

## Abierto — lo que bloquea la siguiente fase

1. **¿Qué columnas trae el CSV de miembro de Copart?** Sabemos qué *muestra* el sitio; no sabemos
   qué trae el *export*. Si no trae `estRetailValue`, la estimación automática hay que rediseñarla.
   **Se resuelve con un archivo suyo, de cualquier lunes viejo.**
2. **¿Sus 200 son pre o post filtro?** Decide si hay cobertura que ganar. La primera corrida sobre
   una lista real lo responde sin preguntárselo.
3. **¿La categoría "Rental Vehicles" del sitio es el mismo universo que el flag `rentals`?**
4. **Las fotos.** Son la única fuente real de qué piezas están rotas, y son la línea que dijimos
   que no cruzamos. Es decisión de Juan, por escrito, no nuestra en silencio.

---

## Comercial (interno)

Piloto **$3,000 / 3 semanas** = Puja + Libro. Mensualidad **$500** desde el mes 2.
Fase 1 **$5,000** condicional al resultado del piloto. Cero pass-throughs en fase 1.
Propuesta: firmarlo como **design partner**, no como cliente de un build a medida —
los módulos sirven igual para cualquier comprador de subasta.

---

## Pruebas

```bash
node tests/solver-techo-puja.test.js     # exactitud del techo vs fuerza bruta
node tests/calibracion-piezas.test.js    # plantilla de piezas contra el libro
```

El solver tiene una trampa: la función de fees **no es monótona** — a $4,999 el fee escalonado es
$535 y a $5,000 el 10% son $500, o sea baja. Una búsqueda binaria pierde hasta $35 de techo.
Se resuelve por régimen de fee con reparación local. **No cambiar sin correr el test.**
