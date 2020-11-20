export function setErrorResponse(ctx, status, message) {
    ctx.status = status;
    ctx.body = { error: { message } };
    ctx.res.setHeader('Cache-Control', 'no-cache');
    return ctx;
}