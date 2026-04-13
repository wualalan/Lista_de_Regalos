import { initialGifts } from '../data/gifts';
import { supabase } from '../supabaseClient';

const TABLE_NAME = 'regalos';
const API_BASE_URL = 'supabase';

function mapDbRowToReservation(row) {
  return {
    id: row.id,
    status: row.disponible === false ? 'reserved' : 'available',
    reservedBy: row.reservado_por ?? '',
  };
}

function mergeGiftWithReservation(gift, reservation) {
  if (!reservation) {
    return gift;
  }

  return {
    ...gift,
    status: reservation.status,
    reservedBy: reservation.reservedBy,
    priority:
      reservation.status === 'reserved'
        ? 'Reservado ahora'
        : gift.priority || 'Disponible',
  };
}

export async function fetchGifts() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, reservado_por, disponible')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  const reservationsById = new Map(
    (data ?? []).map((row) => {
      const reservation = mapDbRowToReservation(row);
      return [reservation.id, reservation];
    }),
  );

  return initialGifts.map((gift) =>
    mergeGiftWithReservation(gift, reservationsById.get(gift.id)),
  );
}

export async function updateGiftReservation(giftId, payload) {
  const dbPayload = {
    reservado_por: payload.status === 'reserved' ? payload.reservedBy : null,
    disponible: payload.status !== 'reserved',
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(dbPayload)
    .eq('id', giftId)
    .select('id, reservado_por, disponible')
    .single();

  if (error) {
    throw error;
  }

  const reservation = mapDbRowToReservation(data);
  const baseGift = initialGifts.find((gift) => gift.id === giftId);

  return baseGift
    ? mergeGiftWithReservation(baseGift, reservation)
    : {
        id: giftId,
        ...payload,
        status: reservation.status,
        reservedBy: reservation.reservedBy,
      };
}

export { API_BASE_URL, TABLE_NAME };
