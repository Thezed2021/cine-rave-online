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

// --- FUNÇÃO DE CARREGAMENTO ---
function carregarBanco() {
    try {
        const caminhoBanco = path.join(__dirname, 'banco.json');
        if (!fs.existsSync(caminhoBanco)) return null;
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
}

// --- ROTA DE REDIRECIONAMENTO (TRUQUE PRO RAVE) ---
app.get('/video-redirect', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("Sem URL");
    // Redireciona para o arquivo real
    res.redirect(url);
});

// --- ROTA 1: HOME ---
app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo) return res.send("<h1>Erro: banco.json não encontrado.</h1>");

    const filmes = catalogo.filter(i => i.tipo === 'filme');
    const series = catalogo.filter(i => i.tipo === 'serie');
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];

    // Salva índice original para linkar corretamente
    catalogo.forEach((item, index) => item.originalIndex = index);

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

// --- ROTA 2: DETALHES ---
app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    if (!catalogo || !catalogo[id]) return res.redirect('/');
    
    const item = catalogo[id];
    res.render('pre', { item });
});

// --- ROTA 3: PLAYER ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Gera link direto para o Rave abrir o arquivo
    const raveDirectLink = `rave://https://rave.io/content?url=${encodeURIComponent(video)}`;

    res.render('player', { 
        video, 
        titulo,
        capa,
        raveLink: raveDirectLink
    });
});

// Exporta para Vercel
if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;