/// <reference types="@types/google.maps" />

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  ControlPosition,
  Map,
  MapControl,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';

import { Combobox } from 'react-widgets';
import 'react-widgets/styles.css';

interface LocationData {
  locationName: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude: string;
  longitude: string;
  status?: 'active' | 'inactive';
}

interface GoogleMapsLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  apiKey?: string;
}


export function GoogleMapsLocationPicker({
  onLocationSelect,
  initialLocation,
  apiKey
}: GoogleMapsLocationPickerProps) {

  const getInitialCenter = () => {
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      return {
        lat: parseFloat(initialLocation.latitude),
        lng: parseFloat(initialLocation.longitude)
      };
    }
    return { lat: 22.54992, lng: 0 };
  };

  const getInitialZoom = () => {
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      return 15;
    }
    return 3;
  };

  const [latlong, setLatlong] = useState<{ lat: number; lng: number }>(getInitialCenter());
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);

  // Update latlong when initialLocation changes
  useEffect(() => {
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      setLatlong({
        lat: parseFloat(initialLocation.latitude),
        lng: parseFloat(initialLocation.longitude)
      });
    }
  }, [initialLocation]);

  const incompatibleVersionLoaded = Boolean(
    typeof window !== 'undefined' &&
    (window as any).google?.maps?.version &&
    !(
      (window as any).google?.maps?.version.endsWith('-alpha') ||
      (window as any).google?.maps?.version.endsWith('-beta')
    )
  );

  if (incompatibleVersionLoaded) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return null;
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
        <p className="text-gray-500">Google Maps API key is required</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <APIProvider apiKey={apiKey} version="beta">
        <Map
          onClick={(e) => {
            if (e.detail.latLng) {
              setLatlong({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
            }
          }}
          mapId={
            typeof window !== 'undefined' &&
              (window as any).google?.maps?.Map?.DEMO_MAP_ID
              ? (window as any).google.maps.Map.DEMO_MAP_ID
              : "233"
          }
          defaultZoom={getInitialZoom()}
          defaultCenter={getInitialCenter()}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}>
          <AutocompleteControl
            coords={latlong}
            controlPosition={ControlPosition.TOP_LEFT}
            onPlaceSelect={setSelectedPlace}
            onLocationSelect={onLocationSelect}
          />

          {/* Show marker for initial location if no place is selected */}
          {!selectedPlace && initialLocation && initialLocation.latitude && initialLocation.longitude && (
            <AdvancedMarker
              position={{
                lat: parseFloat(initialLocation.latitude),
                lng: parseFloat(initialLocation.longitude)
              }}
            >
              <Pin />
            </AdvancedMarker>
          )}

          <AutocompleteResult place={selectedPlace} />
        </Map>
      </APIProvider>
    </div>
  );
}

type CustomAutocompleteControlProps = {
  controlPosition: ControlPosition;
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
  onLocationSelect: (location: LocationData) => void;
  coords: google.maps.LatLngLiteral;
};

const AutocompleteControl = ({
  controlPosition,
  onPlaceSelect,
  onLocationSelect,
  coords,
}: CustomAutocompleteControlProps) => {
  return (
    <MapControl position={controlPosition}>
      <div className="autocomplete-control">
        <AutocompleteCustomHybrid
          coords={coords}
          onPlaceSelect={onPlaceSelect}
          onLocationSelect={onLocationSelect}
        />
      </div>
    </MapControl>
  );
};


interface AutocompleteCustomHybridProps {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
  onLocationSelect: (location: LocationData) => void;
  coords: google.maps.LatLngLiteral;
}

export const AutocompleteCustomHybrid = ({ onPlaceSelect, onLocationSelect, coords }: AutocompleteCustomHybridProps) => {
  const [inputValue, setInputValue] = useState<string>('');
  const isInitialGeocodeRef = useRef(true);

  const { suggestions, resetSession, isLoading } =
    useAutocompleteSuggestions(inputValue);

  const handleInputChange = useCallback(
    (value: google.maps.places.PlacePrediction | string) => {
      if (typeof value === 'string') {
        setInputValue(value);
      }
    },
    []
  );
  const geocodingLibrary = useMapsLibrary('geocoding');

  useEffect(() => {
    if (!geocodingLibrary) {
      return;
    }

    // Only geocode if coords are valid (not 0,0)
    if (coords.lat === 0 && coords.lng === 0) {
      return;
    }

    const geocoder = new geocodingLibrary.Geocoder();

    geocoder.geocode(
      { location: coords },
      (
        results: google.maps.GeocoderResult[] | null,
        status: google.maps.GeocoderStatus
      ) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          setInputValue(result.formatted_address);

          const addressComponents = result.address_components || [];
          const getComponent = (type: string) => {
            const component = addressComponents.find(ac => ac.types.includes(type));
            return component?.long_name || '';
          };

          if (!isInitialGeocodeRef.current) {
            onLocationSelect({
              locationName: result.formatted_address,
              address: result.formatted_address,
              city: getComponent('locality') || getComponent('administrative_area_level_2'),
              state: getComponent('administrative_area_level_1'),
              country: getComponent('country'),
              postalCode: getComponent('postal_code'),
              latitude: result.geometry.location.lat().toString(),
              longitude: result.geometry.location.lng().toString(),
              status: 'active',
            });
          } else {
            isInitialGeocodeRef.current = false;
          }
        }
        // Geocoder error handled silently
      }
    );
  }, [geocodingLibrary, coords.lat, coords.lng, onLocationSelect]);

  const handleSelect = useCallback(
    (prediction: google.maps.places.PlacePrediction | string) => {
      if (typeof prediction === 'string') return;

      const place = prediction.toPlace();
      place
        .fetchFields({
          fields: [
            'viewport',
            'location',
            'svgIconMaskURI',
            'iconBackgroundColor',
            'formattedAddress',
            'addressComponents'
          ]
        })
        .then(() => {
          resetSession();
          onPlaceSelect(place);
          setInputValue('');

          // Extract location data from place
          if (place.location) {
            const getComponent = (type: string) => {
              const component = place.addressComponents?.find(ac => ac.types.includes(type));
              return component?.longText || '';
            };

            onLocationSelect({
              locationName: place.displayName || place.formattedAddress || 'Selected Location',
              address: place.formattedAddress || '',
              city: getComponent('locality') || getComponent('administrative_area_level_2'),
              state: getComponent('administrative_area_level_1'),
              country: getComponent('country'),
              postalCode: getComponent('postal_code'),
              latitude: place.location.lat().toString(),
              longitude: place.location.lng().toString(),
              status: 'active',
            });
          }
        });
    },
    [onPlaceSelect, onLocationSelect, resetSession]
  );

  const predictions = useMemo(
    () =>
      suggestions
        .filter(suggestion => suggestion.placePrediction)
        .map(({ placePrediction }) => placePrediction!),
    [suggestions]
  );

  return (
    <div className="autocomplete-container">
      <Combobox
        placeholder="Search for a place"
        data={predictions}
        dataKey="placeId"
        textField="text"
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        busy={isLoading}
        // Since the Autocomplete Service API already returns filtered results
        // always want to display them all.
        filter={() => true}
        focusFirstItem={true}
        hideEmptyPopup
        hideCaret
      />
    </div>
  );
};


export type UseAutocompleteSuggestionsReturn = {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  resetSession: () => void;
  placesLib: google.maps.PlacesLibrary | null;
};

/**
 * A reusable hook that retrieves autocomplete suggestions from the Google Places API.
 * The data is loaded from the new Autocomplete Data API.
 * (https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
 *
 * @param inputString The input string for which to fetch autocomplete suggestions.
 * @param requestOptions Additional options for the autocomplete request
 *   (See {@link https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest}).
 *
 * @returns An object containing the autocomplete suggestions, the current loading-status,
 *   and a function to reset the session.
 *
 * @example
 * ```jsx
 * const MyComponent = () => {
 *   const [input, setInput] = useState('');
 *   const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(input, {
 *     includedPrimaryTypes: ['restaurant']
 *   });
 *
 *   return (
 *     <div>
 *       <input value={input} onChange={(e) => setInput(e.target.value)} />
 *       <ul>
 *         {suggestions.map(({placePrediction}) => (
 *           <li key={placePrediction.placeId}>{placePrediction.text.text}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutocompleteSuggestions(
  inputString: string,
  requestOptions: Partial<google.maps.places.AutocompleteRequest> = {}
): UseAutocompleteSuggestionsReturn {
  const placesLib = useMapsLibrary("places");

  // stores the current sessionToken
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // the suggestions based on the specified input
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);

  // indicates if there is currently an incomplete request to the places API
  const [isLoading, setIsLoading] = useState(false);

  // once the PlacesLibrary is loaded and whenever the input changes, a query
  // is sent to the Autocomplete Data API.
  useEffect(() => {
    if (!placesLib) return;

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;

    // Create a new session if one doesn't already exist. This has to be reset
    // after `fetchFields` for one of the returned places is called by calling
    // the `resetSession` function returned from this hook.
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      ...requestOptions,
      input: inputString,
      sessionToken: sessionTokenRef.current,
    };

    if (inputString === "") {
      if (suggestions.length > 0) setSuggestions([]);
      return;
    }

    setIsLoading(true);
    AutocompleteSuggestion.fetchAutocompleteSuggestions(request).then(
      (res) => {
        setSuggestions(res.suggestions);
        setIsLoading(false);
      }
    );
  }, [placesLib, inputString, requestOptions]);

  return {
    suggestions,
    isLoading,
    resetSession: () => {
      sessionTokenRef.current = null as google.maps.places.AutocompleteSessionToken | null;
      setSuggestions([]);
    },
    placesLib,
  };
}

interface AutocompleteResultProps {
  place: google.maps.places.Place | null;
}

const AutocompleteResult = ({ place }: AutocompleteResultProps) => {
  const map = useMap();

  // adjust the viewport of the map when the place is changed
  useEffect(() => {
    if (!map || !place) return;
    if (place.viewport) map.fitBounds(place.viewport);
  }, [map, place]);

  if (!place) return null;

  // add a marker for the selected place
  return (
    <AdvancedMarker position={place.location}>
      <Pin
        background={place.iconBackgroundColor}
        glyph={place.svgIconMaskURI ? new URL(place.svgIconMaskURI) : null}
      />
    </AdvancedMarker>
  );
};

export default React.memo(AutocompleteResult);
