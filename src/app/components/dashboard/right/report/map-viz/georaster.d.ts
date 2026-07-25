declare module 'georaster' {
  export default function parseGeoRaster(input: unknown): Promise<unknown>;
}

declare module 'georaster-layer-for-leaflet' {
  import * as L from 'leaflet';

  export interface GeoRasterLayerOptions extends L.LayerOptions {
    georaster: unknown;
    opacity?: number;
    pixelValuesToColorFn?: (values: number[]) => string | null;
    resolution?: number;
    debugLevel?: number;
  }

  export default class GeoRasterLayer extends L.Layer {
    constructor(options: GeoRasterLayerOptions);
    getBounds(): L.LatLngBounds;
    getValueAt(lat: number, lng: number): number[] | null;
  }
}
