# GMT 458 - Personal Web Page

This repository contains my personal web page created for the **GMT 458 - Web GIS** course (Assignment 1) at Hacettepe University.

**Student:** Hüsamettin Mert Mutlu  
**Live Website:** [https://mert0037.github.io/](https://mert0037.github.io/)

## Project Overview

I designed a dark-themed website with three separate HTML pages to introduce myself, my background in Geomatics Engineering, and the cities I have visited:

* **`index.html` (About):** My background, interests, skills, and a CSS keyframe animation.
* **`projects.html` (Work & Skills):** My education, experience, and an HTML table with images showing my internship works.
* **`maps.html` (Travel Atlas):** An interactive map page showing 7 cities I have visited in Türkiye (Ankara, İzmir, İstanbul, Antalya, Muğla, Eskişehir, and Nevşehir) using both **OpenLayers** and **Leaflet**.

## How I Solved the Map Issues

* **Issue 1 (Overlapping Markers):** To prevent markers from overlapping at smaller scales, I set a zoom threshold so they only appear when the zoom level is greater than 5. In OpenLayers, I used a resolution change listener to toggle the vector layer's visibility. In Leaflet, I used the `zoomend` event to add or remove the marker group based on the current zoom level.
* **Issue 2 (Repeating World):** To stop the map from repeating horizontally when zoomed out, I used `wrapX: false` and `multiWorld: false` in OpenLayers. For Leaflet, I added `noWrap: true` to the tile layer and restricted the map bounds with `maxBounds`.

## Research & AI Usage

While planning the structure of the website and setting up the basic pages, I first followed the course materials, and searched on Google to understand how things work.

Although I set up the overall structure and knew the logic of what I wanted to do, I got stuck on the coding side in some places—especially with JavaScript map interactions and some responsive CSS rules. In those parts, I got coding help from AI. However, instead of just copying and pasting the code, I asked the AI *"Why did you write it this way and how does this work?"* to actually learn the logic behind the code before adapting it to my project.

**Estimated Total AI Usage:**  
Around **1.5 - 2 hours** in total across the 3 days.
