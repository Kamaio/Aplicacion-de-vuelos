import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompraReservaService } from './compra-reserva.service';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { UpdateCompraReservaDto } from './dto/update-compra-reserva.dto';

@Controller('compra-reserva')
export class CompraReservaController {
  constructor(private readonly compraReservaService: CompraReservaService) {}

  @Post()
  create(@Body() createCompraReservaDto: CreateCompraReservaDto) {
    return this.compraReservaService.create(createCompraReservaDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compraReservaService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compraReservaService.remove(+id);
  }
}
