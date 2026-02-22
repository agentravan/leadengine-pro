import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function scrapeEmails(url: string) {
    const emails = new Set<string>();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    try {
        const { data } = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const text = $('body').text();
        text.match(emailRegex)?.forEach(e => emails.add(e.toLowerCase()));
    } catch (e) { }

    return Array.from(emails);
}

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 1. Get all active users with keys and active status
        const { data: users, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('id, google_api_key')
            .eq('status', 'active')
            .not('google_api_key', 'is', null);

        if (userError) throw userError;

        for (const user of users) {
            // 2. Get active campaigns for this user
            const { data: campaigns } = await supabaseAdmin
                .from('campaigns')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true);

            for (const campaign of campaigns || []) {
                // 3. Fetch from Google Places using CLIENT'S KEY
                const query = `${campaign.niche} in ${campaign.location}`;
                const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${user.google_api_key}`;
                const { data: searchResults } = await axios.get(searchUrl);

                for (const place of (searchResults.results || []).slice(0, 25)) {
                    // 4. Details fetch
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${user.google_api_key}`;
                    const { data: detailResults } = await axios.get(detailsUrl);

                    const website = detailResults.result?.website;
                    let email = null;

                    if (website) {
                        const scraped = await scrapeEmails(website);
                        email = scraped[0] || null;
                    }

                    // 5. Save lead
                    await supabaseAdmin.from('leads').upsert({
                        user_id: user.id,
                        campaign_id: campaign.id,
                        company_name: place.name,
                        phone: detailResults.result?.formatted_phone_number || null,
                        website: website || null,
                        address: place.formatted_address || null,
                        email: email
                    }, { onConflict: 'campaign_id, website' });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('CRON ERROR:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
