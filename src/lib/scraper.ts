import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extracts email addresses from a given URL.
 * Checks the homepage and common /contact pages.
 */
export async function scrapeEmails(url: string): Promise<string[]> {
    const emails = new Set<string>();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    async function fetchAndExtract(targetUrl: string) {
        try {
            const { data } = await axios.get(targetUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            const text = $('body').text();
            const matches = text.match(emailRegex);
            if (matches) {
                matches.forEach(email => emails.add(email.toLowerCase()));
            }
        } catch (error) {
            console.error(`Error scraping ${targetUrl}:`, error instanceof Error ? error.message : error);
        }
    }

    // Scrape homepage
    await fetchAndExtract(url);

    // If no emails found, try common contact paths
    if (emails.size === 0) {
        const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const contactPaths = ['/contact', '/contact-us', '/about'];

        for (const path of contactPaths) {
            if (emails.size > 0) break;
            await fetchAndExtract(`${baseUrl}${path}`);
        }
    }

    return Array.from(emails);
}
