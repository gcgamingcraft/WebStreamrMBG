import bytes from 'bytes';
import * as cheerio from 'cheerio';
import { Context, Format, InternalUrlResult, Meta } from '../types';
import { findCountryCodes, findHeight } from '../utils';
import { Extractor } from './Extractor';

export class HubCloud extends Extractor {
  public readonly id = 'hubcloud';

  public readonly label = 'HubCloud';

  public override readonly cacheVersion = 6;

  public supports(_ctx: Context, url: URL): boolean {
    return null !== url.host.match(/hubcloud/);
  }

  protected async extractInternal(ctx: Context, url: URL, meta: Meta): Promise<InternalUrlResult[]> {
    const headers = { Referer: meta.referer ?? url.href };

    const redirectHtml = await this.fetcher.text(ctx, url, { headers });
    const redirectUrl = this.extractRedirectUrl(redirectHtml);
    if (!redirectUrl) {
      return [];
    }

    const linksHtml = await this.fetcher.text(ctx, new URL(redirectUrl), { headers: { Referer: url.href } });
    const $ = cheerio.load(linksHtml);

    const title = $('title').text().trim();
    const countryCodes = [...new Set([...meta.countryCodes ?? [], ...findCountryCodes(title)])];
    const height = meta.height ?? findHeight(title);
    const fileSize = bytes.parse($('#size').text()) as number;

    const fslTtl = (href: string): number => {
      void href;
      return 900000; // 15 min
    };

    return Promise.all([
      ...$('a')
        .filter((_i, el) => {
          const text = $(el).text();
          return text.includes('FSL') && !text.includes('FSLv2');
        })
        .map((_i, el) => {
          const fslHref = ($(el).attr('href') as string) + '1' + new Date(Date.now()).getMinutes();
          return {
            url: new URL(fslHref),
            format: Format.unknown,
            ttl: fslTtl(fslHref),
            label: `${this.label} (FSL)`,
            meta: { ...meta, bytes: fileSize, extractorId: `${this.id}_fsl`, countryCodes, height, title },
          };
        }).toArray(),
      ...$('a')
        .filter((_i, el) => $(el).text().includes('FSLv2'))
        .map((_i, el) => {
          const fslHref = ($(el).attr('href') as string) + '_1' + new Date(Date.now()).getMinutes();
          return {
            url: new URL(fslHref),
            format: Format.unknown,
            ttl: fslTtl(fslHref),
            label: `${this.label} (FSLv2)`,
            meta: { ...meta, bytes: fileSize, extractorId: `${this.id}_fslv2`, countryCodes, height, title },
          };
        }).toArray(),
      ...await Promise.all($('a')
        .filter((_i, el) => $(el).text().includes('PixelServer'))
        .map((_i, el) => {
          const userUrl = new URL(($(el).attr('href') as string).replace('/api/file/', '/u/'));
          const url = new URL(userUrl.href.replace('/u/', '/api/file/'));
          url.searchParams.set('download', '');
          return { url, userUrl };
        }).toArray()
        .map(async ({ url, userUrl }) => {
          try {
            await this.fetcher.head(ctx, url, { headers: { Referer: userUrl.href } });
          } catch {
            return null;
          }
          return {
            url,
            format: Format.unknown,
            label: `${this.label} (PixelServer)`,
            meta: { ...meta, bytes: fileSize, extractorId: `${this.id}_pixelserver`, countryCodes, height, title },
            requestHeaders: { Referer: userUrl.href },
          };
        }),
      ).then(results => results.filter(r => r !== null)),
    ]);
  };

  private extractRedirectUrl(html: string): string | null {
    // Pattern 1: var url = 'https://...'
    const varUrlMatch = html.match(/var url ?= ?'(.*?)'/);
    if (varUrlMatch) {
      return varUrlMatch[1] as string;
    }

    // Pattern 2: window.location = 'https://...' or window.location.href = 'https://...'
    const locationMatch = html.match(/window\.location(?:\.href)? ?= ?['"](.*?)['"]/);
    if (locationMatch) {
      return locationMatch[1] as string;
    }

    return null;
  }
}
