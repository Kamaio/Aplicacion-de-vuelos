import { IsNumber, IsOptional, IsString } from "class-validator";

export class BusquedaParametrizadaDto {
    @IsOptional()
    @IsString()
    origen: string;

    @IsOptional()
    @IsString()
    destino: string;

    @IsOptional()
    @IsString()
    fecha: string;

    @IsOptional()
    @IsNumber()
    precioMaximo: number
}
