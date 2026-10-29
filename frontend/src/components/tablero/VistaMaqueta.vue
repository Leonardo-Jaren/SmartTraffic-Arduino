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
}>()
const emit = defineEmits<{ seleccionar: [valor: Seleccion] }>()
const contenedor = ref<HTMLElement | null>(null)
const { error } = useEscena3D(
  contenedor,
  () => props,
  (valor) => emit('seleccionar', valor),
)
</script>

<template>
  <div class="mapa-viewport">
    <div ref="contenedor" class="escena-3d" aria-label="Maqueta 3D con calles y cruces seleccionables"></div>
    <div v-if="error" class="error-3d" role="alert">{{ error }}</div>
    <div class="mapa-etiqueta"><span class="brujula">3D</span><span>MAQUETA · VISTA 3D</span></div>
    <div class="mapa-ayuda">
      Arrastra para girar <span>·</span> Rueda para acercar <span>·</span> Clic para seleccionar
    </div>
    <div class="mapa-leyenda">
      <span><i class="punto verde"></i> Vía libre</span><span><i class="punto rojo"></i> Detener</span
      ><span><i class="punto cierre"></i> Cerrada</span>
    </div>
  </div>
</template>
