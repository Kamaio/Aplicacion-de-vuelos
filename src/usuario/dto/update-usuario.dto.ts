import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioCompletoDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioCompletoDto) {}
