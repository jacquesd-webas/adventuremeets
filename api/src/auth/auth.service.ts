import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { TokenPair } from "./dto/token-pair.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserProfile> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (!user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }

  private signAccessToken(user: UserProfile): string {
    const roles = Array.isArray((user as any).roles) ? (user as any).roles : [];
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles
    });
  }

  private signRefreshToken(user: UserProfile): string {
    return this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "30d" }
    );
  }

  async login(payload: LoginDto): Promise<TokenPair> {
    const user = await this.validateUser(payload.email, payload.password);
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  async refresh(payload: RefreshDto): Promise<TokenPair> {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(payload.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.usersService.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const created = await this.usersService.create(dto);
    const user = await this.usersService.findById(created.id);
    return {
      accessToken: this.signAccessToken(user as any),
      refreshToken: this.signRefreshToken(user as any)
    };
  }
}
