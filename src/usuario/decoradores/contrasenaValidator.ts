import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function EsContrasena(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'EsContrasena',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: any, args: ValidationArguments) {
                if (typeof value !== 'string') return false;
                // Regla: mínimo 8 caracteres, al menos una letra y un número
                const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
                return regex.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                return "Contraseña invalida. Debe tener al menos 8 caracteres, incluir letras y números.";
                },
            },
        });
    };
}