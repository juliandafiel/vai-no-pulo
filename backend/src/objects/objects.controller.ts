import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { ObjectsService } from './objects.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface CreateObjectDto {
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    brand?: string;
    weight?: number;
    height?: number;
    width?: number;
    depth?: number;
    declaredValue?: number;
    isFragile?: boolean;
    requiresRefrigeration?: boolean;
    requiresSpecialCare?: boolean;
    specialCareNotes?: string;
    photos?: string[];
}

@ApiTags('objects')
@ApiBearerAuth()
@Controller('objects')
export class ObjectsController {
    constructor(private readonly objectsService: ObjectsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Create an object' })
    async create(@Body() body: any, @Request() req) {
        // Extrai APENAS os campos válidos do schema Prisma
        const {
            name,
            description,
            category,
            subcategory,
            brand,
            weight,
            height,
            width,
            depth,
            length, // mapeia para depth
            declaredValue,
            isFragile,
            requiresRefrigeration,
            requiresSpecialCare,
            specialCareNotes,
            photos,
            videos,
        } = body;

        // Monta objeto apenas com campos válidos
        const data: any = {
            name,
            category,
            photos: photos || [],
            videos: videos || [],
            user: { connect: { id: req.user.userId } },
        };

        // Adiciona campos opcionais se existirem
        if (description !== undefined) data.description = description;
        if (subcategory !== undefined) data.subcategory = subcategory;
        if (brand !== undefined) data.brand = brand;
        if (weight !== undefined) data.weight = weight;
        if (height !== undefined) data.height = height;
        if (width !== undefined) data.width = width;
        if (depth !== undefined) data.depth = depth;
        if (length !== undefined) data.depth = length; // mapeia length -> depth
        if (declaredValue !== undefined) data.declaredValue = declaredValue;
        if (isFragile !== undefined) data.isFragile = isFragile;
        if (requiresRefrigeration !== undefined) data.requiresRefrigeration = requiresRefrigeration;
        if (requiresSpecialCare !== undefined) data.requiresSpecialCare = requiresSpecialCare;
        if (specialCareNotes !== undefined) data.specialCareNotes = specialCareNotes;

        return this.objectsService.create(data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'List my objects' })
    findAll(@Request() req) {
        return this.objectsService.findAll(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    @ApiOperation({ summary: 'Get object by id' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.objectsService.findOne(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    @ApiOperation({ summary: 'Update an object' })
    update(@Param('id') id: string, @Body() body: any, @Request() req) {
        // Extrai APENAS os campos válidos do schema Prisma
        const {
            name,
            description,
            category,
            subcategory,
            brand,
            weight,
            height,
            width,
            depth,
            length, // mapeia para depth
            declaredValue,
            isFragile,
            requiresRefrigeration,
            requiresSpecialCare,
            specialCareNotes,
            photos,
            videos,
        } = body;

        // Monta objeto apenas com campos válidos
        const data: any = {};

        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (category !== undefined) data.category = category;
        if (subcategory !== undefined) data.subcategory = subcategory;
        if (brand !== undefined) data.brand = brand;
        if (weight !== undefined) data.weight = weight;
        if (height !== undefined) data.height = height;
        if (width !== undefined) data.width = width;
        if (depth !== undefined) data.depth = depth;
        if (length !== undefined) data.depth = length; // mapeia length -> depth
        if (declaredValue !== undefined) data.declaredValue = declaredValue;
        if (isFragile !== undefined) data.isFragile = isFragile;
        if (requiresRefrigeration !== undefined) data.requiresRefrigeration = requiresRefrigeration;
        if (requiresSpecialCare !== undefined) data.requiresSpecialCare = requiresSpecialCare;
        if (specialCareNotes !== undefined) data.specialCareNotes = specialCareNotes;
        if (photos !== undefined) data.photos = photos;
        if (videos !== undefined) data.videos = videos;

        return this.objectsService.update(id, req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an object' })
    delete(@Param('id') id: string, @Request() req) {
        return this.objectsService.delete(id, req.user.userId);
    }
}
