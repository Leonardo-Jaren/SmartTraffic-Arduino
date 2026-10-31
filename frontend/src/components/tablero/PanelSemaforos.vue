<script setup lang="ts">
import { TrafficCone } from '@lucide/vue'
import type { EstadoDispositivo, FaseCruce, Modo } from '@/types/trafico'
import { SEMAFOROS_BASE } from '@/composables/simulacion/mapa'
import { obtenerColorSemaforo } from '@/composables/simulacion/semaforos'

const props = defineProps<{ fases: FaseCruce[]; modo: Modo; dispositivo: EstadoDispositivo }>()
defineEmits<{ seleccionar: [id: string] }>()

function colorDe(indice: number): string {
  const c = obtenerColorSemaforo(indice, props.modo, props.fases, props.dispositivo)
  return c ?? 'gris'
}
</script>

<template>
  <section class="panel semaforos-panel" id="semaforos">
    <div class="panel-cabecera">
      <div>
        <div class="eyebrow">ESTADO EN TIEMPO REAL</div>
        <h2>{{ modo === 'simulacion' ? '9 Semáforos viales' : 'Semáforos del dispositivo' }}</h2>
      </div>
      <span class="etiqueta-fuente">
        <TrafficCone :size="15" />
        {{
          modo === 'simulacion' ? 'SIMULACIÓN' : dispositivo.fuente === 'simulado' ? 'SIMULADOR SERIAL' : 'ARDUINO'
        }}
      </span>
    </div>

    <p class="texto-secundario">
      {{
        modo === 'simulacion'
          ? '9 semáforos activos orientados hacia el tráfico. Las 3 vías horizontales (S2, S4, S6) tienen su contraparte vertical en rojo/verde (S7, S8, S9).'
          : dispositivo.fuente === 'simulado'
            ? 'Datos del dispositivo simulado. S1–S6 físicos y S7–S9 como contrapartes seguras de las avenidas.'
            : 'Colores confirmados por el Arduino UNO. S7–S9 calculan la contraparte segura del cruce.'
      }}
    </p>

    <div class="semaforos-grid">
      <button
        v-for="(semaforo, indice) in SEMAFOROS_BASE"
        :key="semaforo.id"
        type="button"
        class="semaforo-item"
        :aria-label="`Seleccionar semáforo ${semaforo.id}, cruce ${semaforo.cruce}`"
        @click="$emit('seleccionar', semaforo.id)"
      >
        <div>
          <span class="semaforo-icono">{{ semaforo.id }}</span>
          <strong>{{ semaforo.cruce }} · {{ semaforo.eje === 'horizontal' ? 'H' : 'V' }}</strong>
        </div>
        <div class="fases-mini">
          <span>
            <i :class="['mini-punto', colorDe(indice)]"></i>
            {{ colorDe(indice).toUpperCase() }}
          </span>
        </div>
        <small v-if="modo === 'simulacion'">
          {{ Math.ceil(fases.find((f) => f.id === semaforo.cruce)?.restante ?? 0) }} s
        </small>
      </button>
    </div>
  </section>
</template>
