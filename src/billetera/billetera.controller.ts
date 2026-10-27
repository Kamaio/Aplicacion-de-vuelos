import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BilleteraService } from './billetera.service';
import { CreateBilleteraDto } from './dto/create-billetera.dto';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { UpdateBilleteraDto } from './dto/update-billetera.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('billetera')
export class BilleteraController {
  constructor(private readonly billeteraService: BilleteraService) {}

  @Post()
  createTarjeta(@Body() createTarjetaDto: CreateTarjetaDto) {
    return this.billeteraService.createTarjeta(createTarjetaDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billeteraService.findOne(+id);
  }

  @Get('historial/:id')
  findHistorial(@Param('id') id: string) {
    return this.billeteraService.findHistorial(+id);
  }

  @Patch()
  update(@Body() updateBilleteraDto: {idUsuario: number, monto: number, idTarjeta: number}) { //las maricadas que me tocan hacer para que ella no tenga que cambiar nada omg
    return this.billeteraService.updateSaldo(updateBilleteraDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.billeteraService.remove(+id, req.usuario.id_usuario);
  }
}
