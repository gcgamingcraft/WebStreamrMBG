import { createTestContext } from '../test';
import { FetcherMock, ImdbId } from '../utils';
import { MegaKino } from './MegaKino';

const ctx = createTestContext({ de: 'on' });

describe('MegaKino', () => {
  let source: MegaKino;

  beforeEach(() => {
    source = new MegaKino(new FetcherMock(`${__dirname}/__fixtures__/MegaKino`));
  });

  test('handles non-existent movies gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt12345678', undefined, undefined));
    expect(streams).toHaveLength(0);
  });

  test('handle imdb baymax', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt2245084', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });

  test('lego movie 2014', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt1490017', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });

  test('lego movie 2 2019', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt3513498', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('handles edge case iframes gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt9876543', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('handles missing cookie gracefully', async () => {
    const nocookieSource = new MegaKino(new FetcherMock(`${__dirname}/__fixtures__/MegaKino-nocookie`));
    const streams = await nocookieSource.handle(ctx, 'movie', new ImdbId('tt0000001', undefined, undefined));
    expect(streams).toHaveLength(0);
  });
});
