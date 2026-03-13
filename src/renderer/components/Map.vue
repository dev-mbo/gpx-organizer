<script>
import {Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import OSM from 'ol/source/OSM';
import GPX from 'ol/format/GPX';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import { transform } from 'ol/proj';
import 'ol/ol.css';

export default {
    data() {
      return {
        gpxFiles: {},
        selectedFile: null,
        track: false,
        map: null,
        gpxLayer: null,
      }
    },
    methods: {
      async getFiles() {
	      this.gpxFiles = await gpx.getFiles();
      },
      async selectFile(dir, file) {
        console.log(`select ${this.selectedFile}`);
        this.selectedFile = dir + '/' + file;
        this.track = await gpx.getTrack(this.selectedFile);
        if (this.gpxLayer) {
          this.map.removeLayer(this.gpxLayer);
        }
        const route = new Feature({
          type: 'route',
          geometry: new LineString(this.track.points).transform('EPSG:4326', 'EPSG:3857')
        });
        route.setStyle(new Style({
          stroke: new Stroke({
            color: 'navy',
            width: 4,
          })
        }));
        const source = new VectorSource({
          features: [
            route
          ],
        });
        this.gpxLayer = new VectorLayer({
          source
        });
        this.map.addLayer(this.gpxLayer);
        this.map.getView().fit(route.getGeometry().getExtent(), { minResolution: 10 });
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
      for (const dir in this.gpxFiles.list) {
        if (this.gpxFiles.list[dir].length) {
          this.selectFile(dir, this.gpxFiles.list[dir][0]);
          break;
        }
      }
    }
}
</script>

<template>
<div ref="map" class="map"></div>
<div class="sidebar">
  <div v-if="track">
    <h2>{{ track.name }}</h2>
    <table>
      <tbody>
        <tr>
          <th scope="row">Distance:</th>
          <td>{{ track.distance }}</td>
        </tr>
        <tr>
          <th scope="row">Elevation:</th>
          <td>{{ track.elevation }}</td>
        </tr>
        <tr>
          <th scope="row">Duration:</th>
          <td>{{ track.duration }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div>
    <h2>Gpx files:</h2>
    <ul v-if="selectedFile">
      <li v-for="(files, dir) in gpxFiles.list">
        <b>{{ dir }}</b>
        <ul v-if="files.length">
          <li v-for="file of files">
            <a href="#" @click="selectFile(dir, file)">{{ file }}</a>
          </li>
        </ul>
        <br/>
      </li>
    </ul>
    <p v-else>no gpx tracks found in {{ gpxFiles['gpxDir'] }}</p>
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
