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

// Função para ler o banco atualizado
function carregarBanco() {
    try {
        const data = fs.readFileSync('banco.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// --- ROTA 1: HOME ---
app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];
    const filmes = catalogo.filter(i => i.tipo === 'filme');
    const series = catalogo.filter(i => i.tipo === 'serie');

    // Passamos o catálogo inteiro também, se precisar buscar algo, mas mandamos os índices
    // Adicionamos o índice original ao objeto para facilitar o link
    catalogo.forEach((item, index) => item.originalIndex = index);

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque: catalogo.find(i => i.destaque) || catalogo[0]
    });
});

// --- ROTA 2: DETALHES (Séries/Filmes) ---
app.get('/detalhes', (req, res) => {
    const { id } = req.query; // Agora buscamos pelo ID
    const catalogo = carregarBanco();
    
    const item = catalogo[id];

    if (!item) return res.redirect('/');

    res.render('pre', { 
        item, // Manda o objeto COMPLETO (com temporadas) para a página
        ogTitle: item.titulo,
        ogImage: item.capa,
        ogVideo: item.link
    });
});

// --- ROTA 3: PLAYER ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;

    res.render('player', { 
        video, 
        titulo,
        capa,
        raveLink: `rave://https://rave.io/content?url=${encodeURIComponent(video)}`
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});