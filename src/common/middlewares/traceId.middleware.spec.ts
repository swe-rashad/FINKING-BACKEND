import { Request, Response, NextFunction } from 'express';
import { TraceIdMiddleware } from '@/common/middlewares/traceId.middleware';

describe('TraceIdMiddleware', () => {
  let middleware: TraceIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new TraceIdMiddleware();
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a traceId, attach it to req, set X-Trace-Id header and call next()', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    const traceId = mockRequest['traceId'];
    expect(traceId).toBeDefined();
    expect(typeof traceId).toBe('string');
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Trace-Id', traceId);
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });
});
