import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { MeetsService } from './meets.service';
import { CreateMeetDto } from './dto/create-meet.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Meets')
@Controller('meets')
export class MeetsController {
  constructor(private readonly meetsService: MeetsService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean, description: 'Filter to upcoming meets only' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)', example: 20 })
  findAll(@Query('upcoming') upcoming?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    const upcomingOnly = upcoming === 'true';
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
    return this.meetsService.findAll(upcomingOnly, pageNum, limitNum);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMeetDto) {
    return this.meetsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetDto) {
    return this.meetsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetsService.remove(id);
  }
}
