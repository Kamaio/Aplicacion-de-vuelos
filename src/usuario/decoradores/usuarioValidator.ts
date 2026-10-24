import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function EsUsuario(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'EsUsuario',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: any, args: ValidationArguments) {
                if (typeof value !== 'string') return false;
                // Regla: mínimo 1 caracteres, máximo 16, solo letras, números, guiones y guiones bajos
                const regex = /^(?=.*[A-Za-z0-9])[A-Za-z0-9_.-]{1,16}$/;
                return regex.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                return "Nombre de usuario invalido";
                },
            },
        });
    };
}