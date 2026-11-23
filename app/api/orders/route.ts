import { body, json, route } from "@/lib/server/http";
import { OrderIn, createOrder, orderView } from "@/lib/server/orders";
import { startOrderCard } from "@/lib/server/modempay";
import { siteUrl } from "@/lib/server/messages";

/*
 * Pay first. Wave, Yonna, Ecobank, Remitly/ACE: the person has paid and gives the reference from their receipt; the
 * order is claimed and they go on to their details. Card: the order is opened and the browser goes to Modem Pay; it
 * comes back to the payment step, which checks the payment before letting them on.
 */
export const POST = route(async (req: Request) => {
  const input = await body(req, OrderIn);
  const o = await createOrder(input);
  const view = await orderView(o);
  if (o.method !== "card") return json({ order: view, token: o.token }, 201);
  const back = `${siteUrl()}/register/payment?order=${o.id}&t=${encodeURIComponent(o.token)}`;
  const s = await startOrderCard(o, { back, site: siteUrl() });
  return json({ order: view, token: o.token, url: s.url }, 201);
});
