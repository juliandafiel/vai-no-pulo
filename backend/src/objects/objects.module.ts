import { Module } from '@nestjs/common';
import { ObjectsService } from './objects.service';
import { ObjectsController } from './objects.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ObjectsController],
    providers: [ObjectsService],
    exports: [ObjectsService],
})
export class ObjectsModule { }
