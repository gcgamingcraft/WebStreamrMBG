import * as cheerio from 'cheerio';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode } from '../types';
import { Fetcher, getImdbId, Id } from '../utils';
import { Source, SourceResult } from './Source';

export class MeineCloud extends Source {
  public readonly id = 'meinecloud';
  public readonly label = 'MeineCloud';
  public readonly contentTypes: ContentType[] = ['movie'];
  public readonly countryCodes: CountryCode[] = [CountryCode.de];
  public readonly baseUrl = 'https://meinecloud.click';

  private readonly fetcher: Fetcher;

  public constructor(fetcher: Fetcher) {
    super();
    this.fetcher = fetcher;
  }

  public async handleInternal(ctx: Context, _type: string, id: Id): Promise<SourceResult[]> {
    const imdbId = await getImdbId(ctx, this.fetcher, id);
    const pageUrl = new URL(`/movie/${imdbId.id}`, this.baseUrl);

    try {
      // IMPORTANT: Pass the URL object directly (not .toString())
      const html = await this.fetcher.text(ctx, pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://meinecloud.click/',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Dest': 'document',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(html);

      const results: SourceResult[] = [];

      $('[data-link!=""]').each((_i, el) => {
        let link = $(el).attr('data-link')?.trim();
        if (!link) return;

        if (link.startsWith('//')) {
          link = 'https:' + link;
        } else if (!link.startsWith('http')) {
          link = 'https://' + link;
        }

        try {
          const url = new URL(link);

          // Skip internal links
          if (url.host.includes('meinecloud')) {
            return;
          }

          results.push({
            url: url, // Must be URL object
            meta: {
              countryCodes: [CountryCode.de],
              referer: this.baseUrl,
            },
          });
        } catch {
          // invalid URL, skip
        }
      });

      return results;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`[MeineCloud] Error fetching ${pageUrl.href}:`, error.message || error);
      return [];
    }
  }
}
