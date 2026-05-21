const DEPRECATED_CHECKOUT_MESSAGE =
  "checkout endpoint deprecated; use /api/subscription/create";

function checkoutDeprecatedResponse() {
  return Response.json(
    {
      code: -1,
      message: DEPRECATED_CHECKOUT_MESSAGE,
    },
    { status: 410 }
  );
}

export async function POST(_req?: Request) {
  return checkoutDeprecatedResponse();
}

export async function GET(_req?: Request) {
  return checkoutDeprecatedResponse();
}
