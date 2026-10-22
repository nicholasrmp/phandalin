// LOOKS dos NPCs da campanha: gente que fala, negocia, contrata e trai.
//
// Pareia com `rules/npcs.js`. Um NPC não precisa de bloco de combate próprio —
// quase todos usam um bloco do SRD (plebeu, guarda, cavaleiro, mago, acólito).
// O que ele precisa é de um rosto que o jogador reconheça da segunda vez.
//
// CAMPOS DO LOOK
//   CORPO     species  humano|elfo|anao|halfling|goblin|hobgoblin|bugbear|orc|...
//             build    magro|normal|forte|gordo
//             heightMul  ajuste fino de altura dentro da espécie (1 = padrão)
//             plan     nome de um plano corporal de `art/plans/` para quem não
//                      é humanoide (aracnideo, gosma, mortoVivo, dragao, ...)
//   CORES     skin, hair, outfit, outfitDark, trim, metal, leather, eyes,
//             glow, cloak, noseTint
//   ESTRUTURA hairStyle  spiky|long|short|bald|hood
//             armorStyle robe|leather|scale|plate
//             weapon     sword|dagger|mace|staff|bow|axe
//             helm, shield, beard, horns: boolean
//
// A anatomia sai de `body.js` e o traço de `draw.js`. Aqui só entram dados.

export const NPC_LOOKS = {
};
