import { PartialType } from '@nestjs/mapped-types';
import { CreateCompraReservaDto } from './create-compra-reserva.dto';

export class UpdateCompraReservaDto extends PartialType(CreateCompraReservaDto) {}
