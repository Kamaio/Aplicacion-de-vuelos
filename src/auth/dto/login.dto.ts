import { IsEmail, IsString } from "class-validator";

export class LoginDto {
    @IsString()
    email: string;

    @IsString()
    contrasena: string;
}