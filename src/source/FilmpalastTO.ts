import * as cheerio from 'cheerio';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode } from '../types';
import { Fetcher, Id } from '../utils';
import { Source, SourceResult } from './Source';

export class FilmpalastTO extends Source {
  public constructor(private readonly fetcher: Fetcher) {
    super();
  }

  public override readonly id = 'filmpalast';
  public override readonly label = 'Filmpalast';
  public override readonly baseUrl = 'https://filmpalast.to';

  public override readonly contentTypes: ContentType[] = ['movie' as ContentType, 'series' as ContentType];
  public override readonly countryCodes = [CountryCode.de];
  public override readonly priority = 1;

  // Fix: _ctx mit Unterstrich, um den TS6133 Fehler (unused variable) zu beheben
  protected override async handleInternal(ctx: Context, _type: ContentType, id: Id): Promise<SourceResult[]> {
    const results: SourceResult[] = [];
    const imdbId = id.toString();

    console.log(`[Filmpalast] Suche gestartet für ID: ${imdbId}`);

    if (!imdbId.startsWith('tt')) {
      console.log(`[Filmpalast] Abbruch: Keine gültige IMDb-ID (${imdbId})`);
      return [];
    }

    const searchUrl = `${this.baseUrl}/search/title/${encodeURIComponent(imdbId)}`;

    try {
      const html = await this.fetcher.text(ctx, new URL(searchUrl));

      const $ = cheerio.load(html);

      let streamPageUrl: string | undefined;
      const streamAnchor = $('a[href*="/stream/"]').first();

      if (streamAnchor.length > 0) {
        const href = streamAnchor.attr('href') as string;
        streamPageUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        console.log(`[Filmpalast] Stream-Seite gefunden: ${streamPageUrl}`);
      } else if (html.includes('currentStreamLinks')) {
        streamPageUrl = searchUrl;
        console.log(`[Filmpalast] Direkt auf Stream-Seite gelandet.`);
      }

      if (!streamPageUrl) {
        console.log(`[Filmpalast] Kein Stream-Link auf Suchseite gefunden.`);
        return [];
      }

      const streamHtml = await this.fetcher.text(ctx, new URL(streamPageUrl));
      const $stream = cheerio.load(streamHtml);

      $stream('.currentStreamLinks a').each((_, element) => {
        const href = $stream(element).attr('href');
        const hosterName = $stream(element).text().trim();

        if (href && href !== '#' && !href.includes('javascript:void')) {
          const fullUrl = href.startsWith('http') ? href : `https:${href}`;

          results.push({
            url: new URL(fullUrl),
            meta: {
              title: `${hosterName} (Filmpalast)`,
              countryCodes: [CountryCode.de],
            },
          });
        }
      });

      console.log(`[Filmpalast] Suche beendet. ${results.length} Links gefunden.`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`[Filmpalast] Fehler während des Scraping: ${error.message}`);
    }

    return results;
  }
}
