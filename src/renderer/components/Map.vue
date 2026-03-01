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
        gpxFiles: {},
        selectedFile: null,
        metadata: false,
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
      async getMetadata(file) {
        this.metadata = await gpx.getMetadata(file);
        console.log(this.metadata);
      },
      async getFiles() {
	      this.gpxFiles = await gpx.getFiles();
      },
      async selectFile(dir, file) {
        this.selectedFile = dir + '/' + file;
        console.log(`select ${this.selectedFile}`);
        if (this.gpxLayer) {
          this.map.removeLayer(this.gpxLayer);
        }
        this.gpxLayer = new VectorLayer({
          source: new VectorSource({
            url: this.selectedFile,
            format: new GPX()
          }),
          style: (feature) => this.style[feature.getGeometry().getType()]                   
        });
        this.map.addLayer(this.gpxLayer);
        await this.getMetadata(this.selectedFile);
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
      // select first file found 
      if (Object.keys(this.gpxFiles).length) {
        const dir = Object.keys(this.gpxFiles)[0];
        this.selectFile(dir, this.gpxFiles[dir][0]); 
      }
    }
}
</script>

<template>
<div ref="map" class="map"></div>
<div class="sidebar">
  <div v-if="metadata">
    <h2>{{ metadata.name }}</h2>
    <table>
      <tbody>
        <tr>
          <th scope="row">Distance:</th>
          <td>{{ metadata.distance }}</td>
        </tr>
        <tr>
          <th scope="row">Elevation:</th>
          <td>{{ metadata.elevation }}</td>
        </tr>
        <tr>
          <th scope="row">Duration:</th>
          <td>{{ metadata.duration }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div>
    <h2>Gpx files:</h2>
    <ul v-if="gpxFiles">
      <li v-for="(files, dir) in gpxFiles">
        <b>{{ dir }}</b>
        <ul v-if="files.length">
          <li v-for="file of files">
            <a href="#" @click="selectFile(dir, file)">{{ file }}</a>
          </li>
        </ul>
        <br/>
      </li>
    </ul>
    <p v-else>no gpx tracks found in src/public/gpx</p>
  </div>
  </div>
</template>
<style>
.map {
  float: left;
  width: 60%;
  height: 100%;
}
.sidebar {
  float: left;
  width: 35%;
  margin-left: 10px;
}
table {
  table-layout: fixed;
  border: none;
  text-align: left;
}
ul {
  list-style-type: square;
  margin: 0;
  padding: 0;
}
</style>
