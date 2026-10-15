
import { IsDateString, IsEmail, IsInt, IsString} from "class-validator"

export class CreateUsuarioCompletoDto {
    //informacion de usuario
    @IsString()
    usuario: string;
    
    @IsString()
    contrasena: string;
    
    @IsEmail()
    correo: string;
    
    @IsString()
    rol: string;


    //informacion de informacion perfil
    @IsInt()
    dni: number;

    @IsString()
    nombres: string;

    @IsString()
    apellidos: string;

    @IsDateString()
    fecha_nacimiento: Date;

    @IsString()
    lugar_nacimiento: string;

    @IsString()
    direccion_facturacion: string;

    @IsString()
    genero: string;

    @IsString()
    foto_url: string;
}
