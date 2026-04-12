import { createTestContext } from '../test';
import { Fetcher, FetcherMock, ImdbId } from '../utils';
import { MeineCloud } from './MeineCloud';
const ctx = createTestContext({ de: 'on' });
describe('MeineCloud', () => {
  let source: MeineCloud;
  beforeEach(() => {
    source = new MeineCloud(new FetcherMock(`${__dirname}/__fixtures__/MeineCloud`));
  });
  test('handles non-existent movies gracefully', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt12345678', undefined, undefined));
    expect(streams).toHaveLength(0);
  });
  test('handle imdb the devil\'s bath', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt29141112', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('handles bare domain link', async () => {
    const streams = await source.handle(ctx, 'movie', new ImdbId('tt11111111', undefined, undefined));
    expect(streams).toMatchSnapshot();
  });
  test('returns empty array on fetch error', async () => {
    const throwingFetcher = {
      text: async () => {
        throw new Error('network error');
      },
    } as unknown as Fetcher;
    const errorSource = new MeineCloud(throwingFetcher);
    const streams = await errorSource.handle(ctx, 'movie', new ImdbId('tt00000001', undefined, undefined));
    expect(streams).toHaveLength(0);
  });
});
