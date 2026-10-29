# Recursos de la guía visual

El PDF que se entrega está en `docs/GUIA_VISUAL_CONEXIONES_ARDUINO.pdf`.

- `imagenes/*.png`: imágenes incrustadas en el PDF.
- `imagenes/*.svg`: fuentes vectoriales editables de los esquemas y diagramas.
- `portada_maqueta.png`: ilustración generada a partir de las fotos de la maqueta; solo ilustra el conjunto y no representa el cableado.
- `generar_imagenes.py`, `estilos.py`, `pdf_estilo.py`, `paginas_*.py` y `generar_pdf.py`: fuentes que producen las láminas y el PDF.

Los esquemas eléctricos se dibujaron con etiquetas y rutas fijas, y se contrastaron con `arduino/SmartTraffic/SmartTraffic.ino` y `docs/ELECTRONICA.md`. Para recrear el PDF se requieren Python, Matplotlib, ReportLab y la fuente DejaVu Sans disponible en la ruta que usa `pdf_estilo.py`.
