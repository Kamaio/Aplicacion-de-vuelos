import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function EsTarjeta(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'EsTarjeta',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: any, args: ValidationArguments) {
                if (typeof value !== 'string') return false;
                // Regla: mínimo 8 caracteres, al menos una letra y un número
                const regex = /^\d{16}$/;
                return regex.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                return "Tarjeta invalida. Debe tener exactamente 16 digitos.";
                },
            },
        });
    };
}