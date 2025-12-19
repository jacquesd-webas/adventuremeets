import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { TokenPair } from "./dto/token-pair.dto";
import { RegisterDto } from "./dto/register.dto";

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
};

type GoogleIdTokenPayload = {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

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
    await this.verifyCaptchaIfNeeded(dto);
    const created = await this.usersService.create(dto);
    const user = await this.usersService.findById(created.id);
    return {
      accessToken: this.signAccessToken(user as any),
      refreshToken: this.signRefreshToken(user as any)
    };
  }

  private async verifyCaptchaIfNeeded(dto: RegisterDto) {
    const secret = process.env.RECAPTCHA_SECRET;
    // Only enforce for email/password flow; IDP-based registrations can bypass.
    const isEmailMethod = !dto.idpProvider;
    if (!secret || !isEmailMethod) {
      return;
    }
    if (!dto.captchaToken) {
      throw new BadRequestException("Captcha is required");
    }
    const params = new URLSearchParams({
      secret,
      response: dto.captchaToken,
    });
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      throw new UnauthorizedException("Captcha verification failed");
    }
    const data = await res.json();
    if (!data.success) {
      throw new UnauthorizedException("Captcha verification failed");
    }
  }

  async getGoogleAuthUrl(redirectUri?: string, state?: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const fallbackRedirect = process.env.GOOGLE_REDIRECT_URI;
    const actualRedirect = redirectUri || fallbackRedirect;
    if (!clientId || !actualRedirect) {
      throw new UnauthorizedException("Google OAuth is not configured");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: actualRedirect,
      response_type: "code",
      scope: "openid email profile",
      include_granted_scopes: "true",
      access_type: "offline",
      prompt: "consent"
    });
    if (state) {
      params.set("state", state);
    }
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleLoginWithCode(code: string, redirectUri?: string): Promise<TokenPair> {
    const token = await this.exchangeGoogleCode(code, redirectUri);
    const profile = await this.verifyGoogleIdToken(token.id_token);
    return this.upsertGoogleUser(profile);
  }

  async googleLoginWithIdToken(idToken: string): Promise<TokenPair> {
    const profile = await this.verifyGoogleIdToken(idToken);
    return this.upsertGoogleUser(profile);
  }

  private async exchangeGoogleCode(code: string, redirectUri?: string): Promise<GoogleTokenResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const fallbackRedirect = process.env.GOOGLE_REDIRECT_URI;
    const actualRedirect = redirectUri || fallbackRedirect;
    if (!clientId || !clientSecret || !actualRedirect) {
      throw new UnauthorizedException("Google OAuth is not configured");
    }
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: actualRedirect,
      grant_type: "authorization_code"
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    if (!res.ok) {
      const message = await res.text();
      throw new UnauthorizedException(message || "Google token exchange failed");
    }
    return (await res.json()) as GoogleTokenResponse;
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      const message = await res.text();
      throw new UnauthorizedException(message || "Invalid Google ID token");
    }
    return (await res.json()) as GoogleIdTokenPayload;
  }

  private async upsertGoogleUser(profile: GoogleIdTokenPayload): Promise<TokenPair> {
    if (!profile.sub) {
      throw new UnauthorizedException("Invalid Google profile");
    }
    const existingByIdp = await this.usersService.findByIdp("google", profile.sub);
    if (existingByIdp) {
      const user = await this.usersService.findById(existingByIdp.id);
      return {
        accessToken: this.signAccessToken(user as any),
        refreshToken: this.signRefreshToken(user as any)
      };
    }

    const email = profile.email || "";
    if (!email) {
      throw new UnauthorizedException("Google account email not available");
    }

    const existingByEmail = await this.usersService.findByEmail(email);
    if (existingByEmail) {
      await this.usersService.update(existingByEmail.id, {
        idpProvider: "google",
        idpSubject: profile.sub,
        firstName: profile.given_name,
        lastName: profile.family_name,
        idpProfile: profile
      });
      const user = await this.usersService.findById(existingByEmail.id);
      return {
        accessToken: this.signAccessToken(user as any),
        refreshToken: this.signRefreshToken(user as any)
      };
    }

    const created = await this.usersService.create({
      email,
      idpProvider: "google",
      idpSubject: profile.sub,
      firstName: profile.given_name,
      lastName: profile.family_name,
      idpProfile: profile
    });
    const user = await this.usersService.findById(created.id);
    return {
      accessToken: this.signAccessToken(user as any),
      refreshToken: this.signRefreshToken(user as any)
    };
  }
}
