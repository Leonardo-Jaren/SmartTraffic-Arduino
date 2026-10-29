<script setup lang="ts">
import { CirclePlus, MapPin, X } from '@lucide/vue'
import type { Eje, Modo, Seleccion, Esquina, UbicacionSemaforo } from '@/types/trafico'

defineProps<{
  seleccion: Seleccion | null
  descripcion: string
  detalle: string
  cerrada: boolean
  modo: Modo
  cierres: { id: string; nombre: string }[]
  impactos: { ruta: string; estado: string }[]
  detenidos: number
  cantidadLuces: number
  ubicacion: UbicacionSemaforo | null
  avisoUbicacion: string
}>()
defineEmits<{ cierre: []; agregar: []; quitar: []; reubicar: [esquina: Esquina]; girar: []; restaurar: [] }>()
const eje = defineModel<Eje>('eje', { required: true })
</script>

<template>
  <section class="panel seleccion-panel" id="seleccion">
    <div class="panel-cabecera">
      <div>
        <div class="eyebrow">INTERACCIÓN</div>
        <h2>Elemento seleccionado</h2>
      </div>
      <MapPin :size="19" class="icono-tenue" />
    </div>
    <div class="seleccion-item">
      <span class="seleccion-icono"><MapPin :size="17" /></span>
      <div>
        <strong>{{ descripcion }}</strong
        ><small>{{ detalle }}</small>
      </div>
    </div>
    <div v-if="seleccion?.tipo === 'semaforo' && ubicacion" class="editor-ubicacion">
      <label class="select-label"
        >Esquina del cruce (vista de arriba)
        <select
          :value="ubicacion.esquina"
          aria-label="Esquina del semáforo"
          @change="$emit('reubicar', ($event.target as HTMLSelectElement).value as Esquina)"
        >
          <option value="NO">Superior izquierda</option>
          <option value="NE">Superior derecha</option>
          <option value="SO">Inferior izquierda</option>
          <option value="SE">Inferior derecha</option>
        </select>
      </label>
      <button class="boton secundario ancho" @click="$emit('girar')">Girar 90° · {{ ubicacion.giro }}°</button>
      <button class="boton secundario ancho" style="margin-top: 8px" @click="$emit('restaurar')">
        Restaurar distribución inicial
      </button>
      <p class="nota-panel">
        Se guarda en este navegador. Cambia la posición y el giro visual; conserva el cruce, la vía controlada y los
        pines del Arduino.
      </p>
      <p v-if="avisoUbicacion" class="aviso-inline">{{ avisoUbicacion }}</p>
    </div>
    <template v-if="seleccion?.tipo === 'tramo'">
      <button class="boton secundario ancho" :disabled="modo !== 'simulacion'" @click="$emit('cierre')">
        {{ cerrada ? 'Volver a abrir tramo' : 'Cerrar este tramo' }}
      </button>
    </template>
    <template v-if="seleccion?.tipo === 'cruce'">
      <label class="select-label"
        >Agregar semáforo virtual<select v-model="eje" :disabled="modo !== 'simulacion'">
          <option value="horizontal">Vía horizontal</option>
          <option value="vertical">Vía vertical</option>
        </select></label
      >
      <button class="boton secundario ancho" :disabled="modo !== 'simulacion'" @click="$emit('agregar')">
        <CirclePlus :size="16" /> Agregar al cruce
      </button>
      <p class="nota-panel">Luces virtuales añadidas a este cruce: {{ cantidadLuces }}.</p>
    </template>
    <template v-if="seleccion?.tipo === 'luz'"
      ><button class="boton secundario ancho" :disabled="modo !== 'simulacion'" @click="$emit('quitar')">
        <X :size="16" /> Quitar semáforo virtual
      </button></template
    >
    <div class="cierres-lista">
      <div class="subtitulo">
        TRAMOS CERRADOS <span>{{ cierres.length }}</span>
      </div>
      <p v-if="!cierres.length">Sin cierres activos</p>
      <ul v-else>
        <li v-for="cierre in cierres" :key="cierre.id"><i class="mini-punto rojo"></i>{{ cierre.nombre }}</li>
      </ul>
      <template v-if="cierres.length"
        ><small>{{ impactos.length }} recorridos afectados · {{ detenidos }} vehículos detenidos.</small>
        <ul>
          <li v-for="impacto in impactos.slice(0, 4)" :key="impacto.ruta">{{ impacto.ruta }}: {{ impacto.estado }}</li>
        </ul></template
      >
    </div>
  </section>
</template>
