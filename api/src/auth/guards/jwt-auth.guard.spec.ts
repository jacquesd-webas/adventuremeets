import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector);
    delete process.env.WORKER_API_KEY;
  });

  it("returns true for public routes", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("returns true for requests with the worker API key", () => {
    process.env.WORKER_API_KEY = "worker-secret";
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            "x-api-key": "worker-secret",
          },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws UnauthorizedException when passport authentication yields no user", () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it("returns the authenticated user when passport validation succeeds", () => {
    const user = { id: "user-1" };
    expect(guard.handleRequest(null, user)).toBe(user);
  });
});
