import { BAD_REQUEST } from 'http-status-codes';
import {setErrorResponse} from './lib/utils';

export function validate(rules) {
  return async (ctx, next) => {
    const errors = [];

    for (const key in rules) {
      let validKey = true;
      const keyExists = Object.prototype.hasOwnProperty.call(ctx.request.body, key);
      let isRequired = !!rules.key.optional;
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        for (const validator of rules[key].validators) {
          const isValid = await executeValidator(validator, ctx.request.body[key]);

          if (!isValid) {
            validKey = false;
          }
        }

        if ((isRequired || keyExists) && !validKey) {
          errors.push(rules[key].message);
        }
      }
    }

    if (errors.length) {
      setErrorResponse(ctx, BAD_REQUEST, errors);
    } else if (next) {
      await next();
    }
  };
}

async function executeValidator(validator: Predicate, value: unknown): Promise<boolean> {
  return await validator(value);
}
