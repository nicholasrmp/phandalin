// As aventuras publicadas da 5ª edição, para a tela de campanha.
//
// Só a primeira está jogável; as outras aparecem desabilitadas, para o jogador
// ver o tamanho do que pode vir. Daqui sai apenas o TÍTULO e o ano de cada
// livro, que são fatos sobre um produto — nenhum texto, mapa ou trama.
//
// A lista foi montada do que se sabe dos lançamentos, e não copiada de site de
// compilação: o ELENCO.md proíbe consultar 5e.tools e afins. Pode faltar
// algum título menor; acrescentar é só mais uma linha.
//
// `titulo` é o nome original do livro. `tituloPt` só existe onde o jogo já usa
// o nome em português.

export const AVENTURAS = [
  { id: 'lmop', titulo: 'Lost Mine of Phandelver', tituloPt: 'A Mina Perdida de Phandelver', ano: 2014, jogavel: true,
    resumo: 'Uma carroça de mantimentos a caminho de Phandalin, uma estrada que não está tão vazia quanto parece, e um boato sobre uma mina perdida nas colinas. Do 1º ao 5º nível.' },
  { id: 'hotdq', titulo: 'Hoard of the Dragon Queen', ano: 2014 },
  { id: 'rot', titulo: 'The Rise of Tiamat', ano: 2014 },
  { id: 'pota', titulo: 'Princes of the Apocalypse', ano: 2015 },
  { id: 'oota', titulo: 'Out of the Abyss', ano: 2015 },
  { id: 'cos', titulo: 'Curse of Strahd', ano: 2016 },
  { id: 'skt', titulo: "Storm King's Thunder", ano: 2016 },
  { id: 'tftyp', titulo: 'Tales from the Yawning Portal', ano: 2017 },
  { id: 'toa', titulo: 'Tomb of Annihilation', ano: 2017 },
  { id: 'wdh', titulo: 'Waterdeep: Dragon Heist', ano: 2018 },
  { id: 'wdmm', titulo: 'Waterdeep: Dungeon of the Mad Mage', ano: 2018 },
  { id: 'llk', titulo: 'Lost Laboratory of Kwalish', ano: 2018 },
  { id: 'gos', titulo: 'Ghosts of Saltmarsh', ano: 2019 },
  { id: 'dip', titulo: 'Dragon of Icespire Peak', ano: 2019 },
  { id: 'slw', titulo: "Storm Lord's Wrath", ano: 2019 },
  { id: 'hftt', titulo: 'Hunt for the Thessalhydra', ano: 2019 },
  { id: 'bgdia', titulo: "Baldur's Gate: Descent into Avernus", ano: 2019 },
  { id: 'imr', titulo: 'Infernal Machine Rebuild', ano: 2019 },
  { id: 'rmbre', titulo: 'Dungeons & Dragons vs. Rick and Morty', ano: 2019 },
  { id: 'sdw', titulo: "Sleeping Dragon's Wake", ano: 2020 },
  { id: 'dc', titulo: 'Divine Contention', ano: 2020 },
  { id: 'fs', titulo: 'Frozen Sick', ano: 2020 },
  { id: 'idrotf', titulo: 'Icewind Dale: Rime of the Frostmaiden', ano: 2020 },
  { id: 'cm', titulo: 'Candlekeep Mysteries', ano: 2021 },
  { id: 'wbtw', titulo: 'The Wild Beyond the Witchlight', ano: 2021 },
  { id: 'jttrc', titulo: 'Journeys through the Radiant Citadel', ano: 2022 },
  { id: 'cotn', titulo: 'Call of the Netherdeep', ano: 2022 },
  { id: 'lox', titulo: 'Spelljammer: Light of Xaryxis', ano: 2022 },
  { id: 'dsotdq', titulo: 'Dragonlance: Shadow of the Dragon Queen', ano: 2022 },
  { id: 'dosi', titulo: 'Dragons of Stormwreck Isle', ano: 2022 },
  { id: 'kftgv', titulo: 'Keys from the Golden Vault', ano: 2023 },
  { id: 'pabtso', titulo: 'Phandelver and Below: The Shattered Obelisk', ano: 2023 },
  { id: 'veor', titulo: 'Vecna: Eve of Ruin', ano: 2024 },
  { id: 'qftis', titulo: 'Quests from the Infinite Staircase', ano: 2024 },
  { id: 'hotb', titulo: 'Heroes of the Borderlands', ano: 2025 },
];
