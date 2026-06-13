import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function NoDuplicateByKey(
  key: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'noDuplicateByKey',
      target: object.constructor,
      propertyName,
      constraints: [key],
      options: validationOptions,
      validator: {
        validate(value: any[], args: ValidationArguments) {
          if (!Array.isArray(value)) return true;

          const [key] = args.constraints;
          const seen = new Set();

          for (const item of value) {
            const val = item?.[key];
            if (val === undefined || val === null) continue;

            if (seen.has(val)) return false;
            seen.add(val);
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [key] = args.constraints;
          return `Duplicate ${key} found`;
        },
      },
    });
  };
}
