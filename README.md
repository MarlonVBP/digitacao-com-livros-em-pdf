# 📖 PDF Typer Reader Pro

Transforme qualquer livro ou documento num treino interativo de digitação! O **PDF Typer Reader Pro** é uma aplicação web construída para ajudar os utilizadores a melhorarem a sua velocidade de digitação (WPM) e precisão, enquanto leem os seus livros favoritos em PDF.

Ao contrário de plataformas comuns, esta aplicação utiliza Inteligência Artificial (OCR) para ler **qualquer** ficheiro PDF, convertendo as páginas em texto limpo e estruturado.

---

## ✨ Funcionalidades Principais

* 🧠 **Motor OCR Integrado (IA):** Graças ao *Tesseract.js*, a aplicação consegue ler o texto mesmo em PDFs digitalizados como imagens ou com proteção contra cópia.
* ⌨️ **Teclado Virtual Inteligente:** Um teclado no ecrã que ilumina a próxima tecla a ser premida, com suporte avançado para a acentuação portuguesa (Shift, Til, Agudo/Crase).
* 📱 **Suporte Total para Telemóvel:** Pratique em qualquer lugar! A interface adapta-se aos ecrãs pequenos e abre automaticamente o teclado nativo do dispositivo.
* 🎨 **Temas Personalizáveis:** Escolha entre 5 esquemas de cores guardados automaticamente (Slate, Sakura, Ocean, Hacker e Coffee) para maior conforto visual.
* ⚙️ **Filtros de Complexidade:** Configure a dificuldade do seu treino antes de começar:
* Ignorar ou manter acentos e pontuação.
* Remover números.
* Validação restrita de Maiúsculas/Minúsculas (*Case Sensitive*).


* ⚡ **Textos Rápidos (Treino Expresso):** Não tem um PDF à mão? Utilize os textos pré-definidos na aplicação (História, Técnico ou Motivacional) para um aquecimento rápido.
* 📊 **Estatísticas em Tempo Real:** Acompanhe a sua Velocidade (Palavras Por Minuto - WPM) e Precisão (%) de forma dinâmica.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído sem recorrer a frameworks pesados de frontend (como React ou Vue), garantindo leveza e facilidade de manutenção através de JavaScript puro (Vanilla).

* **Frontend:** HTML5, CSS3, Vanilla JavaScript.
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (via CDN).
* **Processamento de PDF:** [PDF.js](https://mozilla.github.io/pdf.js/) (Biblioteca oficial da Mozilla).
* **Reconhecimento Ótico de Caracteres:** [Tesseract.js](https://tesseract.projectnaptha.com/) (Motor OCR).
* **Ícones:** FontAwesome.

---

## 📁 Estrutura do Projeto

O código está organizado da seguinte forma para facilitar a leitura e escalabilidade:

```text
📦 pdf-typer-reader-pro
 ┣ 📂 css
 ┃ ┗ 📜 style.css       # Variáveis de temas, animações e estilos do teclado virtual
 ┣ 📂 js
 ┃ ┗ 📜 app.js          # Lógica do OCR, motor de digitação e interações da UI
 ┗ 📜 index.html        # Estrutura base da aplicação e interface

```

---

## 🚀 Como Executar o Projeto Localmente

Como a aplicação é executada inteiramente do lado do cliente (*Client-Side*), não necessita de configurar uma base de dados ou um servidor complexo.

1. Faça o clone deste repositório:
```bash
git clone https://github.com/marlonvbp/digitacao-com-livros-em-pdf.git

```


2. Navegue até à pasta do projeto:
```bash
cd digitacao-com-livros-em-pdf

```


3. Abra o ficheiro `index.html` diretamente no seu navegador web preferido (Chrome, Firefox, Edge).
> **Dica:** Para uma melhor experiência de desenvolvimento, recomendamos a utilização da extensão **Live Server** no Visual Studio Code.



---

## 💡 Dicas de Utilização

* **Pular Linhas:** Ao final de cada linha de texto, verá o símbolo `↵`. Isto significa que deve premir obrigatoriamente a tecla **Enter** para continuar.
* **Páginas Extensas:** Se cometeu muitos erros no início ou quer saltar o índice do livro, utilize o botão **"Pular"** no menu superior para ir para a página seguinte.
* **Desempenho (OCR):** A primeira vez que carregar uma página, o Tesseract irá descarregar um pequeno pacote do idioma (cerca de 2MB). As páginas seguintes serão processadas de forma muito mais rápida.

---

## 📝 Licença

Este projeto está sob a licença [MIT](https://www.google.com/search?q=LICENSE). Sinta-se à vontade para o utilizar, modificar e partilhar!