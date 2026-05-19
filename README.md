# Previsão do Tempo

Aplicação simples em React + Vite para consultar previsão do tempo por cidade.

Funcionalidades
- Busca por cidade com sugestões enquanto digita (autocompletar).
- Mostra temperatura atual e descrição do tempo.
- Indica se há previsão de chuva para hoje e para a semana.
- Botão `Usar localização` para obter previsão baseada na sua posição (quando permitido).

Fontes de dados
- Geocoding e reverse-geocoding: Open-Meteo Geocoding API
- Previsões: Open-Meteo Forecast API

Pré-requisitos
- Node.js 18+ e npm
- Navegador moderno (recomendado Chrome/Firefox)

Instalação
```bash
cd /home/jhonatan/Documentos/clima_tempo
npm install
```

Executando em desenvolvimento
```bash
npm run dev
```
Abra o navegador em `http://localhost:5173` (o Vite mostra a URL no terminal).

Build para produção
```bash
npm run build
npm run preview
```

Observações sobre geolocalização
- O botão `Usar localização` pede permissão ao navegador. Garanta que você permita o acesso.
- Geolocalização geralmente não funciona em `file://`. Rode o servidor (`npm run dev`) ou publique em `https://`.
- Se o navegador negar permissão, use a busca manual pela cidade.

Arquivos importantes
- `src/App.tsx` — lógica principal: buscas, autocomplete, geolocalização e exibição das previsões.
- `src/index.css` — estilos do app.

Testes rápidos
- Busque por uma cidade (ex: `Osasco`) e selecione a opção correta na lista de sugestões.
- Clique em `Usar localização` e permita o acesso quando solicitado.

Próximos passos recomendados
- Mostrar percentual de precipitação (se dados estiverem disponíveis).
- Adicionar ícones gráficos (SVG) para diferentes condições climáticas.
- Internacionalização (i18n) para múltiplos idiomas.

Contato
- Se quiser que eu adicione melhorias, me diga quais recursos prefere (ex.: gráficos, armazenamento local, tema escuro).
