import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchBusinesses, getPlaceDetails } from '@/lib/googlePlaces';
import { scrapeEmails } from '@/lib/scraper';

// Supabase Admin client for backend operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    // Verify Vercel Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 1. Get all active campaigns
        const { data: campaigns, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .select('*, profiles(email)')
            .eq('is_active', true);

        if (campaignError) throw campaignError;

        const results = [];

        for (const campaign of campaigns || []) {
            // 2. Fetch leads from Google Places
            const leads = await fetchBusinesses(campaign.niche, campaign.location);

            for (const lead of leads) {
                // 3. Get website/phone if missing (Places Details API)
                if (!lead.website && (lead as any).place_id) {
                    const details = await getPlaceDetails((lead as any).place_id);
                    lead.website = details.website;
                    lead.phone = details.phone;
                }

                // 4. Scrape emails if website exists
                let scrapedEmails: string[] = [];
                if (lead.website) {
                    scrapedEmails = await scrapeEmails(lead.website);
                }

                // 5. Save to database
                const { error: insertError } = await supabaseAdmin
                    .from('leads')
                    .insert({
                        user_id: campaign.user_id,
                        campaign_id: campaign.id,
                        company_name: lead.name,
                        phone: lead.phone,
                        website: lead.website,
                        address: lead.address,
                        email: scrapedEmails[0] || null // Save the first found email
                    });

                if (insertError && insertError.code !== '23505') { // Ignore unique constraint errors
                    console.error('Error saving lead:', insertError);
                }
            }
            results.push({ campaignId: campaign.id, processed: leads.length });
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
