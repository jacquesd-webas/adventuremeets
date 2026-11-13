import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  INestApplication,
  Logger,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Response } from "express";
import * as request from "supertest";
import { ApiFailureReasonFilter, apiFailureLogging } from "./api-failure-logging";

@Controller("logging-test")
class LoggingTestController {
  @Get("ok")
  ok() {
    return { status: "ok" };
  }

  @Get("bad-request")
  badRequest() {
    throw new BadRequestException("A required field is missing");
  }

  @Get("unauthorized")
  unauthorized() {
    throw new UnauthorizedException("Private auth detail");
  }

  @Get("forbidden")
  forbidden() {
    throw new ForbiddenException("Private permission detail");
  }

  @Get("unhandled")
  unhandled() {
    throw new Error("Database unavailable");
  }

  @Get("manual")
  manual(@Res({ passthrough: true }) response: Response) {
    response.status(404);
    return { status: "meet not found" };
  }
}

describe("API failure logging", () => {
  let app: INestApplication;
  const logger = {
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [LoggingTestController],
    }).compile();
    app = module.createNestApplication();
    app.use(apiFailureLogging(logger));
    app.useGlobalFilters(new ApiFailureReasonFilter(app.getHttpAdapter()));
    app.setGlobalPrefix("api/v1");
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("logs the reason for a failed API request without query values", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/bad-request?token=secret")
      .expect(400);

    expect(logger.warn).toHaveBeenCalledWith(
      "API request failed: GET /api/v1/logging-test/bad-request -> 400: A required field is missing",
    );
  });

  it("does not log 401 and omits the reason for 403", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/unauthorized")
      .expect(401);
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/forbidden")
      .expect(403);

    expect(logger.warn).toHaveBeenCalledWith(
      "API request failed: GET /api/v1/logging-test/forbidden -> 403",
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("logs the underlying reason for an unexpected server error", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/unhandled")
      .expect(500);

    expect(logger.error).toHaveBeenCalledWith(
      "API request failed: GET /api/v1/logging-test/unhandled -> 500: Database unavailable",
    );
  });

  it("logs a reason for manually returned failures", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/manual")
      .expect(404);

    expect(logger.warn).toHaveBeenCalledWith(
      "API request failed: GET /api/v1/logging-test/manual -> 404: meet not found",
    );
  });

  it("logs unmatched API routes without exposing the requested path", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/unknown-secret-route")
      .expect(404);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("API request failed: GET <unmatched route> -> 404:"),
    );
    expect((logger.warn as jest.Mock).mock.calls[0][0]).not.toContain(
      "unknown-secret-route",
    );
  });

  it("does not log successful API requests", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/logging-test/ok")
      .expect(200);

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
