import { useEffect, useMemo, useState } from 'react';
import { fetchGifts, updateGiftReservation } from './services/giftApi';

const filters = ['Todos', 'Disponibles', 'Reservados'];

function App() {
  const [gifts, setGifts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadGifts() {
      try {
        // Referencia de la consulta directa a Supabase:
        // const { data, error } = await supabase
        //   .from('regalos')
        //   .select('*');
        const data = await fetchGifts();
        if (active) {
          setGifts(data);
          setSelectedGift(data[0] ?? null);
        }
      } catch (loadError) {
        if (active) {
          setError('No pudimos cargar la lista por ahora.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGifts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (gifts.length === 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % gifts.length);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [gifts]);

  const stats = useMemo(() => {
    const reserved = gifts.filter((gift) => gift.status === 'reserved').length;
    return {
      total: gifts.length,
      reserved,
      available: gifts.length - reserved,
    };
  }, [gifts]);

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const matchesFilter =
        selectedFilter === 'Todos' ||
        (selectedFilter === 'Disponibles' && gift.status === 'available') ||
        (selectedFilter === 'Reservados' && gift.status === 'reserved');

      const term = search.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        gift.title.toLowerCase().includes(term) ||
        gift.category.toLowerCase().includes(term) ||
        gift.description.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [gifts, search, selectedFilter]);

  async function handleReserve(gift) {
    if (!name.trim()) {
      setError('Escribe tu nombre para apartar un regalo.');
      return;
    }

    setError('');
    setSavingId(gift.id);

    const updatedGift = {
      ...gift,
      status: 'reserved',
      reservedBy: name.trim(),
      priority: 'Reservado ahora',
    };

    try {
      await updateGiftReservation(gift.id, updatedGift);
      setGifts((current) =>
        current.map((item) => (item.id === gift.id ? updatedGift : item)),
      );
      setSelectedGift(updatedGift);
    } catch (saveError) {
      setError('No se pudo guardar la reserva.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleRelease(gift) {
    setError('');
    setSavingId(gift.id);

    const updatedGift = {
      ...gift,
      status: 'available',
      reservedBy: '',
      priority: 'Disponible de nuevo',
    };

    try {
      await updateGiftReservation(gift.id, updatedGift);
      setGifts((current) =>
        current.map((item) => (item.id === gift.id ? updatedGift : item)),
      );
      if (selectedGift?.id === gift.id) {
        setSelectedGift(updatedGift);
      }
    } catch (saveError) {
      setError('No se pudo liberar la reserva.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="page-shell">
      <div className="aurora aurora-left" />
      <div className="aurora aurora-right" />

      <main className="layout">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Lista colaborativa de regalos</span>
            <h1>Elijan el regalo perfecto y eviten repetir compras.</h1>
            <p>
              Todos pueden ver la lista, revisar qué está disponible y apartar
              una opción en segundos desde cualquier navegador.
            </p>

            <div className="hero-actions">
              <label className="name-input">
                <span>Tu nombre</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej: Sofía"
                />
              </label>

              <div className="stats-grid">
                <article>
                  <strong>{stats.total}</strong>
                  <span>Opciones</span>
                </article>
                <article>
                  <strong>{stats.available}</strong>
                  <span>Disponibles</span>
                </article>
                <article>
                  <strong>{stats.reserved}</strong>
                  <span>Reservados</span>
                </article>
              </div>
            </div>
          </div>

          <aside className="hero-card">
            <p className="hero-card-label">Carrusel de regalos</p>

            <div className="carousel-window">
              <div
                className="carousel-track"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {gifts.map((gift) => (
                  <div key={gift.id} className="carousel-slide">
                    <img src={gift.image} alt={gift.title} />
                    <div className="carousel-overlay">
                      <span>{gift.category}</span>
                      <strong>{gift.title}</strong>
                      <small>{gift.price}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="carousel-dots">
              {gifts.map((gift, index) => (
                <button
                  key={gift.id}
                  type="button"
                  className={index === carouselIndex ? 'active' : ''}
                  onClick={() => setCarouselIndex(index)}
                  aria-label={`Ver ${gift.title}`}
                />
              ))}
            </div>

            <h2>{selectedGift?.title || 'Haz clic en un regalo para verlo aquí'}</h2>
            <p>
              {selectedGift?.description ||
                'Selecciona una tarjeta para revisar el detalle del regalo.'}
            </p>

            <div className="selected-status">
              <span>
                {selectedGift?.sourceLabel || 'Precio de referencia'}
              </span>
              <strong>{selectedGift?.price || 'Lista compartida'}</strong>
            </div>
          </aside>
        </section>

        <section className="toolbar">
          <div className="filter-group">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={filter === selectedFilter ? 'active' : ''}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="search-box">
            <span>Buscar regalo</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Perfume, flores, cena..."
            />
          </label>
        </section>

        {error ? <p className="error-banner">{error}</p> : null}

        <section className="gift-grid">
          {loading ? (
            <div className="empty-state">Cargando regalos...</div>
          ) : filteredGifts.length === 0 ? (
            <div className="empty-state">
              No encontramos regalos con ese filtro.
            </div>
          ) : (
            filteredGifts.map((gift) => {
              const isReserved = gift.status === 'reserved';
              const isSaving = savingId === gift.id;

              return (
                <article
                  key={gift.id}
                  className={`gift-card ${isReserved ? 'reserved' : ''}`}
                  onClick={() => setSelectedGift(gift)}
                >
                  <div
                    className="gift-image"
                    style={{ backgroundImage: `url(${gift.image})` }}
                  >
                    <span className="priority-pill">{gift.priority}</span>
                  </div>

                  <div className="gift-content">
                    <div className="gift-heading">
                      <span>{gift.category}</span>
                      <strong>{gift.price}</strong>
                    </div>

                    <h3>{gift.title}</h3>
                    <p>{gift.description}</p>

                    <div className="gift-footer">
                      <small>
                        {isReserved
                          ? `Reservado por ${gift.reservedBy}`
                          : gift.sourceLabel || 'Disponible para apartar'}
                      </small>

                      {isReserved ? (
                        <button
                          type="button"
                          className="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRelease(gift);
                          }}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Liberando...' : 'Liberar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReserve(gift);
                          }}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Guardando...' : 'Apartar regalo'}
                        </button>
                      )}
                    </div>

                    {gift.sourceUrl ? (
                      <a
                        className="source-link"
                        href={gift.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver referencia
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
