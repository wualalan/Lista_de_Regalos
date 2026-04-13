import { initialGifts } from '../data/gifts';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

const TABLE_NAME = 'regalos';
const API_BASE_URL = 'supabase';

function mapDbRowToReservation(row) {
  return {
    id: row.id,
    status: row.esta_reservado ? 'reserved' : 'available',
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
  if (!isSupabaseConfigured || !supabase) {
    return initialGifts;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, nombre, reservado_por, esta_reservado')
    .order('id', { ascending: true });

  if (error) {
    console.error('No se pudo leer Supabase, usando lista local.', error);
    return initialGifts;
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
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase no esta configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    );
  }

  const dbPayload = {
    reservado_por: payload.status === 'reserved' ? payload.reservedBy : null,
    esta_reservado: payload.status === 'reserved',
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(dbPayload)
    .eq('id', giftId)
    .select('id, nombre, reservado_por, esta_reservado')
    .single();

  if (error) {
    throw new Error(
      error.message ||
        'Supabase rechazo la actualizacion. Revisa la tabla regalos y las politicas RLS.',
    );
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
