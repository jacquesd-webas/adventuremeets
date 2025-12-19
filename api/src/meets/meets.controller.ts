import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UnauthorizedException, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { MeetsService } from './meets.service';
import { CreateMeetDto } from './dto/create-meet.dto';
import { MeetDto } from './dto/meet.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { UpdateMeetStatusDto } from './dto/update-meet-status.dto';
import { CreateMeetImageDto } from './dto/create-meet-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserProfile } from '../users/dto/user-profile.dto';

@ApiTags('Meets')
@Controller('meets')
export class MeetsController {
  constructor(private readonly meetsService: MeetsService) {}

  @Get()
  @ApiQuery({ name: 'view', required: false, type: String, description: 'Filter view: reports, plan, all' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)', example: 20 })
  findAll(
    @Query('view') view = 'all',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @User() user?: UserProfile & { organizationIds?: string[] | null }
  ) {
    const normalizedView = String(view || 'all').toLowerCase();
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
    return this.meetsService.findAll(normalizedView, pageNum, limitNum, user?.organizationIds || []);
  }

  @Get('statuses')
  listStatuses() {
    return this.meetsService.listStatuses();
  }

  @Get(':id([0-9a-fA-F-]{36})')
  async findOne(@Param('id') id: string, @User() user?: UserProfile & { organizationIds?: string[] | null }): Promise<MeetDto> {
    const meet = await this.meetsService.findOne(id);
    if (!meet) {
      throw new NotFoundException('Meet not found in your organizations');
    }
    if (user?.organizationIds && meet.organizationId && !user.organizationIds.includes(meet.organizationId)) {
      throw new NotFoundException('Meet not found in your organizations');
    }
    return meet;
  }

  @Public()
  @Get(':code')
  findByShareCode(@Param('code') code: string): Promise<MeetDto> {
    const meet = this.meetsService.findOne(code);
    return meet;
  }

  @Post()
  create(@Body() dto: CreateMeetDto, @User() user?: UserProfile) {
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (dto.organizationId && !user.organizationIds?.includes(dto.organizationId)) {
      throw new UnauthorizedException('Cannot create a meet for an organization you do not belong to');
    }
    const defaultOrgId = user.organizationIds && user.organizationIds.length > 0 ? user.organizationIds[0] : null;
    if (!defaultOrgId) {
      throw new UnauthorizedException('User does not belong to any organization');
    }
    return this.meetsService.create({
      ...dto,
      organizerId: dto.organizerId || user.id,
      organizationId : dto.organizationId || defaultOrgId,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetDto, @User() user?: UserProfile) {
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const exisitngMeet = this.meetsService.findOne(id);
    if (!exisitngMeet) {
      throw new NotFoundException('Meet not found');
    }
    if (dto.organizationId && !user.organizationIds?.includes(dto.organizationId)) {
      throw new UnauthorizedException('Cannot update a meet for an organization you do not belong to');
    }
    return this.meetsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMeetStatusDto) {
    return this.meetsService.updateStatus(id, dto.statusId);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  addImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: CreateMeetImageDto) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
    return this.meetsService.addImage(id, file, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetsService.remove(id);
  }
}
