import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { TokenPair } from "./dto/token-pair.dto";
import { Public } from "./decorators/public.decorator";
import { User } from "./decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthUrlDto } from "./dto/google-auth-url.dto";
import { GoogleAuthCodeDto } from "./dto/google-auth-code.dto";
import { GoogleIdTokenDto } from "./dto/google-id-token.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<TokenPair> {
    return this.authService.register(dto);
  }

  @Public()
  @Get("register/check")
  async registerCheck(@Query("email") email?: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }
    const existing = await this.usersService.findByEmail(email);
    return { exists: Boolean(existing) };
  }

  @Public()
  @Get("google/url")
  async googleUrl(@Query() query: GoogleAuthUrlDto) {
    const url = await this.authService.getGoogleAuthUrl(
      query.redirectUri,
      query.state
    );
    return { url };
  }

  @Public()
  @Post("google/token")
  async googleToken(@Body() dto: GoogleAuthCodeDto): Promise<TokenPair> {
    return this.authService.googleLoginWithCode(dto.code, dto.redirectUri);
  }

  @Public()
  @Post("google/verify")
  async googleVerify(@Body() dto: GoogleIdTokenDto): Promise<TokenPair> {
    return this.authService.googleLoginWithIdToken(dto.idToken);
  }

  @Public()
  @Post("refresh")
  async refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.authService.refresh(dto);
  }

  @ApiBearerAuth()
  @Get("me")
  async me(@User() user: UserProfile): Promise<UserProfile> {
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }
    const full = await this.usersService.findById(user.id);
    if (!full) {
      throw new ForbiddenException("User not found");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = full;
    const organizationIds = await this.usersService.findOrganizationIds(user.id);
    const orgRoles = await this.usersService.findOrganizationRoles(user.id);
    const organizations = organizationIds.reduce<Record<string, string>>(
      (acc, orgId) => {
        const role =
          orgRoles.find((row) => row.organizationId === orgId)?.role ||
          "member";
        acc[orgId] = role;
        return acc;
      },
      {}
    );
    return {
      ...(rest as UserProfile),
      organizations,
    } as UserProfile;
  }
}
