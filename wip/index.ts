import Router from '@koa/router';
import { BAD_REQUEST } from 'http-status-codes';
import { setErrorResponse } from '../routes/utils';
import { required } from './predicates';

type Predicate = (value: unknown, options?: any) => boolean | Promise<boolean>;

export const VALIDATOR_TYPE = Object.freeze({
  PARAMS: 'params',
  BODY: 'body',
  QUERY_PARAMS: 'query-params',
});

export function validate(rules: Record<string, any>) {
  return async (ctx: Router.RouterContext, next: () => Promise<void>) => {
    const errors: string[] = [];

    for (const key in rules) {
      let validKey = true;
      const keyExists = Object.prototype.hasOwnProperty.call(ctx.request.body, key);
      let isRequired = false;
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        for (const validator of rules[key].validators) {
          const isValid = await executeValidator(rules[key], key, ctx, validator);
          if (validator === required) {
            isRequired = true;
          }

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

async function executeValidator(
  rule: Record<string, any>,
  key: string,
  ctx: Router.RouterContext,
  validator: Predicate,
): Promise<boolean> {
  const value = getValue(rule, key, ctx);
  return await validator(value, ctx);
}

function getValue(rule: Record<string, any>, key: string, ctx: Router.RouterContext): unknown {
  let value;

  switch (rule.type) {
    case VALIDATOR_TYPE.PARAMS:
      value = ctx.params[key];
      break;
    case VALIDATOR_TYPE.BODY:
      value = ctx.request.body[key];
      break;
    case VALIDATOR_TYPE.QUERY_PARAMS:
      value = ctx.query[key];
      break;
    default:
      value = ctx.request.body[key];
      break;
  }

  return value;
}
