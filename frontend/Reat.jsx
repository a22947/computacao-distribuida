
function mostrarMensagem() {
  const nome = document.getElementById("nome").value;
  const resultado = document.getElementById("resultado");

  if (nome === "") {
    resultado.innerText = "Por favor, digite o seu nome.";
  } else {
    resultado.innerText = "Olá, " + nome + "! Bem-vindo ao Frontend.";
  }
}
