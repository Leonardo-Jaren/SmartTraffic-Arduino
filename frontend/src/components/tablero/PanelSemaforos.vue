<script setup lang="ts">
import { TrafficCone } from '@lucide/vue'
import type { EstadoDispositivo, FaseCruce, Modo } from '@/types/trafico'

defineProps<{ fases: FaseCruce[]; modo: Modo; dispositivo: EstadoDispositivo }>()
defineEmits<{ seleccionar: [id: string] }>()
</script>

<template>
  <section class="panel semaforos-panel" id="semaforos">
    <div class="panel-cabecera">
      <div>
        <div class="eyebrow">ESTADO EN TIEMPO REAL</div>
        <h2>{{ modo === 'simulacion' ? 'Fases por intersección' : 'Semáforos del dispositivo' }}</h2>
      </div>
      <span class="etiqueta-fuente"
        ><TrafficCone :size="15" />
        {{
          modo === 'simulacion' ? 'SIMULACIÓN' : dispositivo.fuente === 'simulado' ? 'SIMULADOR SERIAL' : 'ARDUINO'
        }}</span
      >
    </div>
    <p class="texto-secundario">
      {{
        modo === 'simulacion'
          ? 'S1–S6 controlan H; V usa una luz virtual, sin confirmar hardware instalado.'
          : dispositivo.fuente === 'simulado'
            ? 'Datos de prueba de un dispositivo simulado, sin Arduino físico.'
            : 'Colores informados por el Arduino; S1–S6 se ubican en I1–I6 según la asignación propuesta.'
      }}
    </p>
    <div class="semaforos-grid" v-if="modo === 'simulacion'">
      <button
        v-for="(fase, indice) in fases"
        :key="fase.id"
        type="button"
        class="semaforo-item"
        :aria-label="`Seleccionar semáforo S${indice + 1}, cruce ${fase.id}`"
        @click="$emit('seleccionar', `S${indice + 1}`)"
      >
        <div>
          <span class="semaforo-icono">S{{ indice + 1 }}</span
          ><strong>{{ fase.id }}</strong>
        </div>
        <div class="fases-mini">
          <span><i :class="['mini-punto', fase.horizontal]"></i> H</span
          ><span><i :class="['mini-punto', fase.vertical]"></i> V</span>
        </div>
        <small>{{ Math.ceil(fase.restante) }} s</small>
      </button>
    </div>
    <div class="semaforos-grid" v-else>
      <button
        v-for="n in 6"
        :key="n"
        type="button"
        class="semaforo-item"
        :aria-label="`Seleccionar semáforo S${n}, cruce I${n}`"
        @click="$emit('seleccionar', `S${n}`)"
      >
        <div>
          <span class="semaforo-icono">S{{ n }}</span
          ><strong>S{{ n }}</strong>
        </div>
        <div class="fases-mini">
          <span
            ><i :class="['mini-punto', dispositivo.conectado ? dispositivo.colores[n - 1] : 'gris']"></i>
            {{ dispositivo.conectado ? dispositivo.colores[n - 1] : 'Sin dato' }}</span
          >
        </div>
      </button>
    </div>
  </section>
</template>
