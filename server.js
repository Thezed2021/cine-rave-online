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

function carregarBanco() {
    try {
        const caminhoBanco = path.join(__dirname, 'banco.json');
        if (!fs.existsSync(caminhoBanco)) return null;
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) { return null; }
}

// --- ROTA 1: GERADOR DE PLAYLIST M3U8 (A SOLUÇÃO) ---
// Isso força o Rave a tratar o arquivo como streaming contínuo
app.get('/playlist.m3u8', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(404).send("#EXTM3U");

    // Cria uma playlist falsa apontando para o arquivo original
    const conteudoM3U8 = `#EXTM3U
#EXTINF:-1, Cine Rave Movie
${url}`;

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u8"');
    res.send(conteudoM3U8);
});

// --- ROTA 2: HOME ---
app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo) return res.send("Erro: banco.json");
    catalogo.forEach((item, index) => item.originalIndex = index);
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

// --- ROTA 3: DETALHES ---
app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    if (!catalogo || !catalogo[id]) return res.redirect('/');
    res.render('pre', { item: catalogo[id] });
});

// --- ROTA 4: ASSISTIR (PLAYER) ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Tenta pegar o domínio atual de forma segura
    let baseUrl = `https://${req.headers.host}`;
    if (!req.headers.host) baseUrl = "https://cine-rave.vercel.app"; // Fallback de segurança

    // Gera o link para nossa playlist mágica
    const m3u8Url = `${baseUrl}/playlist.m3u8?url=${encodeURIComponent(video)}`;
    
    // Link direto para o Rave (Deep Link)
    // Remove o https:// para o padrão do Rave
    const raveLink = `rave://${m3u8Url.replace(/^https?:\/\//, '')}`;

    res.render('player', { 
        video, // Link original
        titulo,
        capa,
        m3u8Url, // Link da playlist
        raveLink 
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;