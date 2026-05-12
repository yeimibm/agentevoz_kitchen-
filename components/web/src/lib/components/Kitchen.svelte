<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    connectKitchenSocket,
    getNextKitchenStatus,
    kitchenConnectionStatus,
    kitchenOrders,
    updateKitchenOrderStatus,
  } from "../kitchen";
  import type { KitchenOrder, KitchenOrderStatus } from "../types";

  const statusLabels: Record<KitchenOrderStatus, string> = {
    nuevo: "Nuevo",
    "en preparación": "En preparación",
    listo: "Listo",
  };

  const statusClasses: Record<KitchenOrderStatus, string> = {
    nuevo: "border-amber-300 bg-amber-50 text-amber-900",
    "en preparación": "border-sky-300 bg-sky-50 text-sky-900",
    listo: "border-emerald-300 bg-emerald-50 text-emerald-900",
  };

  let disconnect: (() => void) | undefined;

  onMount(() => {
    disconnect = connectKitchenSocket();
  });

  onDestroy(() => {
    disconnect?.();
  });

  function formatTime(order: KitchenOrder) {
    return new Intl.DateTimeFormat("es-GT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(order.createdAt));
  }

  function advanceStatus(order: KitchenOrder) {
    const nextStatus = getNextKitchenStatus(order.status);
    if (nextStatus) {
      updateKitchenOrderStatus(order.id, nextStatus);
    }
  }
</script>

<main class="min-h-screen bg-neutral-100 text-neutral-950">
  <section class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
    <header class="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-300 pb-5">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Kitchen Display System
        </p>
        <h1 class="text-4xl font-black">Pedidos en cocina</h1>
      </div>

      <div class="flex items-center gap-4">
        <div class="rounded border border-neutral-300 bg-white px-4 py-3 text-right">
          <p class="text-xs font-semibold uppercase text-neutral-500">Pedidos</p>
          <p class="text-3xl font-black">{$kitchenOrders.length}</p>
        </div>
        <div class="rounded border border-neutral-300 bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase text-neutral-500">Realtime</p>
          <p class="font-bold capitalize">{$kitchenConnectionStatus}</p>
        </div>
      </div>
    </header>

    {#if $kitchenOrders.length === 0}
      <div class="grid min-h-96 place-items-center rounded border-2 border-dashed border-neutral-300 bg-white">
        <p class="text-xl font-semibold text-neutral-500">
          Esperando pedidos confirmados desde la experiencia principal.
        </p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each $kitchenOrders as order (order.id)}
          <article class="flex min-h-72 flex-col justify-between rounded border border-neutral-300 bg-white p-5 shadow-sm">
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-3xl font-black">{order.id}</h2>
                  <p class="text-sm font-semibold text-neutral-500">{formatTime(order)}</p>
                </div>
                <span class={`rounded border px-3 py-1 text-sm font-black ${statusClasses[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>

              <ul class="space-y-2 text-lg font-semibold">
                {#each order.items as item}
                  <li class="rounded bg-neutral-100 px-3 py-2">{item}</li>
                {/each}
              </ul>
            </div>

            <button
              class="mt-6 rounded bg-neutral-950 px-4 py-3 text-base font-black text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
              disabled={order.status === "listo"}
              on:click={() => advanceStatus(order)}
            >
              {order.status === "listo"
                ? "Pedido listo"
                : `Avanzar a ${statusLabels[getNextKitchenStatus(order.status) ?? order.status]}`}
            </button>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</main>
