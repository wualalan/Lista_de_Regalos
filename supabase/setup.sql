create table if not exists public.regalos (
  id bigint primary key,
  nombre text,
  reservado_por text,
  esta_reservado boolean not null default false
);

alter table public.regalos enable row level security;

drop policy if exists "regalos_select_public" on public.regalos;
create policy "regalos_select_public"
on public.regalos
for select
to anon
using (true);

drop policy if exists "regalos_update_public" on public.regalos;
create policy "regalos_update_public"
on public.regalos
for update
to anon
using (true)
with check (true);

insert into public.regalos (id, nombre, reservado_por, esta_reservado)
values
  (1, 'Mat de yoga D3', null, false),
  (2, 'Aros', null, false),
  (3, 'Chocolate Costa Rama', null, false),
  (4, 'Colet', null, false),
  (5, 'Plumones de pizarra de colores y borrador', null, false),
  (6, 'Carcasa iPhone XR', null, false),
  (7, 'Agua micelar Garnier Todo en 1 700 ml', null, false),
  (8, 'Libro Quedara el amor', null, false),
  (9, 'Libros Juegos del Hambre', null, false),
  (10, 'Delineador negro', null, false),
  (11, 'Perfilador de labios', null, false),
  (12, 'Brillo labial NYX Fat Oil', null, false),
  (13, 'Rubor rosa', null, false),
  (14, 'Encrespador', null, false),
  (15, 'Spray protector de calor para el pelo', null, false),
  (16, 'Esponjas para maquillaje', null, false),
  (17, 'Peluche de ositos carinositos', null, false),
  (18, 'Paleta de sombra de ojos DBS', null, false),
  (19, 'Crema para manos Natura castana', null, false),
  (20, 'Squishy antiestres', null, false),
  (21, 'Velas aromaticas', null, false),
  (22, 'Mascarillas faciales', null, false),
  (23, 'Tazas bonitas rosadas', null, false),
  (24, 'Pinches grandes para pelo', null, false),
  (25, 'Botella para agua', null, false),
  (26, 'Guantes de gimnasio rosados', null, false),
  (27, 'Polera para el gimnasio talla M', null, false),
  (28, 'Billetera Todomoda', null, false),
  (29, 'Cepillo para pelo', null, false),
  (30, 'Cinturon negro Todomoda', null, false)
on conflict (id) do nothing;
