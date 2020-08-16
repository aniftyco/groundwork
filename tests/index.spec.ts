import { Groundwork } from './../src';

const mockedGet = jest.fn();

jest.mock('https', () => {
  const get = (...args: any[]) => {
    mockedGet(...args);

    return {
      on: () => {
        //
      },
    };
  };

  return { get };
});

describe('groundwork', () => {
  it('should fetch a tarball', async () => {
    const groundwork = new Groundwork('foo/bar', '/tmp');

    await groundwork.fetch();
  });
});
