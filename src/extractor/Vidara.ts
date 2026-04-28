import { Context, Format, InternalUrlResult, Meta } from '../types';
import { guessHeightFromPlaylist } from '../utils';
import { Extractor } from './Extractor';

interface VidaraStreamResponse {
  streaming_url: string;
  title?: string;
  subtitles?: { file_path: string; language: string }[];
}

export class Vidara extends Extractor {
  public readonly id = 'vidara';

  public readonly label = 'Vidara';

  public override readonly ttl: number = 21600000; // 6h

  public supports(_ctx: Context, url: URL): boolean {
    return null !== url.host.match(/vidara/);
  }

  protected async extractInternal(ctx: Context, url: URL, meta: Meta): Promise<InternalUrlResult[]> {
    const filecode = url.pathname.split('/').filter(Boolean).pop();

    if (!filecode) {
      throw new Error('Could not extract filecode from Vidara URL');
    }

    const apiUrl = new URL('/api/stream', url.origin);
    const responseBody = await this.fetcher.textPost(
      ctx,
      apiUrl,
      JSON.stringify({ filecode, device: 'web' }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    const data = JSON.parse(responseBody) as VidaraStreamResponse;

    if (!data.streaming_url) {
      throw new Error('No streaming_url in Vidara API response');
    }

    const m3u8Url = new URL(data.streaming_url);
    const headers = { Origin: url.origin };

    return [
      {
        url: m3u8Url,
        format: Format.hls,
        meta: {
          ...meta,
          height: meta.height ?? await guessHeightFromPlaylist(ctx, this.fetcher, m3u8Url, { headers }),
          title: data.title,
        },
        requestHeaders: headers,
      },
    ];
  }
}
