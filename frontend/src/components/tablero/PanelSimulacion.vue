<script setup lang="ts">
import { CarFront, Pause, Play, RotateCcw, SlidersHorizontal } from '@lucide/vue'

defineProps<{ deshabilitado: boolean; detenidos: number; actuales: number }>()
defineEmits<{ reiniciar: []; limite: [valor: number] }>()
const activo = defineModel<boolean>('activo', { required: true })
const mostrar = defineModel<boolean>('mostrar', { required: true })
const cantidad = defineModel<number>('cantidad', { required: true })
const velocidad = defineModel<number>('velocidad', { required: true })
const maximo = defineModel<number>('maximo', { required: true })
</script>

<template>
  <section class="panel simulacion-panel" id="simulacion">
    <div class="panel-cabecera">
      <div>
        <div class="eyebrow">ENTORNO VIRTUAL</div>
        <h2>Control de simulación</h2>
      </div>
      <SlidersHorizontal :size="19" class="icono-tenue" />
    </div>
    <div class="simulacion-contenido" :class="{ atenuado: deshabilitado }">
      <div class="acciones-sim">
        <button class="boton principal" :disabled="deshabilitado" @click="activo = !activo">
          <Pause v-if="activo" :size="16" /><Play v-else :size="16" /> {{ activo ? 'Pausar' : 'Iniciar' }}
        </button>
        <button class="boton secundario" :disabled="deshabilitado" @click="$emit('reiniciar')">
          <RotateCcw :size="16" /> Reiniciar
        </button>
      </div>
      <div class="sim-divider"></div>
      <label class="switch-line"
        ><span><CarFront :size="17" /> Vehículos</span
        ><input v-model="mostrar" type="checkbox" :disabled="deshabilitado" /><i></i
      ></label>
      <div class="control-rango">
        <div class="control-label">
          <span>Velocidad</span><strong>{{ velocidad }} <small>km/h</small></strong>
        </div>
        <input
          v-model.number="velocidad"
          type="range"
          min="10"
          :max="maximo"
          step="1"
          :disabled="deshabilitado"
          aria-label="Velocidad de vehículos"
        />
        <div class="extremos">
          <span>10 km/h</span><span>{{ maximo }} km/h</span>
        </div>
      </div>
      <div class="control-rango">
        <div class="control-label">
          <span>Cantidad objetivo</span><strong>{{ mostrar ? cantidad : 0 }} <small>vehículos</small></strong>
        </div>
        <input
          v-model.number="cantidad"
          type="range"
          min="0"
          max="24"
          step="1"
          :disabled="deshabilitado || !mostrar"
          aria-label="Cantidad de vehículos"
        />
        <div class="extremos"><span>0</span><span>24</span></div>
      </div>
      <div class="sim-pie">
        <span>{{ mostrar ? actuales : 0 }} activos · {{ mostrar ? detenidos : 0 }} detenidos</span
        ><label
          >Máximo
          <input
            v-model.number="maximo"
            type="number"
            min="20"
            max="120"
            :disabled="deshabilitado"
            @change="$emit('limite', maximo)"
          />
          km/h</label
        >
      </div>
    </div>
  </section>
</template>
