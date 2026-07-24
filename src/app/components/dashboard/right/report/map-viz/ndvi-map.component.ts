import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import parseGeoRaster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import chroma from 'chroma-js';

@Component({
  selector: 'app-ndvi-map',
  standalone: true,
  template: `
    <div class="map-container">
      <div #mapElement class="map"></div>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 100vh;
      position: relative;
    }
    .map {
      width: 100%;
      height: 100%;
    }
  `]
})
export class NdviMapComponent implements AfterViewInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  
  private map!: L.Map;

  private cogUrl = 'rasters/bc_ndvi_july2026_full.tif';

  ngAfterViewInit(): void {
    this.initMap();
    this.loadNdviCog();
  }

  private initMap(): void {
    // Initialize base Leaflet map centered over Southern British Columbia
    this.map = L.map(this.mapElement.nativeElement, {
      center: [49.7, -121.0],
      zoom: 8
    });

    // Add OpenStreetMap dark/light basemap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.map);
  }

  private async loadNdviCog(): Promise<void> {
    try {
      // 1. Fetch GeoTIFF binary metadata via HTTP Range Requests
      const georaster = await parseGeoRaster(this.cogUrl);

      // 2. Define YlGn (Yellow to Dark Green) color ramp for NDVI [-1.0 to 1.0]
      const colorScale = chroma.scale(['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#31a354', '#006837'])
        .domain([0, 0.8]); // Map 0.0 (bare soil) -> 0.8 (dense crop canopy)

      // 3. Create interactive GeoRaster layer
      const layer = new GeoRasterLayer({
        georaster: georaster,
        opacity: 0.8,
        pixelValuesToColorFn: (values: number[]) => {
          const ndvi = values[0];

          // Hide invalid, NaN, or non-vegetation background pixels
          if (isNaN(ndvi) || ndvi === null || ndvi < 0.05) {
            return null;
          }

          // Return color hex string corresponding to NDVI index
          return colorScale(ndvi).hex();
        },
        resolution: 256 // Dynamic tile rendering resolution
      });

      // 4. Add layer to map and fit view bounds to the raster footprint
      layer.addTo(this.map);
      this.map.fitBounds(layer.getBounds());

      // 5. Add interactive hover tooltip displaying exact pixel NDVI
      this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
        const value = layer.getValueAt(e.latlng.lat, e.latlng.lng);
        if (value && value[0] !== null && !isNaN(value[0])) {
          const ndviVal = value[0].toFixed(3);
          L.popup()
            .setLatLng(e.latlng)
            .setContent(`<b>NDVI Value:</b> ${ndviVal}`)
            .openOn(this.map);
        }
      });

    } catch (error) {
      console.error('Failed to load Cloud-Optimized GeoTIFF:', error);
    }
  }
}