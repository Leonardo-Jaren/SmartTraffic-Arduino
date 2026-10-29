<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import {
  Activity,
  ArrowUpRight,
  Blocks,
  CircleHelp,
  Compass,
  Map,
  Maximize2,
  Minimize2,
  Radio,
  Route,
  ShieldCheck,
  WifiOff,
} from '@lucide/vue'
import PanelSimulacion from '@/components/tablero/PanelSimulacion.vue'
import PanelTiempos from '@/components/tablero/PanelTiempos.vue'
import PanelSeleccion from '@/components/tablero/PanelSeleccion.vue'
import PanelSemaforos from '@/components/tablero/PanelSemaforos.vue'
import { useTablero } from '@/composables/useTablero'
import { usePantallaCompleta } from '@/composables/usePantallaCompleta'

const VistaMaqueta = defineAsyncComponent(() => import('@/components/tablero/VistaMaqueta.vue'))

const {
  simulacion,
  disposicion,
  dispositivo,
  modo,
  seleccion,
  ejeNuevo,
  borrador,
  mensaje,
  descripcionSeleccion,
  listaCierres,
  impactos,
  aplicarTiempos,
  agregarLuzSeleccionada,
  quitarLuzSeleccionada,
  cambiarSeleccion,
} = useTablero()
const { ubicaciones, ubicacionSeleccionada, aviso: avisoUbicacion } = disposicion
const {
  activo,
  mostrarVehiculos,
  cantidad,
  velocidad,
  limiteVelocidad,
  tiempo,
  cierres,
  vehiculos,
  fases,
  lucesVirtuales,
  detenidos,
  metrosPorUnidad,
  velocidadOla,
} = simulacion
const { estado, error: errorApi, enviando } = dispositivo
const { contenedor, pantallaCompleta, abrirPantallaCompleta, cerrarPantallaCompleta } = usePantallaCompleta()
</script>

<template>
  <div ref="contenedor" class="aplicacion" :class="{ 'vista-inmersiva': pantallaCompleta }">
    <aside class="barra-lateral">
      <div class="marca">
        <span class="marca-icono"><Blocks :size="19" /></span>
        <div><strong>SmartTraffic</strong><small>CONTROL DE TRÁFICO</small></div>
      </div>
      <div class="menu-titulo">ESPACIO DE TRABAJO</div>
      <nav class="navegacion">
        <a class="activo" href="#inicio"><Activity :size="18" /> Vista general <span></span></a
        ><a href="#maqueta"><Map :size="18" /> Maqueta 3D</a><a href="#simulacion"><Route :size="18" /> Simulación</a
        ><a href="#tiempos"><Radio :size="18" /> Semáforos</a>
      </nav>
      <div class="lateral-inferior">
        <div class="lateral-ayuda">
          <CircleHelp :size="18" />
          <div><strong>¿Cómo funciona?</strong><span>Selecciona un tramo o cruce sobre la maqueta.</span></div>
        </div>
        <div class="lateral-version"><span class="punto verde"></span> Entorno de desarrollo <small>v0.1</small></div>
      </div>
    </aside>
    <div class="espacio">
      <header class="barra-superior">
        <div class="migas">SmartTraffic <span>/</span> <strong>Vista general</strong></div>
        <div class="barra-estado">
          <span class="estado-conexion" :class="{ conectado: estado.conectado }"
            ><i></i
            >{{
              estado.conectado
                ? estado.fuente === 'simulado'
                  ? 'Simulador serial conectado'
                  : 'Arduino conectado'
                : 'Arduino desconectado'
            }}</span
          ><span class="avatar">ST</span>
        </div>
      </header>
      <main class="contenido" id="inicio">
        <div class="titulo-pagina">
          <div>
            <div class="eyebrow">CENTRO DE CONTROL <span> / </span> MAQUETA INTELIGENTE</div>
            <h1>Vista general<span>.</span></h1>
            <p>Monitorea la maqueta y explora el flujo de las vías.</p>
          </div>
          <div class="selector-modo" aria-label="Fuente de información">
            <button :class="{ elegido: modo === 'simulacion' }" @click="modo = 'simulacion'">Simulación</button
            ><button :class="{ elegido: modo === 'dispositivo' }" @click="modo = 'dispositivo'">Dispositivo</button>
          </div>
        </div>
        <div v-if="modo === 'dispositivo' && !estado.conectado" class="alerta">
          <WifiOff :size="18" />
          <div>
            <strong>Arduino sin conexión.</strong>
            {{
              errorApi ||
              estado.error ||
              'Conecta el dispositivo y ejecuta el puente USB en la computadora donde corre Django.'
            }}
            Los colores anteriores no se muestran.
          </div>
        </div>
        <div v-else-if="modo === 'dispositivo' && estado.modo === 'BLOQUEADO'" class="alerta">
          <ShieldCheck :size="18" />
          <div>
            <strong>Dispositivo en rojo de seguridad.</strong> Comprueba el cableado de los semáforos antes de activar
            el ciclo.
          </div>
        </div>
        <div v-else-if="modo === 'dispositivo' && estado.modo === 'PRUEBA'" class="alerta">
          <ShieldCheck :size="18" />
          <div>
            <strong>Prueba manual de LED activa.</strong> Los colores mostrados provienen del dispositivo durante el
            diagnóstico.
          </div>
        </div>
        <div class="resumen-grid">
          <div class="resumen">
            <span class="resumen-icono menta"><Compass :size="18" /></span>
            <div>
              <small>INTERSECCIONES</small><strong>06 <em>cruces</em></strong>
            </div>
            <ArrowUpRight :size="15" class="resumen-flecha" />
          </div>
          <div class="resumen">
            <span class="resumen-icono azul"><Route :size="18" /></span>
            <div>
              <small>VÍAS PRINCIPALES</small><strong>02 <em>horizontales</em></strong>
            </div>
            <ArrowUpRight :size="15" class="resumen-flecha" />
          </div>
          <div class="resumen">
            <span class="resumen-icono ambar"><Activity :size="18" /></span>
            <div>
              <small>ESTADO VIRTUAL</small
              ><strong
                >{{ modo === 'dispositivo' ? 'Pausado' : activo ? 'Activo' : 'Pausado' }}
                <em>· {{ Math.floor(tiempo) }} s</em></strong
              >
            </div>
            <span class="punto" :class="modo === 'simulacion' && activo ? 'verde' : 'gris'"></span>
          </div>
        </div>
        <div class="contenido-grid">
          <div class="columna-principal">
            <section class="panel mapa-panel" id="maqueta">
              <div class="mapa-cabecera">
                <div>
                  <div class="eyebrow">OBSERVA Y EXPLORA</div>
                  <h2>Maqueta interactiva <span class="tag-3d">3D</span></h2>
                  <p>Selecciona una calle para cerrarla o un cruce para añadir una luz virtual.</p>
                </div>
                <div class="acciones-mapa">
                  <span class="badge-mapa"
                    ><i class="punto verde"></i>{{ modo === 'simulacion' ? 'SIMULACIÓN' : 'SOLO DISPOSITIVO' }}</span
                  ><button
                    v-if="!pantallaCompleta"
                    class="boton secundario boton-pantalla"
                    @click="abrirPantallaCompleta"
                  >
                    <Maximize2 :size="16" /> Pantalla completa
                  </button>
                  <button v-else class="boton secundario boton-pantalla" @click="cerrarPantallaCompleta">
                    <Minimize2 :size="16" /> Salir de pantalla completa
                  </button>
                </div>
              </div>
              <div v-if="pantallaCompleta" class="inmersiva-barra">
                <div class="selector-modo" aria-label="Fuente de información en pantalla completa">
                  <button :class="{ elegido: modo === 'simulacion' }" @click="modo = 'simulacion'">Simulación</button>
                  <button :class="{ elegido: modo === 'dispositivo' }" @click="modo = 'dispositivo'">
                    Dispositivo
                  </button>
                </div>
                <span class="estado-conexion" :class="{ conectado: estado.conectado }" role="status">
                  <i></i
                  >{{
                    estado.conectado
                      ? estado.fuente === 'simulado'
                        ? 'Simulador serial conectado'
                        : estado.modo === 'BLOQUEADO'
                          ? 'Arduino conectado · rojo de seguridad'
                          : 'Arduino conectado'
                      : 'Arduino desconectado'
                  }}
                </span>
              </div>
              <VistaMaqueta
                :vehiculos="vehiculos"
                :fases="fases"
                :cierres="cierres"
                :seleccion="seleccion"
                :virtuales="lucesVirtuales"
                :modo="modo"
                :mostrar-vehiculos="mostrarVehiculos"
                :dispositivo="estado"
                :ubicaciones="ubicaciones"
                @seleccionar="cambiarSeleccion"
              />
              <div class="mapa-pie">
                <span>H1 ← &nbsp; H2 → &nbsp; · &nbsp; V1 ↑ &nbsp; V2 ↓ &nbsp; V3 ↑</span
                ><span>Escala virtual: 1 unidad = {{ metrosPorUnidad }} m</span>
              </div>
            </section>
            <PanelSemaforos
              :fases="fases"
              :modo="modo"
              :dispositivo="estado"
              @seleccionar="cambiarSeleccion({ tipo: 'semaforo', id: $event })"
            />
          </div>
          <div class="columna-control">
            <PanelSimulacion
              v-model:activo="activo"
              v-model:mostrar="mostrarVehiculos"
              v-model:cantidad="cantidad"
              v-model:velocidad="velocidad"
              v-model:maximo="limiteVelocidad"
              :deshabilitado="modo === 'dispositivo'"
              :detenidos="detenidos"
              :actuales="vehiculos.length"
              @reiniciar="simulacion.reiniciar"
              @limite="simulacion.cambiarLimite"
            />
            <PanelSeleccion
              v-model:eje="ejeNuevo"
              :seleccion="seleccion"
              :descripcion="descripcionSeleccion"
              :cerrada="!!seleccion && cierres.has(seleccion.id)"
              :modo="modo"
              :cierres="listaCierres"
              :impactos="impactos"
              :detenidos="detenidos"
              :cantidad-luces="lucesVirtuales.filter((luz) => luz.cruce === seleccion?.id).length"
              :ubicacion="ubicacionSeleccionada"
              :aviso-ubicacion="avisoUbicacion"
              @reubicar="disposicion.reubicar"
              @girar="disposicion.girar"
              @restaurar="disposicion.restaurar"
              @cierre="seleccion && simulacion.alternarCierre(seleccion.id)"
              @agregar="agregarLuzSeleccionada"
              @quitar="quitarLuzSeleccionada"
            />
            <PanelTiempos
              :tiempos="borrador"
              :modo="modo"
              :conectado="estado.conectado"
              :enviando="enviando"
              :fuente="estado.fuente"
              :confirmados="estado.tiempos_confirmados"
              :mensaje="mensaje"
              :comando="estado.ultimo_comando"
              @aplicar="aplicarTiempos"
            />
            <div class="nota-escala">
              <ShieldCheck :size="18" /><span
                >Coordinación virtual a {{ velocidadOla }} km/h. La escala y la ola verde física requieren mediciones de
                la maqueta.</span
              >
            </div>
          </div>
        </div>
        <footer>SMARTTRAFFIC <span>·</span> Información de simulación y dispositivo identificada por separado.</footer>
      </main>
    </div>
  </div>
</template>
