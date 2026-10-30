/**
 * Configurações e constantes da aplicação.
 *
 * Centraliza todas as configurações, constantes e valores
 * padrão usados pela aplicação.
 */

/**
 * Cores dos jogadores no multiplayer (para alfinetes e identificação).
 */
export const CORES_DOS_JOGADORES = [
  "#ff6b6b", // vermelho
  "#4ecdc4", // ciano
  "#ffe66d", // amarelo
  "#a8e6cf", // verde claro
  "#ff8b94", // rosa
  "#c7ceea", // azul claro
  "#ffd3b6", // laranja claro
  "#dcedc1", // verde pastel
];

/**
 * Magias de utilidade que podem ser conjuradas fora de combate
 * e que precisam de tratamento especial no multiplayer.
 */
export const UTIL_FORA = new Set([
  "light",
  "detectMagic",
  "findFamiliar",
  "alarm",
  "enhanceAbility",
  "aid",
  "darkvision",
  "invisibility",
  "passWithoutTrace",
  "protectionFromEnergy",
  "tongues",
  "arcaneEye",
  "greaterInvisibility",
]);

/**
 * Frases prontas que jogadores podem usar no multiplayer.
 */
export const FRASES_DA_PARTIDA = [
  { id: "ok", texto: "OK!" },
  { id: "espera", texto: "Espera!" },
  { id: "vamos", texto: "Vamos!" },
  { id: "cuidado", texto: "Cuidado!" },
  { id: "ajuda", texto: "Ajuda!" },
  { id: "recuar", texto: "Recuar!" },
  { id: "atacar", texto: "Atacar!" },
  { id: "curar", texto: "Curar!" },
];

/**
 * Configurações de autosave.
 */
export const AUTOSAVE_CONFIG = {
  // Intervalo de autosave em milissegundos (30 segundos)
  interval: 30_000,

  // Slots de autosave
  slots: ["auto-1", "auto-2", "auto-3"],

  // Número máximo de autosaves
  maxAutosaves: 3,
};

/**
 * Configurações de animação.
 */
export const ANIMATION_CONFIG = {
  // Duração padrão de animações em segundos
  defaultDuration: 0.5,

  // Delay de impacto padrão
  defaultImpactDelay: 0,

  // Duração de animação de ataque
  attackDuration: 0.28,

  // Duração de animação de dano
  damageDuration: 0.22,

  // Duração de hit stop
  hitStopDuration: 0.17,
};

/**
 * Configurações de combate.
 */
export const COMBAT_CONFIG = {
  // Tempo de espera após movimento (ms)
  walkWaitMs: 300,

  // Tempo de espera após ação (ms)
  actionWaitMs: 700,

  // Tempo de espera do piloto automático (ms)
  autoPilotWaitMs: 300,

  // Número máximo de tentativas do piloto
  autoPilotMaxRetries: 40,
};

/**
 * Configurações de multiplayer.
 */
export const MULTIPLAYER_CONFIG = {
  // Intervalo de publicação de vista (ms)
  vistaPublishInterval: 250,

  // Timeout para escolhas de nível (ms)
  levelUpTimeout: 120_000, // 2 minutos

  // Timeout para respostas de narrativa (ms)
  narrativeTimeout: 300_000, // 5 minutos

  // Limite de eventos pendentes
  maxPendingEvents: 100,

  // Intervalo de atualização de presença (ms)
  presenceUpdateInterval: 1000,
};

/**
 * Configurações de UI.
 */
export const UI_CONFIG = {
  // Intervalo de atualização de novidades (ms)
  novidadesUpdateInterval: 100,

  // Duração de mensagens de recusa (ms)
  refuseDuration: 2000,

  // Duração de dicas contextuais (ms)
  tipDuration: 900,

  // Limite de novidades no registro
  maxNovidades: 99,
};

/**
 * Configurações de descanso.
 */
export const REST_CONFIG = {
  // Duração de descanso curto em minutos
  shortRestDuration: 60,

  // Duração de descanso longo em minutos
  longRestDuration: 480, // 8 horas

  // Timeout de votação de descanso (ms)
  restVoteTimeout: 60_000, // 1 minuto
};

/**
 * Configurações de save/load.
 */
export const SAVE_CONFIG = {
  // Número máximo de saves manuais
  maxManualSaves: 10,

  // Prefixo de saves automáticos
  autoSavePrefix: "auto-",

  // Prefixo de saves manuais
  manualSavePrefix: "save-",

  // Versão do formato de save
  saveFormatVersion: 1,
};

/**
 * Modos de jogo disponíveis.
 */
export const GAME_MODES = {
  CAMPAIGN: "campanha",
  ARENA: "arena",
};

/**
 * Tipos de local.
 */
export const LOCATION_TYPES = {
  SCENE: "cena",
  VILLAGE: "vila",
  REGION: "regiao",
};

/**
 * Configurações de debug.
 */
export const DEBUG_CONFIG = {
  // Habilitar logs de debug
  enableLogs: false,

  // Habilitar profiling
  enableProfiling: false,

  // Habilitar visualização de pathfinding
  showPathfinding: false,

  // Habilitar visualização de alcance
  showRange: false,
};

/**
 * Obtém configuração por chave.
 *
 * @param {string} key - Chave da configuração
 * @param {*} defaultValue - Valor padrão se não encontrado
 * @returns {*} Valor da configuração
 */
export function getConfig(key, defaultValue = null) {
  const configs = {
    ...AUTOSAVE_CONFIG,
    ...ANIMATION_CONFIG,
    ...COMBAT_CONFIG,
    ...MULTIPLAYER_CONFIG,
    ...UI_CONFIG,
    ...REST_CONFIG,
    ...SAVE_CONFIG,
    ...DEBUG_CONFIG,
  };

  return configs[key] ?? defaultValue;
}

/**
 * Valida se um modo de jogo é válido.
 *
 * @param {string} mode - Modo a validar
 * @returns {boolean} true se válido
 */
export function isValidGameMode(mode) {
  return Object.values(GAME_MODES).includes(mode);
}

/**
 * Valida se um tipo de local é válido.
 *
 * @param {string} type - Tipo a validar
 * @returns {boolean} true se válido
 */
export function isValidLocationType(type) {
  return Object.values(LOCATION_TYPES).includes(type);
}
