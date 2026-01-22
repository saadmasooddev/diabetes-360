// import opencage from 'opencage-api-client';
// import dotenv from 'dotenv';
// dotenv.config();

// opencage
//   .geocode({ q: 'Amannah Mall, Model Town, Lahore' })
//   .then((data) => {
//     if (data.status.code === 200 && data.results.length > 0) {
//       const place = data.results[0];
//       console.log(place.formatted);
//       console.log(place.geometry);
//       console.log(place.annotations.timezone.name);
//     } else {
//       console.log('Status', data.status.message);
//       console.log('total_results', data.total_results);
//     }
//   })
//   .catch((error) => {
//     // console.log(JSON.stringify(error));
//     console.log('Error', error.message);
//     // other possible response codes:
//     // https://opencagedata.com/api#codes
//     if (error.status.code === 402) {
//       console.log('hit free trial daily limit');
//       console.log('become a customer: https://opencagedata.com/pricing');
//     }
//   });

// // ... prints
// // Theresienhöhe 11, 80339 Munich, Germany
// // { lat: 48.1341651, lng: 11.5464794 }
// // Europe/Berlin

// opencage
//   .geocode({ q: '31.471065, 74.272149', language: "en" })
//   .then((data) => {
//     // console.log(JSON.stringify(data));
//     if (data.status.code === 200 && data.results.length > 0) {
//       const place = data.results[0];
//       console.log(place.formatted);
//       console.log(place.components.road);
//       console.log(place.annotations.timezone.name);
//     } else {
//       console.log('status', data.status.message);
//       console.log('total_results', data.total_results);
//     }
//   })
//   .catch((error) => {
//     console.log('error', error.message);
//     if (error.status.code === 402) {
//       console.log('hit free trial daily limit');
//       console.log('become a customer: https://opencagedata.com/pricing');
//     }
//   });
// geocode-nominatim.js
import axios from "axios";

async function getCoordinates(location) {
	try {
		const response = await axios.get(
			"https://nominatim.openstreetmap.org/search",
			{
				params: {
					q: location,
					format: "json",
					addressdetails: 1,
					limit: 1,
				},
				headers: {
					"User-Agent": "MyNodeApp/1.0", // Required by Nominatim’s usage policy
				},
			},
		);

		if (response.data.length === 0) {
			console.log("Location not found");
			return null;
		}

		const place = response.data[0];
		console.log(`📍 ${place.display_name}`);
		console.log(`Latitude: ${place.lat}`);
		console.log(`Longitude: ${place.lon}`);
		return { lat: place.lat, lon: place.lon };
	} catch (err) {
		console.error("Error fetching location:", err.message);
	}
}

// Example usage
getCoordinates("Amannah Mall, Model Town, Lahore, Pakistan");
