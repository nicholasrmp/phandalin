// GERADO por src/dev/importar-tesouro.mjs — não editar à mão. As tabelas de tesouro do Livro do Mestre (o número é do
// livro), com o id do jogo no lugar do nome do item; `null` é o item que o jogo não tem (o sorteio rola de novo), e
// `{ ficha }` é o que se sorteia na hora (`rules/tesouro.js`).
export const TESOURO_INDIVIDUAL = [{"ndMin":0,"ndMax":4,"linhas":[{"min":1,"max":30,"moedas":{"cp":"5d6"}},{"min":31,"max":60,"moedas":{"sp":"4d6"}},{"min":61,"max":70,"moedas":{"ep":"3d6"}},{"min":71,"max":95,"moedas":{"gp":"3d6"}},{"min":96,"max":100,"moedas":{"pp":"1d6"}}]},{"ndMin":5,"ndMax":10,"linhas":[{"min":1,"max":30,"moedas":{"cp":"4d6*100","ep":"1d6*10"}},{"min":31,"max":60,"moedas":{"sp":"6d6*10","gp":"2d6*10"}},{"min":61,"max":70,"moedas":{"ep":"3d6*10","gp":"2d6*10"}},{"min":71,"max":95,"moedas":{"gp":"4d6*10"}},{"min":96,"max":100,"moedas":{"gp":"2d6*10","pp":"3d6"}}]},{"ndMin":11,"ndMax":16,"linhas":[{"min":1,"max":20,"moedas":{"sp":"4d6*100","gp":"1d6*100"}},{"min":21,"max":35,"moedas":{"ep":"1d6*100","gp":"1d6*100"}},{"min":36,"max":75,"moedas":{"gp":"2d6*100","pp":"1d6*10"}},{"min":76,"max":100,"moedas":{"gp":"2d6*100","pp":"2d6*10"}}]},{"ndMin":17,"ndMax":30,"linhas":[{"min":1,"max":15,"moedas":{"ep":"2d6*1000","gp":"8d6*100"}},{"min":16,"max":55,"moedas":{"gp":"1d6*1000","pp":"1d6*100"}},{"min":56,"max":100,"moedas":{"gp":"1d6*1000","pp":"2d6*100"}}]}];
export const TESOURO_DO_COVIL = [{"ndMin":0,"ndMax":4,"moedas":{"cp":"6d6*100","sp":"3d6*100","gp":"2d6*10"},"linhas":[{"min":1,"max":6},{"min":7,"max":16,"gemas":{"valor":10,"qtd":"2d6"}},{"min":17,"max":26,"arte":{"valor":25,"qtd":"2d4"}},{"min":27,"max":36,"gemas":{"valor":50,"qtd":"2d6"}},{"min":37,"max":44,"gemas":{"valor":10,"qtd":"2d6"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":45,"max":52,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":53,"max":60,"gemas":{"valor":50,"qtd":"2d6"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":61,"max":65,"gemas":{"valor":10,"qtd":"2d6"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":66,"max":70,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":71,"max":75,"gemas":{"valor":50,"qtd":"2d6"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":76,"max":78,"gemas":{"valor":10,"qtd":"2d6"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":79,"max":80,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":81,"max":85,"gemas":{"valor":50,"qtd":"2d6"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":86,"max":92,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":93,"max":97,"gemas":{"valor":50,"qtd":"2d6"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":98,"max":99,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"G","qtd":"1"}]},{"min":100,"max":100,"gemas":{"valor":50,"qtd":"2d6"},"magicos":[{"tabela":"G","qtd":"1"}]}]},{"ndMin":5,"ndMax":10,"moedas":{"cp":"2d6*100","sp":"2d6*1000","gp":"6d6*100","pp":"3d6*10"},"linhas":[{"min":1,"max":4},{"min":5,"max":10,"arte":{"valor":25,"qtd":"2d4"}},{"min":11,"max":16,"gemas":{"valor":50,"qtd":"3d6"}},{"min":17,"max":22,"gemas":{"valor":100,"qtd":"3d6"}},{"min":23,"max":28,"arte":{"valor":250,"qtd":"2d4"}},{"min":29,"max":32,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":33,"max":36,"gemas":{"valor":50,"qtd":"3d6"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":37,"max":40,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":41,"max":44,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"A","qtd":"1d6"}]},{"min":45,"max":49,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":50,"max":54,"gemas":{"valor":50,"qtd":"3d6"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":55,"max":59,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":60,"max":63,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"B","qtd":"1d4"}]},{"min":64,"max":66,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":67,"max":69,"gemas":{"valor":50,"qtd":"3d6"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":70,"max":72,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":73,"max":74,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"C","qtd":"1d4"}]},{"min":75,"max":76,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"D","qtd":"1"}]},{"min":77,"max":78,"gemas":{"valor":50,"qtd":"3d6"},"magicos":[{"tabela":"D","qtd":"1"}]},{"min":79,"max":79,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"D","qtd":"1"}]},{"min":80,"max":80,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"D","qtd":"1"}]},{"min":81,"max":84,"arte":{"valor":25,"qtd":"2d4"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":85,"max":88,"gemas":{"valor":50,"qtd":"3d6"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":89,"max":91,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":92,"max":94,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"F","qtd":"1d4"}]},{"min":95,"max":96,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":97,"max":98,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":99,"max":99,"gemas":{"valor":100,"qtd":"3d6"},"magicos":[{"tabela":"H","qtd":"1"}]},{"min":100,"max":100,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"H","qtd":"1"}]}]},{"ndMin":11,"ndMax":16,"moedas":{"gp":"4d6*1000","pp":"5d6*100"},"linhas":[{"min":1,"max":3},{"min":4,"max":6,"arte":{"valor":250,"qtd":"2d4"}},{"min":7,"max":9,"arte":{"valor":750,"qtd":"2d4"}},{"min":10,"max":12,"gemas":{"valor":500,"qtd":"3d6"}},{"min":13,"max":15,"gemas":{"valor":1000,"qtd":"3d6"}},{"min":16,"max":19,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"A","qtd":"1d4"},{"tabela":"B","qtd":"1d6"}]},{"min":20,"max":23,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"A","qtd":"1d4"},{"tabela":"B","qtd":"1d6"}]},{"min":24,"max":26,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"A","qtd":"1d4"},{"tabela":"B","qtd":"1d6"}]},{"min":27,"max":29,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"A","qtd":"1d4"},{"tabela":"B","qtd":"1d6"}]},{"min":30,"max":35,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"C","qtd":"1d6"}]},{"min":36,"max":40,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"C","qtd":"1d6"}]},{"min":41,"max":45,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"C","qtd":"1d6"}]},{"min":46,"max":50,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"C","qtd":"1d6"}]},{"min":51,"max":54,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"D","qtd":"1d4"}]},{"min":55,"max":58,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"D","qtd":"1d4"}]},{"min":59,"max":62,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"D","qtd":"1d4"}]},{"min":63,"max":66,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"D","qtd":"1d4"}]},{"min":67,"max":68,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"E","qtd":"1"}]},{"min":69,"max":70,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"E","qtd":"1"}]},{"min":71,"max":72,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"E","qtd":"1"}]},{"min":73,"max":74,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"E","qtd":"1"}]},{"min":75,"max":76,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"F","qtd":"1"},{"tabela":"G","qtd":"1d4"}]},{"min":77,"max":78,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"F","qtd":"1"},{"tabela":"G","qtd":"1d4"}]},{"min":79,"max":80,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"F","qtd":"1"},{"tabela":"G","qtd":"1d4"}]},{"min":81,"max":82,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"F","qtd":"1"},{"tabela":"G","qtd":"1d4"}]},{"min":83,"max":85,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":86,"max":88,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":89,"max":90,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":91,"max":92,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":93,"max":94,"arte":{"valor":250,"qtd":"2d4"},"magicos":[{"tabela":"I","qtd":"1"}]},{"min":95,"max":96,"arte":{"valor":750,"qtd":"2d4"},"magicos":[{"tabela":"I","qtd":"1"}]},{"min":97,"max":98,"gemas":{"valor":500,"qtd":"3d6"},"magicos":[{"tabela":"I","qtd":"1"}]},{"min":99,"max":100,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"I","qtd":"1"}]}]},{"ndMin":17,"ndMax":30,"moedas":{"gp":"12d6*1000","pp":"8d6*1000"},"linhas":[{"min":1,"max":2},{"min":3,"max":5,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"C","qtd":"1d8"}]},{"min":6,"max":8,"arte":{"valor":2500,"qtd":"1d10"},"magicos":[{"tabela":"C","qtd":"1d8"}]},{"min":9,"max":11,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"C","qtd":"1d8"}]},{"min":12,"max":14,"gemas":{"valor":5000,"qtd":"1d8"},"magicos":[{"tabela":"C","qtd":"1d8"}]},{"min":15,"max":22,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"D","qtd":"1d6"}]},{"min":23,"max":30,"arte":{"valor":2500,"qtd":"1d10"},"magicos":[{"tabela":"D","qtd":"1d6"}]},{"min":31,"max":38,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"D","qtd":"1d6"}]},{"min":39,"max":46,"gemas":{"valor":5000,"qtd":"1d8"},"magicos":[{"tabela":"D","qtd":"1d6"}]},{"min":47,"max":52,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"E","qtd":"1d6"}]},{"min":53,"max":58,"arte":{"valor":2500,"qtd":"1d10"},"magicos":[{"tabela":"E","qtd":"1d6"}]},{"min":59,"max":63,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"E","qtd":"1d6"}]},{"min":64,"max":68,"gemas":{"valor":5000,"qtd":"1d8"},"magicos":[{"tabela":"E","qtd":"1d6"}]},{"min":69,"max":69,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":70,"max":70,"arte":{"valor":7500,"qtd":"1d10"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":71,"max":71,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":72,"max":72,"gemas":{"valor":5000,"qtd":"1d8"},"magicos":[{"tabela":"G","qtd":"1d4"}]},{"min":73,"max":74,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":75,"max":76,"arte":{"valor":2500,"qtd":"1d10"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":77,"max":78,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":79,"max":80,"gemas":{"valor":5000,"qtd":"1d8"},"magicos":[{"tabela":"H","qtd":"1d4"}]},{"min":81,"max":85,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"I","qtd":"1d4"}]},{"min":86,"max":90,"arte":{"valor":2500,"qtd":"1d10"},"magicos":[{"tabela":"I","qtd":"1d4"}]},{"min":91,"max":95,"arte":{"valor":7500,"qtd":"1d4"},"magicos":[{"tabela":"I","qtd":"1d4"}]},{"min":96,"max":100,"gemas":{"valor":1000,"qtd":"3d6"},"magicos":[{"tabela":"I","qtd":"1d4"}]}]}];
export const ITENS_MAGICOS_POR_TABELA = {
 "A": [
  {
   "min": 1,
   "max": 50,
   "id": "pocaoDeCura"
  },
  {
   "min": 51,
   "max": 60,
   "id": "pergaminhoDeMagia",
   "circulo": 0
  },
  {
   "min": 61,
   "max": 70,
   "id": "pocaoDeEscalada"
  },
  {
   "min": 71,
   "max": 90,
   "id": "pergaminhoDeMagia",
   "circulo": 1
  },
  {
   "min": 91,
   "max": 94,
   "id": "pergaminhoDeMagia",
   "circulo": 2
  },
  {
   "min": 95,
   "max": 98,
   "id": "pocaoDeCuraMaior"
  },
  {
   "min": 99,
   "max": 99,
   "id": "bolsaDeConter"
  },
  {
   "min": 100,
   "max": 100,
   "id": null
  }
 ],
 "B": [
  {
   "min": 1,
   "max": 15,
   "id": "pocaoDeCuraMaior"
  },
  {
   "min": 16,
   "max": 22,
   "id": "pocaoDeSoproDeFogo"
  },
  {
   "min": 23,
   "max": 29,
   "id": {
    "ficha": "pocaoDeResistencia"
   }
  },
  {
   "min": 30,
   "max": 34,
   "id": "municaoMais1"
  },
  {
   "min": 35,
   "max": 39,
   "id": "pocaoDeAmizadeAnimal"
  },
  {
   "min": 40,
   "max": 44,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 45,
   "max": 49,
   "id": "pocaoDeCrescimento"
  },
  {
   "min": 50,
   "max": 54,
   "id": "pocaoDeRespiracaoAquatica"
  },
  {
   "min": 55,
   "max": 59,
   "id": "pergaminhoDeMagia",
   "circulo": 2
  },
  {
   "min": 60,
   "max": 64,
   "id": "pergaminhoDeMagia",
   "circulo": 3
  },
  {
   "min": 65,
   "max": 67,
   "id": "bolsaDeConter"
  },
  {
   "min": 68,
   "max": 70,
   "id": "unguentoRestaurador"
  },
  {
   "min": 71,
   "max": 73,
   "id": "oleoDeEscorregar"
  },
  {
   "min": 74,
   "max": 75,
   "id": "poDeDesaparecimento"
  },
  {
   "min": 76,
   "max": 77,
   "id": "poDeSecura"
  },
  {
   "min": 78,
   "max": 79,
   "id": "poDeEspirroETosse"
  },
  {
   "min": 80,
   "max": 81,
   "id": "gemaElemental"
  },
  {
   "min": 82,
   "max": 83,
   "id": "filtroDoAmor"
  },
  {
   "min": 84,
   "max": 84,
   "id": "jarraAlquimica"
  },
  {
   "min": 85,
   "max": 85,
   "id": "capuzDaRespiracaoAquatica"
  },
  {
   "min": 86,
   "max": 86,
   "id": "mantoDaArraia"
  },
  {
   "min": 87,
   "max": 87,
   "id": null
  },
  {
   "min": 88,
   "max": 88,
   "id": "oculosDeNoite"
  },
  {
   "min": 89,
   "max": 89,
   "id": "elmoDeCompreenderIdiomas"
  },
  {
   "min": 90,
   "max": 90,
   "id": "varaImovel"
  },
  {
   "min": 91,
   "max": 91,
   "id": "lanternaReveladora"
  },
  {
   "min": 92,
   "max": 92,
   "id": null
  },
  {
   "min": 93,
   "max": 93,
   "id": "armaduraDeMithral"
  },
  {
   "min": 94,
   "max": 94,
   "id": "pocaoDeVeneno"
  },
  {
   "min": 95,
   "max": 95,
   "id": "anelDeNatacao"
  },
  {
   "min": 96,
   "max": 96,
   "id": "mantoDeItensUteis"
  },
  {
   "min": 97,
   "max": 97,
   "id": "cordaDeEscalada"
  },
  {
   "min": 98,
   "max": 98,
   "id": null
  },
  {
   "min": 99,
   "max": 99,
   "id": "varinhaDeDeteccaoDeMagia"
  },
  {
   "min": 100,
   "max": 100,
   "id": "varinhaDeSegredos"
  }
 ],
 "C": [
  {
   "min": 1,
   "max": 15,
   "id": "pocaoDeCuraSuperior"
  },
  {
   "min": 16,
   "max": 22,
   "id": "pergaminhoDeMagia",
   "circulo": 4
  },
  {
   "min": 23,
   "max": 27,
   "id": "municaoMais2"
  },
  {
   "min": 28,
   "max": 32,
   "id": "pocaoDeClarividencia"
  },
  {
   "min": 33,
   "max": 37,
   "id": "pocaoDeDiminuicao"
  },
  {
   "min": 38,
   "max": 42,
   "id": "pocaoDeFormaGasosa"
  },
  {
   "min": 43,
   "max": 47,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 48,
   "max": 52,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 53,
   "max": 57,
   "id": "pocaoDeHeroismo"
  },
  {
   "min": 58,
   "max": 62,
   "id": "pocaoDeInvulnerabilidade"
  },
  {
   "min": 63,
   "max": 67,
   "id": "pocaoDeLeituraMental"
  },
  {
   "min": 68,
   "max": 72,
   "id": "pergaminhoDeMagia",
   "circulo": 5
  },
  {
   "min": 73,
   "max": 75,
   "id": "elixirDaSaude"
  },
  {
   "min": 76,
   "max": 78,
   "id": "oleoDeEtereidade"
  },
  {
   "min": 79,
   "max": 81,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 82,
   "max": 84,
   "id": "fichaDePenaDeQuaal"
  },
  {
   "min": 85,
   "max": 87,
   "id": null
  },
  {
   "min": 88,
   "max": 89,
   "id": null
  },
  {
   "min": 90,
   "max": 91,
   "id": null
  },
  {
   "min": 92,
   "max": 92,
   "id": null
  },
  {
   "min": 93,
   "max": 93,
   "id": "decantadorDeAguaInfinita"
  },
  {
   "min": 94,
   "max": 94,
   "id": "olhosDeVisaoMinuciosa"
  },
  {
   "min": 95,
   "max": 95,
   "id": null
  },
  {
   "min": 96,
   "max": 96,
   "id": "mochilaPraticaDeHeward"
  },
  {
   "min": 97,
   "max": 97,
   "id": null
  },
  {
   "min": 98,
   "max": 98,
   "id": "colarDeBolasDeFogo"
  },
  {
   "min": 99,
   "max": 99,
   "id": "periaptoDaSaude"
  },
  {
   "min": 100,
   "max": 100,
   "id": null
  }
 ],
 "D": [
  {
   "min": 1,
   "max": 20,
   "id": "pocaoDeCuraSuprema"
  },
  {
   "min": 21,
   "max": 30,
   "id": "pocaoDeInvisibilidade"
  },
  {
   "min": 31,
   "max": 40,
   "id": "pocaoDeVelocidade"
  },
  {
   "min": 41,
   "max": 50,
   "id": "pergaminhoDeMagia",
   "circulo": 6
  },
  {
   "min": 51,
   "max": 57,
   "id": "pergaminhoDeMagia",
   "circulo": 7
  },
  {
   "min": 58,
   "max": 62,
   "id": "municaoMais3"
  },
  {
   "min": 63,
   "max": 67,
   "id": "oleoDeAfiar"
  },
  {
   "min": 68,
   "max": 72,
   "id": "pocaoDeVoo"
  },
  {
   "min": 73,
   "max": 77,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 78,
   "max": 82,
   "id": "pocaoDeLongevidade"
  },
  {
   "min": 83,
   "max": 87,
   "id": "pocaoDeVitalidade"
  },
  {
   "min": 88,
   "max": 92,
   "id": "pergaminhoDeMagia",
   "circulo": 8
  },
  {
   "min": 93,
   "max": 95,
   "id": null
  },
  {
   "min": 96,
   "max": 98,
   "id": null
  },
  {
   "min": 99,
   "max": 99,
   "id": null
  },
  {
   "min": 100,
   "max": 100,
   "id": "buracoPortatil"
  }
 ],
 "E": [
  {
   "min": 1,
   "max": 30,
   "id": "pergaminhoDeMagia",
   "circulo": 8
  },
  {
   "min": 31,
   "max": 55,
   "id": "pocaoDeForcaDeGigante"
  },
  {
   "min": 56,
   "max": 70,
   "id": "pocaoDeCuraSuprema"
  },
  {
   "min": 71,
   "max": 85,
   "id": "pergaminhoDeMagia",
   "circulo": 9
  },
  {
   "min": 86,
   "max": 93,
   "id": "solventeUniversal"
  },
  {
   "min": 94,
   "max": 98,
   "id": "flechaAssassina"
  },
  {
   "min": 99,
   "max": 100,
   "id": "colaSoberana"
  }
 ],
 "F": [
  {
   "min": 1,
   "max": 15,
   "id": {
    "ficha": "arma",
    "n": 1
   }
  },
  {
   "min": 16,
   "max": 18,
   "id": "escudoMais1"
  },
  {
   "min": 19,
   "max": 21,
   "id": "escudoSentinela"
  },
  {
   "min": 22,
   "max": 23,
   "id": "amuletoContraDeteccao"
  },
  {
   "min": 24,
   "max": 25,
   "id": "botasElficas"
  },
  {
   "min": 26,
   "max": 27,
   "id": "botasDeMarchaESalto"
  },
  {
   "min": 28,
   "max": 29,
   "id": "braceletesDeArqueiro"
  },
  {
   "min": 30,
   "max": 31,
   "id": "brocheDeEscudo"
  },
  {
   "min": 32,
   "max": 33,
   "id": "vassouraVoadora"
  },
  {
   "min": 34,
   "max": 35,
   "id": "mantoElfico"
  },
  {
   "min": 36,
   "max": 37,
   "id": "mantoDeProtecao"
  },
  {
   "min": 38,
   "max": 39,
   "id": "manoplasDeForcaDeOgro"
  },
  {
   "min": 40,
   "max": 41,
   "id": "chapeuDeDisfarce"
  },
  {
   "min": 42,
   "max": 43,
   "id": "azagaiaDoRaio"
  },
  {
   "min": 44,
   "max": 45,
   "id": "perolaDoPoder"
  },
  {
   "min": 46,
   "max": 47,
   "id": "cetroDoGuardiaoDoPacto"
  },
  {
   "min": 48,
   "max": 49,
   "id": "chinelosDeEscalarParedes"
  },
  {
   "min": 50,
   "max": 51,
   "id": null
  },
  {
   "min": 52,
   "max": 53,
   "id": "cajadoDaSerpente"
  },
  {
   "min": 54,
   "max": 55,
   "id": null
  },
  {
   "min": 56,
   "max": 57,
   "id": "tridenteDoComando"
  },
  {
   "min": 58,
   "max": 59,
   "id": "varinhaDeMisseisMagicos"
  },
  {
   "min": 60,
   "max": 61,
   "id": "varinhaDoMagoDeGuerra"
  },
  {
   "min": 62,
   "max": 63,
   "id": "varinhaDeTeia"
  },
  {
   "min": 64,
   "max": 65,
   "id": "armaDeAlerta"
  },
  {
   "min": 66,
   "max": 66,
   "id": "armaduraAdamantina"
  },
  {
   "min": 67,
   "max": 67,
   "id": "armaduraAdamantina"
  },
  {
   "min": 68,
   "max": 68,
   "id": "armaduraAdamantina"
  },
  {
   "min": 69,
   "max": 69,
   "id": null
  },
  {
   "min": 70,
   "max": 70,
   "id": null
  },
  {
   "min": 71,
   "max": 71,
   "id": null
  },
  {
   "min": 72,
   "max": 72,
   "id": "botasDasTerrasInvernais"
  },
  {
   "min": 73,
   "max": 73,
   "id": "diademaDaExplosao"
  },
  {
   "min": 74,
   "max": 74,
   "id": "baralhoDeIlusoes"
  },
  {
   "min": 75,
   "max": 75,
   "id": null
  },
  {
   "min": 76,
   "max": 76,
   "id": "olhosDoEncanto"
  },
  {
   "min": 77,
   "max": 77,
   "id": "olhosDaAguia"
  },
  {
   "min": 78,
   "max": 78,
   "id": "figuraDePoderMaravilhoso"
  },
  {
   "min": 79,
   "max": 79,
   "id": "gemaDeBrilho"
  },
  {
   "min": 80,
   "max": 80,
   "id": "luvasDeAgarrarProjetis"
  },
  {
   "min": 81,
   "max": 81,
   "id": "luvasDeNadarEEscalar"
  },
  {
   "min": 82,
   "max": 82,
   "id": "luvasDeLadrao"
  },
  {
   "min": 83,
   "max": 83,
   "id": "faixaDeIntelecto"
  },
  {
   "min": 84,
   "max": 84,
   "id": "elmoDeTelepatia"
  },
  {
   "min": 85,
   "max": 85,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 86,
   "max": 86,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 87,
   "max": 87,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 88,
   "max": 88,
   "id": "medalhaoDosPensamentos"
  },
  {
   "min": 89,
   "max": 89,
   "id": "amuletoDeAdaptacao"
  },
  {
   "min": 90,
   "max": 90,
   "id": "amuletoDeFecharFeridas"
  },
  {
   "min": 91,
   "max": 91,
   "id": "gaitasDoAssombro"
  },
  {
   "min": 92,
   "max": 92,
   "id": "gaitasDosEsgotos"
  },
  {
   "min": 93,
   "max": 93,
   "id": "anelDeSalto"
  },
  {
   "min": 94,
   "max": 94,
   "id": "anelDeEscudoMental"
  },
  {
   "min": 95,
   "max": 95,
   "id": "anelDeCalor"
  },
  {
   "min": 96,
   "max": 96,
   "id": "anelDeAndarSobreAgua"
  },
  {
   "min": 97,
   "max": 97,
   "id": "aljavaEficiente"
  },
  {
   "min": 98,
   "max": 98,
   "id": "pedraDaBoaSorte"
  },
  {
   "min": 99,
   "max": 99,
   "id": "lequeDoVento"
  },
  {
   "min": 100,
   "max": 100,
   "id": "botasAladas"
  }
 ],
 "G": [
  {
   "min": 1,
   "max": 11,
   "id": {
    "ficha": "arma",
    "n": 2
   }
  },
  {
   "min": 12,
   "max": 14,
   "id": "figuraDePoderMaravilhoso"
  },
  {
   "min": 15,
   "max": 15,
   "id": "armaduraAdamantina"
  },
  {
   "min": 16,
   "max": 16,
   "id": "armaduraAdamantina"
  },
  {
   "min": 17,
   "max": 17,
   "id": "amuletoDeSaude"
  },
  {
   "min": 18,
   "max": 18,
   "id": {
    "ficha": "vulnerabilidade"
   }
  },
  {
   "min": 19,
   "max": 19,
   "id": "escudoCaptador"
  },
  {
   "min": 20,
   "max": 20,
   "id": "cinturaoDosAnoes"
  },
  {
   "min": 21,
   "max": 21,
   "id": "cintoDoGiganteDaColina"
  },
  {
   "min": 22,
   "max": 22,
   "id": "machadoBerserker"
  },
  {
   "min": 23,
   "max": 23,
   "id": "botasDeLevitacao"
  },
  {
   "min": 24,
   "max": 24,
   "id": "botasDeVelocidade"
  },
  {
   "min": 25,
   "max": 25,
   "id": null
  },
  {
   "min": 26,
   "max": 26,
   "id": "braceletesDeDefesa"
  },
  {
   "min": 27,
   "max": 27,
   "id": null
  },
  {
   "min": 28,
   "max": 28,
   "id": "capaDoCharlatao"
  },
  {
   "min": 29,
   "max": 29,
   "id": null
  },
  {
   "min": 30,
   "max": 30,
   "id": "cotaDeMalhaMais1"
  },
  {
   "min": 31,
   "max": 31,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "cotaDeMalha"
   }
  },
  {
   "min": 32,
   "max": 32,
   "id": "camisaoDeMalhaMais1"
  },
  {
   "min": 33,
   "max": 33,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "camisaoDeMalha"
   }
  },
  {
   "min": 34,
   "max": 34,
   "id": "mantoDeDeslocamento"
  },
  {
   "min": 35,
   "max": 35,
   "id": "mantoDoMorcego"
  },
  {
   "min": 36,
   "max": 36,
   "id": null
  },
  {
   "min": 37,
   "max": 37,
   "id": null
  },
  {
   "min": 38,
   "max": 38,
   "id": "adagaDeVeneno"
  },
  {
   "min": 39,
   "max": 39,
   "id": "algemasDimensionais"
  },
  {
   "min": 40,
   "max": 40,
   "id": "matadoraDeDragoes"
  },
  {
   "min": 41,
   "max": 41,
   "id": "malhaElfica"
  },
  {
   "min": 42,
   "max": 42,
   "id": "linguaDeFogo"
  },
  {
   "min": 43,
   "max": 43,
   "id": "gemaDeVidencia"
  },
  {
   "min": 44,
   "max": 44,
   "id": "matadoraDeGigantes"
  },
  {
   "min": 45,
   "max": 45,
   "id": "couroGlamourizado"
  },
  {
   "min": 46,
   "max": 46,
   "id": null
  },
  {
   "min": 47,
   "max": 47,
   "id": "trompaDeExplosao"
  },
  {
   "min": 48,
   "max": 48,
   "id": {
    "ficha": "umDe",
    "ids": [
     "trompaDeValhalla",
     "trompaDeValhalla"
    ]
   }
  },
  {
   "min": 49,
   "max": 49,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 50,
   "max": 50,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 51,
   "max": 51,
   "id": "pedraIoun"
  },
  {
   "min": 52,
   "max": 52,
   "id": "pedraIoun"
  },
  {
   "min": 53,
   "max": 53,
   "id": "pedraIoun"
  },
  {
   "min": 54,
   "max": 54,
   "id": "pedraIoun"
  },
  {
   "min": 55,
   "max": 55,
   "id": "bracadeirasDeBilarro"
  },
  {
   "min": 56,
   "max": 56,
   "id": "couroMais1"
  },
  {
   "min": 57,
   "max": 57,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "couro"
   }
  },
  {
   "min": 58,
   "max": 58,
   "id": "macaDaDisrupcao"
  },
  {
   "min": 59,
   "max": 59,
   "id": "macaDoGolpe"
  },
  {
   "min": 60,
   "max": 60,
   "id": "macaDoTerror"
  },
  {
   "min": 61,
   "max": 61,
   "id": "mantoDeResistenciaAMagia"
  },
  {
   "min": 62,
   "max": 62,
   "id": "colarDeContasDeOracao"
  },
  {
   "min": 63,
   "max": 63,
   "id": "amuletoContraVeneno"
  },
  {
   "min": 64,
   "max": 64,
   "id": null
  },
  {
   "min": 65,
   "max": 65,
   "id": "anelDeEvasao"
  },
  {
   "min": 66,
   "max": 66,
   "id": "anelDeQuedaSuave"
  },
  {
   "min": 67,
   "max": 67,
   "id": "anelDeAcaoLivre"
  },
  {
   "min": 68,
   "max": 68,
   "id": "anelDeProtecao"
  },
  {
   "min": 69,
   "max": 69,
   "id": {
    "ficha": "anelDeResistencia"
   }
  },
  {
   "min": 70,
   "max": 70,
   "id": "anelDeArmazenarMagia"
  },
  {
   "min": 71,
   "max": 71,
   "id": "anelDoAriete"
  },
  {
   "min": 72,
   "max": 72,
   "id": "anelDeVisaoDeRaioX"
  },
  {
   "min": 73,
   "max": 73,
   "id": "mantoDeOlhos"
  },
  {
   "min": 74,
   "max": 74,
   "id": "cetroDoDominio"
  },
  {
   "min": 75,
   "max": 75,
   "id": "cetroDoGuardiaoDoPacto"
  },
  {
   "min": 76,
   "max": 76,
   "id": "cordaDeEnredar"
  },
  {
   "min": 77,
   "max": 77,
   "id": "bruneaMais1"
  },
  {
   "min": 78,
   "max": 78,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "brunea"
   }
  },
  {
   "min": 79,
   "max": 79,
   "id": "escudoMais2"
  },
  {
   "min": 80,
   "max": 80,
   "id": "escudoAtraidor"
  },
  {
   "min": 81,
   "max": 81,
   "id": "cajadoDoEncanto"
  },
  {
   "min": 82,
   "max": 82,
   "id": "cajadoDeCura"
  },
  {
   "min": 83,
   "max": 83,
   "id": "cajadoDeEnxame"
  },
  {
   "min": 84,
   "max": 84,
   "id": "cajadoDasFlorestas"
  },
  {
   "min": 85,
   "max": 85,
   "id": "cajadoDeMurchar"
  },
  {
   "min": 86,
   "max": 86,
   "id": "pedraDeControlarElemental"
  },
  {
   "min": 87,
   "max": 87,
   "id": "espadaSolar"
  },
  {
   "min": 88,
   "max": 88,
   "id": "espadaDeRoubarVida"
  },
  {
   "min": 89,
   "max": 89,
   "id": "espadaDeFerir"
  },
  {
   "min": 90,
   "max": 90,
   "id": null
  },
  {
   "min": 91,
   "max": 91,
   "id": null
  },
  {
   "min": 92,
   "max": 92,
   "id": "varinhaDeAtadura"
  },
  {
   "min": 93,
   "max": 93,
   "id": "varinhaDeDeteccaoDeInimigos"
  },
  {
   "min": 94,
   "max": 94,
   "id": "varinhaDeMedo"
  },
  {
   "min": 95,
   "max": 95,
   "id": "varinhaDeBolaDeFogo"
  },
  {
   "min": 96,
   "max": 96,
   "id": "varinhaDeRaios"
  },
  {
   "min": 97,
   "max": 97,
   "id": "varinhaDeParalisia"
  },
  {
   "min": 98,
   "max": 98,
   "id": "varinhaDoMagoDeGuerra"
  },
  {
   "min": 99,
   "max": 99,
   "id": "varinhaDasMaravilhas"
  },
  {
   "min": 100,
   "max": 100,
   "id": "asasDeVoo"
  }
 ],
 "H": [
  {
   "min": 1,
   "max": 10,
   "id": {
    "ficha": "arma",
    "n": 3
   }
  },
  {
   "min": 11,
   "max": 12,
   "id": null
  },
  {
   "min": 13,
   "max": 14,
   "id": "tapeteVoador"
  },
  {
   "min": 15,
   "max": 16,
   "id": null
  },
  {
   "min": 17,
   "max": 18,
   "id": "anelDeRegeneracao"
  },
  {
   "min": 19,
   "max": 20,
   "id": "anelDeEstrelasCadentes"
  },
  {
   "min": 21,
   "max": 22,
   "id": "anelDeTelecinesia"
  },
  {
   "min": 23,
   "max": 24,
   "id": "mantoDeCoresCintilantes"
  },
  {
   "min": 25,
   "max": 26,
   "id": "mantoDasEstrelas"
  },
  {
   "min": 27,
   "max": 28,
   "id": "cetroDeAbsorcao"
  },
  {
   "min": 29,
   "max": 30,
   "id": "cetroDeAlerta"
  },
  {
   "min": 31,
   "max": 32,
   "id": "cetroDeSeguranca"
  },
  {
   "min": 33,
   "max": 34,
   "id": "cetroDoGuardiaoDoPacto"
  },
  {
   "min": 35,
   "max": 36,
   "id": null
  },
  {
   "min": 37,
   "max": 38,
   "id": "escudoMais3"
  },
  {
   "min": 39,
   "max": 40,
   "id": "cajadoDeFogo"
  },
  {
   "min": 41,
   "max": 42,
   "id": "cajadoDeGelo"
  },
  {
   "min": 43,
   "max": 44,
   "id": "cajadoDoPoder"
  },
  {
   "min": 45,
   "max": 46,
   "id": "cajadoDoGolpe"
  },
  {
   "min": 47,
   "max": 48,
   "id": "cajadoDoTrovaoERaio"
  },
  {
   "min": 49,
   "max": 50,
   "id": "espadaDeGume"
  },
  {
   "min": 51,
   "max": 52,
   "id": "varinhaDePolimorfia"
  },
  {
   "min": 53,
   "max": 54,
   "id": "varinhaDoMagoDeGuerra"
  },
  {
   "min": 55,
   "max": 55,
   "id": "armaduraAdamantina"
  },
  {
   "min": 56,
   "max": 56,
   "id": "armaduraAdamantina"
  },
  {
   "min": 57,
   "max": 57,
   "id": "escudoAnimado"
  },
  {
   "min": 58,
   "max": 58,
   "id": "cintoDoGiganteDoFogo"
  },
  {
   "min": 59,
   "max": 59,
   "id": {
    "ficha": "umDe",
    "ids": [
     "cintoDoGiganteDoGelo",
     "cintoDoGiganteDePedra"
    ]
   }
  },
  {
   "min": 60,
   "max": 60,
   "id": "peitoralMais1"
  },
  {
   "min": 61,
   "max": 61,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "peitoral"
   }
  },
  {
   "min": 62,
   "max": 62,
   "id": null
  },
  {
   "min": 63,
   "max": 63,
   "id": "cotaDeMalhaMais2"
  },
  {
   "min": 64,
   "max": 64,
   "id": "camisaoDeMalhaMais2"
  },
  {
   "min": 65,
   "max": 65,
   "id": "mantoDaAracnidea"
  },
  {
   "min": 66,
   "max": 66,
   "id": "espadaDanca"
  },
  {
   "min": 67,
   "max": 67,
   "id": "armaduraDeDemonio"
  },
  {
   "min": 68,
   "max": 68,
   "id": {
    "ficha": "escamas"
   }
  },
  {
   "min": 69,
   "max": 69,
   "id": "placasAnas"
  },
  {
   "min": 70,
   "max": 70,
   "id": "arremessadorAnao"
  },
  {
   "min": 71,
   "max": 71,
   "id": null
  },
  {
   "min": 72,
   "max": 72,
   "id": "figuraDePoderMaravilhoso"
  },
  {
   "min": 73,
   "max": 73,
   "id": "marcaDeGelo"
  },
  {
   "min": 74,
   "max": 74,
   "id": "elmoDeBrilho"
  },
  {
   "min": 75,
   "max": 75,
   "id": "trompaDeValhalla"
  },
  {
   "min": 76,
   "max": 76,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 77,
   "max": 77,
   "id": "pedraIoun"
  },
  {
   "min": 78,
   "max": 78,
   "id": "pedraIoun"
  },
  {
   "min": 79,
   "max": 79,
   "id": "pedraIoun"
  },
  {
   "min": 80,
   "max": 80,
   "id": "pedraIoun"
  },
  {
   "min": 81,
   "max": 81,
   "id": "pedraIoun"
  },
  {
   "min": 82,
   "max": 82,
   "id": "pedraIoun"
  },
  {
   "min": 83,
   "max": 83,
   "id": "pedraIoun"
  },
  {
   "min": 84,
   "max": 84,
   "id": "couroMais2"
  },
  {
   "min": 85,
   "max": 85,
   "id": "manualDaSaude"
  },
  {
   "min": 86,
   "max": 86,
   "id": "manualDeExercicioRapido"
  },
  {
   "min": 87,
   "max": 87,
   "id": "manualDoGolemDeCarne"
  },
  {
   "min": 88,
   "max": 88,
   "id": "manualDaAgilidade"
  },
  {
   "min": 89,
   "max": 89,
   "id": "espelhoDeAprisionarVida"
  },
  {
   "min": 90,
   "max": 90,
   "id": "ladraDeNoveVidas"
  },
  {
   "min": 91,
   "max": 91,
   "id": "arcoJuramentado"
  },
  {
   "min": 92,
   "max": 92,
   "id": "bruneaMais2"
  },
  {
   "min": 93,
   "max": 93,
   "id": "escudoGuardaMagia"
  },
  {
   "min": 94,
   "max": 94,
   "id": "brigantinaMais1"
  },
  {
   "min": 95,
   "max": 95,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "brigantina"
   }
  },
  {
   "min": 96,
   "max": 96,
   "id": "couroBatidoMais1"
  },
  {
   "min": 97,
   "max": 97,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "couroBatido"
   }
  },
  {
   "min": 98,
   "max": 98,
   "id": "tomoDoPensamentoClaro"
  },
  {
   "min": 99,
   "max": 99,
   "id": "tomoDaLideranca"
  },
  {
   "min": 100,
   "max": 100,
   "id": "tomoDoEntendimento"
  }
 ],
 "I": [
  {
   "min": 1,
   "max": 5,
   "id": "defensora"
  },
  {
   "min": 6,
   "max": 10,
   "id": null
  },
  {
   "min": 11,
   "max": 15,
   "id": "espadaDaSorte"
  },
  {
   "min": 16,
   "max": 20,
   "id": null
  },
  {
   "min": 21,
   "max": 23,
   "id": "vingadoraSagrada"
  },
  {
   "min": 24,
   "max": 26,
   "id": null
  },
  {
   "min": 27,
   "max": 29,
   "id": "anelDeInvisibilidade"
  },
  {
   "min": 30,
   "max": 32,
   "id": "anelDeReflexao"
  },
  {
   "min": 33,
   "max": 35,
   "id": "cetroDoPoderioSenhorial"
  },
  {
   "min": 36,
   "max": 38,
   "id": "cajadoDoMagi"
  },
  {
   "min": 39,
   "max": 41,
   "id": "espadaVorpal"
  },
  {
   "min": 42,
   "max": 43,
   "id": "cintoDoGiganteDasNuvens"
  },
  {
   "min": 44,
   "max": 45,
   "id": "peitoralMais2"
  },
  {
   "min": 46,
   "max": 47,
   "id": "cotaDeMalhaMais3"
  },
  {
   "min": 48,
   "max": 49,
   "id": "camisaoDeMalhaMais3"
  },
  {
   "min": 50,
   "max": 51,
   "id": null
  },
  {
   "min": 52,
   "max": 53,
   "id": null
  },
  {
   "min": 54,
   "max": 55,
   "id": "meiaArmaduraMais1"
  },
  {
   "min": 56,
   "max": 57,
   "id": null
  },
  {
   "min": 58,
   "max": 59,
   "id": "couroMais3"
  },
  {
   "min": 60,
   "max": 61,
   "id": "placasMais1"
  },
  {
   "min": 62,
   "max": 63,
   "id": "mantoDoArquimago"
  },
  {
   "min": 64,
   "max": 65,
   "id": "cetroDaRessurreicao"
  },
  {
   "min": 66,
   "max": 67,
   "id": "bruneaMais1"
  },
  {
   "min": 68,
   "max": 69,
   "id": "escaravelhoDeProtecao"
  },
  {
   "min": 70,
   "max": 71,
   "id": "brigantinaMais2"
  },
  {
   "min": 72,
   "max": 73,
   "id": "couroBatidoMais2"
  },
  {
   "min": 74,
   "max": 75,
   "id": "pocoDeMuitosMundos"
  },
  {
   "min": 76,
   "max": 76,
   "id": null
  },
  {
   "min": 77,
   "max": 77,
   "id": null
  },
  {
   "min": 78,
   "max": 78,
   "id": "armaduraDeInvulnerabilidade"
  },
  {
   "min": 79,
   "max": 79,
   "id": "cintoDoGiganteDasTempestades"
  },
  {
   "min": 80,
   "max": 80,
   "id": null
  },
  {
   "min": 81,
   "max": 81,
   "id": null
  },
  {
   "min": 82,
   "max": 82,
   "id": null
  },
  {
   "min": 83,
   "max": 83,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "meiaArmadura"
   }
  },
  {
   "min": 84,
   "max": 84,
   "id": "trompaDeValhalla"
  },
  {
   "min": 85,
   "max": 85,
   "id": "instrumentoDosBardos"
  },
  {
   "min": 86,
   "max": 86,
   "id": "pedraIoun"
  },
  {
   "min": 87,
   "max": 87,
   "id": "pedraIoun"
  },
  {
   "min": 88,
   "max": 88,
   "id": "pedraIoun"
  },
  {
   "min": 89,
   "max": 89,
   "id": "placasDaEtereidade"
  },
  {
   "min": 90,
   "max": 90,
   "id": {
    "ficha": "armaduraDeResistencia",
    "base": "placas"
   }
  },
  {
   "min": 91,
   "max": 91,
   "id": null
  },
  {
   "min": 92,
   "max": 92,
   "id": null
  },
  {
   "min": 93,
   "max": 93,
   "id": "anelDeComandoDoFogo"
  },
  {
   "min": 94,
   "max": 94,
   "id": "anelDeTresDesejos"
  },
  {
   "min": 95,
   "max": 95,
   "id": null
  },
  {
   "min": 96,
   "max": 96,
   "id": null
  },
  {
   "min": 97,
   "max": 97,
   "id": "talismaDoBemSupremo"
  },
  {
   "min": 98,
   "max": 98,
   "id": null
  },
  {
   "min": 99,
   "max": 99,
   "id": "talismaDoMalSupremo"
  },
  {
   "min": 100,
   "max": 100,
   "id": null
  }
 ]
};
