import axios from 'axios';

export interface BusinessLead {
    name: string;
    phone?: string;
    website?: string;
    address?: string;
}

export async function fetchBusinesses(niche: string, location: string): Promise<BusinessLead[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const query = `${niche} in ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const results = response.data.results || [];

        // Limit to 25 leads as per project requirements
        return results.slice(0, 25).map((place: any) => ({
            name: place.name,
            phone: place.formatted_phone_number, // Note: textsearch might not return phone/website by default
            website: place.website,
            address: place.formatted_address,
            place_id: place.place_id
        }));
    } catch (error) {
        console.error('Error fetching from Google Places:', error);
        return [];
    }
}

/**
 * Fetches additional details (like website) for a place if not present in search results.
 */
export async function getPlaceDetails(placeId: string): Promise<{ website?: string; phone?: string }> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        return {
            website: response.data.result?.website,
            phone: response.data.result?.formatted_phone_number
        };
    } catch (error) {
        console.error('Error fetching place details:', error);
        return {};
    }
}
