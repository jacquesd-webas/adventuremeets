import { Body, Controller, ForbiddenException, Get, Post, UnauthorizedException } from "@nestjs/common";
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<TokenPair> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.authService.refresh(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@User() user: UserProfile): Promise<UserProfile> {
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const full = await this.usersService.findById(user.id);
    if (!full) {
      throw new ForbiddenException('User not found');
    }
    const { passwordHash, ...rest } = full;
    return rest as UserProfile;
  }
}
