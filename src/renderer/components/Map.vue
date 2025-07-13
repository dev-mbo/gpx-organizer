<script>
import {Map, View, Overlay} from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import 'ol/ol.css'

export default {
    mounted() {
        new Map({
            target: this.$refs['map'],
            layers: [
                // adding a background tiled layer
                new TileLayer({
                    source: new OSM() // tiles are served by OpenStreetMap
                }),
            ],

            // the map view will initially show the whole world
            view: new View({
                zoom: 0,
                center: [0, 0],
                constrainResolution: true
            }),
        })
    }
}
</script>

<template>
<div ref="map" style="width:100%; height: 100%;"></div>
</template>