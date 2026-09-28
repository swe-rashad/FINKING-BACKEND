import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from 'crypto';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const traceId = randomUUID();
        req['traceId'] = traceId;
        res.setHeader('X-Trace-Id', traceId);
        next();
    }
}