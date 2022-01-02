export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGVzdGV2ZXoiLCJhIjoiY2t3eHltNWVqMGlnMjJudXJnM2oyZ3J0dCJ9.GF6Pwkqgi9MZ1OTA-Jp3zA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/destevez/ckwxz4z49047t15s4fuuky1ga',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Creates Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Adds the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map)

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map)

    //Extends the map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding:
    {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
}
