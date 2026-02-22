<script>
import {Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import GPX from 'ol/format/GPX'
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import { transform } from 'ol/proj'
import 'ol/ol.css'

export default {
    data() {
      return {
        files: {},
        selectedFile: null,
        map: null,
        gpxLayer: null,
        style: {
          'MultiLineString': new Style({
            stroke: new Stroke({
              color: 'navy',
              width: 4,
            }),
          }),
        }
      }
    },
    methods: {
      async getFiles() {
	      this.files = await gpx.getFiles();
      },
      async selectFile(dir, file) {
        this.selectedFile = dir + '/' + file;
        console.log(`select ${this.selectedFile}`);
        if (this.gpxLayer) {
          this.map.removeLayer(this.gpxLayer);
        }
        this.gpxLayer = new VectorLayer({
          source: new VectorSource({
            url: `${this.selectedFile}`,
            format: new GPX()
          }),
          style: (feature) => this.style[feature.getGeometry().getType()]                   
        });
        this.map.addLayer(this.gpxLayer);
      },
    },
    async mounted() {
      await this.getFiles();
      this.map = new Map({
        target: this.$refs['map'],
        layers: [
          new TileLayer({
            source: new OSM()
          }),
        ],
        view: new View({
          zoom: 11,
          center: transform([8.2, 50], 'EPSG:4326', 'EPSG:3857'),
          constrainResolution: true
        }),
      });
      if (Object.keys(this.files).length) {
        const dir = Object.keys(this.files)[0];
        this.selectFile(this.files[dir][0]); 
      }
    }
}
</script>

<template>
<ul v-if="files">
  <li v-for="(files, dir) in files">
    {{ dir }}
    <ul v-if="files.length">
      <li v-for="file of files">
        <a href="#" @click="selectFile(dir, file)">{{ file }}</a>
      </li>
    </ul>
  </li>
</ul>
<p v-else>no gpx tracks found in src/public/gpx</p>
<div ref="map" style="width:100%; height: 100%;"></div>
</template>
