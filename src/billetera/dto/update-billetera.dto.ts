import { PartialType } from '@nestjs/mapped-types';
import { CreateBilleteraDto } from './create-billetera.dto';
import { EsMonto } from '../decoradores/montoValidator';

export class UpdateBilleteraDto extends PartialType(CreateBilleteraDto) {

    @EsMonto({ message: 'Monto invalido. Deben ser menos de 12 digitos.' })
    monto: number;
}
