const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Função segura para carregar o banco
function carregarBanco() {
    try {
        const caminhoBanco = path.join(__dirname, 'banco.json');
        if (!fs.existsSync(caminhoBanco)) return []; // Retorna lista vazia se falhar
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler banco:", err);
        return [];
    }
}

// ROTA HOME
app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo || catalogo.length === 0) return res.send("<h1>Aguardando filmes no banco.json...</h1>");
    
    // Adiciona índice original para links funcionarem
    catalogo.forEach((item, index) => item.originalIndex = index);

    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

// ROTA DETALHES
app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    
    // Proteção contra ID inválido (Evita erro 500)
    if (!catalogo || !catalogo[id]) {
        return res.redirect('/');
    }

    res.render('pre', { item: catalogo[id] });
});

// ROTA DE SEGURANÇA PARA /ASSISTIR
// Se algum link antigo tentar abrir o player, redireciona direto para o vídeo
app.get('/assistir', (req, res) => {
    const { video } = req.query;
    if (video) {
        return res.redirect(video);
    }
    res.redirect('/');
});

// Inicialização
if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;