import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { LocationMarker } from './LocationMarker';
import { LocationPopup } from './LocationPopup';
import { getEnvironmentVariable } from '../../lib/api';
import type { Location } from '../../types';

declare global {
  interface Window {
    atlas: typeof atlas;
  }
}

interface LocationMapProps {
  locations: Location[];
  selectedLocationId?: string;
  onLocationSelect?: (locationId: string) => void;
}

export function LocationMap({ locations, selectedLocationId, onLocationSelect }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [dataSource, setDataSource] = useState<atlas.source.DataSource | null>(null);
  const [symbolLayer, setSymbolLayer] = useState<atlas.layer.SymbolLayer | null>(null);
  const [activePopup, setActivePopup] = useState<atlas.Popup | null>(null);
  const [bounds, setBounds] = useState<atlas.data.BoundingBox | null>(null);
  const [clusterSource, setClusterSource] = useState<atlas.source.DataSource | null>(null);
  const [clusterLayer, setClusterLayer] = useState<atlas.layer.BubbleLayer | null>(null);
  const [clusterLabelLayer, setClusterLabelLayer] = useState<atlas.layer.SymbolLayer | null>(null);

  const { data: azureMapsKey } = useQuery({
    queryKey: ['azureMapsKey'],
    queryFn: () => getEnvironmentVariable('AZURE_MAPS_KEY')
  });

  // Initialize map
  useEffect(() => {
    if (!azureMapsKey || !mapRef.current || !window.atlas) return;

    const map = new window.atlas.Map(mapRef.current, {
      authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: azureMapsKey
      },
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
      style: 'road_dark',
      language: 'en-US'
    });

    map.events.add('ready', () => {
      // Create data source
      const source = new window.atlas.source.DataSource();
      map.sources.add(source);

      // Create clustering data source
      const cluster = new window.atlas.source.DataSource(null, {
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 45
      });
      map.sources.add(cluster);
      
      // Create symbol layer
      const layer = new window.atlas.layer.SymbolLayer(source, null, {
        iconOptions: {
          allowOverlap: true,
          anchor: 'center',
          size: 1
        }
      });
      map.layers.add(layer);
      
      // Create cluster bubble layer
      const bubbleLayer = new window.atlas.layer.BubbleLayer(cluster, null, {
        radius: [
          'step',
          ['get', 'point_count'],
          20,    // Size 20 pixels for point_count = 1
          5,     // Size 20 pixels until point_count = 5
          30,    // Size 30 pixels for point_count >= 5
          10,    // Size 30 pixels until point_count = 10
          40     // Size 40 pixels for point_count >= 10
        ],
        color: [
          'case',
          ['has', 'isSelected'],
          'rgba(59, 130, 246, 0.8)',  // Selected color (primary)
          'rgba(107, 114, 128, 0.8)'  // Default color (gray)
        ],
        strokeWidth: 0,
        filter: ['has', 'point_count']
      });
      map.layers.add(bubbleLayer);

      // Create cluster label layer
      const labelLayer = new window.atlas.layer.SymbolLayer(cluster, null, {
        iconOptions: {
          image: 'none'
        },
        textOptions: {
          textField: ['get', 'point_count_abbreviated'],
          offset: [0, 0.4],
          color: '#ffffff',
          font: ['StandardFont-Bold'],
          size: 12
        },
        filter: ['has', 'point_count']
      });
      map.layers.add(labelLayer);

      // Add mouse events for hover effects
      map.events.add('mouseover', layer, (e) => {
        if (e.shapes && e.shapes[0]) {
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.events.add('mouseout', layer, () => {
        map.getCanvas().style.cursor = 'grab';
      });
      
      // Add click event for clusters
      map.events.add('click', bubbleLayer, (e) => {
        const feature = e.shapes[0];
        const clusterId = feature.getProperties().cluster_id;
        
        // Get cluster expansion zoom
        cluster.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.setCamera({
            center: feature.getProperties().geometry.coordinates,
            zoom: zoom,
            type: 'ease',
            duration: 1000
          });
        });
      });

      setDataSource(source);
      setSymbolLayer(layer);
      setClusterSource(cluster);
      setClusterLayer(bubbleLayer);
      setClusterLabelLayer(labelLayer);
      setIsMapReady(true);
    });

    mapInstanceRef.current = map;

    return () => {
      map.dispose();
      mapInstanceRef.current = null;
      setDataSource(null);
      setSymbolLayer(null);
      setClusterSource(null);
      setClusterLayer(null);
      setClusterLabelLayer(null);
      setIsMapReady(false);
    };
  }, [azureMapsKey]);

  // Add location points
  useEffect(() => {
    if (!isMapReady || !dataSource || !symbolLayer || !clusterSource || !mapInstanceRef.current) return;

    // Initialize bounds
    let mapBounds: atlas.data.BoundingBox | null = null;

    // Clear existing data
    dataSource.clear();
    clusterSource.clear();

    // Close any open popup
    if (activePopup) {
      activePopup.close();
      setActivePopup(null);
    }

    // Add points for each location
    locations.forEach(location => {
      if (!location.longitude || !location.latitude) return;
      const lon = parseFloat(location.longitude);
      const lat = parseFloat(location.latitude);

      // Validate coordinates
      if (isNaN(lon) || isNaN(lat) || 
          lon < -180 || lon > 180 || 
          lat < -90 || lat > 90) {
        console.warn('Invalid coordinates for location:', location);
        return;
      }

      const coordinates = [lon, lat];
      
      // Update bounds to include this point
      if (!mapBounds) {
        mapBounds = new window.atlas.data.BoundingBox(coordinates, coordinates);
      } else {
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        
        // Create new bounds with updated coordinates
        mapBounds = new window.atlas.data.BoundingBox(
          [Math.min(sw[0], lon), Math.min(sw[1], lat)],
          [Math.max(ne[0], lon), Math.max(ne[1], lat)]
        );
      }

      // Create popup
      const popup = new window.atlas.Popup({
        content: LocationPopup({ location }),
        pixelOffset: [0, -20],
        closeButton: false
      });

      // Add point to data source
      const point = new window.atlas.data.Feature(
        new window.atlas.data.Point(coordinates),
        {
          id: location.id,
          name: location.name,
          icon: LocationMarker({
            criticality: location.criticality,
            selected: location.id === selectedLocationId
          }),
          coordinates,
          selected: location.id === selectedLocationId,
          criticality: location.criticality
        }
      );
      dataSource.add(point);
      clusterSource.add(point);
    });

    // Add click event for all markers
    mapInstanceRef.current!.events.add('click', symbolLayer, (e: any) => {
      if (e.shapes && e.shapes[0]) {
        const properties = e.shapes[0].getProperties();
        const popup = new window.atlas.Popup({
          content: LocationPopup({ location: locations.find(l => l.id === properties.id)! }),
          pixelOffset: [0, -20],
          closeButton: false
        });
        
        setActivePopup(popup);
        popup.open(mapInstanceRef.current!);
        popup.setOptions({ position: properties.coordinates });
        onLocationSelect?.(properties.id);
      }
    });

    // Add hover effect for clusters
    mapInstanceRef.current!.events.add('mouseover', clusterLayer, () => {
      mapInstanceRef.current!.getCanvas().style.cursor = 'pointer';
    });

    mapInstanceRef.current!.events.add('mouseout', clusterLayer, () => {
      mapInstanceRef.current!.getCanvas().style.cursor = 'grab';
    });

    // Fit map to show all locations
    if (mapBounds && locations.filter(l => l.longitude && l.latitude).length > 0) {
      mapInstanceRef.current!.setCamera({
        bounds: mapBounds,
        padding: 50,
        type: 'ease'
      });
    }
  }, [isMapReady, locations, onLocationSelect, dataSource, symbolLayer, clusterSource]);

  // Handle selected location
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !selectedLocationId) return;

    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    if (!selectedLocation?.longitude || !selectedLocation?.latitude) return;

    mapInstanceRef.current.setCamera({
      center: [parseFloat(selectedLocation.longitude), parseFloat(selectedLocation.latitude)],
      zoom: 12,
      type: 'ease',
      duration: 1000
    });
  }, [isMapReady, selectedLocationId, locations]);

  if (!azureMapsKey) {
    return (
      <div className="w-full h-[400px] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 
                    flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
          <MapPin className="h-8 w-8 mb-2" />
          <p>Azure Maps integration is currently disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef}
      className="w-full h-[400px] rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
    />
  );
}