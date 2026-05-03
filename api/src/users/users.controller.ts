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
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "./dto/user-profile.dto";
import { ForbiddenException } from "@nestjs/common";
import { UserMetaValuesPayloadDto } from "./dto/user-meta-values.dto";
import { UpdateUserIceInfoDto } from "./dto/update-user-ice-info.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { CopyUserMetaValuesFromAttendeeDto } from "./dto/copy-user-meta-values-from-attendee.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  @Get("me/ice")
  async getMyIceInfo(@User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const iceInfo = await this.usersService.findIceInfoByUserId(user.id);
    return { iceInfo };
  }

  @Patch("me/ice")
  async updateMyIceInfo(
    @Body() body: UpdateUserIceInfoDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const iceInfo = await this.usersService.upsertIceInfo(user.id, body);
    return { iceInfo };
  }

  @Post("me/meta-values/from-attendee")
  async copyMyMetaValuesFromAttendee(
    @Body() body: CopyUserMetaValuesFromAttendeeDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const result = await this.usersService.copyUserMetaValuesFromAttendee(
      user.id,
      body.meetId,
      body.attendeeId,
    );
    return {
      organizationId: result.organizationId,
      metaValues: result.values,
    };
  }

  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMyAvatar(
    @UploadedFile() file: any,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    if (!file) {
      throw new BadRequestException("Avatar image file is required");
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed");
    }

    const updatedUser = await this.usersService.uploadAvatar(user.id, file);
    return { user: updatedUser };
  }

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
    // Check the user is admin for at least one of the existing users organizations
    const organizationsIds = this.authService.getUserOrganizationIds(user);
    if (!this.authService.hasAtLeastOneRole(user, organizationsIds, "admin")) {
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

    // Allow users to modify their own profile
    const isModifyingSelf = user.id === id;

    if (!isModifyingSelf) {
      // OrganizationId is required when not editing your own user
      if (!body.organizationId) {
        throw new BadRequestException("organizationId is required");
      }
      // Check that user is admin for at least one of the users organizations
      const organizationsIds = this.authService.getUserOrganizationIds(user);
      if (
        !this.authService.hasAtLeastOneRole(user, organizationsIds, "admin")
      ) {
        throw new ForbiddenException(
          "You are not an administrator for the user's organization"
        );
      }
      // And also that user is admin for whatever organization they are in (weird but could happen)
      if (!this.authService.hasRole(user, body.organizationId, "admin")) {
        throw new ForbiddenException(
          "You are not an administrator for this organization"
        );
      }
    }

    const updatedUser = await this.usersService.update(id, body);
    return { user: updatedUser };
  }

  @Get(":id/meta-values")
  async listMetaValues(
    @Param("id") id: string,
    @Query("organizationId") organizationId: string,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();
    if (!organizationId) {
      throw new BadRequestException("organizationId is required");
    }
    if (!this.authService.hasRole(user, organizationId, "member")) {
      throw new ForbiddenException("You are not a member of this organization");
    }
    const metaValues = await this.usersService.listUserMetaValues(
      id,
      organizationId
    );
    return { metaValues };
  }

  @Post(":id/meta-values")
  async saveMetaValues(
    @Param("id") id: string,
    @Body() body: UserMetaValuesPayloadDto,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();
    if (!this.authService.hasRole(user, body.organizationId, "member")) {
      throw new ForbiddenException("You are not a member of this organization");
    }
    const metaValues = await this.usersService.saveUserMetaValues(
      id,
      body.organizationId,
      body.values
    );
    return { metaValues };
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found in your organizations");
    }

    // Check the user is admin for at least one of the existing users organizations
    const organizationsIds = this.authService.getUserOrganizationIds(user);
    if (!this.authService.hasAtLeastOneRole(user, organizationsIds, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization"
      );
    }
    return this.usersService.remove(id);
  }
}
