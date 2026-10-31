<script setup lang="ts">
import { RotateCcw, TrafficCone, Trash2 } from '@lucide/vue'
import type { EstadoDispositivo, FaseCruce, Modo } from '@/types/trafico'
import { SEMAFOROS_BASE } from '@/composables/simulacion/mapa'
import { obtenerColorSemaforo } from '@/composables/simulacion/semaforos'

const props = defineProps<{
  fases: FaseCruce[]
  modo: Modo
  dispositivo: EstadoDispositivo
  desactivados?: Set<string>
}>()
defineEmits<{ seleccionar: [id: string]; alternar: [id: string] }>()

function estaDesactivado(id: string): boolean {
  return Boolean(props.desactivados?.has(id))
}

function colorDe(indice: number, id: string): string {
  if (estaDesactivado(id)) return 'gris'
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
      <div
        v-for="(semaforo, indice) in SEMAFOROS_BASE"
        :key="semaforo.id"
        :class="['semaforo-item', { desactivado: estaDesactivado(semaforo.id) }]"
      >
        <button
          type="button"
          class="semaforo-boton-principal"
          :aria-label="`Seleccionar semáforo ${semaforo.id}, cruce ${semaforo.cruce}`"
          @click="$emit('seleccionar', semaforo.id)"
        >
          <div>
            <span class="semaforo-icono">{{ semaforo.id }}</span>
            <strong>{{ semaforo.cruce }} · {{ semaforo.eje === 'horizontal' ? 'H' : 'V' }}</strong>
          </div>
          <div class="fases-mini">
            <span v-if="!estaDesactivado(semaforo.id)">
              <i :class="['mini-punto', colorDe(indice, semaforo.id)]"></i>
              {{ colorDe(indice, semaforo.id).toUpperCase() }}
            </span>
            <span v-else class="texto-inactivo">
              ELIMINADO
            </span>
          </div>
          <small v-if="modo === 'simulacion' && !estaDesactivado(semaforo.id)">
            {{ Math.ceil(fases.find((f) => f.id === semaforo.cruce)?.restante ?? 0) }} s
          </small>
        </button>

        <button
          type="button"
          class="boton-accion-semaforo"
          :title="estaDesactivado(semaforo.id) ? 'Reactivar semáforo' : 'Eliminar / Desactivar semáforo'"
          :aria-label="estaDesactivado(semaforo.id) ? `Reactivar ${semaforo.id}` : `Eliminar ${semaforo.id}`"
          @click.stop="$emit('alternar', semaforo.id)"
        >
          <RotateCcw v-if="estaDesactivado(semaforo.id)" :size="14" />
          <Trash2 v-else :size="14" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.semaforo-item {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0;
  overflow: hidden;
  transition: opacity 0.2s, border-color 0.2s;
}

.semaforo-item.desactivado {
  opacity: 0.55;
  border-style: dashed;
}

.semaforo-boton-principal {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.boton-accion-semaforo {
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 8px;
  cursor: pointer;
  color: var(--color-texto-secundario, #9ba3af);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
}

.boton-accion-semaforo:hover {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.texto-inactivo {
  font-size: 0.72rem;
  font-weight: 600;
  color: #8c939f;
  letter-spacing: 0.04em;
}
</style>
