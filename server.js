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

// Função para ler o banco
function carregarBanco() {
    try {
        const caminhoBanco = path.join(__dirname, 'banco.json');
        if (!fs.existsSync(caminhoBanco)) return null;
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) { return null; }
}

// --- ROTA M3U8 (A TENTATIVA DE BURLAR OS 5 MIN) ---
app.get('/playlist.m3u8', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(404).send("#EXTM3U");

    // Headers para evitar cache e forçar stream
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="video.m3u8"');

    const conteudo = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:-1, Cine Rave Video
${url}`;

    res.send(conteudo);
});

// --- ROTAS DE PÁGINAS ---
app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo) return res.send("Erro: banco.json não carregado.");
    
    catalogo.forEach((item, index) => item.originalIndex = index);
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    if (!catalogo || !catalogo[id]) return res.redirect('/');
    res.render('pre', { item: catalogo[id] });
});

app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Constrói a URL da playlist baseada no domínio atual
    const host = req.headers.host; 
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const m3u8Url = `${protocol}://${host}/playlist.m3u8?url=${encodeURIComponent(video)}`;
    
    // Link profundo para o Rave
    const raveLink = `rave://${host}/playlist.m3u8?url=${encodeURIComponent(video)}`;

    res.render('player', { 
        video, 
        titulo, 
        capa, 
        m3u8Url, 
        raveLink,
        urlAtual: `${protocol}://${host}${req.originalUrl}`
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;