import { MESSAGE_TYPE } from '../../../shared/constants/app';
import createTracingMiddleware from './createTracingMiddleware';

const REQUEST_MOCK = {
  id: 'testId',
  method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const RESPONSE_MOCK = {};
const NEXT_MOCK = jest.fn();

describe('createTracingMiddleware', () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: any;

  beforeEach(() => {
    jest.resetAllMocks();

    request = { ...REQUEST_MOCK };

    globalThis.sentry = {
      withIsolationScope: jest.fn().mockReturnValue({}),
    };
  });

  it('adds trace context to request if method is send transaction', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeDefined();
  });

  it('does not add trace context to request if method not supported', async () => {
    request.method = 'unsupportedMethod';

    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeUndefined();
  });

  it('calls next', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(NEXT_MOCK).toHaveBeenCalledTimes(1);
  });
});
