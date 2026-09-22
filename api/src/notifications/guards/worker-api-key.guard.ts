import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class WorkerApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request?.headers?.["x-api-key"];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    const workerApiKey = process.env.WORKER_API_KEY;

    if (!workerApiKey) {
      throw new UnauthorizedException("Worker API key is not configured");
    }

    if (apiKey !== workerApiKey) {
      throw new UnauthorizedException("Invalid worker API key");
    }

    return true;
  }
}
