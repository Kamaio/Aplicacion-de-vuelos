import { IsString } from "class-validator";

export class CreateVueloDto {
    //id: number; lo tiene andrea pero yo no le doy uso

    @IsString()
    codigo: string;

    @IsString()
    origen: string;

    @IsString()
    destino: string;

    
    fechaHora: string; //estan juntos y deberian estar separados entonces lo dejo para editar luego


    precio: number; //estos son 2 precios entonces se debe dividir en 2

    @IsString()
    estado: 'Programado' | 'Realizado' | 'Cancelado';
    reservasCount?: number; 
}
