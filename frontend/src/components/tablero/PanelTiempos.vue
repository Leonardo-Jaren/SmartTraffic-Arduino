<script setup lang="ts">
import { Clock3, Send } from '@lucide/vue'
import type { Modo, Tiempos } from '@/types/trafico'

defineProps<{
  tiempos: Tiempos
  modo: Modo
  conectado: boolean
  enviando: boolean
  fuente: 'arduino' | 'simulado'
  confirmados: Tiempos | null
  mensaje: string
  comando: { id: number; estado: string; mensaje: string } | null
}>()
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
        modo === 'simulacion' ? 'Ajustes para el entorno virtual.' : 'Se aplican solo cuando el Arduino los confirma.'
      }}
    </p>
    <div class="campos-tiempo">
      <label
        ><span><i class="mini-punto verde"></i> Vía principal <small>15–120 s</small></span>
        <div><input v-model.number="tiempos.principal" type="number" min="15" max="120" /><b>s</b></div></label
      >
      <label
        ><span><i class="mini-punto azul"></i> Vía secundaria <small>10–90 s</small></span>
        <div><input v-model.number="tiempos.secundaria" type="number" min="10" max="90" /><b>s</b></div></label
      >
      <label
        ><span><i class="mini-punto amarillo"></i> Amarillo <small>3–10 s</small></span>
        <div><input v-model.number="tiempos.amarillo" type="number" min="3" max="10" /><b>s</b></div></label
      >
      <label
        ><span><i class="mini-punto rojo"></i> Todo en rojo <small>2–10 s</small></span>
        <div><input v-model.number="tiempos.todo_rojo" type="number" min="2" max="10" /><b>s</b></div></label
      >
    </div>
    <button
      class="boton principal ancho"
      :disabled="enviando || (modo === 'dispositivo' && !conectado)"
      @click="$emit('aplicar')"
    >
      <Send :size="16" />
      {{
        modo === 'simulacion'
          ? 'Aplicar a simulación'
          : fuente === 'simulado'
            ? 'Solicitar al simulador'
            : 'Solicitar al Arduino'
      }}
    </button>
    <p v-if="mensaje" class="aviso-inline" role="status">{{ mensaje }}</p>
    <p v-if="modo === 'dispositivo' && comando" class="aviso-inline">
      Solicitud #{{ comando.id }}: {{ comando.estado }} · {{ comando.mensaje || 'Esperando confirmación' }}
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
      Rojo calculado: principal {{ tiempos.secundaria + tiempos.amarillo + 2 * tiempos.todo_rojo }} s · secundaria
      {{ tiempos.principal + tiempos.amarillo + 2 * tiempos.todo_rojo }} s.
    </p>
  </section>
</template>
