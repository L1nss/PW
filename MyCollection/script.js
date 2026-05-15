const rs = require("readline-sync");
let atq = rs.question("Digite o valor de ataque de sua carta");
let vida = rs.question("Digite a vida de sua carta");
let aerTer = rs
  .question(
    'digite "aer" se seu personagem for aereo e "ter" se seu personagem for terrestre',
  )
  .replace(" ", "")
  .toLowerCase();
class cartaBasica {
  constructor(atq, vida, aerTer) {
    this.atq = atq;
    this.vida = vida;
    this.aerTer = aerTer;
  }
}

function criarcarta(atq, vida, aerTer) {
  let cartaCriada = new cartaBasica(atq, vida, aerTer);
  return cartaCriada;
}

console.log(criarcarta(atq, vida, aerTer));

//----------------------------------------------------//

function escudo(atq, vida) {
  let valorshield = (atq - vida) / 100;
  if (valorshield <= 0) {
    valorshield = 15;
    return valorshield;
  } else {
    return valorshield;
  }
}

console.log(escudo(atq, vida));
