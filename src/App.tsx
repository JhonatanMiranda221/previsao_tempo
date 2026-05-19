import { useEffect, useMemo, useState } from 'react';

type City = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type WeatherResponse = {
  current_weather: {
    temperature: number;
    weathercode: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
};

const weatherDescription = (code: number) => {
  if (code === 0) return 'Céu limpo';
  if (code === 1 || code === 2) return 'Poucas nuvens';
  if (code === 3) return 'Nublado';
  if ([45, 48].includes(code)) return 'Neblina';
  if ([51, 53, 55].includes(code)) return 'Chuva leve';
  if ([61, 63, 65].includes(code)) return 'Chuva';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neve ou granizo';
  if ([80, 81, 82].includes(code)) return 'Chuva moderada';
  return 'Previsão variável';
};

function App() {
  const [search, setSearch] = useState('São Paulo');
  const [city, setCity] = useState<City | null>(null);
  const [forecast, setForecast] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const getWeatherIcon = (code: number, rain = false) => {
    if (rain) return '☔️';
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '⛅️';
    if (code === 3) return '☁️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    return '🌤️';
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<City> => {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=pt&format=json`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const place = data.results[0];
      return {
        name: place.name,
        country: place.country || '',
        admin1: place.admin1,
        latitude,
        longitude,
      };
    }

    return {
      name: 'Sua localização',
      country: '',
      latitude,
      longitude,
    };
  };

  const canRainToday = useMemo(() => {
    if (!forecast) return null;
    return forecast.daily.precipitation_sum[0] > 0;
  }, [forecast]);

  const weeklyForecast = useMemo(() => {
    if (!forecast) return [];
    return forecast.daily.time.map((date, index) => ({
      date,
      max: forecast.daily.temperature_2m_max[index],
      min: forecast.daily.temperature_2m_min[index],
      rain: forecast.daily.precipitation_sum[index] > 0,
    }));
  }, [forecast]);

  useEffect(() => {
    const searchDefault = async () => {
      await handleSearch();
    };
    searchDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearchingCities(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            search,
          )}&count=5&language=pt&format=json`,
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          setSuggestions([]);
          return;
        }

        setSuggestions(
          data.results.map((result: any) => ({
            name: result.name,
            country: result.country,
            admin1: result.admin1,
            latitude: result.latitude,
            longitude: result.longitude,
          })),
        );
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingCities(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchForecastForCity = async (chosenCity: City) => {
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${chosenCity.latitude}&longitude=${chosenCity.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
    );
    const forecastData: WeatherResponse = await forecastRes.json();
    setForecast(forecastData);
    setCity(chosenCity);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não está disponível no seu navegador.');
      return;
    }

    setLoading(true);
    setLocationLoading(true);
    setInfoMessage('Obtendo sua localização...');
    setError('');
    setForecast(null);
    setCity(null);
    setSuggestions([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const chosenCity = await reverseGeocode(latitude, longitude);
          const label = `${chosenCity.name}${chosenCity.admin1 ? `, ${chosenCity.admin1}` : ''}${chosenCity.country ? `, ${chosenCity.country}` : ''}`;
          setSearch(label);
          await fetchForecastForCity(chosenCity);
          setInfoMessage('Localização usada com sucesso.');
        } catch (err) {
          setError('Não foi possível buscar a previsão da sua localização.');
          setInfoMessage('');
        } finally {
          setLoading(false);
          setLocationLoading(false);
        }
      },
      (positionError) => {
        let message = 'Não foi possível obter sua localização.';
        if (positionError.code === positionError.PERMISSION_DENIED) {
          message = 'Permissão negada. Ative o acesso à localização no navegador.';
        } else if (positionError.code === positionError.POSITION_UNAVAILABLE) {
          message = 'Localização indisponível no momento.';
        } else if (positionError.code === positionError.TIMEOUT) {
          message = 'Tempo esgotado. Tente novamente.';
        }

        setError(`${message} Use a busca manual se necessário.`);
        setInfoMessage('');
        setLoading(false);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setError('Informe uma cidade.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');
    setForecast(null);
    setCity(null);
    setSuggestions([]);

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=5&language=pt&format=json`,
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError('Cidade não encontrada.');
        setLoading(false);
        return;
      }

      const bestCity = geoData.results[0];
      const chosenCity: City = {
        name: bestCity.name,
        country: bestCity.country,
        admin1: bestCity.admin1,
        latitude: bestCity.latitude,
        longitude: bestCity.longitude,
      };

      await fetchForecastForCity(chosenCity);
    } catch (err) {
      setError('Erro ao buscar a previsão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: City) => {
    const label = `${suggestion.name}${suggestion.admin1 ? `, ${suggestion.admin1}` : ''}, ${suggestion.country}`;
    setSearch(label);
    setSuggestions([]);
    setSuggestionsVisible(false);
    setLoading(true);
    setError('');
    setForecast(null);

    try {
      await fetchForecastForCity(suggestion);
    } catch {
      setError('Erro ao buscar a previsão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Previsão do Tempo</h1>
        <p>Digite uma cidade para ver a temperatura e se vai chover hoje e na semana.</p>
      </header>

      <section className="search-card">
        <label htmlFor="city-input">Cidade</label>
        <div className="search-row">
          <input
            id="city-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSuggestionsVisible(true)}
            onBlur={() => setTimeout(() => setSuggestionsVisible(false), 150)}
            placeholder="Ex: Rio de Janeiro"
            autoComplete="off"
          />
          <div className="button-group">
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              type="button"
              className="location-button"
              onClick={handleUseLocation}
              disabled={loading}
            >
              {locationLoading ? 'Localizando...' : 'Usar localização'}
            </button>
          </div>
        </div>

        {suggestionsVisible && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.name}-${suggestion.latitude}-${suggestion.longitude}-${index}`}
                type="button"
                className="suggestion-item"
                onMouseDown={() => handleSelectSuggestion(suggestion)}
              >
                <strong>{suggestion.name}</strong>
                <span className="suggestion-meta">
                  {suggestion.admin1 ? `${suggestion.admin1}, ` : ''}
                  {suggestion.country}
                </span>
              </button>
            ))}
          </div>
        )}

        {isSearchingCities && <p className="hint">Buscando cidades...</p>}
        {infoMessage && <p className="hint">{infoMessage}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {city && forecast && (
        <section className="forecast-card">
          <div className="location-row">
            <div>
              <strong>{city.name}</strong>
              <span>{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</span>
            </div>
            <div className="current-weather">
              <span className="weather-icon">
                {getWeatherIcon(forecast.current_weather.weathercode, canRainToday ?? false)}
              </span>
              <span className="temp">{Math.round(forecast.current_weather.temperature)}°C</span>
              <span>{weatherDescription(forecast.current_weather.weathercode)}</span>
            </div>
          </div>

          <div className="today-card">
            <h2>Hoje</h2>
            <p>{canRainToday ? '☔️ Sim, pode chover hoje.' : '☀️ Sem chuva prevista para hoje.'}</p>
          </div>

          <div className="week-grid">
            {weeklyForecast.map((day) => (
              <article key={day.date} className={`day-card ${day.rain ? 'rain' : ''}`}>
                <span>{new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                <strong>{Math.round(day.max)}° / {Math.round(day.min)}°</strong>
                <p>
                  <span className="rain-icon">{day.rain ? '☔️' : '☀️'}</span>
                  {day.rain ? 'Chuva provável' : 'Sem chuva'}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
