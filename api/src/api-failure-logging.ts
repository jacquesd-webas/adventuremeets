import { ArgumentsHost, Catch, HttpException, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, RequestHandler, Response } from "express";

type FailureResponse = Response & {
  locals: { failureReason?: string };
};

function responseReason(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const details = body as Record<string, unknown>;
  if (Array.isArray(details.message)) {
    return details.message
      .filter((item) => typeof item === "string")
      .join("; ");
  }
  if (typeof details.message === "string") return details.message;
  if (typeof details.status === "string") return details.status;
  if (typeof details.error === "string") return details.error;
  return undefined;
}

function exceptionReason(exception: unknown): string {
  if (exception instanceof HttpException) {
    return responseReason(exception.getResponse()) || exception.message;
  }
  if (exception instanceof Error) return exception.message;
  return "Unknown error";
}

@Catch()
export class ApiFailureReasonFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FailureResponse>();
    response.locals.failureReason = exceptionReason(exception);
    super.catch(exception, host);
  }
}

export function apiFailureLogging(logger: Logger): RequestHandler {
  return (request: Request, response: Response, next) => {
    const failureResponse = response as FailureResponse;
    const originalJson = response.json.bind(response);
    response.json = ((body: unknown) => {
      if (response.statusCode >= 400 && !failureResponse.locals.failureReason) {
        failureResponse.locals.failureReason = responseReason(body);
      }
      return originalJson(body);
    }) as Response["json"];

    response.on("finish", () => {
      const status = response.statusCode;
      if (
        status < 400 ||
        status === 401 ||
        (request.path !== "/api/v1" && !request.path.startsWith("/api/v1/"))
      ) {
        return;
      }

      const route = request.route?.path || "<unmatched route>";
      const summary = `API request failed: ${request.method} ${route} -> ${status}`;
      const reason = request.route
        ? failureResponse.locals.failureReason || response.statusMessage
        : "Route not found";
      const message = status === 403 ? summary : `${summary}: ${reason}`;
      if (status >= 500) logger.error(message);
      else logger.warn(message);
    });

    next();
  };
}
