import { PartialType } from '@nestjs/mapped-types';
import { CreateVueloDto } from './create-vuelo.dto';

export class UpdateVueloDto extends PartialType(CreateVueloDto) {}
