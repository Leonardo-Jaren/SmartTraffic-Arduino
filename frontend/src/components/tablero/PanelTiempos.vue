<script setup lang="ts">
import { computed } from 'vue'
import { Clock3, Send } from '@lucide/vue'
import type { Modo, Tiempos } from '@/types/trafico'
import { MIN_VERDE_DISPOSITIVO } from '@/composables/simulacion/luces'

const props = defineProps<{
  tiempos: Tiempos
  modo: Modo
  conectado: boolean
  enviando: boolean
  fuente: 'arduino' | 'simulado'
  confirmados: Tiempos | null
  mensaje: string
  comando: { id: number; estado: string; mensaje: string } | null
}>()

const esperandoConfirmacion = computed(
  () => props.modo === 'dispositivo' && ['PENDIENTE', 'ENVIADO'].includes(props.comando?.estado ?? ''),
)
const cargando = computed(() => props.enviando || esperandoConfirmacion.value)

defineEmits<{ aplicar: [] }>()
</script>

<template>
  <section class="panel tiempos-panel" id="tiempos">
    <div class="panel-cabecera">
      <div>
        <div class="eyebrow">CONFIGURACIÓN</div>
        <h2>Tiempos de paso</h2>
      </div>
      <Clock3 :size="19" class="icono-tenue" />
    </div>
    <p class="texto-secundario">
      {{
        modo === 'simulacion'
          ? 'En Simulación, los tiempos solo afectan la animación. Selecciona Dispositivo para enviarlos al Arduino.'
          : 'Se aplican cuando el Arduino los confirma. En estado BLOQUEADO las luces seguirán rojas.'
      }}
    </p>
    <div class="campos-tiempo">
      <label
        ><span
          ><i class="mini-punto verde"></i> Vía principal
          <small>{{ modo === 'simulacion' ? 6 : MIN_VERDE_DISPOSITIVO }}–120 s</small></span
        >
        <div>
          <input v-model.number="tiempos.principal" type="number" :min="modo === 'simulacion' ? 6 : MIN_VERDE_DISPOSITIVO" max="120" /><b
            >s</b
          >
        </div></label
      >
      <label
        ><span
          ><i class="mini-punto azul"></i> Vía secundaria <small>{{ modo === 'simulacion' ? 4 : MIN_VERDE_DISPOSITIVO }}–90 s</small></span
        >
        <div>
          <input v-model.number="tiempos.secundaria" type="number" :min="modo === 'simulacion' ? 4 : MIN_VERDE_DISPOSITIVO" max="90" /><b
            >s</b
          >
        </div></label
      >
      <label
        ><span
          ><i class="mini-punto amarillo"></i> Amarillo <small>{{ modo === 'simulacion' ? 1 : 3 }}–10 s</small></span
        >
        <div>
          <input v-model.number="tiempos.amarillo" type="number" :min="modo === 'simulacion' ? 1 : 3" max="10" /><b
            >s</b
          >
        </div></label
      >
      <label
        ><span
          ><i class="mini-punto rojo"></i> Todo en rojo <small>{{ modo === 'simulacion' ? 1 : 2 }}–10 s</small></span
        >
        <div>
          <input v-model.number="tiempos.todo_rojo" type="number" :min="modo === 'simulacion' ? 1 : 2" max="10" /><b
            >s</b
          >
        </div></label
      >
    </div>
    <button
      type="button"
      class="boton principal ancho"
      :disabled="cargando || (modo === 'dispositivo' && !conectado)"
      @click="$emit('aplicar')"
    >
      <span v-if="cargando" class="spinner-carga" aria-hidden="true"></span>
      <Send v-else :size="16" />
      <span>{{
        cargando
          ? esperandoConfirmacion
            ? 'Esperando confirmación…'
            : 'Enviando…'
          : modo === 'simulacion'
            ? 'Aplicar a simulación'
            : fuente === 'simulado'
              ? 'Solicitar al simulador'
              : 'Solicitar al Arduino'
      }}</span>
    </button>
    <p v-if="modo === 'dispositivo' && !conectado" class="aviso-inline" role="status">
      No se puede enviar: el panel necesita un reporte reciente del Arduino.
    </p>
    <p v-if="mensaje" class="aviso-inline" role="status">{{ mensaje }}</p>
    <p v-if="modo === 'dispositivo' && comando" class="aviso-inline">
      Última solicitud #{{ comando.id }}: {{ comando.estado }} · {{ comando.mensaje || 'Esperando confirmación' }}
    </p>
    <p v-if="modo === 'dispositivo'" class="nota-panel">
      {{
        confirmados
          ? `Confirmados: principal ${confirmados.principal} s, secundaria ${confirmados.secundaria} s, amarillo ${confirmados.amarillo} s y todo rojo ${confirmados.todo_rojo} s.`
          : 'Aún no hay tiempos confirmados por el dispositivo.'
      }}
    </p>
    <p class="nota-panel">
      La principal debe tener más tiempo que la secundaria. El tráfico simulado no cambia automáticamente el Arduino.
    </p>
    <p class="nota-panel">
      Rojo calculado con los valores del formulario: principal {{ tiempos.secundaria + tiempos.amarillo + 2 * tiempos.todo_rojo }} s · secundaria
      {{ tiempos.principal + tiempos.amarillo + 2 * tiempos.todo_rojo }} s.
    </p>
  </section>
</template>

<style scoped>
.spinner-carga {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: panel-tiempos-girar 0.75s linear infinite;
}

@keyframes panel-tiempos-girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
