import { createTestContext } from '../test';
import { FetcherMock, ImdbId, TmdbId } from '../utils';
import { FilmpalastTO } from './FilmpalastTO';

const ctx = createTestContext({ de: 'on' });

describe('FilmpalastTO', () => {
  let source: FilmpalastTO;

  beforeEach(() => {
    source = new FilmpalastTO(new FetcherMock(`${__dirname}/__fixtures__/FilmpalastTO`));
  });

  test('handles non-existent movies gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt12345678', undefined, undefined));
    expect(streams).toHaveLength(0);
  });

  test('handles non-imdb id gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new TmdbId(123456, undefined, undefined));
    expect(streams).toHaveLength(0);
  });

  test('handles fetch error gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt9999999', undefined, undefined));
    expect(streams).toHaveLength(0);
  });

  test('handle the matrix', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt0133093', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('handles direct stream page', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt1111111', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('handles absolute stream href and relative hoster url', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt2222222', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
});
