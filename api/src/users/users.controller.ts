import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "./dto/user-profile.dto";
import { ForbiddenException } from "@nestjs/common";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@User() user?: UserProfile & { organizationIds?: string[] | null }) {
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    const users = await this.usersService.findAllByOrganizations(user.organizationIds || []);
    return { users };
  }

  @Get(":id")
  async findOne(@User() user?: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    const res = await this.usersService.findById(id);

    if (res && !user.organizationIds.includes(res.organizationId)) {
      throw new NotFoundException("User not found in your organizations");
    }
    return { res };
  }

  @Post()
  async create(@User() user?: UserProfile & { organizationIds?: string[] | null }, @Body() body: CreateUserDto) {
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    let userOrgId = body.organizationId;
    if (userOrgId && !user.organizationIds.includes(userOrgId)) {
      throw new ForbiddenException("Cannot create user in organization you don't belong to");
    }
    if (!userOrgId && user.organizationIds.length === 1) {
      userOrgId = user.organizationIds[0];
      body.organizationId = userOrgId;
    }

    const createdUser = await this.usersService.create(body);
    return { user: createdUser };
  }

  @Patch(":id")
  async update(@User() user?: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string, @Body() body: UpdateUserDto) {
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }
    if (!user.organizationIds.includes(existingUser.organizationId)) {
      throw new NotFoundException("User not found in your organizations");
    }
    const updatedUser = await this.usersService.update(id, body);
    return { user: updatedUser };
  }

  @Delete(":id")
  async remove(@User() user?: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    if (!user.organizationIds.includes(existingUser.organizationId)) {
      throw new NotFoundException("User not found in your organizations");
    }
    return this.usersService.remove(id);
  }
}
