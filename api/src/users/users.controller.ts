import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "./dto/user-profile.dto";
import { ForbiddenException } from "@nestjs/common";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  @Get()
  async findAll(@User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const organizationIds = this.authService.getUserOrganizationIds(
      user,
      "admin"
    );
    if (!organizationIds.length) {
      throw new ForbiddenException(
        "You are not administrator for any organizations"
      );
    }
    const users = await this.usersService.findAllByOrganizations(
      organizationIds
    );
    return { users };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }
    if (!this.authService.hasRole(user, existingUser.organizationId!, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization"
      );
    }
    return { user: existingUser };
  }

  @Post()
  async create(@Body() body: CreateUserDto, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    if (!body.organizationId) {
      throw new BadRequestException("organizationId is required");
    }

    if (!this.authService.hasRole(user, body.organizationId, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization"
      );
    }
    const createdUser = await this.usersService.create(body);
    return { user: createdUser };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }
    if (!this.authService.hasRole(user, existingUser.organizationId!, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for the user's organization"
      );
    }
    if (!body.organizationId) {
      throw new BadRequestException("organizationId is required");
    }
    if (!this.authService.hasRole(user, body.organizationId, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization"
      );
    }

    const updatedUser = await this.usersService.update(id, body);
    return { user: updatedUser };
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }
    if (!this.authService.hasRole(user, existingUser.organizationId!, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization"
      );
    }
    return this.usersService.remove(id);
  }
}
