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

// ROTA 1: Playlist M3U8 (Para links piratas comuns)
app.get('/playlist.m3u8', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(404).send("#EXTM3U");
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(`#EXTM3U\n#EXTINF:-1, Stream\n${url}`);
});

app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque: catalogo[0] 
    });
});

app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    res.render('pre', { item: catalogo[id] });
});

// ROTA PLAYER INTELIGENTE
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    
    // ESTRATÉGIA "FILMES P K":
    // 1. Se for Google Drive, manda o link ORIGINAL. O Rave ama Google Drive.
    // 2. Se for outro, tenta mascarar com M3U8.
    
    let videoUrlFinal = video;
    let isDrive = video.includes("drive.google.com");

    if (!isDrive) {
        // Se não for drive, tentamos a playlist para evitar o corte de 5min
        videoUrlFinal = `${protocol}://${host}/playlist.m3u8?url=${encodeURIComponent(video)}`;
    }

    // Link profundo para o Rave (Remove https://)
    const raveLink = `rave://${videoUrlFinal.replace(/^https?:\/\//, '')}`;

    res.render('player', { 
        video: videoUrlFinal, // URL processada
        linkOriginal: video,  // URL crua (backup)
        titulo, 
        capa, 
        raveLink,
        isDrive
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;