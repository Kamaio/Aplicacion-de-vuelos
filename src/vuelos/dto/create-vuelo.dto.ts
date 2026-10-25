import { IsNumber, IsString } from "class-validator";

export class CreateVueloDto {
    //id: number; lo tiene andrea pero yo no le doy uso

    @IsString()
    codigo: string;

    //tipo

    @IsString()
    origen: string;

    @IsString()
    destino: string;

    @IsString()
    fecha: string;

    @IsString()
    horaVuelo: string;

    @IsString()
    horaLlegada: string

    @IsNumber()
    precioEconomico: number;

    @IsNumber()
    precioPrimera: number;

    @IsString()
    estado: 'Programado' | 'Realizado' | 'Cancelado';

    @IsNumber()
    reservasCount?: number; 
}
