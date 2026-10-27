import { Injectable } from '@nestjs/common';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { UpdateCompraReservaDto } from './dto/update-compra-reserva.dto';

@Injectable()
export class CompraReservaService {
  create(createCompraReservaDto: CreateCompraReservaDto) {
    return 'This action adds a new compraReserva';
  }

  findAll() {
    return `This action returns all compraReserva`;
  }

  findOne(id: number) {
    return `This action returns a #${id} compraReserva`;
  }

  update(id: number, updateCompraReservaDto: UpdateCompraReservaDto) {
    return `This action updates a #${id} compraReserva`;
  }

  remove(id: number) {
    return `This action removes a #${id} compraReserva`;
  }
}
