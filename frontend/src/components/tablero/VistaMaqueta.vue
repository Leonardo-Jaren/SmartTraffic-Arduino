<script setup lang="ts">
import { ref } from 'vue'
import type {
  EstadoDispositivo,
  FaseCruce,
  LuzVirtual,
  Modo,
  Seleccion,
  Vehiculo,
  UbicacionSemaforo,
} from '@/types/trafico'
import { useEscena3D } from '@/composables/useEscena3D'

const props = defineProps<{
  vehiculos: Vehiculo[]
  fases: FaseCruce[]
  cierres: Set<string>
  seleccion: Seleccion | null
  virtuales: LuzVirtual[]
  modo: Modo
  mostrarVehiculos: boolean
  dispositivo: EstadoDispositivo
  ubicaciones: UbicacionSemaforo[]
  desactivados?: Set<string>
}>()
const emit = defineEmits<{ seleccionar: [valor: Seleccion] }>()
const contenedor = ref<HTMLElement | null>(null)
const { error, calidad, vistaGeneral, vistaSuperior } = useEscena3D(
  contenedor,
  () => props,
  (valor) => emit('seleccionar', valor),
)
</script>

<template>
  <div class="mapa-viewport">
    <div ref="contenedor" class="escena-3d" aria-label="Maqueta 3D con calles y cruces seleccionables"></div>
    <div v-if="error" class="error-3d" role="alert">{{ error }}</div>
    <div class="mapa-etiqueta"><span class="brujula">3D</span><span>MAQUETA · 160 × 120 CM</span></div>
    <div class="herramientas-3d" aria-label="Controles de la vista 3D">
      <button type="button" @click="vistaGeneral">Vista general</button>
      <button type="button" @click="vistaSuperior">Desde arriba</button>
      <label
        >Calidad
        <select v-model="calidad">
          <option value="equilibrada">Equilibrada</option>
          <option value="detalle">Máximo detalle</option>
          <option value="fluida">Ahorro de recursos</option>
        </select></label
      >
    </div>
    <div class="mapa-ayuda">
      Arrastra para girar <span>·</span> Rueda para acercar <span>·</span> Clic para seleccionar
    </div>
    <div class="mapa-leyenda">
      <span><i class="punto verde"></i> Luz verde</span><span><i class="punto rojo"></i> Luz roja</span
      ><span><i class="punto cierre"></i> Calle cerrada</span>
    </div>
  </div>
</template>

<style scoped>
.herramientas-3d {
  position: absolute;
  bottom: 54px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  pointer-events: none;
}
.herramientas-3d button,
.herramientas-3d label {
  pointer-events: auto;
  border: 1px solid #c9d5dd;
  background: #f8fbfdf2;
  color: #304c5d;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  box-shadow: 0 3px 12px #243f5210;
}
.herramientas-3d button {
  cursor: pointer;
}
.herramientas-3d button:hover {
  background: #e2edf4;
}
.herramientas-3d select {
  color: inherit;
  background: transparent;
  margin-left: 6px;
  max-width: 145px;
}
.herramientas-3d :is(button, select):focus-visible {
  outline: 2px solid #147a9b;
  outline-offset: 3px;
}
@media (max-width: 500px) {
  .herramientas-3d {
    bottom: 44px;
    left: 6px;
    right: 6px;
    gap: 4px;
  }
  .herramientas-3d button,
  .herramientas-3d label {
    padding: 6px;
    font-size: 10px;
  }
  .herramientas-3d select {
    max-width: 110px;
  }
}
</style>
