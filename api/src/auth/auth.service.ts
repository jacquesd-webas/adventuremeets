import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  hasRole(
    user: UserProfile,
    organizationId: string,
    requiredRole: "member" | "organizer" | "admin"
  ): boolean {
    const role = user.organizations?.[organizationId];
    if (!role) return false;
    if (requiredRole === "member") {
      return role === "member" || role === "organizer" || role === "admin";
    }
    if (requiredRole === "organizer") {
      return role === "organizer" || role === "admin";
    }
    return role === "admin";
  }

  getUserOrganizationIds(
    user: UserProfile,
    minRole?: "member" | "organizer" | "admin"
  ): string[] {
    const entries = Object.entries(user.organizations || {});
    if (!minRole || minRole === "member") {
      return entries
        .filter(([, role]) => ["member", "organizer", "admin"].includes(role))
        .map(([id]) => id);
    }
    if (minRole === "organizer") {
      return entries
        .filter(([, role]) => role === "organizer" || role === "admin")
        .map(([id]) => id);
    }
    return entries.filter(([, role]) => role === "admin").map(([id]) => id);
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<{ user: UserProfile; isValid: boolean }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    if (!user.password_hash) {
      throw new InternalServerErrorException("No password set for user");
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return { user, isValid: false };
    }
    return { user, isValid: true };
  }

  private signAccessToken(user: UserProfile): string {
    const rolesFromMap = user.organizations
      ? Object.values(user.organizations)
      : [];
    const roles = Array.isArray((user as any).roles)
      ? (user as any).roles
      : rolesFromMap;
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles,
    });
  }

  private signRefreshToken(user: UserProfile): string {
    return this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "30d" }
    );
  }

  async login(payload: LoginDto): Promise<TokenPair> {
    let { user, isValid }: { user?: UserProfile; isValid: boolean } = {
      user: undefined,
      isValid: false,
    };
    // This is a litte tricky as we want to mask any login failures or other errors
    // as just "Login failed" to avoid giving away any hints to attackers. We also
    // want to log failed attempts for non-real users so that fail2ban can block
    // brute-force attacks.

    // 1. Verify if the user is valid (check email and password)
    try {
      const res = await this.validateUser(payload.email, payload.password);
      user = res.user;
      isValid = res.isValid;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        this.logger.error(`Login failed for ${payload.email}: ${err.message}`);
        throw new UnauthorizedException("Login failed");
      }
      if (err instanceof InternalServerErrorException) {
        this.logger.error(`Login failed for ${payload.email}: ${err.message}`);
        throw new UnauthorizedException("Login failed");
      }
    }
    if (!user) {
      this.logger.error(`Login failed for ${payload.email}: User not found`);
      throw new UnauthorizedException("Login failed");
    }

    // 2. Log the login attempt (either as success or failure)
    try {
      await this.usersService.updateLogin(user.id, { isSuccess: isValid });
    } catch (err: any) {
      this.logger.error("Unable to log login attempt: " + err.message);
      throw new UnauthorizedException("Login failed");
    }

    // 3. Return tokens if login was success, otherwise throw
    if (isValid) {
      return {
        accessToken: this.signAccessToken(user),
        refreshToken: this.signRefreshToken(user),
      };
    }
    throw new UnauthorizedException("Login failed");
  }

  async refresh(payload: RefreshDto): Promise<TokenPair> {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(payload.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (decoded.type !== "refresh") {
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
    await this.usersService.linkByEmail(user.email, user.id);
    return {
      accessToken: this.signAccessToken(user as any),
      refreshToken: this.signRefreshToken(user as any),
    };
  }

  private async verifyCaptchaIfNeeded(dto: RegisterDto) {
    const secret = process.env.RECAPTCHA_SECRET;
    // Only enforce for email/password flow; IDP-based registrations can bypass.
    const isEmailMethod = !dto.idpProvider;
    if (!secret || !isEmailMethod) {
      return;
    }
    // Bypass captcha if referred from meet attendee link and attendeeId is valid
    const isReferredFromAttendee = Boolean(dto.attendeeId);
    if (isReferredFromAttendee) {
      const isValid = await this.usersService.isValidAttendee(dto.attendeeId!);
      if (isValid) return;
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
      prompt: "consent",
    });
    if (state) {
      params.set("state", state);
    }
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleLoginWithCode(
    code: string,
    redirectUri?: string
  ): Promise<TokenPair> {
    const token = await this.exchangeGoogleCode(code, redirectUri);
    const profile = await this.verifyGoogleIdToken(token.id_token);
    return this.upsertGoogleUser(profile);
  }

  async googleLoginWithIdToken(idToken: string): Promise<TokenPair> {
    const profile = await this.verifyGoogleIdToken(idToken);
    return this.upsertGoogleUser(profile);
  }

  private async exchangeGoogleCode(
    code: string,
    redirectUri?: string
  ): Promise<GoogleTokenResponse> {
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
      grant_type: "authorization_code",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      const message = await res.text();
      throw new UnauthorizedException(
        message || "Google token exchange failed"
      );
    }
    return (await res.json()) as GoogleTokenResponse;
  }

  private async verifyGoogleIdToken(
    idToken: string
  ): Promise<GoogleIdTokenPayload> {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken
      )}`
    );
    if (!res.ok) {
      const message = await res.text();
      throw new UnauthorizedException(message || "Invalid Google ID token");
    }
    return (await res.json()) as GoogleIdTokenPayload;
  }

  private async upsertGoogleUser(
    profile: GoogleIdTokenPayload
  ): Promise<TokenPair> {
    if (!profile.sub) {
      throw new UnauthorizedException("Invalid Google profile");
    }
    const existingByIdp = await this.usersService.findByIdp(
      "google",
      profile.sub
    );
    if (existingByIdp) {
      const user = await this.usersService.findById(existingByIdp.id);
      return {
        accessToken: this.signAccessToken(user as any),
        refreshToken: this.signRefreshToken(user as any),
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
        idpProfile: profile,
      });
      const user = await this.usersService.findById(existingByEmail.id);
      return {
        accessToken: this.signAccessToken(user as any),
        refreshToken: this.signRefreshToken(user as any),
      };
    }

    const created = await this.usersService.create({
      email,
      idpProvider: "google",
      idpSubject: profile.sub,
      firstName: profile.given_name,
      lastName: profile.family_name,
      idpProfile: profile,
    });
    const user = await this.usersService.findById(created.id);
    return {
      accessToken: this.signAccessToken(user as any),
      refreshToken: this.signRefreshToken(user as any),
    };
  }
}
