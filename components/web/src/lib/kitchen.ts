import { writable } from "svelte/store";
import type {
  KitchenOrder,
  KitchenOrderStatus,
  KitchenServerEvent,
} from "./types";

export const kitchenOrders = writable<KitchenOrder[]>([]);
export const kitchenConnectionStatus = writable<
  "connecting" | "connected" | "disconnected" | "error"
>("disconnected");

let ws: WebSocket | null = null;

function upsertOrder(order: KitchenOrder) {
  kitchenOrders.update((orders) => {
    const existingIndex = orders.findIndex((candidate) => candidate.id === order.id);
    if (existingIndex === -1) return [order, ...orders];

    const nextOrders = [...orders];
    nextOrders[existingIndex] = order;
    return nextOrders;
  });
}

function handleKitchenEvent(event: KitchenServerEvent) {
  switch (event.type) {
    case "orders_snapshot":
      kitchenOrders.set(event.orders);
      break;
    case "order_created":
    case "order_status_updated":
      upsertOrder(event.order);
      break;
  }
}

export function connectKitchenSocket() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return () => ws?.close();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${window.location.host}/kitchen-ws`);
  kitchenConnectionStatus.set("connecting");

  ws.onopen = () => kitchenConnectionStatus.set("connected");
  ws.onmessage = (event) => handleKitchenEvent(JSON.parse(event.data));
  ws.onerror = () => kitchenConnectionStatus.set("error");
  ws.onclose = () => {
    kitchenConnectionStatus.set("disconnected");
    ws = null;
  };

  return () => ws?.close();
}

export function updateKitchenOrderStatus(
  orderId: string,
  status: KitchenOrderStatus
) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: "update_order_status",
      orderId,
      status,
    })
  );
}

export function getNextKitchenStatus(
  status: KitchenOrderStatus
): KitchenOrderStatus | null {
  if (status === "nuevo") return "en preparación";
  if (status === "en preparación") return "listo";
  return null;
}
