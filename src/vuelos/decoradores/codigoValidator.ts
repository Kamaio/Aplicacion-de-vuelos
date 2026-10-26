import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function EsCodigo(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'EsCodigo',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: any, args: ValidationArguments) {
                if (typeof value !== 'string') return false;
                // Regla: GA-[4 numeros]
                const regex = /^GA-\d{4}$/;
                return regex.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                return "Codigo invalido. Estructura: GA en mayusculas, un guion pegado y 4 números.";
                },
            },
        });
    };
}